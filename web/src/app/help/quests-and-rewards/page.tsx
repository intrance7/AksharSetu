import Link from "next/link"
import { DEFAULT_QUESTS } from "@/services/badgeService"
import { COSMETIC_CATALOG } from "@/lib/gamification"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import { Target, ChevronRight, Sparkles, Gift } from "lucide-react"

export const metadata = {
  title: "Quests, Akshar Points & Cosmetics Guide — AksharSetu Help Center",
  description:
    "How Daily, Weekly, and Event Quests work, how to claim rewards idempotently, and how to unlock Avatar Frames and Profile Themes.",
}

export default function QuestsAndRewardsDocPage() {
  const frames = COSMETIC_CATALOG.filter((c) => c.type === "frame")
  const banners = COSMETIC_CATALOG.filter((c) => c.type === "banner")

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
              Quests &amp; Rewards Guide
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-3.5">
            <Target className="h-3.5 w-3.5" /> Daily, Weekly &amp; Event
            Challenges
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
            Quests, Akshar Points &amp;{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Profile Cosmetics
            </span>
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
            Complete structured reading and community challenges to earn XP,
            Akshar Points (AP), and exclusive cosmetic avatar frames and themes.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10 space-y-8">
        {/* XP vs Akshar Points Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#C84200]" />
              Experience Points (XP) vs. Akshar Points (AP)
            </h2>
            <p className="text-[15px] text-[#5E5E63] mt-3 leading-relaxed">
              <strong className="text-[#1D1D1F]">
                Experience Points (XP)
              </strong>{" "}
              measure your all-time literary rank and level progression (Level 1
              to Level 100+). XP is never spent.
              <br />
              <br />
              <strong className="text-[#1D1D1F]">Akshar Points (AP)</strong> are
              reward points earned from Daily Check-Ins, Quests, and Achievement
              Unlocks that recognize your active seasonal participation and
              unlock profile cosmetics.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
              <Gift className="h-5 w-5 text-[#0A7D4F]" />
              Reset Windows &amp; Duplicate Claim Protection
            </h2>
            <div className="text-[15px] text-[#5E5E63] mt-3 space-y-2.5 leading-relaxed">
              <p>
                • <strong className="text-[#1D1D1F]">Daily Quests</strong> reset
                every UTC calendar day and can be claimed once per day after
                meeting the target metric.
              </p>
              <p>
                • <strong className="text-[#1D1D1F]">Weekly Quests</strong>{" "}
                follow ISO weeks and reset every Monday at 00:00 UTC.
              </p>
              <p>
                • <strong className="text-[#1D1D1F]">Idempotent Claims</strong>:
                Every quest claim is uniquely verified per user and period,
                guaranteeing zero duplicate payouts.
              </p>
            </div>
          </div>
        </div>

        {/* Active Quests Table */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Official Daily, Weekly &amp; Event Quests
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_QUESTS.map((q) => (
              <div
                key={q.code}
                className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#1D1D1F] px-3 py-0.5 font-mono text-xs font-bold uppercase text-white">
                      {q.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#C84200]">
                      +{q.rewardXp} XP · +{q.rewardPoints} AP
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] mt-3">
                    {q.name}
                  </h3>
                  <p className="text-sm text-[#5E5E63] mt-1 leading-relaxed">
                    {q.description}
                  </p>
                </div>
                {q.cosmeticReward && (
                  <div className="mt-3.5 pt-3 border-t border-[#1D1D1F]/[0.06] text-xs font-bold text-purple-700">
                    Bonus Cosmetic Unlock: {q.cosmeticReward}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Unlockable Avatar Frames & Profile Themes */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Unlockable Profile Cosmetics
          </h2>
          <p className="text-sm sm:text-[15px] text-[#5E5E63] mt-1 mb-6">
            Equip unlocked Avatar Frames and Profile Banner Themes anytime from
            your Profile customization modal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3.5">
                Avatar Frames ({frames.length})
              </h3>
              <div className="space-y-3">
                {frames.map((frame) => (
                  <div
                    key={frame.id}
                    className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#1D1D1F]">
                        {frame.name}
                      </div>
                      <div className="text-xs text-[#5E5E63] mt-0.5">
                        {frame.description}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#C84200] shrink-0">
                      LVL {frame.minLevel}+ · {frame.pointsCost} AP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3.5">
                Profile Banner Themes ({banners.length})
              </h3>
              <div className="space-y-3">
                {banners.map((theme) => (
                  <div
                    key={theme.id}
                    className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#1D1D1F]">
                        {theme.name}
                      </div>
                      <div className="text-xs text-[#5E5E63] mt-0.5">
                        {theme.description}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#C84200] shrink-0">
                      LVL {theme.minLevel}+ · {theme.pointsCost} AP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ArticleFeedbackWidget slug="quests-and-rewards" />
      </div>
    </div>
  )
}
