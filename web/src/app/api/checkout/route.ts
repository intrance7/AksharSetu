import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { bookId } = body

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

    // Start a transaction to ensure atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the book to check availability
      const book = await tx.book.findUnique({
        where: { id: bookId },
      })

      if (!book) {
        throw new Error("Book not found")
      }

      if (book.status !== "AVAILABLE") {
        throw new Error("Book is no longer available")
      }

      if (book.ownerId === session.user.id) {
        throw new Error("You cannot purchase your own book")
      }

      if (book.price === 0) {
        throw new Error("Donations cannot be purchased through checkout")
      }

      // 2. Mark the book as RESERVED atomically
      const updatedBook = await tx.book.update({
        where: { id: bookId },
        data: { status: "RESERVED" },
      })

      // 3. Create a PENDING Order
      const order = await tx.order.create({
        data: {
          amount: updatedBook.price,
          status: "PENDING",
          bookId: updatedBook.id,
          buyerId: session.user.id,
        },
      })

      return order
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Checkout creation error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 })
  }
}
