import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { notifyWishlistMatches } from "@/lib/wishlistAlerts"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const author = typeof body?.author === "string" ? body.author.trim() : ""
    const isbn = typeof body?.isbn === "string" ? body.isbn.trim() || null : null
    const description =
      typeof body?.description === "string" ? body.description.trim() || null : null
    const condition =
      typeof body?.condition === "string" ? body.condition.trim() : ""
    const category =
      typeof body?.category === "string" ? body.category.trim() : ""
    const parsedPrice = Number(body?.price)
    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : ""

    if (
      !title ||
      !author ||
      !condition ||
      !category ||
      body?.price === undefined ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      )
    }

    const images = imageUrl ? [imageUrl] : []

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        description,
        condition,
        category,
        price: parsedPrice,
        images,
        ownerId: session.user.id,
        status: "AVAILABLE",
      },
    })

    await notifyWishlistMatches({
      bookId: book.id,
      title: book.title,
      isbn: book.isbn,
      sellerId: session.user.id,
    })
    checkAndAwardBadges(session.user.id).catch(() => {})

    return NextResponse.json(book, { status: 201 })
  } catch (error: any) {
    console.error("Listing creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
