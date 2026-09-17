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
    <div className="flex flex-col gap-8 mb-12">
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#86868b]" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full bg-white border-2 border-transparent focus:border-[#0066cc] rounded-full py-4 pl-12 pr-6 shadow-sm text-[#1D1D1F] font-semibold text-lg transition-all outline-none"
          placeholder="Search for books by title, author, or ISBN..."
        />
        <button 
          type="submit" 
          className="absolute right-2 top-2 bottom-2 bg-[#0066cc] hover:bg-[#0055b3] text-white px-6 rounded-full font-bold tracking-wider uppercase text-sm transition-colors"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
              currentCategory === cat.id
                ? "bg-[#1D1D1F] text-white shadow-md"
                : "bg-white text-[#86868b] hover:bg-[#E8E8ED] hover:text-[#1D1D1F]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
