"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, ArrowLeft, Search } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("AksharSetu route error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[78vh] bg-[#F2EBE1] px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1D1D1F] text-[#F2EBE1] flex items-center justify-center mb-6 shadow-md">
        <AlertTriangle className="w-8 h-8 text-[#C84200]" />
      </div>

      <span className="text-xs font-black uppercase tracking-widest text-[#C84200] mb-2">
        Unexpected Interruption
      </span>

      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#1D1D1F] mb-3">
        Something went off the shelf.
      </h1>

      <p className="text-[#1D1D1F]/65 text-sm sm:text-base max-w-[46ch] font-medium mb-8">
        We encountered a temporary issue loading this page. Try refreshing the
        view or head back to the catalog while we keep your reading shelf safe.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full text-sm font-bold transition-colors shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#FAF6F0] text-[#1D1D1F] border border-[#1D1D1F]/15 rounded-full text-sm font-bold transition-colors"
        >
          <Search className="w-4 h-4" />
          Browse Catalog
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-3 bg-transparent hover:bg-black/5 text-[#1D1D1F]/80 rounded-full text-sm font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return Home
        </Link>
      </div>
    </div>
  )
}
