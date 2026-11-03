import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: clubId } = await params
    const userId = session.user.id

    const existing = await prisma.bookClubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId },
      },
    })

    if (existing) {
      await prisma.bookClubMember.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ joined: false })
    }

    await prisma.bookClubMember.create({
      data: { clubId, userId },
    })

    return NextResponse.json({ joined: true })
  } catch (error) {
    console.error("Toggle club join error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

