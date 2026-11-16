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
    if (day.total === 0) return "bg-[#f5f5f7] border-black/5"
    if (day.total === 1) return "bg-[#0066cc]/30 border-[#0066cc]/40"
    if (day.total === 2) return "bg-[#0066cc]/55 border-[#0066cc]/60"
    if (day.total <= 4) return "bg-[#0066cc]/80 border-[#0066cc]"
    return "bg-[#0066cc] border-[#004499]"
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-5">
      {/* Header & Summary Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0066cc]" />
            Reading & Contribution Activity (Past 12 Months)
          </h3>
          <p className="text-xs font-medium text-[#86868b] mt-0.5">
            {totalYearCount} verified contributions across reading sessions,
            book handoffs, reviews, and community circles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[#f5f5f7] flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#C84200]" />
            <div>
              <p className="text-[10px] font-bold uppercase text-[#86868b]">
                Current Streak
              </p>
              <p className="text-sm font-black text-[#1d1d1f]">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[#f5f5f7] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0066cc]" />
            <div>
              <p className="text-[10px] font-bold uppercase text-[#86868b]">
                Longest Streak
              </p>
              <p className="text-sm font-black text-[#1d1d1f]">
                {longestStreak} {longestStreak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

          {mostActiveDay && (
            <div className="px-3.5 py-2 rounded-xl bg-[#f5f5f7]">
              <p className="text-[10px] font-bold uppercase text-[#86868b]">
                Most Active Day
              </p>
              <p className="text-xs font-bold text-[#1d1d1f]">
                {mostActiveDay.date} ({mostActiveDay.total} actions)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Streak Milestones Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] shrink-0">
          Streak Milestones:
        </span>
        {STREAK_MILESTONES.map((m) => {
          const achieved = longestStreak >= m || currentStreak >= m
          return (
            <span
              key={m}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                achieved
                  ? "bg-[#0066cc]/10 border-[#0066cc]/30 text-[#0066cc]"
                  : "bg-[#f5f5f7] border-transparent text-[#86868b]"
              }`}
            >
              {achieved ? "✓ " : ""}
              {m} Days
            </span>
          )
        })}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          {/* Month Labels */}
          <div className="flex text-[10px] font-semibold text-[#86868b] mb-1.5 pl-7 relative h-4">
            {monthLabels.map((m, idx) => (
              <span
                key={`${m.label}-${idx}`}
                style={{ left: `${28 + m.weekIndex * 13}px` }}
                className="absolute"
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-1.5">
            {/* Day-of-Week Labels */}
            <div className="flex flex-col justify-between h-[88px] text-[9px] font-semibold text-[#86868b] pr-1 py-1">
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
                      className={`w-[10px] h-[10px] rounded-[2px] border transition-transform hover:scale-125 cursor-pointer ${getCellClass(
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-black/5 text-xs">
        <div className="text-[#86868b] font-medium">
          {selectedDay ? (
            <span>
              <strong className="text-[#1d1d1f]">{selectedDay.date}</strong>:{" "}
              {selectedDay.total === 0
                ? "No recorded activity"
                : `${selectedDay.total} contribution${
                    selectedDay.total === 1 ? "" : "s"
                  } (${selectedDay.items.slice(0, 3).join(" · ")})`}
            </span>
          ) : (
            <span>Hover or click any square to inspect daily breakdown.</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#86868b] shrink-0">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#f5f5f7] border border-black/10" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0066cc]/30" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0066cc]/55" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0066cc]/80" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0066cc]" />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
