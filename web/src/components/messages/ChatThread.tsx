"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import {
  Send,
  Loader2,
  ArrowLeft,
  User,
  MapPin,
  BookOpen,
  Award,
  Quote,
  ExternalLink,
  Sparkles,
  X,
  Check,
  CheckCheck,
  Trash2,
  Search,
  MessageSquare,
  Handshake,
  Star,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { getPusherClient } from "@/lib/pusher"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface MessageData {
  id: string
  content: string
  createdAt: string
  read?: boolean
  sender: { id: string; name: string | null; image: string | null }
}

interface OtherUserBook {
  id: string
  title: string
  author: string
  price: number
  condition: string
  deliveryType: string
  acceptsExchange: boolean
  images: string[]
}

interface OtherUser {
  id: string
  name: string | null
  image: string | null
  bio?: string | null
  location?: string | null
  favoriteQuote?: string | null
  quoteAuthor?: string | null
  isShantiModeActive: boolean
  liveStatus: string | null
  sellerRating?: number
  responseTime?: string | null
  booksCount?: number
  badgesCount?: number
  books?: OtherUserBook[]
}

interface SidebarConversation {
  otherUser: {
    id: string
    name: string | null
    image: string | null
    location?: string | null
    isShantiModeActive?: boolean
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    isMine: boolean
    read: boolean
  }
  unreadCount: number
}

export interface ChatContextBanner {
  badge: string
  title: string
  prefillMessage: string
  bookId?: string
  orderId?: string
}

const ICEBREAKERS = [
  "Hi! I saw your profile on AksharSetu and wanted to connect.",
  "Are any of your listed books available for a local handoff or swap?",
  "Loved the literary quote on your profile! What are you reading right now?",
]

export function ChatThread({
  userId,
  contextBanner = null,
}: {
  userId: string
  contextBanner?: ChatContextBanner | null
}) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<MessageData[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [sidebarConvos, setSidebarConvos] = useState<SidebarConversation[]>([])
  const [sidebarSearch, setSidebarSearch] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [activeContext, setActiveContext] = useState<ChatContextBanner | null>(
    contextBanner
  )
  const [showBookshelf, setShowBookshelf] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef<number>(0)

  const fetchSidebar = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setSidebarConvos(data)
    } catch {}
  }, [])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${userId}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.otherUser) setOtherUser(data.otherUser)
      if (Array.isArray(data.messages)) {
        setMessages((prev) => {
          const tempMessages = prev.filter((m) => m.id.startsWith("temp-"))
          const serverIds = new Set(data.messages.map((m: MessageData) => m.id))
          const remainingTemps = tempMessages.filter(
            (t) =>
              !data.messages.some(
                (sm: MessageData) =>
                  sm.content === t.content && sm.sender.id === t.sender.id
              ) && !serverIds.has(t.id)
          )
          return [...data.messages, ...remainingTemps]
        })
      }
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchMessages()
    fetchSidebar()

    const pollInterval = setInterval(() => {
      fetchMessages()
      fetchSidebar()
    }, 3500)

    if (!session?.user?.id) {
      return () => clearInterval(pollInterval)
    }

    let channelId = ""
    try {
      if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
        const pusher = getPusherClient()
        channelId = `chat-dm-${[session.user.id, userId].sort().join("-")}`
        const channel = pusher.subscribe(channelId)

        channel.bind("new-message", (message: MessageData) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev
            return [
              ...prev.filter(
                (m) =>
                  !(m.id.startsWith("temp-") && m.content === message.content)
              ),
              message,
            ]
          })
          fetchSidebar()
        })

        channel.bind("messages-read", () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.sender.id === session.user?.id ? { ...m, read: true } : m
            )
          )
        })

        channel.bind("message-deleted", (payload: { messageId: string }) => {
          setMessages((prev) =>
            prev.filter((m) => m.id !== payload.messageId)
          )
        })
      }
    } catch {}

    return () => {
      clearInterval(pollInterval)
      try {
        if (channelId && process.env.NEXT_PUBLIC_PUSHER_KEY) {
          getPusherClient().unsubscribe(channelId)
        }
      } catch {}
    }
  }, [userId, session?.user?.id, fetchMessages, fetchSidebar])

  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const sendMessageContent = async (textToSend: string) => {
    if (!textToSend.trim() || sending || !session?.user?.id) return

    setSending(true)

    const optimisticMessage: MessageData = {
      id: "temp-" + Date.now(),
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      sender: {
        id: session.user.id,
        name: session.user.name || "You",
        image: session.user.image || null,
      },
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage("")

    try {
      const res = await fetch(`/api/conversations/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: optimisticMessage.content,
          orderId: activeContext?.orderId,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to send message")
      }

      const savedMsg: MessageData = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? savedMsg : m))
      )
      fetchSidebar()
    } catch (error) {
      console.error(error)
      toast.error("Failed to send message. Please try again.")
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      )
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (deletingId) return
    setDeletingId(messageId)
    try {
      const res = await fetch(
        `/api/conversations/${userId}?messageId=${encodeURIComponent(messageId)}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Could not unsend")
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      fetchSidebar()
      toast.success("Message unsent")
    } catch {
      toast.error("Could not unsend message")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessageContent(newMessage)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessageContent(newMessage)
    }
  }

  const filteredSidebar = sidebarConvos.filter((c) => {
    if (!sidebarSearch.trim()) return true
    const q = sidebarSearch.toLowerCase()
    return (
      (c.otherUser.name || "").toLowerCase().includes(q) ||
      c.lastMessage.content.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1d1d1f]/30" />
      </div>
    )
  }

  const userBooks = otherUser?.books || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-6.75rem)]">
      {/* Left Desktop Split-Pane: Active Conversations */}
      <div className="hidden lg:flex lg:col-span-4 bg-white rounded-2xl border border-black/5 shadow-sm flex-col overflow-hidden">
        <div className="p-4 border-b border-black/5 space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href="/messages"
              className="flex items-center gap-2 text-sm font-black text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#0066cc]" />
              Inbox ({sidebarConvos.length})
            </Link>
            <Link
              href="/messages?tab=discover"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[11px] font-bold text-[#1d1d1f] transition-colors"
            >
              <Plus className="w-3 h-3 text-[#0066cc]" /> New Chat
            </Link>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Filter conversations..."
              className="w-full h-9 pl-9 pr-3 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:bg-white focus:ring-2 focus:ring-[#0066cc]/20 border border-transparent focus:border-[#0066cc]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-black/5">
          {filteredSidebar.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-semibold text-[#86868b]">
                No conversations yet.
              </p>
              <Link
                href="/messages?tab=discover"
                className="inline-block mt-3 text-xs font-bold text-[#0066cc] hover:underline"
              >
                Discover Readers &rarr;
              </Link>
            </div>
          ) : (
            filteredSidebar.map((conv) => {
              const isSelected = conv.otherUser.id === userId
              return (
                <Link
                  key={conv.otherUser.id}
                  href={`/messages/${conv.otherUser.id}`}
                  className={`flex items-center gap-3 p-3.5 transition-colors ${
                    isSelected
                      ? "bg-[#0066cc]/8 border-l-4 border-[#0066cc]"
                      : "hover:bg-[#f5f5f7]/80"
                  }`}
                >
                  <div className="relative w-11 h-11 rounded-full bg-[#1d1d1f] flex items-center justify-center shrink-0 overflow-hidden">
                    {conv.otherUser.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conv.otherUser.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {(conv.otherUser.name || "R").charAt(0).toUpperCase()}
                      </span>
                    )}
                    {conv.otherUser.isShantiModeActive && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-[#1d1d1f] truncate">
                        {conv.otherUser.name || "Reader"}
                      </span>
                      <span className="text-[10px] font-medium text-[#86868b] shrink-0">
                        {formatDistanceToNow(
                          new Date(conv.lastMessage.createdAt),
                          { addSuffix: false }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={`text-xs truncate ${
                          conv.unreadCount > 0
                            ? "font-bold text-[#1d1d1f]"
                            : "font-medium text-[#86868b]"
                        }`}
                      >
                        {conv.lastMessage.isMine ? "You: " : ""}
                        {conv.lastMessage.content}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#0066cc] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Right Main Chat Pane */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-black/5 shadow-sm p-4 md:p-6 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-black/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/messages"
              className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e8e8ed] transition-colors shrink-0"
              title="All Messages"
            >
              <ArrowLeft className="w-4 h-4 text-[#1d1d1f]" />
            </Link>

            <Link
              href={`/profile/${userId}`}
              className="relative w-11 h-11 rounded-full bg-[#1d1d1f] flex items-center justify-center shrink-0 overflow-hidden"
            >
              {otherUser?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={otherUser.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-base">
                  {(otherUser?.name || "R").charAt(0).toUpperCase()}
                </span>
              )}
              {otherUser?.isShantiModeActive && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/profile/${userId}`}
                  className="font-bold text-base md:text-lg text-[#1d1d1f] hover:text-[#0066cc] transition-colors truncate"
                >
                  {otherUser?.name || "Reader"}
                </Link>
                {otherUser?.sellerRating !== undefined && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    {Number(otherUser.sellerRating).toFixed(1)}
                  </span>
                )}
                {otherUser?.location && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#86868b]">
                    <MapPin className="w-3 h-3 text-[#0066cc]" />
                    {otherUser.location}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] font-medium text-[#86868b] mt-0.5">
                {otherUser?.booksCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#0066cc]" />{" "}
                    {otherUser.booksCount} listed
                  </span>
                )}
                {otherUser?.badgesCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#0066cc]" />{" "}
                    {otherUser.badgesCount} badges
                  </span>
                )}
                {(otherUser?.isShantiModeActive || otherUser?.liveStatus) && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {otherUser.liveStatus || "In Shanti Mode"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {userBooks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBookshelf((prev) => !prev)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showBookshelf
                    ? "bg-[#0066cc] text-white"
                    : "bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shelf</span> (
                {userBooks.length})
              </button>
            )}
            <Link
              href={`/profile/${userId}`}
              className="px-3.5 py-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <span className="hidden sm:inline">Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Collapsible Recipient Bookshelf Drawer */}
        <AnimatePresence>
          {showBookshelf && userBooks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-black/5 shrink-0"
            >
              <div className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                    {otherUser?.name || "Reader"}&apos;s Available Books — Click to
                    Inquire
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBookshelf(false)}
                    className="text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {userBooks.map((b) => {
                    const priceLabel =
                      b.price === 0
                        ? b.acceptsExchange
                          ? "Swap"
                          : "Free"
                        : `₹${b.price}`
                    return (
                      <div
                        key={b.id}
                        className="min-w-[220px] max-w-[240px] p-2.5 rounded-2xl bg-[#f5f5f7] border border-black/5 flex items-center justify-between gap-2.5 shrink-0"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/catalog/${b.id}`}
                            className="font-bold text-xs text-[#1d1d1f] hover:text-[#0066cc] truncate block"
                          >
                            {b.title}
                          </Link>
                          <p className="text-[10px] font-semibold text-[#86868b] truncate">
                            {priceLabel} · {b.condition.replace("_", " ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sendMessageContent(
                              `Hi! Is your copy of "${b.title}" (${priceLabel}) still available?`
                            )
                            setShowBookshelf(false)
                          }}
                          className="px-2.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                        >
                          Ask
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipient Signature Quote Context Bar */}
        {otherUser?.favoriteQuote && (
          <div className="mt-2.5 px-3.5 py-2 rounded-2xl bg-[#f5f5f7] border border-black/5 flex items-center gap-2 text-xs text-[#1d1d1f]/80 shrink-0">
            <Quote className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
            <span className="italic font-medium truncate">
              “{otherUser.favoriteQuote}”
            </span>
            {otherUser.quoteAuthor && (
              <span className="font-semibold text-[#86868b] shrink-0">
                — {otherUser.quoteAuthor}
              </span>
            )}
          </div>
        )}

        {/* Smart Action Context Banner (Fulfill Request / Swap Proposal / Book Inquiry / Order) */}
        {activeContext && (
          <div className="mt-2.5 p-3 rounded-2xl bg-[#0066cc]/8 border border-[#0066cc]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">
                <Sparkles className="w-3 h-3" /> {activeContext.badge}
              </span>
              <p className="text-xs font-bold text-[#1d1d1f] truncate mt-0.5">
                {activeContext.title}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sendMessageContent(activeContext.prefillMessage)
                  setActiveContext(null)
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold transition cursor-pointer"
              >
                Send Message
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewMessage(activeContext.prefillMessage)
                  setActiveContext(null)
                }}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold border border-black/10 transition cursor-pointer"
              >
                Edit First
              </button>
              <button
                type="button"
                onClick={() => setActiveContext(null)}
                className="p-1 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-3">
                <User className="w-5 h-5 text-[#86868b]" />
              </div>
              <p className="text-[#1d1d1f] font-bold text-base mb-1">
                Start a conversation with {otherUser?.name || "this reader"}
              </p>
              <p className="text-[#86868b] font-medium text-xs max-w-sm mb-5">
                Discuss book handoffs, campus exchanges, or shared reading
                recommendations.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-md">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                  1-Click Conversation Starters
                </span>
                {ICEBREAKERS.map((icebreaker, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessageContent(icebreaker)}
                    className="text-left text-xs font-semibold px-4 py-2.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#0066cc] hover:text-white text-[#1d1d1f] transition-colors cursor-pointer"
                  >
                    “{icebreaker}”
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMine = msg.sender.id === session?.user?.id
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex group ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[78%] flex flex-col gap-1 ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isMine && !msg.id.startsWith("temp-") && (
                          <button
                            type="button"
                            disabled={deletingId === msg.id}
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Unsend message"
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-[#86868b] hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap break-words ${
                            isMine
                              ? "bg-[#0066cc] text-white rounded-br-sm"
                              : "bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-1.5">
                        <span className="text-[10px] font-medium text-[#86868b]">
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {isMine && (
                          <span
                            className="inline-flex items-center text-[10px] font-semibold"
                            title={msg.read ? "Read" : "Sent"}
                          >
                            {msg.read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#0066cc]" />
                            ) : (
                              <Check className="w-3 h-3 text-[#86868b]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Handoff Action Chips + Input Bar */}
        <div className="pt-3 border-t border-black/5 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() =>
                setNewMessage(
                  `Let's coordinate a meetup handoff${
                    otherUser?.location ? ` around ${otherUser.location}` : ""
                  }! What day and time works best for you?`
                )
              }
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[11px] font-semibold text-[#1d1d1f] whitespace-nowrap transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-[#0066cc]" /> Propose Meetup
            </button>
            <button
              type="button"
              onClick={() =>
                setNewMessage(
                  "Would you be open to a 1-for-1 book swap? Feel free to check my profile shelf!"
                )
              }
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[11px] font-semibold text-[#1d1d1f] whitespace-nowrap transition-colors cursor-pointer"
            >
              <Handshake className="w-3 h-3 text-[#0066cc]" /> Propose Swap
            </button>
            {userBooks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBookshelf((prev) => !prev)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[11px] font-semibold text-[#1d1d1f] whitespace-nowrap transition-colors cursor-pointer"
              >
                <BookOpen className="w-3 h-3 text-[#0066cc]" /> Browse{" "}
                {otherUser?.name?.split(" ")[0] || "Reader"}&apos;s Books (
                {userBooks.length})
              </button>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2.5">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser?.name || "reader"}...`}
              className="flex-1 bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] rounded-full px-5 py-3 text-sm outline-none transition-all placeholder:text-[#86868b] font-medium"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="w-11 h-11 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
