import Link from "next/link"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import { BarChart3, ChevronRight, Shield, EyeOff, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Leaderboards & Fair-Play Guide — AksharSetu Help Center",
  description:
    "Learn how AksharSetu community leaderboards are ranked, anti-manipulation rules, and how to opt out for privacy.",
}

const LEADERBOARD_CATEGORIES = [
  {
    name: "Top Literary XP (Overall Rank)",
    formula: "Sum of verified XpTransactions + reading, review, and book circulation milestones.",
    tieBreaker: "Longest reading streak, then earliest account milestone.",
  },
  {
    name: "Longest Active Reading Streak",
    formula: "Consecutive UTC calendar days (current and longest streak) with verified literary activity.",
    tieBreaker: "Total reading minutes in Shanti Mode.",
  },
  {
    name: "Books Completed & Shared",
    formula: "Books marked READ in personal shelf + verified Vidya Daan donations and marketplace exchanges.",
    tieBreaker: "Verified seller/donor rating.",
  },
  {
    name: "Helpful Reviewers & Scholars",
    formula: "Published book reviews + passage annotations + Sabha Book Club discussions.",
    tieBreaker: "Total XP earned from scholarly contributions.",
  },
]

export default function LeaderboardsDocPage() {
  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-12 pb-16 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs text-[#86868b] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Leaderboards Guide</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-rose-400 mb-3">
            <BarChart3 className="h-3.5 w-3.5" /> Community Rankings
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter">
            How AksharSetu Leaderboards Work
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
            Transparent ranking criteria, tie-breakers, fair-play protections,
            and one-click privacy opt-out controls.
          </p>
          <div className="mt-6">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 py-2.5 text-xs font-bold text-white transition-colors"
            >
              View Live Community Leaderboard{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 space-y-8">
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <h2 className="text-xl font-bold text-[#1d1d1f]">
            Leaderboard Categories & Ranking Formulas
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEADERBOARD_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 p-5"
              >
                <h3 className="text-sm font-bold text-[#1d1d1f]">{cat.name}</h3>
                <p className="text-xs text-[#6e6e73] mt-1.5 leading-relaxed">
                  <strong>Calculation:</strong> {cat.formula}
                </p>
                <p className="text-[11px] text-[#86868b] mt-2">
                  <strong>Tie-Breaker:</strong> {cat.tieBreaker}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h3 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-[#0066cc]" />
              Privacy Opt-Out Controls
            </h3>
            <p className="text-xs text-[#6e6e73] mt-2 leading-relaxed">
              Prefer to read and collect badges privately? Open{" "}
              <strong>Profile → Edit Profile & Privacy</strong> and toggle{" "}
              <strong>Opt Out of Public Leaderboards</strong>. You will continue
              to earn XP, levels, quests, and badges normally while remaining
              excluded from public ranking tables.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h3 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Fair-Play & Anti-Spam Enforcement
            </h3>
            <p className="text-xs text-[#6e6e73] mt-2 leading-relaxed">
              Accounts that attempt automated script farming, fake self-referrals,
              or repetitive dummy listings have their illegitimate XP transactions
              reversed by admins via the Gamification Audit Console and may be
              excluded from leaderboard eligibility.
            </p>
          </div>
        </div>

        <ArticleFeedbackWidget slug="leaderboards" />
      </div>
    </div>
  )
}
