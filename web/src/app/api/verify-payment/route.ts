import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing Razorpay payment details" }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder"
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    const awb = `AKS${Math.floor(100000000 + Math.random() * 900000000)}`

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { paymentId: razorpay_order_id },
        include: { book: true },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      if (order.status === "PAID") {
        throw new Error("Order is already paid")
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          shipment: {
            create: {
              awbCode: awb,
              courierName: "AksharSetu Express (Delhivery)",
              status: "READY_TO_SHIP",
              trackingUrl: "/orders",
            },
          },
        },
      })

      await tx.book.update({
        where: { id: order.bookId },
        data: { status: "SOLD" },
      })

      await tx.user.update({
        where: { id: order.book.ownerId },
        data: { booksSold: { increment: 1 } },
      })

      await tx.notification.createMany({
        data: [
          {
            userId: order.book.ownerId,
            type: "ORDER_UPDATE",
            message: `Your book "${order.book.title}" sold! Prepare package for AWB #${awb}.`,
            link: "/orders",
          },
          {
            userId: order.buyerId,
            type: "ORDER_UPDATE",
            message: `Payment verified for "${order.book.title}"! Tracking AWB #${awb}.`,
            link: "/orders",
          },
        ],
      })

      return { updatedOrder, buyerId: order.buyerId, sellerId: order.book.ownerId }
    })

    await Promise.allSettled([
      checkAndAwardBadges(result.buyerId),
      checkAndAwardBadges(result.sellerId),
    ])

    return NextResponse.json({ success: true, order: result.updatedOrder }, { status: 200 })
  } catch (error: any) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
