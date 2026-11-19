import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Razorpay from "razorpay"

const rzpKeyId = (process.env.RAZORPAY_KEY_ID || "").trim()
const rzpKeySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim()
const hasLiveRazorpay =
  Boolean(rzpKeyId) &&
  Boolean(rzpKeySecret) &&
  rzpKeyId !== "placeholder" &&
  rzpKeySecret !== "placeholder" &&
  rzpKeyId.startsWith("rzp_")

const razorpay = hasLiveRazorpay
  ? new Razorpay({
      key_id: rzpKeyId,
      key_secret: rzpKeySecret,
    })
  : null

function generateAwbCode(prefix = "AKS") {
  return `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`
}

class CheckoutError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const bookId = typeof body?.bookId === "string" ? body.bookId.trim() : ""
    const deliveryPincode =
      typeof body?.deliveryPincode === "string" ? body.deliveryPincode.trim() : ""
    const fulfillmentMode = body?.fulfillmentMode === "MEETUP" ? "MEETUP" : "SHIPPING"
    const meetupSpot =
      typeof body?.meetupSpot === "string" ? body.meetupSpot.trim().slice(0, 120) : ""

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

    const isMeetup = fulfillmentMode === "MEETUP"

    if (!isMeetup && (!hasLiveRazorpay || !razorpay)) {
      return NextResponse.json(
        {
          error:
            "Online courier payment gateway is not configured in this environment. Please select 'Campus / City Meetup' reservation (pay in person at handoff) or configure live Razorpay credentials.",
        },
        { status: 503 }
      )
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const book = await tx.book.findUnique({
          where: { id: bookId },
        })

        if (!book) {
          throw new CheckoutError(404, "Book not found")
        }

        if (book.status !== "AVAILABLE") {
          throw new CheckoutError(400, "Book is no longer available")
        }

        if (book.ownerId === userId) {
          throw new CheckoutError(400, "You cannot purchase your own book")
        }

        if (book.price <= 0) {
          throw new CheckoutError(
            400,
            "Free donations are requested directly without checkout"
          )
        }

        // Check if buyer has an ACCEPTED offer on this book
        const acceptedOffer = await tx.bookOffer.findFirst({
          where: {
            bookId: book.id,
            buyerId: userId,
            status: "ACCEPTED",
          },
          orderBy: { updatedAt: "desc" },
        })

        const agreedBookPrice = acceptedOffer ? acceptedOffer.amount : book.price
        const platformFee = isMeetup ? 0 : 25
        let shippingFee = isMeetup ? 0 : 40
        if (!isMeetup && /^\d{6}$/.test(deliveryPincode)) {
          const firstDigit = deliveryPincode[0]
          shippingFee = firstDigit === "1" ? 40 : firstDigit === "2" ? 60 : 90
        }

        const totalAmount = agreedBookPrice + platformFee + shippingFee

        // 1. Campus / City Meetup Reservation (Pay in person on inspection/handoff)
        if (isMeetup) {
          await tx.book.update({
            where: { id: bookId },
            data: { status: "RESERVED" },
          })

          const awb = generateAwbCode("MTP")
          const order = await tx.order.create({
            data: {
              amount: totalAmount,
              status: "RESERVED",
              paymentId: `meetup_reservation_${Date.now()}`,
              bookId: book.id,
              buyerId: userId,
              shipment: {
                create: {
                  awbCode: awb,
                  courierName: `Campus/Local Meetup${
                    meetupSpot ? ` (${meetupSpot})` : ""
                  }`,
                  status: "READY_TO_SHIP",
                  trackingUrl: `/orders`,
                },
              },
            },
          })

          const buyerName =
            session.user.name || session.user.email?.split("@")[0] || "A reader"
          const autoChatText = `Hi! I reserved your book "${book.title}" (₹${agreedBookPrice}) for a Campus/Local Meetup Handoff (Ref #${awb})${
            meetupSpot ? ` near "${meetupSpot}"` : ""
          }. Let's coordinate a convenient time and public spot to inspect and complete the handoff!`

          await tx.message.create({
            data: {
              content: autoChatText,
              senderId: userId,
              receiverId: book.ownerId,
              orderId: order.id,
              read: false,
            },
          })

          await tx.notification.createMany({
            data: [
              {
                userId: book.ownerId,
                type: "ORDER_UPDATE",
                message: `${buyerName} reserved "${book.title}" (₹${agreedBookPrice}) for a Local Meetup! Check Messages to coordinate handoff.`,
                link: `/messages/${userId}?book=${book.id}`,
              },
              {
                userId,
                type: "ORDER_UPDATE",
                message: `Meetup reserved for "${book.title}" (#${awb})! Coordinate handoff in Messages.`,
                link: `/orders`,
              },
            ],
          })

          return {
            meetupReserved: true,
            orderId: order.id,
            awbCode: awb,
            sellerId: book.ownerId,
            isMeetup: true,
          }
        }

        // 2. Live Razorpay Gateway Flow (status remains PENDING until verified by /api/verify-payment or /api/webhooks/payment)
        const updatedBook = await tx.book.update({
          where: { id: bookId },
          data: { status: "RESERVED" },
        })

        const rzpOrder = await razorpay!.orders.create({
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          receipt: `receipt_book_${updatedBook.id.substring(0, 8)}`,
          notes: {
            bookId: updatedBook.id,
            buyerId: userId,
          },
        })

        const order = await tx.order.create({
          data: {
            amount: totalAmount,
            status: "PENDING",
            paymentId: rzpOrder.id,
            bookId: updatedBook.id,
            buyerId: userId,
          },
        })

        return {
          meetupReserved: false,
          orderId: order.id,
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          sellerId: book.ownerId,
          isMeetup: false,
        }
      },
      { timeout: 15000 }
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Checkout creation error:", error)
    return NextResponse.json(
      { error: error?.error?.description || error?.message || "Failed to initialize checkout" },
      { status: 500 }
    )
  }
}
