import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const all = searchParams.get("all")

    if (all) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      if (dbUser?.role === "ADMIN") {
        const donations = await prisma.donation.findMany({
          include: {
            campaign: true,
            book: true,
            donor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                location: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(donations)
      }
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
    const userId = session.user.id

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const campaignId =
      typeof body?.campaignId === "string" && body.campaignId.trim()
        ? body.campaignId.trim()
        : null
    const bookId =
      typeof body?.bookId === "string" && body.bookId.trim()
        ? body.bookId.trim()
        : null

    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true, status: true },
      })
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
      }
      if (campaign.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "This donation campaign is no longer active" },
          { status: 400 }
        )
      }
    }

    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: { donation: { select: { id: true } } },
      })
      if (!book) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 })
      }
      if (book.ownerId !== userId && session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "You can only donate books that you own" },
          { status: 403 }
        )
      }
      if (book.donation) {
        return NextResponse.json(
          { error: "This book has already been registered as a donation" },
          { status: 400 }
        )
      }
    }

    const donation = await prisma.$transaction(async (tx) => {
      const created = await tx.donation.create({
        data: {
          donorId: userId,
          campaignId,
          bookId,
        },
        include: { campaign: true, book: true },
      })

      if (campaignId) {
        await tx.campaign.update({
          where: { id: campaignId },
          data: { currentBooks: { increment: 1 } },
        })
      }

      if (bookId) {
        await tx.book.update({
          where: { id: bookId },
          data: { status: "DONATED", price: 0 },
        })
      }

      return created
    })

    await prisma.notification
      .create({
        data: {
          userId,
          type: "DONATION_LOGGED",
          message: `Thank you! Your donation (Tracking ID: ${donation.trackingId.slice(0, 8)}) has been registered.`,
          link: `/donations/track/${donation.trackingId}`,
        },
      })
      .catch(() => {})

    await checkAndAwardBadges(userId).catch(() => {})

    return NextResponse.json(donation, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "This book is already registered as a donation" },
        { status: 409 }
      )
    }
    console.error("Donation creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
