import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const clubs = await prisma.bookClub.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true, posts: true } },
      },
    })
    return NextResponse.json(clubs)
  } catch (error) {
    console.error("GET clubs error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      bookTitle,
      bookAuthor,
      ebookKey,
      scheduleText,
    } = body

    if (!name?.trim() || !bookTitle?.trim() || !bookAuthor?.trim()) {
      return NextResponse.json(
        { error: "Club name, book title, and book author are required" },
        { status: 400 }
      )
    }

    const club = await prisma.bookClub.create({
      data: {
        name: name.trim(),
        description:
          description?.trim() ||
          `Community reading circle discussing ${bookTitle.trim()}.`,
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim(),
        ebookKey: ebookKey?.trim() || null,
        scheduleText: scheduleText?.trim() || "Weekly Shanti Reading Circle",
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
          },
        },
      },
    })

    return NextResponse.json(club, { status: 201 })
  } catch (error) {
    console.error("POST club error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

