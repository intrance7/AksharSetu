import Link from "next/link"
import { ACHIEVEMENT_CATALOG } from "@/services/badgeService"
import { BADGE_RARITY_META } from "@/lib/gamification"
import { VectorBadgeArtwork } from "@/components/profile/VectorBadgeArtwork"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import { Trophy, ChevronRight, ArrowRight } from "lucide-react"

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
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] pt-12 pb-18 px-4 sm:px-6 border-b border-white/10">
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

        <div className="mx-auto max-w-5xl relative z-10">
          <div className="flex items-center gap-2 text-xs sm:text-[13px] text-[#C9C4BC] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-semibold">
              Badges &amp; Achievements Guide
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-3.5">
            <Trophy className="h-3.5 w-3.5" /> 34 Original Vector Emblems
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
            Badges, Rarity Tiers &amp;{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Profile Showcases
            </span>
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
            AksharSetu badges are permanent digital medallions awarded for
            verified reading milestones, critical reviews, Vidya Daan book
            donations, and community leadership.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/achievements"
              className="inline-flex items-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] px-6 py-3 text-sm font-bold text-white transition-colors shadow-sm"
            >
              Open Interactive Badge Collection{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10 space-y-8">
        {/* 6 Rarity Tiers Visual Breakdown */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            The 6 Badge Rarity Tiers
          </h2>
          <p className="text-sm sm:text-[15px] text-[#5E5E63] mt-1 mb-6">
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
                  className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] p-4.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <span
                      className="inline-block rounded-full px-3 py-0.5 font-mono text-xs font-bold uppercase"
                      style={{
                        backgroundColor: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      {meta.label}
                    </span>
                    <div className="text-sm font-bold text-[#1D1D1F] mt-2">
                      {count} Official Badges
                    </div>
                    <div className="text-xs text-[#5E5E63] mt-0.5">
                      {rarity === "COMMON" && "Starter milestones (+40–100 XP)"}
                      {rarity === "UNCOMMON" &&
                        "Consistent habits (+80–150 XP)"}
                      {rarity === "RARE" && "Dedicated scholars (+130–250 XP)"}
                      {rarity === "EPIC" &&
                        "High-impact pillars (+250–1,000 XP)"}
                      {rarity === "LEGENDARY" &&
                        "Elite masters (+400–600 XP)"}
                      {rarity === "MYTHIC" &&
                        "Hall of Fame legends (+1,000–2,500 XP)"}
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
                    size={58}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* How Unlocking & Showcase Pinning Work */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h3 className="text-base font-bold text-[#1D1D1F]">
              1. Automatic Real-Time Unlocking
            </h3>
            <p className="text-sm text-[#5E5E63] mt-2 leading-relaxed">
              Whenever you finish a reading session, complete a book, publish a
              review, or donate/sell a listing, our progression engine evaluates
              all 34 achievement thresholds and unlocks eligible badges
              immediately.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h3 className="text-base font-bold text-[#1D1D1F]">
              2. Pinning Up to 5 Showcase Badges
            </h3>
            <p className="text-sm text-[#5E5E63] mt-2 leading-relaxed">
              Visit the Badge Vault or your Profile page to pin up to 5 unlocked
              badges to your Featured Badge Showcase. Visitors see your pinned
              emblems right inside your profile header.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h3 className="text-base font-bold text-[#1D1D1F]">
              3. Seasonal &amp; Event Emblems
            </h3>
            <p className="text-sm text-[#5E5E63] mt-2 leading-relaxed">
              Seasonal badges (such as Vidya Utsav 2026 Pioneer) can only be
              unlocked during their active campaign dates. Once unlocked, they
              remain in your collection forever.
            </p>
          </div>
        </div>

        {/* Complete 34-Badge Reference Table */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
                Complete Encyclopedia of All {ACHIEVEMENT_CATALOG.length} Badges
              </h2>
              <p className="text-sm text-[#5E5E63] mt-1">
                Every badge below renders with its custom AksharSetu vector
                emblem, requirement threshold, and XP/AP reward.
              </p>
            </div>
            <Link
              href="/achievements"
              className="rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.08] px-5 py-2.5 text-sm font-bold text-[#1D1D1F] shrink-0"
            >
              Filter &amp; Track Progress
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACHIEVEMENT_CATALOG.map((badge) => {
              const rMeta = BADGE_RARITY_META[badge.rarity]
              return (
                <div
                  key={badge.code}
                  className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] p-4.5 flex items-center gap-4"
                >
                  <div className="p-2 rounded-2xl bg-white border border-[#1D1D1F]/[0.05] shrink-0">
                    <VectorBadgeArtwork
                      code={badge.code}
                      category={badge.category}
                      rarity={badge.rarity}
                      size={64}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-[#1D1D1F]">
                        {badge.name}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 font-mono text-xs font-bold uppercase"
                        style={{
                          backgroundColor: rMeta.bg,
                          color: rMeta.color,
                        }}
                      >
                        {rMeta.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#5E5E63] mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 font-mono text-xs font-semibold text-[#6E6E73]">
                      <span className="text-[#C84200] font-bold">
                        +{badge.xpReward} XP
                      </span>
                      <span>+{badge.pointsReward} AP</span>
                      <span>{badge.category}</span>
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
