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
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-12 pb-16 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-xs text-[#86868b] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">XP & Levels Guide</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Official Progression System
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter">
            How XP, Levels & Literary Ranks Work
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
            Every page you read, review you write, and book you circulate on
            AksharSetu earns verified Experience Points (XP) toward your
            permanent Literary Scholar Rank.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 space-y-8">
        {/* Interactive Calculator */}
        <XpLevelCalculatorWidget />

        {/* Complete XP Reward Table */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <h2 className="text-xl font-bold text-[#1d1d1f]">
            Verified Actions That Award XP
          </h2>
          <p className="text-xs text-[#86868b] mt-1 mb-5">
            All values below are pulled directly from the live AksharSetu
            progression engine (`XP_REWARDS`).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                  <th className="py-3 pr-4">Platform Activity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">XP Awarded</th>
                  <th className="py-3 pl-4">Verification & Anti-Abuse Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] text-xs">
                {XP_ACTION_ROWS.map((row) => (
                  <tr key={row.action} className="hover:bg-[#f5f5f7]/60">
                    <td className="py-3.5 pr-4 font-bold text-[#1d1d1f]">
                      {row.action}
                    </td>
                    <td className="py-3.5 px-4 text-[#6e6e73]">
                      {row.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex rounded-full bg-[#0066cc]/10 px-2.5 py-0.5 font-bold text-[#0066cc]">
                        {row.xp}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-[#86868b]">{row.cap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anti-Abuse & Idempotency Protection */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
          <div className="flex items-center gap-2 text-[#0066cc] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-4 w-4" /> Fair-Play & Idempotency Engine
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f]">
            Anti-Abuse Rules, Cooldowns & Reversals
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#6e6e73] leading-relaxed">
            <div className="rounded-xl bg-[#f5f5f7] p-4">
              <strong className="text-[#1d1d1f] block mb-1">
                1. Cryptographic Idempotency Keys
              </strong>
              Every XP award is logged in the `XpTransaction` ledger with a
              unique `idempotencyKey` (such as `checkin:userId:2026-11-16` or
              `badge:userId:badgeId`). Refreshing or double-clicking never
              grants duplicate XP.
            </div>
            <div className="rounded-xl bg-[#f5f5f7] p-4">
              <strong className="text-[#1d1d1f] block mb-1">
                2. Daily Farming Protections
              </strong>
              Rapidly creating and deleting listings or spamming short one-word
              notes does not inflate XP. Daily check-ins are strictly limited to
              once per UTC calendar day.
            </div>
            <div className="rounded-xl bg-[#f5f5f7] p-4">
              <strong className="text-[#1d1d1f] block mb-1">
                3. Fraudulent Action Reversals
              </strong>
              If a transaction is refunded due to policy violations or a fake
              listing is removed by moderation, the associated `XpTransaction`
              is marked `reversedAt` and deducted from leaderboard totals.
            </div>
          </div>
        </div>

        <ArticleFeedbackWidget slug="xp-and-levels" />
      </div>
    </div>
  )
}
