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
    const { bookId, message } = body

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

    // Verify the book exists and is available
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    if (book.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Book is not available for request" }, { status: 400 })
    }

    if (book.ownerId === session.user.id) {
      return NextResponse.json({ error: "You cannot request your own book" }, { status: 400 })
    }

    // Check if user already requested this book
    const existingRequest = await prisma.bookRequest.findFirst({
      where: {
        bookId,
        requesterId: session.user.id,
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You have already requested this book" }, { status: 400 })
    }

    // Create the request
    const bookRequest = await prisma.bookRequest.create({
      data: {
        bookId,
        requesterId: session.user.id,
        message: message || null,
        status: "PENDING",
      },
    })

    // Update book status to RESERVED (optional based on workflow, but let's just keep it AVAILABLE until approved, or maybe change it now. We'll leave it AVAILABLE and let the owner decide)
    // For now, we will leave the book status as AVAILABLE until the owner approves the request.

    return NextResponse.json(bookRequest, { status: 201 })
  } catch (error: any) {
    console.error("Book request creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
