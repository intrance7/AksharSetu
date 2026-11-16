import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { RATE_LIMITS, REPORT_REASONS } from "@/lib/messaging/constants"
import { MessagingError, errorResponse } from "@/lib/messaging/http"

// POST /api/messages/safety — block/unblock user, submit abuse report, or update notification preferences
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const myId = session.user.id
    const body = await req.json()
    const { action } = body

    if (action === "block") {
      const { targetUserId } = body
      if (!targetUserId || targetUserId === myId) {
        throw new MessagingError(400, "Invalid user to block.", "BAD_REQUEST")
      }

      await prisma.userBlock.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: myId,
            blockedId: targetUserId,
          },
        },
        update: {},
        create: {
          blockerId: myId,
          blockedId: targetUserId,
        },
      })

      return NextResponse.json({ blockedByMe: true })
    }

    if (action === "unblock") {
      const { targetUserId } = body
      if (!targetUserId) {
        throw new MessagingError(400, "Invalid user to unblock.", "BAD_REQUEST")
      }

      await prisma.userBlock.deleteMany({
        where: {
          blockerId: myId,
          blockedId: targetUserId,
        },
      })

      return NextResponse.json({ blockedByMe: false })
    }

    if (action === "report") {
      const { reportedUserId, conversationId, messageId, reason, details } = body
      if (!reportedUserId || reportedUserId === myId) {
        throw new MessagingError(400, "Invalid report target.", "BAD_REQUEST")
      }

      const validReasons = new Set(REPORT_REASONS.map((r) => r.value))
      const normalizedReason = validReasons.has(reason) ? reason : "OTHER"

      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentReports = await prisma.userReport.count({
        where: { reporterId: myId, createdAt: { gte: dayAgo } },
      })
      if (recentReports >= RATE_LIMITS.reportsPerDay) {
        throw new MessagingError(
          429,
          "You have reached the daily report limit.",
          "RATE_LIMITED"
        )
      }

      const report = await prisma.userReport.create({
        data: {
          reporterId: myId,
          reportedId: reportedUserId,
          conversationId: conversationId || null,
          messageId: messageId || null,
          reason: normalizedReason,
          details: details ? String(details).trim().slice(0, 1000) : null,
        },
      })

      return NextResponse.json({ reported: true, id: report.id }, { status: 201 })
    }

    if (action === "preferences") {
      const data: Record<string, boolean> = {}
      if (typeof body.notifyMessages === "boolean") {
        data.notifyMessages = body.notifyMessages
      }
      if (typeof body.notifyOffers === "boolean") {
        data.notifyOffers = body.notifyOffers
      }

      const updated = await prisma.user.update({
        where: { id: myId },
        data,
        select: { notifyMessages: true, notifyOffers: true },
      })

      return NextResponse.json(updated)
    }

    throw new MessagingError(400, "Unknown safety action.", "BAD_REQUEST")
  } catch (error) {
    return errorResponse(error)
  }
}
