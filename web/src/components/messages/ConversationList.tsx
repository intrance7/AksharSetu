"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  MessageSquare,
  Loader2,
  User,
  Search,
  MapPin,
  Sparkles,
  BookOpen,
  Quote,
  ArrowUpRight,
  Users,
} from "lucide-react"
import { motion } from "framer-motion"

interface Conversation {
  otherUser: {
    id: string
    name: string | null
    image: string | null
    location?: string | null
    isShantiModeActive?: boolean
    liveStatus?: string | null
  }
  lastMessage: { content: string; createdAt: string; isMine: boolean }
  messageCount?: number
}

interface ReaderProfile {
  id: string
  name: string
  image: string | null
  bio: string | null
  favoriteQuote: string | null
  quoteAuthor: string | null
  location: string | null
  liveStatus: string | null
  isShantiModeActive: boolean
  stats: {
    level: number
    totalXP: number
    rankTitle: string
    booksListed: number
    booksDonated: number
  }
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [readers, setReaders] = useState<ReaderProfile[]>([])
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingReaders, setLoadingReaders] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"chats" | "discover">("chats")

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data)
        setLoadingConvos(false)
      })
      .catch(() => setLoadingConvos(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingReaders(true)
      fetch(
        `/api/users?excludeSelf=true&limit=24&q=${encodeURIComponent(
          searchQuery.trim()
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setReaders(data)
          setLoadingReaders(false)
        })
        .catch(() => setLoadingReaders(false))
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.otherUser.name || "").toLowerCase().includes(q) ||
      (c.otherUser.location || "").toLowerCase().includes(q) ||
      c.lastMessage.content.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Top Search & Mode Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value.trim() && activeTab === "chats" && conversations.length === 0) {
                setActiveTab("discover")
              }
            }}
            placeholder="Search readers by name, city, bio, or favorite quote..."
            className="w-full h-11 pl-11 pr-4 rounded-full bg-[#F5F5F7] text-sm font-medium text-[#1D1D1F] placeholder:text-[#86868b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] border border-transparent transition-all"
          />
        </div>

        <div className="flex items-center bg-[#F5F5F7] p-1 rounded-full shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("chats")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "chats"
                ? "bg-[#1D1D1F] text-white shadow-sm"
                : "text-[#86868b] hover:text-[#1D1D1F]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Conversations
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/15">
              {conversations.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("discover")}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "discover"
                ? "bg-[#0066cc] text-white shadow-sm"
                : "text-[#86868b] hover:text-[#1D1D1F]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Find Profiles
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10">
              {readers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Active Conversations */}
      {activeTab === "chats" && (
        <div className="flex flex-col gap-6">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#1D1D1F]/5 shadow-sm p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-[#86868b]" />
              </div>
              <h2 className="text-xl font-black text-[#1D1D1F] mb-2">
                {searchQuery ? "No matching conversations" : "No conversations yet"}
              </h2>
              <p className="text-[#86868b] font-medium text-sm max-w-md mx-auto mb-6">
                Discover fellow readers below or switch to &ldquo;Find Profiles&rdquo; to start a conversation!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
                className="inline-flex items-center gap-2 bg-[#0066cc] hover:bg-[#0071e3] text-white px-6 py-3 rounded-full font-bold text-xs transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" /> Explore Reader Profiles
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredConversations.map((conv, i) => (
                <motion.div
                  key={conv.otherUser.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                >
                  <div className="flex items-center gap-4 bg-white hover:bg-[#FAF6F0] rounded-2xl p-4 md:p-5 border border-[#1D1D1F]/5 shadow-sm transition-all hover:shadow-md">
                    {/* Avatar */}
                    <Link
                      href={`/profile/${conv.otherUser.id}`}
                      className="relative w-14 h-14 rounded-full bg-[#1D1D1F] flex items-center justify-center shrink-0 overflow-hidden hover:opacity-90 transition-opacity"
                      title="View Profile"
                    >
                      {conv.otherUser.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conv.otherUser.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-black text-lg">
                          {(conv.otherUser.name || "R").charAt(0).toUpperCase()}
                        </span>
                      )}
                      {conv.otherUser.isShantiModeActive && (
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                      )}
                    </Link>

                    {/* Content */}
                    <Link
                      href={`/messages/${conv.otherUser.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-bold text-[#1D1D1F] text-base truncate">
                            {conv.otherUser.name || "Reader"}
                          </h3>
                          {conv.otherUser.location && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#86868b]">
                              <MapPin className="w-3 h-3 text-[#C84200]" />
                              {conv.otherUser.location}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-[#86868b] shrink-0 ml-3">
                          {formatDistanceToNow(
                            new Date(conv.lastMessage.createdAt),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-[#1D1D1F]/70 font-medium truncate">
                        {conv.lastMessage.isMine && (
                          <span className="text-[#86868b] font-semibold">
                            You:{" "}
                          </span>
                        )}
                        {conv.lastMessage.content}
                      </p>
                    </Link>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/profile/${conv.otherUser.id}`}
                        className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#F5F5F7] hover:bg-[#e8e8ed] text-xs font-bold text-[#1D1D1F] transition-colors"
                      >
                        Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/messages/${conv.otherUser.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-xs font-bold text-white transition-colors"
                      >
                        Chat
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Always show Reader Discovery in "discover" tab OR below empty/short chat lists */}
      {(activeTab === "discover" || conversations.length < 5 || searchQuery.trim() !== "") && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#1D1D1F] tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C84200]" />
                {searchQuery.trim()
                  ? `Matching Reader Profiles (${readers.length})`
                  : "Discover Community Readers"}
              </h2>
              <p className="text-xs font-medium text-[#86868b]">
                Find profiles, explore their book collections & quotes, and chat directly.
              </p>
            </div>
            <Link
              href="/leaderboard?tab=directory"
              className="text-xs font-bold text-[#0066cc] hover:underline flex items-center gap-1"
            >
              View Full Leaderboard & Directory &rarr;
            </Link>
          </div>

          {loadingReaders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
            </div>
          ) : readers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-black/5">
              <p className="text-sm font-medium text-[#86868b]">
                No reader profiles matched &ldquo;{searchQuery}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readers.map((reader) => (
                <div
                  key={reader.id}
                  className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <Link
                      href={`/profile/${reader.id}`}
                      className="relative w-14 h-14 rounded-full bg-[#1D1D1F] overflow-hidden shrink-0 flex items-center justify-center"
                    >
                      {reader.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reader.image}
                          alt={reader.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-black text-xl">
                          {reader.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/profile/${reader.id}`}
                          className="font-black text-base text-[#1D1D1F] hover:text-[#0066cc] transition-colors truncate"
                        >
                          {reader.name}
                        </Link>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#C84200]/10 text-[#C84200] font-black text-[10px] uppercase tracking-wider">
                          LVL {reader.stats.level} • {reader.stats.rankTitle}
                        </span>
                      </div>

                      {reader.location && (
                        <p className="text-xs font-bold text-[#86868b] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#C84200]" />{" "}
                          {reader.location}
                        </p>
                      )}

                      <p className="text-xs font-medium text-[#1D1D1F]/70 line-clamp-2 mt-1.5">
                        {reader.bio || "Fellow book lover on AksharSetu."}
                      </p>

                      {reader.favoriteQuote && (
                        <p className="text-xs italic text-[#86868b] line-clamp-1 mt-2 flex items-center gap-1">
                          <Quote className="w-3 h-3 text-[#C84200] shrink-0" />
                          “{reader.favoriteQuote}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-black/5">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-[#86868b]">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#C84200]" />
                        {reader.stats.booksListed} listed
                      </span>
                      <span>•</span>
                      <span>{reader.stats.booksDonated} donated</span>
                      <span>•</span>
                      <span>{reader.stats.totalXP} XP</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${reader.id}`}
                        className="px-3.5 py-1.5 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1D1D1F] text-xs font-bold transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        href={`/messages/${reader.id}`}
                        className="px-4 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
