import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(wishlists)
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
      return NextResponse.json({ error: "Must provide either title or isbn" }, { status: 400 })
    }

    // Check if duplicate exists
    const existing = await prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
        title: title || undefined,
        isbn: isbn || undefined,
      }
    })

    if (existing) {
      return NextResponse.json({ error: "Already in wishlist" }, { status: 400 })
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
      where: { id }
    })

    if (!wishlist || wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.wishlist.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete wishlist error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
