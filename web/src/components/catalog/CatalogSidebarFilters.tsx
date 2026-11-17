"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { RotateCcw } from "lucide-react"

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "engineering", label: "Engineering" },
  { id: "medical", label: "Medical" },
  { id: "fiction", label: "Fiction" },
  { id: "non-fiction", label: "Non-Fiction" },
]

const CONDITIONS = [
  { id: "", label: "Any Condition" },
  { id: "LIKE_NEW", label: "Like New" },
  { id: "GOOD", label: "Good" },
  { id: "FAIR", label: "Fair" },
  { id: "POOR", label: "Readable" },
]

const PRICES = [
  { id: "all", label: "Any Price" },
  { id: "free", label: "Free (Donations)" },
  { id: "exchange", label: "1-for-1 Swap" },
  { id: "under250", label: "Under ₹250" },
  { id: "under500", label: "Under ₹500" },
  { id: "paid", label: "Paid Only" },
]

const DELIVERY_MODES = [
  { id: "", label: "All Handoff Modes" },
  { id: "MEETUP", label: "Campus / City Meetup" },
  { id: "SHIPPING", label: "Doorstep Courier" },
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
    <div className="w-full md:w-[270px] pb-10 flex flex-col gap-4 text-[#1D1D1F]">
      {/* Category Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#1D1D1F]/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-xs tracking-wider uppercase text-[#1D1D1F]/70">
            Subject Category
          </h3>
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C84200] hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilters("category", cat.id)}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#1D1D1F] text-white"
                    : "text-[#1D1D1F]/75 hover:bg-[#FAF6F0] hover:text-[#1D1D1F]"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price & Exchange Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#1D1D1F]/10">
        <h3 className="font-black text-xs mb-3 tracking-wider uppercase text-[#1D1D1F]/70">
          Price & Exchange
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {PRICES.map((price) => {
            const isActive = currentPrice === price.id
            return (
              <button
                key={price.id}
                type="button"
                onClick={() => updateFilters("price", price.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#C84200] text-white"
                    : "bg-[#FAF6F0] text-[#1D1D1F]/80 hover:bg-[#E8E2D7]"
                }`}
              >
                {price.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Condition Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#1D1D1F]/10">
        <h3 className="font-black text-xs mb-3 tracking-wider uppercase text-[#1D1D1F]/70">
          Book Condition
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((cond) => {
            const isActive = currentCondition === cond.id
            return (
              <button
                key={cond.id || "any"}
                type="button"
                onClick={() => updateFilters("condition", cond.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-[#FAF6F0] text-[#1D1D1F]/80 hover:bg-[#E8E2D7]"
                }`}
              >
                {cond.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Handoff / Delivery Mode Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#1D1D1F]/10">
        <h3 className="font-black text-xs mb-3 tracking-wider uppercase text-[#1D1D1F]/70">
          Handoff Method
        </h3>
        <div className="flex flex-col gap-1.5">
          {DELIVERY_MODES.map((mode) => {
            const isActive = currentDelivery === mode.id
            return (
              <button
                key={mode.id || "all"}
                type="button"
                onClick={() => updateFilters("delivery", mode.id)}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#C84200] text-white"
                    : "bg-[#FAF6F0] text-[#1D1D1F]/80 hover:bg-[#E8E2D7]"
                }`}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Academic, Author & Semester Filters Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#1D1D1F]/10 space-y-3">
        <h3 className="font-black text-xs tracking-wider uppercase text-[#1D1D1F]/70">
          Campus, Semester & Author
        </h3>

        <input
          type="text"
          placeholder="University (e.g. IIT, DU, VTU)"
          defaultValue={searchParams.get("university") || ""}
          onBlur={(e) => updateFilters("university", e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters("university", e.currentTarget.value.trim())
            }
          }}
          className="w-full bg-[#FAF6F0] border border-black/5 focus:border-[#C84200] focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
        />

        <input
          type="text"
          placeholder="Course / Branch (e.g. B.Tech, MBBS)"
          defaultValue={searchParams.get("course") || ""}
          onBlur={(e) => updateFilters("course", e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters("course", e.currentTarget.value.trim())
            }
          }}
          className="w-full bg-[#FAF6F0] border border-black/5 focus:border-[#C84200] focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
        />

        <input
          type="text"
          placeholder="Author name..."
          defaultValue={searchParams.get("author") || ""}
          onBlur={(e) => updateFilters("author", e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters("author", e.currentTarget.value.trim())
            }
          }}
          className="w-full bg-[#FAF6F0] border border-black/5 focus:border-[#C84200] focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
        />

        <div>
          <label className="block text-[11px] font-bold text-[#86868b] mb-1.5">
            Semester
          </label>
          <select
            value={currentSemester}
            onChange={(e) => updateFilters("semester", e.target.value)}
            aria-label="Filter by semester"
            className="w-full bg-[#FAF6F0] border border-black/5 rounded-xl px-3 py-2 text-xs font-bold text-[#1D1D1F] outline-none cursor-pointer"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={String(s)}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
