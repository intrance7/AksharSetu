import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (status !== "SUCCESS") {
      // In a real app, handle FAILED status by releasing the book reservation
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "FAILED" },
      })
      
      await prisma.book.update({
        where: { id: order.bookId },
        data: { status: "AVAILABLE" },
      })

      return NextResponse.json({ message: "Order failed, reservation released" })
    }

    // Atomic transaction for successful payment
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      if (order.status === "PAID") {
        throw new Error("Order already paid")
      }

      // Update Order to PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      })

      // Update Book to SOLD
      await tx.book.update({
        where: { id: order.bookId },
        data: { status: "SOLD" },
      })

      return updatedOrder
    })

    return NextResponse.json({ message: "Webhook processed successfully", result })
  } catch (error: any) {
    console.error("Payment webhook error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
