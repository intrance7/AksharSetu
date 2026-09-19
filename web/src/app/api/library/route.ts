import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const books = await prisma.libraryBook.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(books)
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, author, coverImage, platformBookId } = body

    if (!title || !author) {
      return NextResponse.json({ error: "Title and author are required" }, { status: 400 })
    }

    const newBook = await prisma.libraryBook.create({
      data: {
        title,
        author,
        coverImage,
        platformBookId,
        userId: session.user.id,
      },
    })

    return NextResponse.json(newBook, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 })
  }
}
