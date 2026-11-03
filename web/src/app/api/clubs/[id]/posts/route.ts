import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: clubId } = await params
    const { chapterLabel, content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Reflection content is required" },
        { status: 400 }
      )
    }

    // Auto-enroll poster as member if not already in the circle
    await prisma.bookClubMember.upsert({
      where: {
        clubId_userId: { clubId, userId: session.user.id },
      },
      update: {},
      create: { clubId, userId: session.user.id },
    })

    const post = await prisma.bookClubPost.create({
      data: {
        clubId,
        authorId: session.user.id,
        chapterLabel: chapterLabel?.trim() || null,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Create club post error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

