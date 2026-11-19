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
  ArrowLeftRight,
  Layers,
  ChevronDown,
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

  const isAllQuickActive =
    !bundlesOnly &&
    (!currentPrice || currentPrice === "all")

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

  const resetQuickRibbon = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("price")
    params.delete("bundles")
    params.delete("maxPrice")
    params.delete("page")
    const qs = params.toString()
    startTransition(() => router.push(qs ? `/catalog?${qs}` : "/catalog"))
  }

  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 md:-mx-8 md:px-8 pt-6 pb-4 mb-6 bg-[#F2EBE1]/92 backdrop-blur-md border-b border-[#1D1D1F]/[0.08]">
      <div className="space-y-4">
        {/* Top Editorial Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight leading-none">
                Curated{" "}
                <span className="font-serif italic font-normal text-[#C84200]">
                  Campus
                </span>{" "}
                Shelves
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] font-mono text-xs font-bold text-[#1D1D1F]/75">
                {resultCount} {resultCount === 1 ? "title" : "titles"}
              </span>
            </div>
          </div>

          {/* Right Controls: Segmented View Switcher, Filters Toggle, Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Sleek 3-Way Segmented Switcher */}
            <div
              role="group"
              aria-label="Catalog view mode"
              className="inline-flex bg-white rounded-full p-1 border border-[#1D1D1F]/[0.08] shadow-[0_2px_10px_rgba(29,29,31,0.04)]"
            >
              <button
                type="button"
                onClick={() => onChangeViewMode("grid")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                  viewMode === "map"
                    ? "bg-[#C84200] text-white shadow-xs"
                    : "text-[#1D1D1F]/65 hover:text-[#1D1D1F]"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>

            {/* Desktop Sidebar Toggle */}
            <button
              type="button"
              onClick={onToggleFilters}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#1D1D1F]/[0.08] shadow-[0_2px_10px_rgba(29,29,31,0.04)] text-[13px] font-bold text-[#1D1D1F] hover:border-[#C84200]/50 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C84200]" />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#C84200] text-white font-mono text-xs font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Mobile Filter Drawer Button */}
            <button
              type="button"
              onClick={onOpenMobileFilters}
              className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#1D1D1F]/[0.08] shadow-[0_2px_10px_rgba(29,29,31,0.04)] text-[13px] font-bold text-[#1D1D1F] cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C84200]" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#C84200] text-white font-mono text-xs font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Refined Sort Dropdown */}
            <div className="relative inline-flex items-center gap-1.5 bg-white border border-[#1D1D1F]/[0.08] shadow-[0_2px_10px_rgba(29,29,31,0.04)] rounded-full pl-4 pr-3 py-2 min-w-0">
              <span className="text-xs font-bold text-[#86868b] shrink-0">
                Sort
              </span>
              <select
                value={currentSort}
                onChange={handleSortChange}
                aria-label="Sort books"
                className="appearance-none bg-transparent text-[13px] font-bold text-[#1D1D1F] outline-none cursor-pointer pr-5 min-w-0 max-w-[148px] sm:max-w-none truncate"
              >
                <option value="new">Newest Arrivals</option>
                <option value="popular">Most Popular</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="az">Title: A to Z</option>
                <option value="distance">Nearest to Me</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#86868b] pointer-events-none absolute right-3.5" />
            </div>
          </div>
        </div>

        {/* Quick-Category & Shelf Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            type="button"
            onClick={resetQuickRibbon}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
              isAllQuickActive
                ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs"
                : "bg-white/90 text-[#1D1D1F]/80 border-[#1D1D1F]/[0.08] hover:bg-white hover:border-[#1D1D1F]/25"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Books
          </button>

          <button
            type="button"
            onClick={() => toggleParam("price", "free")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
              currentPrice === "free"
                ? "bg-[#0A7D4F] text-white border-[#0A7D4F] shadow-xs"
                : "bg-white/90 text-[#1D1D1F]/80 border-[#1D1D1F]/[0.08] hover:bg-white hover:border-[#0A7D4F]/40 hover:text-[#0A7D4F]"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            Free Vidya Daan
          </button>

          <button
            type="button"
            onClick={() => toggleParam("price", "exchange")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
              currentPrice === "exchange"
                ? "bg-[#0066cc] text-white border-[#0066cc] shadow-xs"
                : "bg-white/90 text-[#1D1D1F]/80 border-[#1D1D1F]/[0.08] hover:bg-white hover:border-[#0066cc]/40 hover:text-[#0066cc]"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            1-for-1 Swap
          </button>

          <button
            type="button"
            onClick={() => toggleParam("price", "under250")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
              currentPrice === "under250"
                ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs"
                : "bg-white/90 text-[#1D1D1F]/80 border-[#1D1D1F]/[0.08] hover:bg-white hover:border-[#1D1D1F]/30"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Under ₹250
          </button>

          <button
            type="button"
            onClick={() => toggleParam("bundles", "true")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
              bundlesOnly
                ? "bg-[#C84200] text-white border-[#C84200] shadow-xs"
                : "bg-white/90 text-[#1D1D1F]/80 border-[#1D1D1F]/[0.08] hover:bg-white hover:border-[#C84200]/40 hover:text-[#C84200]"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Semester Packs
          </button>
        </div>
      </div>
    </div>
  )
}
