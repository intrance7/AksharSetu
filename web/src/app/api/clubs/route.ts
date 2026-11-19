import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { invalidateCache } from "@/lib/fastCache"
import { checkAndAwardBadges } from "@/services/badgeService"
import { generateSabhaCode } from "@/lib/sabha"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || null

    const clubs = await prisma.bookClub.findMany({
      where: userId
        ? {
            OR: [
              { isPrivate: false },
              { members: { some: { userId } } },
              { creatorId: userId },
            ],
          }
        : { isPrivate: false },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true, posts: true } },
      },
    })
    return NextResponse.json(clubs)
  } catch (error) {
    console.error("GET clubs error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

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

    const {
      name,
      description,
      bookTitle,
      bookAuthor,
      ebookKey,
      scheduleText,
      isPrivate = false,
      maxMembers = 25,
      customCode,
    } = body

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof bookTitle !== "string" ||
      !bookTitle.trim() ||
      typeof bookAuthor !== "string" ||
      !bookAuthor.trim()
    ) {
      return NextResponse.json(
        { error: "Team name, book title, and book author are required" },
        { status: 400 }
      )
    }

    let inviteCode = generateSabhaCode()
    if (typeof customCode === "string" && customCode.trim()) {
      const cleaned = customCode
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "")
        .slice(0, 16)
      if (cleaned.length >= 4) {
        inviteCode = cleaned.startsWith("SABHA-")
          ? cleaned
          : `SABHA-${cleaned}`
      }
    }

    // Ensure uniqueness of inviteCode
    for (let attempt = 0; attempt < 5; attempt++) {
      const existingCode = await prisma.bookClub.findUnique({
        where: { inviteCode },
        select: { id: true },
      })
      if (!existingCode) break
      inviteCode = generateSabhaCode()
    }

    const parsedMax = Math.min(
      100,
      Math.max(2, parseInt(String(maxMembers), 10) || 25)
    )

    const club = await prisma.bookClub.create({
      data: {
        name: name.trim().slice(0, 120),
        description:
          (typeof description === "string" ? description.trim() : "") ||
          `Sabha reading team discussing ${bookTitle.trim()}.`,
        bookTitle: bookTitle.trim().slice(0, 160),
        bookAuthor: bookAuthor.trim().slice(0, 120),
        ebookKey: typeof ebookKey === "string" ? ebookKey.trim() || null : null,
        scheduleText:
          (typeof scheduleText === "string" ? scheduleText.trim() : "") ||
          "Weekly Shanti Reading Session",
        inviteCode,
        isPrivate: Boolean(isPrivate),
        maxMembers: parsedMax,
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "LEADER",
          },
        },
      },
    })

    invalidateCache("clubs:")
    checkAndAwardBadges(session.user.id).catch(() => {})

    return NextResponse.json(club, { status: 201 })
  } catch (error) {
    console.error("POST club error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
