import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { triggerPusherEvent } from "@/lib/pusher-server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const requestId = searchParams.get("requestId")
    const orderId = searchParams.get("orderId")

    if (!requestId && !orderId) {
      return NextResponse.json(
        { error: "Missing context ID (requestId or orderId)" },
        { status: 400 }
      )
    }

    const whereClause: any = {}
    if (requestId) whereClause.requestId = requestId
    if (orderId) whereClause.orderId = orderId

    // Verify user is part of the request or order
    if (requestId) {
      const request = await prisma.bookRequest.findUnique({
        where: { id: requestId },
        include: { book: true },
      })
      if (!request) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }
      if (
        request.requesterId !== session.user.id &&
        request.book.ownerId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { book: true },
      })
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      if (
        order.buyerId !== session.user.id &&
        order.book.ownerId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { name: true, image: true, id: true },
        },
      },
    })

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("Fetch messages error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const content = typeof body?.content === "string" ? body.content.trim() : ""
    const requestId = typeof body?.requestId === "string" ? body.requestId : null
    const orderId = typeof body?.orderId === "string" ? body.orderId : null
    const receiverId = typeof body?.receiverId === "string" ? body.receiverId : null

    if (!content || !receiverId || (!requestId && !orderId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user is part of the request or order AND receiverId is the counterparty
    let isValid = false
    if (requestId) {
      const request = await prisma.bookRequest.findUnique({
        where: { id: requestId },
        include: { book: true },
      })
      if (!request) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }
      const isRequester = request.requesterId === session.user.id
      const isOwner = request.book.ownerId === session.user.id
      const expectedReceiver = isRequester ? request.book.ownerId : request.requesterId
      if ((isRequester || isOwner) && receiverId === expectedReceiver) {
        isValid = true
      }
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { book: true },
      })
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }
      const isBuyer = order.buyerId === session.user.id
      const isOwner = order.book.ownerId === session.user.id
      const expectedReceiver = isBuyer ? order.book.ownerId : order.buyerId
      if ((isBuyer || isOwner) && receiverId === expectedReceiver) {
        isValid = true
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        content: content.slice(0, 4000),
        senderId: session.user.id,
        receiverId,
        requestId,
        orderId,
      },
      include: {
        sender: {
          select: { name: true, image: true, id: true },
        },
      },
    })

    const channelId = requestId
      ? `chat-request-${requestId}`
      : `chat-order-${orderId}`

    await triggerPusherEvent(channelId, "new-message", message)

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
