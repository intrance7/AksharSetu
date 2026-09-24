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

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ]
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    // Also fetch the other user's info for the header
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, image: true, isShantiModeActive: true, liveStatus: true },
    })

    return NextResponse.json({ messages, otherUser })
  } catch (error: any) {
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

    // Prevent messaging yourself
    if (otherUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    // Verify the other user exists
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

    // Create a unique channel name for these two users
    const channelId = `chat-dm-${[session.user.id, otherUserId].sort().join('-')}`
    await pusherServer.trigger(channelId, 'new-message', message)

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
