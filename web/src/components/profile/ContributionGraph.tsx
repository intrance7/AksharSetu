"use client"

import { useState, useMemo } from "react"
import { Flame, Calendar, Sparkles } from "lucide-react"
import { STREAK_MILESTONES } from "@/lib/gamification"

export interface DailyContribution {
  date: string // YYYY-MM-DD
  total: number
  reading: number
  marketplace: number
  community: number
  items: string[]
}

export function ContributionGraph({
  contributions,
  currentStreak,
  longestStreak,
}: {
  contributions: Record<string, DailyContribution>
  currentStreak: number
  longestStreak: number
}) {
  const [selectedDay, setSelectedDay] = useState<DailyContribution | null>(null)

  const { weeks, monthLabels, totalYearCount, mostActiveDay } = useMemo(() => {
    const today = new Date()
    const endUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    )
    // Start 52 weeks ago aligned to Sunday
    const startUtc = new Date(endUtc.getTime() - 363 * 86400000)
    const startDayOfWeek = startUtc.getUTCDay()
    const alignedStart = new Date(
      startUtc.getTime() - startDayOfWeek * 86400000
    )

    const weeksArr: { date: string; count: number; data: DailyContribution }[][] =
      []
    const months: { weekIndex: number; label: string }[] = []
    let lastMonth = -1
    let totalCount = 0
    let maxDay: DailyContribution | null = null

    let cursor = new Date(alignedStart)
    let weekIdx = 0

    while (cursor <= endUtc) {
      const week: { date: string; count: number; data: DailyContribution }[] = []
      for (let d = 0; d < 7; d++) {
        const key = cursor.toISOString().slice(0, 10)
        const month = cursor.getUTCMonth()
        if (d === 0 && month !== lastMonth) {
          months.push({
            weekIndex: weekIdx,
            label: cursor.toLocaleString("en-US", {
              month: "short",
              timeZone: "UTC",
            }),
          })
          lastMonth = month
        }

        const entry = contributions[key] || {
          date: key,
          total: 0,
          reading: 0,
          marketplace: 0,
          community: 0,
          items: [],
        }

        if (cursor <= endUtc) {
          totalCount += entry.total
          if (!maxDay || entry.total > maxDay.total) {
            if (entry.total > 0) maxDay = entry
          }
        }

        week.push({ date: key, count: entry.total, data: entry })
        cursor = new Date(cursor.getTime() + 86400000)
      }
      weeksArr.push(week)
      weekIdx += 1
    }

    return {
      weeks: weeksArr,
      monthLabels: months,
      totalYearCount: totalCount,
      mostActiveDay: maxDay,
    }
  }, [contributions])

  const getCellClass = (day: DailyContribution) => {
    if (day.total === 0) return "bg-[#EFE7DC] border-[#1D1D1F]/[0.05]"
    if (day.total === 1) return "bg-[#FAD6BF] border-[#E89B6B]/40"
    if (day.total === 2) return "bg-[#F09965] border-[#DC6D2E]/50"
    if (day.total <= 4) return "bg-[#DE5D1E] border-[#C84200]/70"
    return "bg-[#C84200] border-[#9E3300]"
  }

  const visibleMonthLabels = useMemo(() => {
    const filtered: { weekIndex: number; label: string }[] = []
    for (const m of monthLabels) {
      const prev = filtered[filtered.length - 1]
      if (!prev || m.weekIndex - prev.weekIndex >= 3) {
        filtered.push(m)
      }
    }
    return filtered
  }, [monthLabels])

  return (
    <div className="bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-sm p-6 md:p-8 space-y-6">
      {/* Header & Summary Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84200] mb-1.5">
            Reading Rhythm · 52 Weeks
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-[#1d1d1f] tracking-tight flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#C84200]" />
            Activity & Reading Streak
          </h3>
          <p className="text-sm font-medium text-[#6e6e73] mt-1">
            {totalYearCount} verified actions across Shanti sessions, book
            handoffs, reviews, and Sabha circles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-3 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C84200]/10 flex items-center justify-center shrink-0">
              <Flame className="w-4.5 h-4.5 text-[#C84200]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Current Streak
              </p>
              <p className="text-base sm:text-lg font-black text-[#1d1d1f] leading-tight">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Longest Streak
              </p>
              <p className="text-base sm:text-lg font-black text-[#1d1d1f] leading-tight">
                {longestStreak} {longestStreak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

          {mostActiveDay && (
            <div className="px-4 py-3 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Peak Day
              </p>
              <p className="text-sm sm:text-base font-black text-[#1d1d1f] leading-tight mt-0.5">
                {mostActiveDay.date} · {mostActiveDay.total} actions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Streak Milestones Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs font-black uppercase tracking-wider text-[#6e6e73] shrink-0">
          Milestones:
        </span>
        {STREAK_MILESTONES.map((m) => {
          const achieved = longestStreak >= m || currentStreak >= m
          return (
            <span
              key={m}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                achieved
                  ? "bg-[#C84200]/12 border-[#C84200]/30 text-[#C84200]"
                  : "bg-[#FAF6F0] border-[#1D1D1F]/[0.06] text-[#6e6e73]"
              }`}
            >
              {achieved ? "✓ " : ""}
              {m}d
            </span>
          )
        })}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[840px]">
          {/* Month Labels */}
          <div className="flex text-xs font-bold text-[#6e6e73] mb-2 pl-10 relative h-5">
            {visibleMonthLabels.map((m, idx) => (
              <span
                key={`${m.label}-${idx}`}
                style={{ left: `${40 + m.weekIndex * 15}px` }}
                className="absolute"
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-2">
            {/* Day-of-Week Labels */}
            <div className="flex flex-col justify-between h-[102px] w-8 shrink-0 text-xs font-bold text-[#6e6e73] py-0.5">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* 52 Weeks Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((cell) => (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => setSelectedDay(cell.data)}
                      onMouseEnter={() => setSelectedDay(cell.data)}
                      title={`${cell.date}: ${cell.count} contribution${
                        cell.count === 1 ? "" : "s"
                      }`}
                      className={`w-3 h-3 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getCellClass(
                        cell.data
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend + Selected Day Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#1D1D1F]/[0.07] text-sm">
        <div className="text-[#6e6e73] font-medium">
          {selectedDay ? (
            <span>
              <strong className="text-[#1d1d1f]">{selectedDay.date}</strong>:{" "}
              {selectedDay.total === 0
                ? "Quiet day on the shelf"
                : `${selectedDay.total} contribution${
                    selectedDay.total === 1 ? "" : "s"
                  } (${selectedDay.items.slice(0, 3).join(" · ")})`}
            </span>
          ) : (
            <span>Hover or tap any day square to inspect activity details.</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6e6e73] shrink-0">
          <span>Less</span>
          <span className="w-3 h-3 rounded-[3px] bg-[#EFE7DC] border border-black/10" />
          <span className="w-3 h-3 rounded-[3px] bg-[#FAD6BF]" />
          <span className="w-3 h-3 rounded-[3px] bg-[#F09965]" />
          <span className="w-3 h-3 rounded-[3px] bg-[#DE5D1E]" />
          <span className="w-3 h-3 rounded-[3px] bg-[#C84200]" />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
