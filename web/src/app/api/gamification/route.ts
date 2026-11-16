import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  ensureDefaultQuests,
  awardUserXP,
  checkAndAwardBadges,
  toDayKey,
  toWeekKey,
} from "@/services/badgeService"
import { COSMETIC_CATALOG, XP_REWARDS } from "@/lib/gamification"

async function computeQuestMetrics(userId: string) {
  const now = new Date()
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const weekAgo = new Date(Date.now() - 7 * 86400000)

  const [
    sessionsToday,
    sessionsWeek,
    libraryCount,
    notesCount,
    clubPostsCount,
    booksListedCount,
    donationsCount,
    allSessions,
  ] = await Promise.all([
    prisma.readingSession.findMany({
      where: { userId, createdAt: { gte: todayStart } },
      select: { durationMinutes: true },
    }),
    prisma.readingSession.count({
      where: { userId, createdAt: { gte: weekAgo } },
    }),
    prisma.libraryBook.count({ where: { userId } }),
    prisma.bookNote.count({ where: { userId } }),
    prisma.bookClubPost.count({ where: { authorId: userId } }),
    prisma.book.count({ where: { ownerId: userId } }),
    prisma.donation.count({ where: { donorId: userId } }),
    prisma.readingSession.findMany({
      where: { userId },
      select: { durationMinutes: true },
    }),
  ])

  const readingMinutesToday = sessionsToday.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  )
  const totalReadingMinutes = allSessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  )

  return {
    READING_MINUTES_TODAY: readingMinutesToday,
    LIBRARY_COUNT: libraryCount,
    NOTES_AND_CLUBS: notesCount + clubPostsCount,
    READING_SESSIONS_WEEK: sessionsWeek,
    BOOKS_SHARED_TOTAL: booksListedCount + donationsCount,
    EVENT_SCORE:
      totalReadingMinutes >= 30 || booksListedCount + donationsCount >= 1
        ? 1
        : 0,
  } as Record<string, number>
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const [quests, user, claims, metrics, xpHistory] = await Promise.all([
      ensureDefaultQuests(),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          totalXP: true,
          aksharPoints: true,
          currentStreak: true,
          longestStreak: true,
          lastDailyClaimDate: true,
          dailyClaimStreak: true,
          unlockedCosmetics: true,
          profileFrame: true,
          coverImage: true,
        },
      }),
      prisma.userQuestClaim.findMany({
        where: { userId },
      }),
      computeQuestMetrics(userId),
      prisma.xpTransaction.findMany({
        where: { userId, reversedAt: null },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ])

    const todayKey = toDayKey()
    const weekKey = toWeekKey()
    const claimSet = new Set(claims.map((c) => `${c.questId}:${c.periodKey}`))

    const enrichedQuests = quests.map((q) => {
      const periodKey =
        q.category === "DAILY"
          ? todayKey
          : q.category === "WEEKLY"
          ? weekKey
          : "EVENT"
      const progress = Math.min(q.targetCount, metrics[q.metricKey] ?? 0)
      const completed = progress >= q.targetCount
      const claimed = claimSet.has(`${q.id}:${periodKey}`)

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
        completed,
        claimed,
        periodKey,
      }
    })

    return NextResponse.json({
      user,
      dailyCheckedInToday: user.lastDailyClaimDate === todayKey,
      quests: enrichedQuests,
      cosmetics: COSMETIC_CATALOG,
      xpHistory,
    })
  } catch (error) {
    console.error("Gamification GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { action } = body

    // 1. Server-Authoritative Daily Check-in
    if (action === "daily_checkin") {
      const todayKey = toDayKey()
      const yesterdayKey = toDayKey(new Date(Date.now() - 86400000))

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
      })

      if (user.lastDailyClaimDate === todayKey) {
        return NextResponse.json(
          { error: "You have already claimed today's check-in reward." },
          { status: 400 }
        )
      }

      const nextClaimStreak =
        user.lastDailyClaimDate === yesterdayKey
          ? user.dailyClaimStreak + 1
          : 1
      const milestoneBonusXp =
        nextClaimStreak % 7 === 0 ? 50 : nextClaimStreak % 3 === 0 ? 20 : 0
      const totalXpAward = XP_REWARDS.DAILY_CHECKIN + milestoneBonusXp
      const pointsAward = 15 + (nextClaimStreak % 7 === 0 ? 25 : 0)

      await prisma.user.update({
        where: { id: userId },
        data: {
          lastDailyClaimDate: todayKey,
          dailyClaimStreak: nextClaimStreak,
          currentStreak: Math.max(user.currentStreak, nextClaimStreak),
          longestStreak: Math.max(user.longestStreak, nextClaimStreak),
        },
      })

      const award = await awardUserXP({
        userId,
        eventType: "DAILY_CHECKIN",
        idempotencyKey: `checkin:${userId}:${todayKey}`,
        xpAmount: totalXpAward,
        pointsAmount: pointsAward,
        description: `Daily Reading Check-in (Day ${nextClaimStreak}${
          milestoneBonusXp ? " · Streak Milestone Bonus!" : ""
        })`,
        activityType: "QUEST_COMPLETED",
      })

      await checkAndAwardBadges(userId).catch(() => {})

      return NextResponse.json({
        success: true,
        dailyClaimStreak: nextClaimStreak,
        xpAwarded: totalXpAward,
        pointsAwarded: pointsAward,
        leveledUp: award.leveledUp,
        newLevel: award.newLevel,
      })
    }

    // 2. Server-Validated Quest Reward Claim
    if (action === "claim_quest") {
      const { questId } = body
      if (!questId) {
        return NextResponse.json({ error: "Missing questId" }, { status: 400 })
      }

      const quest = await prisma.quest.findUnique({ where: { id: questId } })
      if (!quest || !quest.isActive) {
        return NextResponse.json({ error: "Quest not found" }, { status: 404 })
      }

      const todayKey = toDayKey()
      const weekKey = toWeekKey()
      const periodKey =
        quest.category === "DAILY"
          ? todayKey
          : quest.category === "WEEKLY"
          ? weekKey
          : "EVENT"

      const existingClaim = await prisma.userQuestClaim.findUnique({
        where: {
          userId_questId_periodKey: {
            userId,
            questId: quest.id,
            periodKey,
          },
        },
      })

      if (existingClaim) {
        return NextResponse.json(
          { error: "Quest reward already claimed for this period." },
          { status: 400 }
        )
      }

      const metrics = await computeQuestMetrics(userId)
      const currentProgress = metrics[quest.metricKey] ?? 0
      if (currentProgress < quest.targetCount) {
        return NextResponse.json(
          {
            error: `Quest requirements not yet met (${currentProgress}/${quest.targetCount}).`,
          },
          { status: 400 }
        )
      }

      await prisma.userQuestClaim.create({
        data: {
          userId,
          questId: quest.id,
          periodKey,
          xpAwarded: quest.rewardXp,
        },
      })

      if (quest.cosmeticReward) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { unlockedCosmetics: true },
        })
        const nextCosmetics = Array.from(
          new Set([...(u?.unlockedCosmetics || []), quest.cosmeticReward])
        )
        await prisma.user.update({
          where: { id: userId },
          data: { unlockedCosmetics: { set: nextCosmetics } },
        })
      }

      const award = await awardUserXP({
        userId,
        eventType: "QUEST_CLAIMED",
        idempotencyKey: `quest:${userId}:${quest.id}:${periodKey}`,
        xpAmount: quest.rewardXp,
        pointsAmount: quest.rewardPoints,
        description: `Completed Quest: "${quest.name}"`,
        sourceId: quest.id,
        activityType: "QUEST_COMPLETED",
      })

      await checkAndAwardBadges(userId).catch(() => {})

      return NextResponse.json({
        success: true,
        xpAwarded: quest.rewardXp,
        pointsAwarded: quest.rewardPoints,
        cosmeticReward: quest.cosmeticReward,
        leveledUp: award.leveledUp,
        newLevel: award.newLevel,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Gamification POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
