import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    // Strictly require webhook secret and valid HMAC-SHA256 signature
    if (!webhookSecret || webhookSecret === "placeholder" || webhookSecret.startsWith("mock")) {
      return NextResponse.json(
        { error: "Webhook secret is not configured on this server." },
        { status: 503 }
      )
    }

    const signature = req.headers.get("x-razorpay-signature")
    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature header" },
        { status: 401 }
      )
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex")

    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (
      sigBuf.length !== expBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expBuf)
    ) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }

    const body = JSON.parse(rawBody)
    const orderId: string | undefined =
      body.orderId || body.payload?.payment?.entity?.notes?.orderId
    const rawStatus: string | undefined =
      body.status ||
      (body.event === "payment.captured"
        ? "SUCCESS"
        : body.event === "payment.failed"
        ? "FAILED"
        : undefined)

    if (!orderId || !rawStatus) {
      return NextResponse.json(
        { error: "Missing required fields (orderId, status)" },
        { status: 400 }
      )
    }

    if (rawStatus !== "SUCCESS") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "FAILED" },
      })

      await prisma.book.update({
        where: { id: order.bookId },
        data: { status: "AVAILABLE" },
      })

      return NextResponse.json({
        message: "Order failed, book reservation released",
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { book: true },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      if (order.status === "PAID") {
        return { order, alreadyPaid: true }
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentId:
            body.paymentId ||
            body.payload?.payment?.entity?.id ||
            order.paymentId ||
            `wh_${Date.now()}`,
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

      const awb = `AKS${orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
      await tx.shipment.upsert({
        where: { orderId },
        update: {},
        create: {
          orderId,
          awbCode: awb,
          courierName: "Delhivery Surface Express",
          trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
          status: "READY_TO_SHIP",
        },
      })

      await tx.notification.createMany({
        data: [
          {
            userId: order.buyerId,
            type: "ORDER_UPDATE",
            message: `Payment confirmed for "${order.book.title}". Shipment AWB ${awb} generated.`,
            link: "/orders",
          },
          {
            userId: order.book.ownerId,
            type: "ORDER_UPDATE",
            message: `Your listing "${order.book.title}" sold! Prepare package for AWB ${awb}.`,
            link: "/orders",
          },
        ],
      })

      return {
        order: updatedOrder,
        sellerId: order.book.ownerId,
        buyerId: order.buyerId,
      }
    })

    if ("sellerId" in result && result.sellerId) {
      checkAndAwardBadges(result.sellerId).catch(() => {})
      checkAndAwardBadges(result.buyerId).catch(() => {})
    }

    return NextResponse.json({
      message: "Webhook processed successfully",
      result,
    })
  } catch (error: any) {
    console.error("Payment webhook error:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
