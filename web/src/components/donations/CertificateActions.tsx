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
    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#FF7F45] hover:text-[#0B0B0D] text-white text-[13px] font-bold shadow-sm transition-colors cursor-pointer"
      >
        <Printer className="w-4 h-4" /> Print / Save PDF
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[13px] font-bold transition-colors cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" /> Link Copied
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" /> Copy Link
          </>
        )}
      </button>
    </div>
  )
}
