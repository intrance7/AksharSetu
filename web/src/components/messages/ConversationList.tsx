"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  MessageSquare,
  Loader2,
  Search,
  MapPin,
  Sparkles,
  BookOpen,
  Quote,
  ArrowUpRight,
  Users,
  Check,
  CheckCheck,
  Pin,
  Archive,
  BellOff,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import type { DeliveryState } from "@/lib/messaging/types"

interface ConversationItem {
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

type FilterId = "all" | "unread" | "buying" | "selling" | "archived"

export function ConversationList() {
  const searchParams = useSearchParams()
  const initialTab =
    searchParams.get("tab") === "discover" ? "discover" : "chats"

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [readers, setReaders] = useState<ReaderProfile[]>([])
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingReaders, setLoadingReaders] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"chats" | "discover">(initialTab)
  const [activeFilter, setActiveFilter] = useState<FilterId>("all")

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeFilter !== "all") params.set("filter", activeFilter)
      if (searchQuery.trim()) params.set("q", searchQuery.trim())
      const res = await fetch(`/api/conversations?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) setConversations(data)
    } catch {
      // ignore transient errors
    } finally {
      setLoadingConvos(false)
    }
  }, [activeFilter, searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations()
    }, 150)
    const interval = setInterval(loadConversations, 5000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [loadConversations])

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

  const toggleConversationSetting = async (
    convId: string,
    patch: { isPinned?: boolean; isArchived?: boolean }
  ) => {
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings", ...patch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      loadConversations()
      if (patch.isPinned !== undefined) {
        toast.success(patch.isPinned ? "Pinned to top" : "Unpinned")
      }
      if (patch.isArchived !== undefined) {
        toast.success(
          patch.isArchived ? "Archived conversation" : "Restored to inbox"
        )
      }
    } catch (err: any) {
      toast.error(err.message || "Could not update conversation")
    }
  }

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Top Search & Mode Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations, @usernames, books, or reader profiles..."
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
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#0066cc] text-white">
                  {totalUnread} new
                </span>
              )}
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
              New Message / Profiles
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10">
                {readers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Chips: All | Unread | Buying | Selling | Archived */}
        {activeTab === "chats" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            {(
              [
                { id: "all", label: "All Conversations" },
                { id: "unread", label: "Unread" },
                { id: "buying", label: "Buying" },
                { id: "selling", label: "Selling" },
                { id: "archived", label: "Archived" },
              ] as { id: FilterId; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#0066cc] text-white"
                    : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Active Conversations */}
      {activeTab === "chats" && (
        <div className="flex flex-col gap-4">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#1D1D1F]/5 shadow-sm p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F7] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-[#86868b]" />
              </div>
              <h2 className="text-xl font-black text-[#1D1D1F] mb-2">
                {searchQuery
                  ? "No matching conversations"
                  : activeFilter !== "all"
                  ? `No ${activeFilter} conversations`
                  : "No conversations yet"}
              </h2>
              <p className="text-[#86868b] font-medium text-sm max-w-md mx-auto mb-6">
                Message any seller from a book listing or connect with fellow
                readers below.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
                className="inline-flex items-center gap-2 bg-[#0066cc] hover:bg-[#0071e3] text-white px-6 py-3 rounded-full font-bold text-xs transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" /> Start a New Message
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {conversations.map((conv, i) => {
                const hasUnread = (conv.unreadCount || 0) > 0
                const chatHref = `/messages/${conv.otherUser.id}${
                  conv.book ? `?book=${conv.book.id}` : ""
                }`

                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.2 }}
                  >
                    <div
                      className={`flex items-center gap-4 bg-white hover:bg-[#FAF6F0] rounded-2xl p-4 md:p-5 border shadow-sm transition-all hover:shadow-md ${
                        hasUnread
                          ? "border-[#0066cc]/40 ring-1 ring-[#0066cc]/15"
                          : "border-[#1D1D1F]/5"
                      }`}
                    >
                      {/* Avatar + Online Indicator */}
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
                            {(conv.otherUser.name || "R")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                        {conv.otherUser.online && (
                          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </Link>

                      {/* Main Content */}
                      <Link href={chatHref} className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            {conv.isPinned && (
                              <Pin className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                            )}
                            <h3 className="font-bold text-[#1D1D1F] text-base truncate">
                              {conv.otherUser.name}
                            </h3>
                            <span className="text-xs font-medium text-[#86868b] hidden sm:inline">
                              @{conv.otherUser.username}
                            </span>
                            {conv.isMuted && (
                              <BellOff className="w-3 h-3 text-[#86868b]" />
                            )}
                            {hasUnread && (
                              <span className="px-2 py-0.5 rounded-full bg-[#0066cc] text-white text-[10px] font-bold shrink-0">
                                {conv.unreadCount} new
                              </span>
                            )}
                            {conv.role !== "MEMBER" && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  conv.role === "BUYER"
                                    ? "bg-[#0066cc]/10 text-[#0066cc]"
                                    : "bg-amber-50 text-amber-800"
                                }`}
                              >
                                {conv.role === "BUYER" ? "Buying" : "Selling"}
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

                        {conv.book && (
                          <p className="text-xs font-bold text-[#0066cc] truncate mb-0.5">
                            📚 {conv.book.title} ·{" "}
                            {conv.book.price === 0
                              ? "Free / Swap"
                              : `₹${conv.book.price}`}{" "}
                            ({conv.book.status})
                          </p>
                        )}

                        <div className="flex items-center gap-1.5">
                          {conv.lastMessage.isMine && (
                            <span className="inline-flex items-center shrink-0">
                              {conv.lastMessage.state === "read" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#0066cc]" />
                              ) : conv.lastMessage.state === "delivered" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#86868b]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-[#86868b]" />
                              )}
                            </span>
                          )}
                          <p
                            className={`text-sm truncate ${
                              hasUnread
                                ? "font-bold text-[#1D1D1F]"
                                : "font-medium text-[#1D1D1F]/70"
                            }`}
                          >
                            {conv.lastMessage.isMine && (
                              <span className="text-[#86868b] font-semibold">
                                You:{" "}
                              </span>
                            )}
                            {conv.lastMessage.content}
                          </p>
                        </div>
                      </Link>

                      {/* Associated Book Thumbnail + Pin/Archive/Open Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {conv.book?.image && (
                          <Link
                            href={`/catalog/${conv.book.id}`}
                            title={conv.book.title}
                            className="hidden sm:block w-10 h-13 rounded-lg overflow-hidden border border-black/10 shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={conv.book.image}
                              alt={conv.book.title}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            toggleConversationSetting(conv.id, {
                              isPinned: !conv.isPinned,
                            })
                          }
                          title={conv.isPinned ? "Unpin" : "Pin conversation"}
                          className={`p-2 rounded-full transition-colors cursor-pointer ${
                            conv.isPinned
                              ? "bg-[#0066cc]/10 text-[#0066cc]"
                              : "bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b]"
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleConversationSetting(conv.id, {
                              isArchived: !conv.isArchived,
                            })
                          }
                          title={
                            conv.isArchived ? "Unarchive" : "Archive conversation"
                          }
                          className="p-2 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={chatHref}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-xs font-bold text-white transition-colors"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Reader Discovery Section */}
      {(activeTab === "discover" ||
        conversations.length < 4 ||
        searchQuery.trim() !== "") && (
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
                Find profiles, explore their book collections & quotes, and
                start a conversation.
              </p>
            </div>
            <Link
              href="/leaderboard?tab=directory"
              className="text-xs font-bold text-[#0066cc] hover:underline flex items-center gap-1"
            >
              Full Directory &rarr;
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
                        className="px-3.5 py-1.5 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1D1D1F] text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        Profile <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <Link
                        href={`/messages/${reader.id}`}
                        className="px-4 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message
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
