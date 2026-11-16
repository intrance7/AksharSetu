import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  OFFER_TTL_MS,
  RATE_LIMITS,
  conversationChannel,
  userChannel,
} from "@/lib/messaging/constants"
import { MessagingError, errorResponse } from "@/lib/messaging/http"
import {
  requireConversationParticipant,
  checkBlockStatus,
  serializeMessage,
  serializeOffer,
  triggerRealtime,
  MESSAGE_INCLUDE,
} from "@/lib/messaging/service"

// POST /api/offers — buyer submits a structured price offer inside a conversation
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const myId = session.user.id
    const body = await req.json()
    const { conversationId, bookId, amount, note } = body

    if (!conversationId || typeof conversationId !== "string") {
      throw new MessagingError(400, "conversationId is required.", "BAD_REQUEST")
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 100000) {
      throw new MessagingError(
        400,
        "Please enter a valid offer amount greater than ₹0.",
        "INVALID_AMOUNT"
      )
    }

    const { conv, otherParticipant } = await requireConversationParticipant(
      conversationId,
      myId
    )

    const block = await checkBlockStatus(myId, otherParticipant.userId)
    if (block.isBlocked) {
      throw new MessagingError(403, "Cannot send offers in this conversation.", "BLOCKED")
    }

    const targetBookId = bookId || conv.bookId
    if (!targetBookId) {
      throw new MessagingError(
        400,
        "No book listing is linked to this conversation.",
        "NO_BOOK_CONTEXT"
      )
    }

    const book = await prisma.book.findUnique({
      where: { id: targetBookId },
    })

    if (!book) {
      throw new MessagingError(404, "Book listing not found.", "NOT_FOUND")
    }

    if (book.ownerId === myId) {
      throw new MessagingError(
        400,
        "You cannot make an offer on your own listing.",
        "SELF_OFFER"
      )
    }

    if (book.status === "SOLD") {
      throw new MessagingError(
        400,
        "This book has already been marked as sold.",
        "BOOK_SOLD"
      )
    }

    // Rate limit offers per hour per conversation
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentOffers = await prisma.bookOffer.count({
      where: {
        conversationId: conv.id,
        buyerId: myId,
        createdAt: { gte: hourAgo },
      },
    })
    if (recentOffers >= RATE_LIMITS.offersPerHourPerConversation) {
      throw new MessagingError(
        429,
        "Too many offers submitted recently. Please wait for the seller to respond.",
        "RATE_LIMITED"
      )
    }

    const cleanNote = note ? String(note).trim().slice(0, 240) : null
    const roundedAmount = Math.round(numericAmount)
    const expiresAt = new Date(Date.now() + OFFER_TTL_MS)

    const { offer, message } = await prisma.$transaction(async (tx) => {
      // Withdraw any previous pending offer by this buyer in this conversation
      await tx.bookOffer.updateMany({
        where: {
          conversationId: conv.id,
          buyerId: myId,
          status: "PENDING",
        },
        data: { status: "WITHDRAWN", respondedAt: new Date() },
      })

      // Ensure conversation is linked to this book
      if (!conv.bookId) {
        await tx.conversation.update({
          where: { id: conv.id },
          data: {
            bookId: book.id,
            type: "LISTING",
            buyerId: myId,
            sellerId: book.ownerId,
          },
        })
      }

      const createdOffer = await tx.bookOffer.create({
        data: {
          conversationId: conv.id,
          bookId: book.id,
          buyerId: myId,
          sellerId: book.ownerId,
          amount: roundedAmount,
          listPrice: book.price,
          status: "PENDING",
          note: cleanNote,
          expiresAt,
        },
      })

      const createdMsg = await tx.message.create({
        data: {
          conversationId: conv.id,
          type: "OFFER",
          content: `Offered ₹${roundedAmount} for "${book.title}" (listed at ₹${book.price})${
            cleanNote ? ` — "${cleanNote}"` : ""
          }`,
          senderId: myId,
          receiverId: book.ownerId,
          offerId: createdOffer.id,
          read: false,
        },
        include: MESSAGE_INCLUDE,
      })

      await tx.conversation.update({
        where: { id: conv.id },
        data: {
          lastMessageId: createdMsg.id,
          lastMessageAt: createdMsg.createdAt,
          lastMessagePreview: `💰 Offer: ₹${roundedAmount} for ${book.title}`.slice(
            0,
            140
          ),
          lastMessageSenderId: myId,
        },
      })

      return { offer: createdOffer, message: createdMsg }
    })

    const msgDto = serializeMessage(message)
    const offerDto = serializeOffer(offer)
    const buyerName =
      session.user.name || session.user.email?.split("@")[0] || "A buyer"

    if (!otherParticipant.isMuted && otherParticipant.user.notifyOffers) {
      prisma.notification
        .create({
          data: {
            userId: book.ownerId,
            type: "NEW_OFFER",
            message: `${buyerName} offered ₹${roundedAmount} for "${book.title}" (listed at ₹${book.price}).`,
            link: `/messages/${myId}?book=${book.id}`,
          },
        })
        .catch(() => {})
    }

    const legacyChannel = `chat-dm-${[myId, book.ownerId].sort().join("-")}`
    await Promise.all([
      triggerRealtime(conversationChannel(conv.id), "new-message", msgDto),
      triggerRealtime(conversationChannel(conv.id), "offer-updated", offerDto),
      triggerRealtime(userChannel(book.ownerId), "inbox-update", {
        conversationId: conv.id,
        kind: "message",
        senderId: myId,
        senderName: buyerName,
        preview: `Offered ₹${roundedAmount} for "${book.title}"`,
      }),
      triggerRealtime(legacyChannel, "new-message", msgDto),
      triggerRealtime(legacyChannel, "offer-updated", offerDto),
    ])

    return NextResponse.json({ offer: offerDto, message: msgDto }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
