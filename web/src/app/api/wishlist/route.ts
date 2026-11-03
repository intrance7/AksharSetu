import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // Cross-match each wishlist alert against live AVAILABLE physical listings
    const enriched = await Promise.all(
      wishlists.map(async (item) => {
        const orClauses: Array<Record<string, unknown>> = []
        if (item.title && item.title.trim()) {
          orClauses.push({
            title: { contains: item.title.trim(), mode: "insensitive" },
          })
        }
        if (item.isbn && item.isbn.trim()) {
          orClauses.push({ isbn: item.isbn.trim() })
        }

        const matches =
          orClauses.length > 0
            ? await prisma.book.findMany({
                where: {
                  status: "AVAILABLE",
                  OR: orClauses as any,
                },
                select: {
                  id: true,
                  title: true,
                  author: true,
                  price: true,
                  condition: true,
                  acceptsExchange: true,
                },
                take: 3,
              })
            : []

        return {
          ...item,
          matches,
        }
      })
    )

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("Fetch wishlist error:", error)
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
    const { title, isbn } = body

    if (!title && !isbn) {
      return NextResponse.json(
        { error: "Must provide either title or isbn" },
        { status: 400 }
      )
    }

    const existing = await prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
        title: title || undefined,
        isbn: isbn || undefined,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Already in wishlist" },
        { status: 400 }
      )
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        title,
        isbn,
        userId: session.user.id,
      },
    })

    return NextResponse.json(wishlist, { status: 201 })
  } catch (error: any) {
    console.error("Create wishlist error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 })
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
    })

    if (!wishlist || wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.wishlist.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete wishlist error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
