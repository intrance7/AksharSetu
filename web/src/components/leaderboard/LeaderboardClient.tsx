"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Trophy,
  BookOpen,
  Clock,
  Award,
  Search,
  MapPin,
  MessageSquare,
  Quote,
  Sparkles,
  Users,
  HeartHandshake,
  Crown,
  ArrowUpRight,
  Pencil,
} from "lucide-react"
import { motion } from "framer-motion"

export interface LeaderboardUserEntry {
  id: string
  name: string
  image: string | null
  bio: string | null
  favoriteQuote: string | null
  quoteAuthor: string | null
  location: string | null
  liveStatus: string | null
  isShantiModeActive: boolean
  badges: { id: string; name: string; iconUrl: string }[]
  stats: {
    booksListed: number
    booksDonated: number
    badgesEarned: number
    readingMinutes: number
    libraryCount: number
    totalXP: number
    level: number
    xpIntoLevel: number
    xpForNextLevel: number
    progressPercent: number
    rankTitle: string
  }
}

export interface CommunityOverviewStats {
  totalReaders: number
  totalBooksListed: number
  totalBooksDonated: number
  totalReadingMinutes: number
  totalBadgesEarned: number
  totalCommunityXP: number
}

interface LeaderboardClientProps {
  users: LeaderboardUserEntry[]
  overview: CommunityOverviewStats
  currentUserId: string | null
  initialTab?: string
}

type CategoryTab = "xp" | "donors" | "readers" | "listers" | "directory"

export function LeaderboardClient({
  users,
  overview,
  currentUserId,
  initialTab,
}: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>(
    initialTab === "directory" ? "directory" : "xp"
  )
  const [searchQuery, setSearchQuery] = useState("")

  const sortedUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        u.name.toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q) ||
        (u.bio || "").toLowerCase().includes(q) ||
        (u.favoriteQuote || "").toLowerCase().includes(q) ||
        (u.quoteAuthor || "").toLowerCase().includes(q) ||
        u.stats.rankTitle.toLowerCase().includes(q)
      )
    })

    return [...filtered].sort((a, b) => {
      if (activeTab === "donors") {
        return (
          b.stats.booksDonated - a.stats.booksDonated ||
          b.stats.totalXP - a.stats.totalXP
        )
      }
      if (activeTab === "readers") {
        return (
          b.stats.readingMinutes - a.stats.readingMinutes ||
          b.stats.totalXP - a.stats.totalXP
        )
      }
      if (activeTab === "listers") {
        return (
          b.stats.booksListed - a.stats.booksListed ||
          b.stats.totalXP - a.stats.totalXP
        )
      }
      return b.stats.totalXP - a.stats.totalXP
    })
  }, [users, activeTab, searchQuery])

  const myStanding = useMemo(() => {
    if (!currentUserId) return null
    const globalSorted = [...users].sort(
      (a, b) => b.stats.totalXP - a.stats.totalXP
    )
    const idx = globalSorted.findIndex((u) => u.id === currentUserId)
    if (idx === -1) return null
    return {
      rank: idx + 1,
      user: globalSorted[idx],
    }
  }, [users, currentUserId])

  const topThree = sortedUsers.slice(0, 3)

  const getPrimaryScoreLabel = (u: LeaderboardUserEntry) => {
    if (activeTab === "donors") return `${u.stats.booksDonated} Donated`
    if (activeTab === "readers") {
      const h = Math.floor(u.stats.readingMinutes / 60)
      const m = u.stats.readingMinutes % 60
      return h > 0 ? `${h}h ${m}m Read` : `${m}m Read`
    }
    if (activeTab === "listers") return `${u.stats.booksListed} Listed`
    return `${u.stats.totalXP} XP`
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-20">
      {/* High-Impact Hero Section (#000000 per AksharSetu Design System) */}
      <section className="bg-[#000000] text-[#f5f5f7] pt-28 pb-16 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-[#f5f5f7] mb-4">
                <Trophy className="w-3.5 h-3.5 text-[#0066cc]" /> Community Standings & Profiles
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none text-[#f5f5f7]">
                Reader Leaderboard &{" "}
                <span className="text-[#0066cc]">Profiles.</span>
              </h1>
              <p className="text-[#86868b] text-base md:text-lg font-medium max-w-2xl mt-4">
                Celebrating readers, Vidya Daan book donors, and Shanti Mode scholars. Explore community profiles, read their favorite literary quotes, and start a conversation.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {currentUserId && (
                <Link
                  href={`/profile/${currentUserId}`}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-[#f5f5f7] text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit My Profile & Quote
                </Link>
              )}
              <Link
                href="/messages"
                className="px-5 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Open Messenger
              </Link>
            </div>
          </div>

          {/* Community Bento Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#86868b] text-xs font-bold uppercase tracking-wider mb-2">
                <Users className="w-4 h-4 text-[#0066cc]" /> Readers
              </div>
              <p className="text-3xl font-bold tracking-tight text-[#f5f5f7]">
                {overview.totalReaders}
              </p>
              <p className="text-xs text-[#86868b] mt-1">Active profiles</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#86868b] text-xs font-bold uppercase tracking-wider mb-2">
                <HeartHandshake className="w-4 h-4 text-emerald-400" /> Donated
              </div>
              <p className="text-3xl font-bold tracking-tight text-[#f5f5f7]">
                {overview.totalBooksDonated}
              </p>
              <p className="text-xs text-[#86868b] mt-1">Vidya Daan books</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#86868b] text-xs font-bold uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4 text-amber-400" /> Listed
              </div>
              <p className="text-3xl font-bold tracking-tight text-[#f5f5f7]">
                {overview.totalBooksListed}
              </p>
              <p className="text-xs text-[#86868b] mt-1">Books in catalog</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#86868b] text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-purple-400" /> Shanti Time
              </div>
              <p className="text-3xl font-bold tracking-tight text-[#f5f5f7]">
                {Math.floor(overview.totalReadingMinutes / 60)}h{" "}
                {overview.totalReadingMinutes % 60}m
              </p>
              <p className="text-xs text-[#86868b] mt-1">Focused reading</p>
            </div>

            <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-[#86868b] text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-[#0066cc]" /> Total XP
              </div>
              <p className="text-3xl font-bold tracking-tight text-[#f5f5f7]">
                {overview.totalCommunityXP.toLocaleString()}
              </p>
              <p className="text-xs text-[#86868b] mt-1">
                {overview.totalBadgesEarned} badges unlocked
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 mt-8 flex flex-col gap-8">
        {/* Logged-in User's Personal Standing Card */}
        {myStanding && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                {myStanding.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={myStanding.user.image}
                    alt={myStanding.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  myStanding.user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0066cc] text-white text-xs font-bold">
                    Your Global Rank #{myStanding.rank}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e8e8ed] text-[#1d1d1f] text-xs font-bold">
                    LVL {myStanding.user.stats.level} •{" "}
                    {myStanding.user.stats.rankTitle}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#1d1d1f] mt-1">
                  {myStanding.user.name}{" "}
                  <span className="text-[#86868b] font-medium text-sm">
                    ({myStanding.user.stats.totalXP} XP)
                  </span>
                </h2>
                {myStanding.user.favoriteQuote ? (
                  <p className="text-xs text-[#86868b] italic mt-0.5 line-clamp-1">
                    “{myStanding.user.favoriteQuote}”
                  </p>
                ) : (
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Add your signature literary quote on your profile!
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <Link
                href={`/profile/${myStanding.user.id}`}
                className="px-4 py-2 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1d1d1f] text-xs font-bold transition-colors"
              >
                My Profile & Quote
              </Link>
              <Link
                href="/catalog/new"
                className="px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold transition-colors"
              >
                + List / Donate Book (+100 XP)
              </Link>
            </div>
          </div>
        )}

        {/* Filter & Category Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 lg:pb-0">
            {[
              { id: "xp", label: "Overall XP", icon: Trophy },
              { id: "donors", label: "Top Donors", icon: HeartHandshake },
              { id: "readers", label: "Shanti Readers", icon: Clock },
              { id: "listers", label: "Top Listers", icon: BookOpen },
              { id: "directory", label: "All Reader Profiles", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as CategoryTab)}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#0066cc] text-white shadow-sm"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search profiles by name, city, quote..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f] placeholder:text-[#86868b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] border border-transparent transition-all"
            />
          </div>
        </div>

        {/* Directory Bento View vs Ranked Leaderboard View */}
        {activeTab === "directory" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedUsers.map((reader, idx) => (
              <motion.div
                key={reader.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(idx * 0.03, 0.3),
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Link
                        href={`/profile/${reader.id}`}
                        className="relative w-14 h-14 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden"
                      >
                        {reader.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={reader.image}
                            alt={reader.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          reader.name.charAt(0).toUpperCase()
                        )}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${reader.id}`}
                          className="font-bold text-base text-[#1d1d1f] hover:text-[#0066cc] transition-colors truncate block"
                        >
                          {reader.name}
                        </Link>
                        <p className="text-xs font-bold text-[#86868b]">
                          LVL {reader.stats.level} • {reader.stats.rankTitle}
                        </p>
                        {reader.location && (
                          <p className="text-[11px] font-semibold text-[#86868b] flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-[#0066cc] shrink-0" />
                            {reader.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-bold text-xs shrink-0">
                      {reader.stats.totalXP} XP
                    </span>
                  </div>

                  <p className="text-xs text-[#1d1d1f]/80 font-medium line-clamp-2">
                    {reader.bio || "Community reader on AksharSetu."}
                  </p>

                  {/* Signature Quote Box */}
                  <div className="rounded-xl bg-[#f5f5f7] p-3.5 border border-black/5">
                    <div className="flex items-start gap-2">
                      <Quote className="w-3.5 h-3.5 text-[#0066cc] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1d1d1f] italic line-clamp-2">
                          “
                          {reader.favoriteQuote ||
                            "A reader lives a thousand lives before he dies."}
                          ”
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mt-1">
                          — {reader.quoteAuthor || "George R.R. Martin"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-black/5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#f5f5f7] rounded-xl py-2 px-1">
                      <p className="text-sm font-bold text-[#1d1d1f]">
                        {reader.stats.booksListed}
                      </p>
                      <p className="text-[10px] font-semibold text-[#86868b]">
                        Listed
                      </p>
                    </div>
                    <div className="bg-[#f5f5f7] rounded-xl py-2 px-1">
                      <p className="text-sm font-bold text-[#1d1d1f]">
                        {reader.stats.booksDonated}
                      </p>
                      <p className="text-[10px] font-semibold text-[#86868b]">
                        Donated
                      </p>
                    </div>
                    <div className="bg-[#f5f5f7] rounded-xl py-2 px-1">
                      <p className="text-sm font-bold text-[#1d1d1f]">
                        {Math.floor(reader.stats.readingMinutes / 60)}h{" "}
                        {reader.stats.readingMinutes % 60}m
                      </p>
                      <p className="text-[10px] font-semibold text-[#86868b]">
                        Read
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${reader.id}`}
                      className="flex-1 py-2 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1d1d1f] text-xs font-bold text-center transition-colors"
                    >
                      View Profile
                    </Link>
                    {currentUserId !== reader.id && (
                      <Link
                        href={`/messages/${reader.id}`}
                        className="flex-1 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            {topThree.length > 0 && !searchQuery.trim() && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topThree.map((u, idx) => {
                  const rank = idx + 1
                  const isFirst = rank === 1
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: idx * 0.06,
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`rounded-2xl p-6 border flex flex-col justify-between gap-5 ${
                        isFirst
                          ? "bg-[#000000] text-[#f5f5f7] border-white/15 shadow-xl"
                          : "bg-white text-[#1d1d1f] border-black/5 shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              rank === 1
                                ? "bg-amber-400 text-black"
                                : rank === 2
                                ? "bg-[#e8e8ed] text-[#1d1d1f]"
                                : "bg-amber-700/20 text-amber-800"
                            }`}
                          >
                            <Crown className="w-3.5 h-3.5" /> Rank #{rank}
                          </span>
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              isFirst
                                ? "bg-white/10 text-[#f5f5f7]"
                                : "bg-[#f5f5f7] text-[#1d1d1f]"
                            }`}
                          >
                            {getPrimaryScoreLabel(u)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <Link
                            href={`/profile/${u.id}`}
                            className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden ${
                              isFirst
                                ? "bg-white/10 text-white ring-2 ring-amber-400"
                                : "bg-[#1d1d1f] text-white"
                            }`}
                          >
                            {u.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.image}
                                alt={u.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              u.name.charAt(0).toUpperCase()
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/profile/${u.id}`}
                              className="font-bold text-xl tracking-tight truncate block hover:underline"
                            >
                              {u.name}
                            </Link>
                            <p className="text-xs font-semibold text-[#86868b]">
                              LVL {u.stats.level} • {u.stats.rankTitle}
                            </p>
                            {u.location && (
                              <p className="text-xs text-[#86868b] flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 text-[#0066cc]" />{" "}
                                {u.location}
                              </p>
                            )}
                          </div>
                        </div>

                        {u.favoriteQuote && (
                          <p
                            className={`text-xs italic mt-4 line-clamp-2 ${
                              isFirst ? "text-[#f5f5f7]/80" : "text-[#86868b]"
                            }`}
                          >
                            “{u.favoriteQuote}”
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-current/10">
                        <div className="flex items-center gap-3 text-xs font-semibold text-[#86868b]">
                          <span>{u.stats.booksListed} listed</span>
                          <span>•</span>
                          <span>{u.stats.booksDonated} donated</span>
                          <span>•</span>
                          <span>{u.stats.badgesEarned} badges</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${u.id}`}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              isFirst
                                ? "bg-white/15 hover:bg-white/25 text-white"
                                : "bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1d1d1f]"
                            }`}
                          >
                            Profile
                          </Link>
                          {currentUserId !== u.id && (
                            <Link
                              href={`/messages/${u.id}`}
                              className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold transition-colors"
                            >
                              Chat
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Full Leaderboard List */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#86868b]">
                  Community Standings ({sortedUsers.length} Readers)
                </h2>
                <span className="text-xs font-medium text-[#86868b]">
                  Click any reader to view their profile or start a chat
                </span>
              </div>

              {sortedUsers.length === 0 ? (
                <div className="py-16 text-center text-[#86868b] text-sm font-medium">
                  No readers matched your search filter.
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {sortedUsers.map((u, idx) => {
                    const rank = idx + 1
                    const isMe = u.id === currentUserId
                    return (
                      <div
                        key={u.id}
                        className={`p-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                          isMe ? "bg-[#0066cc]/5" : "hover:bg-[#f5f5f7]/60"
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`w-9 text-center font-bold text-base shrink-0 ${
                              rank === 1
                                ? "text-amber-500"
                                : rank === 2
                                ? "text-[#86868b]"
                                : rank === 3
                                ? "text-amber-700"
                                : "text-[#86868b]"
                            }`}
                          >
                            #{rank}
                          </div>

                          <Link
                            href={`/profile/${u.id}`}
                            className="w-12 h-12 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden"
                          >
                            {u.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.image}
                                alt={u.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              u.name.charAt(0).toUpperCase()
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/profile/${u.id}`}
                                className="font-bold text-[#1d1d1f] text-base hover:text-[#0066cc] transition-colors truncate"
                              >
                                {u.name}
                              </Link>
                              {isMe && (
                                <span className="px-2 py-0.5 rounded-full bg-[#0066cc] text-white text-[10px] font-bold">
                                  You
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-full bg-[#e8e8ed] text-[#1d1d1f] text-[10px] font-bold uppercase tracking-wider">
                                LVL {u.stats.level} • {u.stats.rankTitle}
                              </span>
                              {u.location && (
                                <span className="text-xs font-medium text-[#86868b] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#0066cc]" />
                                  {u.location}
                                </span>
                              )}
                            </div>

                            {u.favoriteQuote ? (
                              <p className="text-xs text-[#86868b] italic truncate mt-1">
                                “{u.favoriteQuote}”{" "}
                                {u.quoteAuthor && `— ${u.quoteAuthor}`}
                              </p>
                            ) : (
                              <p className="text-xs text-[#86868b] truncate mt-1">
                                {u.bio || "Sharing knowledge through books."}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex items-center justify-between md:justify-end gap-4 pl-13 md:pl-0 shrink-0">
                          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-[#86868b]">
                            <span title="Books Listed">
                              <strong className="text-[#1d1d1f]">
                                {u.stats.booksListed}
                              </strong>{" "}
                              listed
                            </span>
                            <span title="Books Donated">
                              <strong className="text-[#1d1d1f]">
                                {u.stats.booksDonated}
                              </strong>{" "}
                              donated
                            </span>
                            <span title="Reading Time">
                              <strong className="text-[#1d1d1f]">
                                {Math.floor(u.stats.readingMinutes / 60)}h{" "}
                                {u.stats.readingMinutes % 60}m
                              </strong>{" "}
                              read
                            </span>
                          </div>

                          <div className="px-3.5 py-1.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-bold text-xs min-w-[90px] text-center">
                            {getPrimaryScoreLabel(u)}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${u.id}`}
                              className="px-3.5 py-1.5 rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1d1d1f] text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              Profile <ArrowUpRight className="w-3 h-3" />
                            </Link>
                            {!isMe && (
                              <Link
                                href={`/messages/${u.id}`}
                                className="px-3.5 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <MessageSquare className="w-3 h-3" /> Chat
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

