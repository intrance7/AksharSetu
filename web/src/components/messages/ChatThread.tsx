"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  format,
  isSameDay,
} from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Send,
  Loader2,
  ArrowLeft,
  User,
  MapPin,
  BookOpen,
  Quote,
  ExternalLink,
  Sparkles,
  X,
  Check,
  CheckCheck,
  Trash2,
  Search,
  MessageSquare,
  Star,
  Plus,
  Paperclip,
  Smile,
  Reply,
  Pencil,
  Copy,
  Pin,
  Archive,
  BellOff,
  Bell,
  ShieldAlert,
  Ban,
  Info,
  FileText,
  IndianRupee,
  Tag,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronUp,
} from "lucide-react"
import { getPusherClient, isPusherClientConfigured } from "@/lib/pusher"
import {
  ATTACHMENT_ACCEPT_ATTR,
  MAX_ATTACHMENTS_PER_MESSAGE,
  REPORT_REASONS,
  conversationChannel,
  userChannel,
} from "@/lib/messaging/constants"
import { EMOJI_CATEGORIES, QUICK_REACTIONS } from "@/lib/messaging/emoji"
import type {
  MessageDTO,
  MessageAttachmentDTO,
  OfferDTO,
  DeliveryState,
} from "@/lib/messaging/types"

export interface ChatContextBanner {
  badge: string
  title: string
  prefillMessage: string
  bookId?: string
  orderId?: string
}

interface SidebarConversationItem {
  id: string
  type: "DIRECT" | "LISTING"
  role: "BUYER" | "SELLER" | "MEMBER"
  isPinned: boolean
  isArchived: boolean
  isMuted: boolean
  unreadCount: number
  book: {
    id: string
    title: string
    author: string
    image: string | null
    price: number
    condition: string
    status: string
  } | null
  otherUser: {
    id: string
    name: string
    username: string
    image: string | null
    location?: string | null
    isShantiModeActive?: boolean
    liveStatus?: string | null
    online: boolean
    lastSeenAt: string | null
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    isMine: boolean
    read: boolean
    state: DeliveryState | null
  }
}

type InboxFilter = "all" | "unread" | "buying" | "selling" | "archived"

const BUYER_QUICK_PROMPTS = [
  {
    label: "Is it available?",
    text: "Hi! Is this book still available?",
  },
  {
    label: "More pictures",
    text: "Could you share a few more pictures of the book (cover, spine, and inside pages)?",
  },
  {
    label: "Condition check",
    text: "Are there any highlights, markings, or damaged pages?",
  },
  {
    label: "Price negotiable?",
    text: "Would you be willing to negotiate the price?",
  },
  {
    label: "Delivery / pickup",
    text: "Can we arrange a pickup or courier delivery?",
  },
  {
    label: "Interested to buy",
    text: "Hi! I'd like to buy this book. How would you prefer to proceed?",
  },
]

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/i

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDaySeparator(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "MMMM d, yyyy")
}

function LinkPreviewInline({ url }: { url: string }) {
  const [preview, setPreview] = useState<{
    url: string
    hostname: string
    title: string
    description: string | null
    siteName: string
  } | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/messages/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.title) setPreview(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [url])

  if (!preview) return null

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2.5 block rounded-xl bg-black/10 hover:bg-black/15 p-3 text-left transition-colors border border-current/15"
    >
      <p className="font-mono text-xs font-semibold uppercase tracking-wider opacity-75 truncate">
        {preview.siteName || preview.hostname}
      </p>
      <p className="text-sm font-bold line-clamp-1 mt-0.5">{preview.title}</p>
      {preview.description && (
        <p className="text-xs opacity-85 line-clamp-2 mt-0.5 leading-relaxed">
          {preview.description}
        </p>
      )}
    </a>
  )
}

export function ChatThread({
  userId,
  initialBookId = null,
  contextBanner = null,
  embedded = false,
  onBack,
}: {
  userId: string
  initialBookId?: string | null
  contextBanner?: ChatContextBanner | null
  embedded?: boolean
  onBack?: () => void
}) {
  const { data: session } = useSession()
  const router = useRouter()

  // Conversation & Messages State
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [convMeta, setConvMeta] = useState<any | null>(null)
  const [otherUser, setOtherUser] = useState<any | null>(null)
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [loading, setLoading] = useState(true)

  // Left Sidebar State
  const [sidebarConvos, setSidebarConvos] = useState<SidebarConversationItem[]>([])
  const [sidebarFilter, setSidebarFilter] = useState<InboxFilter>("all")
  const [sidebarSearch, setSidebarSearch] = useState("")

  // Composer & Actions State
  const [newMessage, setNewMessage] = useState(
    () => contextBanner?.prefillMessage || ""
  )
  const [sending, setSending] = useState(false)
  const [replyTarget, setReplyTarget] = useState<MessageDTO | null>(null)
  const [editingMessage, setEditingMessage] = useState<MessageDTO | null>(null)
  const [activeContext, setActiveContext] = useState<ChatContextBanner | null>(
    contextBanner
  )

  useEffect(() => {
    if (contextBanner) {
      setActiveContext(contextBanner)
      if (contextBanner.prefillMessage) {
        setNewMessage((prev) => prev || contextBanner.prefillMessage)
      }
    }
  }, [contextBanner])
  const [pendingAttachments, setPendingAttachments] = useState<
    MessageAttachmentDTO[]
  >([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeEmojiCat, setActiveEmojiCat] = useState(EMOJI_CATEGORIES[0].id)
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(
    null
  )

  // Price Offer Modal / Bar State
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerAmount, setOfferAmount] = useState("")
  const [offerNote, setOfferNote] = useState("")
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [busyOfferId, setBusyOfferId] = useState<string | null>(null)
  const [updatingListingStatus, setUpdatingListingStatus] = useState(false)

  // Search & Info Panel State
  const [showSearchInChat, setShowSearchInChat] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState("")
  const [showInfoPanel, setShowInfoPanel] = useState(!embedded)
  const [mobileInfoDrawer, setMobileInfoDrawer] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<string>(
    REPORT_REASONS[0].value
  )
  const [reportDetails, setReportDetails] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)

  // Typing & Browser Notification State
  const [otherTypingName, setOtherTypingName] = useState<string | null>(null)
  const [browserNotifPerm, setBrowserNotifPerm] =
    useState<NotificationPermission>("default")

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prevCountRef = useRef<number>(0)
  const lastTypingSentRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserNotifPerm(Notification.permission)
    }
  }, [])

  const effectiveBookId = initialBookId || contextBanner?.bookId || null

  const fetchSidebar = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (sidebarFilter !== "all") params.set("filter", sidebarFilter)
      if (sidebarSearch.trim()) params.set("q", sidebarSearch.trim())
      const res = await fetch(`/api/conversations?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setSidebarConvos(data)
    } catch {}
  }, [sidebarFilter, sidebarSearch])

  const fetchThread = useCallback(
    async (searchOverride?: string) => {
      try {
        const params = new URLSearchParams()
        if (effectiveBookId) params.set("bookId", effectiveBookId)
        const q =
          searchOverride !== undefined ? searchOverride : chatSearchQuery.trim()
        if (q) params.set("q", q)

        const res = await fetch(
          `/api/conversations/${userId}?${params.toString()}`
        )
        if (!res.ok) {
          setLoading(false)
          return
        }
        const data = await res.json()
        if (data.conversation) {
          setConvMeta(data.conversation)
          setConversationId(data.conversation.id)
        }
        if (data.otherUser) setOtherUser(data.otherUser)
        if (typeof data.hasMore === "boolean") setHasMore(data.hasMore)
        if (data.nextCursor !== undefined) setNextCursor(data.nextCursor)

        if (Array.isArray(data.messages)) {
          setMessages((prev) => {
            const optimistic = prev.filter((m) => m.id.startsWith("temp-"))
            const serverClientIds = new Set(
              data.messages
                .map((m: MessageDTO) => m.clientId)
                .filter(Boolean)
            )
            const remainingOptimistic = optimistic.filter(
              (o) =>
                !(o.clientId && serverClientIds.has(o.clientId)) &&
                !data.messages.some(
                  (sm: MessageDTO) =>
                    sm.content === o.content && sm.sender.id === o.sender.id
                )
            )
            return [...data.messages, ...remainingOptimistic]
          })
        }
        setLoading(false)
      } catch {
        setLoading(false)
      }
    },
    [userId, effectiveBookId, chatSearchQuery]
  )

  const loadOlderMessages = async () => {
    if (!nextCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const params = new URLSearchParams({ cursor: nextCursor })
      if (effectiveBookId) params.set("bookId", effectiveBookId)
      const res = await fetch(
        `/api/conversations/${userId}?${params.toString()}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.messages)) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const older = data.messages.filter(
            (m: MessageDTO) => !existingIds.has(m.id)
          )
          return [...older, ...prev]
        })
      }
      setNextCursor(data.nextCursor || null)
      setHasMore(Boolean(data.hasMore))
    } catch {
      toast.error("Could not load older messages")
    } finally {
      setLoadingOlder(false)
    }
  }

  useEffect(() => {
    fetchThread()
    fetchSidebar()

    const pollInterval = setInterval(() => {
      fetchThread()
      fetchSidebar()
    }, 4000)

    return () => clearInterval(pollInterval)
  }, [fetchThread, fetchSidebar])

  // Real-Time Pusher Subscriptions (Private Conversation + Private User + Legacy Fallback)
  useEffect(() => {
    if (!session?.user?.id || !isPusherClientConfigured()) return

    const pusher = getPusherClient()
    const channelsToClean: string[] = []

    const onIncomingMessage = (msg: MessageDTO) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        const filtered = prev.filter(
          (m) =>
            !(
              m.id.startsWith("temp-") &&
              ((m.clientId && m.clientId === msg.clientId) ||
                m.content === msg.content)
            )
        )
        return [...filtered, msg]
      })
      setOtherTypingName(null)
      fetchSidebar()

      if (
        msg.sender.id !== session.user?.id &&
        typeof document !== "undefined" &&
        document.hidden &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(`New message from ${msg.sender.name}`, {
            body: msg.content.slice(0, 100),
          })
        } catch {}
      }
    }

    const onMessageUpdated = (msg: MessageDTO) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
      fetchSidebar()
    }

    const onMessagesRead = (payload: { readerId: string; readAt?: string }) => {
      if (payload.readerId !== session.user?.id) {
        setOtherUser((prev: any) =>
          prev
            ? {
                ...prev,
                lastReadAt: payload.readAt || new Date().toISOString(),
                lastDeliveredAt: payload.readAt || new Date().toISOString(),
              }
            : prev
        )
      }
    }

    const onTyping = (payload: {
      userId: string
      name: string
      isTyping: boolean
    }) => {
      if (payload.userId === session.user?.id) return
      if (payload.isTyping) {
        setOtherTypingName(payload.name || "Reader")
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          setOtherTypingName(null)
        }, 4000)
      } else {
        setOtherTypingName(null)
      }
    }

    const onOfferUpdated = () => {
      fetchThread()
    }

    const onListingUpdated = (payload: { bookId: string; status: string }) => {
      setConvMeta((prev: any) =>
        prev?.book && prev.book.id === payload.bookId
          ? { ...prev, book: { ...prev.book, status: payload.status } }
          : prev
      )
    }

    try {
      if (conversationId) {
        const privChanName = conversationChannel(conversationId)
        channelsToClean.push(privChanName)
        const privChan = pusher.subscribe(privChanName)
        privChan.bind("new-message", onIncomingMessage)
        privChan.bind("message-updated", onMessageUpdated)
        privChan.bind("messages-read", onMessagesRead)
        privChan.bind("typing", onTyping)
        privChan.bind("offer-updated", onOfferUpdated)
        privChan.bind("listing-updated", onListingUpdated)
      }

      const myUserChanName = userChannel(session.user.id)
      channelsToClean.push(myUserChanName)
      const myUserChan = pusher.subscribe(myUserChanName)
      myUserChan.bind("inbox-update", () => fetchSidebar())

      if (otherUser?.id) {
        const legacyName = `chat-dm-${[session.user.id, otherUser.id]
          .sort()
          .join("-")}`
        channelsToClean.push(legacyName)
        const legacyChan = pusher.subscribe(legacyName)
        legacyChan.bind("new-message", onIncomingMessage)
        legacyChan.bind("message-updated", onMessageUpdated)
        legacyChan.bind("messages-read", onMessagesRead)
        legacyChan.bind("typing", onTyping)
        legacyChan.bind("offer-updated", onOfferUpdated)
        legacyChan.bind("listing-updated", onListingUpdated)
      }
    } catch {}

    return () => {
      for (const ch of channelsToClean) {
        try {
          pusher.unsubscribe(ch)
        } catch {}
      }
    }
  }, [
    session?.user?.id,
    conversationId,
    otherUser?.id,
    fetchSidebar,
    fetchThread,
  ])

  // Auto-scroll when new messages arrive at bottom
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      const diff = messages.length - prevCountRef.current
      prevCountRef.current = messages.length
      if (diff <= 3) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }
    }
  }, [messages.length])

  // Auto-resize composer textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [newMessage])

  const emitTyping = () => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2500) return
    lastTypingSentRef.current = now
    fetch(`/api/conversations/${conversationId || userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "typing", isTyping: true }),
    }).catch(() => {})
  }

  const sendMessageContent = async (overrideText?: string) => {
    const textToSend =
      overrideText !== undefined ? overrideText : newMessage.trim()
    const attachmentsToSend =
      overrideText !== undefined ? [] : pendingAttachments

    if (
      (!textToSend && attachmentsToSend.length === 0) ||
      sending ||
      !session?.user?.id
    ) {
      return
    }

    // If editing an existing message
    if (editingMessage && overrideText === undefined) {
      setSending(true)
      try {
        const res = await fetch(
          `/api/conversations/${conversationId || userId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "edit",
              messageId: editingMessage.id,
              content: textToSend,
            }),
          }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to edit message")
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMessage.id ? data : m))
        )
        setEditingMessage(null)
        setNewMessage("")
        toast.success("Message updated")
      } catch (err: any) {
        toast.error(err.message || "Could not edit message")
      } finally {
        setSending(false)
      }
      return
    }

    setSending(true)
    const clientId = `client-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
    const optimisticMessage: MessageDTO = {
      id: `temp-${clientId}`,
      conversationId: conversationId || "",
      clientId,
      type: "TEXT",
      content: textToSend,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      sender: {
        id: session.user.id,
        name: session.user.name || "You",
        image: session.user.image || null,
      },
      replyTo: replyTarget
        ? {
            id: replyTarget.id,
            senderId: replyTarget.sender.id,
            senderName: replyTarget.sender.name,
            content: replyTarget.content.slice(0, 120),
            deleted: false,
            hasAttachments: replyTarget.attachments.length > 0,
            type: replyTarget.type,
          }
        : null,
      attachments: attachmentsToSend,
      reactions: [],
      offer: null,
      meta: null,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    if (overrideText === undefined) {
      setNewMessage("")
      setPendingAttachments([])
      setReplyTarget(null)
    }

    try {
      const res = await fetch(
        `/api/conversations/${conversationId || userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: textToSend,
            clientId,
            replyToId: replyTarget?.id || null,
            attachmentIds: attachmentsToSend.map((a) => a.id),
            bookId: convMeta?.book?.id || effectiveBookId || null,
            orderId: activeContext?.orderId || null,
          }),
        }
      )

      const saved = await res.json()
      if (!res.ok) {
        throw new Error(saved.error || "Failed to send message")
      }

      if (saved.conversationId) {
        setConversationId((prev) => prev || saved.conversationId)
      }
      setMessages((prev) => {
        const withoutDup = prev.filter(
          (m) => m.id !== optimisticMessage.id && m.id !== saved.id
        )
        return [...withoutDup, saved]
      })
      fetchSidebar()
    } catch (err: any) {
      toast.error(err.message || "Failed to send message")
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
    } finally {
      setSending(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !conversationId) return

    if (
      pendingAttachments.length + files.length >
      MAX_ATTACHMENTS_PER_MESSAGE
    ) {
      toast.error(
        `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`
      )
      return
    }

    setUploadingFile(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("conversationId", conversationId)

        const res = await fetch("/api/messages/attachments", {
          method: "POST",
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }
        setPendingAttachments((prev) => [...prev, data])
      }
    } catch (err: any) {
      toast.error(err.message || "Attachment upload failed")
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    setActiveReactionMsgId(null)
    try {
      const res = await fetch(
        `/api/conversations/${conversationId || userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reaction", messageId, emoji }),
        }
      )
      if (!res.ok) return
      const updated = await res.json()
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)))
    } catch {}
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(
        `/api/conversations/${
          conversationId || userId
        }?messageId=${encodeURIComponent(messageId)}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not delete message")
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? data.message : m))
        )
      }
      toast.success("Message deleted")
    } catch (err: any) {
      toast.error(err.message || "Could not delete message")
    }
  }

  const handleConversationSetting = async (
    patch: Partial<{ isPinned: boolean; isArchived: boolean; isMuted: boolean }>
  ) => {
    if (!conversationId) return
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings", ...patch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not update settings")
      setConvMeta((prev: any) =>
        prev ? { ...prev, me: { ...prev.me, ...data } } : prev
      )
      fetchSidebar()
      if (patch.isPinned !== undefined) {
        toast.success(
          patch.isPinned ? "Conversation pinned" : "Conversation unpinned"
        )
      }
      if (patch.isArchived !== undefined) {
        toast.success(
          patch.isArchived ? "Conversation archived" : "Moved back to inbox"
        )
      }
      if (patch.isMuted !== undefined) {
        toast.success(
          patch.isMuted ? "Notifications muted" : "Notifications unmuted"
        )
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    }
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conversationId || !convMeta?.book || submittingOffer) return
    const num = Number(offerAmount)
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Enter a valid offer price")
      return
    }
    setSubmittingOffer(true)
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          bookId: convMeta.book.id,
          amount: num,
          note: offerNote.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not submit offer")
      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id)
            ? prev
            : [...prev, data.message]
        )
      }
      setShowOfferForm(false)
      setOfferAmount("")
      setOfferNote("")
      fetchThread()
      fetchSidebar()
      toast.success(`Offer of ₹${Math.round(num)} sent to seller!`)
    } catch (err: any) {
      toast.error(err.message || "Could not submit offer")
    } finally {
      setSubmittingOffer(false)
    }
  }

  const handleOfferDecision = async (
    offerId: string,
    status: "ACCEPTED" | "REJECTED" | "WITHDRAWN"
  ) => {
    if (busyOfferId) return
    setBusyOfferId(offerId)
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not update offer")
      toast.success(
        status === "ACCEPTED"
          ? "Offer accepted!"
          : status === "REJECTED"
          ? "Offer declined"
          : "Offer withdrawn"
      )
      fetchThread()
      fetchSidebar()
    } catch (err: any) {
      toast.error(err.message || "Action failed")
    } finally {
      setBusyOfferId(null)
    }
  }

  const handleSellerListingStatus = async (
    status: "AVAILABLE" | "RESERVED" | "SOLD"
  ) => {
    if (!conversationId || updatingListingStatus) return
    setUpdatingListingStatus(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listing_status", status }),
      })
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "Could not update listing status")
      setConvMeta((prev: any) =>
        prev?.book ? { ...prev, book: { ...prev.book, status } } : prev
      )
      if (data.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id)
            ? prev
            : [...prev, data.message]
        )
      }
      toast.success(`Listing marked as ${status.toLowerCase()}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update listing")
    } finally {
      setUpdatingListingStatus(false)
    }
  }

  const handleBlockToggle = async () => {
    if (!otherUser?.id) return
    const currentlyBlocked = Boolean(convMeta?.block?.blockedByMe)
    try {
      const res = await fetch("/api/messages/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: currentlyBlocked ? "unblock" : "block",
          targetUserId: otherUser.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      setConvMeta((prev: any) =>
        prev
          ? {
              ...prev,
              block: {
                ...prev.block,
                blockedByMe: data.blockedByMe,
                isBlocked: data.blockedByMe || prev.block?.blockedMe,
              },
            }
          : prev
      )
      toast.success(
        data.blockedByMe
          ? `Blocked ${otherUser.name}`
          : `Unblocked ${otherUser.name}`
      )
    } catch (err: any) {
      toast.error(err.message || "Could not update block status")
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otherUser?.id || submittingReport) return
    setSubmittingReport(true)
    try {
      const res = await fetch("/api/messages/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report",
          reportedUserId: otherUser.id,
          conversationId,
          reason: reportReason,
          details: reportDetails,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Report failed")
      toast.success(
        "Report submitted. Our trust & safety team will review it."
      )
      setShowReportModal(false)
      setReportDetails("")
    } catch (err: any) {
      toast.error(err.message || "Could not submit report")
    } finally {
      setSubmittingReport(false)
    }
  }

  const requestBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported on this device.")
      return
    }
    const perm = await Notification.requestPermission()
    setBrowserNotifPerm(perm)
    if (perm === "granted") {
      toast.success("Desktop message notifications enabled!")
    }
  }

  const getMessageDeliveryState = useCallback(
    (msg: MessageDTO): DeliveryState => {
      if (msg.id.startsWith("temp-")) return "sending"
      const msgTime = new Date(msg.createdAt).getTime()
      if (
        otherUser?.lastReadAt &&
        new Date(otherUser.lastReadAt).getTime() >= msgTime
      ) {
        return "read"
      }
      if (
        otherUser?.lastDeliveredAt &&
        new Date(otherUser.lastDeliveredAt).getTime() >= msgTime
      ) {
        return "delivered"
      }
      return "sent"
    },
    [otherUser?.lastReadAt, otherUser?.lastDeliveredAt]
  )

  const activeBook = convMeta?.book || null
  const isSellerOfActiveBook =
    Boolean(activeBook) && activeBook.ownerId === session?.user?.id
  const acceptedOffer: OfferDTO | null = convMeta?.acceptedOffer || null

  // Group messages with date headers and unread divider
  const previousLastReadMs = useMemo(() => {
    return convMeta?.previousLastReadAt
      ? new Date(convMeta.previousLastReadAt).getTime()
      : null
  }, [convMeta?.previousLastReadAt])

  if (loading) {
    if (embedded) {
      return (
        <div className="h-full bg-white rounded-3xl border border-[#1D1D1F]/[0.07] flex items-center justify-center min-h-[420px]">
          <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-6rem)] min-h-[540px]">
        <div className="hidden lg:block lg:col-span-3 bg-white rounded-3xl border border-[#1D1D1F]/[0.07] p-4 space-y-3 animate-pulse">
          <div className="h-9 bg-[#FAF6F0] rounded-full" />
          <div className="h-14 bg-[#FAF6F0] rounded-2xl" />
          <div className="h-14 bg-[#FAF6F0] rounded-2xl" />
          <div className="h-14 bg-[#FAF6F0] rounded-2xl" />
        </div>
        <div className="lg:col-span-9 bg-white rounded-3xl border border-[#1D1D1F]/[0.07] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
        </div>
      </div>
    )
  }

  const infoPanelContent = (
    <div className="flex flex-col h-full overflow-y-auto divide-y divide-[#1D1D1F]/[0.06] text-xs sm:text-[13px]">
      {/* User Identity Summary */}
      <div className="p-5 flex flex-col items-center text-center">
        <div className="relative w-16 h-16 rounded-full bg-[#1D1D1F] flex items-center justify-center overflow-hidden mb-3 ring-2 ring-[#FAF6F0]">
          {otherUser?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={otherUser.image}
              alt={otherUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-xl">
              {(otherUser?.name || "R").charAt(0).toUpperCase()}
            </span>
          )}
          {otherUser?.online && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>
        <h3 className="font-bold text-lg text-[#1D1D1F]">
          {otherUser?.name || "Reader"}
        </h3>
        <p className="font-mono text-xs text-[#6E6E73]">@{otherUser?.username}</p>

        <div className="flex items-center gap-2 mt-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              otherUser?.online
                ? "bg-emerald-50 text-[#0A7D4F] border border-emerald-200/70"
                : "bg-[#FAF6F0] text-[#5E5E63]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                otherUser?.online ? "bg-emerald-500" : "bg-[#86868b]"
              }`}
            />
            {otherUser?.online
              ? otherUser?.isShantiModeActive
                ? "In Shanti Mode"
                : "Online now"
              : otherUser?.lastSeenAt
              ? `Active ${formatDistanceToNow(new Date(otherUser.lastSeenAt), {
                  addSuffix: true,
                })}`
              : "Offline"}
          </span>
          {otherUser?.sellerRating !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 font-mono text-xs font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Number(otherUser.sellerRating).toFixed(1)}
            </span>
          )}
        </div>

        {otherUser?.location && (
          <p className="text-[#5E5E63] font-medium flex items-center gap-1 mt-2.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#C84200]" /> {otherUser.location}
          </p>
        )}

        {otherUser?.bio && (
          <p className="text-[#1D1D1F]/80 text-sm mt-3 leading-relaxed line-clamp-3">
            {otherUser.bio}
          </p>
        )}

        {otherUser?.favoriteQuote && (
          <div className="mt-3 p-3 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] text-left w-full">
            <p className="font-serif italic text-xs text-[#1D1D1F]/85 line-clamp-2 leading-relaxed">
              “{otherUser.favoriteQuote}”
            </p>
            {otherUser.quoteAuthor && (
              <p className="text-xs font-semibold text-[#6E6E73] mt-1">
                — {otherUser.quoteAuthor}
              </p>
            )}
          </div>
        )}

        <Link
          href={`/profile/${otherUser?.username || otherUser?.id || userId}`}
          className="mt-4 w-full py-2.5 px-4 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] font-bold text-[#1D1D1F] flex items-center justify-center gap-1.5 transition-colors text-xs sm:text-[13px]"
        >
          View Full Profile <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Shared / Listed Books */}
      <div className="p-4 space-y-3">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
          {otherUser?.name?.split(" ")[0] || "Reader"}&apos;s Books (
          {otherUser?.books?.length || 0})
        </p>
        {!otherUser?.books || otherUser.books.length === 0 ? (
          <p className="text-[#6E6E73] text-xs py-1">No active book listings.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {otherUser.books.map((b: any) => {
              const priceLabel =
                b.price === 0
                  ? b.acceptsExchange
                    ? "Swap"
                    : "Free"
                  : `₹${b.price}`
              return (
                <div
                  key={b.id}
                  className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.05] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/catalog/${b.id}`}
                      className="font-bold text-xs text-[#1D1D1F] hover:text-[#C84200] truncate block"
                    >
                      {b.title}
                    </Link>
                    <p className="text-xs text-[#6E6E73] truncate mt-0.5">
                      <span className="font-mono font-semibold text-[#1D1D1F]">
                        {priceLabel}
                      </span>{" "}
                      · {b.condition.replace("_", " ")} · {b.status}
                    </p>
                  </div>
                  <Link
                    href={`/messages/${otherUser.id}?book=${b.id}`}
                    className="px-3 py-1 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold shrink-0"
                  >
                    Select
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Shared Media & Files */}
      <div className="p-4 space-y-3">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
          Shared Media &amp; Files ({convMeta?.sharedMedia?.length || 0})
        </p>
        {!convMeta?.sharedMedia || convMeta.sharedMedia.length === 0 ? (
          <p className="text-[#6E6E73] text-xs py-1 leading-relaxed">
            Photos and documents shared in this chat will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {convMeta.sharedMedia.slice(0, 9).map((m: any) =>
              m.kind === "IMAGE" ? (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLightboxImage(m.url)}
                  className="aspect-square rounded-xl overflow-hidden bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.fileName}
                    loading="lazy"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </button>
              ) : (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-xl bg-[#FAF6F0] p-2 flex flex-col items-center justify-center text-center border border-[#1D1D1F]/[0.07] hover:bg-[#EFE7DC]"
                >
                  <FileText className="w-4 h-4 text-[#C84200] mb-1" />
                  <span className="text-xs font-medium truncate w-full">
                    {m.fileName}
                  </span>
                </a>
              )
            )}
          </div>
        )}
      </div>

      {/* Conversation Controls & Privacy */}
      <div className="p-4 space-y-1.5">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-2">
          Conversation &amp; Privacy
        </p>

        <button
          type="button"
          onClick={() =>
            handleConversationSetting({ isPinned: !convMeta?.me?.isPinned })
          }
          className="w-full py-2.5 px-3 rounded-xl hover:bg-[#FAF6F0] flex items-center justify-between font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Pin className="w-4 h-4 text-[#C84200]" />
            {convMeta?.me?.isPinned ? "Unpin Conversation" : "Pin Conversation"}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleConversationSetting({ isMuted: !convMeta?.me?.isMuted })
          }
          className="w-full py-2.5 px-3 rounded-xl hover:bg-[#FAF6F0] flex items-center justify-between font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            {convMeta?.me?.isMuted ? (
              <Bell className="w-4 h-4 text-[#C84200]" />
            ) : (
              <BellOff className="w-4 h-4 text-[#6E6E73]" />
            )}
            {convMeta?.me?.isMuted
              ? "Unmute Notifications"
              : "Mute Notifications"}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleConversationSetting({
              isArchived: !convMeta?.me?.isArchived,
            })
          }
          className="w-full py-2.5 px-3 rounded-xl hover:bg-[#FAF6F0] flex items-center justify-between font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Archive className="w-4 h-4 text-[#6E6E73]" />
            {convMeta?.me?.isArchived
              ? "Unarchive Conversation"
              : "Archive Conversation"}
          </span>
        </button>

        {browserNotifPerm !== "granted" && (
          <button
            type="button"
            onClick={requestBrowserNotifications}
            className="w-full py-2.5 px-3 rounded-xl hover:bg-[#FAF6F0] flex items-center justify-between font-semibold text-[#0066cc] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Bell className="w-4 h-4" /> Enable Desktop Alerts
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleBlockToggle}
          className="w-full py-2.5 px-3 rounded-xl hover:bg-red-50 flex items-center justify-between font-semibold text-red-600 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Ban className="w-4 h-4" />
            {convMeta?.block?.blockedByMe ? "Unblock User" : "Block User"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="w-full py-2.5 px-3 rounded-xl hover:bg-red-50 flex items-center justify-between font-semibold text-red-600 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4" /> Report Conversation
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <div
      className={
        embedded
          ? "grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[520px]"
          : "grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-6rem)] min-h-[540px]"
      }
    >
      {/* A. LEFT CONVERSATION SIDEBAR (Desktop standalone view) */}
      {!embedded && (
      <div className="hidden lg:flex lg:col-span-3 bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm flex-col overflow-hidden">
        <div className="p-4 border-b border-[#1D1D1F]/[0.06] space-y-3 bg-[#FAF6F0]/50">
          <div className="flex items-center justify-between">
            <Link
              href="/messages"
              className="flex items-center gap-2 text-base font-bold text-[#1D1D1F] hover:text-[#C84200] transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#C84200]" />
              Messages
            </Link>
            <Link
              href="/messages?tab=discover"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C84200] hover:bg-[#A33500] text-xs font-bold text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </Link>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6E6E73] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search chats or books..."
              className="w-full h-9 pl-9 pr-3 rounded-full bg-white text-xs font-medium text-[#1D1D1F] placeholder:text-[#6E6E73] outline-none focus:ring-2 focus:ring-[#C84200]/15 border border-[#1D1D1F]/[0.08] focus:border-[#C84200]"
            />
          </div>

          {/* Filter Pills: All | Unread | Buying | Selling | Archived */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {(
              [
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "buying", label: "Buying" },
                { id: "selling", label: "Selling" },
                { id: "archived", label: "Archived" },
              ] as { id: InboxFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSidebarFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  sidebarFilter === tab.id
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-white text-[#5E5E63] hover:text-[#1D1D1F] border border-[#1D1D1F]/[0.07]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#1D1D1F]/[0.06]">
          {sidebarConvos.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-[#6E6E73]">
                No {sidebarFilter !== "all" ? sidebarFilter : ""} conversations
                found.
              </p>
              <Link
                href="/messages?tab=discover"
                className="inline-block text-xs font-bold text-[#C84200] hover:underline"
              >
                Discover Readers &rarr;
              </Link>
            </div>
          ) : (
            sidebarConvos.map((c) => {
              const isSelected =
                c.id === conversationId || c.otherUser.id === userId
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.otherUser.id}${
                    c.book ? `?book=${c.book.id}` : ""
                  }`}
                  className={`flex items-center gap-3 p-3.5 transition-colors ${
                    isSelected
                      ? "bg-[#FAF6F0] border-l-4 border-[#C84200]"
                      : c.unreadCount > 0
                      ? "bg-[#C84200]/[0.04] hover:bg-[#FAF6F0]"
                      : "hover:bg-[#FAF6F0]/70"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full bg-[#1D1D1F] flex items-center justify-center shrink-0 overflow-hidden">
                    {c.otherUser.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.otherUser.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {(c.otherUser.name || "R").charAt(0).toUpperCase()}
                      </span>
                    )}
                    {c.otherUser.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[13px] text-[#1D1D1F] truncate flex items-center gap-1">
                        {c.isPinned && (
                          <Pin className="w-3 h-3 text-[#C84200] shrink-0" />
                        )}
                        {c.otherUser.name}
                      </span>
                      <span className="font-mono text-xs text-[#6E6E73] shrink-0">
                        {formatDistanceToNow(
                          new Date(c.lastMessage.createdAt),
                          { addSuffix: false }
                        )}
                      </span>
                    </div>

                    {c.book && (
                      <p className="text-xs font-semibold text-[#C84200] truncate">
                        {c.book.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p
                        className={`text-xs truncate ${
                          c.unreadCount > 0
                            ? "font-semibold text-[#1D1D1F]"
                            : "font-normal text-[#5E5E63]"
                        }`}
                      >
                        {c.lastMessage.isMine ? "You: " : ""}
                        {c.lastMessage.content}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#C84200] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {c.book?.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.book.image}
                      alt=""
                      className="w-8 h-10 rounded-lg object-cover shrink-0 border border-[#1D1D1F]/10"
                    />
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>
      )}

      {/* B. CENTER MAIN CHAT INTERFACE */}
      <div
        className={`${
          embedded
            ? showInfoPanel
              ? "lg:col-span-8"
              : "lg:col-span-12"
            : showInfoPanel
            ? "lg:col-span-6"
            : "lg:col-span-9"
        } bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm flex flex-col h-full overflow-hidden`}
      >
        {/* Chat Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#1D1D1F]/[0.06] flex items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="lg:hidden w-9 h-9 rounded-full bg-[#FAF6F0] flex items-center justify-center hover:bg-[#EFE7DC] transition-colors shrink-0 cursor-pointer"
                title="Back to Conversations"
                aria-label="Back to Conversations"
              >
                <ArrowLeft className="w-4 h-4 text-[#1D1D1F]" />
              </button>
            ) : (
              <Link
                href="/messages"
                className="w-9 h-9 rounded-full bg-[#FAF6F0] flex items-center justify-center hover:bg-[#EFE7DC] transition-colors shrink-0"
                title="Back to Conversations"
              >
                <ArrowLeft className="w-4 h-4 text-[#1D1D1F]" />
              </Link>
            )}

            <Link
              href={`/profile/${otherUser?.username || otherUser?.id || userId}`}
              className="relative w-11 h-11 rounded-full bg-[#1D1D1F] flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-[#FAF6F0]"
            >
              {otherUser?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherUser.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {(otherUser?.name || "R").charAt(0).toUpperCase()}
                </span>
              )}
              {otherUser?.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${otherUser?.username || otherUser?.id || userId}`}
                  className="font-bold text-[15px] md:text-base text-[#1D1D1F] hover:text-[#C84200] truncate transition-colors"
                >
                  {otherUser?.name || "Reader"}
                </Link>
                {otherUser?.username && (
                  <span className="font-mono text-xs text-[#6E6E73] hidden sm:inline">
                    @{otherUser.username}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[#5E5E63] truncate">
                {otherTypingName ? (
                  <span className="text-[#C84200] font-semibold">
                    typing...
                  </span>
                ) : otherUser?.online ? (
                  <span className="text-[#0A7D4F] font-semibold">
                    {otherUser?.liveStatus || "Online"}
                  </span>
                ) : otherUser?.lastSeenAt ? (
                  `Last seen ${formatDistanceToNow(
                    new Date(otherUser.lastSeenAt),
                    { addSuffix: true }
                  )}`
                ) : (
                  otherUser?.location || "AksharSetu Reader"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSearchInChat((prev) => !prev)
                if (showSearchInChat) {
                  setChatSearchQuery("")
                  fetchThread("")
                }
              }}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                showSearchInChat
                  ? "bg-[#C84200] text-white"
                  : "bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1D1D1F]"
              }`}
              title="Search in conversation"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setMobileInfoDrawer(true)
                } else {
                  setShowInfoPanel((prev) => !prev)
                }
              }}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                showInfoPanel
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1D1D1F]"
              }`}
              title="Conversation Info & Safety"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* In-Chat Search Bar */}
        {showSearchInChat && (
          <div className="px-4 py-2.5 bg-[#FAF6F0] border-b border-[#1D1D1F]/[0.06] flex items-center gap-2.5 shrink-0">
            <Search className="w-4 h-4 text-[#6E6E73]" />
            <input
              type="text"
              value={chatSearchQuery}
              onChange={(e) => {
                setChatSearchQuery(e.target.value)
                fetchThread(e.target.value)
              }}
              placeholder="Search messages in this conversation..."
              className="flex-1 bg-transparent text-sm font-medium text-[#1D1D1F] outline-none placeholder:text-[#6E6E73]"
            />
            {chatSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setChatSearchQuery("")
                  fetchThread("")
                }}
                className="text-xs font-bold text-[#C84200] hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* BOOK MARKETPLACE CONTEXT CARD */}
        {activeBook && (
          <div className="px-4 sm:px-5 py-3 bg-[#FAF6F0]/90 border-b border-[#1D1D1F]/[0.07] shrink-0 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {activeBook.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeBook.image}
                    alt={activeBook.title}
                    className="w-11 h-14 rounded-xl object-cover border border-[#1D1D1F]/10 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-14 rounded-xl bg-white border border-[#1D1D1F]/[0.08] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-[#C84200]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/catalog/${activeBook.id}`}
                      className="font-bold text-sm md:text-[15px] text-[#1D1D1F] hover:text-[#C84200] truncate"
                    >
                      {activeBook.title}
                    </Link>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold uppercase ${
                        activeBook.status === "AVAILABLE"
                          ? "bg-emerald-100 text-[#0A7D4F]"
                          : activeBook.status === "RESERVED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {activeBook.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#5E5E63] truncate mt-0.5">
                    {activeBook.author} ·{" "}
                    <span className="font-mono font-bold text-[#1D1D1F]">
                      {activeBook.price === 0
                        ? activeBook.acceptsExchange
                          ? "1-for-1 Swap"
                          : "Free Donation"
                        : `₹${activeBook.price}`}
                    </span>{" "}
                    · {activeBook.condition.replace("_", " ")} · Seller:{" "}
                    {activeBook.ownerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isSellerOfActiveBook &&
                  activeBook.price > 0 &&
                  activeBook.status !== "SOLD" && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOfferForm((prev) => !prev)
                        if (!offerAmount)
                          setOfferAmount(
                            String(Math.round(activeBook.price * 0.9))
                          )
                      }}
                      className="px-3.5 py-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" /> Make Offer
                    </button>
                  )}
                <Link
                  href={`/catalog/${activeBook.id}`}
                  className="px-3.5 py-2 rounded-full bg-white hover:bg-[#F2EBE1] text-[#1D1D1F] border border-[#1D1D1F]/10 text-xs font-bold transition-colors"
                >
                  View Listing
                </Link>
              </div>
            </div>

            {/* Accepted Offer Checkout Banner */}
            {acceptedOffer && (
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="font-bold text-[#0A7D4F]">
                  Offer Accepted: ₹{acceptedOffer.amount}{" "}
                  <span className="line-through text-emerald-700/70 font-normal">
                    ₹{acceptedOffer.listPrice}
                  </span>
                </span>
                {!isSellerOfActiveBook && activeBook.status !== "SOLD" && (
                  <Link
                    href={`/checkout/${activeBook.id}`}
                    className="px-3.5 py-1.5 rounded-full bg-[#0A7D4F] hover:bg-emerald-800 text-white text-xs font-bold shrink-0"
                  >
                    Proceed to Checkout &rarr;
                  </Link>
                )}
              </div>
            )}

            {/* Inline Make Offer Composer */}
            {showOfferForm && !isSellerOfActiveBook && (
              <form
                onSubmit={handleSubmitOffer}
                className="p-3.5 rounded-2xl bg-white border border-[#C84200]/25 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-[#C84200]" />
                    Propose a Price (Listed at ₹{activeBook.price})
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[0.9, 0.85, 0.8].map((pct) => {
                      const val = Math.max(1, Math.round(activeBook.price * pct))
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setOfferAmount(String(val))}
                          className="px-2.5 py-1 rounded-full bg-[#FAF6F0] hover:bg-[#C84200] hover:text-white font-mono text-xs font-bold text-[#1D1D1F] transition-colors cursor-pointer"
                        >
                          ₹{val} (-{Math.round((1 - pct) * 100)}%)
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => setShowOfferForm(false)}
                      className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    required
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Offer ₹"
                    className="w-28 rounded-xl bg-[#FAF6F0] border border-[#1D1D1F]/10 px-3.5 py-2 text-sm font-mono font-bold text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]"
                  />
                  <input
                    type="text"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    placeholder="Optional note (e.g., pickup today)"
                    className="flex-1 min-w-[140px] rounded-xl bg-[#FAF6F0] border border-[#1D1D1F]/10 px-3.5 py-2 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]"
                  />
                  <button
                    type="submit"
                    disabled={submittingOffer}
                    className="px-4 py-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs sm:text-sm font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {submittingOffer ? "Sending..." : "Send Offer"}
                  </button>
                </div>
              </form>
            )}

            {/* Contextual Buyer OR Seller Action Bar */}
            {isSellerOfActiveBook ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] shrink-0 mr-1">
                  Seller:
                </span>
                <button
                  type="button"
                  disabled={
                    updatingListingStatus || activeBook.status === "AVAILABLE"
                  }
                  onClick={() => handleSellerListingStatus("AVAILABLE")}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 border border-[#1D1D1F]/10 text-xs font-semibold text-[#0A7D4F] whitespace-nowrap disabled:opacity-40 cursor-pointer"
                >
                  Confirm Available
                </button>
                <button
                  type="button"
                  disabled={
                    updatingListingStatus || activeBook.status === "RESERVED"
                  }
                  onClick={() => handleSellerListingStatus("RESERVED")}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-amber-50 border border-[#1D1D1F]/10 text-xs font-semibold text-amber-800 whitespace-nowrap disabled:opacity-40 cursor-pointer"
                >
                  Mark Reserved
                </button>
                <button
                  type="button"
                  disabled={
                    updatingListingStatus || activeBook.status === "SOLD"
                  }
                  onClick={() => handleSellerListingStatus("SOLD")}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-red-50 border border-[#1D1D1F]/10 text-xs font-semibold text-red-700 whitespace-nowrap disabled:opacity-40 cursor-pointer"
                >
                  Mark Sold
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EFE7DC] border border-[#1D1D1F]/10 text-xs font-semibold text-[#1D1D1F] whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#C84200]" /> Share Photos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewMessage(
                      `The book is available for pickup${
                        otherUser?.location ? ` or courier` : ""
                      }. Let me know what time works best for you!`
                    )
                    textareaRef.current?.focus()
                  }}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EFE7DC] border border-[#1D1D1F]/10 text-xs font-semibold text-[#1D1D1F] whitespace-nowrap cursor-pointer"
                >
                  Send Pickup Info
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                {BUYER_QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setNewMessage(p.text)
                      textareaRef.current?.focus()
                    }}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#1D1D1F] hover:text-white border border-[#1D1D1F]/10 text-xs font-semibold text-[#1D1D1F] whitespace-nowrap transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Optional External Context Banner (Fulfill Request / Swap / Quote) */}
        {activeContext && !activeBook && (
          <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#C84200]/25 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#C84200]">
                <Sparkles className="w-3.5 h-3.5" /> {activeContext.badge}
              </span>
              <p className="text-sm font-bold text-[#1D1D1F] truncate mt-0.5">
                {activeContext.title}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sendMessageContent(activeContext.prefillMessage)
                  setActiveContext(null)
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold cursor-pointer"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewMessage(activeContext.prefillMessage)
                  setActiveContext(null)
                }}
                className="px-3 py-1.5 rounded-full bg-white text-[#1D1D1F] text-xs font-bold border border-[#1D1D1F]/10 cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveContext(null)}
                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MESSAGES STREAM */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-3.5 bg-white">
          {hasMore && (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                disabled={loadingOlder}
                onClick={loadOlderMessages}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-xs font-bold text-[#1D1D1F] transition-colors cursor-pointer"
              >
                {loadingOlder ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
                Load older messages
              </button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-[#C84200]" />
              </div>
              <p className="text-[#1D1D1F] font-bold text-lg mb-1.5">
                Start a conversation with {otherUser?.name || "this reader"}
              </p>
              <p className="text-[#5E5E63] text-sm max-w-sm mb-6 leading-relaxed">
                Ask about book condition, propose a price offer, or coordinate a
                campus handoff.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {BUYER_QUICK_PROMPTS.slice(0, 4).map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setNewMessage(p.text)
                      textareaRef.current?.focus()
                    }}
                    className="text-xs sm:text-[13px] font-semibold px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#1D1D1F] hover:text-white border border-[#1D1D1F]/[0.07] text-[#1D1D1F] transition-colors cursor-pointer"
                  >
                    “{p.text}”
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null
              const showDateDivider =
                !prevMsg ||
                !isSameDay(new Date(prevMsg.createdAt), new Date(msg.createdAt))

              const isUnreadBoundary =
                previousLastReadMs !== null &&
                msg.sender.id !== session?.user?.id &&
                new Date(msg.createdAt).getTime() > previousLastReadMs &&
                (!prevMsg ||
                  new Date(prevMsg.createdAt).getTime() <= previousLastReadMs)

              const isMine = msg.sender.id === session?.user?.id
              const isDeleted = Boolean(msg.deletedAt)
              const deliveryState = isMine ? getMessageDeliveryState(msg) : null
              const urlMatch = !isDeleted ? msg.content.match(URL_REGEX) : null

              return (
                <div key={msg.id} id={`msg-${msg.id}`} className="space-y-2.5">
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-3">
                      <span className="px-3.5 py-1 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] font-mono text-xs font-semibold text-[#5E5E63]">
                        {formatDaySeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  {isUnreadBoundary && (
                    <div className="flex items-center gap-2.5 my-3">
                      <div className="h-px flex-1 bg-[#C84200]/30" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C84200]">
                        New messages
                      </span>
                      <div className="h-px flex-1 bg-[#C84200]/30" />
                    </div>
                  )}

                  {/* SYSTEM MESSAGE */}
                  {msg.type === "SYSTEM" ? (
                    <div className="flex justify-center my-2">
                      <span className="px-4 py-1.5 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-xs font-semibold text-[#5E5E63]">
                        {msg.content}
                      </span>
                    </div>
                  ) : msg.type === "OFFER" && msg.offer ? (
                    /* STRUCTURED PRICE OFFER CARD */
                    <div
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="w-full max-w-sm rounded-3xl border border-[#1D1D1F]/10 bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-[#0B0B0D] text-white flex items-center justify-between">
                          <span className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-[#FF7F45]" /> Price
                            Offer
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold uppercase ${
                              msg.offer.status === "ACCEPTED"
                                ? "bg-[#0A7D4F] text-white"
                                : msg.offer.status === "PENDING"
                                ? "bg-[#FF7F45] text-[#0B0B0D]"
                                : "bg-white/20 text-white"
                            }`}
                          >
                            {msg.offer.status}
                          </span>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                                Offered Price
                              </p>
                              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1D1D1F] mt-0.5">
                                ₹{msg.offer.amount}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold uppercase tracking-wider text-[#6E6E73]">
                                Listed Price
                              </p>
                              <p className="font-mono text-sm font-bold text-[#6E6E73] line-through mt-0.5">
                                ₹{msg.offer.listPrice}
                              </p>
                            </div>
                          </div>

                          {msg.offer.note && (
                            <p className="text-sm text-[#1D1D1F]/85 bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] rounded-2xl p-3 font-serif italic leading-relaxed">
                              “{msg.offer.note}”
                            </p>
                          )}

                          <p className="font-mono text-xs text-[#6E6E73] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {msg.offer.status === "PENDING"
                              ? `Expires ${formatDistanceToNow(
                                  new Date(msg.offer.expiresAt),
                                  { addSuffix: true }
                                )}`
                              : `Updated ${formatDistanceToNow(
                                  new Date(
                                    msg.offer.respondedAt || msg.offer.createdAt
                                  ),
                                  { addSuffix: true }
                                )}`}
                          </p>

                          {/* Seller Accept / Reject Buttons */}
                          {msg.offer.status === "PENDING" &&
                            msg.offer.sellerId === session?.user?.id && (
                              <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <button
                                  type="button"
                                  disabled={busyOfferId === msg.offer.id}
                                  onClick={() =>
                                    handleOfferDecision(
                                      msg.offer!.id,
                                      "ACCEPTED"
                                    )
                                  }
                                  className="py-2.5 rounded-full bg-[#0A7D4F] hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={busyOfferId === msg.offer.id}
                                  onClick={() =>
                                    handleOfferDecision(
                                      msg.offer!.id,
                                      "REJECTED"
                                    )
                                  }
                                  className="py-2.5 rounded-full bg-[#FAF6F0] hover:bg-red-50 hover:text-red-600 text-[#1D1D1F] border border-[#1D1D1F]/[0.08] text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <XCircle className="w-4 h-4" /> Decline
                                </button>
                              </div>
                            )}

                          {/* Buyer Withdraw Button */}
                          {msg.offer.status === "PENDING" &&
                            msg.offer.buyerId === session?.user?.id && (
                              <button
                                type="button"
                                disabled={busyOfferId === msg.offer.id}
                                onClick={() =>
                                  handleOfferDecision(
                                    msg.offer!.id,
                                    "WITHDRAWN"
                                  )
                                }
                                className="w-full py-2.5 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.08] text-xs sm:text-sm font-bold text-[#1D1D1F] cursor-pointer transition-colors"
                              >
                                Withdraw Offer
                              </button>
                            )}

                          {msg.offer.status === "ACCEPTED" &&
                            msg.offer.buyerId === session?.user?.id && (
                              <Link
                                href={`/checkout/${msg.offer.bookId}`}
                                className="block w-full py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold text-center transition-colors"
                              >
                                Proceed to Checkout
                              </Link>
                            )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* STANDARD MESSAGE BUBBLE */
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex group relative ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[76%] flex flex-col gap-1.5 ${
                          isMine ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Reply Preview Header */}
                        {msg.replyTo && !isDeleted && (
                          <button
                            type="button"
                            onClick={() => {
                              document
                                .getElementById(`msg-${msg.replyTo!.id}`)
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                })
                            }}
                            className="text-left px-3.5 py-2 rounded-2xl text-xs border-l-2 border-[#C84200] bg-[#FAF6F0] text-[#1D1D1F]/80 max-w-full truncate cursor-pointer"
                          >
                            <span className="font-bold text-[#C84200] mr-1.5">
                              {msg.replyTo.senderName}:
                            </span>
                            {msg.replyTo.content || "Attachment"}
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          {/* Hover Actions (Left side for own messages) */}
                          {isMine && !isDeleted && !msg.id.startsWith("temp-") && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white border border-[#1D1D1F]/10 rounded-full px-1.5 py-1 shadow-sm transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveReactionMsgId(
                                    activeReactionMsgId === msg.id
                                      ? null
                                      : msg.id
                                  )
                                }
                                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="React"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyTarget(msg)
                                  textareaRef.current?.focus()
                                }}
                                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="Reply"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessage(msg)
                                  setNewMessage(msg.content)
                                  textareaRef.current?.focus()
                                }}
                                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content)
                                  toast.success("Copied message text")
                                }}
                                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="Copy"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 text-[#6E6E73] hover:text-red-600 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Bubble Content */}
                          <div
                            className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                              isDeleted
                                ? "bg-[#FAF6F0] text-[#6E6E73] italic border border-[#1D1D1F]/[0.06]"
                                : isMine
                                ? "bg-[#1D1D1F] text-[#FAF6F0] rounded-br-sm shadow-xs"
                                : "bg-[#FAF6F0] text-[#1D1D1F] border border-[#1D1D1F]/[0.07] rounded-bl-sm"
                            }`}
                          >
                            {/* Attachments inside bubble */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="space-y-2 mb-2.5">
                                {msg.attachments.map((att) =>
                                  att.kind === "IMAGE" ? (
                                    <button
                                      key={att.id}
                                      type="button"
                                      onClick={() => setLightboxImage(att.url)}
                                      className="block rounded-xl overflow-hidden max-w-xs border border-black/10 cursor-pointer"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={att.url}
                                        alt={att.fileName}
                                        loading="lazy"
                                        className="max-h-60 w-auto object-cover"
                                      />
                                    </button>
                                  ) : (
                                    <a
                                      key={att.id}
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                                        isMine
                                          ? "bg-white/10 border-white/15 text-white"
                                          : "bg-white border-[#1D1D1F]/10 text-[#1D1D1F]"
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <div className="min-w-0 flex-1 text-left">
                                        <p className="text-xs font-bold truncate">
                                          {att.fileName}
                                        </p>
                                        <p className="font-mono text-xs opacity-75">
                                          {formatFileSize(att.size)}
                                        </p>
                                      </div>
                                    </a>
                                  )
                                )}
                              </div>
                            )}

                            {msg.content && <span>{msg.content}</span>}

                            {urlMatch?.[1] && (
                              <LinkPreviewInline url={urlMatch[1]} />
                            )}
                          </div>

                          {/* Hover Actions (Right side for incoming messages) */}
                          {!isMine && !isDeleted && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white border border-[#1D1D1F]/10 rounded-full px-1.5 py-1 shadow-sm transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveReactionMsgId(
                                    activeReactionMsgId === msg.id
                                      ? null
                                      : msg.id
                                  )
                                }
                                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="React"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyTarget(msg)
                                  textareaRef.current?.focus()
                                }}
                                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="Reply"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content)
                                  toast.success("Copied message text")
                                }}
                                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="Copy"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Quick Reaction Picker Popover */}
                        {activeReactionMsgId === msg.id && (
                          <div className="flex items-center gap-1 bg-white border border-[#1D1D1F]/10 rounded-full px-3 py-1.5 shadow-md z-20">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  handleToggleReaction(msg.id, emoji)
                                }
                                className="hover:scale-125 transition-transform text-base px-1 cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Existing Reactions Pills */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 px-1">
                            {msg.reactions.map((r) => {
                              const iReacted = r.userIds.includes(
                                session?.user?.id || ""
                              )
                              return (
                                <button
                                  key={r.emoji}
                                  type="button"
                                  onClick={() =>
                                    handleToggleReaction(msg.id, r.emoji)
                                  }
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                                    iReacted
                                      ? "bg-[#C84200]/10 border-[#C84200]/35 text-[#C84200]"
                                      : "bg-[#FAF6F0] border-[#1D1D1F]/[0.07] text-[#1D1D1F]"
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="font-mono">
                                    {r.userIds.length}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Timestamp + Edited + Sent/Delivered/Read Receipt */}
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="font-mono text-xs text-[#6E6E73]">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                          {msg.editedAt && !isDeleted && (
                            <span className="text-xs italic text-[#6E6E73]">
                              · edited
                            </span>
                          )}
                          {isMine && !isDeleted && (
                            <span
                              className="inline-flex items-center"
                              title={
                                deliveryState === "read"
                                  ? "Read"
                                  : deliveryState === "delivered"
                                  ? "Delivered"
                                  : "Sent"
                              }
                            >
                              {deliveryState === "read" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#C84200]" />
                              ) : deliveryState === "delivered" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#6E6E73]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-[#6E6E73]" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })
          )}

          {otherTypingName && (
            <div className="flex items-center gap-2 text-xs text-[#5E5E63] font-medium pl-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C84200] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C84200] animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C84200] animate-bounce [animation-delay:300ms]" />
              </span>
              {otherTypingName} is typing...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* MESSAGE COMPOSER */}
        <div className="p-3.5 sm:p-4 border-t border-[#1D1D1F]/[0.07] bg-white shrink-0 space-y-2.5 relative">
          {/* Reply or Edit Banner */}
          {(replyTarget || editingMessage) && (
            <div className="px-3.5 py-2 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex items-center justify-between gap-2 text-xs sm:text-[13px]">
              <div className="min-w-0">
                <span className="font-bold text-[#C84200] mr-1.5">
                  {editingMessage
                    ? "Editing message"
                    : `Replying to ${replyTarget?.sender.name}`}
                </span>
                <span className="text-[#5E5E63] truncate">
                  {(editingMessage || replyTarget)?.content}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(null)
                  setEditingMessage(null)
                  if (editingMessage) setNewMessage("")
                }}
                className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Attachments Preview Strip */}
          {pendingAttachments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/10 p-2 flex items-center gap-2 shrink-0"
                >
                  {att.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.url}
                      alt={att.fileName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-[#C84200]" />
                  )}
                  <span className="text-xs font-semibold text-[#1D1D1F] max-w-[110px] truncate">
                    {att.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((x) => x.id !== att.id)
                      )
                    }
                    className="p-1 rounded-full bg-[#1D1D1F] text-white hover:bg-black cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-18 left-4 w-72 max-w-[calc(100vw-2.5rem)] bg-white rounded-3xl shadow-xl border border-[#1D1D1F]/10 p-3.5 z-30 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#1D1D1F]/[0.06] pb-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveEmojiCat(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        activeEmojiCat === cat.id
                          ? "bg-[#1D1D1F] text-white"
                          : "text-[#6E6E73] hover:text-[#1D1D1F]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                {EMOJI_CATEGORIES.find(
                  (c) => c.id === activeEmojiCat
                )?.emojis.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setNewMessage((prev) => prev + em)
                      textareaRef.current?.focus()
                    }}
                    className="p-1 text-base hover:bg-[#FAF6F0] rounded-lg cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Blocked state vs Active Composer */}
          {convMeta?.block?.isBlocked ? (
            <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-center flex items-center justify-between gap-2 text-sm font-medium text-[#5E5E63]">
              <span>
                {convMeta.block.blockedByMe
                  ? `You have blocked ${otherUser?.name || "this user"}.`
                  : "You cannot reply to this conversation."}
              </span>
              {convMeta.block.blockedByMe && (
                <button
                  type="button"
                  onClick={handleBlockToggle}
                  className="px-4 py-1.5 rounded-full bg-[#1D1D1F] text-white text-xs font-bold cursor-pointer"
                >
                  Unblock
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessageContent()
              }}
              className="flex items-end gap-2.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT_ATTR}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingFile || !conversationId}
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40"
                title="Attach photo or document"
              >
                {uploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="w-11 h-11 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Emoji picker"
              >
                <Smile className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  emitTyping()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessageContent()
                  }
                }}
                placeholder={`Write a message to ${otherUser?.name || "reader"}...`}
                className="flex-1 max-h-32 bg-[#FAF6F0] border border-[#1D1D1F]/[0.09] focus:border-[#C84200] focus:ring-2 focus:ring-[#C84200]/15 focus:bg-white text-[#1D1D1F] rounded-2xl px-4 py-3 text-[15px] leading-relaxed outline-none transition-all placeholder:text-[#6E6E73] resize-none"
              />

              <button
                type="submit"
                disabled={
                  sending ||
                  uploadingFile ||
                  (!newMessage.trim() && pendingAttachments.length === 0)
                }
                className="w-11 h-11 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-xs"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* C. RIGHT CONVERSATION INFORMATION PANEL (Desktop) */}
      {showInfoPanel && (
        <div
          className={`hidden lg:flex ${
            embedded ? "lg:col-span-4" : "lg:col-span-3"
          } bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm flex-col overflow-hidden`}
        >
          {infoPanelContent}
        </div>
      )}

      {/* Mobile / Tablet Slide-Over Info Drawer */}
      <AnimatePresence>
        {mobileInfoDrawer && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileInfoDrawer(false)}
              className="fixed inset-0 bg-black/45"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-80 max-w-[88vw] bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-[#1D1D1F]/[0.06] flex items-center justify-between">
                <span className="font-bold text-base text-[#1D1D1F]">
                  Conversation Details
                </span>
                <button
                  type="button"
                  onClick={() => setMobileInfoDrawer(false)}
                  className="p-2 rounded-full bg-[#FAF6F0] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {infoPanelContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImage}
            alt="Full attachment"
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain"
          />
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-[#1D1D1F]/10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#1D1D1F] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" /> Report{" "}
                {otherUser?.name || "User"}
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-full bg-[#FAF6F0] text-[#5E5E63] hover:text-[#1D1D1F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] text-sm font-medium text-[#1D1D1F] cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reportReason === r.value}
                      onChange={() => setReportReason(r.value)}
                      className="accent-[#C84200]"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Additional context (optional)..."
                className="w-full rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/10 p-3.5 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2.5 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] text-sm font-bold text-[#1D1D1F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer"
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
