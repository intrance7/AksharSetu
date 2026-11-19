import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  ensureDefaultBadges,
  ensureDefaultQuests,
  awardUserXP,
} from "@/services/badgeService"

export const dynamic = "force-dynamic"

async function getAdminAuth() {
  const session = await auth()
  if (!session?.user?.id) return { status: 401 as const, admin: null }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  })
  if (user?.role !== "ADMIN") return { status: 403 as const, admin: null }
  return { status: 200 as const, admin: user }
}

export async function GET() {
  try {
    const authRes = await getAdminAuth()
    if (!authRes.admin) {
      return NextResponse.json(
        { error: authRes.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: authRes.status }
      )
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
    const authRes = await getAdminAuth()
    if (!authRes.admin) {
      return NextResponse.json(
        { error: authRes.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: authRes.status }
      )
    }
    const admin = authRes.admin

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
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

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof description !== "string" ||
        !description.trim()
      ) {
        return NextResponse.json(
          { error: "Name and description are required" },
          { status: 400 }
        )
      }

      const generatedCode =
        (typeof code === "string" && code.trim()) ||
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")
          .slice(0, 32) ||
        `badge_${Date.now()}`

      const created = await prisma.badge.create({
        data: {
          code: generatedCode,
          name: name.trim().slice(0, 80),
          description: description.trim().slice(0, 300),
          category: String(category),
          rarity: String(rarity),
          iconUrl: "/badges/community/first_contribution.svg",
          requirementThreshold: Math.max(1, Math.round(Number(requirementThreshold) || 1)),
          metricKey: String(metricKey),
          xpReward: Math.max(0, Math.round(Number(xpReward) || 50)),
          pointsReward: Math.max(0, Math.round(Number(pointsReward) || 25)),
          isActive: true,
        },
      })

      return NextResponse.json(created, { status: 201 })
    }

    if (action === "toggle_badge") {
      const { badgeId, isActive } = body
      if (!badgeId || typeof badgeId !== "string") {
        return NextResponse.json({ error: "badgeId is required" }, { status: 400 })
      }
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

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof description !== "string" ||
        !description.trim()
      ) {
        return NextResponse.json(
          { error: "Quest name and description are required" },
          { status: 400 }
        )
      }

      const created = await prisma.quest.create({
        data: {
          code:
            (typeof code === "string" && code.trim()) ||
            `quest_${Date.now()}_${name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 12)}`,
          name: name.trim().slice(0, 100),
          description: description.trim().slice(0, 300),
          category: String(category),
          metricKey: String(metricKey),
          targetCount: Math.max(1, Math.round(Number(targetCount) || 1)),
          rewardXp: Math.max(0, Math.round(Number(rewardXp) || 50)),
          rewardPoints: Math.max(0, Math.round(Number(rewardPoints) || 25)),
          isActive: true,
        },
      })
      return NextResponse.json(created, { status: 201 })
    }

    if (action === "adjust_xp") {
      const { targetUserId, xpDelta, reason } = body
      const delta = Math.round(Number(xpDelta))
      if (
        !targetUserId ||
        typeof targetUserId !== "string" ||
        !Number.isFinite(delta) ||
        delta === 0 ||
        typeof reason !== "string" ||
        !reason.trim()
      ) {
        return NextResponse.json(
          { error: "targetUserId, non-zero xpDelta, and reason are required" },
          { status: 400 }
        )
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      })
      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 })
      }

      const award = await awardUserXP({
        userId: targetUserId,
        eventType: "ADMIN_ADJUSTMENT",
        idempotencyKey: `admin:${admin.id}:${targetUserId}:${Date.now()}`,
        xpAmount: delta,
        pointsAmount: 0,
        description: `Admin Adjustment (${admin.name || "Admin"}): ${reason.trim()}`,
        activityType: "QUEST_COMPLETED",
        visibility: "PRIVATE",
      })

      return NextResponse.json(award)
    }

    if (action === "reverse_tx") {
      const { txId } = body
      if (!txId || typeof txId !== "string") {
        return NextResponse.json({ error: "txId is required" }, { status: 400 })
      }
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
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A record with that unique code already exists" },
        { status: 409 }
      )
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    console.error("Admin gamification POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
