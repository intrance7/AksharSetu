import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing Razorpay payment details" }, { status: 400 })
    }

    // Verify the signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder"
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    // Transaction to update Order and Book status securely
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { paymentId: razorpay_order_id },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      if (order.status === "PAID") {
        throw new Error("Order is already paid")
      }

      // Mark Order as PAID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      })

      // Mark Book as SOLD
      await tx.book.update({
        where: { id: order.bookId },
        data: { status: "SOLD" },
      })

      return updatedOrder
    })

    return NextResponse.json({ success: true, order: result }, { status: 200 })
  } catch (error: any) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
