"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
import { coverUrl } from "@/lib/gutenberg"

export function StartShantiButton({ gutenbergId, title, author }: { gutenbergId: number; title: string; author: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, gutenbergId, coverImage: coverUrl(gutenbergId) }),
    })
    if (res.status === 401) return router.push("/login")
    if (!res.ok) return setLoading(false)
    const libraryBook = await res.json()
    router.push(`/library/shanti/${libraryBook.id}?mode=read`)
  }

  return (
    <button
      id="start-shanti-reading"
      onClick={start}
      disabled={loading}
      className="h-8 rounded-full px-4 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">Read in Shanti Mode</span>
      <span className="sm:hidden">Shanti</span>
    </button>
  )
}
