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
    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1D1D1F]/[0.06] pb-5 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#C84200]">
            <Calculator className="h-3.5 w-3.5" /> Interactive Simulator
          </div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] mt-1 tracking-tight">
            Live XP &amp; Level Progression Calculator
          </h2>
          <p className="text-sm text-[#5E5E63] mt-1">
            Powered by the exact deterministic curve used across AksharSetu:
            <code className="ml-1.5 rounded-lg bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-2 py-0.5 text-[#1D1D1F] font-mono text-xs">
              round(100 × level^1.5)
            </code>
          </p>
        </div>

        <div className="inline-flex self-start rounded-full bg-[#FAF6F0] p-1 border border-[#1D1D1F]/[0.07]">
          <button
            type="button"
            onClick={() => setMode("xp")}
            className={`rounded-full px-4 py-2 text-xs sm:text-[13px] font-bold transition-colors cursor-pointer ${
              mode === "xp"
                ? "bg-[#1D1D1F] text-white"
                : "text-[#5E5E63] hover:text-[#1D1D1F]"
            }`}
          >
            Enter Total XP
          </button>
          <button
            type="button"
            onClick={() => setMode("activity")}
            className={`rounded-full px-4 py-2 text-xs sm:text-[13px] font-bold transition-colors cursor-pointer ${
              mode === "activity"
                ? "bg-[#1D1D1F] text-white"
                : "text-[#5E5E63] hover:text-[#1D1D1F]"
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
            <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-[#1D1D1F]">
                  Total Experience Points (XP)
                </label>
                <input
                  type="number"
                  min={0}
                  max={250000}
                  value={customXp}
                  onChange={(e) => setCustomXp(Number(e.target.value) || 0)}
                  className="w-32 rounded-xl border border-[#1D1D1F]/10 bg-white px-3 py-1.5 text-right font-mono text-sm font-bold text-[#C84200]"
                />
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={50}
                value={Math.min(50000, customXp)}
                onChange={(e) => setCustomXp(Number(e.target.value))}
                className="w-full accent-[#C84200]"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {[0, 350, 1250, 4500, 15000, 45000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomXp(preset)}
                    className="rounded-full bg-white hover:bg-[#C84200] hover:text-white px-3.5 py-1.5 font-mono text-xs font-bold text-[#1D1D1F] border border-[#1D1D1F]/10 transition-colors cursor-pointer"
                  >
                    {preset.toLocaleString()} XP
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4">
                <div className="text-xs sm:text-[13px] font-bold text-[#1D1D1F]">
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
                  className="mt-2 w-full rounded-xl border border-[#1D1D1F]/10 bg-white px-3.5 py-2 font-mono text-sm font-bold"
                />
              </div>
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4">
                <div className="text-xs sm:text-[13px] font-bold text-[#1D1D1F]">
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
                  className="mt-2 w-full rounded-xl border border-[#1D1D1F]/10 bg-white px-3.5 py-2 font-mono text-sm font-bold"
                />
              </div>
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4">
                <div className="text-xs sm:text-[13px] font-bold text-[#1D1D1F]">
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
                  className="mt-2 w-full rounded-xl border border-[#1D1D1F]/10 bg-white px-3.5 py-2 font-mono text-sm font-bold"
                />
              </div>
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4">
                <div className="text-xs sm:text-[13px] font-bold text-[#1D1D1F]">
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
                  className="mt-2 w-full rounded-xl border border-[#1D1D1F]/10 bg-white px-3.5 py-2 font-mono text-sm font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Resulting Level Card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0B0B0D] text-white p-6 sm:p-7 border border-white/10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#C84200]/30 blur-[60px]" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45]">
                  Calculated Rank
                </span>
                <div className="text-2xl sm:text-3xl font-bold mt-1">
                  {breakdown.rankTitle}
                </div>
                <div className="font-mono text-sm text-[#D2CDC5] mt-0.5">
                  {simulatedXp.toLocaleString()} Total XP
                </div>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-[#C84200] flex flex-col items-center justify-center shrink-0 shadow-sm">
                <span className="font-mono text-xs font-bold uppercase opacity-90">
                  LVL
                </span>
                <span className="font-mono text-2xl font-black leading-none">
                  {breakdown.level}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-[#D2CDC5]">
                  Level {breakdown.level} Progress ({breakdown.progressPercent}%)
                </span>
                <span className="font-mono font-bold text-white">
                  {breakdown.xpIntoLevel.toLocaleString()} /{" "}
                  {breakdown.xpForNextLevel.toLocaleString()} XP
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FF7F45] transition-all duration-300"
                  style={{ width: `${breakdown.progressPercent}%` }}
                />
              </div>
              <div className="mt-2.5 text-xs sm:text-sm text-[#D2CDC5]">
                Needs{" "}
                <strong className="font-mono text-white">
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
      </div>

      {/* Rank Tier Milestones Table */}
      <div className="mt-8 pt-6 border-t border-[#1D1D1F]/[0.06]">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3.5">
          Official Rank Tiers &amp; Cumulative XP Thresholds
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {milestones.map((m) => {
            const unlocked = breakdown.level >= m.minLevel
            return (
              <div
                key={m.minLevel}
                className={`rounded-2xl p-3.5 border text-left ${
                  unlocked
                    ? "bg-[#C84200]/[0.06] border-[#C84200]/30"
                    : "bg-[#FAF6F0] border-[#1D1D1F]/[0.06]"
                }`}
              >
                <div className="font-mono text-xs font-bold uppercase text-[#C84200]">
                  Level {m.minLevel}+
                </div>
                <div className="text-sm font-bold text-[#1D1D1F] mt-1">
                  {m.title}
                </div>
                <div className="font-mono text-xs font-semibold text-[#5E5E63] mt-1">
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
