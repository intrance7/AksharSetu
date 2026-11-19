import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { isShantiModeActive, liveStatus } = body

    if (typeof isShantiModeActive !== "boolean") {
      return NextResponse.json({ error: "Invalid status payload" }, { status: 400 })
    }

    const cleanStatus =
      typeof liveStatus === "string" ? liveStatus.trim().slice(0, 80) || null : null

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isShantiModeActive,
        liveStatus: isShantiModeActive ? cleanStatus : null, // Clear status if deactivating
      },
      select: {
        id: true,
        isShantiModeActive: true,
        liveStatus: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
