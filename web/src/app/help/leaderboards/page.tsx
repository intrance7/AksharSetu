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
    formula:
      "Sum of verified XpTransactions + reading, review, and book circulation milestones.",
    tieBreaker: "Longest reading streak, then earliest account milestone.",
  },
  {
    name: "Longest Active Reading Streak",
    formula:
      "Consecutive UTC calendar days (current and longest streak) with verified literary activity.",
    tieBreaker: "Total reading minutes in Shanti Mode.",
  },
  {
    name: "Books Completed & Shared",
    formula:
      "Books marked READ in personal shelf + verified Vidya Daan donations and marketplace exchanges.",
    tieBreaker: "Verified seller/donor rating.",
  },
  {
    name: "Helpful Reviewers & Scholars",
    formula:
      "Published book reviews + passage annotations + Sabha Book Club discussions.",
    tieBreaker: "Total XP earned from scholarly contributions.",
  },
]

export default function LeaderboardsDocPage() {
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
            <span className="text-white font-semibold">Leaderboards Guide</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-3.5">
            <BarChart3 className="h-3.5 w-3.5" /> Community Rankings
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
            How AksharSetu{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Leaderboards
            </span>{" "}
            Work
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
            Transparent ranking criteria, tie-breakers, fair-play protections,
            and one-click privacy opt-out controls.
          </p>
          <div className="mt-6">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] px-6 py-3 text-sm font-bold text-white transition-colors shadow-sm"
            >
              View Live Community Leaderboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10 space-y-8">
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Leaderboard Categories &amp; Ranking Formulas
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEADERBOARD_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] p-5"
              >
                <h3 className="text-base font-bold text-[#1D1D1F]">
                  {cat.name}
                </h3>
                <p className="text-sm text-[#5E5E63] mt-2 leading-relaxed">
                  <strong className="text-[#1D1D1F]">Calculation:</strong>{" "}
                  {cat.formula}
                </p>
                <p className="text-xs sm:text-[13px] text-[#6E6E73] mt-2.5">
                  <strong className="text-[#1D1D1F]">Tie-Breaker:</strong>{" "}
                  {cat.tieBreaker}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h3 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-[#0066cc]" />
              Privacy Opt-Out Controls
            </h3>
            <p className="text-[15px] text-[#5E5E63] mt-2.5 leading-relaxed">
              Prefer to read and collect badges privately? Open{" "}
              <strong className="text-[#1D1D1F]">
                Profile → Edit Profile &amp; Privacy
              </strong>{" "}
              and toggle{" "}
              <strong className="text-[#1D1D1F]">
                Opt Out of Public Leaderboards
              </strong>
              . You will continue to earn XP, levels, quests, and badges
              normally while remaining excluded from public ranking tables.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h3 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0A7D4F]" />
              Fair-Play &amp; Anti-Spam Enforcement
            </h3>
            <p className="text-[15px] text-[#5E5E63] mt-2.5 leading-relaxed">
              Accounts that attempt automated script farming, fake
              self-referrals, or repetitive dummy listings have their
              illegitimate XP transactions reversed by admins via the
              Gamification Audit Console and may be excluded from leaderboard
              eligibility.
            </p>
          </div>
        </div>

        <ArticleFeedbackWidget slug="leaderboards" />
      </div>
    </div>
  )
}
