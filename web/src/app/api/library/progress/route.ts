import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { awardUserXP, checkAndAwardBadges } from "@/services/badgeService"
import { XP_REWARDS } from "@/lib/gamification"

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
    const { libraryBookId, bookKey, currentPage, totalPages } = body

    const parsedPage = Number(currentPage)
    const parsedTotal = Number(totalPages)
    const pageNum = Math.max(
      1,
      Math.min(50000, Number.isFinite(parsedPage) ? Math.round(parsedPage) : 1)
    )
    const totalNum = Math.max(
      pageNum,
      Math.min(50000, Number.isFinite(parsedTotal) && parsedTotal > 0 ? Math.round(parsedTotal) : 250)
    )

    let targetBook = null

    if (libraryBookId) {
      targetBook = await prisma.libraryBook.findFirst({
        where: { id: String(libraryBookId), userId: session.user.id },
      })
    } else if (bookKey !== undefined && bookKey !== null) {
      const keyStr = String(bookKey)
      if (/^\d+$/.test(keyStr)) {
        targetBook = await prisma.libraryBook.findFirst({
          where: { userId: session.user.id, gutenbergId: Number(keyStr) },
        })
      } else {
        targetBook = await prisma.libraryBook.findFirst({
          where: { userId: session.user.id, platformBookId: keyStr },
        })
      }
    }

    if (!targetBook) {
      return NextResponse.json({ synced: false }, { status: 200 })
    }

    const nextStatus =
      pageNum >= totalNum
        ? "READ"
        : targetBook.status === "WANT_TO_READ" && pageNum > 1
        ? "READING"
        : targetBook.status

    const updated = await prisma.libraryBook.update({
      where: { id: targetBook.id },
      data: {
        currentPage: pageNum,
        totalPages: totalNum,
        status: nextStatus,
      },
    })

    if (nextStatus === "READ" && targetBook.status !== "READ") {
      await awardUserXP({
        userId: session.user.id,
        eventType: "BOOK_COMPLETED",
        idempotencyKey: `book_completed:${session.user.id}:${targetBook.id}`,
        xpAmount: XP_REWARDS.BOOK_COMPLETED,
        pointsAmount: 40,
        description: `Completed reading "${targetBook.title}" by ${targetBook.author}`,
        sourceId: targetBook.id,
        activityType: "BOOK_COMPLETED",
      }).catch(() => {})
      await checkAndAwardBadges(session.user.id).catch(() => {})
    }

    return NextResponse.json({ synced: true, book: updated })
  } catch (error) {
    console.error("Progress sync error:", error)
    return NextResponse.json({ error: "Failed to sync progress" }, { status: 500 })
  }
}
