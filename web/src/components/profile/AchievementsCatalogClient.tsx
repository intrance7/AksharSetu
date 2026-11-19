"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { VectorBadgeArtwork } from "@/components/profile/VectorBadgeArtwork"
import { BADGE_RARITY_META, type BadgeRarity } from "@/lib/gamification"
import {
  Search,
  Trophy,
  Pin,
  Lock,
  CheckCircle2,
  X,
  HelpCircle,
} from "lucide-react"

export interface EnrichedAchievementItem {
  id: string
  code: string
  name: string
  description: string
  category: string
  rarity: BadgeRarity
  iconUrl: string
  requirementThreshold: number
  currentValue: number
  progressPercent: number
  xpReward: number
  pointsReward: number
  unlocked: boolean
  unlockedAt: string | null
  communityUnlockPercent: number
}

const RARITY_WEIGHT: Record<BadgeRarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
}

export function AchievementsCatalogClient({
  badges,
  initialPinnedIds,
  isAuthenticated,
  userId,
}: {
  badges: EnrichedAchievementItem[]
  initialPinnedIds: string[]
  isAuthenticated: boolean
  userId?: string | null
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [rarityFilter, setRarityFilter] = useState<string>("ALL")
  const [stateFilter, setStateFilter] = useState<
    "ALL" | "UNLOCKED" | "IN_PROGRESS" | "LOCKED"
  >("ALL")
  const [sortBy, setSortBy] = useState<"rarity" | "progress" | "unlockedAt">(
    "rarity"
  )
  const [selectedBadge, setSelectedBadge] =
    useState<EnrichedAchievementItem | null>(null)
  const [pinnedIds, setPinnedIds] = useState<string[]>(initialPinnedIds)
  const [savingPin, setSavingPin] = useState(false)

  const unlockedBadges = useMemo(
    () => badges.filter((b) => b.unlocked),
    [badges]
  )

  const completionPercent = useMemo(
    () =>
      badges.length > 0
        ? Math.round((unlockedBadges.length / badges.length) * 100)
        : 0,
    [badges.length, unlockedBadges.length]
  )

  const rarestUnlocked = useMemo(() => {
    if (unlockedBadges.length === 0) return null
    return [...unlockedBadges].sort(
      (a, b) => RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity]
    )[0]
  }, [unlockedBadges])

  const recentlyUnlocked = useMemo(() => {
    return [...unlockedBadges]
      .filter((b) => b.unlockedAt)
      .sort(
        (a, b) =>
          new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
      )
      .slice(0, 4)
  }, [unlockedBadges])

  const filteredBadges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = badges.filter((b) => {
      if (categoryFilter !== "ALL" && b.category !== categoryFilter) {
        return false
      }
      if (rarityFilter !== "ALL" && b.rarity !== rarityFilter) {
        return false
      }
      if (stateFilter === "UNLOCKED" && !b.unlocked) return false
      if (
        stateFilter === "IN_PROGRESS" &&
        (b.unlocked || b.currentValue <= 0)
      ) {
        return false
      }
      if (stateFilter === "LOCKED" && b.unlocked) return false
      if (
        q &&
        !b.name.toLowerCase().includes(q) &&
        !b.description.toLowerCase().includes(q) &&
        !b.code.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })

    return list.sort((a, b) => {
      if (sortBy === "rarity") {
        return RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity]
      }
      if (sortBy === "progress") {
        return b.progressPercent - a.progressPercent
      }
      if (sortBy === "unlockedAt") {
        const aTime = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0
        const bTime = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0
        return bTime - aTime
      }
      return 0
    })
  }, [
    badges,
    searchQuery,
    categoryFilter,
    rarityFilter,
    stateFilter,
    sortBy,
  ])

  async function togglePinBadge(badgeId: string) {
    if (!isAuthenticated || savingPin) return
    const exists = pinnedIds.includes(badgeId)
    if (!exists && pinnedIds.length >= 5) {
      toast.error("You can pin up to 5 badges. Unpin one first to add another.")
      return
    }
    const previousPinned = pinnedIds
    const nextPinned = exists
      ? pinnedIds.filter((id) => id !== badgeId)
      : [...pinnedIds, badgeId]

    setPinnedIds(nextPinned)
    setSavingPin(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pin_badge",
          badgeId,
          isPinned: !exists,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setPinnedIds(previousPinned)
        toast.error(data.error || "Could not update pinned badge")
        return
      }
      toast.success(
        exists ? "Removed from profile showcase" : "Pinned to profile showcase!"
      )
    } catch {
      setPinnedIds(previousPinned)
      toast.error("Could not update pinned badge")
    } finally {
      setSavingPin(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Hero Section */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] pt-14 pb-18 px-4 sm:px-6 border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#C84200]/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#FF7F45]/12 blur-[100px]" />

        <div className="mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-4">
                <Trophy className="h-3.5 w-3.5" /> AksharSetu Hall of Emblems
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.04]">
                Achievements &amp;{" "}
                <span className="font-serif italic font-medium text-[#FF7F45]">
                  Badge Vault
                </span>
                .
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
                Collect all {badges.length} original vector medallions across
                Reading, Reviews, Marketplace, Vidya Daan, Community, and Rank
                Progression. Pin up to 5 unlocked badges to your public profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              {userId && (
                <Link
                  href={`/profile/${userId}`}
                  className="rounded-full bg-[#C84200] hover:bg-[#A33500] px-6 py-3 text-sm font-bold text-white transition-colors shadow-sm"
                >
                  View My Profile Showcase
                </Link>
              )}
              <Link
                href="/help/badges-and-achievements"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-5 py-3 text-sm font-bold text-white transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-[#FF7F45]" /> Rarity &amp;
                Unlock Rules
              </Link>
            </div>
          </div>

          {/* 4-Card Summary Stats Bento */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white/[0.05] border border-white/10 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#C9C4BC]">
                Unlocked Emblems
              </div>
              <div className="font-mono text-3xl font-bold text-white mt-1.5">
                {unlockedBadges.length}{" "}
                <span className="text-base font-medium text-white/55">
                  / {badges.length}
                </span>
              </div>
              <div className="font-mono text-xs text-[#FF7F45] font-semibold mt-1.5">
                {pinnedIds.length}/5 pinned to showcase
              </div>
            </div>

            <div className="rounded-3xl bg-white/[0.05] border border-white/10 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#C9C4BC]">
                Vault Completion
              </div>
              <div className="font-mono text-3xl font-bold text-white mt-1.5">
                {completionPercent}%
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FF7F45]"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white/[0.05] border border-white/10 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#C9C4BC]">
                Rarest Badge Earned
              </div>
              {rarestUnlocked ? (
                <div className="mt-1.5">
                  <div className="text-base font-bold text-white line-clamp-1">
                    {rarestUnlocked.name}
                  </div>
                  <span className="inline-block mt-1.5 rounded-full bg-white/15 px-3 py-0.5 font-mono text-xs font-bold uppercase text-amber-300">
                    {rarestUnlocked.rarity}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-[#C9C4BC] mt-2 leading-relaxed">
                  Complete your first reading session or listing to unlock.
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white/[0.05] border border-white/10 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#C9C4BC]">
                Recently Unlocked
              </div>
              {recentlyUnlocked.length > 0 ? (
                <div className="mt-2.5 flex items-center gap-2">
                  {recentlyUnlocked.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBadge(b)}
                      title={b.name}
                      className="hover:scale-105 transition-transform cursor-pointer"
                    >
                      <VectorBadgeArtwork
                        code={b.code}
                        category={b.category}
                        rarity={b.rarity}
                        size={42}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#C9C4BC] mt-2">
                  No recent unlocks yet
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-6 relative z-10">
        {/* Filter & Search Toolbar */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-[#1D1D1F]/[0.07] mb-7 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-[#6E6E73] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search badges by name, keyword, or criteria..."
                className="w-full rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] pl-11 pr-4 py-3 text-sm sm:text-[15px] text-[#1D1D1F] placeholder:text-[#6E6E73] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84200]/15 focus:border-[#C84200] transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                aria-label="Filter by rarity"
                className="rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 py-2.5 text-xs sm:text-[13px] font-bold text-[#1D1D1F] outline-none focus:border-[#C84200] cursor-pointer"
              >
                <option value="ALL">All Rarities</option>
                <option value="COMMON">Common</option>
                <option value="UNCOMMON">Uncommon</option>
                <option value="RARE">Rare</option>
                <option value="EPIC">Epic</option>
                <option value="LEGENDARY">Legendary</option>
                <option value="MYTHIC">Mythic</option>
              </select>

              <select
                value={stateFilter}
                onChange={(e) =>
                  setStateFilter(
                    e.target.value as
                      | "ALL"
                      | "UNLOCKED"
                      | "IN_PROGRESS"
                      | "LOCKED"
                  )
                }
                aria-label="Filter by unlock state"
                className="rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 py-2.5 text-xs sm:text-[13px] font-bold text-[#1D1D1F] outline-none focus:border-[#C84200] cursor-pointer"
              >
                <option value="ALL">All States</option>
                <option value="UNLOCKED">Unlocked Only</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="LOCKED">Locked Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "rarity" | "progress" | "unlockedAt"
                  )
                }
                aria-label="Sort badges"
                className="rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 py-2.5 text-xs sm:text-[13px] font-bold text-[#1D1D1F] outline-none focus:border-[#C84200] cursor-pointer"
              >
                <option value="rarity">Sort: Highest Rarity</option>
                <option value="progress">Sort: Completion %</option>
                <option value="unlockedAt">Sort: Recently Unlocked</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              ["ALL", "All Categories"],
              ["READING", "Reading"],
              ["REVIEW", "Reviews"],
              ["MARKETPLACE", "Marketplace"],
              ["DONATION", "Vidya Daan"],
              ["COMMUNITY", "Community"],
              ["PROGRESSION", "Level Ranks"],
              ["SEASONAL", "Seasonal"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setCategoryFilter(val)}
                className={`rounded-full px-4 py-2 text-xs sm:text-[13px] font-bold transition-colors cursor-pointer ${
                  categoryFilter === val
                    ? "bg-[#1D1D1F] text-white shadow-xs"
                    : "bg-[#FAF6F0] text-[#5E5E63] hover:text-[#1D1D1F] border border-[#1D1D1F]/[0.06]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBadges.map((badge) => {
            const rMeta = BADGE_RARITY_META[badge.rarity]
            const isPinned = pinnedIds.includes(badge.id)
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`cursor-pointer rounded-3xl bg-white p-6 shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${
                  badge.unlocked
                    ? "border-[#1D1D1F]/[0.09] hover:border-[#C84200]/50"
                    : "border-[#1D1D1F]/[0.06] opacity-90 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] shadow-xs">
                      <VectorBadgeArtwork
                        code={badge.code}
                        category={badge.category}
                        rarity={badge.rarity}
                        unlocked={badge.unlocked}
                        size={72}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className="rounded-full px-3 py-0.5 font-mono text-xs font-bold uppercase"
                        style={{
                          backgroundColor: rMeta.bg,
                          color: rMeta.color,
                          border: `1px solid ${rMeta.border}`,
                        }}
                      >
                        {rMeta.label}
                      </span>
                      {badge.unlocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A7D4F]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6E6E73]">
                          <Lock className="h-3.5 w-3.5" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#1D1D1F] mt-4 tracking-tight">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-[#5E5E63] mt-1.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#1D1D1F]/[0.06]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-semibold text-[#5E5E63]">
                      {badge.currentValue} / {badge.requirementThreshold}
                    </span>
                    <span className="font-mono font-bold text-[#C84200]">
                      +{badge.xpReward} XP · +{badge.pointsReward} AP
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.05] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        badge.unlocked ? "bg-[#0A7D4F]" : "bg-[#C84200]"
                      }`}
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-3.5 flex items-center justify-between text-xs text-[#6E6E73]">
                    <span>
                      {badge.communityUnlockPercent}% of readers unlocked
                    </span>
                    {badge.unlocked && isAuthenticated && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePinBadge(badge.id)
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          isPinned
                            ? "bg-[#C84200] text-white"
                            : "bg-[#FAF6F0] text-[#1D1D1F] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.06]"
                        }`}
                      >
                        <Pin className="h-3 w-3" />
                        {isPinned ? "Pinned" : "Pin"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#1D1D1F]/10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute right-5 top-5 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] p-2 text-[#1D1D1F] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-3xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06]">
                <VectorBadgeArtwork
                  code={selectedBadge.code}
                  category={selectedBadge.category}
                  rarity={selectedBadge.rarity}
                  unlocked={selectedBadge.unlocked}
                  size={112}
                />
              </div>

              <span
                className="mt-4 rounded-full px-3.5 py-1 font-mono text-xs font-bold uppercase"
                style={{
                  backgroundColor: BADGE_RARITY_META[selectedBadge.rarity].bg,
                  color: BADGE_RARITY_META[selectedBadge.rarity].color,
                }}
              >
                {BADGE_RARITY_META[selectedBadge.rarity].label} ·{" "}
                {selectedBadge.category}
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] mt-2.5 tracking-tight">
                {selectedBadge.name}
              </h2>
              <p className="text-sm sm:text-[15px] text-[#5E5E63] mt-2 max-w-md leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#5E5E63]">Your Progress</span>
                <span className="font-mono font-bold text-[#1D1D1F]">
                  {selectedBadge.currentValue} /{" "}
                  {selectedBadge.requirementThreshold} (
                  {selectedBadge.progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedBadge.unlocked ? "bg-[#0A7D4F]" : "bg-[#C84200]"
                  }`}
                  style={{ width: `${selectedBadge.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[#5E5E63]">Unlock Reward</span>
                <span className="font-mono font-bold text-[#C84200]">
                  +{selectedBadge.xpReward} XP · +{selectedBadge.pointsReward}{" "}
                  AP
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5E5E63]">Community Rarity</span>
                <span className="font-bold text-[#1D1D1F]">
                  {selectedBadge.communityUnlockPercent}% of readers
                </span>
              </div>
              {selectedBadge.unlockedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[#5E5E63]">Date Unlocked</span>
                  <span className="font-mono font-bold text-[#0A7D4F]">
                    {new Date(selectedBadge.unlockedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              {selectedBadge.unlocked && isAuthenticated && (
                <button
                  type="button"
                  onClick={() => togglePinBadge(selectedBadge.id)}
                  className="rounded-full bg-[#C84200] hover:bg-[#A33500] px-5 py-2.5 text-sm font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Pin className="h-3.5 w-3.5" />
                  {pinnedIds.includes(selectedBadge.id)
                    ? "Unpin from Showcase"
                    : "Pin to Profile Showcase"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.08] px-5 py-2.5 text-sm font-bold text-[#1D1D1F] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
