"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ThumbsUp, ThumbsDown, CheckCircle2, LifeBuoy } from "lucide-react"

export function ArticleFeedbackWidget({ slug }: { slug: string }) {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null)
  const [counts, setCounts] = useState({ helpfulCount: 0, notHelpfulCount: 0 })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/help/feedback?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.helpfulCount === "number") {
          setCounts({
            helpfulCount: d.helpfulCount,
            notHelpfulCount: d.notHelpfulCount || 0,
          })
        }
      })
      .catch(() => {})
  }, [slug])

  async function handleVote(helpful: boolean) {
    if (voted || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, helpful }),
      })
      const data = await res.json()
      setVoted(helpful ? "yes" : "no")
      if (typeof data.helpfulCount === "number") {
        setCounts({
          helpfulCount: data.helpfulCount,
          notHelpfulCount: data.notHelpfulCount || 0,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-[#1d1d1f]">
          Was this guide helpful?
        </h3>
        <p className="text-xs text-[#86868b] mt-0.5">
          {counts.helpfulCount > 0
            ? `${counts.helpfulCount} reader${counts.helpfulCount === 1 ? "" : "s"} found this article helpful.`
            : "Help us improve AksharSetu documentation with a 1-click rating."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {voted ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Thank you for your feedback!
          </span>
        ) : (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleVote(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F0] hover:bg-[#0066cc] hover:text-white px-4 py-2 text-xs font-bold text-[#1d1d1f] transition-colors cursor-pointer"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Helpful ({counts.helpfulCount})
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleVote(false)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F0] hover:bg-[#e8e8ed] px-4 py-2 text-xs font-bold text-[#6e6e73] transition-colors cursor-pointer"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              Not Helpful
            </button>
          </>
        )}
        <Link
          href="/support"
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#1d1d1f] hover:border-[#0066cc] hover:text-[#0066cc] transition-colors"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          Contact Support
        </Link>
      </div>
    </div>
  )
}
