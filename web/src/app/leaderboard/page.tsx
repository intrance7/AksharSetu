import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { computeUserStats } from "@/lib/gamification"
import {
  LeaderboardClient,
  LeaderboardUserEntry,
  CommunityOverviewStats,
} from "@/components/leaderboard/LeaderboardClient"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  const resolvedSearch = await searchParams

  const rawUsers = await prisma.user.findMany({
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
      books: {
        select: { id: true, price: true },
      },
      donations: {
        select: { id: true },
      },
      badges: {
        select: {
          badge: {
            select: { id: true, name: true, iconUrl: true },
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

  const overview: CommunityOverviewStats = {
    totalReaders: rawUsers.length,
    totalBooksListed: 0,
    totalBooksDonated: 0,
    totalReadingMinutes: 0,
    totalBadgesEarned: 0,
    totalCommunityXP: 0,
  }

  const users: LeaderboardUserEntry[] = rawUsers.map((u) => {
    const booksListed = u.books.length
    const freeBooks = u.books.filter((b) => b.price === 0).length
    const booksDonated = Math.max(u.donations.length, freeBooks)
    const badgesEarned = u.badges.length
    const readingMinutes = u.readingSessions.reduce(
      (acc, s) => acc + s.durationMinutes,
      0
    )

    const stats = computeUserStats({
      booksListed,
      booksDonated,
      badgesEarned,
      readingMinutes,
      libraryCount: u._count.libraryBooks,
    })

    overview.totalBooksListed += booksListed
    overview.totalBooksDonated += booksDonated
    overview.totalReadingMinutes += readingMinutes
    overview.totalBadgesEarned += badgesEarned
    overview.totalCommunityXP += stats.totalXP

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
      badges: u.badges.map((ub) => ub.badge),
      stats,
    }
  })

  return (
    <LeaderboardClient
      users={users}
      overview={overview}
      currentUserId={session?.user?.id || null}
      initialTab={resolvedSearch.tab}
    />
  )
}
