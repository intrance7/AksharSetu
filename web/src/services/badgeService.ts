import prisma from "@/lib/prisma"
import {
  calculateLevelFromXP,
  computeUserStats,
  XP_REWARDS,
  type BadgeRarity,
} from "@/lib/gamification"

export interface AchievementDefinition {
  code: string
  name: string
  description: string
  category:
    | "READING"
    | "REVIEW"
    | "MARKETPLACE"
    | "DONATION"
    | "COMMUNITY"
    | "PROGRESSION"
    | "SEASONAL"
  rarity: BadgeRarity
  iconUrl: string
  requirementThreshold: number
  metricKey: string
  xpReward: number
  pointsReward: number
  startsAt?: Date | null
  endsAt?: Date | null
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  // A. READING ACHIEVEMENTS
  {
    code: "first_page",
    name: "First Page",
    description: "Complete your first verified Shanti reading session.",
    category: "READING",
    rarity: "COMMON",
    iconUrl: "/badges/reading/first_page.svg",
    requirementThreshold: 1,
    metricKey: "READING_SESSIONS",
    xpReward: 40,
    pointsReward: 20,
  },
  {
    code: "first_finish",
    name: "First Finish",
    description: "Complete your first book in your reading room.",
    category: "READING",
    rarity: "COMMON",
    iconUrl: "/badges/reading/first_finish.svg",
    requirementThreshold: 1,
    metricKey: "BOOKS_COMPLETED",
    xpReward: 100,
    pointsReward: 40,
  },
  {
    code: "bookworm",
    name: "Bookworm",
    description: "Complete 5 books across your AksharSetu reading shelf.",
    category: "READING",
    rarity: "UNCOMMON",
    iconUrl: "/badges/reading/bookworm.svg",
    requirementThreshold: 5,
    metricKey: "BOOKS_COMPLETED",
    xpReward: 150,
    pointsReward: 60,
  },
  {
    code: "bibliophile",
    name: "Bibliophile",
    description: "Complete 25 books on AksharSetu.",
    category: "READING",
    rarity: "EPIC",
    iconUrl: "/badges/reading/bibliophile.svg",
    requirementThreshold: 25,
    metricKey: "BOOKS_COMPLETED",
    xpReward: 400,
    pointsReward: 150,
  },
  {
    code: "literary_legend",
    name: "Literary Legend",
    description: "Complete 100 books — a true master of the written word.",
    category: "READING",
    rarity: "MYTHIC",
    iconUrl: "/badges/reading/literary_legend.svg",
    requirementThreshold: 100,
    metricKey: "BOOKS_COMPLETED",
    xpReward: 1000,
    pointsReward: 400,
  },
  {
    code: "night_owl",
    name: "Night Owl",
    description: "Complete a mindful reading session during late-night hours (10 PM – 4 AM).",
    category: "READING",
    rarity: "RARE",
    iconUrl: "/badges/reading/night_owl.svg",
    requirementThreshold: 1,
    metricKey: "NIGHT_SESSIONS",
    xpReward: 80,
    pointsReward: 35,
  },
  {
    code: "consistent_reader",
    name: "Consistent Reader",
    description: "Maintain a 7-day reading & literary contribution streak.",
    category: "READING",
    rarity: "RARE",
    iconUrl: "/badges/reading/consistent_reader.svg",
    requirementThreshold: 7,
    metricKey: "STREAK_DAYS",
    xpReward: 150,
    pointsReward: 60,
  },
  {
    code: "unstoppable_reader",
    name: "Unstoppable Reader",
    description: "Maintain a 30-day reading streak without missing a day.",
    category: "READING",
    rarity: "LEGENDARY",
    iconUrl: "/badges/reading/unstoppable_reader.svg",
    requirementThreshold: 30,
    metricKey: "STREAK_DAYS",
    xpReward: 500,
    pointsReward: 200,
  },
  {
    code: "century_reader",
    name: "Century Reader",
    description: "Maintain a 100-day reading & literary engagement streak.",
    category: "READING",
    rarity: "MYTHIC",
    iconUrl: "/badges/reading/century_reader.svg",
    requirementThreshold: 100,
    metricKey: "STREAK_DAYS",
    xpReward: 1200,
    pointsReward: 500,
  },

  // B. REVIEW ACHIEVEMENTS
  {
    code: "first_impression",
    name: "First Impression",
    description: "Publish your first verified review or literary annotation.",
    category: "REVIEW",
    rarity: "COMMON",
    iconUrl: "/badges/reviews/first_impression.svg",
    requirementThreshold: 1,
    metricKey: "REVIEWS_AND_NOTES",
    xpReward: 40,
    pointsReward: 20,
  },
  {
    code: "helpful_voice",
    name: "Helpful Voice",
    description: "Publish 3 verified reviews or passage notes that guide fellow readers.",
    category: "REVIEW",
    rarity: "UNCOMMON",
    iconUrl: "/badges/reviews/helpful_voice.svg",
    requirementThreshold: 3,
    metricKey: "REVIEWS_AND_NOTES",
    xpReward: 90,
    pointsReward: 40,
  },
  {
    code: "critical_thinker",
    name: "Critical Thinker",
    description: "Publish 10 verified reviews and literary passage annotations.",
    category: "REVIEW",
    rarity: "RARE",
    iconUrl: "/badges/reviews/critical_thinker.svg",
    requirementThreshold: 10,
    metricKey: "REVIEWS_AND_NOTES",
    xpReward: 180,
    pointsReward: 70,
  },
  {
    code: "trusted_reviewer",
    name: "Trusted Reviewer",
    description: "Publish 15 verified reviews and annotations with consistent quality.",
    category: "REVIEW",
    rarity: "RARE",
    iconUrl: "/badges/reviews/trusted_reviewer.svg",
    requirementThreshold: 15,
    metricKey: "REVIEWS_AND_NOTES",
    xpReward: 220,
    pointsReward: 90,
  },
  {
    code: "literary_critic",
    name: "Literary Critic",
    description: "Publish 25 verified reviews and critical reflections across the catalog.",
    category: "REVIEW",
    rarity: "EPIC",
    iconUrl: "/badges/reviews/literary_critic.svg",
    requirementThreshold: 25,
    metricKey: "REVIEWS_AND_NOTES",
    xpReward: 350,
    pointsReward: 140,
  },
  {
    code: "community_favourite",
    name: "Community Favourite",
    description: "Publish 50 reviews and literary annotations celebrated by the community.",
    category: "REVIEW",
    rarity: "LEGENDARY",
    iconUrl: "/badges/reviews/community_favourite.svg",
    requirementThreshold: 50,
    metricKey: "REVIEWS_AND_NOTES",
    xpReward: 600,
    pointsReward: 240,
  },

  // C. MARKETPLACE & DONATION ACHIEVEMENTS
  {
    code: "first_listing",
    name: "First Listing",
    description: "List your first book in the AksharSetu catalog.",
    category: "MARKETPLACE",
    rarity: "COMMON",
    iconUrl: "/badges/marketplace/first_listing.svg",
    requirementThreshold: 1,
    metricKey: "BOOKS_LISTED",
    xpReward: 50,
    pointsReward: 25,
  },
  {
    code: "first_sale",
    name: "First Sale",
    description: "Complete your first successful book sale or exchange.",
    category: "MARKETPLACE",
    rarity: "UNCOMMON",
    iconUrl: "/badges/marketplace/first_sale.svg",
    requirementThreshold: 1,
    metricKey: "TRANSACTIONS_COMPLETED",
    xpReward: 80,
    pointsReward: 35,
  },
  {
    code: "trusted_seller",
    name: "Trusted Seller",
    description: "Complete 10 verified book sales or exchanges.",
    category: "MARKETPLACE",
    rarity: "EPIC",
    iconUrl: "/badges/marketplace/trusted_seller.svg",
    requirementThreshold: 10,
    metricKey: "TRANSACTIONS_COMPLETED",
    xpReward: 300,
    pointsReward: 120,
  },
  {
    code: "marketplace_veteran",
    name: "Marketplace Veteran",
    description: "Complete 25 verified book sales, purchases, or exchanges.",
    category: "MARKETPLACE",
    rarity: "LEGENDARY",
    iconUrl: "/badges/marketplace/marketplace_veteran.svg",
    requirementThreshold: 25,
    metricKey: "TRANSACTIONS_COMPLETED",
    xpReward: 550,
    pointsReward: 220,
  },
  {
    code: "generous_collector",
    name: "Generous Collector",
    description: "Donate a book through Vidya Daan or free community handoff.",
    category: "DONATION",
    rarity: "UNCOMMON",
    iconUrl: "/badges/marketplace/generous_collector.svg",
    requirementThreshold: 1,
    metricKey: "BOOKS_DONATED",
    xpReward: 100,
    pointsReward: 50,
  },
  {
    code: "vidya_daan_patron",
    name: "Vidya Daan Patron",
    description: "Donate 5 or more books to students and NGO libraries.",
    category: "DONATION",
    rarity: "LEGENDARY",
    iconUrl: "/badges/marketplace/vidya_daan_patron.svg",
    requirementThreshold: 5,
    metricKey: "BOOKS_DONATED",
    xpReward: 400,
    pointsReward: 180,
  },
  {
    code: "five_star_seller",
    name: "Five-Star Seller",
    description: "Maintain a 4.8+ seller rating with verified transactions.",
    category: "MARKETPLACE",
    rarity: "RARE",
    iconUrl: "/badges/marketplace/five_star_seller.svg",
    requirementThreshold: 1,
    metricKey: "FIVE_STAR_SELLER",
    xpReward: 150,
    pointsReward: 60,
  },

  // D. COMMUNITY ACHIEVEMENTS
  {
    code: "first_contribution",
    name: "First Contribution",
    description: "Make your first public literary note, book request, or club post.",
    category: "COMMUNITY",
    rarity: "COMMON",
    iconUrl: "/badges/community/first_contribution.svg",
    requirementThreshold: 1,
    metricKey: "COMMUNITY_CONTRIBUTIONS",
    xpReward: 40,
    pointsReward: 20,
  },
  {
    code: "conversation_starter",
    name: "Conversation Starter",
    description: "Join a Sabha Book Club or post in a community reading circle.",
    category: "COMMUNITY",
    rarity: "COMMON",
    iconUrl: "/badges/community/conversation_starter.svg",
    requirementThreshold: 2,
    metricKey: "COMMUNITY_CONTRIBUTIONS",
    xpReward: 50,
    pointsReward: 25,
  },
  {
    code: "helpful_member",
    name: "Helpful Member",
    description: "Reach 5 community contributions across Sabha clubs and literary notes.",
    category: "COMMUNITY",
    rarity: "UNCOMMON",
    iconUrl: "/badges/community/helpful_member.svg",
    requirementThreshold: 5,
    metricKey: "COMMUNITY_CONTRIBUTIONS",
    xpReward: 120,
    pointsReward: 50,
  },
  {
    code: "event_participant",
    name: "Event Participant",
    description: "Participate in a campus reading marathon or Vidya Daan community drive.",
    category: "COMMUNITY",
    rarity: "RARE",
    iconUrl: "/badges/community/event_participant.svg",
    requirementThreshold: 1,
    metricKey: "SEASONAL_ACTIVE",
    xpReward: 130,
    pointsReward: 55,
  },
  {
    code: "community_pillar",
    name: "Community Pillar",
    description: "Reach 10 community contributions across Sabha clubs, requests, and notes.",
    category: "COMMUNITY",
    rarity: "EPIC",
    iconUrl: "/badges/community/community_pillar.svg",
    requirementThreshold: 10,
    metricKey: "COMMUNITY_CONTRIBUTIONS",
    xpReward: 250,
    pointsReward: 100,
  },
  {
    code: "community_champion",
    name: "Community Champion",
    description: "Reach 25 community contributions and inspire fellow readers across AksharSetu.",
    category: "COMMUNITY",
    rarity: "LEGENDARY",
    iconUrl: "/badges/community/community_champion.svg",
    requirementThreshold: 25,
    metricKey: "COMMUNITY_CONTRIBUTIONS",
    xpReward: 500,
    pointsReward: 200,
  },

  // E. PROGRESSION ACHIEVEMENTS
  {
    code: "level_5",
    name: "Rising Scholar (Level 5)",
    description: "Reach Level 5 in the AksharSetu progression system.",
    category: "PROGRESSION",
    rarity: "UNCOMMON",
    iconUrl: "/badges/progression/level_5.svg",
    requirementThreshold: 5,
    metricKey: "LEVEL_REACHED",
    xpReward: 100,
    pointsReward: 50,
  },
  {
    code: "level_10",
    name: "Book Enthusiast (Level 10)",
    description: "Reach Level 10 through consistent reading and community impact.",
    category: "PROGRESSION",
    rarity: "RARE",
    iconUrl: "/badges/progression/level_10.svg",
    requirementThreshold: 10,
    metricKey: "LEVEL_REACHED",
    xpReward: 250,
    pointsReward: 100,
  },
  {
    code: "level_25",
    name: "Literary Luminary (Level 25)",
    description: "Reach Level 25 — among the most dedicated scholars on AksharSetu.",
    category: "PROGRESSION",
    rarity: "LEGENDARY",
    iconUrl: "/badges/progression/level_25.svg",
    requirementThreshold: 25,
    metricKey: "LEVEL_REACHED",
    xpReward: 600,
    pointsReward: 250,
  },
  {
    code: "level_50",
    name: "Master Collector (Level 50)",
    description: "Reach Level 50 — a pillar of literary preservation and scholarship.",
    category: "PROGRESSION",
    rarity: "EPIC",
    iconUrl: "/badges/progression/level_50.svg",
    requirementThreshold: 50,
    metricKey: "LEVEL_REACHED",
    xpReward: 1000,
    pointsReward: 400,
  },
  {
    code: "level_100",
    name: "Grand Archivist (Level 100)",
    description: "Reach Level 100 — the pinnacle of the AksharSetu Literary Hall of Fame.",
    category: "PROGRESSION",
    rarity: "MYTHIC",
    iconUrl: "/badges/progression/level_100.svg",
    requirementThreshold: 100,
    metricKey: "LEVEL_REACHED",
    xpReward: 2500,
    pointsReward: 1000,
  },

  // F. SEASONAL ACHIEVEMENT
  {
    code: "seasonal_vidya_utsav",
    name: "Vidya Utsav 2026 Pioneer",
    description: "Participated in the 2026 Campus Literacy & Book Sharing Drive.",
    category: "SEASONAL",
    rarity: "EPIC",
    iconUrl: "/badges/special/seasonal_vidya_utsav.svg",
    requirementThreshold: 1,
    metricKey: "SEASONAL_ACTIVE",
    xpReward: 150,
    pointsReward: 75,
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2027-01-01T00:00:00Z"),
  },
]

export const DEFAULT_QUESTS = [
  {
    code: "daily_read_20",
    name: "Daily Mindful Reader",
    description: "Read for at least 15 minutes in Shanti Mode or the E-Library today.",
    category: "DAILY",
    metricKey: "READING_MINUTES_TODAY",
    targetCount: 15,
    rewardXp: 35,
    rewardPoints: 15,
  },
  {
    code: "daily_shelf_builder",
    name: "Curate Your Shelf",
    description: "Have at least 1 book in your personal reading room or wishlist.",
    category: "DAILY",
    metricKey: "LIBRARY_COUNT",
    targetCount: 1,
    rewardXp: 20,
    rewardPoints: 10,
  },
  {
    code: "daily_community_spark",
    name: "Community Spark",
    description: "Save a literary highlight/note or participate in a Sabha Book Club.",
    category: "DAILY",
    metricKey: "NOTES_AND_CLUBS",
    targetCount: 1,
    rewardXp: 25,
    rewardPoints: 15,
  },
  {
    code: "weekly_three_sessions",
    name: "Focused Scholar",
    description: "Complete 3 reading sessions during the last 7 days.",
    category: "WEEKLY",
    metricKey: "READING_SESSIONS_WEEK",
    targetCount: 3,
    rewardXp: 100,
    rewardPoints: 45,
  },
  {
    code: "weekly_marketplace_impact",
    name: "Circulation Champion",
    description: "List, donate, or exchange at least 1 book with the community.",
    category: "WEEKLY",
    metricKey: "BOOKS_SHARED_TOTAL",
    targetCount: 1,
    rewardXp: 80,
    rewardPoints: 40,
  },
  {
    code: "event_vidya_daan_marathon",
    name: "7-Day Campus Reading & Vidya Daan Event",
    description: "Official Event: Log 30+ reading minutes or share a book to earn the Event reward & Cobalt Frame.",
    category: "EVENT",
    metricKey: "EVENT_SCORE",
    targetCount: 1,
    rewardXp: 150,
    rewardPoints: 80,
    cosmeticReward: "frame:cobalt",
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2027-01-01T00:00:00Z"),
  },
]

export function toDayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function toWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

export async function ensureDefaultBadges() {
  const existing = await prisma.badge.findMany()
  const byName = new Map(existing.map((b) => [b.name.toLowerCase(), b]))
  const byCode = new Map(
    existing.filter((b) => b.code).map((b) => [b.code!, b])
  )

  for (const def of ACHIEVEMENT_CATALOG) {
    const match = byCode.get(def.code) || byName.get(def.name.toLowerCase())
    if (!match) {
      await prisma.badge.create({
        data: {
          code: def.code,
          name: def.name,
          description: def.description,
          category: def.category,
          rarity: def.rarity,
          iconUrl: def.iconUrl,
          requirementThreshold: def.requirementThreshold,
          metricKey: def.metricKey,
          xpReward: def.xpReward,
          pointsReward: def.pointsReward,
          startsAt: def.startsAt || null,
          endsAt: def.endsAt || null,
          isActive: true,
        },
      })
    } else if (!match.code || match.metricKey === "MANUAL" || match.iconUrl !== def.iconUrl) {
      await prisma.badge.update({
        where: { id: match.id },
        data: {
          code: def.code,
          category: def.category,
          rarity: def.rarity,
          iconUrl: def.iconUrl,
          metricKey: def.metricKey,
          xpReward: def.xpReward,
          pointsReward: def.pointsReward,
          startsAt: def.startsAt || null,
          endsAt: def.endsAt || null,
        },
      })
    }
  }

  return prisma.badge.findMany({
    where: { isActive: true },
    orderBy: [{ requirementThreshold: "asc" }, { name: "asc" }],
  })
}

export async function ensureDefaultQuests() {
  const existing = await prisma.quest.findMany()
  const byCode = new Set(existing.map((q) => q.code))

  for (const q of DEFAULT_QUESTS) {
    if (!byCode.has(q.code)) {
      await prisma.quest.create({
        data: {
          code: q.code,
          name: q.name,
          description: q.description,
          category: q.category,
          metricKey: q.metricKey,
          targetCount: q.targetCount,
          rewardXp: q.rewardXp,
          rewardPoints: q.rewardPoints,
          cosmeticReward: q.cosmeticReward || null,
          startsAt: q.startsAt || null,
          endsAt: q.endsAt || null,
          isActive: true,
        },
      })
    }
  }

  return prisma.quest.findMany({
    where: { isActive: true },
    orderBy: { rewardXp: "asc" },
  })
}

/**
 * Idempotently awards XP and optional Akshar Points to a user, records an XpTransaction,
 * logs a UserActivity, and checks for level-up notifications.
 */
export async function awardUserXP(params: {
  userId: string
  eventType: string
  idempotencyKey: string
  xpAmount: number
  pointsAmount?: number
  description: string
  sourceId?: string
  activityType?: string
  visibility?: "PUBLIC" | "PRIVATE"
}) {
  const {
    userId,
    eventType,
    idempotencyKey,
    xpAmount,
    pointsAmount = 0,
    description,
    sourceId,
    activityType,
    visibility = "PUBLIC",
  } = params

  const existingTx = await prisma.xpTransaction.findUnique({
    where: { idempotencyKey },
  })
  if (existingTx) {
    return { alreadyAwarded: true, transaction: existingTx, leveledUp: false }
  }

  const userBefore = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXP: true },
  })
  const prevLevel = calculateLevelFromXP(userBefore?.totalXP || 0).level

  const txRecord = await prisma.$transaction(async (tx) => {
    const createdTx = await tx.xpTransaction.create({
      data: {
        userId,
        eventType,
        idempotencyKey,
        sourceId: sourceId || null,
        xpAmount,
        pointsAmount,
        description,
      },
    })

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        totalXP: { increment: xpAmount },
        aksharPoints: { increment: pointsAmount },
      },
      select: { totalXP: true },
    })

    if (activityType) {
      await tx.userActivity.create({
        data: {
          userId,
          activityType,
          title: description,
          sourceId: sourceId || null,
          xpEarned: xpAmount,
          visibility,
          dayKey: toDayKey(),
        },
      })
    }

    const newLevel = calculateLevelFromXP(updatedUser.totalXP).level
    if (newLevel > prevLevel) {
      await tx.userActivity.create({
        data: {
          userId,
          activityType: "LEVEL_UP",
          title: `Reached Level ${newLevel} (${
            calculateLevelFromXP(updatedUser.totalXP).rankTitle
          })`,
          xpEarned: 0,
          visibility: "PUBLIC",
          dayKey: toDayKey(),
        },
      })
      await tx.notification.create({
        data: {
          userId,
          type: "LEVEL_UP",
          message: `🎉 Level Up! You reached Level ${newLevel} (${
            calculateLevelFromXP(updatedUser.totalXP).rankTitle
          }).`,
          link: `/profile/${userId}`,
        },
      })
    }

    return { createdTx, newLevel }
  })

  return {
    alreadyAwarded: false,
    transaction: txRecord.createdTx,
    leveledUp: txRecord.newLevel > prevLevel,
    newLevel: txRecord.newLevel,
  }
}

/**
 * Evaluates all user metrics, computes streaks from real daily activity dates,
 * unlocks newly qualified achievements idempotently, and syncs User.totalXP.
 */
export async function checkAndAwardBadges(userId: string) {
  if (!userId) return []

  const allBadges = await ensureDefaultBadges()

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
      reviewsReceived: true,
      clubPosts: true,
      clubMemberships: true,
      orders: { where: { status: "PAID" } },
      xpTransactions: { where: { reversedAt: null } },
    },
  })

  if (!user) return []

  // Compute real daily activity dates for streak calculation
  const activeDaySet = new Set<string>()
  for (const s of user.readingSessions) activeDaySet.add(toDayKey(s.createdAt))
  for (const b of user.books) activeDaySet.add(toDayKey(b.createdAt))
  for (const d of user.donations) activeDaySet.add(toDayKey(d.createdAt))
  for (const n of user.bookNotes) activeDaySet.add(toDayKey(n.createdAt))
  for (const p of user.clubPosts) activeDaySet.add(toDayKey(p.createdAt))
  for (const r of user.reviewsGiven) activeDaySet.add(toDayKey(r.createdAt))
  if (user.lastDailyClaimDate) activeDaySet.add(user.lastDailyClaimDate)

  const sortedDays = Array.from(activeDaySet).sort()
  let longestStreak = 0
  let running = 0
  let prevDateMs: number | null = null

  for (const dayStr of sortedDays) {
    const ms = new Date(`${dayStr}T00:00:00Z`).getTime()
    if (prevDateMs !== null && Math.round((ms - prevDateMs) / 86400000) === 1) {
      running += 1
    } else {
      running = 1
    }
    if (running > longestStreak) longestStreak = running
    prevDateMs = ms
  }

  const todayStr = toDayKey(new Date())
  const yesterdayStr = toDayKey(new Date(Date.now() - 86400000))
  let currentStreak = 0
  if (activeDaySet.has(todayStr) || activeDaySet.has(yesterdayStr)) {
    let cursorMs = activeDaySet.has(todayStr)
      ? new Date(`${todayStr}T00:00:00Z`).getTime()
      : new Date(`${yesterdayStr}T00:00:00Z`).getTime()
    while (activeDaySet.has(toDayKey(new Date(cursorMs)))) {
      currentStreak += 1
      cursorMs -= 86400000
    }
  }

  longestStreak = Math.max(longestStreak, user.longestStreak, currentStreak)

  const booksCompleted = user.libraryBooks.filter((b) => b.status === "READ").length
  const donatedBooksCount = Math.max(
    user.donations.length,
    user.books.filter((b) => b.price === 0 || b.status === "DONATED").length
  )
  const transactionsCompleted =
    user.booksSold + user.successfulExchanges + user.orders.length
  const reviewsAndNotesCount = user.reviewsGiven.length + user.bookNotes.length
  const communityCount =
    user.clubPosts.length + user.clubMemberships.length + user.bookNotes.length
  const nightSessions = user.readingSessions.filter((s) => {
    const hr = s.createdAt.getHours()
    return hr >= 22 || hr < 5
  }).length
  const readingMinutes = user.readingSessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0
  )
  const txBonusXP = user.xpTransactions.reduce((acc, t) => acc + t.xpAmount, 0)

  const computed = computeUserStats({
    booksListed: user.books.length,
    booksDonated: donatedBooksCount,
    badgesEarned: user.badges.length,
    readingMinutes,
    libraryCount: user.libraryBooks.length,
    booksCompleted,
    reviewsCount: user.reviewsGiven.length,
    booksSold: user.booksSold,
    purchasesCount: user.orders.length,
    clubPostsCount: user.clubPosts.length,
    bonusXP: txBonusXP,
  })

  const metricValues: Record<string, number> = {
    READING_SESSIONS: user.readingSessions.length,
    BOOKS_COMPLETED: booksCompleted,
    NIGHT_SESSIONS: nightSessions,
    STREAK_DAYS: Math.max(currentStreak, longestStreak),
    REVIEWS_AND_NOTES: reviewsAndNotesCount,
    BOOKS_LISTED: user.books.length,
    TRANSACTIONS_COMPLETED: transactionsCompleted,
    BOOKS_DONATED: donatedBooksCount,
    FIVE_STAR_SELLER:
      user.sellerRating >= 4.8 &&
      user.booksSold + user.successfulExchanges + user.books.length >= 1
        ? 1
        : 0,
    COMMUNITY_CONTRIBUTIONS: communityCount,
    LEVEL_REACHED: computed.level,
    SEASONAL_ACTIVE:
      user.books.length + user.readingSessions.length + user.libraryBooks.length >
      0
        ? 1
        : 0,
  }

  const currentBadgeIds = new Set(user.badges.map((ub) => ub.badgeId))
  const now = new Date()
  const newlyUnlocked: typeof allBadges = []

  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue
    if (badge.startsAt && now < badge.startsAt) continue
    if (badge.endsAt && now > badge.endsAt) continue

    const val = metricValues[badge.metricKey] ?? 0
    let qualifies = val >= badge.requirementThreshold

    // Fallback for custom/legacy badges without a specific metricKey
    if (!qualifies && badge.metricKey === "MANUAL") {
      if (badge.category === "DONATION" && donatedBooksCount >= badge.requirementThreshold) {
        qualifies = true
      } else if (
        badge.category === "COMMUNITY" &&
        communityCount + user.readingSessions.length >= badge.requirementThreshold
      ) {
        qualifies = true
      } else if (
        badge.category === "TRUST" &&
        (transactionsCompleted >= badge.requirementThreshold || Boolean(user.bio))
      ) {
        qualifies = true
      }
    }

    if (qualifies) {
      newlyUnlocked.push(badge)
    }
  }

  if (newlyUnlocked.length > 0) {
    await prisma.userBadge.createMany({
      data: newlyUnlocked.map((b) => ({
        userId: user.id,
        badgeId: b.id,
      })),
      skipDuplicates: true,
    })

    for (const b of newlyUnlocked) {
      await awardUserXP({
        userId: user.id,
        eventType: "BADGE_UNLOCKED",
        idempotencyKey: `badge:${user.id}:${b.id}`,
        xpAmount: b.xpReward || 50,
        pointsAmount: b.pointsReward || 25,
        description: `Unlocked "${b.name}" (${b.rarity})`,
        sourceId: b.id,
        activityType: "BADGE_UNLOCKED",
      }).catch(() => {})
    }

    await prisma.notification.createMany({
      data: newlyUnlocked.map((b) => ({
        userId: user.id,
        type: "BADGE_EARNED",
        message: `🏆 Achievement Unlocked: "${b.name}" (+${b.xpReward} XP)!`,
        link: `/profile/${user.id}?tab=achievements`,
      })),
    })
  }

  // Sync user's authoritative totalXP, streak, and default username if unset
  const fallbackUsername =
    user.username ||
    `${(user.name || user.email?.split("@")[0] || "reader")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16)}_${user.id.slice(0, 4)}`

  await prisma.user
    .update({
      where: { id: user.id },
      data: {
        totalXP: Math.max(user.totalXP, computed.totalXP),
        currentStreak,
        longestStreak,
        lastStreakDate: sortedDays[sortedDays.length - 1] || null,
        ...(!user.username ? { username: fallbackUsername } : {}),
      },
    })
    .catch(() => {})

  return newlyUnlocked
}

export function getBadgeProgressMap(user: {
  readingSessions: { createdAt: Date }[]
  libraryBooks: { status: string }[]
  books: { price: number; status: string }[]
  donations: unknown[]
  reviewsGiven: unknown[]
  bookNotes: unknown[]
  clubPosts: unknown[]
  clubMemberships: unknown[]
  booksSold: number
  successfulExchanges: number
  sellerRating: number
  currentStreak: number
  longestStreak: number
  level: number
}): Record<string, number> {
  const booksCompleted = user.libraryBooks.filter((b) => b.status === "READ").length
  const donatedBooksCount = Math.max(
    user.donations.length,
    user.books.filter((b) => b.price === 0 || b.status === "DONATED").length
  )
  const nightSessions = user.readingSessions.filter((s) => {
    const hr = new Date(s.createdAt).getHours()
    return hr >= 22 || hr < 5
  }).length

  return {
    READING_SESSIONS: user.readingSessions.length,
    BOOKS_COMPLETED: booksCompleted,
    NIGHT_SESSIONS: nightSessions,
    STREAK_DAYS: Math.max(user.currentStreak, user.longestStreak),
    REVIEWS_AND_NOTES: user.reviewsGiven.length + user.bookNotes.length,
    BOOKS_LISTED: user.books.length,
    TRANSACTIONS_COMPLETED: user.booksSold + user.successfulExchanges,
    BOOKS_DONATED: donatedBooksCount,
    FIVE_STAR_SELLER:
      user.sellerRating >= 4.8 &&
      user.booksSold + user.successfulExchanges + user.books.length >= 1
        ? 1
        : 0,
    COMMUNITY_CONTRIBUTIONS:
      user.clubPosts.length + user.clubMemberships.length + user.bookNotes.length,
    LEVEL_REACHED: user.level,
    SEASONAL_ACTIVE:
      user.books.length + user.readingSessions.length + user.libraryBooks.length >
      0
        ? 1
        : 0,
  }
}
