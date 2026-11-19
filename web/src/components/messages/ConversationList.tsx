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
        className={`bg-white rounded-2xl p-3.5 sm:p-4 border border-black/5 shadow-sm space-y-3 ${
          selectedThread ? "hidden lg:block" : "block"
        }`}
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, @usernames, books, or readers..."
              className="w-full h-11 pl-11 pr-4 rounded-full bg-[#FAF6F0] text-sm font-medium text-[#1D1D1F] placeholder:text-[#86868b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] border border-black/5 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center bg-[#FAF6F0] p-1 rounded-full border border-black/5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("chats")}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "chats"
                  ? "bg-[#1D1D1F] text-white shadow-sm"
                  : "text-[#86868b] hover:text-[#1D1D1F]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Chats</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                {conversations.length}
              </span>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#C84200] text-white">
                  {totalUnread}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "discover"
                  ? "bg-[#C84200] text-white shadow-sm"
                  : "text-[#86868b] hover:text-[#1D1D1F]"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Find Readers</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10">
                {readers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Chips: All | Unread | Buying | Selling | Archived */}
        {activeTab === "chats" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 scrollbar-hide">
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
                    : "bg-[#FAF6F0] text-[#86868b] hover:text-[#1d1d1f]"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[calc(100vh-15.5rem)] lg:min-h-[540px]">
          {/* LEFT PANE: Conversation List (full width on mobile when no thread active; 4 cols on desktop) */}
          <div
            className={`${
              selectedThread ? "hidden lg:flex" : "flex"
            } lg:col-span-4 flex-col bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden`}
          >
            <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between shrink-0 bg-[#FAF6F0]/60">
              <span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F]">
                Inbox ({conversations.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
                className="text-xs font-bold text-[#C84200] hover:underline cursor-pointer"
              >
                + New Message
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-black/5">
              {loadingConvos ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6F0] flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-[#86868b]" />
                  </div>
                  <h2 className="text-base font-black text-[#1D1D1F] mb-1">
                    {searchQuery
                      ? "No matching chats"
                      : activeFilter !== "all"
                      ? `No ${activeFilter} chats`
                      : "No conversations yet"}
                  </h2>
                  <p className="text-[#86868b] font-medium text-xs max-w-xs mx-auto mb-5">
                    Message any seller from a listing or connect with fellow
                    readers.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("discover")}
                    className="inline-flex items-center gap-2 bg-[#C84200] hover:bg-[#A33500] text-white px-5 py-2.5 rounded-full font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> Start a New Message
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
                      transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.18 }}
                      className={`flex items-center gap-3 p-3.5 transition-colors ${
                        isSelected
                          ? "bg-[#0066cc]/8 border-l-4 border-[#0066cc]"
                          : hasUnread
                          ? "bg-[#C84200]/[0.04] hover:bg-[#FAF6F0]"
                          : "hover:bg-[#FAF6F0]/80"
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
                        className="relative w-12 h-12 rounded-full bg-[#1D1D1F] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                      >
                        {conv.otherUser.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={conv.otherUser.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-black text-base">
                            {(conv.otherUser.name || "R")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                        {conv.otherUser.online && (
                          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </button>

                      {/* Main Conversation Row (clicks into thread seamlessly!) */}
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
                              <Pin className="w-3 h-3 text-[#0066cc] shrink-0" />
                            )}
                            <h3 className="font-bold text-[#1D1D1F] text-sm truncate">
                              {conv.otherUser.name}
                            </h3>
                            {conv.isMuted && (
                              <BellOff className="w-3 h-3 text-[#86868b] shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-[#86868b] shrink-0">
                            {formatDistanceToNow(
                              new Date(conv.lastMessage.createdAt),
                              { addSuffix: false }
                            )}
                          </span>
                        </div>

                        {conv.book && (
                          <p className="text-[11px] font-bold text-[#0066cc] truncate mb-0.5">
                            {conv.book.title} ·{" "}
                            {conv.book.price === 0
                              ? "Free / Swap"
                              : `₹${conv.book.price}`}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0">
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
                              className={`text-xs truncate ${
                                hasUnread
                                  ? "font-bold text-[#1D1D1F]"
                                  : "font-medium text-[#86868b]"
                              }`}
                            >
                              {conv.lastMessage.isMine && "You: "}
                              {conv.lastMessage.content}
                            </p>
                          </div>

                          {hasUnread && (
                            <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#C84200] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            conv.isPinned
                              ? "bg-[#0066cc]/10 text-[#0066cc]"
                              : "bg-[#FAF6F0] hover:bg-[#e8e8ed] text-[#86868b]"
                          }`}
                        >
                          <Pin className="w-3 h-3" />
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
                            conv.isArchived ? "Unarchive" : "Archive conversation"
                          }
                          className="p-1.5 rounded-full bg-[#FAF6F0] hover:bg-[#e8e8ed] text-[#86868b] transition-colors cursor-pointer"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE: Active Thread (full width on mobile when selected; 8 cols on desktop) */}
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
              <div className="h-full bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center mb-5 shadow-md">
                  <MessageSquare className="w-7 h-7 text-[#C84200]" />
                </div>
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight mb-2">
                  Select a conversation
                </h2>
                <p className="text-sm text-[#86868b] max-w-sm mb-6 font-medium">
                  Choose any thread on the left to negotiate book prices, share
                  condition photos, or coordinate campus handoffs.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("discover")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold transition-colors cursor-pointer"
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
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-[#1D1D1F] tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C84200]" />
                {searchQuery.trim()
                  ? `Matching Reader Profiles (${readers.length})`
                  : "Discover Community Readers"}
              </h2>
              <p className="text-xs font-medium text-[#86868b]">
                Explore reader profiles and start a real-time conversation.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readers.map((reader) => (
                <div
                  key={reader.id}
                  className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <Link
                      href={`/profile/${reader.id}`}
                      className="relative w-12 h-12 rounded-full bg-[#1D1D1F] overflow-hidden shrink-0 flex items-center justify-center"
                    >
                      {reader.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reader.image}
                          alt={reader.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-black text-lg">
                          {reader.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/profile/${reader.id}`}
                          className="font-black text-sm text-[#1D1D1F] hover:text-[#C84200] transition-colors truncate"
                        >
                          {reader.name}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full bg-[#C84200]/10 text-[#C84200] font-black text-[10px] uppercase tracking-wider">
                          LVL {reader.stats.level}
                        </span>
                      </div>

                      {reader.location && (
                        <p className="text-[11px] font-bold text-[#86868b] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#C84200] shrink-0" />{" "}
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

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#86868b]">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#C84200]" />
                        {reader.stats.booksListed} listed
                      </span>
                      <span>•</span>
                      <span>{reader.stats.totalXP} XP</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${reader.id}`}
                        className="px-3 py-1.5 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1D1D1F] text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        Profile <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openThread(reader.id, null)}
                        className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" /> Message
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
