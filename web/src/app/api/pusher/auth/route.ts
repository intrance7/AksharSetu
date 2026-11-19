import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { pusherServer, isPusherServerConfigured } from "@/lib/pusher-server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isPusherServerConfigured) {
      return NextResponse.json({ error: "Pusher not configured" }, { status: 503 })
    }

    const text = await req.text()
    const params = new URLSearchParams(text)
    const socketId = params.get("socket_id")
    const channelName = params.get("channel_name")

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 })
    }

    const userId = session.user.id

    if (channelName.startsWith("private-user-")) {
      const targetUserId = channelName.replace("private-user-", "")
      if (targetUserId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      const authResponse = pusherServer.authorizeChannel(socketId, channelName)
      return NextResponse.json(authResponse)
    }

    if (channelName.startsWith("private-conversation-")) {
      const conversationId = channelName.replace("private-conversation-", "")
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      })
      if (!participant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      const authResponse = pusherServer.authorizeChannel(socketId, channelName)
      return NextResponse.json(authResponse)
    }

    return NextResponse.json({ error: "Unknown channel prefix" }, { status: 403 })
  } catch (error) {
    console.error("Pusher auth error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
