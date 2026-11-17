import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await params
    const { status } = await req.json()

    if (!["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid shipment status" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { book: true, shipment: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const isSeller = order.book.ownerId === session.user.id
    const isBuyerConfirmingDelivery =
      order.buyerId === session.user.id && status === "DELIVERED"

    if (
      !isSeller &&
      !isBuyerConfirmingDelivery &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedShipment = await prisma.$transaction(async (tx) => {
      const shipment = order.shipment
        ? await tx.shipment.update({
            where: { orderId },
            data: { status },
          })
        : await tx.shipment.create({
            data: {
              orderId,
              awbCode: `AKS${Math.floor(100000000 + Math.random() * 900000000)}`,
              courierName: "AksharSetu Express (Delhivery)",
              status,
              trackingUrl: "/orders",
            },
          })

      // If a RESERVED meetup order is confirmed DELIVERED, transition order to PAID and book to SOLD
      if (status === "DELIVERED" && order.status === "RESERVED") {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        })
        await tx.book.update({
          where: { id: order.bookId },
          data: { status: "SOLD" },
        })
        await tx.user.update({
          where: { id: order.book.ownerId },
          data: { booksSold: { increment: 1 } },
        })
      }

      return shipment
    })

    if (status === "DELIVERED") {
      Promise.allSettled([
        checkAndAwardBadges(order.buyerId),
        checkAndAwardBadges(order.book.ownerId),
      ]).catch(() => {})
    }

    const recipientId = isSeller ? order.buyerId : order.book.ownerId
    await prisma.notification
      .create({
        data: {
          userId: recipientId,
          type: "ORDER_UPDATE",
          message:
            status === "SHIPPED"
              ? `"${order.book.title}" has been shipped (AWB #${updatedShipment.awbCode})!`
              : status === "DELIVERED"
              ? `"${order.book.title}" handoff/delivery confirmed! Leave a verified seller review.`
              : `Shipment updated for "${order.book.title}".`,
          link: "/orders",
        },
      })
      .catch(() => {})

    return NextResponse.json(updatedShipment)
  } catch (error) {
    console.error("Update shipment error:", error)
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 }
    )
  }
}
