import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Razorpay from "razorpay"
import { checkAndAwardBadges } from "@/services/badgeService"

const rzpKeyId = process.env.RAZORPAY_KEY_ID || "placeholder"
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder"
const hasLiveRazorpay =
  rzpKeyId !== "placeholder" &&
  rzpKeySecret !== "placeholder" &&
  rzpKeyId.startsWith("rzp_")

const razorpay = new Razorpay({
  key_id: rzpKeyId,
  key_secret: rzpKeySecret,
})

function generateAwbCode(prefix = "AKS") {
  return `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const {
      bookId,
      deliveryPincode,
      fulfillmentMode = "SHIPPING",
      meetupSpot = "",
      instantEscrow = false,
    } = body

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

    const isMeetup = fulfillmentMode === "MEETUP"

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: { id: bookId },
      })

      if (!book) {
        throw new Error("Book not found")
      }

      if (book.status !== "AVAILABLE") {
        throw new Error("Book is no longer available")
      }

      if (book.ownerId === userId) {
        throw new Error("You cannot purchase your own book")
      }

      if (book.price === 0) {
        throw new Error("Free donations are requested directly without checkout")
      }

      const platformFee = isMeetup ? 0 : 25
      let shippingFee = isMeetup ? 0 : 40
      if (!isMeetup && deliveryPincode && deliveryPincode.length === 6) {
        const firstDigit = deliveryPincode[0]
        shippingFee = firstDigit === "1" ? 40 : firstDigit === "2" ? 60 : 90
      }

      const totalAmount = book.price + platformFee + shippingFee

      // Local Meetup Reservation OR Instant Escrow / Sandbox Mode
      if (isMeetup || instantEscrow || !hasLiveRazorpay) {
        await tx.book.update({
          where: { id: bookId },
          data: { status: "SOLD" },
        })

        const awb = generateAwbCode(isMeetup ? "MTP" : "AKS")
        const order = await tx.order.create({
          data: {
            amount: totalAmount,
            status: "PAID",
            paymentId: isMeetup
              ? `meetup_handoff_${Date.now()}`
              : `escrow_pay_${Date.now()}`,
            bookId: book.id,
            buyerId: userId,
            shipment: {
              create: {
                awbCode: awb,
                courierName: isMeetup
                  ? `Campus/Local Meetup${meetupSpot ? ` (${meetupSpot})` : ""}`
                  : "AksharSetu Express (Delhivery)",
                status: "READY_TO_SHIP",
                trackingUrl: `/orders`,
              },
            },
          },
        })

        await tx.user.update({
          where: { id: book.ownerId },
          data: { booksSold: { increment: 1 } },
        })

        // Automatically open/send a handoff coordination message in the chat thread
        const buyerName =
          session.user.name || session.user.email?.split("@")[0] || "A reader"
        const autoChatText = isMeetup
          ? `Hi! I just reserved your book "${book.title}" (₹${book.price}) for a Local Meetup Handoff (Ref #${awb})${
              meetupSpot ? ` near "${meetupSpot}"` : ""
            }. When works best for you to meet up?`
          : `Hi! I just placed an order for "${book.title}" (Total ₹${totalAmount}, AWB #${awb}, Pincode ${
              deliveryPincode || "N/A"
            }). Looking forward to receiving it!`

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
              message: isMeetup
                ? `${buyerName} reserved "${book.title}" (₹${book.price}) for a Local Meetup! Check Messages to coordinate.`
                : `Your book "${book.title}" sold for ₹${book.price}! AWB #${awb} generated.`,
              link: `/messages/${userId}?orderId=${order.id}`,
            },
            {
              userId,
              type: "ORDER_UPDATE",
              message: isMeetup
                ? `Meetup reserved for "${book.title}" (#${awb})! Coordinate handoff in Messages.`
                : `Order confirmed for "${book.title}"! Track shipment AWB #${awb}.`,
              link: `/orders`,
            },
          ],
        })

        return {
          sandboxPaid: true,
          orderId: order.id,
          awbCode: awb,
          sellerId: book.ownerId,
          isMeetup,
        }
      }

      // Live Razorpay Gateway Flow
      const updatedBook = await tx.book.update({
        where: { id: bookId },
        data: { status: "RESERVED" },
      })

      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_book_${updatedBook.id.substring(0, 8)}`,
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
        sandboxPaid: false,
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        sellerId: book.ownerId,
        isMeetup: false,
      }
    })

    if (result.sandboxPaid) {
      await Promise.allSettled([
        checkAndAwardBadges(userId),
        checkAndAwardBadges(result.sellerId),
      ])
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Checkout creation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 400 }
    )
  }
}
