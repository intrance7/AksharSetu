import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const [incoming, outgoing] = await Promise.all([
      prisma.bookRequest.findMany({
        where: { book: { ownerId: userId } },
        include: {
          book: true,
          requester: { select: { id: true, name: true, image: true, sellerRating: true } },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bookRequest.findMany({
        where: { requesterId: userId },
        include: {
          book: {
            include: {
              owner: { select: { id: true, name: true, image: true, sellerRating: true } },
            },
          },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ incoming, outgoing })
  } catch (error) {
    console.error("Fetch book requests error:", error)
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
    const { bookId, message, offeredBookId } = body

    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 })
    }

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

    const existingRequest = await prisma.bookRequest.findFirst({
      where: {
        bookId,
        requesterId: session.user.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have an active request for this book" }, { status: 400 })
    }

    let offeredBookTitle: string | null = null
    if (offeredBookId) {
      const offered = await prisma.book.findUnique({ where: { id: offeredBookId } })
      if (offered && offered.ownerId === session.user.id) {
        offeredBookTitle = offered.title
      }
    }

    const bookRequest = await prisma.bookRequest.create({
      data: {
        bookId,
        requesterId: session.user.id,
        message: message || null,
        offeredBookId: offeredBookTitle ? offeredBookId : null,
        status: "PENDING",
      },
    })

    const requesterName = session.user.name || "A reader"
    const notifMsg = offeredBookTitle
      ? `${requesterName} proposed swapping "${offeredBookTitle}" for your "${book.title}".`
      : `${requesterName} requested your book "${book.title}".`

    await prisma.notification
      .create({
        data: {
          userId: book.ownerId,
          type: "BOOK_REQUEST",
          message: notifMsg,
          link: "/orders",
        },
      })
      .catch(() => {})

    return NextResponse.json(bookRequest, { status: 201 })
  } catch (error: any) {
    console.error("Book request creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
