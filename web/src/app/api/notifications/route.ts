import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error("Fetch notifications error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, read } = body

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 })
    }

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: read ?? true },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Update notification error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
