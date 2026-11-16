"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { FAQ_ITEMS, type FaqItem } from "@/lib/helpCenterData"
import {
  Search,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  BookOpen,
} from "lucide-react"

const FAQ_CATEGORIES: { id: "ALL" | FaqItem["category"]; label: string }[] = [
  { id: "ALL", label: "All Questions" },
  { id: "GENERAL", label: "General" },
  { id: "BUYING", label: "Buying" },
  { id: "SELLING", label: "Selling" },
  { id: "MESSAGING", label: "Messaging" },
  { id: "GAMIFICATION", label: "XP, Badges & Streaks" },
  { id: "PRIVACY", label: "Privacy & Safety" },
  { id: "PAYMENTS", label: "Payments & Refunds" },
]

export default function FaqPage() {
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | FaqItem["category"]
  >("ALL")
  const [openIds, setOpenIds] = useState<string[]>([
    FAQ_ITEMS[0]?.id || "faq-what-is-aksharsetu",
    FAQ_ITEMS[1]?.id || "faq-is-it-free",
  ])

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FAQ_ITEMS.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false
      }
      if (!q) return true
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    })
  }, [query, selectedCategory])

  function toggleFaq(id: string) {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-14 pb-18 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-3">
            <HelpCircle className="h-3.5 w-3.5" /> Instant Answers
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl mx-auto">
            Everything you need to know about buying, selling, real-time DMs,
            book offers, XP, badges, reading streaks, and platform safety.
          </p>

          <div className="mt-7 max-w-xl mx-auto relative">
            <Search className="h-4 w-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions (e.g., offer, streak, XP, refund, block)..."
              className="w-full rounded-full bg-white/10 border border-white/15 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc]"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 -mt-7">
        {/* Category Tabs */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-black/[0.06] mb-6 flex flex-wrap gap-1.5 justify-center">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id)
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-white shadow-sm border border-black/[0.06] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#f5f5f7]/50 transition-colors"
                >
                  <div>
                    <span className="inline-block rounded-full bg-[#0066cc]/10 text-[#0066cc] px-2.5 py-0.5 text-[10px] font-bold uppercase mb-1">
                      {faq.category}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f]">
                      {faq.question}
                    </h2>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-[#0066cc] shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#86868b] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-2 text-xs sm:text-sm text-[#6e6e73] leading-relaxed border-t border-black/[0.04]">
                    <p>{faq.answer}</p>
                    {faq.relatedLink && (
                      <Link
                        href={faq.relatedLink.href}
                        className="mt-2 inline-block text-xs font-bold text-[#0066cc] hover:underline"
                      >
                        {faq.relatedLink.label} →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Still Have Questions Banner */}
        <div className="mt-10 rounded-2xl bg-black text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Still have a question?</h3>
            <p className="text-xs text-[#86868b] mt-1">
              Browse our 13-category Help Center or submit a support ticket to
              our team.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white"
            >
              <BookOpen className="h-3.5 w-3.5" /> Help Center
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 py-2.5 text-xs font-bold text-white"
            >
              <LifeBuoy className="h-3.5 w-3.5" /> Open Support Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
