import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { cached } from "@/lib/fastCache"
import { computeUserStats } from "@/lib/gamification"
import { getMutualFollowIds } from "@/lib/shantiVisibility"
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
  const [session, resolvedSearch, baseData] = await Promise.all([
    auth(),
    searchParams,
    cached("leaderboard:base", 30_000, async () => {
      const rawUsers = await prisma.user.findMany({
        where: {
          leaderboardOptOut: false,
        },
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
          booksSold: true,
          books: {
            select: { price: true, status: true },
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
          libraryBooks: {
            select: { status: true },
          },
          xpTransactions: {
            where: { reversedAt: null },
            select: { xpAmount: true },
          },
          _count: {
            select: {
              donations: true,
              reviewsGiven: true,
              clubPosts: true,
              orders: { where: { status: "PAID" } },
            },
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

      const entries = rawUsers.map((u) => {
        const booksListed = u.books.length
        const freeBooks = u.books.filter(
          (b) => b.price === 0 || b.status === "DONATED"
        ).length
        const booksDonated = Math.max(u._count.donations, freeBooks)
        const badgesEarned = u.badges.length
        const readingMinutes = u.readingSessions.reduce(
          (acc, s) => acc + s.durationMinutes,
          0
        )
        const booksCompleted = u.libraryBooks.filter(
          (lb) => lb.status === "READ"
        ).length
        const bonusXP = u.xpTransactions.reduce((acc, t) => acc + t.xpAmount, 0)

        const stats = computeUserStats({
          booksListed,
          booksDonated,
          badgesEarned,
          readingMinutes,
          libraryCount: u.libraryBooks.length,
          booksCompleted,
          reviewsCount: u._count.reviewsGiven,
          booksSold: u.booksSold,
          purchasesCount: u._count.orders,
          clubPostsCount: u._count.clubPosts,
          bonusXP,
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
          rawLiveStatus: u.liveStatus,
          rawShantiActive: u.isShantiModeActive,
          badges: u.badges.map((ub) => ub.badge),
          stats,
        }
      })

      return { overview, entries }
    }),
  ])

  const mutualIds = await getMutualFollowIds(session?.user?.id)

  const users: LeaderboardUserEntry[] = baseData.entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    image: entry.image,
    bio: entry.bio,
    favoriteQuote: entry.favoriteQuote,
    quoteAuthor: entry.quoteAuthor,
    location: entry.location,
    liveStatus: mutualIds.has(entry.id) ? entry.rawLiveStatus : null,
    isShantiModeActive: mutualIds.has(entry.id) ? entry.rawShantiActive : false,
    badges: entry.badges,
    stats: entry.stats,
  }))

  return (
    <LeaderboardClient
      users={users}
      overview={baseData.overview}
      currentUserId={session?.user?.id || null}
      initialTab={resolvedSearch.tab}
    />
  )
}
