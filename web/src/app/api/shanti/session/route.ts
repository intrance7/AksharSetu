import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { libraryBookId, durationMinutes } = body

    if (!libraryBookId || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the user owns this library book
    const libraryBook = await prisma.libraryBook.findUnique({
      where: { id: libraryBookId }
    })

    if (!libraryBook || libraryBook.userId !== session.user.id) {
      return NextResponse.json({ error: "Book not found in your library" }, { status: 404 })
    }

    const newSession = await prisma.readingSession.create({
      data: {
        userId: session.user.id,
        libraryBookId,
        durationMinutes,
      },
    })

    return NextResponse.json(newSession, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to log reading session" }, { status: 500 })
  }
}
