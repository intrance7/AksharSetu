import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges, awardUserXP } from "@/services/badgeService"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { libraryBookId, durationMinutes } = body

    const cleanMinutes = Math.max(1, Math.min(240, Math.round(Number(durationMinutes) || 0)))
    if (!libraryBookId || !cleanMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const libraryBook = await prisma.libraryBook.findUnique({
      where: { id: libraryBookId },
    })

    if (!libraryBook || libraryBook.userId !== session.user.id) {
      return NextResponse.json({ error: "Book not found in your library" }, { status: 404 })
    }

    const newSession = await prisma.readingSession.create({
      data: {
        userId: session.user.id,
        libraryBookId,
        durationMinutes: cleanMinutes,
      },
    })

    if (libraryBook.status === "WANT_TO_READ") {
      await prisma.libraryBook.update({
        where: { id: libraryBookId },
        data: { status: "READING" },
      })
    }

    await awardUserXP({
      userId: session.user.id,
      eventType: "READING_SESSION",
      idempotencyKey: `session:${newSession.id}`,
      xpAmount: Math.min(120, cleanMinutes * 2),
      pointsAmount: 10,
      description: `Completed a ${cleanMinutes}-minute Shanti reading session on "${libraryBook.title}"`,
      sourceId: newSession.id,
      activityType: "READING_SESSION",
    }).catch(() => {})

    const unlockedBadges = await checkAndAwardBadges(session.user.id).catch(() => [])

    return NextResponse.json({ session: newSession, unlockedBadges }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to log reading session" }, { status: 500 })
  }
}
