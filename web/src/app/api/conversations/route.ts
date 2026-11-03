import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// GET /api/conversations — returns all conversations for the current user with unread counts
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            location: true,
            isShantiModeActive: true,
            liveStatus: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            location: true,
            isShantiModeActive: true,
            liveStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const conversationMap = new Map<
      string,
      {
        otherUser: {
          id: string
          name: string | null
          image: string | null
          location: string | null
          isShantiModeActive: boolean
          liveStatus: string | null
        }
        lastMessage: {
          id: string
          content: string
          createdAt: Date
          isMine: boolean
          read: boolean
        }
        messageCount: number
        unreadCount: number
      }
    >()

    for (const msg of messages) {
      const rawOther = msg.senderId === userId ? msg.receiver : msg.sender
      if (!rawOther) continue
      const isMine = msg.senderId === userId
      const isUnreadIncoming = !isMine && !msg.read

      const existing = conversationMap.get(rawOther.id)
      if (!existing) {
        conversationMap.set(rawOther.id, {
          otherUser: {
            id: rawOther.id,
            name: rawOther.name || rawOther.email?.split("@")[0] || "Reader",
            image: rawOther.image,
            location: rawOther.location,
            isShantiModeActive: rawOther.isShantiModeActive,
            liveStatus: rawOther.liveStatus,
          },
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            isMine,
            read: msg.read,
          },
          messageCount: 1,
          unreadCount: isUnreadIncoming ? 1 : 0,
        })
      } else {
        existing.messageCount += 1
        if (isUnreadIncoming) {
          existing.unreadCount += 1
        }
      }
    }

    const conversations = Array.from(conversationMap.values())

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Fetch conversations error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
