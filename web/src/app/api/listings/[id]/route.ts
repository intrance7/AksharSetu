import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            location: true,
            sellerRating: true,
          },
        },
      },
    })
    if (!book) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }
    return NextResponse.json(book)
  } catch (error) {
    console.error("GET listing error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.book.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (existing.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const updateData: Record<string, unknown> = {}

    if (typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim()
    }
    if (typeof body.author === "string" && body.author.trim()) {
      updateData.author = body.author.trim()
    }
    if (typeof body.description === "string") {
      updateData.description = body.description.trim() || null
    }
    if (typeof body.condition === "string") {
      updateData.condition = body.condition
    }
    if (typeof body.category === "string") {
      updateData.category = body.category
    }
    if (body.price !== undefined) {
      const parsed = Number(body.price)
      if (!Number.isNaN(parsed) && parsed >= 0) {
        updateData.price = parsed
      }
    }
    if (typeof body.acceptsExchange === "boolean") {
      updateData.acceptsExchange = body.acceptsExchange
    }
    if (typeof body.exchangePreferences === "string") {
      updateData.exchangePreferences = body.exchangePreferences.trim() || null
    }
    if (
      typeof body.status === "string" &&
      ["AVAILABLE", "RESERVED", "SOLD", "DONATED", "UNLISTED"].includes(body.status)
    ) {
      updateData.status = body.status
    }
    if (typeof body.university === "string") {
      updateData.university = body.university.trim() || null
    }
    if (typeof body.course === "string") {
      updateData.course = body.course.trim() || null
    }
    if (body.semester !== undefined) {
      if (body.semester === null || body.semester === "") {
        updateData.semester = null
      } else {
        const parsedSem = parseInt(String(body.semester), 10)
        if (Number.isFinite(parsedSem) && parsedSem >= 1 && parsedSem <= 12) {
          updateData.semester = parsedSem
        }
      }
    }

    const updated = await prisma.book.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PATCH listing error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.book.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true, requests: true },
        },
        donation: { select: { id: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (existing.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Preserve relational history if orders, requests, or donations exist
    if (
      existing._count.orders > 0 ||
      existing._count.requests > 0 ||
      Boolean(existing.donation)
    ) {
      const archived = await prisma.book.update({
        where: { id },
        data: { status: "UNLISTED" },
      })
      return NextResponse.json({ deleted: false, archived: true, book: archived })
    }

    await prisma.book.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("DELETE listing error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

