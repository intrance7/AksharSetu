import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

class RequestActionError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

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

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { status } = body

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const bookRequest = await tx.bookRequest.findUnique({
        where: { id: resolvedParams.id },
        include: { book: true },
      })

      if (!bookRequest) {
        throw new RequestActionError(404, "Request not found")
      }

      if (bookRequest.book.ownerId !== userId && session.user.role !== "ADMIN") {
        throw new RequestActionError(403, "Unauthorized to manage this request")
      }

      // Idempotent guard: prevent duplicate status updates and double-incrementing stats
      if (bookRequest.status === status) {
        return {
          updatedRequest: bookRequest,
          requesterId: bookRequest.requesterId,
          newlyCompleted: false,
        }
      }

      if (bookRequest.status === "COMPLETED") {
        throw new RequestActionError(400, "Completed requests cannot be modified")
      }

      if (bookRequest.status === "REJECTED" && status !== "REJECTED") {
        throw new RequestActionError(400, "Rejected requests cannot be reopened")
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
          bookRequest.book.price === 0 &&
          !bookRequest.offeredBookId &&
          !bookRequest.book.acceptsExchange

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
          where: { id: bookRequest.book.ownerId },
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

      return {
        updatedRequest,
        requesterId: bookRequest.requesterId,
        ownerId: bookRequest.book.ownerId,
        newlyCompleted: status === "COMPLETED",
      }
    })

    if (result.newlyCompleted) {
      await Promise.allSettled([
        checkAndAwardBadges(result.ownerId || userId),
        checkAndAwardBadges(result.requesterId),
      ])
    }

    return NextResponse.json(result.updatedRequest)
  } catch (error: any) {
    if (error instanceof RequestActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Update request error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
