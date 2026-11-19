import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  checkAndAwardBadges,
  ensureDefaultBadges,
  ensureDefaultQuests,
  getBadgeProgressMap,
  toDayKey,
  toWeekKey,
} from "@/services/badgeService"
import { computeUserStats } from "@/lib/gamification"
import { isUserOnline } from "@/lib/messaging/service"
import { ProfileEcosystemClient } from "@/components/profile/ProfileEcosystemClient"
import type { DailyContribution } from "@/components/profile/ContributionGraph"

export const dynamic = "force-dynamic"

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id: rawParam } = await params
  const sp = await searchParams
  const session = await auth()

  if (rawParam === "me") {
    if (!session?.user?.id) {
      redirect("/login")
    }
    redirect(`/profile/${session.user.id}`)
  }

  // Resolve by ID, unique @username, or active session fallback
  let targetUser = await prisma.user.findUnique({
    where: { id: rawParam },
    select: { id: true },
  })
  if (!targetUser) {
    targetUser = await prisma.user.findUnique({
      where: { username: rawParam.toLowerCase() },
      select: { id: true },
    })
  }
  if (!targetUser && session?.user?.id) {
    // If the user clicked their own profile link with a pre-migration UUID, redirect to their synced session user ID
    const sessionUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })
    if (sessionUser) {
      targetUser = sessionUser
    }
  }
  if (!targetUser) {
    notFound()
  }

  // Evaluate achievements and ensure quests exist
  const [, allBadges, allQuests] = await Promise.all([
    checkAndAwardBadges(targetUser.id),
    ensureDefaultBadges(),
    ensureDefaultQuests(),
  ])

  const user = await prisma.user.findUnique({
    where: { id: targetUser.id },
    include: {
      books: { orderBy: { createdAt: "desc" } },
      donations: { orderBy: { createdAt: "desc" } },
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
      libraryBooks: { orderBy: { updatedAt: "desc" } },
      readingSessions: { orderBy: { createdAt: "desc" } },
      bookNotes: { orderBy: { createdAt: "desc" } },
      reviewsGiven: { orderBy: { createdAt: "desc" } },
      clubPosts: { orderBy: { createdAt: "desc" } },
      clubMemberships: true,
      orders: { where: { status: "PAID" }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" }, take: 40 },
      xpTransactions: {
        where: { reversedAt: null },
        orderBy: { createdAt: "desc" },
        take: 40,
      },
      questClaims: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === user.id

  // Check if current viewer follows this user (and if they follow back for Shanti status visibility)
  const [followRecord, reverseFollowRecord] =
    session?.user?.id && !isOwnProfile
      ? await Promise.all([
          prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: user.id,
              },
            },
          }),
          prisma.userFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: user.id,
                followingId: session.user.id,
              },
            },
          }),
        ])
      : [null, null]

  const canSeeShantiStatus =
    isOwnProfile || (Boolean(followRecord) && Boolean(reverseFollowRecord))

  const booksRead = user.libraryBooks.filter((b) => b.status === "READ").length
  const booksCurrentlyReading = user.libraryBooks.filter(
    (b) => b.status === "READING"
  ).length
  const booksWantToRead = user.libraryBooks.filter(
    (b) => b.status === "WANT_TO_READ"
  ).length
  const readingMinutes = user.readingSessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0
  )
  const freeBooksCount = user.books.filter(
    (b) => b.price === 0 || b.status === "DONATED"
  ).length
  const booksDonated = Math.max(user.donations.length, freeBooksCount)
  const txBonusXP = user.xpTransactions.reduce((acc, t) => acc + t.xpAmount, 0)

  const computedStats = computeUserStats({
    booksListed: user.books.length,
    booksDonated,
    badgesEarned: user.badges.length,
    readingMinutes,
    libraryCount: user.libraryBooks.length,
    booksCompleted: booksRead,
    reviewsCount: user.reviewsGiven.length,
    booksSold: user.booksSold,
    purchasesCount: user.orders.length,
    clubPostsCount: user.clubPosts.length,
    bonusXP: txBonusXP,
  })

  // Compute global leaderboard rank (among users who haven't opted out)
  const higherXpUsersCount = user.leaderboardOptOut
    ? null
    : await prisma.user.count({
        where: {
          leaderboardOptOut: false,
          totalXP: { gt: user.totalXP },
        },
      })
  const leaderboardRank =
    higherXpUsersCount !== null ? higherXpUsersCount + 1 : null

  // Build 365-Day Contribution Heatmap from real platform records
  const contributions: Record<string, DailyContribution> = {}
  const addContribution = (
    date: Date,
    domain: "reading" | "marketplace" | "community",
    label: string
  ) => {
    const key = toDayKey(date)
    if (!contributions[key]) {
      contributions[key] = {
        date: key,
        total: 0,
        reading: 0,
        marketplace: 0,
        community: 0,
        items: [],
      }
    }
    contributions[key].total += 1
    contributions[key][domain] += 1
    if (contributions[key].items.length < 5) {
      contributions[key].items.push(label)
    }
  }

  for (const s of user.readingSessions) {
    addContribution(
      s.createdAt,
      "reading",
      `Read ${s.durationMinutes}m in Shanti Mode`
    )
  }
  for (const lb of user.libraryBooks) {
    if (lb.status === "READ") {
      addContribution(lb.updatedAt, "reading", `Completed "${lb.title}"`)
    }
  }
  for (const b of user.books) {
    addContribution(b.createdAt, "marketplace", `Listed "${b.title}"`)
  }
  for (const d of user.donations) {
    addContribution(d.createdAt, "marketplace", "Vidya Daan book donation")
  }
  for (const r of user.reviewsGiven) {
    addContribution(r.createdAt, "community", `Published ${r.rating}★ review`)
  }
  for (const n of user.bookNotes) {
    addContribution(
      n.createdAt,
      "community",
      `Saved highlight in "${n.bookTitle}"`
    )
  }
  for (const p of user.clubPosts) {
    addContribution(p.createdAt, "community", "Posted in Sabha Book Club")
  }
  for (const act of user.activities) {
    addContribution(act.occurredAt, "community", act.title)
  }

  // Build Unified Activity Timeline (combining UserActivity + real milestones)
  const activityFeed: {
    id: string
    type: string
    title: string
    subtitle?: string | null
    xpEarned: number
    occurredAt: string
  }[] = [
    ...user.activities.map((a) => ({
      id: a.id,
      type: a.activityType,
      title: a.title,
      subtitle: a.subtitle,
      xpEarned: a.xpEarned,
      occurredAt: a.occurredAt.toISOString(),
    })),
    ...user.badges.slice(0, 10).map((ub) => ({
      id: `badge-${ub.id}`,
      type: "BADGE_UNLOCKED",
      title: `Earned achievement "${ub.badge.name}" (${ub.badge.rarity})`,
      xpEarned: ub.badge.xpReward || 50,
      occurredAt: ub.earnedAt.toISOString(),
    })),
    ...user.books.slice(0, 8).map((b) => ({
      id: `book-${b.id}`,
      type: b.price === 0 ? "BOOK_DONATED" : "BOOK_LISTED",
      title: `${b.price === 0 ? "Donated / Shared" : "Listed"} "${b.title}" by ${
        b.author
      }`,
      xpEarned: b.price === 0 ? 100 : 25,
      occurredAt: b.createdAt.toISOString(),
    })),
    ...user.readingSessions.slice(0, 8).map((s) => ({
      id: `session-${s.id}`,
      type: "READING_SESSION",
      title: `Completed a ${s.durationMinutes}-minute Shanti reading session`,
      xpEarned: Math.min(120, s.durationMinutes * 2),
      occurredAt: s.createdAt.toISOString(),
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, 30)

  // Map Achievements with Progress & Pinned status
  const progressMap = getBadgeProgressMap({
    readingSessions: user.readingSessions,
    libraryBooks: user.libraryBooks,
    books: user.books,
    donations: user.donations,
    reviewsGiven: user.reviewsGiven,
    bookNotes: user.bookNotes,
    clubPosts: user.clubPosts,
    clubMemberships: user.clubMemberships,
    booksSold: user.booksSold,
    successfulExchanges: user.successfulExchanges,
    sellerRating: user.sellerRating,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    level: computedStats.level,
  })

  const userBadgeMap = new Map(user.badges.map((ub) => [ub.badgeId, ub]))
  const allAchievements = allBadges.map((b) => {
    const ub = userBadgeMap.get(b.id)
    return {
      id: b.id,
      code: b.code,
      name: b.name,
      description: b.description,
      category: b.category,
      rarity: b.rarity || "COMMON",
      requirementThreshold: b.requirementThreshold,
      xpReward: b.xpReward || 50,
      pointsReward: b.pointsReward || 25,
      unlocked: Boolean(ub),
      earnedAt: ub ? ub.earnedAt.toISOString() : null,
      isPinned: Boolean(ub?.isPinned),
      progress: progressMap[b.metricKey] ?? (ub ? b.requirementThreshold : 0),
    }
  })

  // Quests progress for own profile
  const todayKey = toDayKey()
  const weekKey = toWeekKey()
  const todayStart = new Date(`${todayKey}T00:00:00Z`)
  const weekAgo = new Date(Date.now() - 7 * 86400000)

  const readingMinutesToday = user.readingSessions
    .filter((s) => s.createdAt >= todayStart)
    .reduce((sum, s) => sum + s.durationMinutes, 0)
  const sessionsWeek = user.readingSessions.filter(
    (s) => s.createdAt >= weekAgo
  ).length

  const questMetrics: Record<string, number> = {
    READING_MINUTES_TODAY: readingMinutesToday,
    LIBRARY_COUNT: user.libraryBooks.length,
    NOTES_AND_CLUBS: user.bookNotes.length + user.clubPosts.length,
    READING_SESSIONS_WEEK: sessionsWeek,
    BOOKS_SHARED_TOTAL: user.books.length + user.donations.length,
    EVENT_SCORE:
      readingMinutes >= 30 || user.books.length + user.donations.length >= 1
        ? 1
        : 0,
  }

  const claimSet = new Set(
    user.questClaims.map((c) => `${c.questId}:${c.periodKey}`)
  )
  const enrichedQuests = allQuests.map((q) => {
    const periodKey =
      q.category === "DAILY"
        ? todayKey
        : q.category === "WEEKLY"
        ? weekKey
        : "EVENT"
    const progress = Math.min(q.targetCount, questMetrics[q.metricKey] ?? 0)
    return {
      id: q.id,
      code: q.code,
      name: q.name,
      description: q.description,
      category: q.category,
      targetCount: q.targetCount,
      progress,
      rewardXp: q.rewardXp,
      rewardPoints: q.rewardPoints,
      cosmeticReward: q.cosmeticReward,
      completed: progress >= q.targetCount,
      claimed: claimSet.has(`${q.id}:${periodKey}`),
    }
  })

  const username =
    user.username ||
    user.email?.split("@")[0] ||
    (user.name || "reader").toLowerCase().replace(/[^a-z0-9]/g, "")

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-8 pb-16">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        <ProfileEcosystemClient
          profileUser={{
            id: user.id,
            name: user.name || username,
            username,
            image: user.image,
            coverImage: user.coverImage || "obsidian",
            profileFrame: user.profileFrame || "classic",
            profileTheme: user.profileTheme || "obsidian",
            selectedTitle: user.selectedTitle,
            bio: user.bio,
            favoriteQuote: user.favoriteQuote,
            quoteAuthor: user.quoteAuthor,
            location: user.location,
            latitude: user.latitude,
            longitude: user.longitude,
            liveStatus: canSeeShantiStatus ? user.liveStatus : null,
            isShantiModeActive: canSeeShantiStatus
              ? user.isShantiModeActive
              : false,
            online: isUserOnline(
              user.lastSeenAt,
              canSeeShantiStatus ? user.isShantiModeActive : false
            ),
            verified:
              Boolean(user.emailVerified) ||
              user.booksSold + user.successfulExchanges + user.donations.length >
                0,
            totalXP: computedStats.totalXP,
            aksharPoints: user.aksharPoints,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            readingGoalBooks: user.readingGoalBooks,
            unlockedCosmetics: user.unlockedCosmetics,
            sellerRating: user.sellerRating,
            responseTime: user.responseTime,
            isPublicProfile: user.isPublicProfile,
            showOnlineStatus: user.showOnlineStatus,
            showReadingActivity: user.showReadingActivity,
            showContributionGraph: user.showContributionGraph,
            leaderboardOptOut: user.leaderboardOptOut,
            createdAt: user.createdAt.toISOString(),
            books: user.books,
            libraryBooks: user.libraryBooks,
          }}
          computedStats={computedStats}
          detailedMetrics={{
            booksRead,
            booksCurrentlyReading,
            booksWantToRead,
            totalReadingSessions: user.readingSessions.length,
            readingMinutes,
            reviewsPublished: user.reviewsGiven.length,
            notesPublished: user.bookNotes.length,
            booksListed: user.books.length,
            booksSold: user.booksSold + user.successfulExchanges,
            purchasesCount: user.orders.length,
            booksDonated,
            clubPostsCount: user.clubPosts.length,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            leaderboardRank,
          }}
          allAchievements={allAchievements}
          contributions={contributions}
          activityFeed={activityFeed}
          questsData={{
            dailyCheckedInToday: user.lastDailyClaimDate === todayKey,
            dailyClaimStreak: user.dailyClaimStreak,
            quests: enrichedQuests,
          }}
          xpLedger={user.xpTransactions.map((t) => ({
            id: t.id,
            eventType: t.eventType,
            xpAmount: t.xpAmount,
            pointsAmount: t.pointsAmount,
            description: t.description,
            createdAt: t.createdAt.toISOString(),
          }))}
          isOwnProfile={isOwnProfile}
          initialFollowing={Boolean(followRecord)}
          initialTab={sp.tab || "overview"}
        />
      </div>
    </div>
  )
}
