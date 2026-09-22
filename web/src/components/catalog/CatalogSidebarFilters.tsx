"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Check } from "lucide-react"

const CATEGORIES = [
  { id: "all", label: "All books" },
  { id: "engineering", label: "Engineering" },
  { id: "medical", label: "Medical" },
  { id: "fiction", label: "Fiction" },
  { id: "non-fiction", label: "Non-Fiction" },
]

const CONDITIONS = [
  { id: "LIKE_NEW", label: "Like new" },
  { id: "GOOD", label: "Good" },
  { id: "FAIR", label: "Fair" },
  { id: "POOR", label: "Poor" },
]

const PRICES = [
  { id: "all", label: "Any Price" },
  { id: "free", label: "Free (Donations)" },
  { id: "paid", label: "Paid" },
]

export function CatalogSidebarFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentCategory = searchParams.get("category") || "all"
  const currentCondition = searchParams.get("condition") || ""
  const currentPrice = searchParams.get("price") || "all"

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === "all" || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    startTransition(() => {
      router.push(`/catalog?${params.toString()}`)
    })
  }

  return (
    // Fixed inner width prevents squishing during parent width animation
    <div className="w-[260px] pb-12 flex flex-col gap-5 text-[#1D1D1F]">
      
      {/* Category Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1D1D1F]/5">
        <h3 className="font-black text-[15px] mb-3 tracking-wide uppercase text-[#1D1D1F]/80">Categories</h3>
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilters("category", cat.id)}
                className={`text-left px-3 py-2 rounded-xl text-[14.5px] font-bold transition-all hover:-translate-y-[1px] ${
                  isActive 
                    ? "bg-[#C84200] text-white shadow-sm" 
                    : "text-[#1D1D1F]/70 hover:bg-[#F2EBE1] hover:text-[#1D1D1F]"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1D1D1F]/5">
        <h3 className="font-black text-[15px] mb-3 tracking-wide uppercase text-[#1D1D1F]/80">Price</h3>
        <div className="flex flex-wrap gap-2">
          {PRICES.map((price) => {
            const isActive = currentPrice === price.id
            return (
              <button
                key={price.id}
                type="button"
                onClick={() => updateFilters("price", price.id)}
                className={`px-4 py-2 rounded-full text-[13.5px] font-bold transition-all hover:-translate-y-[1px] ${
                  isActive 
                    ? "bg-[#C84200] text-white shadow-sm" 
                    : "bg-[#F2EBE1] text-[#1D1D1F]/80 hover:bg-[#e8e8ed]"
                }`}
              >
                {price.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Condition Bento */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1D1D1F]/5">
        <h3 className="font-black text-[15px] mb-3 tracking-wide uppercase text-[#1D1D1F]/80">Condition</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilters("condition", "")}
            className={`px-4 py-2 rounded-full text-[13.5px] font-bold transition-all hover:-translate-y-[1px] ${
              currentCondition === "" 
                ? "bg-[#C84200] text-white shadow-sm" 
                : "bg-[#F2EBE1] text-[#1D1D1F]/80 hover:bg-[#e8e8ed]"
            }`}
          >
            Any
          </button>
          {CONDITIONS.map((cond) => {
            const isActive = currentCondition === cond.id
            return (
              <button
                key={cond.id}
                type="button"
                onClick={() => updateFilters("condition", cond.id)}
                className={`px-4 py-2 rounded-full text-[13.5px] font-bold transition-all hover:-translate-y-[1px] ${
                  isActive 
                    ? "bg-[#C84200] text-white shadow-sm" 
                    : "bg-[#F2EBE1] text-[#1D1D1F]/80 hover:bg-[#e8e8ed]"
                }`}
              >
                {cond.label}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
