import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { pusherServer } from "@/lib/pusher"

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
      return NextResponse.json({ error: "Missing context ID (requestId or orderId)" }, { status: 400 })
    }

    const whereClause: any = {}
    if (requestId) whereClause.requestId = requestId
    if (orderId) whereClause.orderId = orderId

    // Verify user is part of the request or order
    if (requestId) {
      const request = await prisma.bookRequest.findUnique({
        where: { id: requestId },
        include: { book: true }
      })
      if (!request || (request.requesterId !== session.user.id && request.book.ownerId !== session.user.id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { book: true }
      })
      if (!order || (order.buyerId !== session.user.id && order.book.ownerId !== session.user.id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { name: true, image: true, id: true }
        }
      }
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

    const body = await req.json()
    const { content, requestId, orderId, receiverId } = body

    if (!content || !receiverId || (!requestId && !orderId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user is part of the request or order and receiver is correct
    let isValid = false
    if (requestId) {
      const request = await prisma.bookRequest.findUnique({
        where: { id: requestId },
        include: { book: true }
      })
      if (request && (request.requesterId === session.user.id || request.book.ownerId === session.user.id)) {
        isValid = true
      }
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { book: true }
      })
      if (order && (order.buyerId === session.user.id || order.book.ownerId === session.user.id)) {
        isValid = true
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
        requestId,
        orderId,
      },
      include: {
        sender: {
          select: { name: true, image: true, id: true }
        }
      }
    })

    // Determine the channel to broadcast on
    const channelId = requestId ? `chat-request-${requestId}` : `chat-order-${orderId}`
    
    // Trigger pusher event
    await pusherServer.trigger(channelId, 'new-message', message)

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
