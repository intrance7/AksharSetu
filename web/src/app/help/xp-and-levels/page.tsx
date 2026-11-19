import Link from "next/link"
import { XP_REWARDS } from "@/lib/gamification"
import { XpLevelCalculatorWidget } from "@/components/help/XpLevelCalculatorWidget"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import { Sparkles, ShieldCheck, ChevronRight } from "lucide-react"

export const metadata = {
  title: "XP & Levels Guide — AksharSetu Help Center",
  description:
    "Complete breakdown of how Experience Points (XP), Rank Titles, daily caps, and level progression work on AksharSetu.",
}

const XP_ACTION_ROWS = [
  {
    action: "Complete a Book in Reading Room",
    xp: `+${XP_REWARDS.BOOK_COMPLETED} XP`,
    cap: "Verified per book completion",
    category: "Reading",
  },
  {
    action: "Donate a Book (Vidya Daan / ₹0 Listing)",
    xp: `+${XP_REWARDS.BOOK_DONATED} XP`,
    cap: "Reversed if listing deleted before handoff",
    category: "Donation",
  },
  {
    action: "Complete Weekly Challenge Quest",
    xp: `+${XP_REWARDS.WEEKLY_CHALLENGE} XP`,
    cap: "Once per ISO week",
    category: "Quests",
  },
  {
    action: "Sell or Exchange a Book",
    xp: `+${XP_REWARDS.BOOK_SOLD} XP`,
    cap: "Verified upon order/offer completion",
    category: "Marketplace",
  },
  {
    action: "Publish a Verified Book Review",
    xp: `+${XP_REWARDS.REVIEW_PUBLISHED} XP`,
    cap: "1 review per book per user",
    category: "Reviews",
  },
  {
    action: "List a Book in the Marketplace",
    xp: `+${XP_REWARDS.BOOK_LISTED} XP`,
    cap: "Up to 5 listings/day XP cap",
    category: "Marketplace",
  },
  {
    action: "Daily Check-In Claim",
    xp: `+${XP_REWARDS.DAILY_CHECKIN} XP`,
    cap: "Once per UTC calendar day (+10 AP)",
    category: "Streaks",
  },
  {
    action: "Purchase a Book on AksharSetu",
    xp: `+${XP_REWARDS.BOOK_PURCHASED} XP`,
    cap: "Verified paid order",
    category: "Marketplace",
  },
  {
    action: "Shanti Mode Mindful Reading Session",
    xp: `+${XP_REWARDS.READING_SESSION} XP (+2 XP/min)`,
    cap: "Minimum 1 minute; daily fair-play cap applies",
    category: "Reading",
  },
  {
    action: "Post in a Sabha Book Club",
    xp: `+${XP_REWARDS.CLUB_CONTRIBUTION} XP`,
    cap: "Up to 5 posts/day XP cap",
    category: "Community",
  },
]

export default function XpAndLevelsDocPage() {
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
            <span className="text-white font-semibold">XP &amp; Levels Guide</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-3.5">
            <Sparkles className="h-3.5 w-3.5" /> Official Progression System
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.06]">
            How XP, Levels &amp;{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Literary Ranks
            </span>{" "}
            Work
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
            Every page you read, review you write, and book you circulate on
            AksharSetu earns verified Experience Points (XP) toward your
            permanent Literary Scholar Rank.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10 space-y-8">
        {/* Interactive Calculator */}
        <XpLevelCalculatorWidget />

        {/* Complete XP Reward Table */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Verified Actions That Award XP
          </h2>
          <p className="text-sm sm:text-[15px] text-[#5E5E63] mt-1 mb-6">
            All values below are pulled directly from the live AksharSetu
            progression engine.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1D1D1F]/[0.08] font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
                  <th className="py-3.5 pr-4">Platform Activity</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">XP Awarded</th>
                  <th className="py-3.5 pl-4">
                    Verification &amp; Anti-Abuse Cap
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D1F]/[0.06] text-sm">
                {XP_ACTION_ROWS.map((row) => (
                  <tr key={row.action} className="hover:bg-[#FAF6F0]/70">
                    <td className="py-4 pr-4 font-bold text-[#1D1D1F]">
                      {row.action}
                    </td>
                    <td className="py-4 px-4 text-[#5E5E63]">{row.category}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex rounded-full bg-[#FAF6F0] border border-[#C84200]/20 px-3 py-1 font-mono text-xs font-bold text-[#C84200]">
                        {row.xp}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-[#5E5E63]">{row.cap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anti-Abuse & Idempotency Protection */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
          <div className="flex items-center gap-2 text-[#C84200] font-mono text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-4 w-4" /> Fair-Play &amp; Idempotency
            Engine
          </div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            Anti-Abuse Rules, Cooldowns &amp; Reversals
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#5E5E63] leading-relaxed">
            <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-5">
              <strong className="text-[#1D1D1F] block mb-1.5 text-base">
                1. Cryptographic Idempotency Keys
              </strong>
              Every XP award is logged in the verified XP ledger with a unique
              idempotency key per milestone or day. Refreshing or
              double-clicking never grants duplicate XP.
            </div>
            <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-5">
              <strong className="text-[#1D1D1F] block mb-1.5 text-base">
                2. Daily Farming Protections
              </strong>
              Rapidly creating and deleting listings or spamming short one-word
              notes does not inflate XP. Daily check-ins are strictly limited to
              once per UTC calendar day.
            </div>
            <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-5">
              <strong className="text-[#1D1D1F] block mb-1.5 text-base">
                3. Fraudulent Action Reversals
              </strong>
              If a transaction is refunded due to policy violations or a fake
              listing is removed by moderation, the associated XP ledger entry
              is reversed and deducted from leaderboard totals.
            </div>
          </div>
        </div>

        <ArticleFeedbackWidget slug="xp-and-levels" />
      </div>
    </div>
  )
}
