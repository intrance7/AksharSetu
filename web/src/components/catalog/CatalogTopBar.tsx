"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { SlidersHorizontal } from "lucide-react"

interface CatalogTopBarProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  resultCount: number;
}

export function CatalogTopBar({ showFilters, onToggleFilters, resultCount }: CatalogTopBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentSort = searchParams.get("sort") || "new"

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", e.target.value)
    startTransition(() => router.push(`/catalog?${params.toString()}`))
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mb-4 border-b border-[#1D1D1F]/10 sticky top-[68px] bg-[#F5F5DC] z-30">
      
      {/* Title / Stats */}
      <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight">
        Books <span className="text-[#1D1D1F]/40 text-lg font-bold ml-1">({resultCount})</span>
      </h2>

      {/* Controls */}
      <div className="flex items-center gap-6 self-end sm:self-auto">
        
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
          <span className="text-[14.5px] font-bold text-[#1D1D1F]/60">Sort By</span>
          <select 
            value={currentSort}
            onChange={handleSortChange}
            className="bg-transparent text-[14.5px] font-bold text-[#1D1D1F] outline-none cursor-pointer hover:text-[#C84200] transition-colors appearance-none pr-4"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%231D1D1F' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right center"
            }}
          >
            <option value="new">Newest Arrivals</option>
            <option value="low">Price: Low to High</option>
            <option value="az">Title: A to Z</option>
            <option value="distance">Nearest to me</option>
          </select>
        </div>

      </div>
    </div>
  )
}
