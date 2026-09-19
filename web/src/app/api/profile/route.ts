import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { bio, location, name } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        name: true,
        bio: true,
        location: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
