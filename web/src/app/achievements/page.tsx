import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { ensureDefaultBadges, checkAndAwardBadges } from "@/services/badgeService"
import { calculateLevelFromXP, type BadgeRarity } from "@/lib/gamification"
import {
  AchievementsCatalogClient,
  type EnrichedAchievementItem,
} from "@/components/profile/AchievementsCatalogClient"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Achievements & Badge Vault — AksharSetu",
  description:
    "Explore all 34 AksharSetu vector badges, track your unlock progress, and pin up to 6 badges to your profile showcase.",
}

export default async function AchievementsPage() {
  const session = await auth()
  const userId = session?.user?.id || null

  if (userId) {
    await checkAndAwardBadges(userId).catch(() => {})
  }

  const [allBadges, totalUsersCount] = await Promise.all([
    ensureDefaultBadges(),
    prisma.user.count(),
  ])

  const badgeUnlockCounts = await prisma.userBadge.groupBy({
    by: ["badgeId"],
    _count: { badgeId: true },
  })
  const countMap = new Map(
    badgeUnlockCounts.map((g) => [g.badgeId, g._count.badgeId])
  )

  let userMetrics: Record<string, number> = {}
  const unlockedMap = new Map<string, string>()
  let pinnedBadgeIds: string[] = []

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: true,
        books: true,
        donations: true,
        readingSessions: true,
        libraryBooks: true,
        bookNotes: true,
        reviewsGiven: true,
        clubPosts: true,
        clubMemberships: true,
        orders: { where: { status: "PAID" } },
      },
    })

    if (user) {
      for (const ub of user.badges) {
        unlockedMap.set(ub.badgeId, ub.earnedAt.toISOString())
        if (ub.isPinned) {
          pinnedBadgeIds.push(ub.badgeId)
        }
      }

      const booksCompleted = user.libraryBooks.filter(
        (b) => b.status === "READ"
      ).length
      const donatedBooksCount = Math.max(
        user.donations.length,
        user.books.filter((b) => b.price === 0 || b.status === "DONATED").length
      )
      const transactionsCompleted =
        user.booksSold + user.successfulExchanges + user.orders.length
      const reviewsAndNotesCount =
        user.reviewsGiven.length + user.bookNotes.length
      const communityCount =
        user.clubPosts.length +
        user.clubMemberships.length +
        user.bookNotes.length
      const nightSessions = user.readingSessions.filter((s) => {
        const hr = s.createdAt.getHours()
        return hr >= 22 || hr < 5
      }).length

      userMetrics = {
        READING_SESSIONS: user.readingSessions.length,
        BOOKS_COMPLETED: booksCompleted,
        NIGHT_SESSIONS: nightSessions,
        STREAK_DAYS: Math.max(user.currentStreak, user.longestStreak),
        REVIEWS_AND_NOTES: reviewsAndNotesCount,
        BOOKS_LISTED: user.books.length,
        TRANSACTIONS_COMPLETED: transactionsCompleted,
        BOOKS_DONATED: donatedBooksCount,
        FIVE_STAR_SELLER: user.sellerRating >= 4.8 ? 1 : 0,
        COMMUNITY_CONTRIBUTIONS: communityCount,
        LEVEL_REACHED: calculateLevelFromXP(user.totalXP).level,
        SEASONAL_ACTIVE:
          user.books.length +
            user.readingSessions.length +
            user.libraryBooks.length >
          0
            ? 1
            : 0,
      }
    }
  }

  const enrichedBadges: EnrichedAchievementItem[] = allBadges.map((b) => {
    const unlockedAt = unlockedMap.get(b.id) || null
    const unlocked = Boolean(unlockedAt)
    const rawCurrent =
      userMetrics[b.metricKey] ?? (unlocked ? b.requirementThreshold : 0)
    const currentValue = unlocked
      ? Math.max(rawCurrent, b.requirementThreshold)
      : rawCurrent
    const progressPercent = unlocked
      ? 100
      : Math.min(
          99,
          Math.round(
            (currentValue / Math.max(1, b.requirementThreshold)) * 100
          )
        )
    const unlockCount = countMap.get(b.id) || 0
    const communityUnlockPercent =
      totalUsersCount > 0
        ? Math.min(
            100,
            Math.max(1, Math.round((unlockCount / totalUsersCount) * 100))
          )
        : 5

    return {
      id: b.id,
      code: b.code || "first_page",
      name: b.name,
      description: b.description,
      category: b.category,
      rarity: (b.rarity as BadgeRarity) || "COMMON",
      iconUrl: b.iconUrl,
      requirementThreshold: b.requirementThreshold,
      currentValue,
      progressPercent,
      xpReward: b.xpReward,
      pointsReward: b.pointsReward,
      unlocked,
      unlockedAt,
      communityUnlockPercent,
    }
  })

  return (
    <AchievementsCatalogClient
      badges={enrichedBadges}
      initialPinnedIds={pinnedBadgeIds}
      isAuthenticated={Boolean(userId)}
      userId={userId}
    />
  )
}
