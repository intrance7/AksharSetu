import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { touchUserPresence } from "@/lib/messaging/service"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const userId = session.user.id
    touchUserPresence(userId)

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false,
        deletedAt: null,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error("Unread messages count error:", error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
