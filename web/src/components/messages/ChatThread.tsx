"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Send, Loader2, ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import { getPusherClient } from "@/lib/pusher"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

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
  isShantiModeActive: boolean
  liveStatus: string | null
}

export function ChatThread({ userId }: { userId: string }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<MessageData[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/conversations/${userId}`)
      const data = await res.json()
      setMessages(data.messages || [])
      setOtherUser(data.otherUser || null)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    
    if (!session?.user?.id) return;

    const pusher = getPusherClient()
    const channelId = `chat-dm-${[session.user.id, userId].sort().join('-')}`
    const channel = pusher.subscribe(channelId)

    channel.bind('new-message', (message: MessageData) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev
        // Filter out the optimistic message matching this content
        return [...prev.filter(m => !(m.id.startsWith("temp-") && m.content === message.content)), message]
      })
    })

    return () => {
      pusher.unsubscribe(channelId)
    }
  }, [userId, session?.user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !session?.user?.id) return

    setSending(true)
    
    const optimisticMessage = {
      id: "temp-" + Date.now(),
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      sender: { id: session.user.id, name: session.user.name || "You", image: session.user.image || null }
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
    } catch (error) {
      console.error(error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-[#1D1D1F]/5">
        <Link href="/messages" className="w-10 h-10 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center hover:bg-[#1D1D1F]/10 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-[#1D1D1F]" />
        </Link>

        <div className="w-12 h-12 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center shrink-0 overflow-hidden">
          {otherUser?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-[#1D1D1F]/30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link href={`/user/${userId}`} className="font-black text-lg text-[#1D1D1F] hover:text-[#0066cc] transition-colors truncate block">
            {otherUser?.name || "Unknown User"}
          </Link>
          {otherUser?.isShantiModeActive && otherUser?.liveStatus && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
              </span>
              <p className="text-xs font-bold text-[#1D1D1F]/50 truncate">{otherUser.liveStatus}</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#1D1D1F]/30 font-medium text-sm">Send a message to start the conversation!</p>
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
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-5 py-3 rounded-[20px] text-sm font-medium leading-relaxed ${
                        isMine
                          ? "bg-[#0066cc] text-white rounded-br-md"
                          : "bg-[#1D1D1F]/5 text-[#1D1D1F] rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] font-medium text-[#1D1D1F]/30 px-2">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
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
      <form onSubmit={handleSend} className="pt-4 border-t border-[#1D1D1F]/5">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#F2EBE1] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1D1D1F] rounded-full px-6 py-4 text-sm outline-none transition-all placeholder:text-[#1D1D1F]/30 font-medium"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-12 h-12 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  )
}
