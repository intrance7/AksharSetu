"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useTransition, useState } from "react"

const CATEGORIES = [
  { id: "all", label: "All Books" },
  { id: "engineering", label: "Engineering" },
  { id: "medical", label: "Medical" },
  { id: "fiction", label: "Fiction" },
  { id: "non-fiction", label: "Non-Fiction" },
]

export function CatalogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentCategory = searchParams.get("category") || "all"
  const currentQuery = searchParams.get("q") || ""

  const [searchValue, setSearchValue] = useState(currentQuery)

  const updateFilters = (category: string, query: string) => {
    const params = new URLSearchParams()
    if (category && category !== "all") params.set("category", category)
    if (query) params.set("q", query)
    
    startTransition(() => {
      router.push(`/catalog?${params.toString()}`)
    })
  }

  const handleCategoryClick = (categoryId: string) => {
    updateFilters(categoryId, searchValue)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters(currentCategory, searchValue)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar — elevated card that overlaps the hero */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-[#1D1D1F]/5 flex items-center p-2">
          <div className="pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#1D1D1F]/30" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1 bg-transparent py-4 px-4 text-[#1D1D1F] font-medium text-base outline-none placeholder:text-[#1D1D1F]/30"
            placeholder="Search by title, author, or ISBN..."
          />
          <button 
            type="submit" 
            className="bg-[#C84200] hover:bg-[#A13500] text-white px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
        </div>
      </form>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-all cursor-pointer ${
              currentCategory === cat.id
                ? "bg-[#1D1D1F] text-white shadow-sm"
                : "bg-white text-[#1D1D1F]/60 hover:text-[#1D1D1F] hover:bg-white/80 border border-[#1D1D1F]/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
