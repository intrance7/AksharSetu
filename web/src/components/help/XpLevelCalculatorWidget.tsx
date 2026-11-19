"use client"

import { useState, useMemo } from "react"
import {
  calculateLevelFromXP,
  xpRequiredForStep,
  LEVEL_TITLES,
  XP_REWARDS,
} from "@/lib/gamification"
import { Calculator } from "lucide-react"

function cumulativeXpForLevel(targetLevel: number): number {
  let total = 0
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    total += xpRequiredForStep(lvl)
  }
  return total
}

export function XpLevelCalculatorWidget() {
  const [customXp, setCustomXp] = useState<number>(1250)
  const [booksCompleted, setBooksCompleted] = useState<number>(3)
  const [readingMinutes, setReadingMinutes] = useState<number>(180)
  const [reviewsWritten, setReviewsWritten] = useState<number>(4)
  const [booksDonated, setBooksDonated] = useState<number>(1)
  const [mode, setMode] = useState<"xp" | "activity">("xp")

  const simulatedXp = useMemo(() => {
    if (mode === "xp") return Math.max(0, customXp)
    return (
      booksCompleted * XP_REWARDS.BOOK_COMPLETED +
      readingMinutes * 2 +
      reviewsWritten * XP_REWARDS.REVIEW_PUBLISHED +
      booksDonated * XP_REWARDS.BOOK_DONATED
    )
  }, [
    mode,
    customXp,
    booksCompleted,
    readingMinutes,
    reviewsWritten,
    booksDonated,
  ])

  const breakdown = useMemo(
    () => calculateLevelFromXP(simulatedXp),
    [simulatedXp]
  )

  const milestones = useMemo(
    () =>
      [...LEVEL_TITLES]
        .reverse()
        .map((m) => ({
          ...m,
          requiredTotalXp: cumulativeXpForLevel(m.minLevel),
        })),
    []
  )

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0066cc]">
            <Calculator className="h-3.5 w-3.5" /> Interactive Simulator
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f] mt-1">
            Live XP & Level Progression Calculator
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Powered by the exact deterministic curve used across AksharSetu:
            <code className="ml-1 rounded bg-[#f5f5f7] px-1.5 py-0.5 text-[#1d1d1f] font-mono">
              round(100 × level^1.5)
            </code>
          </p>
        </div>

        <div className="inline-flex self-start rounded-full bg-[#FAF6F0] p-1 border border-black/5">
          <button
            type="button"
            onClick={() => setMode("xp")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              mode === "xp"
                ? "bg-[#1d1d1f] text-white"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            Enter Total XP
          </button>
          <button
            type="button"
            onClick={() => setMode("activity")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              mode === "activity"
                ? "bg-[#1d1d1f] text-white"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            }`}
          >
            Simulate Activities
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Controls */}
        <div className="space-y-4">
          {mode === "xp" ? (
            <div className="rounded-xl bg-[#f5f5f7] p-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#1d1d1f]">
                  Total Experience Points (XP)
                </label>
                <input
                  type="number"
                  min={0}
                  max={250000}
                  value={customXp}
                  onChange={(e) => setCustomXp(Number(e.target.value) || 0)}
                  className="w-28 rounded-lg border border-black/10 bg-white px-3 py-1 text-right text-sm font-bold text-[#0066cc]"
                />
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={50}
                value={Math.min(50000, customXp)}
                onChange={(e) => setCustomXp(Number(e.target.value))}
                className="w-full accent-[#0066cc]"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[0, 350, 1250, 4500, 15000, 45000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomXp(preset)}
                    className="rounded-full bg-white hover:bg-[#0066cc] hover:text-white px-3 py-1 text-[11px] font-bold text-[#1d1d1f] border border-black/10 transition-colors"
                  >
                    {preset.toLocaleString()} XP
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f5f5f7] p-3.5">
                <div className="text-xs font-bold text-[#1d1d1f]">
                  Books Completed (+{XP_REWARDS.BOOK_COMPLETED} XP)
                </div>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={booksCompleted}
                  onChange={(e) =>
                    setBooksCompleted(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-bold"
                />
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-3.5">
                <div className="text-xs font-bold text-[#1d1d1f]">
                  Reading Minutes (+2 XP/min)
                </div>
                <input
                  type="number"
                  min={0}
                  max={20000}
                  value={readingMinutes}
                  onChange={(e) =>
                    setReadingMinutes(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-bold"
                />
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-3.5">
                <div className="text-xs font-bold text-[#1d1d1f]">
                  Verified Reviews (+{XP_REWARDS.REVIEW_PUBLISHED} XP)
                </div>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={reviewsWritten}
                  onChange={(e) =>
                    setReviewsWritten(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-bold"
                />
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-3.5">
                <div className="text-xs font-bold text-[#1d1d1f]">
                  Books Donated (+{XP_REWARDS.BOOK_DONATED} XP)
                </div>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={booksDonated}
                  onChange={(e) =>
                    setBooksDonated(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Resulting Level Card */}
        <div className="rounded-2xl bg-black text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#0066cc]">
                Calculated Rank
              </span>
              <div className="text-2xl font-bold mt-0.5">
                {breakdown.rankTitle}
              </div>
              <div className="text-xs text-[#86868b]">
                {simulatedXp.toLocaleString()} Total XP
              </div>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-[#0066cc] flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase opacity-80">
                LVL
              </span>
              <span className="text-xl font-black leading-none">
                {breakdown.level}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#86868b]">
                Level {breakdown.level} Progress ({breakdown.progressPercent}%)
              </span>
              <span className="font-bold text-white">
                {breakdown.xpIntoLevel.toLocaleString()} /{" "}
                {breakdown.xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0066cc] transition-all duration-300"
                style={{ width: `${breakdown.progressPercent}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-[#86868b]">
              Needs{" "}
              <strong className="text-white">
                {Math.max(
                  0,
                  breakdown.xpForNextLevel - breakdown.xpIntoLevel
                ).toLocaleString()}{" "}
                XP
              </strong>{" "}
              more to reach Level {breakdown.level + 1}.
            </div>
          </div>
        </div>
      </div>

      {/* Rank Tier Milestones Table */}
      <div className="mt-8 pt-6 border-t border-black/[0.06]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
          Official Rank Tiers & Cumulative XP Thresholds
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {milestones.map((m) => {
            const unlocked = breakdown.level >= m.minLevel
            return (
              <div
                key={m.minLevel}
                className={`rounded-xl p-3 border text-left ${
                  unlocked
                    ? "bg-[#0066cc]/5 border-[#0066cc]/30"
                    : "bg-[#f5f5f7] border-black/[0.05]"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#0066cc]">
                  Level {m.minLevel}+
                </div>
                <div className="text-xs font-bold text-[#1d1d1f] mt-0.5">
                  {m.title}
                </div>
                <div className="text-[11px] font-semibold text-[#6e6e73] mt-1">
                  {m.requiredTotalXp.toLocaleString()} XP
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
