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
    const { title, author, isbn, description, condition, category, price, imageUrl } = body

    if (!title || !author || !condition || !category || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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
        price: Number(price),
        images,
        ownerId: session.user.id,
        status: "AVAILABLE"
      },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error: any) {
    console.error("Listing creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
