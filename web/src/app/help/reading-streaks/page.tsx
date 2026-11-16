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
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-12 pb-16 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs text-[#86868b] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">Reading Streaks & Heatmap Guide</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-amber-400 mb-3">
            <Flame className="h-3.5 w-3.5" /> Daily Literary Habit Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter">
            Reading Streaks & The 365-Day Literary Heatmap
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
            How daily reading sessions, annotations, and community actions keep
            your streak flame alive and illuminate your 365-day profile
            contribution graph.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Qualifying Daily Streak Activities
            </h2>
            <p className="text-xs text-[#86868b] mt-1 mb-4">
              Completing any one of the following verified actions during a
              calendar day increments your active streak:
            </p>
            <ul className="space-y-2.5 text-xs text-[#1d1d1f]">
              <li className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 font-medium">
                • Completing a Shanti Mode or E-Library reading session (1+
                minutes)
              </li>
              <li className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 font-medium">
                • Claiming your Daily Check-In on your Profile or Quests tab
              </li>
              <li className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 font-medium">
                • Saving a literary note, quote, or passage annotation
              </li>
              <li className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 font-medium">
                • Publishing a verified book review or Sabha Book Club post
              </li>
              <li className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 font-medium">
                • Listing or donating a book in the AksharSetu marketplace
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#0066cc]" />
              Daily Reset & Streak Calculation Rules
            </h2>
            <div className="mt-4 space-y-3 text-xs text-[#6e6e73] leading-relaxed">
              <div className="rounded-xl bg-[#f5f5f7] p-4">
                <strong className="text-[#1d1d1f] block mb-1">
                  UTC Day Key (`YYYY-MM-DD`)
                </strong>
                Every activity is stamped with an ISO day key (`toDayKey()`).
                Consecutive day keys (`day[n] - day[n-1] === 1 day`) build your
                running streak.
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-4">
                <strong className="text-[#1d1d1f] block mb-1">
                  Grace Window Until End of Today
                </strong>
                Your current streak stays active if you recorded an activity
                either today or yesterday, giving you the full current day to
                extend your chain before it resets to `0`.
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-4">
                <strong className="text-[#1d1d1f] block mb-1">
                  Longest Streak Preservation
                </strong>
                Even if your `currentStreak` resets after a missed day, your all-time
                `longestStreak` record is permanently preserved on your profile.
              </div>
            </div>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Streak Milestones & Achievement Rewards
          </h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STREAK_MILESTONES.map((m) => (
              <div
                key={m.days}
                className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 p-4"
              >
                <div className="text-xs font-black uppercase tracking-wider text-amber-600">
                  {m.days}
                </div>
                <div className="text-sm font-bold text-[#1d1d1f] mt-1">
                  {m.title}
                </div>
                <p className="text-xs text-[#6e6e73] mt-1">{m.reward}</p>
              </div>
            ))}
          </div>
        </div>

        <ArticleFeedbackWidget slug="reading-streaks" />
      </div>
    </div>
  )
}
