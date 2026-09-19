import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const { status } = await req.json()

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Use transaction to update request and potentially book status atomically
    const result = await prisma.$transaction(async (tx) => {
      const bookRequest = await tx.bookRequest.findUnique({
        where: { id: resolvedParams.id },
        include: { book: true }
      })

      if (!bookRequest) {
        throw new Error("Request not found")
      }

      // Only the book owner can approve/reject
      if (bookRequest.book.ownerId !== session.user.id) {
        throw new Error("Unauthorized to manage this request")
      }

      const updatedRequest = await tx.bookRequest.update({
        where: { id: resolvedParams.id },
        data: { status }
      })

      if (status === "APPROVED") {
        await tx.book.update({
          where: { id: bookRequest.bookId },
          data: { status: "RESERVED" }
        })
      } else if (status === "REJECTED") {
        // If it was previously approved and now rejected, revert book to AVAILABLE
        if (bookRequest.status === "APPROVED") {
          await tx.book.update({
            where: { id: bookRequest.bookId },
            data: { status: "AVAILABLE" }
          })
        }
      } else if (status === "COMPLETED") {
        await tx.book.update({
          where: { id: bookRequest.bookId },
          data: { status: bookRequest.book.price === 0 ? "DONATED" : "SOLD" }
        })
      }

      return updatedRequest
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Update request error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 })
  }
}
