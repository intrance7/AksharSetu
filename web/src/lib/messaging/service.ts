import prisma from "@/lib/prisma"
import { pusherServer, isPusherServerConfigured } from "@/lib/pusher"
import {
  MAX_MESSAGE_LENGTH,
  MESSAGE_PAGE_SIZE,
  EDIT_WINDOW_MS,
  OFFER_TTL_MS,
  ONLINE_WINDOW_MS,
  RATE_LIMITS,
  conversationChannel,
  userChannel,
  type OfferStatus,
} from "./constants"
import { MessagingError } from "./http"
import type {
  MessageDTO,
  OfferDTO,
  ReactionDTO,
  MessageAttachmentDTO,
} from "./types"

export function isUserOnline(lastSeenAt?: Date | string | null, isShantiModeActive?: boolean): boolean {
  if (isShantiModeActive) return true
  if (!lastSeenAt) return false
  const ts = typeof lastSeenAt === "string" ? new Date(lastSeenAt).getTime() : lastSeenAt.getTime()
  return Date.now() - ts <= ONLINE_WINDOW_MS
}

export async function touchUserPresence(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    })
  } catch {
    // Non-fatal
  }
}

export async function triggerRealtime(channel: string, event: string, payload: unknown) {
  if (!isPusherServerConfigured) return
  try {
    await pusherServer.trigger(channel, event, payload)
  } catch {
    // Non-fatal fallback to polling
  }
}

/**
 * Ensures any legacy Message rows (where conversationId is null) involving `userId`
 * are attached to a normalized `Conversation` with `ConversationParticipant` records.
 */
export async function syncLegacyMessagesForUser(userId: string) {
  const orphans = await prisma.message.findMany({
    where: {
      conversationId: null,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  })

  if (orphans.length === 0) return

  const pairMap = new Map<string, typeof orphans>()
  for (const m of orphans) {
    const [a, b] = [m.senderId, m.receiverId].sort()
    const key = `direct:${a}:${b}`
    const arr = pairMap.get(key) || []
    arr.push(m)
    pairMap.set(key, arr)
  }

  for (const [key, msgs] of pairMap.entries()) {
    const parts = key.split(":")
    const userA = parts[1]
    const userB = parts[2]
    const lastMsg = msgs[msgs.length - 1]

    const conv = await prisma.conversation.upsert({
      where: { key },
      update: {
        lastMessageId: lastMsg.id,
        lastMessageAt: lastMsg.createdAt,
        lastMessagePreview: lastMsg.content.slice(0, 140),
        lastMessageSenderId: lastMsg.senderId,
      },
      create: {
        key,
        type: "DIRECT",
        createdById: msgs[0].senderId,
        lastMessageId: lastMsg.id,
        lastMessageAt: lastMsg.createdAt,
        lastMessagePreview: lastMsg.content.slice(0, 140),
        lastMessageSenderId: lastMsg.senderId,
        participants: {
          create: [
            { userId: userA, role: "MEMBER", lastReadAt: new Date() },
            { userId: userB, role: "MEMBER" },
          ],
        },
      },
    })

    await prisma.message.updateMany({
      where: { id: { in: msgs.map((m) => m.id) } },
      data: { conversationId: conv.id },
    })
  }
}

export async function checkBlockStatus(myUserId: string, otherUserId: string) {
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [
        { blockerId: myUserId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: myUserId },
      ],
    },
  })
  return {
    blockedByMe: blocks.some((b) => b.blockerId === myUserId),
    blockedMe: blocks.some((b) => b.blockerId === otherUserId),
    isBlocked: blocks.length > 0,
  }
}

export async function findOrCreateConversation(params: {
  initiatorId: string
  otherUserId: string
  bookId?: string | null
}) {
  const { initiatorId, otherUserId, bookId } = params
  if (initiatorId === otherUserId) {
    throw new MessagingError(400, "You cannot start a conversation with yourself.", "SELF_CHAT")
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true },
  })
  if (!otherUser) {
    throw new MessagingError(404, "Reader not found.", "USER_NOT_FOUND")
  }

  let key: string
  let type: "DIRECT" | "LISTING" = "DIRECT"
  let buyerId: string | null = null
  let sellerId: string | null = null
  let resolvedBookId: string | null = null

  if (bookId) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, ownerId: true },
    })
    if (book && (book.ownerId === otherUserId || book.ownerId === initiatorId)) {
      resolvedBookId = book.id
      sellerId = book.ownerId
      buyerId = book.ownerId === initiatorId ? otherUserId : initiatorId
      key = `listing:${book.id}:${buyerId}`
      type = "LISTING"
    } else {
      const [a, b] = [initiatorId, otherUserId].sort()
      key = `direct:${a}:${b}`
    }
  } else {
    const [a, b] = [initiatorId, otherUserId].sort()
    key = `direct:${a}:${b}`
  }

  const existing = await prisma.conversation.findUnique({
    where: { key },
    include: { participants: true },
  })

  if (existing) {
    // Ensure both participants exist
    const hasInitiator = existing.participants.some((p) => p.userId === initiatorId)
    const hasOther = existing.participants.some((p) => p.userId === otherUserId)
    if (!hasInitiator) {
      await prisma.conversationParticipant.create({
        data: {
          conversationId: existing.id,
          userId: initiatorId,
          role: sellerId === initiatorId ? "SELLER" : buyerId === initiatorId ? "BUYER" : "MEMBER",
        },
      })
    }
    if (!hasOther) {
      await prisma.conversationParticipant.create({
        data: {
          conversationId: existing.id,
          userId: otherUserId,
          role: sellerId === otherUserId ? "SELLER" : buyerId === otherUserId ? "BUYER" : "MEMBER",
        },
      })
    }
    return existing
  }

  const block = await checkBlockStatus(initiatorId, otherUserId)
  if (block.isBlocked) {
    throw new MessagingError(
      403,
      "Unable to start a conversation with this user.",
      "BLOCKED"
    )
  }

  // Rate limit new conversations
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const createdRecent = await prisma.conversation.count({
    where: { createdById: initiatorId, createdAt: { gte: hourAgo } },
  })
  if (createdRecent >= RATE_LIMITS.newConversationsPerHour) {
    throw new MessagingError(
      429,
      "Too many new conversations started recently. Please wait a moment.",
      "RATE_LIMITED"
    )
  }

  return prisma.conversation.create({
    data: {
      key,
      type,
      createdById: initiatorId,
      bookId: resolvedBookId,
      buyerId,
      sellerId,
      participants: {
        create: [
          {
            userId: initiatorId,
            role:
              sellerId === initiatorId
                ? "SELLER"
                : buyerId === initiatorId
                ? "BUYER"
                : "MEMBER",
            lastReadAt: new Date(),
            lastDeliveredAt: new Date(),
          },
          {
            userId: otherUserId,
            role:
              sellerId === otherUserId
                ? "SELLER"
                : buyerId === otherUserId
                ? "BUYER"
                : "MEMBER",
          },
        ],
      },
    },
    include: { participants: true },
  })
}

export async function requireConversationParticipant(conversationId: string, userId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              bio: true,
              location: true,
              favoriteQuote: true,
              quoteAuthor: true,
              isShantiModeActive: true,
              liveStatus: true,
              lastSeenAt: true,
              sellerRating: true,
              booksSold: true,
              successfulExchanges: true,
              responseTime: true,
              createdAt: true,
              notifyMessages: true,
              notifyOffers: true,
            },
          },
        },
      },
      book: {
        include: {
          owner: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  })

  if (!conv) {
    throw new MessagingError(404, "Conversation not found.", "NOT_FOUND")
  }

  const meParticipant = conv.participants.find((p) => p.userId === userId)
  if (!meParticipant) {
    throw new MessagingError(403, "You are not a participant in this conversation.", "FORBIDDEN")
  }

  const otherParticipant = conv.participants.find((p) => p.userId !== userId)
  if (!otherParticipant) {
    throw new MessagingError(404, "Recipient not found in conversation.", "NOT_FOUND")
  }

  return { conv, meParticipant, otherParticipant }
}

export function serializeOffer(raw: any): OfferDTO {
  const now = Date.now()
  const expMs = new Date(raw.expiresAt).getTime()
  const effectiveStatus: OfferStatus =
    raw.status === "PENDING" && expMs < now ? "EXPIRED" : raw.status

  return {
    id: raw.id,
    amount: raw.amount,
    listPrice: raw.listPrice,
    status: effectiveStatus,
    note: raw.note || null,
    expiresAt: new Date(raw.expiresAt).toISOString(),
    respondedAt: raw.respondedAt ? new Date(raw.respondedAt).toISOString() : null,
    createdAt: new Date(raw.createdAt).toISOString(),
    buyerId: raw.buyerId,
    sellerId: raw.sellerId,
    bookId: raw.bookId,
  }
}

export function serializeMessage(raw: any): MessageDTO {
  const isDeleted = Boolean(raw.deletedAt)

  const attachments: MessageAttachmentDTO[] = isDeleted
    ? []
    : (raw.attachments || []).map((a: any) => ({
        id: a.id,
        kind: a.kind === "IMAGE" ? "IMAGE" : "FILE",
        mimeType: a.mimeType,
        fileName: a.fileName,
        size: a.size,
        width: a.width ?? null,
        height: a.height ?? null,
        url: `/api/messages/attachments/${a.id}`,
      }))

  const reactionMap = new Map<string, string[]>()
  if (!isDeleted && Array.isArray(raw.reactions)) {
    for (const r of raw.reactions) {
      const list = reactionMap.get(r.emoji) || []
      list.push(r.userId)
      reactionMap.set(r.emoji, list)
    }
  }
  const reactions: ReactionDTO[] = Array.from(reactionMap.entries()).map(
    ([emoji, userIds]) => ({ emoji, userIds })
  )

  return {
    id: raw.id,
    conversationId: raw.conversationId || "",
    clientId: raw.clientId || null,
    type: (raw.type as any) || "TEXT",
    content: isDeleted ? "This message was deleted" : raw.content,
    createdAt: new Date(raw.createdAt).toISOString(),
    editedAt: raw.editedAt ? new Date(raw.editedAt).toISOString() : null,
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt).toISOString() : null,
    sender: {
      id: raw.sender.id,
      name: raw.sender.name || raw.sender.email?.split("@")[0] || "Reader",
      image: raw.sender.image || null,
    },
    replyTo: raw.replyTo
      ? {
          id: raw.replyTo.id,
          senderId: raw.replyTo.senderId,
          senderName:
            raw.replyTo.sender?.name ||
            raw.replyTo.sender?.email?.split("@")[0] ||
            "Reader",
          content: raw.replyTo.deletedAt
            ? "Deleted message"
            : raw.replyTo.content.slice(0, 120),
          deleted: Boolean(raw.replyTo.deletedAt),
          hasAttachments: Array.isArray(raw.replyTo.attachments)
            ? raw.replyTo.attachments.length > 0
            : false,
          type: raw.replyTo.type || "TEXT",
        }
      : null,
    attachments,
    reactions,
    offer: raw.offer ? serializeOffer(raw.offer) : null,
    meta: (raw.meta as Record<string, unknown>) || null,
  }
}

export const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, email: true, image: true } },
  replyTo: {
    include: {
      sender: { select: { id: true, name: true, email: true } },
      attachments: { select: { id: true } },
    },
  },
  attachments: {
    select: {
      id: true,
      kind: true,
      mimeType: true,
      fileName: true,
      size: true,
      width: true,
      height: true,
    },
  },
  reactions: {
    select: {
      emoji: true,
      userId: true,
    },
  },
  offer: true,
} as const
