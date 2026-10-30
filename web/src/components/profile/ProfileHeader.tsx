"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MapPin,
  Clock,
  BookOpen,
  Award,
  Shield,
  Pencil,
  Quote,
  ChevronRight,
  MessageCircle,
  Trophy,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { computeUserStats } from "@/lib/gamification"
import { ProfileForm } from "./ProfileForm"

interface ProfileHeaderProps {
  user: {
    id: string
    name: string | null
    image: string | null
    bio: string | null
    favoriteQuote?: string | null
    quoteAuthor?: string | null
    location: string | null
    latitude?: number | null
    longitude?: number | null
    liveStatus: string | null
    isShantiModeActive: boolean
  }
  stats: {
    booksListed: number
    booksDonated: number
    badgesEarned: number
    readingMinutes: number
    libraryCount?: number
  }
  isOwnProfile?: boolean
}

export function ProfileHeader({
  user,
  stats,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)

  const computed = computeUserStats(stats)
  const displayQuote =
    user.favoriteQuote?.trim() ||
    "A reader lives a thousand lives before he dies. The man who never reads lives only one."
  const displayQuoteAuthor = user.quoteAuthor?.trim() || "George R.R. Martin"

  return (
    <>
      <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1d1d1f]/5 w-full relative">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-12 mb-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start flex-1">
            {/* Avatar Area */}
            <div className="relative shrink-0 mt-2">
              <div className="absolute -inset-3 border-[6px] border-[#E8B27A] rounded-full border-b-transparent border-r-transparent transform -rotate-45" />

              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#1D1D1F] relative flex items-center justify-center shadow-md">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-black text-[#F2EBE1]">
                    {user.name?.charAt(0).toUpperCase() || "R"}
                  </span>
                )}
              </div>

              {/* Level Pill */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#C84200] text-white px-5 py-1 rounded-full font-black text-[11px] uppercase tracking-widest shadow-md whitespace-nowrap">
                LVL {computed.level}
              </div>

              {/* Pencil Icon (Only for own profile) */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Edit Profile & Avatar"
                  className="absolute bottom-2 -right-1 bg-white p-2 rounded-full shadow-md border border-[#1d1d1f]/10 text-[#C84200] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/doodle-smile.png"
                    alt="smile"
                    className="w-full h-full object-contain"
                  />
                </span>
                <span className="text-[#86868b] font-bold text-sm uppercase tracking-wider">
                  {computed.rankTitle} • {computed.totalXP} XP
                </span>
              </div>

              <h1
                className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tighter mb-3 flex flex-wrap items-center gap-3"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {user.name || "Anonymous Reader"}
                {(user.isShantiModeActive || user.liveStatus) && (
                  <span className="shrink-0 inline-flex items-center gap-1.5 bg-[#FFF8F0] border border-[#E8B27A]/50 px-3 py-1 rounded-full text-xs font-bold text-[#C84200]">
                    <span className="w-2 h-2 rounded-full bg-[#C84200] animate-pulse" />
                    {user.liveStatus || "Reading peacefully..."}
                  </span>
                )}
              </h1>

              <p className="text-[#86868b] font-medium text-[15px] max-w-[48ch] leading-relaxed mb-4">
                {user.bio || "Building a kinder world, one book at a time."}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-[#1D1D1F]">
                {user.location && (
                  <span className="flex items-center gap-1.5 bg-[#F2EBE1] border border-[#1d1d1f]/10 px-4 py-2 rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-[#C84200]" /> {user.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-[#F2EBE1] border border-[#1d1d1f]/10 px-4 py-2 rounded-full">
                  <Shield className="w-3.5 h-3.5 text-[#C84200]" /> Verified Reader
                </span>
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-1.5 bg-[#F2EBE1] hover:bg-[#e5ddd0] border border-[#1d1d1f]/10 px-4 py-2 rounded-full transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#C84200]" /> Leaderboard
                </Link>
              </div>
            </div>
          </div>

          {/* Right Info Section: Actions + Signature Quote */}
          <div className="relative flex-1 lg:max-w-sm flex flex-col justify-between items-start lg:items-end gap-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-[#1D1D1F] hover:bg-[#333336] text-white px-5 py-2.5 rounded-full text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Profile & Quote
                </button>
              ) : (
                <Link
                  href={`/messages/${user.id}`}
                  className="flex items-center gap-2 bg-[#0066cc] hover:bg-[#0071e3] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Message Reader
                </Link>
              )}
              <Link
                href="/messages"
                className="flex items-center gap-2 bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1D1D1F] px-4 py-2.5 rounded-full text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> All Chats
              </Link>
            </div>

            {/* Dynamic Literary Quote Card */}
            <div className="relative w-full bg-[#F5F5F7] rounded-2xl p-5 border border-[#1d1d1f]/5 group">
              <Quote className="w-6 h-6 text-[#C84200]/30 mb-1" />
              <p className="font-['Caveat'] text-2xl md:text-3xl text-[#1D1D1F] leading-snug font-bold">
                “{displayQuote}”
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] font-black text-[#86868b] uppercase tracking-widest">
                  — {displayQuoteAuthor}
                </p>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-[#0066cc] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Change Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#1d1d1f]/5 mb-8" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 relative z-10 mb-10">
          <div className="flex flex-col md:border-r border-[#1d1d1f]/5 px-2">
            <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C84200]" /> Books Listed
            </span>
            <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">
              {stats.booksListed}
            </span>
            <span className="text-xs font-medium text-[#86868b] mt-1">
              Shared in catalog (+{stats.booksListed * 50} XP)
            </span>
          </div>

          <div className="flex flex-col md:border-r border-[#1d1d1f]/5 px-2">
            <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C84200]" /> Vidya Daan
            </span>
            <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">
              {stats.booksDonated}
            </span>
            <span className="text-xs font-medium text-[#86868b] mt-1">
              Books donated (+{stats.booksDonated * 100} XP)
            </span>
          </div>

          <div className="flex flex-col md:border-r border-[#1d1d1f]/5 px-2">
            <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C84200]" /> Badges
            </span>
            <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">
              {stats.badgesEarned}
            </span>
            <span className="text-xs font-medium text-[#86868b] mt-1">
              Unlocked achievements (+{stats.badgesEarned * 75} XP)
            </span>
          </div>

          <div className="flex flex-col px-2">
            <span className="text-[#86868b] font-black text-[11px] uppercase tracking-widest mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C84200]" /> Shanti Reading
            </span>
            <span className="text-4xl font-black text-[#1D1D1F] tracking-tight">
              {Math.floor(stats.readingMinutes / 60)}
              <span className="text-lg text-[#1d1d1f]/40 ml-0.5">h</span>{" "}
              {stats.readingMinutes % 60}
              <span className="text-lg text-[#1d1d1f]/40 ml-0.5">m</span>
            </span>
            <span className="text-xs font-medium text-[#86868b] mt-1">
              Focused reading (+{stats.readingMinutes * 2} XP)
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="relative mt-8 pt-4">
          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-[#1D1D1F] mb-3">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/doodle-star.png"
                  alt="star"
                  className="w-full h-full object-contain"
                />
              </span>
              Level {computed.level} • {computed.rankTitle}
            </span>
            <span className="text-[#86868b] flex items-center gap-1">
              {computed.xpIntoLevel} / {computed.xpForNextLevel} XP to Level{" "}
              {computed.level + 1} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="h-2.5 w-full bg-[#F2EBE1] rounded-full overflow-hidden border border-[#1d1d1f]/5">
            <div
              className="h-full bg-[#C84200] rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${computed.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Inline Edit Profile & Quote Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
                <div>
                  <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                    Edit Profile & Literary Quote
                  </h2>
                  <p className="text-xs font-medium text-[#86868b] mt-0.5">
                    Customize how your reader card and quote appear across AksharSetu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-[#e8e8ed] flex items-center justify-center text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ProfileForm
                user={user}
                onSuccess={() => setIsEditing(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
