import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import {
  syncLegacyMessagesForUser,
  touchUserPresence,
  isUserOnline,
  findOrCreateConversation,
} from "@/lib/messaging/service"
import { errorResponse, readJson } from "@/lib/messaging/http"
import type { DeliveryState } from "@/lib/messaging/types"
import { getMutualFollowIds } from "@/lib/shantiVisibility"
import { cachedQuery } from "@/lib/cache"

// GET /api/conversations — returns all conversations for the logged-in user
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") || "all" // all | unread | buying | selling | archived
    const query = (searchParams.get("q") || "").trim().toLowerCase()

    void touchUserPresence(userId)

    const items = await cachedQuery(
      `msg:inbox:${userId}`,
      8_000,
      async () => {
        const [, mutualIds, participations] = await Promise.all([
          syncLegacyMessagesForUser(userId),
          getMutualFollowIds(userId),
          prisma.conversationParticipant.findMany({
            where: { userId },
            include: {
              conversation: {
                include: {
                  book: {
                    select: {
                      id: true,
                      title: true,
                      author: true,
                      price: true,
                      condition: true,
                      status: true,
                      images: true,
                      ownerId: true,
                    },
                  },
                  participants: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          image: true,
                          location: true,
                          isShantiModeActive: true,
                          liveStatus: true,
                          lastSeenAt: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        ])

        const convIds = participations.map((p) => p.conversationId)
        const unreadMessages =
          convIds.length > 0
            ? await prisma.message.findMany({
                where: {
                  conversationId: { in: convIds },
                  senderId: { not: userId },
                  read: false,
                  deletedAt: null,
                },
                select: {
                  conversationId: true,
                  createdAt: true,
                  read: true,
                },
              })
            : []

        const lastReadByConv = new Map<string, Date | null>()
        for (const p of participations) {
          lastReadByConv.set(p.conversationId, p.lastReadAt)
        }

        const unreadCountMap = new Map<string, number>()
        for (const m of unreadMessages) {
          if (!m.conversationId) continue
          const lastRead = lastReadByConv.get(m.conversationId)
          const isUnread = lastRead ? m.createdAt > lastRead : !m.read
          if (isUnread) {
            unreadCountMap.set(
              m.conversationId,
              (unreadCountMap.get(m.conversationId) || 0) + 1
            )
          }
        }

        const built = participations
          .map((mePart) => {
            const conv = mePart.conversation
            const otherPart = conv.participants.find((p) => p.userId !== userId)
            if (!otherPart?.user) return null

            const other = otherPart.user
            const canSeeShanti = mutualIds.has(other.id)
            const online = isUserOnline(
              other.lastSeenAt,
              canSeeShanti ? other.isShantiModeActive : false
            )
            const unreadCount = unreadCountMap.get(conv.id) || 0
            const isMine = conv.lastMessageSenderId === userId

            let deliveryState: DeliveryState | null = null
            if (conv.lastMessageAt && isMine) {
              if (
                otherPart.lastReadAt &&
                new Date(otherPart.lastReadAt) >= new Date(conv.lastMessageAt)
              ) {
                deliveryState = "read"
              } else if (
                otherPart.lastDeliveredAt &&
                new Date(otherPart.lastDeliveredAt) >= new Date(conv.lastMessageAt)
              ) {
                deliveryState = "delivered"
              } else {
                deliveryState = "sent"
              }
            }

            const role =
              conv.sellerId === userId
                ? "SELLER"
                : conv.buyerId === userId
                ? "BUYER"
                : (mePart.role as "BUYER" | "SELLER" | "MEMBER")

            return {
              id: conv.id,
              type: (conv.type as "DIRECT" | "LISTING") || "DIRECT",
              role,
              isPinned: mePart.isPinned,
              pinnedAt: mePart.pinnedAt ? mePart.pinnedAt.toISOString() : null,
              isArchived: mePart.isArchived,
              isMuted: mePart.isMuted,
              unreadCount,
              book: conv.book
                ? {
                    id: conv.book.id,
                    title: conv.book.title,
                    author: conv.book.author,
                    image: conv.book.images?.[0] || null,
                    price: conv.book.price,
                    condition: conv.book.condition,
                    status: conv.book.status,
                  }
                : null,
              otherUser: {
                id: other.id,
                name: other.name || other.email?.split("@")[0] || "Reader",
                username:
                  other.email?.split("@")[0] ||
                  (other.name || "reader").toLowerCase().replace(/\s+/g, ""),
                image: other.image,
                location: other.location,
                isShantiModeActive: canSeeShanti ? other.isShantiModeActive : false,
                liveStatus: canSeeShanti ? other.liveStatus : null,
                online,
                lastSeenAt: other.lastSeenAt ? other.lastSeenAt.toISOString() : null,
              },
              lastMessage: conv.lastMessageAt
                ? {
                    id: conv.lastMessageId || conv.id,
                    content: conv.lastMessagePreview || "Started a conversation",
                    createdAt: conv.lastMessageAt.toISOString(),
                    isMine,
                    read: deliveryState === "read",
                    state: deliveryState,
                  }
                : {
                    id: conv.id,
                    content: conv.book
                      ? `Inquiry about "${conv.book.title}"`
                      : "Start a conversation",
                    createdAt: conv.updatedAt.toISOString(),
                    isMine: false,
                    read: true,
                    state: null,
                  },
              sortTime: conv.lastMessageAt
                ? conv.lastMessageAt.getTime()
                : conv.updatedAt.getTime(),
            }
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))

        built.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
          return b.sortTime - a.sortTime
        })

        return built
      }
    )

    const filtered = items.filter((item) => {
      if (filter === "archived") {
        if (!item.isArchived) return false
      } else {
        if (item.isArchived) return false
        if (filter === "unread" && item.unreadCount === 0) return false
        if (filter === "buying" && item.role !== "BUYER") return false
        if (filter === "selling" && item.role !== "SELLER") return false
      }

      if (query) {
        const matchUser = item.otherUser.name.toLowerCase().includes(query)
        const matchUsername = item.otherUser.username.toLowerCase().includes(query)
        const matchMsg = item.lastMessage.content.toLowerCase().includes(query)
        const matchBook = item.book?.title.toLowerCase().includes(query)
        return matchUser || matchUsername || matchMsg || Boolean(matchBook)
      }
      return true
    })

    return NextResponse.json(filtered)
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/conversations — find or create a conversation (ensuring at most 1 per participants + book)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await readJson(req)
    const { otherUserId, bookId } = body as { otherUserId?: unknown; bookId?: unknown }

    if (!otherUserId || typeof otherUserId !== "string") {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      )
    }

    const conv = await findOrCreateConversation({
      initiatorId: session.user.id,
      otherUserId,
      bookId: typeof bookId === "string" ? bookId : null,
    })

    return NextResponse.json({
      id: conv.id,
      conversationId: conv.id,
      key: conv.key,
      type: conv.type,
      bookId: conv.bookId,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
