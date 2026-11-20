import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { touchUserPresence } from "@/lib/messaging/service"
import { cachedQuery } from "@/lib/cache"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const userId = session.user.id
    void touchUserPresence(userId)

    const unreadCount = await cachedQuery(
      `msg:unread:${userId}`,
      15_000,
      () =>
        prisma.message.count({
          where: {
            receiverId: userId,
            read: false,
            deletedAt: null,
          },
        })
    )

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error("Unread messages count error:", error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
