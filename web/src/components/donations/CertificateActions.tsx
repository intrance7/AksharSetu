"use client"

import { Printer, Share2, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function CertificateActions() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success("Public verification URL copied!")
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Could not copy URL")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
      >
        <Printer className="w-4 h-4" /> Print / Save PDF Certificate
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-black/5 text-[#1D1D1F] border border-black/10 text-xs font-bold transition-colors cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" /> Link Copied
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" /> Copy Verification Link
          </>
        )}
      </button>
    </div>
  )
}

