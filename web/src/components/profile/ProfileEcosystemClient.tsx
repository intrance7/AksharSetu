"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
  AtSign,
  Loader2,
  Check,
  Link2,
  Copy,
  ArrowUpRight,
} from "lucide-react"
import {
  RARITY_CONFIG,
  COSMETIC_CATALOG,
  type BadgeRarity,
} from "@/lib/gamification"
import { BookCard } from "@/components/catalog/BookCard"
import { GeneratedCover } from "@/components/catalog/GeneratedCover"
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
  obsidian:
    "bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,178,43,0.08),transparent_50%)]",
  cobalt_grid:
    "bg-[#061224] bg-[radial-gradient(ellipse_at_top_right,rgba(0,102,204,0.32),transparent_58%)]",
  library_dawn:
    "bg-[#1A0E08] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.34),transparent_58%)]",
  emerald_grove:
    "bg-[#071912] bg-[radial-gradient(ellipse_at_top_right,rgba(10,125,79,0.32),transparent_58%)]",
}

const COSMETIC_SWATCHES: Record<string, string> = {
  classic: "bg-gradient-to-br from-neutral-600 to-neutral-900 ring-2 ring-white/40",
  cobalt: "bg-gradient-to-br from-[#0066cc] to-[#003b7a] ring-2 ring-[#66b3ff]",
  saffron: "bg-gradient-to-br from-[#C84200] to-[#F4B22B] ring-2 ring-[#FF9A68]",
  emerald: "bg-gradient-to-br from-[#0A7D4F] to-[#04492E] ring-2 ring-emerald-400",
  gold: "bg-gradient-to-br from-amber-300 to-amber-600 ring-2 ring-amber-200",
  mythic: "bg-gradient-to-br from-rose-500 to-orange-500 ring-2 ring-rose-300",
  obsidian: "bg-[#0B0B0D] border border-white/20",
  cobalt_grid: "bg-gradient-to-r from-[#061224] to-[#004499]",
  library_dawn: "bg-gradient-to-r from-[#1A0E08] to-[#C84200]",
  emerald_grove: "bg-gradient-to-r from-[#071912] to-[#0A7D4F]",
}

function sanitizeHandlePreview(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24)
    .replace(/_+$/g, "")
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
  const { update: updateSession } = useSession()
  const validInitialTab = ["overview", "reading", "achievements", "quests", "activity"].includes(
    initialTab
  )
    ? (initialTab as MainTab)
    : "overview"

  const [activeTab, setActiveTab] = useState<MainTab>(validInitialTab)
  const [isEditing, setIsEditing] = useState(false)
  const [handleDraft, setHandleDraft] = useState<string>(
    profileUser.username || ""
  )
  const [savingHandle, setSavingHandle] = useState(false)
  const [handleError, setHandleError] = useState<string | null>(null)
  const [copiedHandle, setCopiedHandle] = useState(false)
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
    setCopiedHandle(true)
    setTimeout(() => setCopiedHandle(false), 1800)
    toast.success("Public profile link copied to clipboard!")
  }

  const openProfileSettings = () => {
    setHandleDraft(profileUser.username || "")
    setHandleError(null)
    setIsEditing(true)
  }

  const previewHandle = sanitizeHandlePreview(handleDraft)

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingHandle) return
    const clean = sanitizeHandlePreview(handleDraft)
    if (clean.length < 3 || clean.length > 24) {
      setHandleError(
        "Username must be 3–24 characters using letters, numbers, or underscores."
      )
      return
    }
    if (clean === profileUser.username) {
      toast.info(`You already own @${clean}`)
      return
    }

    setSavingHandle(true)
    setHandleError(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.error || "Could not update @username"
        setHandleError(msg)
        toast.error(msg)
        return
      }
      await updateSession().catch(() => {})
      toast.success(`Profile URL updated to /profile/${data.username}`)
      setIsEditing(false)
      if (data?.username && data.username !== profileUser.username) {
        router.replace(`/profile/${data.username}`)
      }
      router.refresh()
    } catch (err: any) {
      const msg = err?.message || "Could not update @username"
      setHandleError(msg)
      toast.error(msg)
    } finally {
      setSavingHandle(false)
    }
  }

  const handleProfileFormSuccess = async () => {
    setIsEditing(false)
    try {
      const res = await fetch("/api/profile", { cache: "no-store" })
      if (res.ok) {
        const latest = await res.json()
        await updateSession().catch(() => {})
        if (latest?.username && latest.username !== profileUser.username) {
          setHandleDraft(latest.username)
          router.replace(`/profile/${latest.username}`)
          return
        }
      }
    } catch {}
    router.refresh()
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

  const showcaseBadges =
    pinnedAchievements.length > 0
      ? pinnedAchievements
      : unlockedAchievements.slice(0, 4)

  return (
    <div>
      {/* A. FULL-BLEED OBSIDIAN EDITORIAL READER PASSPORT HERO */}
      <section
        className={`relative ${bannerClass} text-[#F5F5F7] border-b border-white/10 overflow-hidden`}
      >
        {/* Subtle editorial dot texture matching catalog aesthetic */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-10 md:pt-14 md:pb-12 relative z-10 space-y-8">
          {/* Level-Up / Reward Celebration Banner */}
          <AnimatePresence>
            {celebrationBanner && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/10 backdrop-blur-md text-white rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/15"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C84200] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold">{celebrationBanner}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCelebrationBanner(null)}
                  className="p-1.5 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Identity Row */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-7 min-w-0">
              {/* Framed Avatar + Level Pill */}
              <div className="relative shrink-0">
                <div
                  className={`w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#2B2726] to-[#141316] flex items-center justify-center ${frameClass}`}
                >
                  {profileUser.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileUser.image}
                      alt={profileUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl md:text-5xl font-black tracking-tighter text-[#F2EBE1]">
                      {(profileUser.name || "R").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#C84200] text-[#FAF6F0] text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-md border border-black/40">
                  LVL {computedStats.level}
                </span>

                {profileUser.showOnlineStatus && profileUser.online && (
                  <span
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-[#0B0B0D]"
                    title="Online now"
                  />
                )}
              </div>

              {/* Name, @username, Equipped Title, Bio, Metadata */}
              <div className="space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[#F2EBE1] text-xs sm:text-[13px] font-black uppercase tracking-wider">
                    {profileUser.selectedTitle || computedStats.rankTitle}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#C84200]/20 border border-[#C84200]/35 text-[#FF9A68] text-xs sm:text-[13px] font-bold">
                    {computedStats.totalXP.toLocaleString()} XP
                  </span>
                  {isOwnProfile && (
                    <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/25 text-amber-300 text-xs sm:text-[13px] font-bold">
                      {profileUser.aksharPoints || 0} AP
                    </span>
                  )}
                  {profileUser.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs sm:text-[13px] font-bold">
                      <Flame className="w-3.5 h-3.5" /> {profileUser.currentStreak}d
                      streak
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl sm:text-5xl md:text-[52px] font-black tracking-tight leading-none text-white">
                    {profileUser.name}
                  </h1>
                  <button
                    type="button"
                    onClick={handleCopyProfileLink}
                    title="Click to copy your public profile link"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-sm font-bold text-[#F4B22B] transition-colors cursor-pointer"
                  >
                    <span>@{profileUser.username}</span>
                    {copiedHandle ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-75" />
                    )}
                  </button>
                  {profileUser.verified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Reader
                    </span>
                  )}
                </div>

                {profileUser.showOnlineStatus &&
                  (profileUser.isShantiModeActive ||
                    profileUser.liveStatus) && (
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      {profileUser.liveStatus || "Reading in Shanti Mode"}
                    </p>
                  )}

                <p className="text-base md:text-lg text-white/75 max-w-2xl leading-relaxed">
                  {profileUser.bio ||
                    "Collecting well-loved editions, passing textbooks onward, and reading quietly on AksharSetu."}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm font-semibold text-white/65">
                  {profileUser.location && (
                    <span className="flex items-center gap-1.5 text-white/90">
                      <MapPin className="w-4 h-4 text-[#FF8A4C]" />
                      {profileUser.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Joined{" "}
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
                      className="text-[#F4B22B] hover:underline flex items-center gap-1.5 font-bold"
                    >
                      <Trophy className="w-4 h-4" /> Rank #
                      {detailedMetrics.leaderboardRank}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    disabled={checkedInToday || claimingCheckin}
                    onClick={handleDailyCheckin}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      checkedInToday
                        ? "bg-white/10 text-white/65 border border-white/10"
                        : "bg-[#C84200] hover:bg-[#A33500] text-white shadow-lg shadow-[#C84200]/25"
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    {checkedInToday
                      ? `Checked In (${questsData.dailyClaimStreak}d)`
                      : "Daily Check-In (+25 XP)"}
                  </button>
                  <button
                    type="button"
                    onClick={openProfileSettings}
                    className="px-5 py-2.5 rounded-full bg-[#F2EBE1] text-[#1D1D1F] hover:bg-white text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" /> Customize
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={followBusy}
                    onClick={handleFollowToggle}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                      following
                        ? "bg-white/15 hover:bg-white/25 text-white border border-white/15"
                        : "bg-[#F2EBE1] text-[#1D1D1F] hover:bg-white"
                    }`}
                  >
                    {following ? (
                      <>
                        <UserCheck className="w-4 h-4" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </button>
                  <Link
                    href={`/messages/${profileUser.id}`}
                    className="px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold flex items-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Message
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleCopyProfileLink}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors cursor-pointer"
                title="Share profile link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Warm Editorial Level Progress Bar */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
              <span className="text-[#F2EBE1] flex items-center gap-2">
                Level {computedStats.level} ·{" "}
                <span className="text-[#FF9A68]">
                  {profileUser.selectedTitle || computedStats.rankTitle}
                </span>
              </span>
              <span className="text-white/65 font-semibold">
                {computedStats.xpIntoLevel.toLocaleString()} /{" "}
                {computedStats.xpForNextLevel.toLocaleString()} XP to Level{" "}
                {computedStats.level + 1} ({computedStats.progressPercent}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden p-[2px]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#C84200] via-[#E85D04] to-[#F4B22B] transition-all duration-700"
                style={{ width: `${Math.max(3, computedStats.progressPercent)}%` }}
              />
            </div>
          </div>

          {/* Showcase Badges Strip + Literary Bookplate Quote */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-5 border-t border-white/10">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.14em] text-white/65">
                  {pinnedAchievements.length > 0
                    ? `Pinned Showcase (${pinnedAchievements.length}/5)`
                    : `Earned Badges (${unlockedAchievements.length} unlocked)`}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("achievements")}
                  className="text-sm font-bold text-[#FF9A68] hover:text-white transition-colors cursor-pointer"
                >
                  {isOwnProfile && pinnedAchievements.length === 0
                    ? `Pin up to 5 · View all ${unlockedAchievements.length}/${allAchievements.length} →`
                    : `View vault ${unlockedAchievements.length}/${allAchievements.length} →`}
                </button>
              </div>
              {showcaseBadges.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-5 py-4 text-sm text-white/70">
                  List a book, log a Shanti reading session, or join a Sabha
                  circle to unlock your first emblem.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {showcaseBadges.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBadgeModal(b)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/10 text-left transition-all cursor-pointer"
                    >
                      <VectorBadgeArtwork
                        code={b.code}
                        name={b.name}
                        category={b.category}
                        rarity={b.rarity}
                        size={36}
                      />
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">
                          {b.name}
                        </p>
                        <p className="text-[11px] text-white/60 uppercase font-bold tracking-wide mt-0.5">
                          {b.isPinned ? `Pinned · ${b.rarity}` : b.rarity}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-white/[0.04] border border-white/10 p-5 md:p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-[#F4B22B] shrink-0 mt-1" />
                <p className="text-base md:text-lg font-serif italic text-[#F2EBE1]/90 line-clamp-3 leading-relaxed">
                  “
                  {profileUser.favoriteQuote ||
                    "A reader lives a thousand lives before he dies."}
                  ”
                </p>
              </div>
              <p
                className="text-2xl text-[#F4B22B] text-right mt-3 font-[family-name:var(--font-caveat)] leading-none"
                style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
              >
                — {profileUser.quoteAuthor || "George R.R. Martin"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY EDITORIAL TAB BAR */}
      <div className="sticky top-16 z-30 bg-[#FAF6F0]/92 backdrop-blur-md border-b border-[#1D1D1F]/[0.08]">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 py-3.5 flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
          {(
            [
              { id: "overview", label: "Overview", icon: Activity },
              {
                id: "reading",
                label: `Shelf & Listings (${
                  profileUser.libraryBooks.length + profileUser.books.length
                })`,
                icon: BookOpen,
              },
              {
                id: "achievements",
                label: `Badges (${unlockedAchievements.length}/${allAchievements.length})`,
                icon: Award,
              },
              ...(isOwnProfile
                ? [
                    {
                      id: "quests" as MainTab,
                      label: "Quests & Cosmetics",
                      icon: Gift,
                    },
                  ]
                : []),
              {
                id: "activity",
                label: "Timeline",
                icon: Clock,
              },
            ] as { id: MainTab; label: string; icon: any }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#1D1D1F] text-[#F2EBE1] shadow-sm"
                  : "bg-white/85 text-[#525257] hover:text-[#1D1D1F] hover:bg-white border border-[#1D1D1F]/[0.07]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 pt-8 space-y-6">
      {/* TAB 1: OVERVIEW, MULTI-DOMAIN STATISTICS & CONTRIBUTION GRAPH */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* B. 4-Domain Editorial Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Domain 1: Reading Stats */}
            <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.14em] text-[#C84200]">
                  Reading Shelf
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#C84200]/10 flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5 text-[#C84200]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.booksRead}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Completed
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.booksCurrentlyReading}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Reading Now
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#1d1d1f] leading-none">
                    {Math.floor(detailedMetrics.readingMinutes / 60)}h{" "}
                    {detailedMetrics.readingMinutes % 60}m
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    {detailedMetrics.totalReadingSessions} Shanti
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.booksWantToRead}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Up Next
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <div className="flex justify-between text-xs sm:text-[13px] font-bold text-[#525257] mb-2">
                  <span>
                    Annual Goal · {detailedMetrics.booksRead}/{goalBooks}
                  </span>
                  <span className="text-[#C84200]">{goalPercent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#EFE7DC] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C84200] to-[#F4B22B] rounded-full transition-all"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Domain 2: Marketplace Reputation */}
            <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.14em] text-[#0A7D4F]">
                  Exchange & Trust
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#0A7D4F]/10 flex items-center justify-center">
                  <HeartHandshake className="w-4.5 h-4.5 text-[#0A7D4F]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.booksListed}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Books Listed
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.booksDonated}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Vidya Daan
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.booksSold +
                      detailedMetrics.purchasesCount}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Handoffs
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#1d1d1f] leading-none flex items-center gap-1">
                    {Number(profileUser.sellerRating || 5).toFixed(1)}
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    {profileUser.responseTime || "Fast"} Reply
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between text-xs sm:text-[13px] font-bold text-[#0A7D4F] border-t border-[#1D1D1F]/[0.06]">
                <span className="inline-flex items-center gap-1.5 pt-2.5">
                  <ShieldCheck className="w-4 h-4" /> Trusted Campus Reader
                </span>
              </div>
            </div>

            {/* Domain 3: Community Impact */}
            <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.14em] text-[#0066cc]">
                  Sabha & Circle
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#0066cc]/10 flex items-center justify-center">
                  <MessageCircle className="w-4.5 h-4.5 text-[#0066cc]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.reviewsPublished +
                      detailedMetrics.notesPublished}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Notes & Reviews
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.clubPostsCount}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Sabha Posts
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#1d1d1f] leading-none">
                    {followersCount}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Followers
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#1d1d1f] leading-none">
                    {detailedMetrics.followingCount}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Following
                  </p>
                </div>
              </div>
              <div className="pt-1 border-t border-[#1D1D1F]/[0.06]">
                <Link
                  href="/clubs"
                  className="pt-2.5 inline-flex items-center gap-1 text-xs sm:text-[13px] font-bold text-[#0066cc] hover:underline"
                >
                  Explore Sabha Teams <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Domain 4: Gamification & Progression */}
            <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.14em] text-amber-700">
                  Standing & XP
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Trophy className="w-4.5 h-4.5 text-amber-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {computedStats.totalXP.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Lifetime XP
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
                    {unlockedAchievements.length}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Badges ({rareOrHigherCount} Rare+)
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#1d1d1f] leading-none">
                    {profileUser.currentStreak}d
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Best: {profileUser.longestStreak}d
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FAF6F0] p-3.5">
                  <p className="text-xl font-black text-[#C84200] leading-none">
                    {detailedMetrics.leaderboardRank
                      ? `#${detailedMetrics.leaderboardRank}`
                      : "—"}
                  </p>
                  <p className="text-xs sm:text-[13px] font-semibold text-[#6e6e73] mt-1.5">
                    Global Rank
                  </p>
                </div>
              </div>
              <div className="pt-1 border-t border-[#1D1D1F]/[0.06]">
                <Link
                  href="/leaderboard"
                  className="pt-2.5 inline-flex items-center gap-1 text-xs sm:text-[13px] font-bold text-amber-700 hover:underline"
                >
                  Open Reader Charts <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* C. AksharSetu 365-Day Reading & Activity Heatmap */}
          {(isOwnProfile || profileUser.showContributionGraph) && (
            <ContributionGraph
              contributions={contributions}
              currentStreak={profileUser.currentStreak || 0}
              longestStreak={profileUser.longestStreak || 0}
            />
          )}

          {/* Quick Preview of Reading Shelf & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-7 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black text-lg sm:text-xl text-[#1d1d1f] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#C84200]" /> On the Shelf
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("reading")}
                  className="text-sm font-bold text-[#C84200] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Full Shelf & Listings <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {profileUser.libraryBooks.length === 0 ? (
                <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] py-9 px-6 text-center space-y-3">
                  <p className="text-base font-bold text-[#1D1D1F]">
                    Your reading shelf is waiting for its first spine.
                  </p>
                  <p className="text-sm text-[#6e6e73]">
                    Scan an ISBN in My Library or open a free classic from the
                    E-Library.
                  </p>
                  {isOwnProfile && (
                    <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                      <Link
                        href="/library"
                        className="px-5 py-2.5 rounded-full bg-[#1D1D1F] text-white text-sm font-bold hover:bg-[#C84200] transition-colors"
                      >
                        Open My Library
                      </Link>
                      <Link
                        href="/ebooks"
                        className="px-5 py-2.5 rounded-full bg-white text-[#1D1D1F] border border-black/10 text-sm font-bold hover:border-[#C84200]"
                      >
                        Browse E-Library
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {profileUser.libraryBooks.slice(0, 4).map((lb: any) => {
                    const pct = Math.min(
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
                        className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex items-center gap-3.5"
                      >
                        <div className="w-13 h-18 rounded-lg bg-[#EFE7DC] overflow-hidden shrink-0 shadow-xs">
                          {lb.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={lb.coverImage}
                              alt={lb.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <GeneratedCover
                              title={lb.title}
                              author={lb.author || "Reader"}
                              category="fiction"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-xs font-black uppercase tracking-wider text-[#C84200]">
                            {lb.status.replace(/_/g, " ")}
                          </span>
                          <p className="font-bold text-sm sm:text-base text-[#1d1d1f] truncate">
                            {lb.title}
                          </p>
                          <p className="text-xs sm:text-[13px] text-[#6e6e73] truncate">
                            {lb.author}
                          </p>
                          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                            <div
                              className="h-full bg-[#C84200] rounded-full"
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

            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-7 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black text-lg sm:text-xl text-[#1d1d1f] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#C84200]" /> Recent Milestones
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className="text-sm font-bold text-[#C84200] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Full Timeline <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {activityFeed.length === 0 ? (
                <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] py-9 px-5 text-center">
                  <p className="text-sm font-medium text-[#6e6e73]">
                    Milestones appear here as books are read, listed, or passed
                    on.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityFeed.slice(0, 5).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-2.5 text-sm p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.05]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#1d1d1f] truncate">
                          {act.title}
                        </p>
                        <p className="text-xs text-[#6e6e73] mt-0.5">
                          {formatDistanceToNow(new Date(act.occurredAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {act.xpEarned > 0 && (
                        <span className="px-3 py-1 rounded-full bg-[#C84200]/10 text-[#C84200] text-xs font-black shrink-0">
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
            <div className="bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">
                    Personal Reading Room ({profileUser.libraryBooks.length})
                  </h3>
                  <p className="text-sm text-[#6e6e73] mt-0.5">
                    Books currently reading, completed, and on the reading list.
                  </p>
                </div>
                {isOwnProfile && (
                  <Link
                    href="/ebooks"
                    className="px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition-colors"
                  >
                    Explore E-Library
                  </Link>
                )}
              </div>

              {profileUser.libraryBooks.length === 0 ? (
                <p className="text-base text-[#6e6e73] py-10 text-center">
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
                        className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex flex-col justify-between gap-3.5"
                      >
                        <div className="flex gap-3.5">
                          <div className="w-15 h-22 rounded-xl bg-[#EFE7DC] overflow-hidden shrink-0 shadow-xs">
                            {lb.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={lb.coverImage}
                                alt={lb.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <GeneratedCover
                                title={lb.title}
                                author={lb.author || "Reader"}
                                category="fiction"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-1.5 ${
                                lb.status === "READ"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : lb.status === "READING"
                                  ? "bg-[#C84200]/15 text-[#C84200]"
                                  : "bg-black/10 text-[#1d1d1f]"
                              }`}
                            >
                              {lb.status.replace(/_/g, " ")}
                            </span>
                            <h4 className="font-bold text-sm sm:text-base text-[#1d1d1f] line-clamp-2 leading-snug">
                              {lb.title}
                            </h4>
                            <p className="text-xs sm:text-[13px] text-[#6e6e73] truncate mt-1">
                              {lb.author}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-[#6e6e73]">
                            <span>
                              Page {lb.currentPage || 1} of{" "}
                              {lb.totalPages || 250}
                            </span>
                            <span className="text-[#1d1d1f]">{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                            <div
                              className="h-full bg-[#C84200] rounded-full"
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
          <div className="bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">
                  Marketplace & Vidya Daan Listings ({profileUser.books.length})
                </h3>
                <p className="text-sm text-[#6e6e73] mt-0.5">
                  Physical books listed for sale, 1-for-1 swap, or free
                  community donation.
                </p>
              </div>
              {isOwnProfile && (
                <Link
                  href="/catalog/new"
                  className="px-5 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-[#C84200] text-white text-sm font-bold transition-colors"
                >
                  + List a Book
                </Link>
              )}
            </div>

            {profileUser.books.length === 0 ? (
              <p className="text-base text-[#6e6e73] py-10 text-center">
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
        <div className="bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">
                Achievement & Badge Vault ({unlockedAchievements.length}/
                {allAchievements.length} Unlocked)
              </h3>
              <p className="text-sm text-[#6e6e73] mt-0.5">
                {isOwnProfile
                  ? "Click any unlocked badge to inspect details or pin up to 5 badges to your profile header."
                  : "Verified achievements earned across Reading, Reviews, Marketplace, Donations, and Community."}
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-[#6e6e73] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={badgeSearch}
                onChange={(e) => setBadgeSearch(e.target.value)}
                placeholder="Search achievements..."
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-sm font-medium text-[#1d1d1f] outline-none focus:bg-white focus:border-[#C84200]"
              />
            </div>
          </div>

          {/* Category & Rarity Filters */}
          <div className="flex flex-col gap-3 pb-3 border-b border-black/8">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    badgeCategory === cat
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-[#FAF6F0] text-[#525257] hover:text-[#1d1d1f]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide max-w-full">
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    badgeRarity === rar
                      ? "bg-[#C84200] text-white"
                      : "bg-[#FAF6F0] text-[#525257] hover:text-[#1d1d1f]"
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
                  className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    badge.unlocked
                      ? `${rConf.bg} ${rConf.border} hover:shadow-md`
                      : "bg-[#FAF6F0]/70 border-black/6 opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <VectorBadgeArtwork
                        code={badge.code}
                        name={badge.name}
                        category={badge.category}
                        rarity={badge.rarity}
                        unlocked={badge.unlocked}
                        size={58}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${rConf.badgeBg} ${rConf.text}`}
                        >
                          {rConf.label} · {badge.category}
                        </span>
                        <span className="text-xs font-bold text-[#C84200] shrink-0">
                          +{badge.xpReward} XP
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-[#1d1d1f] truncate">
                        {badge.name}
                      </h4>
                      <p className="text-sm text-[#6e6e73] line-clamp-2 mt-1 leading-snug">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-black/6">
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      {badge.unlocked ? (
                        <span className="text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked{" "}
                          {badge.earnedAt
                            ? format(new Date(badge.earnedAt), "MMM d, yyyy")
                            : ""}
                        </span>
                      ) : (
                        <span className="text-[#6e6e73] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Progress:{" "}
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
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer ${
                            badge.isPinned
                              ? "bg-[#C84200] text-white"
                              : "bg-white hover:bg-[#e8e8ed] text-[#1d1d1f] border border-black/10"
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                          {badge.isPinned ? "Pinned" : "Pin"}
                        </button>
                      )}
                    </div>

                    <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          badge.unlocked ? "bg-emerald-600" : "bg-[#C84200]"
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
          <div className="bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f] flex items-center gap-2.5">
                  <Gift className="w-5 h-5 text-[#C84200]" /> Daily Quests,
                  Weekly Challenges & Official Events
                </h3>
                <p className="text-sm text-[#6e6e73] mt-0.5">
                  Complete verified reading and community milestones to claim
                  server-validated XP and Akshar Points (AP).
                </p>
              </div>
              <button
                type="button"
                disabled={checkedInToday || claimingCheckin}
                onClick={handleDailyCheckin}
                className={`px-5 py-2.5 rounded-full text-sm font-bold shrink-0 cursor-pointer transition-colors ${
                  checkedInToday
                    ? "bg-[#FAF6F0] text-[#6e6e73]"
                    : "bg-[#C84200] hover:bg-[#A33500] text-white"
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
                    className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                            q.category === "EVENT"
                              ? "bg-purple-100 text-purple-800"
                              : q.category === "WEEKLY"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-[#C84200]/15 text-[#C84200]"
                          }`}
                        >
                          {q.category} QUEST
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#C84200]">
                          +{q.rewardXp} XP · +{q.rewardPoints} AP
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-[#1d1d1f]">
                        {q.name}
                      </h4>
                      <p className="text-sm text-[#6e6e73] leading-snug">{q.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold">
                        <span className="text-[#6e6e73]">
                          Progress: {q.progress} / {q.targetCount}
                        </span>
                        {q.claimed ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Reward
                            Claimed
                          </span>
                        ) : q.completed ? (
                          <button
                            type="button"
                            disabled={claimingQuestId === q.id}
                            onClick={() => handleClaimQuest(q.id)}
                            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
                          >
                            {claimingQuestId === q.id
                              ? "Claiming..."
                              : "Claim Reward"}
                          </button>
                        ) : (
                          <span className="text-[#6e6e73]">{pct}%</span>
                        )}
                      </div>
                      <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            q.completed ? "bg-emerald-600" : "bg-[#C84200]"
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
          <div className="bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f] flex items-center gap-2.5">
                  <Palette className="w-5 h-5 text-[#C84200]" /> Profile
                  Cosmetics & Showcase Vault
                </h3>
                <p className="text-sm text-[#6e6e73] mt-0.5">
                  Unlock frames and banners by reaching new Levels or spending{" "}
                  <strong>Akshar Points (AP)</strong>. XP is permanent
                  progression and is never spent.
                </p>
              </div>
              <span className="px-4 py-2 rounded-full bg-amber-50 text-amber-800 text-sm font-bold border border-amber-200 shrink-0">
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
                    className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 shrink-0 ${
                          item.type === "frame" ? "rounded-full" : "rounded-xl"
                        } ${COSMETIC_SWATCHES[item.key] || "bg-[#1D1D1F]"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-black uppercase tracking-wider text-[#C84200]">
                            {item.type}
                          </span>
                          <span className="text-xs font-bold text-[#6e6e73]">
                            Lvl {item.minLevel} · {item.pointsCost} AP
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-[#1d1d1f] truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-[#6e6e73] mt-1 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isEquipped || equippingCosmeticId === item.id}
                      onClick={() => handleUnlockOrEquipCosmetic(item.id)}
                      className={`w-full py-2.5 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                        isEquipped
                          ? "bg-[#0A7D4F] text-white"
                          : isUnlocked
                          ? "bg-[#1d1d1f] hover:bg-[#C84200] text-white"
                          : "bg-white hover:bg-[#C84200] hover:text-white text-[#1d1d1f] border border-black/10"
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
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-5">
            <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">
              Meaningful Activity Timeline
            </h3>
            {activityFeed.length === 0 ? (
              <p className="text-base text-[#6e6e73] py-10 text-center">
                No public activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.05] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C84200]">
                        {act.type.replace(/_/g, " ")}
                      </span>
                      <p className="font-bold text-base text-[#1d1d1f] mt-0.5">
                        {act.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#6e6e73] mt-0.5">
                        {formatDistanceToNow(new Date(act.occurredAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {act.xpEarned > 0 && (
                      <span className="px-3.5 py-1 rounded-full bg-[#C84200]/10 text-[#C84200] text-sm font-bold shrink-0">
                        +{act.xpEarned} XP
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-5">
            <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">
              XP Progression Ledger
            </h3>
            {xpLedger.length === 0 ? (
              <p className="text-sm text-[#6e6e73] py-8 text-center">
                Verified XP transactions will appear here as rewards are
                claimed.
              </p>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {xpLedger.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.05] flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#1d1d1f] truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-[#6e6e73] mt-0.5">
                        {format(new Date(tx.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {tx.xpAmount !== 0 && (
                        <p className="font-bold text-[#C84200]">
                          {tx.xpAmount > 0 ? `+${tx.xpAmount}` : tx.xpAmount} XP
                        </p>
                      )}
                      {tx.pointsAmount !== 0 && (
                        <p className="text-xs font-bold text-amber-700">
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
      </div>

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
              className="bg-white rounded-3xl max-w-md w-full p-7 space-y-5 shadow-2xl border border-black/10 text-center"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBadgeModal(null)}
                  className="p-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] cursor-pointer"
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
                  size={96}
                />
              </div>
              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full bg-[#C84200]/10 text-[#C84200] text-xs font-bold uppercase">
                  {selectedBadgeModal.rarity} · {selectedBadgeModal.category}
                </span>
                <h3 className="text-2xl font-black text-[#1d1d1f]">
                  {selectedBadgeModal.name}
                </h3>
                <p className="text-sm text-[#6e6e73] max-w-sm mx-auto leading-relaxed">
                  {selectedBadgeModal.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6F0] flex items-center justify-around text-sm font-bold">
                <div>
                  <p className="text-xs uppercase text-[#6e6e73]">
                    XP Reward
                  </p>
                  <p className="text-[#C84200] text-base mt-0.5">
                    +{selectedBadgeModal.xpReward} XP
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-[#6e6e73]">
                    Cosmetic Points
                  </p>
                  <p className="text-amber-700 text-base mt-0.5">
                    +{selectedBadgeModal.pointsReward} AP
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-[#6e6e73]">Status</p>
                  <p className="text-[#1d1d1f] text-base mt-0.5">
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
                  className="w-full py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold cursor-pointer transition-colors"
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
              className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-black/8">
                <div>
                  <h2 className="text-2xl font-black text-[#1d1d1f]">
                    Customize Identity, Cosmetics & Privacy
                  </h2>
                  <p className="text-sm text-[#6e6e73] mt-0.5">
                    Manage your public showcase, frame, banner, quote, and
                    privacy preferences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2.5 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Prominent @username Handle & Live Profile URL Settings */}
              <form
                onSubmit={handleSaveUsername}
                className="mb-6 p-5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="profile-handle-input"
                    className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5"
                  >
                    <AtSign className="w-4 h-4 text-[#C84200]" /> Public
                    @username Handle
                  </label>
                  <span className="text-xs font-semibold text-[#6e6e73]">
                    3–24 chars · letters, numbers & _
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-[#6e6e73]">
                      @
                    </span>
                    <input
                      id="profile-handle-input"
                      type="text"
                      value={handleDraft}
                      onChange={(e) => {
                        setHandleDraft(e.target.value)
                        setHandleError(null)
                      }}
                      maxLength={24}
                      placeholder="your_username"
                      className="w-full bg-white border border-black/10 focus:border-[#C84200] rounded-full pl-9 pr-4 py-3 text-sm sm:text-base font-bold text-[#1d1d1f] outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      savingHandle ||
                      previewHandle.length < 3 ||
                      previewHandle === profileUser.username
                    }
                    className="px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 shrink-0"
                  >
                    {savingHandle ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Updating...
                      </>
                    ) : previewHandle === profileUser.username ? (
                      <>
                        <Check className="w-4 h-4" /> Active Handle
                      </>
                    ) : (
                      "Save @username"
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="inline-flex items-center gap-1.5 text-[#6e6e73] font-medium min-w-0">
                    <Link2 className="w-4 h-4 text-[#C84200] shrink-0" />
                    <span className="truncate">
                      Live URL:{" "}
                      <strong className="text-[#1d1d1f] font-mono">
                        aksharsetu/profile/{previewHandle || "your_username"}
                      </strong>
                    </span>
                  </div>
                  {handleError && (
                    <p className="text-sm font-bold text-rose-600">
                      {handleError}
                    </p>
                  )}
                </div>
              </form>

              <ProfileForm
                user={profileUser}
                onSuccess={handleProfileFormSuccess}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
