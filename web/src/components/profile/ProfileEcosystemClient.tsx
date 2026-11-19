"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  MapPin,
  Calendar,
  BookOpen,
  Award,
  ShieldCheck,
  Pencil,
  Quote,
  MessageCircle,
  Trophy,
  X,
  Flame,
  Sparkles,
  Share2,
  UserPlus,
  UserCheck,
  Pin,
  Lock,
  CheckCircle2,
  Clock,
  Star,
  HeartHandshake,
  Search,
  Activity,
  Gift,
  Palette,
  Ban,
  ShieldAlert,
  ChevronRight,
} from "lucide-react"
import {
  RARITY_CONFIG,
  COSMETIC_CATALOG,
  type BadgeRarity,
} from "@/lib/gamification"
import { BookCard } from "@/components/catalog/BookCard"
import { ProfileForm } from "./ProfileForm"
import { VectorBadgeArtwork } from "./VectorBadgeArtwork"
import { ContributionGraph, type DailyContribution } from "./ContributionGraph"

type MainTab =
  | "overview"
  | "reading"
  | "achievements"
  | "quests"
  | "activity"

const FRAME_STYLES: Record<string, string> = {
  classic: "ring-4 ring-white/25",
  cobalt: "ring-4 ring-[#0066cc] shadow-[0_0_24px_rgba(0,102,204,0.55)]",
  saffron: "ring-4 ring-[#C84200] shadow-[0_0_24px_rgba(200,66,0,0.55)]",
  emerald: "ring-4 ring-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.55)]",
  gold: "ring-4 ring-amber-400 shadow-[0_0_28px_rgba(251,191,36,0.65)]",
  mythic: "ring-4 ring-rose-500 shadow-[0_0_28px_rgba(244,63,94,0.65)]",
}

const BANNER_STYLES: Record<string, string> = {
  obsidian: "bg-[#000000]",
  cobalt_grid: "bg-[#061224]",
  library_dawn: "bg-[#1A0E08]",
  emerald_grove: "bg-[#071912]",
}

export function ProfileEcosystemClient({
  profileUser,
  computedStats,
  detailedMetrics,
  allAchievements,
  contributions,
  activityFeed,
  questsData,
  xpLedger,
  isOwnProfile,
  initialFollowing,
  initialTab = "overview",
}: {
  profileUser: any
  computedStats: any
  detailedMetrics: {
    booksRead: number
    booksCurrentlyReading: number
    booksWantToRead: number
    totalReadingSessions: number
    readingMinutes: number
    reviewsPublished: number
    notesPublished: number
    booksListed: number
    booksSold: number
    purchasesCount: number
    booksDonated: number
    clubPostsCount: number
    followersCount: number
    followingCount: number
    leaderboardRank: number | null
  }
  allAchievements: {
    id: string
    code: string | null
    name: string
    description: string
    category: string
    rarity: string
    requirementThreshold: number
    xpReward: number
    pointsReward: number
    unlocked: boolean
    earnedAt: string | null
    isPinned: boolean
    progress: number
  }[]
  contributions: Record<string, DailyContribution>
  activityFeed: {
    id: string
    type: string
    title: string
    subtitle?: string | null
    xpEarned: number
    occurredAt: string
  }[]
  questsData: {
    dailyCheckedInToday: boolean
    dailyClaimStreak: number
    quests: {
      id: string
      code: string
      name: string
      description: string
      category: string
      targetCount: number
      progress: number
      rewardXp: number
      rewardPoints: number
      cosmeticReward: string | null
      completed: boolean
      claimed: boolean
    }[]
  }
  xpLedger: {
    id: string
    eventType: string
    xpAmount: number
    pointsAmount: number
    description: string
    createdAt: string
  }[]
  isOwnProfile: boolean
  initialFollowing: boolean
  initialTab?: string
}) {
  const router = useRouter()
  const validInitialTab = ["overview", "reading", "achievements", "quests", "activity"].includes(
    initialTab
  )
    ? (initialTab as MainTab)
    : "overview"

  const [activeTab, setActiveTab] = useState<MainTab>(validInitialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(
    detailedMetrics.followersCount
  )
  const [followBusy, setFollowBusy] = useState(false)

  // Achievements Filtering & Modal
  const [badgeCategory, setBadgeCategory] = useState<string>("ALL")
  const [badgeRarity, setBadgeRarity] = useState<string>("ALL")
  const [badgeSearch, setBadgeSearch] = useState("")
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<
    (typeof allAchievements)[number] | null
  >(null)
  const [pinningId, setPinningId] = useState<string | null>(null)

  // Quests, Check-In & Level-Up Celebration
  const [checkedInToday, setCheckedInToday] = useState(
    questsData.dailyCheckedInToday
  )
  const [claimingCheckin, setClaimingCheckin] = useState(false)
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null)
  const [equippingCosmeticId, setEquippingCosmeticId] = useState<string | null>(
    null
  )
  const [celebrationBanner, setCelebrationBanner] = useState<string | null>(
    null
  )

  const pinnedAchievements = allAchievements.filter(
    (a) => a.unlocked && a.isPinned
  )
  const unlockedAchievements = allAchievements.filter((a) => a.unlocked)
  const rareOrHigherCount = unlockedAchievements.filter((a) =>
    ["RARE", "EPIC", "LEGENDARY", "MYTHIC"].includes(a.rarity)
  ).length

  const handleFollowToggle = async () => {
    if (followBusy) return
    setFollowBusy(true)
    try {
      const res = await fetch(`/api/users/${profileUser.id}/follow`, {
        method: "POST",
      })
      if (res.status === 401) {
        router.push("/login")
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not update follow")
      setFollowing(data.following)
      setFollowersCount(data.followersCount)
      toast.success(
        data.following
          ? `Following ${profileUser.name}`
          : `Unfollowed ${profileUser.name}`
      )
    } catch (err: any) {
      toast.error(err.message || "Action failed")
    } finally {
      setFollowBusy(false)
    }
  }

  const handleDailyCheckin = async () => {
    if (claimingCheckin || checkedInToday) return
    setClaimingCheckin(true)
    try {
      const res = await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "daily_checkin" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Check-in failed")
      setCheckedInToday(true)
      setCelebrationBanner(
        `+${data.xpAwarded} XP & +${data.pointsAwarded} Akshar Points earned (Day ${data.dailyClaimStreak} Check-in)${
          data.leveledUp ? ` · 🎉 LEVEL UP TO LEVEL ${data.newLevel}!` : ""
        }`
      )
      toast.success(`Daily Check-in claimed! +${data.xpAwarded} XP`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not claim check-in")
    } finally {
      setClaimingCheckin(false)
    }
  }

  const handleClaimQuest = async (questId: string) => {
    if (claimingQuestId) return
    setClaimingQuestId(questId)
    try {
      const res = await fetch("/api/gamification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim_quest", questId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not claim quest")
      setCelebrationBanner(
        `Quest Completed! +${data.xpAwarded} XP & +${data.pointsAwarded} Akshar Points${
          data.leveledUp ? ` · 🎉 LEVEL UP TO LEVEL ${data.newLevel}!` : ""
        }`
      )
      toast.success(`Quest reward claimed! +${data.xpAwarded} XP`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not claim quest")
    } finally {
      setClaimingQuestId(null)
    }
  }

  const handlePinBadge = async (badgeId: string, nextPinned: boolean) => {
    if (!isOwnProfile || pinningId) return
    setPinningId(badgeId)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pin_badge",
          badgeId,
          isPinned: nextPinned,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not update showcase")
      toast.success(
        nextPinned ? "Pinned to profile showcase!" : "Removed from showcase"
      )
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not pin badge")
    } finally {
      setPinningId(null)
    }
  }

  const handleUnlockOrEquipCosmetic = async (cosmeticId: string) => {
    if (equippingCosmeticId) return
    setEquippingCosmeticId(cosmeticId)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlock_cosmetic", cosmeticId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not equip cosmetic")
      toast.success("Cosmetic equipped on your profile!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not equip cosmetic")
    } finally {
      setEquippingCosmeticId(null)
    }
  }

  const handleCopyProfileLink = () => {
    if (typeof window === "undefined") return
    const url = `${window.location.origin}/profile/${
      profileUser.username || profileUser.id
    }`
    navigator.clipboard.writeText(url)
    toast.success("Public profile link copied to clipboard!")
  }

  const filteredAchievements = allAchievements.filter((a) => {
    if (badgeCategory !== "ALL" && a.category !== badgeCategory) return false
    if (badgeRarity !== "ALL" && a.rarity !== badgeRarity) return false
    if (badgeSearch.trim()) {
      const q = badgeSearch.toLowerCase()
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      )
    }
    return true
  })

  const frameClass =
    FRAME_STYLES[profileUser.profileFrame || "classic"] || FRAME_STYLES.classic
  const bannerClass =
    BANNER_STYLES[profileUser.coverImage || "obsidian"] ||
    BANNER_STYLES.obsidian

  const goalBooks = Math.max(1, profileUser.readingGoalBooks || 12)
  const goalPercent = Math.min(
    100,
    Math.round((detailedMetrics.booksRead / goalBooks) * 100)
  )

  return (
    <div className="space-y-6">
      {/* Level-Up / Reward Celebration Banner */}
      <AnimatePresence>
        {celebrationBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#000000] text-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0066cc] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-bold">{celebrationBanner}</p>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationBanner(null)}
              className="p-1 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A. PROFILE IDENTITY HEADER (Deep Black High-Contrast Hero Card per AGENTS.md) */}
      <div
        className={`${bannerClass} text-[#f5f5f7] rounded-2xl border border-white/10 shadow-sm overflow-hidden`}
      >
        <div className="p-6 md:p-8 space-y-6">
          {/* Top Identity Row */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Framed Avatar + Level Pill */}
              <div className="relative shrink-0">
                <div
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-[#1d1d1f] flex items-center justify-center ${frameClass}`}
                >
                  {profileUser.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileUser.image}
                      alt={profileUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">
                      {(profileUser.name || "R").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#0066cc] text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow">
                  LVL {computedStats.level}
                </span>

                {profileUser.showOnlineStatus && profileUser.online && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-black"
                    title="Online now"
                  />
                )}
              </div>

              {/* Name, @username, Equipped Title, Bio, Metadata */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider">
                    {profileUser.selectedTitle || computedStats.rankTitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0066cc]/25 text-[#66b3ff] text-[11px] font-bold">
                    {computedStats.totalXP.toLocaleString()} XP
                  </span>
                  {isOwnProfile && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">
                      {profileUser.aksharPoints || 0} AP
                    </span>
                  )}
                  {profileUser.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C84200]/25 text-[#ff9d66] text-[11px] font-bold">
                      <Flame className="w-3 h-3" /> {profileUser.currentStreak}d
                      streak
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-baseline gap-2.5">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                    {profileUser.name}
                  </h1>
                  <span className="text-sm font-medium text-[#86868b]">
                    @{profileUser.username}
                  </span>
                  {profileUser.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {profileUser.showOnlineStatus &&
                  (profileUser.isShantiModeActive || profileUser.liveStatus) && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {profileUser.liveStatus || "Reading in Shanti Mode"}
                    </p>
                  )}

                <p className="text-sm text-[#86868b] max-w-xl leading-relaxed">
                  {profileUser.bio ||
                    "Reader, book collector, and community member on AksharSetu."}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-[#86868b]">
                  {profileUser.location && (
                    <span className="flex items-center gap-1 text-white/80">
                      <MapPin className="w-3.5 h-3.5 text-[#0066cc]" />
                      {profileUser.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Joined{" "}
                    {format(new Date(profileUser.createdAt), "MMM yyyy")}
                  </span>
                  <span>
                    <strong className="text-white">{followersCount}</strong>{" "}
                    followers
                  </span>
                  <span>
                    <strong className="text-white">
                      {detailedMetrics.followingCount}
                    </strong>{" "}
                    following
                  </span>
                  {detailedMetrics.leaderboardRank && (
                    <Link
                      href="/leaderboard"
                      className="text-[#66b3ff] hover:underline flex items-center gap-1"
                    >
                      <Trophy className="w-3.5 h-3.5" /> Rank #
                      {detailedMetrics.leaderboardRank}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    disabled={checkedInToday || claimingCheckin}
                    onClick={handleDailyCheckin}
                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      checkedInToday
                        ? "bg-white/10 text-white/60"
                        : "bg-[#0066cc] hover:bg-[#0071e3] text-white shadow-sm"
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    {checkedInToday
                      ? `Checked In (${questsData.dailyClaimStreak}d)`
                      : "Daily Check-In (+25 XP)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-full bg-white text-[#1d1d1f] hover:bg-[#e8e8ed] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Customize Profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={followBusy}
                    onClick={handleFollowToggle}
                    className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      following
                        ? "bg-white/15 hover:bg-white/25 text-white"
                        : "bg-white text-[#1d1d1f] hover:bg-[#e8e8ed]"
                    }`}
                  >
                    {following ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Follow
                      </>
                    )}
                  </button>
                  <Link
                    href={`/messages/${profileUser.id}`}
                    className="px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleCopyProfileLink}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Copy public profile link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* XP Level Progression Bar */}
          <div className="pt-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold">
              <span className="text-white flex items-center gap-2">
                Level {computedStats.level} ·{" "}
                {profileUser.selectedTitle || computedStats.rankTitle}
              </span>
              <span className="text-[#86868b]">
                {computedStats.xpIntoLevel.toLocaleString()} /{" "}
                {computedStats.xpForNextLevel.toLocaleString()} XP to Level{" "}
                {computedStats.level + 1} ({computedStats.progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0066cc] transition-all duration-700"
                style={{ width: `${computedStats.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Pinned Badges Strip + Literary Quote */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-white/10">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                  Pinned Achievement Showcase ({pinnedAchievements.length}/5)
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("achievements")}
                  className="text-[11px] font-bold text-[#66b3ff] hover:underline cursor-pointer"
                >
                  View all {unlockedAchievements.length}/
                  {allAchievements.length} &rarr;
                </button>
              </div>
              {pinnedAchievements.length === 0 ? (
                <div className="flex flex-wrap gap-2">
                  {unlockedAchievements.slice(0, 4).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBadgeModal(b)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-left transition-colors cursor-pointer"
                    >
                      <VectorBadgeArtwork
                        code={b.code}
                        name={b.name}
                        category={b.category}
                        rarity={b.rarity}
                        size={28}
                      />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {b.name}
                        </p>
                        <p className="text-[10px] text-[#86868b] uppercase font-semibold">
                          {b.rarity}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pinnedAchievements.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBadgeModal(b)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition-colors cursor-pointer"
                    >
                      <VectorBadgeArtwork
                        code={b.code}
                        name={b.name}
                        category={b.category}
                        rarity={b.rarity}
                        size={28}
                      />
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {b.name}
                        </p>
                        <p className="text-[10px] text-[#66b3ff] uppercase font-semibold">
                          Pinned · {b.rarity}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-xl bg-white/[0.06] border border-white/10 p-4 flex flex-col justify-between">
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-[#66b3ff] shrink-0 mt-0.5" />
                <p className="text-xs italic text-white/90 line-clamp-2 leading-relaxed">
                  “
                  {profileUser.favoriteQuote ||
                    "A reader lives a thousand lives before he dies."}
                  ”
                </p>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] text-right mt-2">
                — {profileUser.quoteAuthor || "George R.R. Martin"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: "overview", label: "Overview & Stats", icon: Activity },
            {
              id: "reading",
              label: `Reading & Listings (${
                profileUser.libraryBooks.length + profileUser.books.length
              })`,
              icon: BookOpen,
            },
            {
              id: "achievements",
              label: `Achievements (${unlockedAchievements.length}/${allAchievements.length})`,
              icon: Award,
            },
            ...(isOwnProfile
              ? [
                  {
                    id: "quests" as MainTab,
                    label: "Quests, Check-In & Cosmetics",
                    icon: Gift,
                  },
                ]
              : []),
            {
              id: "activity",
              label: "Activity Timeline",
              icon: Clock,
            },
          ] as { id: MainTab; label: string; icon: any }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#1d1d1f] text-white shadow-sm"
                : "bg-white text-[#86868b] hover:text-[#1d1d1f] border border-black/5"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW, MULTI-DOMAIN STATISTICS & CONTRIBUTION GRAPH */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* B. 4-Domain Statistics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Domain 1: Reading Stats */}
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066cc]">
                  Reading Journey
                </span>
                <BookOpen className="w-4 h-4 text-[#0066cc]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {detailedMetrics.booksRead}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Books Completed
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {detailedMetrics.booksCurrentlyReading}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Currently Reading
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f]">
                    {Math.floor(detailedMetrics.readingMinutes / 60)}h{" "}
                    {detailedMetrics.readingMinutes % 60}m
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    {detailedMetrics.totalReadingSessions} Shanti Sessions
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f]">
                    {detailedMetrics.booksWantToRead}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Reading List
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-black/5">
                <div className="flex justify-between text-[10px] font-bold text-[#86868b] mb-1">
                  <span>
                    Annual Goal: {detailedMetrics.booksRead}/{goalBooks} books
                  </span>
                  <span>{goalPercent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#f5f5f7] overflow-hidden">
                  <div
                    className="h-full bg-[#0066cc] rounded-full"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Domain 2: Marketplace Reputation */}
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Marketplace & Trust
                </span>
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {detailedMetrics.booksListed}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Books Listed
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {detailedMetrics.booksDonated}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Vidya Daan
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f]">
                    {detailedMetrics.booksSold +
                      detailedMetrics.purchasesCount}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Completed Trades
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f] flex items-center gap-1">
                    {Number(profileUser.sellerRating || 5).toFixed(1)}
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    {profileUser.responseTime || "Fast"} Response
                  </p>
                </div>
              </div>
            </div>

            {/* Domain 3: Community Impact */}
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C84200]">
                  Community & Reviews
                </span>
                <MessageCircle className="w-4 h-4 text-[#C84200]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {detailedMetrics.reviewsPublished +
                      detailedMetrics.notesPublished}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Reviews & Notes
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {detailedMetrics.clubPostsCount}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Sabha Discussions
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f]">
                    {followersCount}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Followers
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f]">
                    {detailedMetrics.followingCount}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Following
                  </p>
                </div>
              </div>
            </div>

            {/* Domain 4: Gamification & Progression */}
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Progression & Rank
                </span>
                <Trophy className="w-4 h-4 text-purple-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {computedStats.totalXP.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Lifetime XP
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1d1d1f]">
                    {unlockedAchievements.length}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Badges ({rareOrHigherCount} Rare+)
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f]">
                    {profileUser.currentStreak}d
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Best: {profileUser.longestStreak}d
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#1d1d1f]">
                    {detailedMetrics.leaderboardRank
                      ? `#${detailedMetrics.leaderboardRank}`
                      : "—"}
                  </p>
                  <p className="text-[11px] font-medium text-[#86868b]">
                    Global Rank
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* C. GitHub-Style 365-Day Contribution Heatmap */}
          {(isOwnProfile || profileUser.showContributionGraph) && (
            <ContributionGraph
              contributions={contributions}
              currentStreak={profileUser.currentStreak || 0}
              longestStreak={profileUser.longestStreak || 0}
            />
          )}

          {/* Quick Preview of Reading Shelf & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#1d1d1f] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0066cc]" /> Reading
                  Showcase
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("reading")}
                  className="text-xs font-bold text-[#0066cc] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Full Shelf <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {profileUser.libraryBooks.length === 0 ? (
                <p className="text-xs font-medium text-[#86868b] py-6 text-center">
                  No books added to reading room yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profileUser.libraryBooks.slice(0, 4).map((lb: any) => {
                    const pct = Math.min(
                      100,
                      Math.round(
                        ((lb.currentPage || 1) / Math.max(1, lb.totalPages || 250)) *
                          100
                      )
                    )
                    return (
                      <div
                        key={lb.id}
                        className="p-3 rounded-xl bg-[#f5f5f7] flex items-center gap-3"
                      >
                        <div className="w-11 h-15 rounded-lg bg-[#e8e8ed] overflow-hidden shrink-0">
                          {lb.coverImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={lb.coverImage}
                              alt={lb.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="px-2 py-0.5 rounded-full bg-white text-[9px] font-bold uppercase text-[#0066cc]">
                            {lb.status.replace(/_/g, " ")}
                          </span>
                          <p className="font-bold text-xs text-[#1d1d1f] truncate">
                            {lb.title}
                          </p>
                          <p className="text-[10px] text-[#86868b] truncate">
                            {lb.author}
                          </p>
                          <div className="h-1 rounded-full bg-black/10 overflow-hidden">
                            <div
                              className="h-full bg-[#0066cc]"
                              style={{
                                width: `${lb.status === "READ" ? 100 : pct}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#1d1d1f] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C84200]" /> Recent Milestones
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className="text-xs font-bold text-[#0066cc] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Full Timeline <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {activityFeed.length === 0 ? (
                <p className="text-xs font-medium text-[#86868b] py-6 text-center">
                  Activity milestones will appear here as books are read or
                  shared.
                </p>
              ) : (
                <div className="space-y-3">
                  {activityFeed.slice(0, 5).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-2 text-xs pb-2.5 border-b border-black/5 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#1d1d1f] truncate">
                          {act.title}
                        </p>
                        <p className="text-[10px] text-[#86868b]">
                          {formatDistanceToNow(new Date(act.occurredAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {act.xpEarned > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-bold shrink-0">
                          +{act.xpEarned} XP
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: READING SHOWCASE & MARKETPLACE LISTINGS */}
      {activeTab === "reading" && (
        <div className="space-y-8">
          {(isOwnProfile || profileUser.showReadingActivity) && (
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1d1d1f]">
                    Personal Reading Room ({profileUser.libraryBooks.length})
                  </h3>
                  <p className="text-xs text-[#86868b]">
                    Books currently reading, completed, and on the reading list.
                  </p>
                </div>
                {isOwnProfile && (
                  <Link
                    href="/ebooks"
                    className="px-4 py-2 rounded-full bg-[#0066cc] text-white text-xs font-bold"
                  >
                    Explore E-Library
                  </Link>
                )}
              </div>

              {profileUser.libraryBooks.length === 0 ? (
                <p className="text-sm text-[#86868b] py-8 text-center">
                  No books in reading showcase yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profileUser.libraryBooks.map((lb: any) => {
                    const pct =
                      lb.status === "READ"
                        ? 100
                        : Math.min(
                            100,
                            Math.round(
                              ((lb.currentPage || 1) /
                                Math.max(1, lb.totalPages || 250)) *
                                100
                            )
                          )
                    return (
                      <div
                        key={lb.id}
                        className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5 flex flex-col justify-between gap-3"
                      >
                        <div className="flex gap-3">
                          <div className="w-14 h-20 rounded-xl bg-[#e8e8ed] overflow-hidden shrink-0">
                            {lb.coverImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={lb.coverImage}
                                alt={lb.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mb-1 ${
                                lb.status === "READ"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : lb.status === "READING"
                                  ? "bg-[#0066cc]/15 text-[#0066cc]"
                                  : "bg-black/10 text-[#1d1d1f]"
                              }`}
                            >
                              {lb.status.replace(/_/g, " ")}
                            </span>
                            <h4 className="font-bold text-xs text-[#1d1d1f] line-clamp-2">
                              {lb.title}
                            </h4>
                            <p className="text-[11px] text-[#86868b] truncate mt-0.5">
                              {lb.author}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-[#86868b]">
                            <span>
                              Page {lb.currentPage || 1} of{" "}
                              {lb.totalPages || 250}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                            <div
                              className="h-full bg-[#0066cc]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Marketplace Listings */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1d1d1f]">
                  Marketplace & Vidya Daan Listings ({profileUser.books.length})
                </h3>
                <p className="text-xs text-[#86868b]">
                  Physical books listed for sale, 1-for-1 swap, or free
                  community donation.
                </p>
              </div>
              {isOwnProfile && (
                <Link
                  href="/catalog/new"
                  className="px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-bold"
                >
                  + List a Book
                </Link>
              )}
            </div>

            {profileUser.books.length === 0 ? (
              <p className="text-sm text-[#86868b] py-8 text-center">
                No marketplace books listed yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {profileUser.books.map((book: any) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACHIEVEMENTS & BADGE VAULT */}
      {activeTab === "achievements" && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1d1d1f]">
                Achievement & Badge Vault ({unlockedAchievements.length}/
                {allAchievements.length} Unlocked)
              </h3>
              <p className="text-xs text-[#86868b]">
                {isOwnProfile
                  ? "Click any unlocked badge to inspect details or pin up to 5 badges to your profile header."
                  : "Verified achievements earned across Reading, Reviews, Marketplace, Donations, and Community."}
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={badgeSearch}
                onChange={(e) => setBadgeSearch(e.target.value)}
                placeholder="Search achievements..."
                className="w-full h-9 pl-9 pr-3 rounded-full bg-[#f5f5f7] text-xs font-medium text-[#1d1d1f] outline-none"
              />
            </div>
          </div>

          {/* Category & Rarity Filters */}
          <div className="flex flex-col gap-3 pb-2 border-b border-black/5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide max-w-full">
              {[
                "ALL",
                "READING",
                "REVIEW",
                "MARKETPLACE",
                "DONATION",
                "COMMUNITY",
                "PROGRESSION",
                "SEASONAL",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBadgeCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                    badgeCategory === cat
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide max-w-full">
              {[
                "ALL",
                "COMMON",
                "UNCOMMON",
                "RARE",
                "EPIC",
                "LEGENDARY",
                "MYTHIC",
              ].map((rar) => (
                <button
                  key={rar}
                  type="button"
                  onClick={() => setBadgeRarity(rar)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer ${
                    badgeRarity === rar
                      ? "bg-[#0066cc] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  {rar}
                </button>
              ))}
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((badge) => {
              const rConf =
                RARITY_CONFIG[badge.rarity as BadgeRarity] ||
                RARITY_CONFIG.COMMON
              const pct = badge.unlocked
                ? 100
                : Math.min(
                    100,
                    Math.round(
                      (badge.progress /
                        Math.max(1, badge.requirementThreshold)) *
                        100
                    )
                  )

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadgeModal(badge)}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    badge.unlocked
                      ? `${rConf.bg} ${rConf.border} hover:shadow-md`
                      : "bg-[#f5f5f7]/60 border-black/5 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="shrink-0">
                      <VectorBadgeArtwork
                        code={badge.code}
                        name={badge.name}
                        category={badge.category}
                        rarity={badge.rarity}
                        unlocked={badge.unlocked}
                        size={54}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${rConf.badgeBg} ${rConf.text}`}
                        >
                          {rConf.label} · {badge.category}
                        </span>
                        <span className="text-[10px] font-bold text-[#0066cc]">
                          +{badge.xpReward} XP
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1d1d1f] truncate">
                        {badge.name}
                      </h4>
                      <p className="text-xs text-[#86868b] line-clamp-2 mt-0.5">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-black/5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      {badge.unlocked ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked{" "}
                          {badge.earnedAt
                            ? format(new Date(badge.earnedAt), "MMM d, yyyy")
                            : ""}
                        </span>
                      ) : (
                        <span className="text-[#86868b] flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Progress:{" "}
                          {Math.min(badge.progress, badge.requirementThreshold)}{" "}
                          / {badge.requirementThreshold}
                        </span>
                      )}

                      {isOwnProfile && badge.unlocked && (
                        <button
                          type="button"
                          disabled={pinningId === badge.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePinBadge(badge.id, !badge.isPinned)
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                            badge.isPinned
                              ? "bg-[#0066cc] text-white"
                              : "bg-white hover:bg-[#e8e8ed] text-[#1d1d1f] border border-black/10"
                          }`}
                        >
                          <Pin className="w-2.5 h-2.5" />
                          {badge.isPinned ? "Pinned" : "Pin"}
                        </button>
                      )}
                    </div>

                    <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          badge.unlocked ? "bg-emerald-600" : "bg-[#0066cc]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 4: QUESTS, DAILY CHECK-IN & COSMETIC ECONOMY (Own Profile) */}
      {activeTab === "quests" && isOwnProfile && (
        <div className="space-y-6">
          {/* Active Quests & Official Events */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#0066cc]" /> Daily Quests,
                  Weekly Challenges & Official Events
                </h3>
                <p className="text-xs text-[#86868b]">
                  Complete verified reading and community milestones to claim
                  server-validated XP and Akshar Points (AP).
                </p>
              </div>
              <button
                type="button"
                disabled={checkedInToday || claimingCheckin}
                onClick={handleDailyCheckin}
                className={`px-5 py-2.5 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                  checkedInToday
                    ? "bg-[#f5f5f7] text-[#86868b]"
                    : "bg-[#0066cc] hover:bg-[#0071e3] text-white"
                }`}
              >
                {checkedInToday
                  ? `✓ Daily Check-In Claimed (Streak: ${questsData.dailyClaimStreak}d)`
                  : "Claim Daily Check-In (+25 XP · +15 AP)"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questsData.quests.map((q) => {
                const pct = Math.min(
                  100,
                  Math.round((q.progress / Math.max(1, q.targetCount)) * 100)
                )
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            q.category === "EVENT"
                              ? "bg-purple-100 text-purple-800"
                              : q.category === "WEEKLY"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-[#0066cc]/15 text-[#0066cc]"
                          }`}
                        >
                          {q.category} QUEST
                        </span>
                        <span className="text-xs font-bold text-[#0066cc]">
                          +{q.rewardXp} XP · +{q.rewardPoints} AP
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1d1d1f]">
                        {q.name}
                      </h4>
                      <p className="text-xs text-[#86868b]">{q.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#86868b]">
                          Progress: {q.progress} / {q.targetCount}
                        </span>
                        {q.claimed ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reward
                            Claimed
                          </span>
                        ) : q.completed ? (
                          <button
                            type="button"
                            disabled={claimingQuestId === q.id}
                            onClick={() => handleClaimQuest(q.id)}
                            className="px-3.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            {claimingQuestId === q.id
                              ? "Claiming..."
                              : "Claim Reward"}
                          </button>
                        ) : (
                          <span className="text-[#86868b]">{pct}%</span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            q.completed ? "bg-emerald-600" : "bg-[#0066cc]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cosmetic Studio (Akshar Points & Level Unlocks) */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#0066cc]" /> Profile
                  Cosmetics & Showcase Vault
                </h3>
                <p className="text-xs text-[#86868b]">
                  Unlock frames and banners by reaching new Levels or spending{" "}
                  <strong>Akshar Points (AP)</strong>. XP is permanent
                  progression and is never spent.
                </p>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                Balance: {profileUser.aksharPoints || 0} Akshar Points (AP)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COSMETIC_CATALOG.map((item) => {
                const isUnlocked =
                  computedStats.level >= item.minLevel ||
                  (profileUser.unlockedCosmetics || []).includes(item.id)
                const isEquipped =
                  (item.type === "frame" &&
                    profileUser.profileFrame === item.key) ||
                  (item.type === "banner" &&
                    profileUser.coverImage === item.key)

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/5 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">
                          {item.type}
                        </span>
                        <span className="text-[10px] font-bold text-[#86868b]">
                          Lvl {item.minLevel} or {item.pointsCost} AP
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1d1d1f]">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#86868b] mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isEquipped || equippingCosmeticId === item.id}
                      onClick={() => handleUnlockOrEquipCosmetic(item.id)}
                      className={`w-full py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        isEquipped
                          ? "bg-emerald-600 text-white"
                          : isUnlocked
                          ? "bg-[#1d1d1f] hover:bg-[#0066cc] text-white"
                          : "bg-white hover:bg-[#0066cc] hover:text-white text-[#1d1d1f] border border-black/10"
                      }`}
                    >
                      {isEquipped
                        ? "✓ Equipped"
                        : isUnlocked
                        ? "Equip Style"
                        : `Unlock (${item.pointsCost} AP)`}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY TIMELINE & VERIFIED XP LEDGER */}
      {activeTab === "activity" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#1d1d1f]">
              Meaningful Activity Timeline
            </h3>
            {activityFeed.length === 0 ? (
              <p className="text-sm text-[#86868b] py-8 text-center">
                No public activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-[#f5f5f7] flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc]">
                        {act.type.replace(/_/g, " ")}
                      </span>
                      <p className="font-bold text-sm text-[#1d1d1f]">
                        {act.title}
                      </p>
                      <p className="text-xs text-[#86868b]">
                        {formatDistanceToNow(new Date(act.occurredAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {act.xpEarned > 0 && (
                      <span className="px-3 py-1 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-xs font-bold shrink-0">
                        +{act.xpEarned} XP
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#1d1d1f]">
              XP Progression Ledger
            </h3>
            {xpLedger.length === 0 ? (
              <p className="text-xs text-[#86868b] py-6 text-center">
                Verified XP transactions will appear here as rewards are
                claimed.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {xpLedger.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[#f5f5f7] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#1d1d1f] truncate">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-[#86868b]">
                        {format(new Date(tx.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {tx.xpAmount !== 0 && (
                        <p className="font-bold text-[#0066cc]">
                          {tx.xpAmount > 0 ? `+${tx.xpAmount}` : tx.xpAmount} XP
                        </p>
                      )}
                      {tx.pointsAmount !== 0 && (
                        <p className="text-[10px] font-bold text-amber-700">
                          {tx.pointsAmount > 0
                            ? `+${tx.pointsAmount}`
                            : tx.pointsAmount}{" "}
                          AP
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedBadgeModal && (
          <div
            onClick={() => setSelectedBadgeModal(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-black/10 text-center"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBadgeModal(null)}
                  className="p-1.5 rounded-full bg-[#f5f5f7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-center">
                <VectorBadgeArtwork
                  code={selectedBadgeModal.code}
                  name={selectedBadgeModal.name}
                  category={selectedBadgeModal.category}
                  rarity={selectedBadgeModal.rarity}
                  unlocked={selectedBadgeModal.unlocked}
                  size={88}
                />
              </div>
              <div className="space-y-1.5">
                <span className="px-3 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-bold uppercase">
                  {selectedBadgeModal.rarity} · {selectedBadgeModal.category}
                </span>
                <h3 className="text-xl font-bold text-[#1d1d1f]">
                  {selectedBadgeModal.name}
                </h3>
                <p className="text-xs text-[#86868b] max-w-xs mx-auto">
                  {selectedBadgeModal.description}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f5f5f7] flex items-center justify-around text-xs font-bold">
                <div>
                  <p className="text-[10px] uppercase text-[#86868b]">
                    XP Reward
                  </p>
                  <p className="text-[#0066cc]">
                    +{selectedBadgeModal.xpReward} XP
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#86868b]">
                    Cosmetic Points
                  </p>
                  <p className="text-amber-700">
                    +{selectedBadgeModal.pointsReward} AP
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-[#86868b]">Status</p>
                  <p className="text-[#1d1d1f]">
                    {selectedBadgeModal.unlocked
                      ? "Unlocked"
                      : `${selectedBadgeModal.progress}/${selectedBadgeModal.requirementThreshold}`}
                  </p>
                </div>
              </div>

              {isOwnProfile && selectedBadgeModal.unlocked && (
                <button
                  type="button"
                  onClick={() => {
                    handlePinBadge(
                      selectedBadgeModal.id,
                      !selectedBadgeModal.isPinned
                    )
                    setSelectedBadgeModal(null)
                  }}
                  className="w-full py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-bold cursor-pointer"
                >
                  {selectedBadgeModal.isPinned
                    ? "Unpin from Profile Showcase"
                    : "Pin to Profile Showcase"}
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customize Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div
            onClick={() => setIsEditing(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-black/5">
                <div>
                  <h2 className="text-xl font-bold text-[#1d1d1f]">
                    Customize Identity, Cosmetics & Privacy
                  </h2>
                  <p className="text-xs text-[#86868b]">
                    Manage your public showcase, frame, banner, quote, and
                    privacy preferences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-full bg-[#f5f5f7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ProfileForm
                user={profileUser}
                onSuccess={() => setIsEditing(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
