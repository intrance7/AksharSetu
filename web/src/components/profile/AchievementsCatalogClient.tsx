"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { VectorBadgeArtwork } from "@/components/profile/VectorBadgeArtwork"
import { BADGE_RARITY_META, type BadgeRarity } from "@/lib/gamification"
import {
  Search,
  Trophy,
  Pin,
  Lock,
  CheckCircle2,
  Sparkles,
  X,
  ArrowUpDown,
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
    let nextPinned: string[]
    if (exists) {
      nextPinned = pinnedIds.filter((id) => id !== badgeId)
    } else {
      if (pinnedIds.length >= 6) {
        nextPinned = [...pinnedIds.slice(1), badgeId]
      } else {
        nextPinned = [...pinnedIds, badgeId]
      }
    }

    setPinnedIds(nextPinned)
    setSavingPin(true)
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinnedBadgeIds: nextPinned }),
      })
    } finally {
      setSavingPin(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      {/* Deep Black Hero Section */}
      <section className="bg-black text-[#f5f5f7] pt-14 pb-16 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-3">
                <Trophy className="h-3.5 w-3.5" /> AksharSetu Hall of Emblems
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter leading-none">
                Achievements & Badge Vault
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
                Collect all {badges.length} original vector medallions across
                Reading, Reviews, Marketplace, Vidya Daan, Community, and Rank
                Progression. Pin up to 6 unlocked badges to your public profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {userId && (
                <Link
                  href={`/profile/${userId}`}
                  className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  View My Profile Showcase
                </Link>
              )}
              <Link
                href="/help/badges-and-achievements"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" /> Rarity & Unlock Rules
              </Link>
            </div>
          </div>

          {/* 4-Card Summary Stats Bento */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs text-[#86868b]">Unlocked Emblems</div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {unlockedBadges.length}{" "}
                <span className="text-sm font-semibold text-[#86868b]">
                  / {badges.length}
                </span>
              </div>
              <div className="text-[11px] text-[#0066cc] font-bold mt-1">
                {pinnedIds.length}/6 pinned to showcase
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs text-[#86868b]">Vault Completion</div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {completionPercent}%
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0066cc]"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs text-[#86868b]">Rarest Badge Earned</div>
              {rarestUnlocked ? (
                <div className="mt-1">
                  <div className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {rarestUnlocked.name}
                  </div>
                  <span className="inline-block mt-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                    {rarestUnlocked.rarity}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-[#86868b] mt-2">
                  Complete your first reading session or listing to unlock!
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-xs text-[#86868b]">Recently Unlocked</div>
              {recentlyUnlocked.length > 0 ? (
                <div className="mt-2 flex items-center gap-2">
                  {recentlyUnlocked.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBadge(b)}
                      title={b.name}
                      className="hover:scale-105 transition-transform"
                    >
                      <VectorBadgeArtwork
                        code={b.code}
                        category={b.category}
                        rarity={b.rarity}
                        size={38}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#86868b] mt-2">
                  No recent unlocks yet
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-8">
        {/* Filter & Search Toolbar */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06] mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search badges by name, keyword, or criteria..."
                className="w-full rounded-full bg-[#f5f5f7] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                aria-label="Filter by rarity"
                className="rounded-full bg-[#f5f5f7] px-4 py-2 text-xs font-bold text-[#1d1d1f]"
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
                className="rounded-full bg-[#f5f5f7] px-4 py-2 text-xs font-bold text-[#1d1d1f]"
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
                className="rounded-full bg-[#f5f5f7] px-4 py-2 text-xs font-bold text-[#1d1d1f]"
              >
                <option value="rarity">Sort: Highest Rarity</option>
                <option value="progress">Sort: Completion %</option>
                <option value="unlockedAt">Sort: Recently Unlocked</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5">
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
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  categoryFilter === val
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const rMeta = BADGE_RARITY_META[badge.rarity]
            const isPinned = pinnedIds.includes(badge.id)
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`cursor-pointer rounded-2xl bg-white p-5 shadow-sm border transition-all hover:shadow-md flex flex-col justify-between ${
                  badge.unlocked
                    ? "border-black/[0.08] hover:border-[#0066cc]"
                    : "border-black/[0.04] opacity-85 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <VectorBadgeArtwork
                      code={badge.code}
                      category={badge.category}
                      rarity={badge.rarity}
                      unlocked={badge.unlocked}
                      size={68}
                    />
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: rMeta.bg,
                          color: rMeta.color,
                          border: `1px solid ${rMeta.border}`,
                        }}
                      >
                        {rMeta.label}
                      </span>
                      {badge.unlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#86868b]">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#1d1d1f] mt-3">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-[#6e6e73] mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/[0.05]">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold text-[#6e6e73]">
                      Progress: {badge.currentValue} /{" "}
                      {badge.requirementThreshold}
                    </span>
                    <span className="font-bold text-[#0066cc]">
                      +{badge.xpReward} XP · +{badge.pointsReward} AP
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#f5f5f7] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0066cc] transition-all"
                      style={{ width: `${badge.progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#86868b]">
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
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold transition-colors ${
                          isPinned
                            ? "bg-[#0066cc] text-white"
                            : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
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
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute right-5 top-5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] p-2 text-[#1d1d1f]"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <VectorBadgeArtwork
                code={selectedBadge.code}
                category={selectedBadge.category}
                rarity={selectedBadge.rarity}
                unlocked={selectedBadge.unlocked}
                size={112}
              />

              <span
                className="mt-4 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase"
                style={{
                  backgroundColor: BADGE_RARITY_META[selectedBadge.rarity].bg,
                  color: BADGE_RARITY_META[selectedBadge.rarity].color,
                }}
              >
                {BADGE_RARITY_META[selectedBadge.rarity].label} ·{" "}
                {selectedBadge.category}
              </span>

              <h2 className="text-2xl font-bold text-[#1d1d1f] mt-2">
                {selectedBadge.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#6e6e73] mt-1.5 max-w-md">
                {selectedBadge.description}
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-[#f5f5f7] p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6e6e73]">Your Progress</span>
                <span className="font-bold text-[#1d1d1f]">
                  {selectedBadge.currentValue} /{" "}
                  {selectedBadge.requirementThreshold} (
                  {selectedBadge.progressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0066cc]"
                  style={{ width: `${selectedBadge.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[#6e6e73]">Unlock Reward</span>
                <span className="font-bold text-[#0066cc]">
                  +{selectedBadge.xpReward} XP · +{selectedBadge.pointsReward}{" "}
                  Akshar Points
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6e6e73]">Community Rarity</span>
                <span className="font-bold text-[#1d1d1f]">
                  Unlocked by {selectedBadge.communityUnlockPercent}% of
                  AksharSetu readers
                </span>
              </div>
              {selectedBadge.unlockedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6e6e73]">Date Unlocked</span>
                  <span className="font-bold text-emerald-700">
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
                  className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 py-2.5 text-xs font-bold text-white inline-flex items-center gap-1.5"
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
                className="rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] px-5 py-2.5 text-xs font-bold text-[#1d1d1f]"
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
