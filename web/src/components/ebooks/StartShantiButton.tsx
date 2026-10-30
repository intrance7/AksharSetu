"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, Check, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { coverUrl } from "@/lib/gutenberg"

export function StartShantiButton({
  gutenbergId,
  title,
  author,
}: {
  gutenbergId: number
  title: string
  author: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveToLibrary = async () => {
    if (saved || saving) return
    setSaving(true)
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, gutenbergId, coverImage: coverUrl(gutenbergId) }),
      })
      if (res.status === 401) return router.push(`/login?callbackUrl=/ebooks/${gutenbergId}`)
      if (res.ok) {
        setSaved(true)
        toast.success("Saved to My Library")
      }
    } finally {
      setSaving(false)
    }
  }

  const start = async () => {
    setLoading(true)
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, gutenbergId, coverImage: coverUrl(gutenbergId) }),
    })
    if (res.status === 401) return router.push(`/login?callbackUrl=/ebooks/${gutenbergId}`)
    if (!res.ok) return setLoading(false)
    const libraryBook = await res.json()
    router.push(`/library/shanti/${libraryBook.id}?mode=read`)
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={saveToLibrary}
        disabled={saving}
        title={saved ? "Saved in My Library" : "Save to My Library"}
        className={`h-8 rounded-full px-3 text-xs font-bold flex items-center gap-1.5 transition-colors ${
          saved
            ? "bg-[#287F56] text-white"
            : "bg-[#1D1D1F]/10 hover:bg-[#1D1D1F]/20 text-current"
        }`}
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : saved ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Bookmark className="w-3.5 h-3.5" />
        )}
        <span className="hidden lg:inline">{saved ? "Saved" : "Save"}</span>
      </button>

      <button
        id="start-shanti-reading"
        onClick={start}
        disabled={loading}
        className="h-8 rounded-full px-4 bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-sm"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#F4B22B]" />}
        <span className="hidden sm:inline">Read in Shanti Mode</span>
        <span className="sm:hidden">Shanti</span>
      </button>
    </div>
  )
}
