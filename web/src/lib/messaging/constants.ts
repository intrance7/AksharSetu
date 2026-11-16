// Shared messaging constants — imported by both server routes and client components.

export const MAX_MESSAGE_LENGTH = 4000
export const MESSAGE_PAGE_SIZE = 30
export const CONVERSATION_PAGE_SIZE = 30
export const EDIT_WINDOW_MS = 15 * 60 * 1000
export const OFFER_TTL_MS = 48 * 60 * 60 * 1000
export const ONLINE_WINDOW_MS = 150 * 1000
export const MAX_PINNED_CONVERSATIONS = 5

// Rate limits (enforced server-side against the database, so they hold across serverless instances)
export const RATE_LIMITS = {
  messagesPerMinute: 30,
  duplicateMessagesPerMinute: 3,
  newConversationsPerHour: 30,
  offersPerHourPerConversation: 6,
  uploadsPerHour: 40,
  reportsPerDay: 10,
} as const

// Attachments
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024 // client downsizes before upload; Vercel body cap is 4.5 MB
export const MAX_FILE_UPLOAD_BYTES = 4 * 1024 * 1024
export const MAX_ATTACHMENTS_PER_MESSAGE = 6
export const IMAGE_MAX_DIMENSION = 1600

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const

export const ACCEPTED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "Text",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
}

export const ATTACHMENT_ACCEPT_ATTR = [
  ...ACCEPTED_IMAGE_TYPES,
  ...Object.keys(ACCEPTED_FILE_TYPES),
  ".pdf",
  ".txt",
  ".docx",
].join(",")

export const REPORT_REASONS = [
  { value: "SPAM", label: "Spam or repeated unwanted messages" },
  { value: "SCAM", label: "Scam, fraud, or fake listing" },
  { value: "HARASSMENT", label: "Harassment or abusive language" },
  { value: "INAPPROPRIATE", label: "Inappropriate or explicit content" },
  { value: "OTHER", label: "Something else" },
] as const

export const LISTING_STATUSES = ["AVAILABLE", "RESERVED", "SOLD"] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "EXPIRED"

export const conversationChannel = (conversationId: string) =>
  `private-conversation-${conversationId}`
export const userChannel = (userId: string) => `private-user-${userId}`
