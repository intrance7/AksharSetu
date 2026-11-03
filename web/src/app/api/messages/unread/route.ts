import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        read: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error("Unread messages count error:", error)
    return NextResponse.json({ unreadCount: 0 })
  }
}

