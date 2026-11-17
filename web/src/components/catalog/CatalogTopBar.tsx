"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import {
  SlidersHorizontal,
  Map as MapIcon,
  LayoutGrid,
  List as ListIcon,
  Package,
  Gift,
  Tag,
} from "lucide-react"

interface CatalogTopBarProps {
  showFilters: boolean
  onToggleFilters: () => void
  onOpenMobileFilters: () => void
  resultCount: number
  viewMode: "grid" | "list" | "map"
  onChangeViewMode: (mode: "grid" | "list" | "map") => void
  activeFilterCount: number
}

export function CatalogTopBar({
  showFilters,
  onToggleFilters,
  onOpenMobileFilters,
  resultCount,
  viewMode,
  onChangeViewMode,
  activeFilterCount,
}: CatalogTopBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentSort = searchParams.get("sort") || "new"
  const bundlesOnly = searchParams.get("bundles") === "true"
  const currentPrice = searchParams.get("price") || "all"

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", e.target.value)
    params.delete("page")
    startTransition(() => router.push(`/catalog?${params.toString()}`))
  }

  const toggleParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get(key) === val) {
      params.delete(key)
    } else {
      params.set(key, val)
    }
    params.delete("page")
    startTransition(() => router.push(`/catalog?${params.toString()}`))
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-4 mb-5 border-b border-[#1D1D1F]/10 sticky top-16 bg-[#F2EBE1]/95 backdrop-blur-md z-30">
      {/* Left: Section Heading, Live Count & Quick Shelf Pills */}
      <div className="flex items-center flex-wrap gap-2.5">
        <div className="mr-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight flex items-baseline gap-2">
            <span>Catalog</span>
            <span className="text-sm font-bold text-[#1D1D1F]/50">
              {resultCount} {resultCount === 1 ? "book" : "books"}
            </span>
          </h2>
        </div>

        {/* 3-Way View Mode Toggle (Grid / List / Map) */}
        <div className="inline-flex bg-white/80 rounded-full p-1 border border-[#1D1D1F]/10 shadow-xs">
          <button
            type="button"
            onClick={() => onChangeViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-[#1D1D1F] text-white shadow-xs"
                : "text-[#1D1D1F]/65 hover:text-[#1D1D1F]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-[#1D1D1F] text-white shadow-xs"
                : "text-[#1D1D1F]/65 hover:text-[#1D1D1F]"
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              viewMode === "map"
                ? "bg-[#C84200] text-white shadow-xs"
                : "text-[#1D1D1F]/65 hover:text-[#1D1D1F]"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        </div>

        {/* Quick Shelf Pills */}
        <button
          type="button"
          onClick={() => toggleParam("bundles", "true")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
            bundlesOnly
              ? "bg-[#C84200] text-white border-[#C84200] shadow-xs"
              : "bg-white/80 text-[#1D1D1F]/80 border-[#1D1D1F]/10 hover:bg-white"
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Semester Bundles
        </button>

        <button
          type="button"
          onClick={() => toggleParam("price", "free")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
            currentPrice === "free"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
              : "bg-white/80 text-[#1D1D1F]/80 border-[#1D1D1F]/10 hover:bg-white"
          }`}
        >
          <Gift className="w-3.5 h-3.5" /> Free Donations
        </button>

        <button
          type="button"
          onClick={() => toggleParam("price", "under250")}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
            currentPrice === "under250"
              ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs"
              : "bg-white/80 text-[#1D1D1F]/80 border-[#1D1D1F]/10 hover:bg-white"
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Under ₹250
        </button>
      </div>

      {/* Right: Filter Toggle & Sort Dropdown */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        {/* Desktop Filter Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleFilters}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#1D1D1F]/10 text-xs font-bold text-[#1D1D1F] hover:border-[#C84200] transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#C84200]" />
          <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#C84200] text-white text-[10px] font-black">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile Filter Drawer Button */}
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#1D1D1F]/10 text-xs font-bold text-[#1D1D1F] cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#C84200]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#C84200] text-white text-[10px] font-black">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Control */}
        <div className="inline-flex items-center gap-2 bg-white border border-[#1D1D1F]/10 rounded-full px-4 py-2">
          <span className="text-xs font-bold text-[#1D1D1F]/50">Sort:</span>
          <select
            value={currentSort}
            onChange={handleSortChange}
            aria-label="Sort books"
            className="bg-transparent text-xs font-bold text-[#1D1D1F] outline-none cursor-pointer pr-2"
          >
            <option value="new">Newest Arrivals</option>
            <option value="popular">Most Popular</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="az">Title: A to Z</option>
            <option value="distance">Nearest to Me</option>
          </select>
        </div>
      </div>
    </div>
  )
}
