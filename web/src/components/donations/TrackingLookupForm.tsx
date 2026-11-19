"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ShieldCheck } from "lucide-react"

export function TrackingLookupForm() {
  const router = useRouter()
  const [trackingId, setTrackingId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = trackingId.trim()
    if (!clean) return
    router.push(`/donations/track/${encodeURIComponent(clean)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#1D1D1F]">
            Verify a Vidya Daan Tracking ID
          </h2>
          <p className="text-xs font-medium text-[#86868b]">
            Enter any public donation tracking code to inspect its 6-stage chain
            of custody and official certificate.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:min-w-[340px]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Paste Tracking ID..."
            className="w-full h-11 rounded-full bg-[#FAF6F0] pl-10 pr-4 text-xs sm:text-sm font-mono font-semibold text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/25"
          />
        </div>
        <button
          type="submit"
          disabled={!trackingId.trim()}
          className="px-5 h-11 rounded-full bg-[#1D1D1F] hover:bg-[#C84200] text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
        >
          Verify Certificate
        </button>
      </div>
    </form>
  )
}
