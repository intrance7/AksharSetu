import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to join a Sabha Team with a code." },
        { status: 401 }
      )
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const rawCode = String(body.code || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")

    if (!rawCode) {
      return NextResponse.json(
        { error: "Please enter a valid Sabha Team invite code." },
        { status: 400 }
      )
    }

    const candidates = rawCode.startsWith("SABHA-")
      ? [rawCode, rawCode.replace(/^SABHA-/, "")]
      : [rawCode, `SABHA-${rawCode}`]

    const club = await prisma.bookClub.findFirst({
      where: {
        inviteCode: { in: candidates },
      },
      include: {
        _count: { select: { members: true } },
      },
    })

    if (!club) {
      return NextResponse.json(
        {
          error: `No Sabha Team found with code "${rawCode}". Check the code and try again.`,
        },
        { status: 404 }
      )
    }

    const userId = session.user.id
    const existingMember = await prisma.bookClubMember.findUnique({
      where: {
        clubId_userId: { clubId: club.id, userId },
      },
    })

    if (existingMember) {
      return NextResponse.json({
        joined: true,
        alreadyMember: true,
        clubId: club.id,
        clubName: club.name,
      })
    }

    if (club._count.members >= club.maxMembers) {
      return NextResponse.json(
        {
          error: `This Sabha Team ("${club.name}") has reached its maximum capacity of ${club.maxMembers} members.`,
        },
        { status: 400 }
      )
    }

    try {
      await prisma.bookClubMember.create({
        data: {
          clubId: club.id,
          userId,
          role: club.creatorId === userId ? "LEADER" : "MEMBER",
        },
      })
    } catch (err: any) {
      if (err?.code !== "P2002") throw err
    }

    checkAndAwardBadges(userId).catch(() => {})

    return NextResponse.json({
      joined: true,
      alreadyMember: false,
      clubId: club.id,
      clubName: club.name,
    })
  } catch (error) {
    console.error("Join club by code error:", error)
    return NextResponse.json(
      { error: "Failed to join Sabha Team with code" },
      { status: 500 }
    )
  }
}
