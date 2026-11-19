"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import {
  RotateCcw,
  ChevronDown,
  Handshake,
  Truck,
  GraduationCap,
} from "lucide-react"

const CATEGORIES = [
  { id: "all", label: "All Subjects" },
  { id: "engineering", label: "Engineering" },
  { id: "medical", label: "Medical" },
  { id: "fiction", label: "Fiction" },
  { id: "non-fiction", label: "Non-Fiction" },
  { id: "school", label: "School & Boards" },
]

const CONDITIONS = [
  { id: "", label: "Any", dot: null },
  { id: "LIKE_NEW", label: "Like New", dot: "#0A7D4F" },
  { id: "GOOD", label: "Good", dot: "#0066cc" },
  { id: "FAIR", label: "Fair", dot: "#B45309" },
  { id: "POOR", label: "Readable", dot: "#C84200" },
]

const LISTING_TYPES = [
  { id: "all", label: "Any Listing", tone: "dark" as const },
  { id: "free", label: "Free Vidya Daan", tone: "emerald" as const },
  { id: "exchange", label: "1-for-1 Swap", tone: "cobalt" as const },
  { id: "under250", label: "Under ₹250", tone: "orange" as const },
  { id: "under500", label: "Under ₹500", tone: "orange" as const },
  { id: "paid", label: "Paid Resale", tone: "dark" as const },
]

const DELIVERY_MODES = [
  { id: "", label: "All Handoff Modes", icon: null },
  { id: "MEETUP", label: "Campus / City Meetup", icon: Handshake },
  { id: "SHIPPING", label: "Doorstep Courier", icon: Truck },
]

export function CatalogSidebarFilters({
  onAfterChange,
}: {
  onAfterChange?: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentCategory = (searchParams.get("category") || "all").toLowerCase()
  const currentCondition = searchParams.get("condition") || ""
  const currentPrice = searchParams.get("price") || "all"
  const currentDelivery = searchParams.get("delivery") || ""
  const currentSemester = searchParams.get("semester") || ""
  const hasAcademicFilters = Boolean(
    searchParams.get("university") ||
      searchParams.get("course") ||
      searchParams.get("author") ||
      currentSemester
  )

  const [academicOpen, setAcademicOpen] = useState(true)

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === "all" || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete("page")

    startTransition(() => {
      router.push(`/catalog?${params.toString()}`)
      onAfterChange?.()
    })
  }

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/catalog")
      onAfterChange?.()
    })
  }

  return (
    <aside
      aria-label="Catalog filters"
      className="w-full md:w-[276px] pb-10 text-[#1D1D1F]"
    >
      <div className="bg-white rounded-3xl border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)] overflow-hidden divide-y divide-[#1D1D1F]/[0.07]">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between bg-[#FAF6F0]/60">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#1D1D1F]/70">
            Refine Shelves
          </span>
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C84200] hover:text-[#A33500] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
        </div>

        {/* Category Section */}
        <div className="p-5">
          <h3 className="text-xs font-black tracking-[0.12em] uppercase text-[#86868b] mb-3">
            Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = currentCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateFilters("category", cat.id)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs"
                      : "bg-[#FAF6F0] text-[#1D1D1F]/80 border-transparent hover:border-[#1D1D1F]/15 hover:bg-white"
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Listing Type & Price Section */}
        <div className="p-5">
          <h3 className="text-xs font-black tracking-[0.12em] uppercase text-[#86868b] mb-3">
            Listing Type &amp; Price
          </h3>
          <div className="flex flex-wrap gap-2">
            {LISTING_TYPES.map((price) => {
              const isActive = currentPrice === price.id
              const activeClass =
                price.tone === "emerald"
                  ? "bg-[#0A7D4F] text-white border-[#0A7D4F]"
                  : price.tone === "cobalt"
                  ? "bg-[#0066cc] text-white border-[#0066cc]"
                  : price.tone === "orange"
                  ? "bg-[#C84200] text-white border-[#C84200]"
                  : "bg-[#1D1D1F] text-white border-[#1D1D1F]"

              return (
                <button
                  key={price.id}
                  type="button"
                  onClick={() => updateFilters("price", price.id)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? `${activeClass} shadow-xs`
                      : "bg-[#FAF6F0] text-[#1D1D1F]/80 border-transparent hover:border-[#1D1D1F]/15 hover:bg-white"
                  }`}
                >
                  {price.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Condition Section */}
        <div className="p-5">
          <h3 className="text-xs font-black tracking-[0.12em] uppercase text-[#86868b] mb-3">
            Book Condition
          </h3>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((cond) => {
              const isActive = currentCondition === cond.id
              return (
                <button
                  key={cond.id || "any"}
                  type="button"
                  onClick={() => updateFilters("condition", cond.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs"
                      : "bg-[#FAF6F0] text-[#1D1D1F]/80 border-transparent hover:border-[#1D1D1F]/15 hover:bg-white"
                  }`}
                >
                  {cond.dot && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: isActive ? "#FFFFFF" : cond.dot,
                      }}
                    />
                  )}
                  {cond.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Delivery Mode Section */}
        <div className="p-5">
          <h3 className="text-xs font-black tracking-[0.12em] uppercase text-[#86868b] mb-3">
            Delivery Mode
          </h3>
          <div className="flex flex-col gap-2">
            {DELIVERY_MODES.map((mode) => {
              const isActive = currentDelivery === mode.id
              const Icon = mode.icon
              return (
                <button
                  key={mode.id || "all"}
                  type="button"
                  onClick={() => updateFilters("delivery", mode.id)}
                  className={`flex items-center gap-2.5 text-left px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#C84200] text-white border-[#C84200] shadow-xs"
                      : "bg-[#FAF6F0] text-[#1D1D1F]/85 border-transparent hover:border-[#1D1D1F]/15 hover:bg-white"
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-white" : "text-[#C84200]"
                      }`}
                    />
                  )}
                  <span>{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Collapsible Academic & Author Filters */}
        <div className="p-5">
          <button
            type="button"
            onClick={() => setAcademicOpen((prev) => !prev)}
            aria-expanded={academicOpen || hasAcademicFilters}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
          >
            <span className="inline-flex items-center gap-2 text-xs font-black tracking-[0.12em] uppercase text-[#86868b] group-hover:text-[#1D1D1F] transition-colors">
              <GraduationCap className="w-4 h-4 text-[#C84200]" />
              Academic &amp; Author
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#86868b] transition-transform duration-200 ${
                academicOpen || hasAcademicFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {(academicOpen || hasAcademicFilters) && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5">
                  University / College
                </label>
                <input
                  key={`uni-${searchParams.get("university") || ""}`}
                  type="text"
                  placeholder="e.g. IIT, DU, VTU"
                  defaultValue={searchParams.get("university") || ""}
                  onBlur={(e) =>
                    updateFilters("university", e.target.value.trim())
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateFilters("university", e.currentTarget.value.trim())
                    }
                  }}
                  className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5">
                  Course / Branch
                </label>
                <input
                  key={`course-${searchParams.get("course") || ""}`}
                  type="text"
                  placeholder="e.g. B.Tech, MBBS"
                  defaultValue={searchParams.get("course") || ""}
                  onBlur={(e) => updateFilters("course", e.target.value.trim())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateFilters("course", e.currentTarget.value.trim())
                    }
                  }}
                  className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5">
                  Semester
                </label>
                <select
                  value={currentSemester}
                  onChange={(e) => updateFilters("semester", e.target.value)}
                  aria-label="Filter by semester"
                  className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#1D1D1F] outline-none cursor-pointer transition-all"
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={String(s)}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5">
                  Author
                </label>
                <input
                  key={`author-${searchParams.get("author") || ""}`}
                  type="text"
                  placeholder="Search by author..."
                  defaultValue={searchParams.get("author") || ""}
                  onBlur={(e) => updateFilters("author", e.target.value.trim())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateFilters("author", e.currentTarget.value.trim())
                    }
                  }}
                  className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
