import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { triggerPusherEvent } from "@/lib/pusher-server"
import { checkAndAwardBadges } from "@/services/badgeService"

const VALID_STAGES = [
  "DONATED",
  "COLLECTED",
  "VERIFIED",
  "SENT_TO_NGO",
  "RECEIVED",
  "DISTRIBUTED",
]

const STAGE_LABELS: Record<string, string> = {
  DONATED: "Donation Pledge Recorded",
  COLLECTED: "Book Collected from Donor",
  VERIFIED: "Quality & Condition Verified",
  SENT_TO_NGO: "Dispatched to Partner NGO",
  RECEIVED: "Received at NGO Learning Center",
  DISTRIBUTED: "Placed in a Student's Hands",
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { status } = body

    if (!status || !VALID_STAGES.includes(status)) {
      return NextResponse.json({ error: "Invalid donation stage" }, { status: 400 })
    }

    const existing = await prisma.donation.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 })
    }

    const updated = await prisma.donation.update({
      where: { id },
      data: { status },
      include: {
        book: { select: { title: true } },
        campaign: { select: { title: true, ngoName: true } },
      },
    })

    const bookName = updated.book?.title || "Your donated book"
    const msg = `Vidya Daan Update: "${bookName}" is now marked "${STAGE_LABELS[status] || status}".`
    const link = `/donations/track/${updated.trackingId}`

    await prisma.notification
      .create({
        data: {
          userId: updated.donorId,
          type: "DONATION_UPDATE",
          message: msg,
          link,
        },
      })
      .catch(() => {})

    await triggerPusherEvent(`notify-${updated.donorId}`, "new-notification", {
      message: msg,
      link,
    })

    await checkAndAwardBadges(updated.donorId).catch(() => {})

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PATCH donation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
