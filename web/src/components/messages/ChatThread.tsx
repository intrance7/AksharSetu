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
      className="mt-2 block rounded-xl bg-black/5 hover:bg-black/10 p-2.5 text-left transition-colors border border-black/10"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 truncate">
        {preview.siteName || preview.hostname}
      </p>
      <p className="text-xs font-bold line-clamp-1 mt-0.5">{preview.title}</p>
      {preview.description && (
        <p className="text-[11px] opacity-80 line-clamp-2 mt-0.5">
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
}: {
  userId: string
  initialBookId?: string | null
  contextBanner?: ChatContextBanner | null
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
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [replyTarget, setReplyTarget] = useState<MessageDTO | null>(null)
  const [editingMessage, setEditingMessage] = useState<MessageDTO | null>(null)
  const [activeContext, setActiveContext] = useState<ChatContextBanner | null>(
    contextBanner
  )
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
  const [showInfoPanel, setShowInfoPanel] = useState(true)
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

      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? saved : m))
      )
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
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-6.5rem)]">
        <div className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-black/5 p-4 space-y-3 animate-pulse">
          <div className="h-9 bg-[#f5f5f7] rounded-full" />
          <div className="h-14 bg-[#f5f5f7] rounded-2xl" />
          <div className="h-14 bg-[#f5f5f7] rounded-2xl" />
          <div className="h-14 bg-[#f5f5f7] rounded-2xl" />
        </div>
        <div className="lg:col-span-9 bg-white rounded-2xl border border-black/5 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#1d1d1f]/30" />
        </div>
      </div>
    )
  }

  const infoPanelContent = (
    <div className="flex flex-col h-full overflow-y-auto divide-y divide-black/5 text-xs">
      {/* User Identity Summary */}
      <div className="p-5 flex flex-col items-center text-center">
        <div className="relative w-16 h-16 rounded-full bg-[#1d1d1f] flex items-center justify-center overflow-hidden mb-3">
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
        <h3 className="font-bold text-base text-[#1d1d1f]">
          {otherUser?.name || "Reader"}
        </h3>
        <p className="text-[#86868b] font-medium">@{otherUser?.username}</p>

        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              otherUser?.online
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#f5f5f7] text-[#86868b]"
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
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              {Number(otherUser.sellerRating).toFixed(1)}
            </span>
          )}
        </div>

        {otherUser?.location && (
          <p className="text-[#86868b] font-medium flex items-center gap-1 mt-2">
            <MapPin className="w-3 h-3 text-[#0066cc]" /> {otherUser.location}
          </p>
        )}

        {otherUser?.bio && (
          <p className="text-[#1d1d1f]/80 font-medium mt-3 leading-relaxed line-clamp-3">
            {otherUser.bio}
          </p>
        )}

        {otherUser?.favoriteQuote && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#f5f5f7] text-left w-full">
            <p className="italic text-[11px] text-[#1d1d1f]/80 line-clamp-2">
              “{otherUser.favoriteQuote}”
            </p>
            {otherUser.quoteAuthor && (
              <p className="text-[10px] font-bold text-[#86868b] mt-0.5">
                — {otherUser.quoteAuthor}
              </p>
            )}
          </div>
        )}

        <Link
          href={`/profile/${otherUser?.id || userId}`}
          className="mt-4 w-full py-2 px-4 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] font-bold text-[#1d1d1f] flex items-center justify-center gap-1.5 transition-colors"
        >
          View Full Profile <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Shared / Listed Books */}
      <div className="p-4 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
          {otherUser?.name?.split(" ")[0] || "Reader"}&apos;s Books (
          {otherUser?.books?.length || 0})
        </p>
        {!otherUser?.books || otherUser.books.length === 0 ? (
          <p className="text-[#86868b] py-2">No active book listings.</p>
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
                  className="p-2 rounded-xl bg-[#f5f5f7] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/catalog/${b.id}`}
                      className="font-bold text-[#1d1d1f] hover:text-[#0066cc] truncate block"
                    >
                      {b.title}
                    </Link>
                    <p className="text-[10px] text-[#86868b] truncate">
                      {priceLabel} · {b.condition.replace("_", " ")} · {b.status}
                    </p>
                  </div>
                  <Link
                    href={`/messages/${otherUser.id}?book=${b.id}`}
                    className="px-2.5 py-1 rounded-full bg-[#0066cc] text-white text-[10px] font-bold shrink-0"
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
      <div className="p-4 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
          Shared Media & Files ({convMeta?.sharedMedia?.length || 0})
        </p>
        {!convMeta?.sharedMedia || convMeta.sharedMedia.length === 0 ? (
          <p className="text-[#86868b] py-2">
            Photos and documents shared in this chat will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {convMeta.sharedMedia.slice(0, 9).map((m: any) =>
              m.kind === "IMAGE" ? (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLightboxImage(m.url)}
                  className="aspect-square rounded-lg overflow-hidden bg-[#f5f5f7] border border-black/5 cursor-pointer"
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
                  className="aspect-square rounded-lg bg-[#f5f5f7] p-1.5 flex flex-col items-center justify-center text-center border border-black/5 hover:bg-[#e8e8ed]"
                >
                  <FileText className="w-4 h-4 text-[#0066cc] mb-1" />
                  <span className="text-[9px] font-semibold truncate w-full">
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
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-2">
          Conversation & Privacy
        </p>

        <button
          type="button"
          onClick={() =>
            handleConversationSetting({ isPinned: !convMeta?.me?.isPinned })
          }
          className="w-full py-2 px-3 rounded-xl hover:bg-[#f5f5f7] flex items-center justify-between font-semibold text-[#1d1d1f] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-[#0066cc]" />
            {convMeta?.me?.isPinned ? "Unpin Conversation" : "Pin Conversation"}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleConversationSetting({ isMuted: !convMeta?.me?.isMuted })
          }
          className="w-full py-2 px-3 rounded-xl hover:bg-[#f5f5f7] flex items-center justify-between font-semibold text-[#1d1d1f] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {convMeta?.me?.isMuted ? (
              <Bell className="w-3.5 h-3.5 text-[#0066cc]" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-[#86868b]" />
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
          className="w-full py-2 px-3 rounded-xl hover:bg-[#f5f5f7] flex items-center justify-between font-semibold text-[#1d1d1f] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-[#86868b]" />
            {convMeta?.me?.isArchived
              ? "Unarchive Conversation"
              : "Archive Conversation"}
          </span>
        </button>

        {browserNotifPerm !== "granted" && (
          <button
            type="button"
            onClick={requestBrowserNotifications}
            className="w-full py-2 px-3 rounded-xl hover:bg-[#f5f5f7] flex items-center justify-between font-semibold text-[#0066cc] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" /> Enable Desktop Alerts
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleBlockToggle}
          className="w-full py-2 px-3 rounded-xl hover:bg-red-50 flex items-center justify-between font-semibold text-red-600 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Ban className="w-3.5 h-3.5" />
            {convMeta?.block?.blockedByMe ? "Unblock User" : "Block User"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="w-full py-2 px-3 rounded-xl hover:bg-red-50 flex items-center justify-between font-semibold text-red-600 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Report Conversation
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-6.5rem)]">
      {/* A. LEFT CONVERSATION SIDEBAR (Desktop) */}
      <div className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl border border-black/5 shadow-sm flex-col overflow-hidden">
        <div className="p-3.5 border-b border-black/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <Link
              href="/messages"
              className="flex items-center gap-2 text-sm font-black text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#0066cc]" />
              Messages
            </Link>
            <Link
              href="/messages?tab=discover"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-[11px] font-bold text-white transition-colors"
            >
              <Plus className="w-3 h-3" /> New
            </Link>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search chats or books..."
              className="w-full h-8 pl-8 pr-3 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:bg-white focus:ring-2 focus:ring-[#0066cc]/20 border border-transparent focus:border-[#0066cc]"
            />
          </div>

          {/* Filter Pills: All | Unread | Buying | Selling | Archived */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
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
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  sidebarFilter === tab.id
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-black/5">
          {sidebarConvos.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-[#86868b]">
                No {sidebarFilter !== "all" ? sidebarFilter : ""} conversations
                found.
              </p>
              <Link
                href="/messages?tab=discover"
                className="inline-block text-xs font-bold text-[#0066cc] hover:underline"
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
                  className={`flex items-center gap-2.5 p-3 transition-colors ${
                    isSelected
                      ? "bg-[#0066cc]/8 border-l-4 border-[#0066cc]"
                      : c.unreadCount > 0
                      ? "bg-[#0066cc]/[0.03] hover:bg-[#f5f5f7]"
                      : "hover:bg-[#f5f5f7]/80"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full bg-[#1d1d1f] flex items-center justify-center shrink-0 overflow-hidden">
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
                      <span className="font-bold text-xs text-[#1d1d1f] truncate flex items-center gap-1">
                        {c.isPinned && (
                          <Pin className="w-2.5 h-2.5 text-[#0066cc] shrink-0" />
                        )}
                        {c.otherUser.name}
                      </span>
                      <span className="text-[10px] font-medium text-[#86868b] shrink-0">
                        {formatDistanceToNow(
                          new Date(c.lastMessage.createdAt),
                          { addSuffix: false }
                        )}
                      </span>
                    </div>

                    {c.book && (
                      <p className="text-[10px] font-semibold text-[#0066cc] truncate">
                        📚 {c.book.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p
                        className={`text-[11px] truncate ${
                          c.unreadCount > 0
                            ? "font-bold text-[#1d1d1f]"
                            : "font-medium text-[#86868b]"
                        }`}
                      >
                        {c.lastMessage.isMine ? "You: " : ""}
                        {c.lastMessage.content}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#0066cc] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
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
                      className="w-8 h-10 rounded object-cover shrink-0 border border-black/10"
                    />
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* B. CENTER MAIN CHAT INTERFACE */}
      <div
        className={`${
          showInfoPanel ? "lg:col-span-6" : "lg:col-span-9"
        } bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col h-full overflow-hidden`}
      >
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/messages"
              className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e8e8ed] transition-colors shrink-0"
              title="Back to Conversations"
            >
              <ArrowLeft className="w-4 h-4 text-[#1d1d1f]" />
            </Link>

            <Link
              href={`/profile/${otherUser?.id || userId}`}
              className="relative w-10 h-10 rounded-full bg-[#1d1d1f] flex items-center justify-center shrink-0 overflow-hidden"
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
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/profile/${otherUser?.id || userId}`}
                  className="font-bold text-sm md:text-base text-[#1d1d1f] hover:text-[#0066cc] truncate"
                >
                  {otherUser?.name || "Reader"}
                </Link>
                <span className="text-[11px] font-medium text-[#86868b] hidden sm:inline">
                  @{otherUser?.username}
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#86868b] truncate">
                {otherTypingName ? (
                  <span className="text-[#0066cc] font-semibold">
                    typing...
                  </span>
                ) : otherUser?.online ? (
                  <span className="text-emerald-600 font-semibold">
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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSearchInChat((prev) => !prev)
                if (showSearchInChat) {
                  setChatSearchQuery("")
                  fetchThread("")
                }
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showSearchInChat
                  ? "bg-[#0066cc] text-white"
                  : "bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]"
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
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showInfoPanel
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]"
              }`}
              title="Conversation Info & Safety"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* In-Chat Search Bar */}
        {showSearchInChat && (
          <div className="px-4 py-2 bg-[#f5f5f7] border-b border-black/5 flex items-center gap-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#86868b]" />
            <input
              type="text"
              value={chatSearchQuery}
              onChange={(e) => {
                setChatSearchQuery(e.target.value)
                fetchThread(e.target.value)
              }}
              placeholder="Search messages in this conversation..."
              className="flex-1 bg-transparent text-xs font-medium text-[#1d1d1f] outline-none"
            />
            {chatSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setChatSearchQuery("")
                  fetchThread("")
                }}
                className="text-xs font-bold text-[#86868b] hover:text-[#1d1d1f]"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* BOOK MARKETPLACE CONTEXT CARD */}
        {activeBook && (
          <div className="px-4 py-2.5 bg-[#f5f5f7]/90 border-b border-black/5 shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {activeBook.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeBook.image}
                    alt={activeBook.title}
                    className="w-10 h-12 rounded-lg object-cover border border-black/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-12 rounded-lg bg-[#e8e8ed] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-[#86868b]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/catalog/${activeBook.id}`}
                      className="font-bold text-xs md:text-sm text-[#1d1d1f] hover:text-[#0066cc] truncate"
                    >
                      {activeBook.title}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        activeBook.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-800"
                          : activeBook.status === "RESERVED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {activeBook.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[#86868b] truncate">
                    {activeBook.author} ·{" "}
                    <span className="font-bold text-[#1d1d1f]">
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

              <div className="flex items-center gap-1.5 shrink-0">
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
                      className="px-3 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Tag className="w-3 h-3" /> Make Offer
                    </button>
                  )}
                <Link
                  href={`/catalog/${activeBook.id}`}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#e8e8ed] text-[#1d1d1f] border border-black/10 text-[11px] font-bold transition-colors"
                >
                  View Listing
                </Link>
              </div>
            </div>

            {/* Accepted Offer Checkout Banner */}
            {acceptedOffer && (
              <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-900">
                  ✅ Offer Accepted: ₹{acceptedOffer.amount}{" "}
                  <span className="line-through text-emerald-700/70 font-normal">
                    ₹{acceptedOffer.listPrice}
                  </span>
                </span>
                {!isSellerOfActiveBook && activeBook.status !== "SOLD" && (
                  <Link
                    href={`/checkout/${activeBook.id}`}
                    className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0"
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
                className="p-3 rounded-xl bg-white border border-[#0066cc]/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1d1d1f] flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-[#0066cc]" />
                    Propose a Price (Listed at ₹{activeBook.price})
                  </span>
                  <div className="flex items-center gap-1">
                    {[0.9, 0.85, 0.8].map((pct) => {
                      const val = Math.max(1, Math.round(activeBook.price * pct))
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setOfferAmount(String(val))}
                          className="px-2 py-0.5 rounded-full bg-[#f5f5f7] hover:bg-[#0066cc] hover:text-white text-[10px] font-bold text-[#1d1d1f] transition-colors cursor-pointer"
                        >
                          ₹{val} (-{Math.round((1 - pct) * 100)}%)
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => setShowOfferForm(false)}
                      className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    required
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Offer ₹"
                    className="w-28 rounded-xl bg-[#f5f5f7] px-3 py-1.5 text-xs font-bold text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0066cc]"
                  />
                  <input
                    type="text"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    placeholder="Optional note (e.g., can pick up today on campus)"
                    className="flex-1 rounded-xl bg-[#f5f5f7] px-3 py-1.5 text-xs font-medium text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#0066cc]"
                  />
                  <button
                    type="submit"
                    disabled={submittingOffer}
                    className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {submittingOffer ? "Sending..." : "Send Offer"}
                  </button>
                </div>
              </form>
            )}

            {/* Contextual Buyer OR Seller Action Bar */}
            {isSellerOfActiveBook ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] shrink-0 mr-1">
                  Seller Actions:
                </span>
                <button
                  type="button"
                  disabled={
                    updatingListingStatus || activeBook.status === "AVAILABLE"
                  }
                  onClick={() => handleSellerListingStatus("AVAILABLE")}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-black/10 text-[10px] font-bold text-emerald-700 whitespace-nowrap disabled:opacity-40 cursor-pointer"
                >
                  ✓ Confirm Available
                </button>
                <button
                  type="button"
                  disabled={
                    updatingListingStatus || activeBook.status === "RESERVED"
                  }
                  onClick={() => handleSellerListingStatus("RESERVED")}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 border border-black/10 text-[10px] font-bold text-amber-700 whitespace-nowrap disabled:opacity-40 cursor-pointer"
                >
                  ⏳ Mark Reserved
                </button>
                <button
                  type="button"
                  disabled={
                    updatingListingStatus || activeBook.status === "SOLD"
                  }
                  onClick={() => handleSellerListingStatus("SOLD")}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-red-50 border border-black/10 text-[10px] font-bold text-red-700 whitespace-nowrap disabled:opacity-40 cursor-pointer"
                >
                  🏷️ Mark Sold
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#e8e8ed] border border-black/10 text-[10px] font-bold text-[#1d1d1f] whitespace-nowrap flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3 h-3 text-[#0066cc]" /> Share Photos
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
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#e8e8ed] border border-black/10 text-[10px] font-bold text-[#1d1d1f] whitespace-nowrap cursor-pointer"
                >
                  📍 Send Pickup Info
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {BUYER_QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setNewMessage(p.text)
                      textareaRef.current?.focus()
                    }}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-[#0066cc] hover:text-white border border-black/10 text-[10px] font-semibold text-[#1d1d1f] whitespace-nowrap transition-colors cursor-pointer"
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
          <div className="mx-4 mt-2.5 p-3 rounded-2xl bg-[#0066cc]/8 border border-[#0066cc]/20 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">
                <Sparkles className="w-3 h-3" /> {activeContext.badge}
              </span>
              <p className="text-xs font-bold text-[#1d1d1f] truncate">
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
                className="px-3 py-1 rounded-full bg-[#0066cc] text-white text-xs font-semibold cursor-pointer"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewMessage(activeContext.prefillMessage)
                  setActiveContext(null)
                }}
                className="px-2.5 py-1 rounded-full bg-white text-[#1d1d1f] text-xs font-semibold border border-black/10 cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveContext(null)}
                className="p-1 text-[#86868b]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* MESSAGES STREAM */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {hasMore && (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                disabled={loadingOlder}
                onClick={loadOlderMessages}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-xs font-bold text-[#1d1d1f] transition-colors cursor-pointer"
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
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-3">
                <User className="w-5 h-5 text-[#86868b]" />
              </div>
              <p className="text-[#1d1d1f] font-bold text-base mb-1">
                Start a conversation with {otherUser?.name || "this reader"}
              </p>
              <p className="text-[#86868b] font-medium text-xs max-w-sm mb-5">
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
                    className="text-xs font-semibold px-3.5 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#0066cc] hover:text-white text-[#1d1d1f] transition-colors cursor-pointer"
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
                    <div className="flex items-center justify-center my-2">
                      <span className="px-3 py-0.5 rounded-full bg-[#f5f5f7] text-[10px] font-bold text-[#86868b]">
                        {formatDaySeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}

                  {isUnreadBoundary && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="h-px flex-1 bg-[#0066cc]/30" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">
                        New messages
                      </span>
                      <div className="h-px flex-1 bg-[#0066cc]/30" />
                    </div>
                  )}

                  {/* SYSTEM MESSAGE */}
                  {msg.type === "SYSTEM" ? (
                    <div className="flex justify-center my-1.5">
                      <span className="px-3.5 py-1 rounded-full bg-[#f5f5f7] border border-black/5 text-[11px] font-semibold text-[#1d1d1f]/80">
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
                      <div className="w-full max-w-xs rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 bg-[#1d1d1f] text-white flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-3 h-3 text-[#E8B27A]" /> Price
                            Offer
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              msg.offer.status === "ACCEPTED"
                                ? "bg-emerald-500 text-white"
                                : msg.offer.status === "PENDING"
                                ? "bg-amber-400 text-[#1d1d1f]"
                                : "bg-white/20 text-white"
                            }`}
                          >
                            {msg.offer.status}
                          </span>
                        </div>

                        <div className="p-4 space-y-2.5">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-[#86868b]">
                                Offered Price
                              </p>
                              <p className="text-2xl font-black text-[#1d1d1f]">
                                ₹{msg.offer.amount}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase text-[#86868b]">
                                Listed Price
                              </p>
                              <p className="text-sm font-bold text-[#86868b] line-through">
                                ₹{msg.offer.listPrice}
                              </p>
                            </div>
                          </div>

                          {msg.offer.note && (
                            <p className="text-xs text-[#1d1d1f]/80 bg-[#f5f5f7] rounded-xl p-2.5 italic">
                              “{msg.offer.note}”
                            </p>
                          )}

                          <p className="text-[10px] text-[#86868b] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
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
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={busyOfferId === msg.offer.id}
                                  onClick={() =>
                                    handleOfferDecision(
                                      msg.offer!.id,
                                      "ACCEPTED"
                                    )
                                  }
                                  className="py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                  Accept
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
                                  className="py-2 rounded-full bg-[#f5f5f7] hover:bg-red-50 hover:text-red-600 text-[#1d1d1f] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Decline
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
                                className="w-full py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-xs font-bold text-[#1d1d1f] cursor-pointer"
                              >
                                Withdraw Offer
                              </button>
                            )}

                          {msg.offer.status === "ACCEPTED" &&
                            msg.offer.buyerId === session?.user?.id && (
                              <Link
                                href={`/checkout/${msg.offer.bookId}`}
                                className="block w-full py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold text-center"
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
                        className={`max-w-[78%] flex flex-col gap-1 ${
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
                            className={`text-left px-3 py-1.5 rounded-xl text-[11px] border-l-2 border-[#0066cc] bg-[#f5f5f7] text-[#1d1d1f]/80 max-w-full truncate cursor-pointer`}
                          >
                            <span className="font-bold text-[#0066cc] mr-1">
                              {msg.replyTo.senderName}:
                            </span>
                            {msg.replyTo.content || "Attachment"}
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          {/* Hover Actions (Left side for own messages) */}
                          {isMine && !isDeleted && !msg.id.startsWith("temp-") && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white border border-black/10 rounded-full px-1.5 py-0.5 shadow-sm transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveReactionMsgId(
                                    activeReactionMsgId === msg.id
                                      ? null
                                      : msg.id
                                  )
                                }
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
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
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
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
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
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
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
                                title="Copy"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 text-[#86868b] hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Bubble Content */}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap break-words ${
                              isDeleted
                                ? "bg-[#f5f5f7] text-[#86868b] italic border border-black/5"
                                : isMine
                                ? "bg-[#0066cc] text-white rounded-br-sm"
                                : "bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-sm"
                            }`}
                          >
                            {/* Attachments inside bubble */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="space-y-2 mb-2">
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
                                          ? "bg-white/15 border-white/20 text-white"
                                          : "bg-white border-black/10 text-[#1d1d1f]"
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <div className="min-w-0 flex-1 text-left">
                                        <p className="text-xs font-bold truncate">
                                          {att.fileName}
                                        </p>
                                        <p className="text-[10px] opacity-75">
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
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white border border-black/10 rounded-full px-1.5 py-0.5 shadow-sm transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveReactionMsgId(
                                    activeReactionMsgId === msg.id
                                      ? null
                                      : msg.id
                                  )
                                }
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
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
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
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
                                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
                                title="Copy"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Quick Reaction Picker Popover */}
                        {activeReactionMsgId === msg.id && (
                          <div className="flex items-center gap-1 bg-white border border-black/10 rounded-full px-2.5 py-1 shadow-md z-20">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  handleToggleReaction(msg.id, emoji)
                                }
                                className="hover:scale-125 transition-transform text-sm px-1 cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Existing Reactions Pills */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 px-1">
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
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                                    iReacted
                                      ? "bg-[#0066cc]/10 border-[#0066cc]/40 text-[#0066cc]"
                                      : "bg-[#f5f5f7] border-black/5 text-[#1d1d1f]"
                                  }`}
                                >
                                  <span>{r.emoji}</span>
                                  <span>{r.userIds.length}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Timestamp + Edited + Sent/Delivered/Read Receipt */}
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[10px] font-medium text-[#86868b]">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                          {msg.editedAt && !isDeleted && (
                            <span className="text-[10px] italic text-[#86868b]">
                              · edited
                            </span>
                          )}
                          {isMine && !isDeleted && (
                            <span
                              className="inline-flex items-center text-[10px] font-semibold"
                              title={
                                deliveryState === "read"
                                  ? "Read"
                                  : deliveryState === "delivered"
                                  ? "Delivered"
                                  : "Sent"
                              }
                            >
                              {deliveryState === "read" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#0066cc]" />
                              ) : deliveryState === "delivered" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#86868b]" />
                              ) : (
                                <Check className="w-3 h-3 text-[#86868b]" />
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
            <div className="flex items-center gap-2 text-xs text-[#86868b] font-medium pl-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-bounce [animation-delay:300ms]" />
              </span>
              {otherTypingName} is typing...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* MESSAGE COMPOSER */}
        <div className="p-3 border-t border-black/5 bg-white shrink-0 space-y-2 relative">
          {/* Reply or Edit Banner */}
          {(replyTarget || editingMessage) && (
            <div className="px-3 py-1.5 rounded-xl bg-[#f5f5f7] flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="font-bold text-[#0066cc] mr-1.5">
                  {editingMessage
                    ? "Editing message"
                    : `Replying to ${replyTarget?.sender.name}`}
                </span>
                <span className="text-[#86868b] truncate">
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
                className="p-1 text-[#86868b] hover:text-[#1d1d1f]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending Attachments Preview Strip */}
          {pendingAttachments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group rounded-xl bg-[#f5f5f7] border border-black/10 p-1.5 flex items-center gap-2 shrink-0"
                >
                  {att.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.url}
                      alt={att.fileName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-[#0066cc]" />
                  )}
                  <span className="text-[11px] font-semibold text-[#1d1d1f] max-w-[100px] truncate">
                    {att.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAttachments((prev) =>
                        prev.filter((x) => x.id !== att.id)
                      )
                    }
                    className="p-0.5 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 w-72 bg-white rounded-2xl shadow-xl border border-black/10 p-3 z-30 space-y-2">
              <div className="flex items-center justify-between border-b border-black/5 pb-1.5">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveEmojiCat(cat.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                        activeEmojiCat === cat.id
                          ? "bg-[#1d1d1f] text-white"
                          : "text-[#86868b] hover:text-[#1d1d1f]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 text-[#86868b]"
                >
                  <X className="w-3.5 h-3.5" />
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
                    className="p-1 text-base hover:bg-[#f5f5f7] rounded-lg cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Blocked state vs Active Composer */}
          {convMeta?.block?.isBlocked ? (
            <div className="p-3 rounded-2xl bg-[#f5f5f7] text-center flex items-center justify-between gap-2 text-xs font-semibold text-[#86868b]">
              <span>
                {convMeta.block.blockedByMe
                  ? `You have blocked ${otherUser?.name || "this user"}.`
                  : "You cannot reply to this conversation."}
              </span>
              {convMeta.block.blockedByMe && (
                <button
                  type="button"
                  onClick={handleBlockToggle}
                  className="px-3 py-1 rounded-full bg-[#1d1d1f] text-white text-xs font-bold cursor-pointer"
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
              className="flex items-end gap-2"
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
                className="w-10 h-10 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40"
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
                className="w-10 h-10 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
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
                placeholder={`Message ${otherUser?.name || "reader"}...`}
                className="flex-1 max-h-32 bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] rounded-2xl px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#86868b] font-medium resize-none"
              />

              <button
                type="submit"
                disabled={
                  sending ||
                  uploadingFile ||
                  (!newMessage.trim() && pendingAttachments.length === 0)
                }
                className="w-10 h-10 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
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
        <div className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl border border-black/5 shadow-sm flex-col overflow-hidden">
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
              className="fixed inset-0 bg-black/40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-80 max-w-[88vw] bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <span className="font-bold text-sm text-[#1d1d1f]">
                  Conversation Details
                </span>
                <button
                  type="button"
                  onClick={() => setMobileInfoDrawer(false)}
                  className="p-1.5 rounded-full bg-[#f5f5f7]"
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
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-black/5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#1d1d1f] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" /> Report{" "}
                {otherUser?.name || "User"}
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 text-[#86868b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#f5f5f7] text-xs font-semibold text-[#1d1d1f] cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reportReason === r.value}
                      onChange={() => setReportReason(r.value)}
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
                className="w-full rounded-xl bg-[#f5f5f7] p-3 text-xs font-medium text-[#1d1d1f] outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-bold text-[#1d1d1f]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
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
