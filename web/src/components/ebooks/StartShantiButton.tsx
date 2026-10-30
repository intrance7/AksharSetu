"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"

export default function StartShantiButton({
  gutenbergId,
  title,
  author,
  coverImage,
  totalPages,
  compact = false,
}: {
  gutenbergId: string | number
  title: string
  author: string
  coverImage: string
  totalPages?: number
  compact?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const isNum = /^\d+$/.test(String(gutenbergId))
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          coverImage,
          gutenbergId: isNum ? Number(gutenbergId) : null,
          platformBookId: isNum ? null : String(gutenbergId),
          totalPages: totalPages || 250,
          status: "READING",
        }),
      })

      if (res.status === 401) {
        router.push(`/login?callbackUrl=/ebooks/${gutenbergId}`)
        return
      }

      if (!res.ok) {
        setLoading(false)
        return
      }

      const libraryBook = await res.json()
      router.push(`/library/shanti/${libraryBook.id}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={loading}
      className={
        compact
          ? "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#0066cc] text-white hover:bg-[#0071e3] transition disabled:opacity-60"
          : "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0066cc] text-white hover:bg-[#0071e3] shadow-sm transition disabled:opacity-60"
      }
      title="Save to My Library and enter Shanti Focus Mode"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {compact ? "Shanti" : "Start Shanti Session"}
    </button>
  )
}
