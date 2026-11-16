import Link from "next/link"
import { DEFAULT_QUESTS } from "@/services/badgeService"
import { AVATAR_FRAMES, PROFILE_THEMES } from "@/lib/gamification"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import { Target, ChevronRight, Sparkles, Gift } from "lucide-react"

export const metadata = {
  title: "Quests, Akshar Points & Cosmetics Guide — AksharSetu Help Center",
  description:
    "How Daily, Weekly, and Event Quests work, how to claim rewards idempotently, and how to unlock Avatar Frames and Profile Themes.",
}

export default function QuestsAndRewardsDocPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-12 pb-16 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs text-[#86868b] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Quests & Rewards Guide</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-emerald-400 mb-3">
            <Target className="h-3.5 w-3.5" /> Daily, Weekly & Event Challenges
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter">
            Quests, Akshar Points & Profile Cosmetics
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
            Complete structured reading and community challenges to earn XP,
            Akshar Points (AP), and exclusive cosmetic avatar frames and themes.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 space-y-8">
        {/* XP vs Akshar Points Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#0066cc]" />
              Experience Points (XP) vs. Akshar Points (AP)
            </h2>
            <p className="text-xs text-[#6e6e73] mt-2 leading-relaxed">
              <strong>Experience Points (XP)</strong> measure your all-time
              literary rank and level progression (`Level 1` to `Level 100+`).
              XP is never spent.
              <br />
              <br />
              <strong>Akshar Points (AP)</strong> are reward points earned from
              Daily Check-Ins, Quests, and Achievement Unlocks that recognize
              your active seasonal participation and unlock profile cosmetics.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-600" />
              Reset Windows & Duplicate Claim Protection
            </h2>
            <p className="text-xs text-[#6e6e73] mt-2 leading-relaxed">
              • <strong>Daily Quests</strong> use the UTC day key (`YYYY-MM-DD`)
              and can be claimed once per day after meeting the target metric.
              <br />• <strong>Weekly Quests</strong> use the ISO week key
              (`YYYY-Wnn`) and reset every Monday at `00:00 UTC`.
              <br />• <strong>Idempotent Claims</strong>: Every quest claim is
              keyed by `(userId, questId, periodKey)`, guaranteeing zero
              duplicate payouts.
            </p>
          </div>
        </div>

        {/* Active Quests Table */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <h2 className="text-xl font-bold text-[#1d1d1f]">
            Official Daily, Weekly & Event Quests
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_QUESTS.map((q) => (
              <div
                key={q.code}
                className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#1d1d1f] px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                      {q.category}
                    </span>
                    <span className="text-xs font-bold text-[#0066cc]">
                      +{q.rewardXp} XP · +{q.rewardPoints} AP
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1d1d1f] mt-2">
                    {q.name}
                  </h3>
                  <p className="text-xs text-[#6e6e73] mt-1">{q.description}</p>
                </div>
                {q.cosmeticReward && (
                  <div className="mt-3 pt-2 border-t border-black/[0.05] text-[11px] font-bold text-purple-600">
                    Bonus Cosmetic Unlock: {q.cosmeticReward}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Unlockable Avatar Frames & Profile Themes */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <h2 className="text-xl font-bold text-[#1d1d1f]">
            Unlockable Profile Cosmetics
          </h2>
          <p className="text-xs text-[#86868b] mt-1 mb-5">
            Equip unlocked Avatar Frames and Profile Banner Themes anytime from
            your Profile customization modal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                Avatar Frames ({AVATAR_FRAMES.length})
              </h3>
              <div className="space-y-2.5">
                {AVATAR_FRAMES.map((frame) => (
                  <div
                    key={frame.id}
                    className="rounded-xl bg-[#f5f5f7] p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#1d1d1f]">
                        {frame.name}
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        {frame.requirement}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#0066cc]">
                      Level {frame.minLevel}+
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                Profile Banner Themes ({PROFILE_THEMES.length})
              </h3>
              <div className="space-y-2.5">
                {PROFILE_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className="rounded-xl bg-[#f5f5f7] p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#1d1d1f]">
                        {theme.name}
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        {theme.description}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#0066cc]">
                      Level {theme.minLevel}+
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
