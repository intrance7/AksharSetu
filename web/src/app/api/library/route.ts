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
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(books)
  } catch {
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
    const { title, author, coverImage, platformBookId, gutenbergId, totalPages, status } = body

    if (!title || !author) {
      return NextResponse.json({ error: "Title and author are required" }, { status: 400 })
    }

    const numericGutenberg =
      gutenbergId !== undefined && gutenbergId !== null && /^\d+$/.test(String(gutenbergId))
        ? Number(gutenbergId)
        : null
    const resolvedPlatformId =
      platformBookId || (!numericGutenberg && gutenbergId ? String(gutenbergId) : null)

    if (numericGutenberg) {
      const existing = await prisma.libraryBook.findFirst({
        where: { userId: session.user.id, gutenbergId: numericGutenberg },
      })
      if (existing) return NextResponse.json(existing)
    } else if (resolvedPlatformId) {
      const existing = await prisma.libraryBook.findFirst({
        where: { userId: session.user.id, platformBookId: resolvedPlatformId },
      })
      if (existing) return NextResponse.json(existing)
    }

    const newBook = await prisma.libraryBook.create({
      data: {
        title: String(title).trim(),
        author: String(author).trim(),
        coverImage: coverImage || null,
        platformBookId: resolvedPlatformId,
        gutenbergId: numericGutenberg,
        totalPages: Math.max(10, Number(totalPages) || 250),
        status: ["WANT_TO_READ", "READING", "READ"].includes(status) ? status : "WANT_TO_READ",
        userId: session.user.id,
      },
    })

    return NextResponse.json(newBook, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 })
  }
}
