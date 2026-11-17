import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

export function generateSabhaCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let suffix = ""
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `SABHA-${suffix}`
}

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

    const body = await req.json()
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

    if (!name?.trim() || !bookTitle?.trim() || !bookAuthor?.trim()) {
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
    const existingCode = await prisma.bookClub.findUnique({
      where: { inviteCode },
      select: { id: true },
    })
    if (existingCode) {
      inviteCode = generateSabhaCode()
    }

    const parsedMax = Math.min(
      100,
      Math.max(2, parseInt(String(maxMembers), 10) || 25)
    )

    const club = await prisma.bookClub.create({
      data: {
        name: name.trim(),
        description:
          description?.trim() ||
          `Sabha reading team discussing ${bookTitle.trim()}.`,
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim(),
        ebookKey: ebookKey?.trim() || null,
        scheduleText: scheduleText?.trim() || "Weekly Shanti Reading Session",
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
