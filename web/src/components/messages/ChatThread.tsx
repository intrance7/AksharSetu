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
  sender: { id: string; name: string | null; image: string | null }
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
  booksCount?: number
  badgesCount?: number
}

const ICEBREAKERS = [
  "Hi! I saw your profile on AksharSetu and wanted to connect.",
  "Are any of your listed books available for a handoff or exchange?",
  "Loved the literary quote on your profile! What are you reading currently?",
]

export function ChatThread({ userId }: { userId: string }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<MessageData[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef<number>(0)

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

    // Background polling fallback so messages sync even without Pusher credentials
    const pollInterval = setInterval(fetchMessages, 4000)

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
        })
      }
    } catch {
      // Pusher not configured; polling handles real-time updates
    }

    return () => {
      clearInterval(pollInterval)
      try {
        if (channelId && process.env.NEXT_PUBLIC_PUSHER_KEY) {
          getPusherClient().unsubscribe(channelId)
        }
      } catch {}
    }
  }, [userId, session?.user?.id, fetchMessages])

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
        body: JSON.stringify({ content: optimisticMessage.content }),
      })

      if (!res.ok) {
        throw new Error("Failed to send message")
      }

      const savedMsg: MessageData = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? savedMsg : m))
      )
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessageContent(newMessage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 md:p-8 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-black/5">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/messages"
            className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center hover:bg-[#e8e8ed] transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#1D1D1F]" />
          </Link>

          <Link
            href={`/profile/${userId}`}
            className="w-12 h-12 rounded-full bg-[#1D1D1F] flex items-center justify-center shrink-0 overflow-hidden"
          >
            {otherUser?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={otherUser.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-black text-lg">
                {(otherUser?.name || "R").charAt(0).toUpperCase()}
              </span>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${userId}`}
                className="font-black text-lg text-[#1D1D1F] hover:text-[#0066cc] transition-colors truncate"
              >
                {otherUser?.name || "Reader"}
              </Link>
              {otherUser?.location && (
                <span className="text-xs font-bold text-[#86868b] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C84200]" />
                  {otherUser.location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold text-[#86868b] mt-0.5">
              {otherUser?.booksCount !== undefined && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#C84200]" />{" "}
                  {otherUser.booksCount} books
                </span>
              )}
              {otherUser?.badgesCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-[#C84200]" />{" "}
                  {otherUser.badgesCount} badges
                </span>
              )}
              {(otherUser?.isShantiModeActive || otherUser?.liveStatus) && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {otherUser.liveStatus || "In Shanti Mode"}
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/profile/${userId}`}
          className="px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-[#e8e8ed] text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5 shrink-0 transition-colors"
        >
          View Profile <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Recipient Signature Quote Context Bar */}
      {otherUser?.favoriteQuote && (
        <div className="mt-3 px-4 py-2.5 rounded-2xl bg-[#F5F5F7] border border-black/5 flex items-center gap-2 text-xs text-[#1D1D1F]/80">
          <Quote className="w-3.5 h-3.5 text-[#C84200] shrink-0" />
          <span className="italic font-medium truncate">
            “{otherUser.favoriteQuote}”
          </span>
          {otherUser.quoteAuthor && (
            <span className="font-bold text-[#86868b] shrink-0">
              — {otherUser.quoteAuthor}
            </span>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-3">
              <User className="w-5 h-5 text-[#86868b]" />
            </div>
            <p className="text-[#1D1D1F] font-bold text-base mb-1">
              Start a conversation with {otherUser?.name || "this reader"}
            </p>
            <p className="text-[#86868b] font-medium text-xs max-w-sm mb-6">
              Discuss book handoffs, exchanges, or shared reading recommendations.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-md">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#86868b]">
                Quick Conversation Starters
              </span>
              {ICEBREAKERS.map((icebreaker, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessageContent(icebreaker)}
                  className="text-left text-xs font-semibold px-4 py-2.5 rounded-2xl bg-[#F5F5F7] hover:bg-[#0066cc] hover:text-white text-[#1D1D1F] transition-colors cursor-pointer"
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
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] flex flex-col gap-1 ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                        isMine
                          ? "bg-[#0066cc] text-white rounded-br-sm"
                          : "bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] font-medium text-[#86868b] px-2">
                      {formatDistanceToNow(new Date(msg.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="pt-4 border-t border-black/5">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUser?.name || "reader"}...`}
            className="flex-1 bg-[#F5F5F7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1D1D1F] rounded-full px-6 py-3.5 text-sm outline-none transition-all placeholder:text-[#86868b] font-medium"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-12 h-12 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
