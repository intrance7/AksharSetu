"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  MessageSquare,
  Loader2,
  Search,
  MapPin,
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
import { ChatThread } from "./ChatThread"

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

interface SelectedThread {
  conversationId?: string
  userId: string
  bookId: string | null
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
  const [selectedThread, setSelectedThread] = useState<SelectedThread | null>(
    null
  )
  const didAutoSelectDesktop = useRef(false)

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeFilter !== "all") params.set("filter", activeFilter)
      if (searchQuery.trim()) params.set("q", searchQuery.trim())
      const res = await fetch(`/api/conversations?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        setConversations(data)
        if (
          !didAutoSelectDesktop.current &&
          data.length > 0 &&
          typeof window !== "undefined" &&
          window.innerWidth >= 1024 &&
          initialTab === "chats"
        ) {
          didAutoSelectDesktop.current = true
          const first = data[0] as ConversationItem
          setSelectedThread({
            conversationId: first.id,
            userId: first.otherUser.id,
            bookId: first.book?.id || null,
          })
        }
      }
    } catch {
      // ignore transient errors
    } finally {
      setLoadingConvos(false)
    }
  }, [activeFilter, searchQuery, initialTab])

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

  const openThread = (
    userId: string,
    bookId: string | null = null,
    conversationId?: string
  ) => {
    setActiveTab("chats")
    setSelectedThread({ userId, bookId, conversationId })
  }

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Top Search & Mode Switcher Bar (hidden on mobile when actively inside a thread) */}
      <div
        className={`bg-white rounded-3xl p-4 sm:p-5 border border-[#1D1D1F]/[0.07] shadow-sm space-y-3.5 ${
          selectedThread ? "hidden lg:block" : "block"
        }`}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, @usernames, books, or readers..."
              className="w-full h-12 pl-11 pr-4 rounded-full bg-[#FAF6F0] text-sm sm:text-[15px] font-medium text-[#1D1D1F] placeholder:text-[#6E6E73] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84200]/15 focus:border-[#C84200] border border-[#1D1D1F]/[0.08] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center bg-[#FAF6F0] p-1 rounded-full border border-[#1D1D1F]/[0.07] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("chats")}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "chats"
                  ? "bg-[#1D1D1F] text-white shadow-xs"
                  : "text-[#5E5E63] hover:text-[#1D1D1F]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Chats</span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-xs ${
                  activeTab === "chats"
                    ? "bg-white/15 text-white"
                    : "bg-[#1D1D1F]/[0.06] text-[#1D1D1F]"
                }`}
              >
                {conversations.length}
              </span>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full font-mono text-xs bg-[#C84200] text-white">
                  {totalUnread}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "discover"
                  ? "bg-[#C84200] text-white shadow-xs"
                  : "text-[#5E5E63] hover:text-[#1D1D1F]"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Find Readers</span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-xs ${
                  activeTab === "discover"
                    ? "bg-white/20 text-white"
                    : "bg-[#1D1D1F]/[0.06] text-[#1D1D1F]"
                }`}
              >
                {readers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Chips: All | Unread | Buying | Selling | Archived */}
        {activeTab === "chats" && (
          <div className="flex items-center gap-2 overflow-x-auto pt-0.5 scrollbar-hide">
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
                className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#C84200] text-white shadow-xs"
                    : "bg-[#FAF6F0] text-[#5E5E63] hover:text-[#1D1D1F] border border-[#1D1D1F]/[0.06]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: SPLIT-PANE INBOX (Desktop Split Pane + Smooth Mobile List <-> Thread Switch) */}
      {activeTab === "chats" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-17rem)] lg:min-h-[540px]">
          {/* LEFT PANE: Conversation List */}
          <div
            className={`${
              selectedThread ? "hidden lg:flex" : "flex"
            } lg:col-span-4 flex-col bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm overflow-hidden`}
          >
            <div className="px-5 py-3.5 border-b border-[#1D1D1F]/[0.06] flex items-center justify-between shrink-0 bg-[#FAF6F0]/80">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                Inbox ({conversations.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
                className="text-xs sm:text-[13px] font-bold text-[#C84200] hover:underline cursor-pointer"
              >
                + New Message
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#1D1D1F]/[0.06]">
              {loadingConvos ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex items-center justify-center mx-auto mb-3.5">
                    <MessageSquare className="w-6 h-6 text-[#C84200]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#1D1D1F] mb-1">
                    {searchQuery
                      ? "No matching chats"
                      : activeFilter !== "all"
                      ? `No ${activeFilter} chats`
                      : "No conversations yet"}
                  </h2>
                  <p className="text-[#5E5E63] text-sm max-w-xs mx-auto mb-5 leading-relaxed">
                    Message any seller from a listing or connect directly with
                    fellow readers.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("discover")}
                    className="inline-flex items-center gap-2 bg-[#C84200] hover:bg-[#A33500] text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4" /> Start a New Message
                  </button>
                </div>
              ) : (
                conversations.map((conv, i) => {
                  const hasUnread = (conv.unreadCount || 0) > 0
                  const isSelected =
                    selectedThread &&
                    (selectedThread.conversationId === conv.id ||
                      (selectedThread.userId === conv.otherUser.id &&
                        selectedThread.bookId === (conv.book?.id || null)))

                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(i * 0.02, 0.2),
                        duration: 0.18,
                      }}
                      className={`flex items-center gap-3.5 p-4 transition-colors ${
                        isSelected
                          ? "bg-[#FAF6F0] border-l-4 border-[#C84200]"
                          : hasUnread
                          ? "bg-[#C84200]/[0.04] hover:bg-[#FAF6F0]"
                          : "hover:bg-[#FAF6F0]/75"
                      }`}
                    >
                      {/* Avatar */}
                      <button
                        type="button"
                        onClick={() =>
                          openThread(
                            conv.otherUser.id,
                            conv.book?.id || null,
                            conv.id
                          )
                        }
                        className="relative w-12 h-12 rounded-full bg-[#1D1D1F] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer ring-2 ring-[#FAF6F0]"
                      >
                        {conv.otherUser.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={conv.otherUser.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-base">
                            {(conv.otherUser.name || "R")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                        {conv.otherUser.online && (
                          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </button>

                      {/* Main Conversation Row */}
                      <button
                        type="button"
                        onClick={() =>
                          openThread(
                            conv.otherUser.id,
                            conv.book?.id || null,
                            conv.id
                          )
                        }
                        className="flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {conv.isPinned && (
                              <Pin className="w-3.5 h-3.5 text-[#C84200] shrink-0" />
                            )}
                            <h3 className="font-bold text-[#1D1D1F] text-[15px] truncate">
                              {conv.otherUser.name}
                            </h3>
                            {conv.isMuted && (
                              <BellOff className="w-3.5 h-3.5 text-[#6E6E73] shrink-0" />
                            )}
                          </div>
                          <span className="font-mono text-xs text-[#6E6E73] shrink-0">
                            {formatDistanceToNow(
                              new Date(conv.lastMessage.createdAt),
                              { addSuffix: false }
                            )}
                          </span>
                        </div>

                        {conv.book && (
                          <p className="text-xs font-semibold text-[#C84200] truncate mb-0.5">
                            {conv.book.title} ·{" "}
                            <span className="font-mono">
                              {conv.book.price === 0
                                ? "Free / Swap"
                                : `₹${conv.book.price}`}
                            </span>
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {conv.lastMessage.isMine && (
                              <span className="inline-flex items-center shrink-0">
                                {conv.lastMessage.state === "read" ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-[#C84200]" />
                                ) : conv.lastMessage.state === "delivered" ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-[#6E6E73]" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-[#6E6E73]" />
                                )}
                              </span>
                            )}
                            <p
                              className={`text-[13px] truncate ${
                                hasUnread
                                  ? "font-semibold text-[#1D1D1F]"
                                  : "font-normal text-[#5E5E63]"
                              }`}
                            >
                              {conv.lastMessage.isMine && "You: "}
                              {conv.lastMessage.content}
                            </p>
                          </div>

                          {hasUnread && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#C84200] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Quick Pin / Archive on sm+ */}
                      <div className="hidden sm:flex lg:hidden xl:flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleConversationSetting(conv.id, {
                              isPinned: !conv.isPinned,
                            })
                          }}
                          title={conv.isPinned ? "Unpin" : "Pin conversation"}
                          className={`p-2 rounded-full transition-colors cursor-pointer ${
                            conv.isPinned
                              ? "bg-[#C84200]/12 text-[#C84200]"
                              : "bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#6E6E73]"
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleConversationSetting(conv.id, {
                              isArchived: !conv.isArchived,
                            })
                          }}
                          title={
                            conv.isArchived
                              ? "Unarchive"
                              : "Archive conversation"
                          }
                          className="p-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#6E6E73] transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Active Thread */}
          <div
            className={`${
              selectedThread
                ? "block h-[calc(100vh-8.5rem)] min-h-[500px] lg:h-full"
                : "hidden lg:flex"
            } lg:col-span-8 flex-col`}
          >
            {selectedThread ? (
              <ChatThread
                key={`${selectedThread.userId}-${selectedThread.bookId || "dm"}`}
                userId={selectedThread.userId}
                initialBookId={selectedThread.bookId}
                embedded
                onBack={() => setSelectedThread(null)}
              />
            ) : (
              <div className="h-full bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0B0B0D] text-white flex items-center justify-center mb-5 shadow-md">
                  <MessageSquare className="w-7 h-7 text-[#FF7F45]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight mb-2">
                  Select a{" "}
                  <span className="font-serif italic font-medium text-[#C84200]">
                    Conversation
                  </span>
                </h2>
                <p className="text-sm sm:text-[15px] text-[#5E5E63] max-w-md mb-6 leading-relaxed">
                  Choose any thread on the left to negotiate book prices, share
                  condition photos, or coordinate campus handoffs.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("discover")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Users className="w-4 h-4" /> Discover Community Readers
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2 / DISCOVERY SECTION: Community Readers Directory */}
      {(activeTab === "discover" ||
        (!selectedThread && conversations.length === 0 && !loadingConvos)) && (
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
                {searchQuery.trim()
                  ? `Matching Reader Profiles (${readers.length})`
                  : "Discover Community Readers"}
              </h2>
              <p className="text-sm text-[#5E5E63] mt-0.5">
                Explore campus reader profiles and start a direct book
                conversation.
              </p>
            </div>
            <Link
              href="/leaderboard?tab=directory"
              className="text-sm font-bold text-[#C84200] hover:underline flex items-center gap-1"
            >
              Full Directory &rarr;
            </Link>
          </div>

          {loadingReaders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
            </div>
          ) : readers.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#1D1D1F]/[0.07]">
              <p className="text-base font-medium text-[#5E5E63]">
                No reader profiles matched &ldquo;{searchQuery}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {readers.map((reader) => (
                <div
                  key={reader.id}
                  className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm hover:shadow-md hover:border-[#C84200]/30 transition-all flex flex-col justify-between gap-5"
                >
                  <div className="flex items-start gap-3.5">
                    <Link
                      href={`/profile/${reader.id}`}
                      className="relative w-12 h-12 rounded-full bg-[#1D1D1F] overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-[#FAF6F0]"
                    >
                      {reader.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reader.image}
                          alt={reader.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {reader.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/profile/${reader.id}`}
                          className="font-bold text-base text-[#1D1D1F] hover:text-[#C84200] transition-colors truncate"
                        >
                          {reader.name}
                        </Link>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] border border-[#C84200]/20 text-[#C84200] font-mono font-bold text-xs">
                          LVL {reader.stats.level}
                        </span>
                      </div>

                      {reader.location && (
                        <p className="text-xs font-medium text-[#5E5E63] flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#C84200] shrink-0" />{" "}
                          {reader.location}
                        </p>
                      )}

                      <p className="text-sm text-[#5E5E63] line-clamp-2 mt-2 leading-relaxed">
                        {reader.bio || "Fellow book lover on AksharSetu."}
                      </p>

                      {reader.favoriteQuote && (
                        <div className="mt-3 rounded-2xl bg-[#FAF6F0] px-3 py-2 border border-[#1D1D1F]/[0.05]">
                          <p className="font-serif italic text-xs text-[#1D1D1F]/80 line-clamp-1 flex items-center gap-1.5">
                            <Quote className="w-3 h-3 text-[#C84200] shrink-0" />
                            “{reader.favoriteQuote}”
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#1D1D1F]/[0.06]">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#5E5E63]">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#C84200]" />
                        {reader.stats.booksListed} listed
                      </span>
                      <span>·</span>
                      <span>{reader.stats.totalXP} XP</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${reader.id}`}
                        className="px-3.5 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openThread(reader.id, null)}
                        className="px-4 py-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </button>
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
