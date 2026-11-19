import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { checkAndAwardBadges } from "@/services/badgeService"

class WebhookError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim()

    // Strictly require webhook secret and valid HMAC-SHA256 signature
    if (
      !webhookSecret ||
      webhookSecret === "placeholder" ||
      webhookSecret.startsWith("mock")
    ) {
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

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const orderId: string | undefined =
      body.orderId || body.payload?.payment?.entity?.notes?.orderId
    const razorpayOrderId: string | undefined =
      body.payload?.payment?.entity?.order_id ||
      body.payload?.order?.entity?.id ||
      body.razorpayOrderId

    const rawStatus: string | undefined =
      body.status ||
      (body.event === "payment.captured" || body.event === "order.paid"
        ? "SUCCESS"
        : body.event === "payment.failed"
        ? "FAILED"
        : undefined)

    if ((!orderId && !razorpayOrderId) || !rawStatus) {
      return NextResponse.json(
        { error: "Missing required fields (orderId/razorpayOrderId, status)" },
        { status: 400 }
      )
    }

    const lookupWhere = orderId
      ? { id: String(orderId) }
      : { paymentId: String(razorpayOrderId) }

    if (rawStatus !== "SUCCESS") {
      const existing = await prisma.order.findFirst({
        where: lookupWhere,
        select: { id: true, status: true, bookId: true },
      })

      if (!existing) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Never downgrade an already-paid order
      if (existing.status === "PAID") {
        return NextResponse.json({ message: "Order already paid; ignoring failure event" })
      }

      await prisma.$transaction([
        prisma.order.update({
          where: { id: existing.id },
          data: { status: "FAILED" },
        }),
        prisma.book.update({
          where: { id: existing.bookId },
          data: { status: "AVAILABLE" },
        }),
      ])

      return NextResponse.json({
        message: "Order failed, book reservation released",
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: lookupWhere,
        include: { book: true },
      })

      if (!order) {
        throw new WebhookError(404, "Order not found")
      }

      if (order.status === "PAID") {
        return { order, alreadyPaid: true }
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentId:
            order.paymentId ||
            body.paymentId ||
            body.payload?.payment?.entity?.id ||
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

      const awb = `AKS${order.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`
      await tx.shipment.upsert({
        where: { orderId: order.id },
        update: {},
        create: {
          orderId: order.id,
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
    if (error instanceof WebhookError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Payment webhook error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
