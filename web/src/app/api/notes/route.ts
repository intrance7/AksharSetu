import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 })
    }

    const { searchParams } = new URL(req.url)
    const bookKey = searchParams.get("bookKey")

    const notes = await prisma.bookNote.findMany({
      where: {
        userId: session.user.id,
        ...(bookKey ? { bookKey: String(bookKey) } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Fetch notes error:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in to save highlights and notes" }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const { bookKey, bookTitle, bookAuthor, quoteText, noteText, color, pageNumber } = body

    if (!bookKey || typeof quoteText !== "string" || !quoteText.trim()) {
      return NextResponse.json({ error: "Book key and highlighted passage are required" }, { status: 400 })
    }

    const note = await prisma.bookNote.create({
      data: {
        bookKey: String(bookKey),
        bookTitle: String(bookTitle || "Untitled"),
        bookAuthor: String(bookAuthor || "Unknown Author"),
        quoteText: String(quoteText).trim(),
        noteText: noteText?.trim() || null,
        color: ["amber", "blue", "emerald", "rose"].includes(color) ? color : "amber",
        pageNumber: Math.max(1, Number(pageNumber) || 1),
        userId: session.user.id,
      },
    })

    checkAndAwardBadges(session.user.id).catch(() => {})

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Create note error:", error)
    return NextResponse.json({ error: "Failed to save highlight" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 })
    }

    const existing = await prisma.bookNote.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.bookNote.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("Delete note error:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}

