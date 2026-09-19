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

    // Fetch all messages where the user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ]
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Group messages by the "other" user to form conversations
    const conversationMap = new Map<string, {
      otherUser: { id: string; name: string | null; image: string | null }
      lastMessage: { content: string; createdAt: Date; isMine: boolean }
    }>()

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender
      const isMine = msg.senderId === userId

      if (!conversationMap.has(otherUser.id)) {
        conversationMap.set(otherUser.id, {
          otherUser,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isMine,
          },
        })
      }
    }

    const conversations = Array.from(conversationMap.values())

    return NextResponse.json(conversations)
  } catch (error: any) {
    console.error("Fetch conversations error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
