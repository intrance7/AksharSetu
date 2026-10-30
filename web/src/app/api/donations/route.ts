import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const all = searchParams.get("all")

    if (all && session.user.role === "ADMIN") {
      const donations = await prisma.donation.findMany({
        include: { campaign: true, book: true, donor: true },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(donations)
    }

    const userDonations = await prisma.donation.findMany({
      where: { donorId: session.user.id },
      include: { campaign: true, book: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(userDonations)
  } catch (error) {
    console.error("Error fetching donations:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { campaignId, bookId } = body

    const donation = await prisma.donation.create({
      data: {
        donorId: session.user.id,
        campaignId: campaignId || null,
        bookId: bookId || null,
      },
      include: { campaign: true, book: true },
    })

    if (campaignId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { currentBooks: { increment: 1 } },
      })
    }

    if (bookId) {
      await prisma.book.update({
        where: { id: bookId },
        data: { status: "DONATED", price: 0 },
      })
    }

    await prisma.notification
      .create({
        data: {
          userId: session.user.id,
          type: "DONATION_LOGGED",
          message: `Thank you! Your donation (Tracking ID: ${donation.trackingId.slice(0, 8)}) has been registered.`,
          link: "/donations",
        },
      })
      .catch(() => {})

    await checkAndAwardBadges(session.user.id).catch(() => {})

    return NextResponse.json(donation, { status: 201 })
  } catch (error) {
    console.error("Donation creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
