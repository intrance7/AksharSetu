import Link from "next/link"
import { ACHIEVEMENT_CATALOG } from "@/services/badgeService"
import { BADGE_RARITY_META } from "@/lib/gamification"
import { VectorBadgeArtwork } from "@/components/profile/VectorBadgeArtwork"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import { Trophy, ChevronRight, Sparkles, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Badges & Achievements Guide — AksharSetu Help Center",
  description:
    "Explore all 34 AksharSetu achievement badges, 6 rarity tiers, unlock requirements, XP rewards, and profile showcase pinning.",
}

const RARITY_ORDER = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "MYTHIC",
] as const

export default function BadgesAndAchievementsDocPage() {
  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-12 pb-16 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs text-[#86868b] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Badges & Achievements Guide</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-3">
            <Trophy className="h-3.5 w-3.5" /> 34 Original Vector Emblems
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter">
            Badges, Rarity Tiers & Profile Showcases
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
            AksharSetu badges are permanent digital medallions awarded for
            verified reading milestones, critical reviews, Vidya Daan book
            donations, and community leadership.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/achievements"
              className="inline-flex items-center gap-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 py-2.5 text-xs font-bold text-white transition-colors"
            >
              Open Interactive Badge Collection{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 space-y-8">
        {/* 6 Rarity Tiers Visual Breakdown */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <h2 className="text-xl font-bold text-[#1d1d1f]">
            The 6 Badge Rarity Tiers
          </h2>
          <p className="text-xs text-[#86868b] mt-1 mb-5">
            Each rarity tier features a distinct geometric frame silhouette and
            mineral/metallic color palette.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RARITY_ORDER.map((rarity) => {
              const meta = BADGE_RARITY_META[rarity]
              const count = ACHIEVEMENT_CATALOG.filter(
                (b) => b.rarity === rarity
              ).length
              return (
                <div
                  key={rarity}
                  className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 p-4 flex items-center justify-between"
                >
                  <div>
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        backgroundColor: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      {meta.label}
                    </span>
                    <div className="text-xs font-bold text-[#1d1d1f] mt-2">
                      {count} Official Badges
                    </div>
                    <div className="text-[11px] text-[#86868b]">
                      {rarity === "COMMON" && "Starter milestones (+40–100 XP)"}
                      {rarity === "UNCOMMON" && "Consistent habits (+80–150 XP)"}
                      {rarity === "RARE" && "Dedicated scholars (+130–250 XP)"}
                      {rarity === "EPIC" && "High-impact pillars (+250–1,000 XP)"}
                      {rarity === "LEGENDARY" && "Elite masters (+400–600 XP)"}
                      {rarity === "MYTHIC" && "Hall of Fame legends (+1,000–2,500 XP)"}
                    </div>
                  </div>
                  <VectorBadgeArtwork
                    code={
                      ACHIEVEMENT_CATALOG.find((b) => b.rarity === rarity)
                        ?.code || "first_page"
                    }
                    category={
                      ACHIEVEMENT_CATALOG.find((b) => b.rarity === rarity)
                        ?.category || "READING"
                    }
                    rarity={rarity}
                    size={54}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* How Unlocking & Showcase Pinning Work */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              1. Automatic Real-Time Unlocking
            </h3>
            <p className="text-xs text-[#6e6e73] mt-2 leading-relaxed">
              Whenever you finish a reading session, complete a book, publish a
              review, or donate/sell a listing, our progression engine evaluates
              all 34 achievement thresholds and unlocks eligible badges
              immediately.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              2. Pinning Up to 5 Showcase Badges
            </h3>
            <p className="text-xs text-[#6e6e73] mt-2 leading-relaxed">
              Visit the Badge Vault or your Profile page to pin up to 5 unlocked
              badges to your Featured Badge Showcase. Visitors see your pinned
              emblems right inside your profile header.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h3 className="text-sm font-bold text-[#1d1d1f]">
              3. Seasonal & Event Emblems
            </h3>
            <p className="text-xs text-[#6e6e73] mt-2 leading-relaxed">
              Seasonal badges (such as Vidya Utsav 2026 Pioneer) can only be
              unlocked during their active campaign dates. Once unlocked, they
              remain in your collection forever.
            </p>
          </div>
        </div>

        {/* Complete 34-Badge Reference Table */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#1d1d1f]">
                Complete Encyclopedia of All {ACHIEVEMENT_CATALOG.length} Badges
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                Every badge below renders with its custom AksharSetu vector
                emblem, requirement threshold, and XP/AP reward.
              </p>
            </div>
            <Link
              href="/achievements"
              className="rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] px-4 py-2 text-xs font-bold text-[#1d1d1f]"
            >
              Filter & Track Progress
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACHIEVEMENT_CATALOG.map((badge) => {
              const rMeta = BADGE_RARITY_META[badge.rarity]
              return (
                <div
                  key={badge.code}
                  className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/50 p-4 flex items-center gap-4"
                >
                  <VectorBadgeArtwork
                    code={badge.code}
                    category={badge.category}
                    rarity={badge.rarity}
                    size={64}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1d1d1f]">
                        {badge.name}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: rMeta.bg,
                          color: rMeta.color,
                        }}
                      >
                        {rMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6e73] mt-1">
                      {badge.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-[#86868b]">
                      <span className="text-[#0066cc]">
                        +{badge.xpReward} XP
                      </span>
                      <span>+{badge.pointsReward} AP</span>
                      <span>Category: {badge.category}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <ArticleFeedbackWidget slug="badges-and-achievements" />
      </div>
    </div>
  )
}
