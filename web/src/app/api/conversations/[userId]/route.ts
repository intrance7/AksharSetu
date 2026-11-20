import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  MAX_MESSAGE_LENGTH,
  MESSAGE_PAGE_SIZE,
  EDIT_WINDOW_MS,
  MAX_PINNED_CONVERSATIONS,
  RATE_LIMITS,
  LISTING_STATUSES,
  conversationChannel,
  userChannel,
} from "@/lib/messaging/constants"
import { isAllowedEmoji } from "@/lib/messaging/emoji"
import { MessagingError, errorResponse, readJson } from "@/lib/messaging/http"
import { areMutualFollowers } from "@/lib/shantiVisibility"
import {
  syncLegacyMessagesForUser,
  touchUserPresence,
  isUserOnline,
  checkBlockStatus,
  findOrCreateConversation,
  requireConversationParticipant,
  serializeMessage,
  serializeOffer,
  triggerRealtime,
  MESSAGE_INCLUDE,
} from "@/lib/messaging/service"

async function resolveConversationContext(
  paramId: string,
  myId: string,
  bookId?: string | null
) {
  await syncLegacyMessagesForUser(myId)

  // First check if paramId is already a Conversation ID
  const directConv = await prisma.conversation.findUnique({
    where: { id: paramId },
    select: { id: true },
  })

  let targetConvId = directConv?.id

  if (!targetConvId) {
    // Otherwise treat paramId as otherUserId and find-or-create the conversation
    const createdOrFound = await findOrCreateConversation({
      initiatorId: myId,
      otherUserId: paramId,
      bookId: bookId || null,
    })
    targetConvId = createdOrFound.id
  } else if (bookId) {
    // If conversation exists as DIRECT and user just navigated from a book listing, bind book context if none set
    const existingConv = await prisma.conversation.findUnique({
      where: { id: targetConvId },
      select: { id: true, bookId: true },
    })
    if (existingConv && !existingConv.bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true, ownerId: true },
      })
      if (book) {
        await prisma.conversation.update({
          where: { id: targetConvId },
          data: {
            bookId: book.id,
            type: "LISTING",
            sellerId: book.ownerId,
          },
        })
      }
    }
  }

  return requireConversationParticipant(targetConvId, myId)
}

// GET /api/conversations/[userId] — fetch conversation metadata, paginated messages, offers, and shared media
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: paramId } = await params
    const myId = session.user.id
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get("bookId")
    const cursor = searchParams.get("cursor")
    const searchQuery = (searchParams.get("q") || "").trim()
    const limit = Math.min(
      60,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || String(MESSAGE_PAGE_SIZE), 10) ||
          MESSAGE_PAGE_SIZE
      )
    )

    const { conv, meParticipant, otherParticipant } =
      await resolveConversationContext(paramId, myId, bookId)

    const otherRaw = otherParticipant.user
    const now = new Date()
    const previousLastReadAt = meParticipant.lastReadAt

    // Update read & delivery timestamps + mark legacy unread flags
    const [, updatedLegacy] = await Promise.all([
      prisma.conversationParticipant.update({
        where: { id: meParticipant.id },
        data: { lastReadAt: now, lastDeliveredAt: now },
      }),
      prisma.message.updateMany({
        where: {
          OR: [
            { conversationId: conv.id, senderId: otherRaw.id, read: false },
            { senderId: otherRaw.id, receiverId: myId, read: false },
          ],
        },
        data: { read: true },
      }),
      touchUserPresence(myId),
    ])

    if (updatedLegacy.count > 0) {
      const legacyChannel = `chat-dm-${[myId, otherRaw.id].sort().join("-")}`
      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "messages-read", {
          conversationId: conv.id,
          readerId: myId,
          readAt: now.toISOString(),
        }),
        triggerRealtime(legacyChannel, "messages-read", {
          readerId: myId,
          readAt: now.toISOString(),
        }),
      ])
    }

    // Build message query (cursor-paginated or search)
    const whereClause: any = {
      OR: [
        { conversationId: conv.id },
        {
          conversationId: null,
          OR: [
            { senderId: myId, receiverId: otherRaw.id },
            { senderId: otherRaw.id, receiverId: myId },
          ],
        },
      ],
    }

    if (searchQuery) {
      whereClause.content = { contains: searchQuery, mode: "insensitive" }
      whereClause.deletedAt = null
    }

    const rawMessages = await prisma.message.findMany({
      where: whereClause,
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = rawMessages.length > limit
    const slice = hasMore ? rawMessages.slice(0, limit) : rawMessages
    const nextCursor = hasMore ? slice[slice.length - 1]?.id || null : null
    const chronological = [...slice].reverse().map(serializeMessage)

    // Fetch other user's shelf, shared attachments, offers, active book request, and block state in parallel
    const [otherBooks, sharedAttachments, offersRaw, blockState, myPrefs, activeBookRequest] =
      await Promise.all([
        prisma.book.findMany({
          where: { ownerId: otherRaw.id, status: { in: ["AVAILABLE", "RESERVED"] } },
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            author: true,
            price: true,
            condition: true,
            status: true,
            deliveryType: true,
            acceptsExchange: true,
            images: true,
          },
        }),
        prisma.messageAttachment.findMany({
          where: {
            conversationId: conv.id,
            message: { deletedAt: null },
          },
          orderBy: { createdAt: "desc" },
          take: 24,
          select: {
            id: true,
            kind: true,
            mimeType: true,
            fileName: true,
            size: true,
            width: true,
            height: true,
            createdAt: true,
          },
        }),
        prisma.bookOffer.findMany({
          where: { conversationId: conv.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        checkBlockStatus(myId, otherRaw.id),
        prisma.user.findUnique({
          where: { id: myId },
          select: { notifyMessages: true, notifyOffers: true },
        }),
        conv.book
          ? prisma.bookRequest.findFirst({
              where: {
                bookId: conv.book.id,
                requesterId: { in: [myId, otherRaw.id] },
              },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                status: true,
                requesterId: true,
                createdAt: true,
              },
            })
          : Promise.resolve(null),
      ])

    const serializedOffers = offersRaw.map(serializeOffer)
    const acceptedOffer =
      serializedOffers.find((o) => o.status === "ACCEPTED") || null
    const pendingOffer =
      serializedOffers.find((o) => o.status === "PENDING") || null

    const role =
      conv.sellerId === myId || conv.book?.ownerId === myId
        ? "SELLER"
        : conv.buyerId === myId || (conv.book && conv.book.ownerId !== myId)
        ? "BUYER"
        : (meParticipant.role as "BUYER" | "SELLER" | "MEMBER")

    const canSeeShanti = await areMutualFollowers(myId, otherRaw.id)
    const online = isUserOnline(
      otherRaw.lastSeenAt,
      canSeeShanti ? otherRaw.isShantiModeActive : false
    )
    const username =
      otherRaw.email?.split("@")[0] ||
      (otherRaw.name || "reader").toLowerCase().replace(/\s+/g, "")

    return NextResponse.json({
      conversation: {
        id: conv.id,
        key: conv.key,
        type: conv.type,
        role,
        previousLastReadAt: previousLastReadAt
          ? previousLastReadAt.toISOString()
          : null,
        me: {
          isMuted: meParticipant.isMuted,
          isArchived: meParticipant.isArchived,
          isPinned: meParticipant.isPinned,
          lastReadAt: now.toISOString(),
          notifyMessages: myPrefs?.notifyMessages ?? true,
          notifyOffers: myPrefs?.notifyOffers ?? true,
        },
        book: conv.book
          ? {
              id: conv.book.id,
              title: conv.book.title,
              author: conv.book.author,
              image: conv.book.images?.[0] || null,
              images: conv.book.images || [],
              price: conv.book.price,
              condition: conv.book.condition,
              status: conv.book.status,
              deliveryType: conv.book.deliveryType,
              acceptsExchange: conv.book.acceptsExchange,
              ownerId: conv.book.ownerId,
              ownerName:
                conv.book.owner?.name ||
                conv.book.owner?.email?.split("@")[0] ||
                "Seller",
            }
          : null,
        block: blockState,
        acceptedOffer,
        pendingOffer,
        offers: serializedOffers,
        activeBookRequest: activeBookRequest
          ? {
              id: activeBookRequest.id,
              status: activeBookRequest.status,
              requesterId: activeBookRequest.requesterId,
              createdAt: activeBookRequest.createdAt.toISOString(),
            }
          : null,
        sharedMedia: sharedAttachments.map((a) => ({
          id: a.id,
          kind: a.kind,
          mimeType: a.mimeType,
          fileName: a.fileName,
          size: a.size,
          width: a.width,
          height: a.height,
          url: `/api/messages/attachments/${a.id}`,
          createdAt: a.createdAt.toISOString(),
        })),
      },
      otherUser: {
        id: otherRaw.id,
        name: otherRaw.name || otherRaw.email?.split("@")[0] || "Reader",
        username,
        image: otherRaw.image,
        bio: otherRaw.bio,
        location: otherRaw.location,
        favoriteQuote: otherRaw.favoriteQuote,
        quoteAuthor: otherRaw.quoteAuthor,
        isShantiModeActive: canSeeShanti ? otherRaw.isShantiModeActive : false,
        liveStatus: canSeeShanti ? otherRaw.liveStatus : null,
        online,
        lastSeenAt: otherRaw.lastSeenAt ? otherRaw.lastSeenAt.toISOString() : null,
        lastReadAt: otherParticipant.lastReadAt
          ? otherParticipant.lastReadAt.toISOString()
          : null,
        lastDeliveredAt: otherParticipant.lastDeliveredAt
          ? otherParticipant.lastDeliveredAt.toISOString()
          : null,
        sellerRating: otherRaw.sellerRating,
        booksSold: otherRaw.booksSold,
        successfulExchanges: otherRaw.successfulExchanges,
        responseTime: otherRaw.responseTime,
        memberSince: otherRaw.createdAt.toISOString(),
        booksCount: otherBooks.length,
        books: otherBooks,
      },
      messages: chronological,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/conversations/[userId] — send a message (text + optional attachments + optional replyToId)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: paramId } = await params
    const myId = session.user.id
    const body = await readJson<any>(req)
    const {
      content = "",
      clientId,
      replyToId,
      attachmentIds = [],
      bookId,
      requestId,
      orderId,
    } = body

    const trimmed = String(content || "").trim()
    const validAttachmentIds = Array.isArray(attachmentIds)
      ? attachmentIds.filter((id): id is string => typeof id === "string")
      : []

    if (!trimmed && validAttachmentIds.length === 0) {
      throw new MessagingError(
        400,
        "Please enter a message or attach a file.",
        "EMPTY_MESSAGE"
      )
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new MessagingError(
        400,
        `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
        "TOO_LONG"
      )
    }

    const { conv, meParticipant, otherParticipant } =
      await resolveConversationContext(paramId, myId, bookId)
    const otherUserId = otherParticipant.userId

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const [block, existingByClient, recentSent, targetReply] = await Promise.all([
      checkBlockStatus(myId, otherUserId),
      clientId && typeof clientId === "string"
        ? prisma.message.findUnique({
            where: {
              senderId_clientId: {
                senderId: myId,
                clientId,
              },
            },
            include: MESSAGE_INCLUDE,
          })
        : Promise.resolve(null),
      prisma.message.findMany({
        where: {
          senderId: myId,
          createdAt: { gte: oneMinuteAgo },
        },
        select: { content: true },
      }),
      typeof replyToId === "string" && replyToId.trim()
        ? prisma.message.findFirst({
            where: { id: replyToId.trim(), conversationId: conv.id },
            select: { id: true },
          })
        : Promise.resolve(null),
    ])

    if (block.isBlocked) {
      throw new MessagingError(
        403,
        block.blockedByMe
          ? "You have blocked this user. Unblock them to send messages."
          : "You cannot send messages to this user.",
        "BLOCKED"
      )
    }

    if (existingByClient) {
      return NextResponse.json(serializeMessage(existingByClient), { status: 200 })
    }

    if (recentSent.length >= RATE_LIMITS.messagesPerMinute) {
      throw new MessagingError(
        429,
        "You are sending messages too quickly. Please wait a few seconds.",
        "RATE_LIMITED"
      )
    }

    if (trimmed) {
      const sameContentCount = recentSent.filter((m) => m.content === trimmed).length
      if (sameContentCount >= RATE_LIMITS.duplicateMessagesPerMinute) {
        throw new MessagingError(
          429,
          "Duplicate message detected. Please avoid sending repeated messages.",
          "SPAM_DETECTED"
        )
      }
    }

    const validReplyToId = targetReply?.id ?? null
    const now = new Date()
    const previewText =
      trimmed ||
      (validAttachmentIds.length > 0 ? "📎 Shared an attachment" : "New message")

    // Create message directly without a long-running interactive transaction (avoids 5s P2028 timeout on remote Postgres)
    let createdMessage = await prisma.message.create({
      data: {
        conversationId: conv.id,
        type: "TEXT",
        content: trimmed,
        clientId: typeof clientId === "string" ? clientId : null,
        senderId: myId,
        receiverId: otherUserId,
        replyToId: validReplyToId,
        requestId: requestId || null,
        orderId: orderId || null,
        read: false,
      },
      include: MESSAGE_INCLUDE,
    })

    if (validAttachmentIds.length > 0) {
      await prisma.messageAttachment.updateMany({
        where: {
          id: { in: validAttachmentIds },
          uploaderId: myId,
          conversationId: conv.id,
        },
        data: { messageId: createdMessage.id },
      })
      createdMessage = await prisma.message.findUniqueOrThrow({
        where: { id: createdMessage.id },
        include: MESSAGE_INCLUDE,
      })
    }

    await Promise.allSettled([
      prisma.conversation.update({
        where: { id: conv.id },
        data: {
          lastMessageId: createdMessage.id,
          lastMessageAt: now,
          lastMessagePreview: previewText.slice(0, 140),
          lastMessageSenderId: myId,
          updatedAt: now,
        },
      }),
      prisma.conversationParticipant.update({
        where: { id: meParticipant.id },
        data: { lastReadAt: now, lastDeliveredAt: now, isArchived: false },
      }),
    ])

    const dto = serializeMessage(createdMessage)
    const senderName =
      session.user.name || session.user.email?.split("@")[0] || "A reader"

    // Notify recipient if not muted and preferences allow
    if (!otherParticipant.isMuted && otherParticipant.user.notifyMessages) {
      prisma.notification
        .create({
          data: {
            userId: otherUserId,
            type: createdMessage.replyToId ? "MESSAGE_REPLY" : "NEW_MESSAGE",
            message: `${senderName}: "${previewText.slice(0, 65)}${
              previewText.length > 65 ? "..." : ""
            }"`,
            link: `/messages/${myId}${conv.bookId ? `?book=${conv.bookId}` : ""}`,
          },
        })
        .catch(() => {})
    }

    const legacyChannel = `chat-dm-${[myId, otherUserId].sort().join("-")}`
    await Promise.all([
      triggerRealtime(conversationChannel(conv.id), "new-message", dto),
      triggerRealtime(userChannel(otherUserId), "inbox-update", {
        conversationId: conv.id,
        kind: "message",
        senderId: myId,
        senderName,
        preview: previewText.slice(0, 90),
        muted: otherParticipant.isMuted,
      }),
      triggerRealtime(legacyChannel, "new-message", dto),
    ])

    return NextResponse.json(dto, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/conversations/[userId] — edit message, react, typing indicator, pin/archive/mute, or seller listing status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: paramId } = await params
    const myId = session.user.id
    const body = await readJson<any>(req)
    const { action } = body

    const { conv, meParticipant, otherParticipant } =
      await resolveConversationContext(paramId, myId)
    const legacyChannel = `chat-dm-${[myId, otherParticipant.userId].sort().join("-")}`

    // 1. Typing indicator relay
    if (action === "typing") {
      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "typing", {
          conversationId: conv.id,
          userId: myId,
          name: session.user.name || "Reader",
          isTyping: Boolean(body.isTyping),
        }),
        triggerRealtime(legacyChannel, "typing", {
          conversationId: conv.id,
          userId: myId,
          name: session.user.name || "Reader",
          isTyping: Boolean(body.isTyping),
        }),
      ])
      return NextResponse.json({ ok: true })
    }

    // 2. Conversation participant settings (pin, archive, mute, markRead)
    if (action === "settings") {
      const data: Record<string, any> = {}

      if (typeof body.isPinned === "boolean") {
        if (body.isPinned) {
          const pinnedCount = await prisma.conversationParticipant.count({
            where: { userId: myId, isPinned: true },
          })
          if (pinnedCount >= MAX_PINNED_CONVERSATIONS && !meParticipant.isPinned) {
            throw new MessagingError(
              400,
              `You can pin up to ${MAX_PINNED_CONVERSATIONS} conversations.`,
              "PIN_LIMIT"
            )
          }
        }
        data.isPinned = body.isPinned
        data.pinnedAt = body.isPinned ? new Date() : null
      }

      if (typeof body.isArchived === "boolean") {
        data.isArchived = body.isArchived
      }
      if (typeof body.isMuted === "boolean") {
        data.isMuted = body.isMuted
      }
      if (body.markRead) {
        data.lastReadAt = new Date()
        data.lastDeliveredAt = new Date()
      }

      const updated = await prisma.conversationParticipant.update({
        where: { id: meParticipant.id },
        data,
      })

      return NextResponse.json({
        isPinned: updated.isPinned,
        isArchived: updated.isArchived,
        isMuted: updated.isMuted,
      })
    }

    // 3. Edit own message
    if (action === "edit") {
      const { messageId, content } = body
      const trimmed = String(content || "").trim()
      if (!messageId || !trimmed) {
        throw new MessagingError(400, "Message content cannot be empty.", "BAD_REQUEST")
      }
      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        throw new MessagingError(400, "Message is too long.", "TOO_LONG")
      }

      const existing = await prisma.message.findUnique({
        where: { id: messageId },
      })
      if (
        !existing ||
        existing.conversationId !== conv.id ||
        existing.senderId !== myId ||
        existing.deletedAt
      ) {
        throw new MessagingError(403, "You can only edit your own active messages.", "FORBIDDEN")
      }
      if (Date.now() - existing.createdAt.getTime() > EDIT_WINDOW_MS) {
        throw new MessagingError(
          400,
          "Messages can only be edited within 15 minutes of sending.",
          "EDIT_EXPIRED"
        )
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { content: trimmed, editedAt: new Date() },
        include: MESSAGE_INCLUDE,
      })

      if (conv.lastMessageId === messageId) {
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { lastMessagePreview: trimmed.slice(0, 140) },
        })
      }

      const dto = serializeMessage(updated)
      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "message-updated", dto),
        triggerRealtime(legacyChannel, "message-updated", dto),
      ])

      return NextResponse.json(dto)
    }

    // 4. Toggle message reaction
    if (action === "reaction") {
      const { messageId, emoji } = body
      if (!messageId || !isAllowedEmoji(emoji)) {
        throw new MessagingError(400, "Unsupported reaction emoji.", "BAD_REQUEST")
      }

      const targetMsg = await prisma.message.findFirst({
        where: { id: messageId, conversationId: conv.id, deletedAt: null },
        select: { id: true },
      })
      if (!targetMsg) {
        throw new MessagingError(404, "Message not found in this conversation.", "NOT_FOUND")
      }

      const existingReaction = await prisma.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId: myId,
            emoji,
          },
        },
      })

      if (existingReaction) {
        await prisma.messageReaction.delete({ where: { id: existingReaction.id } })
      } else {
        await prisma.messageReaction.create({
          data: { messageId, userId: myId, emoji },
        })
      }

      const updatedMsg = await prisma.message.findUniqueOrThrow({
        where: { id: messageId },
        include: MESSAGE_INCLUDE,
      })
      const dto = serializeMessage(updatedMsg)

      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "message-updated", dto),
        triggerRealtime(legacyChannel, "message-updated", dto),
      ])

      return NextResponse.json(dto)
    }

    // 5. Seller action: update listing status (AVAILABLE | RESERVED | SOLD)
    if (action === "listing_status") {
      const nextStatus = body.status
      if (!LISTING_STATUSES.includes(nextStatus)) {
        throw new MessagingError(400, "Invalid listing status.", "BAD_REQUEST")
      }
      if (!conv.book || conv.book.ownerId !== myId) {
        throw new MessagingError(
          403,
          "Only the seller of this listing can update its availability.",
          "FORBIDDEN"
        )
      }

      const statusLabel =
        nextStatus === "AVAILABLE"
          ? "confirmed the book is Available"
          : nextStatus === "RESERVED"
          ? "marked the book as Reserved"
          : "marked the listing as Sold"

      const [updatedBook, sysMsg] = await prisma.$transaction(async (tx) => {
        const b = await tx.book.update({
          where: { id: conv.book!.id },
          data: { status: nextStatus },
        })

        const m = await tx.message.create({
          data: {
            conversationId: conv.id,
            type: "SYSTEM",
            content: `${session.user.name || "Seller"} ${statusLabel}.`,
            senderId: myId,
            receiverId: otherParticipant.userId,
            meta: { kind: "LISTING_STATUS", status: nextStatus, bookId: b.id },
            read: false,
          },
          include: MESSAGE_INCLUDE,
        })

        await tx.conversation.update({
          where: { id: conv.id },
          data: {
            lastMessageId: m.id,
            lastMessageAt: m.createdAt,
            lastMessagePreview: m.content.slice(0, 140),
            lastMessageSenderId: myId,
          },
        })

        return [b, m] as const
      }, { maxWait: 10000, timeout: 20000 })

      const dto = serializeMessage(sysMsg)
      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "new-message", dto),
        triggerRealtime(conversationChannel(conv.id), "listing-updated", {
          bookId: updatedBook.id,
          status: updatedBook.status,
        }),
        triggerRealtime(legacyChannel, "new-message", dto),
        triggerRealtime(legacyChannel, "listing-updated", {
          bookId: updatedBook.id,
          status: updatedBook.status,
        }),
      ])

      return NextResponse.json({
        bookStatus: updatedBook.status,
        message: dto,
      })
    }

    // 6. Seller/Donator accepts a book request directly inside chat
    if (action === "accept_request") {
      if (!conv.book || conv.book.ownerId !== myId) {
        throw new MessagingError(
          403,
          "Only the book owner can accept this request.",
          "FORBIDDEN"
        )
      }

      const pendingReq = await prisma.bookRequest.findFirst({
        where: {
          bookId: conv.book.id,
          requesterId: otherParticipant.userId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
      })

      if (pendingReq) {
        await prisma.bookRequest.update({
          where: { id: pendingReq.id },
          data: { status: "APPROVED" },
        })
      }

      await prisma.book.update({
        where: { id: conv.book.id },
        data: { status: "RESERVED" },
      })

      const actorName = session.user.name || "Owner"
      const sysMsg = await prisma.message.create({
        data: {
          conversationId: conv.id,
          type: "SYSTEM",
          content: `${actorName} accepted the book request for "${conv.book.title}".`,
          senderId: myId,
          receiverId: otherParticipant.userId,
          meta: {
            kind: "BOOK_REQUEST_ACCEPTED",
            bookId: conv.book.id,
            bookTitle: conv.book.title,
            bookAuthor: conv.book.author,
            bookImage: conv.book.images?.[0] || null,
            bookCondition: conv.book.condition,
            bookPrice: conv.book.price,
            requestId: pendingReq?.id || null,
          },
          read: false,
        },
        include: MESSAGE_INCLUDE,
      })

      await Promise.allSettled([
        prisma.conversation.update({
          where: { id: conv.id },
          data: {
            lastMessageId: sysMsg.id,
            lastMessageAt: sysMsg.createdAt,
            lastMessagePreview: sysMsg.content.slice(0, 140),
            lastMessageSenderId: myId,
          },
        }),
        prisma.notification.create({
          data: {
            userId: otherParticipant.userId,
            type: "REQUEST_APPROVED",
            message: `${actorName} accepted your request for "${conv.book.title}"!`,
            link: `/messages/${myId}?book=${conv.book.id}`,
          },
        }),
      ])

      const dto = serializeMessage(sysMsg)
      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "new-message", dto),
        triggerRealtime(conversationChannel(conv.id), "listing-updated", {
          bookId: conv.book.id,
          status: "RESERVED",
        }),
        triggerRealtime(legacyChannel, "new-message", dto),
      ])

      return NextResponse.json({
        bookStatus: "RESERVED",
        requestStatus: "APPROVED",
        message: dto,
      })
    }

    // 7. Seller/Donator ships the book and adds Tracking ID in chat
    if (action === "add_tracking") {
      if (!conv.book || conv.book.ownerId !== myId) {
        throw new MessagingError(
          403,
          "Only the book owner can add shipment tracking.",
          "FORBIDDEN"
        )
      }

      const courier = String(body.courier || "").trim().slice(0, 80)
      const trackingId = String(body.trackingId || "").trim().slice(0, 100)
      const rawUrl = String(body.trackingUrl || "").trim().slice(0, 400)
      const note = String(body.note || "").trim().slice(0, 240)

      if (!courier || !trackingId) {
        throw new MessagingError(
          400,
          "Please enter both the courier name and tracking ID.",
          "BAD_REQUEST"
        )
      }

      let safeTrackingUrl: string | null = null
      if (rawUrl && /^https?:\/\//i.test(rawUrl)) {
        safeTrackingUrl = rawUrl
      } else {
        const c = courier.toLowerCase()
        const enc = encodeURIComponent(trackingId)
        if (c.includes("india post") || c.includes("speed post")) {
          safeTrackingUrl = `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`
        } else if (c.includes("delhivery")) {
          safeTrackingUrl = `https://www.delhivery.com/track/package/${enc}`
        } else if (c.includes("bluedart") || c.includes("blue dart")) {
          safeTrackingUrl = `https://www.bluedart.com/tracking`
        } else if (c.includes("dtdc")) {
          safeTrackingUrl = `https://www.dtdc.in/tracking.asp`
        } else {
          safeTrackingUrl = `https://t.17track.net/en#nums=${enc}`
        }
      }

      const actorName = session.user.name || "Owner"
      const shippedAt = new Date().toISOString()

      const sysMsg = await prisma.message.create({
        data: {
          conversationId: conv.id,
          type: "SYSTEM",
          content: `${actorName} shipped "${conv.book.title}" via ${courier} (Tracking ID: ${trackingId}).`,
          senderId: myId,
          receiverId: otherParticipant.userId,
          meta: {
            kind: "SHIPMENT_TRACKING",
            bookId: conv.book.id,
            bookTitle: conv.book.title,
            bookAuthor: conv.book.author,
            bookImage: conv.book.images?.[0] || null,
            bookCondition: conv.book.condition,
            bookPrice: conv.book.price,
            courier,
            trackingId,
            trackingUrl: safeTrackingUrl,
            note: note || null,
            shippedAt,
          },
          read: false,
        },
        include: MESSAGE_INCLUDE,
      })

      await Promise.allSettled([
        prisma.conversation.update({
          where: { id: conv.id },
          data: {
            lastMessageId: sysMsg.id,
            lastMessageAt: sysMsg.createdAt,
            lastMessagePreview: `📦 Shipped via ${courier} · ${trackingId}`.slice(0, 140),
            lastMessageSenderId: myId,
          },
        }),
        prisma.notification.create({
          data: {
            userId: otherParticipant.userId,
            type: "BOOK_SHIPPED",
            message: `${actorName} shipped "${conv.book.title}" via ${courier}. Tracking ID: ${trackingId}`,
            link: `/messages/${myId}?book=${conv.book.id}`,
          },
        }),
      ])

      const dto = serializeMessage(sysMsg)
      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "new-message", dto),
        triggerRealtime(legacyChannel, "new-message", dto),
      ])

      return NextResponse.json({ message: dto }, { status: 201 })
    }

    // 8. Recipient/Buyer confirms book received
    if (action === "confirm_received") {
      if (!conv.book || conv.book.ownerId === myId) {
        throw new MessagingError(
          403,
          "Only the recipient can confirm delivery.",
          "FORBIDDEN"
        )
      }

      const finalStatus = conv.book.price === 0 ? "DONATED" : "SOLD"
      await Promise.allSettled([
        prisma.bookRequest.updateMany({
          where: {
            bookId: conv.book.id,
            requesterId: myId,
            status: { in: ["PENDING", "APPROVED"] },
          },
          data: { status: "COMPLETED" },
        }),
        prisma.book.update({
          where: { id: conv.book.id },
          data: { status: finalStatus },
        }),
      ])

      const actorName = session.user.name || "Reader"
      const sysMsg = await prisma.message.create({
        data: {
          conversationId: conv.id,
          type: "SYSTEM",
          content: `${actorName} confirmed receiving "${conv.book.title}".`,
          senderId: myId,
          receiverId: otherParticipant.userId,
          meta: {
            kind: "BOOK_DELIVERED",
            bookId: conv.book.id,
            bookTitle: conv.book.title,
            deliveredAt: new Date().toISOString(),
          },
          read: false,
        },
        include: MESSAGE_INCLUDE,
      })

      await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          lastMessageId: sysMsg.id,
          lastMessageAt: sysMsg.createdAt,
          lastMessagePreview: `✅ Confirmed receipt of "${conv.book.title}"`.slice(0, 140),
          lastMessageSenderId: myId,
        },
      })

      const dto = serializeMessage(sysMsg)
      await Promise.all([
        triggerRealtime(conversationChannel(conv.id), "new-message", dto),
        triggerRealtime(conversationChannel(conv.id), "listing-updated", {
          bookId: conv.book.id,
          status: finalStatus,
        }),
        triggerRealtime(legacyChannel, "new-message", dto),
      ])

      return NextResponse.json({
        bookStatus: finalStatus,
        requestStatus: "COMPLETED",
        message: dto,
      })
    }

    throw new MessagingError(400, "Unknown action.", "BAD_REQUEST")
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/conversations/[userId]?messageId=... — soft-delete own message
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId: paramId } = await params
    const myId = session.user.id
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get("messageId")

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 })
    }

    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!existing || existing.senderId !== myId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.messageAttachment.deleteMany({ where: { messageId } })
      await tx.messageReaction.deleteMany({ where: { messageId } })

      const deletedMsg = await tx.message.update({
        where: { id: messageId },
        data: {
          deletedAt: new Date(),
          content: "This message was deleted",
        },
        include: MESSAGE_INCLUDE,
      })

      if (existing.conversationId) {
        await tx.conversation.updateMany({
          where: { id: existing.conversationId, lastMessageId: messageId },
          data: { lastMessagePreview: "This message was deleted" },
        })
      }

      return deletedMsg
    }, { maxWait: 10000, timeout: 20000 })

    const dto = serializeMessage(updated)
    const legacyChannel = `chat-dm-${[myId, existing.receiverId].sort().join("-")}`

    await Promise.all([
      existing.conversationId
        ? triggerRealtime(
            conversationChannel(existing.conversationId),
            "message-updated",
            dto
          )
        : Promise.resolve(),
      triggerRealtime(legacyChannel, "message-deleted", { messageId }),
      triggerRealtime(legacyChannel, "message-updated", dto),
    ])

    return NextResponse.json({ deleted: true, messageId, message: dto })
  } catch (error) {
    return errorResponse(error)
  }
}
