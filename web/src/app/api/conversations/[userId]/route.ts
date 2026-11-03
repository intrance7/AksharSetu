import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { pusherServer } from "@/lib/pusher"

// GET /api/conversations/[userId] — fetch all messages between the logged-in user and [userId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: otherUserId } = await params
    const myId = session.user.id

    // Mark incoming messages in this thread as read
    const updated = await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: myId,
        read: false,
      },
      data: { read: true },
    })

    if (updated.count > 0) {
      try {
        const channelId = `chat-dm-${[myId, otherUserId].sort().join("-")}`
        await pusherServer.trigger(channelId, "messages-read", {
          readerId: myId,
        })
      } catch {
        // Non-fatal if Pusher is offline
      }
    }

    const [messages, rawOtherUser] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: myId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: myId },
          ],
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: otherUserId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          location: true,
          favoriteQuote: true,
          quoteAuthor: true,
          isShantiModeActive: true,
          liveStatus: true,
          sellerRating: true,
          responseTime: true,
          books: {
            where: { status: "AVAILABLE" },
            take: 8,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              author: true,
              price: true,
              condition: true,
              deliveryType: true,
              acceptsExchange: true,
              images: true,
            },
          },
          _count: {
            select: { books: true, badges: true },
          },
        },
      }),
    ])

    const otherUser = rawOtherUser
      ? {
          id: rawOtherUser.id,
          name: rawOtherUser.name || rawOtherUser.email?.split("@")[0] || "Reader",
          image: rawOtherUser.image,
          bio: rawOtherUser.bio,
          location: rawOtherUser.location,
          favoriteQuote: rawOtherUser.favoriteQuote,
          quoteAuthor: rawOtherUser.quoteAuthor,
          isShantiModeActive: rawOtherUser.isShantiModeActive,
          liveStatus: rawOtherUser.liveStatus,
          sellerRating: rawOtherUser.sellerRating,
          responseTime: rawOtherUser.responseTime,
          booksCount: rawOtherUser._count.books,
          badgesCount: rawOtherUser._count.badges,
          books: rawOtherUser.books,
        }
      : null

    return NextResponse.json({ messages, otherUser })
  } catch (error) {
    console.error("Fetch thread error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/conversations/[userId] — send a message to [userId]
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: otherUserId } = await params
    const body = await req.json()
    const { content, requestId, orderId } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    if (otherUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } })
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        receiverId: otherUserId,
        requestId: requestId || null,
        orderId: orderId || null,
        read: false,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    })

    const senderName = session.user.name || session.user.email?.split("@")[0] || "A reader"
    prisma.notification
      .create({
        data: {
          userId: otherUserId,
          type: "NEW_MESSAGE",
          message: `${senderName}: "${content.trim().slice(0, 60)}${content.trim().length > 60 ? "..." : ""}"`,
          link: `/messages/${session.user.id}`,
        },
      })
      .catch(() => {})

    try {
      const channelId = `chat-dm-${[session.user.id, otherUserId].sort().join("-")}`
      await pusherServer.trigger(channelId, "new-message", message)
    } catch {
      // Fallback polling on client handles environments without Pusher keys
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/conversations/[userId]?messageId=... — unsend own message
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: otherUserId } = await params
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get("messageId")

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 })
    }

    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!existing || existing.senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.message.delete({
      where: { id: messageId },
    })

    try {
      const channelId = `chat-dm-${[session.user.id, otherUserId].sort().join("-")}`
      await pusherServer.trigger(channelId, "message-deleted", { messageId })
    } catch {}

    return NextResponse.json({ deleted: true, messageId })
  } catch (error) {
    console.error("Delete message error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
