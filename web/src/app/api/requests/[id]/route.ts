import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const resolvedParams = await params
    const { status } = await req.json()

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const bookRequest = await tx.bookRequest.findUnique({
        where: { id: resolvedParams.id },
        include: { book: true },
      })

      if (!bookRequest) {
        throw new Error("Request not found")
      }

      if (bookRequest.book.ownerId !== userId) {
        throw new Error("Unauthorized to manage this request")
      }

      const updatedRequest = await tx.bookRequest.update({
        where: { id: resolvedParams.id },
        data: { status },
      })

      if (status === "APPROVED") {
        await tx.book.update({
          where: { id: bookRequest.bookId },
          data: { status: "RESERVED" },
        })
      } else if (status === "REJECTED") {
        if (bookRequest.status === "APPROVED") {
          await tx.book.update({
            where: { id: bookRequest.bookId },
            data: { status: "AVAILABLE" },
          })
        }
      } else if (status === "COMPLETED") {
        const isFreeDonation =
          bookRequest.book.price === 0 && !bookRequest.offeredBookId && !bookRequest.book.acceptsExchange

        await tx.book.update({
          where: { id: bookRequest.bookId },
          data: { status: isFreeDonation ? "DONATED" : "SOLD" },
        })

        if (bookRequest.offeredBookId) {
          await tx.book
            .update({
              where: { id: bookRequest.offeredBookId },
              data: { status: "SOLD" },
            })
            .catch(() => {})
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            successfulExchanges: { increment: 1 },
          },
        })

        await tx.user.update({
          where: { id: bookRequest.requesterId },
          data: {
            successfulExchanges: { increment: 1 },
          },
        })
      }

      await tx.notification.create({
        data: {
          userId: bookRequest.requesterId,
          type: "REQUEST_UPDATE",
          message:
            status === "APPROVED"
              ? `Your request for "${bookRequest.book.title}" was approved! Coordinate handoff in Messages.`
              : status === "COMPLETED"
                ? `Handoff completed for "${bookRequest.book.title}"! Leave a verified review.`
                : `Your request for "${bookRequest.book.title}" was declined.`,
          link: "/orders",
        },
      })

      return { updatedRequest, requesterId: bookRequest.requesterId }
    })

    if (status === "COMPLETED") {
      await Promise.allSettled([
        checkAndAwardBadges(userId),
        checkAndAwardBadges(result.requesterId),
      ])
    }

    return NextResponse.json(result.updatedRequest)
  } catch (error: any) {
    console.error("Update request error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 })
  }
}
