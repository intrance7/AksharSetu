import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

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
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { chapterLabel, content } = body

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Reflection content is required" },
        { status: 400 }
      )
    }

    const club = await prisma.bookClub.findUnique({
      where: { id: clubId },
      select: { id: true, isPrivate: true, creatorId: true },
    })

    if (!club) {
      return NextResponse.json({ error: "Sabha Team not found" }, { status: 404 })
    }

    const membership = await prisma.bookClubMember.findUnique({
      where: {
        clubId_userId: { clubId, userId: session.user.id },
      },
    })

    if (club.isPrivate && !membership && club.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "You must join this private Sabha Team with its invite code before posting." },
        { status: 403 }
      )
    }

    if (!membership) {
      try {
        await prisma.bookClubMember.create({
          data: {
            clubId,
            userId: session.user.id,
            role: club.creatorId === session.user.id ? "LEADER" : "MEMBER",
          },
        })
      } catch (err: any) {
        if (err?.code !== "P2002") throw err
      }
    }

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

    checkAndAwardBadges(session.user.id).catch(() => {})

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Create club post error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
