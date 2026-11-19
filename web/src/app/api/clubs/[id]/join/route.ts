import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { generateSabhaCode } from "@/lib/sabha"
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
    const userId = session.user.id
    const body = await req.json().catch(() => ({}))

    const club = await prisma.bookClub.findUnique({
      where: { id: clubId },
      include: { _count: { select: { members: true } } },
    })

    if (!club) {
      return NextResponse.json({ error: "Sabha Team not found" }, { status: 404 })
    }

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

    // If private team and user is not the creator, require valid inviteCode
    if (club.isPrivate && club.creatorId !== userId) {
      const provided = String(body.inviteCode || "")
        .trim()
        .toUpperCase()
      const expected = (club.inviteCode || "").toUpperCase()
      if (
        !provided ||
        (provided !== expected && `SABHA-${provided}` !== expected)
      ) {
        return NextResponse.json(
          {
            error:
              "This is a private Sabha Team. Please enter the team invite code to join.",
          },
          { status: 403 }
        )
      }
    }

    if (club._count.members >= club.maxMembers) {
      return NextResponse.json(
        {
          error: `This Sabha Team is full (${club.maxMembers}/${club.maxMembers} members).`,
        },
        { status: 400 }
      )
    }

    try {
      await prisma.bookClubMember.create({
        data: {
          clubId,
          userId,
          role: club.creatorId === userId ? "LEADER" : "MEMBER",
        },
      })
    } catch (err: any) {
      if (err?.code !== "P2002") throw err
    }

    checkAndAwardBadges(userId).catch(() => {})

    return NextResponse.json({ joined: true })
  } catch (error) {
    console.error("Toggle club join error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// PATCH /api/clubs/[id]/join — Team Leader actions (regenerate invite code or toggle privacy)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: clubId } = await params
    const club = await prisma.bookClub.findUnique({ where: { id: clubId } })
    if (!club) {
      return NextResponse.json({ error: "Sabha Team not found" }, { status: 404 })
    }

    if (club.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the Sabha Team Leader can update team settings" },
        { status: 403 }
      )
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const updateData: Record<string, unknown> = {}

    if (body.regenerateCode) {
      let nextCode = generateSabhaCode()
      for (let attempt = 0; attempt < 5; attempt++) {
        const conflict = await prisma.bookClub.findUnique({
          where: { inviteCode: nextCode },
          select: { id: true },
        })
        if (!conflict) break
        nextCode = generateSabhaCode()
      }
      updateData.inviteCode = nextCode
    }
    if (typeof body.isPrivate === "boolean") {
      updateData.isPrivate = body.isPrivate
    }

    const updated = await prisma.bookClub.update({
      where: { id: clubId },
      data: updateData,
    })

    return NextResponse.json({
      inviteCode: updated.inviteCode,
      isPrivate: updated.isPrivate,
    })
  } catch (error) {
    console.error("PATCH club settings error:", error)
    return NextResponse.json(
      { error: "Failed to update team settings" },
      { status: 500 }
    )
  }
}
