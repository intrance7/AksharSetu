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
      className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0A7D4F]/10 text-[#0A7D4F] flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#1D1D1F] tracking-tight">
            Verify a Vidya Daan Tracking ID
          </h2>
          <p className="text-sm font-medium text-[#6e6e73] mt-0.5 leading-relaxed">
            Enter any public donation tracking code to inspect its 6-stage chain
            of custody and official certificate.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto md:min-w-[360px]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Paste Tracking ID..."
            className="w-full h-12 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] pl-11 pr-4 text-sm font-mono font-semibold text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]/50 focus:ring-4 focus:ring-[#C84200]/10 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!trackingId.trim()}
          className="px-6 h-12 rounded-full bg-[#1D1D1F] hover:bg-[#C84200] text-white text-sm font-bold transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
        >
          Verify Certificate
        </button>
      </div>
    </form>
  )
}
