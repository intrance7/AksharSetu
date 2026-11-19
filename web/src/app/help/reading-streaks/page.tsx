import Link from "next/link"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import { Flame, ChevronRight, Calendar, CheckCircle2, Clock } from "lucide-react"

export const metadata = {
  title: "Reading Streaks & 365-Day Heatmap Guide — AksharSetu Help Center",
  description:
    "Learn what activities count toward your daily reading streak, UTC reset rules, and streak milestone rewards on AksharSetu.",
}

const STREAK_MILESTONES = [
  {
    days: "3 Days",
    title: "Momentum Spark",
    reward: "Daily Check-In Streak Bonus + Heatmap Highlight",
  },
  {
    days: "7 Days",
    title: "Consistent Reader Badge (RARE)",
    reward: "+150 XP & +60 Akshar Points",
  },
  {
    days: "14 Days",
    title: "Two-Week Scholar",
    reward: "Weekly Quest Streak Multiplier & Leaderboard Climb",
  },
  {
    days: "30 Days",
    title: "Unstoppable Reader Badge (LEGENDARY)",
    reward: "+500 XP & +200 Akshar Points",
  },
  {
    days: "100 Days",
    title: "Century Reader Badge (MYTHIC)",
    reward: "+1,200 XP & +500 Akshar Points",
  },
  {
    days: "365 Days",
    title: "Year-Round Literary Luminary",
    reward: "Full Golden Heatmap Grid & Hall of Fame Recognition",
  },
]

export default function ReadingStreaksDocPage() {
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
              Reading Streaks &amp; Heatmap Guide
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-3.5">
            <Flame className="h-3.5 w-3.5" /> Daily Literary Habit Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
            Reading Streaks &amp; The{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              365-Day Heatmap
            </span>
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
            How daily reading sessions, annotations, and community actions keep
            your streak flame alive and illuminate your 365-day profile
            contribution graph.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#0A7D4F]" />
              Qualifying Daily Streak Activities
            </h2>
            <p className="text-sm text-[#5E5E63] mt-1.5 mb-5 leading-relaxed">
              Completing any one of the following verified actions during a
              calendar day increments your active streak:
            </p>
            <ul className="space-y-2.5 text-sm text-[#1D1D1F]">
              <li className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3 font-medium">
                • Completing a Shanti Mode or E-Library reading session (1+
                minutes)
              </li>
              <li className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3 font-medium">
                • Claiming your Daily Check-In on your Profile or Quests tab
              </li>
              <li className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3 font-medium">
                • Saving a literary note, quote, or passage annotation
              </li>
              <li className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3 font-medium">
                • Publishing a verified book review or Sabha Book Club post
              </li>
              <li className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3 font-medium">
                • Listing or donating a book in the AksharSetu marketplace
              </li>
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#C84200]" />
              Daily Reset &amp; Streak Calculation Rules
            </h2>
            <div className="mt-5 space-y-3.5 text-sm text-[#5E5E63] leading-relaxed">
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4.5">
                <strong className="text-[#1D1D1F] block mb-1 text-base">
                  UTC Daily Stamp (YYYY-MM-DD)
                </strong>
                Every activity is stamped with an ISO UTC calendar day.
                Consecutive active days build your running reading streak.
              </div>
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4.5">
                <strong className="text-[#1D1D1F] block mb-1 text-base">
                  Grace Window Until End of Today
                </strong>
                Your current streak stays active if you recorded an activity
                either today or yesterday, giving you the full current day to
                extend your chain before it resets to 0.
              </div>
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4.5">
                <strong className="text-[#1D1D1F] block mb-1 text-base">
                  Longest Streak Preservation
                </strong>
                Even if your current streak resets after a missed day, your
                all-time longest streak record is permanently preserved on your
                profile.
              </div>
            </div>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <h2 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-2 tracking-tight">
            <Calendar className="h-5 w-5 text-[#C84200]" />
            Streak Milestones &amp; Achievement Rewards
          </h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STREAK_MILESTONES.map((m) => (
              <div
                key={m.days}
                className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] p-5"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#C84200]">
                  {m.days}
                </div>
                <div className="text-base font-bold text-[#1D1D1F] mt-1">
                  {m.title}
                </div>
                <p className="text-sm text-[#5E5E63] mt-1.5 leading-relaxed">
                  {m.reward}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ArticleFeedbackWidget slug="reading-streaks" />
      </div>
    </div>
  )
}
