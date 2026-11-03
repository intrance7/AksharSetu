"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { SlidersHorizontal, Map as MapIcon, LayoutGrid, Package } from "lucide-react"

interface CatalogTopBarProps {
  showFilters: boolean
  onToggleFilters: () => void
  resultCount: number
  viewMode: "grid" | "map"
  onToggleViewMode: () => void
}

export function CatalogTopBar({
  showFilters,
  onToggleFilters,
  resultCount,
  viewMode,
  onToggleViewMode,
}: CatalogTopBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentSort = searchParams.get("sort") || "new"
  const bundlesOnly = searchParams.get("bundles") === "true"

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", e.target.value)
    params.delete("page")
    startTransition(() => router.push(`/catalog?${params.toString()}`))
  }

  const toggleBundles = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (bundlesOnly) {
      params.delete("bundles")
    } else {
      params.set("bundles", "true")
    }
    params.delete("page")
    startTransition(() => router.push(`/catalog?${params.toString()}`))
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mb-4 border-b border-[#1D1D1F]/10 sticky top-[68px] bg-[#F2EBE1]/95 backdrop-blur-md z-30">
      {/* Title / Stats */}
      <div className="flex items-center flex-wrap gap-3">
        <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight flex items-center gap-2">
          Books{" "}
          <span className="text-[#1D1D1F]/40 text-lg font-bold">
            ({resultCount})
          </span>
        </h2>

        {/* Map / List Toggle */}
        <div className="hidden sm:flex bg-[#1D1D1F]/5 rounded-full p-1 border border-black/5 ml-2">
          <button
            onClick={() => viewMode !== "grid" && onToggleViewMode()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 ${
              viewMode === "grid"
                ? "bg-white text-[#1D1D1F] shadow-sm"
                : "text-[#1D1D1F]/50 hover:text-[#1D1D1F]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => viewMode !== "map" && onToggleViewMode()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 ${
              viewMode === "map"
                ? "bg-[#C84200] text-white shadow-sm"
                : "text-[#1D1D1F]/50 hover:text-[#1D1D1F]"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Map
          </button>
        </div>

        {/* Bundles Quick Filter */}
        <button
          type="button"
          onClick={toggleBundles}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
            bundlesOnly
              ? "bg-[#C84200] text-white border-[#C84200] shadow-sm"
              : "bg-white/70 text-[#1D1D1F]/80 border-black/10 hover:bg-white"
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Semester Bundles
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
        {/* Mobile View Toggle */}
        <button
          onClick={onToggleViewMode}
          className="sm:hidden flex items-center justify-center p-2 rounded-full bg-[#1D1D1F]/5 text-[#1D1D1F]"
          title="Toggle View"
        >
          {viewMode === "grid" ? (
            <MapIcon className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </button>

        {/* Toggle Filters Button */}
        <button
          onClick={onToggleFilters}
          className="flex items-center gap-2 text-[14.5px] font-bold text-[#1D1D1F] hover:text-[#C84200] transition-colors"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[14.5px] font-bold text-[#1D1D1F]/60">
            Sort By
          </span>
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="bg-transparent text-[14.5px] font-bold text-[#1D1D1F] outline-none cursor-pointer hover:text-[#C84200] transition-colors appearance-none pr-4"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%231D1D1F' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right center",
            }}
          >
            <option value="new">Newest Arrivals</option>
            <option value="popular">Most Popular</option>
            <option value="low">Price: Low to High</option>
            <option value="az">Title: A to Z</option>
            <option value="distance">Nearest to me</option>
          </select>
        </div>
      </div>
    </div>
  )
}
