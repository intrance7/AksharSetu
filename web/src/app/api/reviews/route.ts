import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { awardUserXP, checkAndAwardBadges } from "@/services/badgeService"
import { XP_REWARDS } from "@/lib/gamification"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reviewerId = session.user.id
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const {
      orderId,
      requestId,
      rating,
      conditionAccurate = true,
      meetupReliable = true,
      comment,
    } = body

    const cleanRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)))

    if (!orderId && !requestId) {
      return NextResponse.json(
        { error: "Order ID or Request ID is required" },
        { status: 400 }
      )
    }
    if (orderId && requestId) {
      return NextResponse.json(
        { error: "Provide either Order ID or Request ID, not both" },
        { status: 400 }
      )
    }

    let sellerId = ""
    let bookTitle = "a book"

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: String(orderId) },
        include: { book: true, review: true },
      })
      if (!order || order.buyerId !== reviewerId) {
        return NextResponse.json(
          { error: "Order not found or unauthorized" },
          { status: 403 }
        )
      }
      if (order.status === "FAILED") {
        return NextResponse.json(
          { error: "Cannot review a failed order" },
          { status: 400 }
        )
      }
      if (order.review) {
        return NextResponse.json(
          { error: "You already reviewed this order" },
          { status: 400 }
        )
      }
      sellerId = order.book.ownerId
      bookTitle = order.book.title
    } else if (requestId) {
      const bookReq = await prisma.bookRequest.findUnique({
        where: { id: String(requestId) },
        include: { book: true, review: true },
      })
      if (!bookReq || bookReq.requesterId !== reviewerId) {
        return NextResponse.json(
          { error: "Request not found or unauthorized" },
          { status: 403 }
        )
      }
      if (bookReq.status !== "COMPLETED") {
        return NextResponse.json(
          { error: "Complete the handoff before leaving a review" },
          { status: 400 }
        )
      }
      if (bookReq.review) {
        return NextResponse.json(
          { error: "You already reviewed this exchange" },
          { status: 400 }
        )
      }
      sellerId = bookReq.book.ownerId
      bookTitle = bookReq.book.title
    }

    const review = await prisma.sellerReview.create({
      data: {
        rating: cleanRating,
        conditionAccurate: Boolean(conditionAccurate),
        meetupReliable: Boolean(meetupReliable),
        comment:
          typeof comment === "string" ? comment.trim().slice(0, 1000) || null : null,
        orderId: orderId ? String(orderId) : null,
        requestId: requestId ? String(requestId) : null,
        reviewerId,
        sellerId,
      },
    })

    // Dynamically recalculate Seller's aggregate Trust Score
    const allSellerReviews = await prisma.sellerReview.findMany({
      where: { sellerId },
      select: {
        rating: true,
        conditionAccurate: true,
        meetupReliable: true,
      },
    })

    const count = allSellerReviews.length
    const avgRating =
      count > 0
        ? Number(
            (
              allSellerReviews.reduce((acc, r) => acc + r.rating, 0) / count
            ).toFixed(2)
          )
        : 5.0
    const condAccPct =
      count > 0
        ? allSellerReviews.filter((r) => r.conditionAccurate).length / count >= 0.7
        : true
    const meetupRelPct =
      count > 0
        ? allSellerReviews.filter((r) => r.meetupReliable).length / count >= 0.7
        : true

    await prisma.user.update({
      where: { id: sellerId },
      data: {
        sellerRating: avgRating,
        conditionAccuracy: condAccPct,
        meetupReliability: meetupRelPct,
      },
    })

    await prisma.notification
      .create({
        data: {
          userId: sellerId,
          type: "NEW_REVIEW",
          message: `${session.user.name || "A reader"} rated your "${bookTitle}" handoff ${cleanRating}★! Your trust score is now ${avgRating}★.`,
          link: `/profile/${sellerId}`,
        },
      })
      .catch(() => {})

    await awardUserXP({
      userId: reviewerId,
      eventType: "REVIEW_PUBLISHED",
      idempotencyKey: `review:${review.id}`,
      xpAmount: XP_REWARDS.REVIEW_PUBLISHED,
      pointsAmount: 15,
      description: `Published a verified ${cleanRating}★ review for "${bookTitle}"`,
      sourceId: review.id,
      activityType: "REVIEW_PUBLISHED",
    }).catch(() => {})

    await Promise.allSettled([
      checkAndAwardBadges(reviewerId),
      checkAndAwardBadges(sellerId),
    ])

    return NextResponse.json(
      { review, newSellerRating: avgRating },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "You already reviewed this transaction" },
        { status: 400 }
      )
    }
    console.error("Create review error:", error)
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
  }
}
