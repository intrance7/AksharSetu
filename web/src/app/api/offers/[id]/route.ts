import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { conversationChannel, userChannel } from "@/lib/messaging/constants"
import { MessagingError, errorResponse, readJson } from "@/lib/messaging/http"
import {
  serializeMessage,
  serializeOffer,
  triggerRealtime,
  MESSAGE_INCLUDE,
} from "@/lib/messaging/service"

// PATCH /api/offers/[id] — seller accepts/rejects or buyer withdraws a pending offer
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const myId = session.user.id
    const { id: offerId } = await params
    const body = await readJson<any>(req)
    const { status } = body as { status?: "ACCEPTED" | "REJECTED" | "WITHDRAWN" }

    if (!status || !["ACCEPTED", "REJECTED", "WITHDRAWN"].includes(status)) {
      throw new MessagingError(400, "Invalid offer action.", "BAD_REQUEST")
    }

    const existing = await prisma.bookOffer.findUnique({
      where: { id: offerId },
      include: { book: true },
    })

    if (!existing) {
      throw new MessagingError(404, "Offer not found.", "NOT_FOUND")
    }

    if (existing.status !== "PENDING") {
      throw new MessagingError(
        400,
        `This offer is already ${existing.status.toLowerCase()}.`,
        "ALREADY_RESOLVED"
      )
    }

    if (new Date(existing.expiresAt).getTime() < Date.now()) {
      await prisma.bookOffer.update({
        where: { id: offerId },
        data: { status: "EXPIRED" },
      })
      throw new MessagingError(400, "This offer has expired.", "OFFER_EXPIRED")
    }

    if (status === "WITHDRAWN") {
      if (existing.buyerId !== myId) {
        throw new MessagingError(
          403,
          "Only the buyer who submitted this offer can withdraw it.",
          "FORBIDDEN"
        )
      }
    } else {
      if (existing.sellerId !== myId) {
        throw new MessagingError(
          403,
          "Only the seller can accept or reject this offer.",
          "FORBIDDEN"
        )
      }
    }

    const otherUserId =
      myId === existing.sellerId ? existing.buyerId : existing.sellerId
    const actorName =
      session.user.name || session.user.email?.split("@")[0] || "Reader"

    const systemText =
      status === "ACCEPTED"
        ? `✅ ${actorName} accepted the offer of ₹${existing.amount} for "${existing.book.title}".`
        : status === "REJECTED"
        ? `❌ ${actorName} declined the offer of ₹${existing.amount} for "${existing.book.title}".`
        : `↩️ ${actorName} withdrew their offer of ₹${existing.amount}.`

    const { updatedOffer, sysMsg } = await prisma.$transaction(async (tx) => {
      const uOffer = await tx.bookOffer.update({
        where: { id: offerId },
        data: {
          status,
          respondedAt: new Date(),
        },
      })

      const sMsg = await tx.message.create({
        data: {
          conversationId: existing.conversationId,
          type: "SYSTEM",
          content: systemText,
          senderId: myId,
          receiverId: otherUserId,
          meta: {
            kind: "OFFER_DECISION",
            offerId: uOffer.id,
            status,
            amount: uOffer.amount,
          },
          read: false,
        },
        include: MESSAGE_INCLUDE,
      })

      await tx.conversation.update({
        where: { id: existing.conversationId },
        data: {
          lastMessageId: sMsg.id,
          lastMessageAt: sMsg.createdAt,
          lastMessagePreview: systemText.slice(0, 140),
          lastMessageSenderId: myId,
        },
      })

      return { updatedOffer: uOffer, sysMsg: sMsg }
    })

    const offerDto = serializeOffer(updatedOffer)
    const msgDto = serializeMessage(sysMsg)

    prisma.notification
      .create({
        data: {
          userId: otherUserId,
          type: status === "ACCEPTED" ? "OFFER_ACCEPTED" : "OFFER_UPDATE",
          message: systemText,
          link: `/messages/${myId}?book=${existing.bookId}`,
        },
      })
      .catch(() => {})

    const legacyChannel = `chat-dm-${[existing.buyerId, existing.sellerId]
      .sort()
      .join("-")}`

    await Promise.all([
      triggerRealtime(
        conversationChannel(existing.conversationId),
        "offer-updated",
        offerDto
      ),
      triggerRealtime(
        conversationChannel(existing.conversationId),
        "new-message",
        msgDto
      ),
      triggerRealtime(userChannel(otherUserId), "inbox-update", {
        conversationId: existing.conversationId,
        kind: "update",
        senderId: myId,
        senderName: actorName,
        preview: systemText,
      }),
      triggerRealtime(legacyChannel, "offer-updated", offerDto),
      triggerRealtime(legacyChannel, "new-message", msgDto),
    ])

    return NextResponse.json({ offer: offerDto, message: msgDto })
  } catch (error) {
    return errorResponse(error)
  }
}
