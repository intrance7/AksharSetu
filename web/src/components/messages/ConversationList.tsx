"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Loader2, User } from "lucide-react"
import { motion } from "framer-motion"

interface Conversation {
  otherUser: { id: string; name: string | null; image: string | null }
  lastMessage: { content: string; createdAt: string; isMine: boolean }
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setConversations(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#1D1D1F]/5 shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-7 h-7 text-[#1D1D1F]/30" />
        </div>
        <h2 className="text-xl font-black text-[#1D1D1F] mb-2">No conversations yet</h2>
        <p className="text-[#1D1D1F]/50 font-medium text-sm max-w-md mx-auto">
          Start by browsing the catalog and messaging a book seller to arrange a handoff!
        </p>
        <Link 
          href="/catalog"
          className="inline-flex mt-6 bg-[#0066cc] hover:bg-[#0071e3] text-white px-6 py-3 rounded-full font-bold text-sm transition-colors"
        >
          Browse Catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conv, i) => (
        <motion.div
          key={conv.otherUser.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Link
            href={`/messages/${conv.otherUser.id}`}
            className="flex items-center gap-4 bg-white hover:bg-[#F2EBE1] rounded-2xl p-5 border border-[#1D1D1F]/5 shadow-sm transition-all hover:shadow-md group"
          >
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center shrink-0 overflow-hidden">
              {conv.otherUser.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={conv.otherUser.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-[#1D1D1F]/30" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-[#1D1D1F] text-base truncate">{conv.otherUser.name || "Unknown User"}</h3>
                <span className="text-xs font-medium text-[#1D1D1F]/40 shrink-0 ml-3">
                  {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-[#1D1D1F]/60 font-medium truncate">
                {conv.lastMessage.isMine && <span className="text-[#1D1D1F]/40">You: </span>}
                {conv.lastMessage.content}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
