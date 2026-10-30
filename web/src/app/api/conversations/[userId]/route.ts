import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { pusherServer } from "@/lib/pusher"

// GET /api/conversations/[userId] — fetch all messages between the logged-in user and [userId]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: otherUserId } = await params
    const myId = session.user.id

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
          booksCount: rawOtherUser._count.books,
          badgesCount: rawOtherUser._count.badges,
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
    const { content } = body

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
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    })

    // Create in-app notification for the recipient (non-blocking)
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

    // Trigger Pusher event safely without failing the HTTP response if Pusher is unconfigured
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
