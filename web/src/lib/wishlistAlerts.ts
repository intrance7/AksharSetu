import prisma from "@/lib/prisma"
import { triggerPusherEvent } from "@/lib/pusher-server"

export async function notifyWishlistMatches({
  bookId,
  title,
  isbn,
  sellerId,
}: {
  bookId: string
  title: string
  isbn?: string | null
  sellerId: string
}) {
  try {
    const orClauses: Array<Record<string, unknown>> = [
      { title: { contains: title.trim(), mode: "insensitive" } },
    ]
    if (isbn && isbn.trim()) {
      orClauses.push({ isbn: isbn.trim() })
    }

    const matchingWishlists = await prisma.wishlist.findMany({
      where: {
        userId: { not: sellerId },
        OR: orClauses as any,
      },
      select: { userId: true },
    })

    const usersToNotify = Array.from(
      new Set(matchingWishlists.map((w) => w.userId))
    )
    if (usersToNotify.length === 0) return

    const message = `Wishlist Match: "${title}" was just listed in the marketplace!`
    const link = `/catalog/${bookId}`

    await prisma.notification.createMany({
      data: usersToNotify.map((userId) => ({
        userId,
        type: "WISHLIST_ALERT",
        message,
        link,
      })),
    })

    for (const userId of usersToNotify) {
      await triggerPusherEvent(`notify-${userId}`, "new-notification", {
        message,
        link,
      })
    }
  } catch (error) {
    console.error("Wishlist alert dispatch error:", error)
  }
}

