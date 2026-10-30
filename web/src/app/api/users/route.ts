import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { computeUserStats } from "@/lib/gamification"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id || null

    const { searchParams } = new URL(req.url)
    const query = (searchParams.get("q") || "").trim()
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100)
    const excludeSelf = searchParams.get("excludeSelf") === "true"

    const whereClause: any = {}
    if (excludeSelf && currentUserId) {
      whereClause.id = { not: currentUserId }
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
        { favoriteQuote: { contains: query, mode: "insensitive" } },
        { quoteAuthor: { contains: query, mode: "insensitive" } },
      ]
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        favoriteQuote: true,
        quoteAuthor: true,
        location: true,
        liveStatus: true,
        isShantiModeActive: true,
        createdAt: true,
        books: {
          select: { id: true, price: true, status: true },
        },
        donations: {
          select: { id: true },
        },
        badges: {
          select: {
            earnedAt: true,
            badge: {
              select: { id: true, name: true, iconUrl: true, category: true },
            },
          },
        },
        readingSessions: {
          select: { durationMinutes: true },
        },
        _count: {
          select: { libraryBooks: true },
        },
      },
    })

    const profiles = users.map((u) => {
      const booksListed = u.books.length
      const freeBooksCount = u.books.filter((b) => b.price === 0).length
      const booksDonated = Math.max(u.donations.length, freeBooksCount)
      const badgesEarned = u.badges.length
      const readingMinutes = u.readingSessions.reduce(
        (acc, s) => acc + s.durationMinutes,
        0
      )
      const computed = computeUserStats({
        booksListed,
        booksDonated,
        badgesEarned,
        readingMinutes,
        libraryCount: u._count.libraryBooks,
      })

      return {
        id: u.id,
        name: u.name || u.email?.split("@")[0] || "Reader",
        image: u.image,
        bio: u.bio,
        favoriteQuote: u.favoriteQuote,
        quoteAuthor: u.quoteAuthor,
        location: u.location,
        liveStatus: u.liveStatus,
        isShantiModeActive: u.isShantiModeActive,
        createdAt: u.createdAt,
        badges: u.badges.map((ub) => ub.badge),
        stats: computed,
      }
    })

    return NextResponse.json(profiles)
  } catch (error) {
    console.error("Users search error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

