import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { pusherServer } from "@/lib/pusher"

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

    // --- WISHLIST ALERT LOGIC ---
    // Find wishlists that match by exact ISBN or substring of the Title
    const matchingWishlists = await prisma.wishlist.findMany({
      where: {
        userId: { not: session.user.id }, // don't notify the person listing it
        OR: [
          { isbn: isbn || "NO_MATCH_ISBN" },
          { title: { contains: title, mode: 'insensitive' } }
        ]
      }
    })

    // Deduplicate user IDs so a user doesn't get 5 notifications if they have 5 matching wishlists
    const usersToNotify = Array.from(new Set(matchingWishlists.map(w => w.userId)))

    if (usersToNotify.length > 0) {
      const notificationsToCreate = usersToNotify.map(userId => ({
        userId,
        type: "WISHLIST_ALERT",
        message: `A book on your wishlist ("${title}") was just listed!`,
        link: `/catalog/${book.id}`,
      }))

      await prisma.notification.createMany({
        data: notificationsToCreate
      })

      // Emit Pusher events to all matched users
      for (const userId of usersToNotify) {
        await pusherServer.trigger(
          `notify-${userId}`,
          'new-notification',
          { message: `A book on your wishlist ("${title}") was just listed!`, link: `/catalog/${book.id}` }
        )
      }
    }
    // ----------------------------

    return NextResponse.json(book, { status: 201 })
  } catch (error: any) {
    console.error("Listing creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
