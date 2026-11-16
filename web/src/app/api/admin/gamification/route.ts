import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  ensureDefaultBadges,
  ensureDefaultQuests,
  awardUserXP,
} from "@/services/badgeService"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  })
  return user?.role === "ADMIN" ? user : null
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await Promise.all([ensureDefaultBadges(), ensureDefaultQuests()])

    const [badges, quests, recentTx, reports] = await Promise.all([
      prisma.badge.findMany({
        include: { _count: { select: { users: true } } },
        orderBy: [{ category: "asc" }, { requirementThreshold: "asc" }],
      }),
      prisma.quest.findMany({
        include: { _count: { select: { claims: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.xpTransaction.findMany({
        take: 40,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.userReport.findMany({
        take: 25,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, name: true } },
          reported: { select: { id: true, name: true } },
        },
      }),
    ])

    return NextResponse.json({
      badges,
      quests,
      recentTx,
      reports,
    })
  } catch (error) {
    console.error("Admin gamification GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    if (action === "create_badge") {
      const {
        code,
        name,
        description,
        category = "COMMUNITY",
        rarity = "RARE",
        requirementThreshold = 1,
        metricKey = "MANUAL",
        xpReward = 100,
        pointsReward = 40,
      } = body

      if (!name || !description) {
        return NextResponse.json(
          { error: "Name and description are required" },
          { status: 400 }
        )
      }

      const created = await prisma.badge.create({
        data: {
          code:
            code ||
            name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .slice(0, 32),
          name,
          description,
          category,
          rarity,
          iconUrl: "/badges/community_pioneer.jpg",
          requirementThreshold: Number(requirementThreshold) || 1,
          metricKey,
          xpReward: Number(xpReward) || 50,
          pointsReward: Number(pointsReward) || 25,
          isActive: true,
        },
      })

      return NextResponse.json(created, { status: 201 })
    }

    if (action === "toggle_badge") {
      const { badgeId, isActive } = body
      const updated = await prisma.badge.update({
        where: { id: badgeId },
        data: { isActive: Boolean(isActive) },
      })
      return NextResponse.json(updated)
    }

    if (action === "create_quest") {
      const {
        code,
        name,
        description,
        category = "DAILY",
        metricKey = "READING_MINUTES_TODAY",
        targetCount = 15,
        rewardXp = 50,
        rewardPoints = 25,
      } = body

      const created = await prisma.quest.create({
        data: {
          code:
            code ||
            `quest_${Date.now()}_${name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 12)}`,
          name,
          description,
          category,
          metricKey,
          targetCount: Number(targetCount) || 1,
          rewardXp: Number(rewardXp) || 50,
          rewardPoints: Number(rewardPoints) || 25,
          isActive: true,
        },
      })
      return NextResponse.json(created, { status: 201 })
    }

    if (action === "adjust_xp") {
      const { targetUserId, xpDelta, reason } = body
      const delta = Number(xpDelta)
      if (!targetUserId || !Number.isFinite(delta) || delta === 0 || !reason) {
        return NextResponse.json(
          { error: "targetUserId, non-zero xpDelta, and reason are required" },
          { status: 400 }
        )
      }

      const award = await awardUserXP({
        userId: targetUserId,
        eventType: "ADMIN_ADJUSTMENT",
        idempotencyKey: `admin:${admin.id}:${targetUserId}:${Date.now()}`,
        xpAmount: delta,
        pointsAmount: 0,
        description: `Admin Adjustment (${admin.name || "Admin"}): ${reason}`,
        activityType: "QUEST_COMPLETED",
        visibility: "PRIVATE",
      })

      return NextResponse.json(award)
    }

    if (action === "reverse_tx") {
      const { txId } = body
      const txRecord = await prisma.xpTransaction.findUnique({
        where: { id: txId },
      })
      if (!txRecord || txRecord.reversedAt) {
        return NextResponse.json(
          { error: "Transaction not found or already reversed" },
          { status: 400 }
        )
      }

      await prisma.$transaction([
        prisma.xpTransaction.update({
          where: { id: txId },
          data: { reversedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: txRecord.userId },
          data: {
            totalXP: { decrement: txRecord.xpAmount },
            aksharPoints: { decrement: txRecord.pointsAmount },
          },
        }),
      ])

      return NextResponse.json({ reversed: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Admin gamification POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
