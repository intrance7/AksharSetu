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
    <div className="w-[260px] pr-8 pb-12 flex flex-col gap-8 text-[#1D1D1F]">
      
      {/* Category Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-[15px] border-b border-[#1D1D1F]/10 pb-2 mb-1">Categories</h3>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilters("category", cat.id)}
                className={`text-left text-[14.5px] font-medium transition-colors hover:text-[#1D1D1F] ${
                  isActive ? "text-[#1D1D1F] font-bold" : "text-[#1D1D1F]/60"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Price Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-[15px] border-b border-[#1D1D1F]/10 pb-2 mb-1">Shop by Price</h3>
        <div className="flex flex-col gap-3">
          {PRICES.map((price) => {
            const isActive = currentPrice === price.id
            return (
              <label key={price.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center border-[1.5px] transition-colors ${
                  isActive ? "bg-[#1D1D1F] border-[#1D1D1F] text-white" : "border-[#1D1D1F]/30 bg-transparent group-hover:border-[#1D1D1F]"
                }`}>
                  {isActive && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </div>
                <span className={`text-[14.5px] font-medium transition-colors group-hover:text-[#1D1D1F] ${
                  isActive ? "text-[#1D1D1F]" : "text-[#1D1D1F]/70"
                }`}>
                  {price.label}
                </span>
                <input
                  type="radio"
                  name="price"
                  className="hidden"
                  checked={isActive}
                  onChange={() => updateFilters("price", price.id)}
                />
              </label>
            )
          })}
        </div>
      </div>

      {/* Condition Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-[15px] border-b border-[#1D1D1F]/10 pb-2 mb-1">Condition</h3>
        <div className="flex flex-col gap-3">
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded flex items-center justify-center border-[1.5px] transition-colors ${
              currentCondition === "" ? "bg-[#1D1D1F] border-[#1D1D1F] text-white" : "border-[#1D1D1F]/30 bg-transparent group-hover:border-[#1D1D1F]"
            }`}>
              {currentCondition === "" && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            <span className={`text-[14.5px] font-medium transition-colors group-hover:text-[#1D1D1F] ${
              currentCondition === "" ? "text-[#1D1D1F]" : "text-[#1D1D1F]/70"
            }`}>
              Any Condition
            </span>
            <input
              type="radio"
              name="condition"
              className="hidden"
              checked={currentCondition === ""}
              onChange={() => updateFilters("condition", "")}
            />
          </label>

          {CONDITIONS.map((cond) => {
            const isActive = currentCondition === cond.id
            return (
              <label key={cond.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center border-[1.5px] transition-colors ${
                  isActive ? "bg-[#1D1D1F] border-[#1D1D1F] text-white" : "border-[#1D1D1F]/30 bg-transparent group-hover:border-[#1D1D1F]"
                }`}>
                  {isActive && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </div>
                <span className={`text-[14.5px] font-medium transition-colors group-hover:text-[#1D1D1F] ${
                  isActive ? "text-[#1D1D1F]" : "text-[#1D1D1F]/70"
                }`}>
                  {cond.label}
                </span>
                <input
                  type="radio"
                  name="condition"
                  className="hidden"
                  checked={isActive}
                  onChange={() => updateFilters("condition", cond.id)}
                />
              </label>
            )
          })}
        </div>
      </div>

    </div>
  )
}
