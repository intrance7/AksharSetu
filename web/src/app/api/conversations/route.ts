import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

// GET /api/conversations — returns all conversations for the current user
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
        lastMessage: { content: string; createdAt: Date; isMine: boolean }
        messageCount: number
      }
    >()

    for (const msg of messages) {
      const rawOther = msg.senderId === userId ? msg.receiver : msg.sender
      const isMine = msg.senderId === userId

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
            content: msg.content,
            createdAt: msg.createdAt,
            isMine,
          },
          messageCount: 1,
        })
      } else {
        existing.messageCount += 1
      }
    }

    const conversations = Array.from(conversationMap.values())

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Fetch conversations error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
