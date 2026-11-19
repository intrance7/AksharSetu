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
  username?: string | null
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
  currentUsername?: string | null
  initialTab?: string
}

type CategoryTab = "xp" | "donors" | "readers" | "listers" | "directory"

export function LeaderboardClient({
  users,
  overview,
  currentUserId,
  currentUsername,
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
      const cleanQ = q.replace(/^@/, "")
      return (
        u.name.toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(cleanQ) ||
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
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* High-Impact Editorial Obsidian Hero */}
      <section className="relative bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,178,43,0.08),transparent_50%)] text-[#F5F5F7] py-14 md:py-16 px-4 border-b border-white/10 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-[13px] font-bold uppercase tracking-widest text-[#FF8A4C] mb-4">
                <Trophy className="w-4 h-4" /> Community Standings &amp; Profiles
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-white">
                Reader{" "}
                <span className="font-serif italic font-medium text-[#FF7F45]">
                  Charts.
                </span>
              </h1>
              <p className="text-white/75 text-base md:text-lg font-medium max-w-2xl mt-4 leading-relaxed">
                Celebrating readers, Vidya Daan book donors, and Shanti Mode scholars. Explore community profiles, read their favorite literary quotes, and start a conversation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {currentUserId && (
                <Link
                  href={`/profile/${
                    currentUsername ||
                    myStanding?.user.username ||
                    currentUserId
                  }`}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Edit My Profile
                </Link>
              )}
              <Link
                href="/messages"
                className="px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#C84200]/20"
              >
                <MessageSquare className="w-4 h-4" /> Open Messenger
              </Link>
            </div>
          </div>

          {/* Community Bento Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-2 text-white/65 text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2">
                <Users className="w-4 h-4 text-[#FF8A4C]" /> Readers
              </div>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {overview.totalReaders}
              </p>
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">Active profiles</p>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-2 text-white/65 text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2">
                <HeartHandshake className="w-4 h-4 text-emerald-400" /> Donated
              </div>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {overview.totalBooksDonated}
              </p>
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">Vidya Daan books</p>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-2 text-white/65 text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2">
                <BookOpen className="w-4 h-4 text-amber-400" /> Listed
              </div>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {overview.totalBooksListed}
              </p>
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">Books in catalog</p>
            </div>

            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-2 text-white/65 text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4 text-purple-400" /> Shanti Time
              </div>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {Math.floor(overview.totalReadingMinutes / 60)}h{" "}
                {overview.totalReadingMinutes % 60}m
              </p>
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">Focused reading</p>
            </div>

            <div className="col-span-2 md:col-span-1 bg-white/[0.06] border border-white/10 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-2 text-white/65 text-xs sm:text-[13px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-[#F4B22B]" /> Total XP
              </div>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {overview.totalCommunityXP.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">
                {overview.totalBadgesEarned} badges unlocked
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 mt-8 flex flex-col gap-8">
        {/* Logged-in User's Personal Standing Card */}
        {myStanding && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-15 h-15 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-black text-xl shrink-0 overflow-hidden">
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
                  <span className="px-3 py-1 rounded-full bg-[#C84200] text-white text-xs sm:text-[13px] font-bold">
                    Your Global Rank #{myStanding.rank}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FAF6F0] text-[#1d1d1f] text-xs sm:text-[13px] font-bold border border-[#1D1D1F]/[0.06]">
                    LVL {myStanding.user.stats.level} •{" "}
                    {myStanding.user.stats.rankTitle}
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#1d1d1f] mt-1.5 flex flex-wrap items-baseline gap-2">
                  <span>{myStanding.user.name}</span>
                  {myStanding.user.username && (
                    <span className="text-sm font-bold text-[#C84200]">
                      @{myStanding.user.username}
                    </span>
                  )}
                  <span className="text-[#6e6e73] font-semibold text-sm">
                    ({myStanding.user.stats.totalXP.toLocaleString()} XP)
                  </span>
                </h2>
                {myStanding.user.favoriteQuote ? (
                  <p className="text-sm text-[#6e6e73] font-serif italic mt-1 line-clamp-1">
                    “{myStanding.user.favoriteQuote}”
                  </p>
                ) : (
                  <p className="text-sm text-[#6e6e73] mt-1">
                    Add your signature literary quote on your profile!
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
              <Link
                href={`/profile/${
                  myStanding.user.username || myStanding.user.id
                }`}
                className="px-5 py-2.5 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1d1d1f] text-sm font-bold border border-[#1D1D1F]/[0.08] transition-colors"
              >
                My Profile &amp; Quote
              </Link>
              <Link
                href="/catalog/new"
                className="px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition-colors"
              >
                + List / Donate Book (+100 XP)
              </Link>
            </div>
          </div>
        )}

        {/* Filter & Category Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-[#1D1D1F]/[0.07] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 lg:pb-0">
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
                  className={`px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#1D1D1F] text-[#F2EBE1] shadow-sm"
                      : "bg-[#FAF6F0] text-[#1d1d1f] hover:bg-[#EFE7DC]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#6e6e73] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, @username, city, quote..."
              className="w-full h-11 pl-11 pr-4 rounded-full bg-[#FAF6F0] text-sm font-medium text-[#1d1d1f] placeholder:text-[#6e6e73] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84200]/20 focus:border-[#C84200] border border-[#1D1D1F]/[0.07] transition-all"
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
                className="bg-white rounded-3xl p-6 shadow-sm border border-[#1D1D1F]/[0.07] flex flex-col justify-between gap-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Link
                        href={`/profile/${reader.username || reader.id}`}
                        className="relative w-14 h-14 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-black text-xl shrink-0 overflow-hidden"
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
                          href={`/profile/${reader.username || reader.id}`}
                          className="font-bold text-lg text-[#1d1d1f] hover:text-[#C84200] transition-colors truncate block"
                        >
                          {reader.name}
                        </Link>
                        {reader.username && (
                          <p className="text-sm font-semibold text-[#C84200] truncate">
                            @{reader.username}
                          </p>
                        )}
                        <p className="text-xs sm:text-[13px] font-bold text-[#6e6e73] mt-0.5">
                          LVL {reader.stats.level} • {reader.stats.rankTitle}
                        </p>
                        {reader.location && (
                          <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#C84200] shrink-0" />
                            {reader.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-[#FAF6F0] text-[#1d1d1f] font-bold text-xs sm:text-[13px] shrink-0 border border-[#1D1D1F]/[0.06]">
                      {reader.stats.totalXP.toLocaleString()} XP
                    </span>
                  </div>

                  <p className="text-sm text-[#525257] font-medium line-clamp-2 leading-relaxed">
                    {reader.bio || "Community reader on AksharSetu."}
                  </p>

                  {/* Signature Quote Box */}
                  <div className="rounded-2xl bg-[#FAF6F0] p-4 border border-[#1D1D1F]/[0.06]">
                    <div className="flex items-start gap-2.5">
                      <Quote className="w-4 h-4 text-[#C84200] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-serif font-medium text-[#1d1d1f] italic line-clamp-2 leading-relaxed">
                          “
                          {reader.favoriteQuote ||
                            "A reader lives a thousand lives before he dies."}
                          ”
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mt-1.5">
                          — {reader.quoteAuthor || "George R.R. Martin"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5 pt-4 border-t border-[#1D1D1F]/[0.06]">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#FAF6F0] rounded-2xl py-2.5 px-1">
                      <p className="text-base font-black text-[#1d1d1f]">
                        {reader.stats.booksListed}
                      </p>
                      <p className="text-xs font-semibold text-[#6e6e73]">
                        Listed
                      </p>
                    </div>
                    <div className="bg-[#FAF6F0] rounded-2xl py-2.5 px-1">
                      <p className="text-base font-black text-[#1d1d1f]">
                        {reader.stats.booksDonated}
                      </p>
                      <p className="text-xs font-semibold text-[#6e6e73]">
                        Donated
                      </p>
                    </div>
                    <div className="bg-[#FAF6F0] rounded-2xl py-2.5 px-1">
                      <p className="text-base font-black text-[#1d1d1f]">
                        {Math.floor(reader.stats.readingMinutes / 60)}h{" "}
                        {reader.stats.readingMinutes % 60}m
                      </p>
                      <p className="text-xs font-semibold text-[#6e6e73]">
                        Read
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${reader.username || reader.id}`}
                      className="flex-1 py-2.5 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1d1d1f] text-sm font-bold text-center border border-[#1D1D1F]/[0.08] transition-colors"
                    >
                      View Profile
                    </Link>
                    {currentUserId !== reader.id && (
                      <Link
                        href={`/messages/${reader.id}`}
                        className="flex-1 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> Chat
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
                      className={`rounded-3xl p-6 sm:p-7 border flex flex-col justify-between gap-5 ${
                        isFirst
                          ? "bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_60%)] text-[#F5F5F7] border-white/15 shadow-xl"
                          : "bg-white text-[#1d1d1f] border-[#1D1D1F]/[0.07] shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-[13px] font-black ${
                              rank === 1
                                ? "bg-[#F4B22B] text-black"
                                : rank === 2
                                ? "bg-[#EFE7DC] text-[#1d1d1f]"
                                : "bg-amber-700/15 text-amber-800"
                            }`}
                          >
                            <Crown className="w-4 h-4" /> Rank #{rank}
                          </span>
                          <span
                            className={`text-xs sm:text-[13px] font-bold px-3.5 py-1 rounded-full ${
                              isFirst
                                ? "bg-white/12 text-[#F5F5F7]"
                                : "bg-[#FAF6F0] text-[#1d1d1f]"
                            }`}
                          >
                            {getPrimaryScoreLabel(u)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <Link
                            href={`/profile/${u.username || u.id}`}
                            className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl shrink-0 overflow-hidden ${
                              isFirst
                                ? "bg-white/10 text-white ring-2 ring-[#F4B22B]"
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
                              href={`/profile/${u.username || u.id}`}
                              className="font-black text-xl sm:text-2xl tracking-tight truncate block hover:underline"
                            >
                              {u.name}
                            </Link>
                            {u.username && (
                              <p
                                className={`text-sm font-bold truncate ${
                                  isFirst ? "text-[#F4B22B]" : "text-[#C84200]"
                                }`}
                              >
                                @{u.username}
                              </p>
                            )}
                            <p
                              className={`text-xs sm:text-[13px] font-semibold mt-0.5 ${
                                isFirst ? "text-white/70" : "text-[#6e6e73]"
                              }`}
                            >
                              LVL {u.stats.level} • {u.stats.rankTitle}
                            </p>
                            {u.location && (
                              <p
                                className={`text-xs sm:text-[13px] flex items-center gap-1 mt-0.5 truncate ${
                                  isFirst ? "text-white/65" : "text-[#6e6e73]"
                                }`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#FF8A4C]" />{" "}
                                {u.location}
                              </p>
                            )}
                          </div>
                        </div>

                        {u.favoriteQuote && (
                          <p
                            className={`text-sm font-serif italic mt-4 line-clamp-2 leading-relaxed ${
                              isFirst ? "text-white/80" : "text-[#525257]"
                            }`}
                          >
                            “{u.favoriteQuote}”
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-current/10">
                        <div
                          className={`flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold ${
                            isFirst ? "text-white/70" : "text-[#6e6e73]"
                          }`}
                        >
                          <span>{u.stats.booksListed} listed</span>
                          <span>•</span>
                          <span>{u.stats.booksDonated} donated</span>
                          <span>•</span>
                          <span>{u.stats.badgesEarned} badges</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${u.username || u.id}`}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                              isFirst
                                ? "bg-white/15 hover:bg-white/25 text-white"
                                : "bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1d1d1f]"
                            }`}
                          >
                            Profile
                          </Link>
                          {currentUserId !== u.id && (
                            <Link
                              href={`/messages/${u.id}`}
                              className="px-4 py-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition-colors"
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
            <div className="bg-white rounded-3xl shadow-sm border border-[#1D1D1F]/[0.07] overflow-hidden">
              <div className="px-5 sm:px-7 py-5 border-b border-[#1D1D1F]/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#1d1d1f]">
                  Community Standings ({sortedUsers.length} Readers)
                </h2>
                <span className="text-sm font-medium text-[#6e6e73]">
                  Click any reader to view their profile or start a chat
                </span>
              </div>

              {sortedUsers.length === 0 ? (
                <div className="py-16 text-center text-[#6e6e73] text-base font-medium">
                  No readers matched your search filter.
                </div>
              ) : (
                <div className="divide-y divide-[#1D1D1F]/[0.06]">
                  {sortedUsers.map((u, idx) => {
                    const rank = idx + 1
                    const isMe = u.id === currentUserId
                    return (
                      <div
                        key={u.id}
                        className={`p-5 md:px-7 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                          isMe ? "bg-[#C84200]/[0.05]" : "hover:bg-[#FAF6F0]/70"
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`w-10 text-center font-black text-lg shrink-0 ${
                              rank === 1
                                ? "text-amber-500"
                                : rank === 2
                                ? "text-[#6e6e73]"
                                : rank === 3
                                ? "text-amber-700"
                                : "text-[#6e6e73]"
                            }`}
                          >
                            #{rank}
                          </div>

                          <Link
                            href={`/profile/${u.username || u.id}`}
                            className="w-13 h-13 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center font-black text-lg shrink-0 overflow-hidden"
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
                                href={`/profile/${u.username || u.id}`}
                                className="font-bold text-[#1d1d1f] text-base sm:text-lg hover:text-[#C84200] transition-colors truncate"
                              >
                                {u.name}
                              </Link>
                              {u.username && (
                                <Link
                                  href={`/profile/${u.username}`}
                                  className="text-sm font-bold text-[#C84200] hover:underline truncate"
                                >
                                  @{u.username}
                                </Link>
                              )}
                              {isMe && (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#C84200] text-white text-xs font-bold">
                                  You
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#1d1d1f] border border-[#1D1D1F]/[0.06] text-xs font-bold uppercase tracking-wider">
                                LVL {u.stats.level} • {u.stats.rankTitle}
                              </span>
                              {u.location && (
                                <span className="text-xs sm:text-[13px] font-medium text-[#6e6e73] flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-[#C84200]" />
                                  {u.location}
                                </span>
                              )}
                            </div>

                            {u.favoriteQuote ? (
                              <p className="text-sm text-[#6e6e73] font-serif italic truncate mt-1">
                                “{u.favoriteQuote}”{" "}
                                {u.quoteAuthor && `— ${u.quoteAuthor}`}
                              </p>
                            ) : (
                              <p className="text-sm text-[#6e6e73] truncate mt-1">
                                {u.bio || "Sharing knowledge through books."}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 md:gap-4 shrink-0">
                          <div className="hidden sm:flex items-center gap-4 text-sm font-semibold text-[#6e6e73]">
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

                          <div className="px-4 py-1.5 rounded-full bg-[#FAF6F0] text-[#1d1d1f] border border-[#1D1D1F]/[0.06] font-bold text-sm min-w-[98px] text-center">
                            {getPrimaryScoreLabel(u)}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${u.username || u.id}`}
                              className="px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1d1d1f] border border-[#1D1D1F]/[0.08] text-sm font-bold flex items-center gap-1 transition-colors"
                            >
                              Profile <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                            {!isMe && (
                              <Link
                                href={`/messages/${u.id}`}
                                className="px-4 py-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Chat
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

