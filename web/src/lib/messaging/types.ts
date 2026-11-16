import type { OfferStatus } from "./constants"

// DTOs shared between API routes and client components.

export interface ChatUser {
  id: string
  name: string
  image: string | null
}

export interface MessageAttachmentDTO {
  id: string
  kind: "IMAGE" | "FILE"
  mimeType: string
  fileName: string
  size: number
  width: number | null
  height: number | null
  url: string
}

export interface ReactionDTO {
  emoji: string
  userIds: string[]
}

export interface OfferDTO {
  id: string
  amount: number
  listPrice: number
  status: OfferStatus
  note: string | null
  expiresAt: string
  respondedAt: string | null
  createdAt: string
  buyerId: string
  sellerId: string
  bookId: string
}

export interface ReplyPreviewDTO {
  id: string
  senderId: string
  senderName: string
  content: string
  deleted: boolean
  hasAttachments: boolean
  type: string
}

export type MessageType = "TEXT" | "OFFER" | "SYSTEM"

export interface MessageDTO {
  id: string
  conversationId: string
  clientId: string | null
  type: MessageType
  content: string
  createdAt: string
  editedAt: string | null
  deletedAt: string | null
  sender: ChatUser
  replyTo: ReplyPreviewDTO | null
  attachments: MessageAttachmentDTO[]
  reactions: ReactionDTO[]
  offer: OfferDTO | null
  meta: Record<string, unknown> | null
}

export type DeliveryState = "sending" | "failed" | "sent" | "delivered" | "read"

export interface BookContextDTO {
  id: string
  title: string
  author: string
  image: string | null
  price: number
  condition: string
  status: string
  deliveryType: string
  acceptsExchange: boolean
  ownerId: string
  ownerName: string
}

export type ConversationRole = "BUYER" | "SELLER" | "MEMBER"

export interface ConversationSummaryDTO {
  id: string
  type: "DIRECT" | "LISTING"
  role: ConversationRole
  book: { id: string; title: string; image: string | null; price: number; status: string } | null
  other: { id: string; name: string; image: string | null; online: boolean; lastSeenAt: string | null }
  lastMessage: {
    preview: string
    senderId: string | null
    at: string | null
    state: DeliveryState | null
  } | null
  unreadCount: number
  isPinned: boolean
  isArchived: boolean
  isMuted: boolean
}

export interface ConversationDetailDTO {
  id: string
  type: "DIRECT" | "LISTING"
  role: ConversationRole
  book: BookContextDTO | null
  me: { isMuted: boolean; isArchived: boolean; isPinned: boolean; lastReadAt: string | null }
  other: {
    id: string
    name: string
    image: string | null
    bio: string | null
    location: string | null
    memberSince: string
    lastSeenAt: string | null
    online: boolean
    lastReadAt: string | null
    lastDeliveredAt: string | null
    sellerRating: number
    booksSold: number
  }
  block: { blockedByMe: boolean; blockedMe: boolean }
  acceptedOffer: OfferDTO | null
}

export interface InboxEventDTO {
  conversationId: string
  kind: "message" | "read" | "update"
  senderId?: string
  senderName?: string
  preview?: string
  muted?: boolean
}
