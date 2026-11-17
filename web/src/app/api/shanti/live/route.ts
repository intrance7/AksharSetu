import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { getMutualFollowIds } from "@/lib/shantiVisibility"

export async function GET() {
  try {
    const session = await auth()
    const viewerId = session?.user?.id || null

    if (!viewerId) {
      return NextResponse.json({
        liveCount: 0,
        mutualCount: 0,
        readers: [],
      })
    }

    const mutualIds = await getMutualFollowIds(viewerId)
    const allowedUserIds = Array.from(mutualIds)
    const mutualCount = Math.max(0, allowedUserIds.length - 1)

    const [activeUsers, recentSessions] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { in: allowedUserIds },
          isShantiModeActive: true,
        },
        select: {
          id: true,
          name: true,
          image: true,
          liveStatus: true,
          favoriteQuote: true,
          readingSessions: {
            select: { durationMinutes: true },
          },
        },
        take: 10,
      }),
      prisma.readingSession.findMany({
        where: {
          userId: { in: allowedUserIds },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              isShantiModeActive: true,
              liveStatus: true,
            },
          },
          libraryBook: {
            select: {
              title: true,
              author: true,
              gutenbergId: true,
              platformBookId: true,
            },
          },
        },
      }),
    ])

    const activeFormatted = activeUsers.map((u) => ({
      userId: u.id,
      name: u.name || "Reader",
      image: u.image,
      isLive: true,
      statusText: u.liveStatus || "Focusing in Shanti Mode",
      totalMinutes: u.readingSessions.reduce(
        (acc, s) => acc + s.durationMinutes,
        0
      ),
      ebookId: null as string | null,
    }))

    const seenIds = new Set(activeFormatted.map((u) => u.userId))
    const recentFormatted = []

    for (const s of recentSessions) {
      if (seenIds.has(s.user.id)) continue
      seenIds.add(s.user.id)
      const ebookId =
        s.libraryBook.gutenbergId !== null
          ? String(s.libraryBook.gutenbergId)
          : s.libraryBook.platformBookId
      recentFormatted.push({
        userId: s.user.id,
        name: s.user.name || "Reader",
        image: s.user.image,
        isLive: s.user.isShantiModeActive,
        statusText: `Focused ${s.durationMinutes}m on "${s.libraryBook.title}"`,
        totalMinutes: s.durationMinutes,
        ebookId,
      })
    }

    return NextResponse.json({
      liveCount: activeFormatted.length,
      mutualCount,
      readers: [...activeFormatted, ...recentFormatted].slice(0, 8),
    })
  } catch (error) {
    console.error("Live readers fetch error:", error)
    return NextResponse.json({ liveCount: 0, mutualCount: 0, readers: [] })
  }
}
