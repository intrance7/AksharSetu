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
import { MascotCalloutCard } from "@/components/mascots/AksharSetuMascots"

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
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] pt-16 pb-20 px-4 sm:px-6 border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#C84200]/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#FF7F45]/12 blur-[100px]" />

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-4">
            <HelpCircle className="h-3.5 w-3.5" /> Instant Answers
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Frequently Asked{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Questions
            </span>
            .
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#D2CDC5] max-w-2xl mx-auto leading-relaxed">
            Clear answers about buying, selling, real-time messaging, book
            offers, XP, badges, reading streaks, and platform safety.
          </p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="h-5 w-5 text-[#C9C4BC] absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions (e.g., offer, streak, XP, refund, block)..."
              className="w-full rounded-full bg-white/10 border border-white/15 pl-12 pr-5 py-4 text-sm sm:text-base text-white placeholder:text-[#C9C4BC]/75 focus:outline-none focus:border-[#FF7F45] focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 -mt-7 relative z-10">
        {/* Category Tabs */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-[#1D1D1F]/[0.07] mb-6 flex flex-wrap gap-2 justify-center">
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-2 text-xs sm:text-[13px] font-bold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-[#1D1D1F] text-white shadow-xs"
                  : "bg-[#FAF6F0] text-[#5E5E63] hover:text-[#1D1D1F] border border-[#1D1D1F]/[0.06]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Akshar & Setu Editorial Greeting */}
        <MascotCalloutCard variant="faq" className="mb-6" />

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id)
            return (
              <div
                key={faq.id}
                className="rounded-3xl bg-white shadow-sm border border-[#1D1D1F]/[0.07] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#FAF6F0]/70 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="inline-block rounded-full bg-[#FAF6F0] border border-[#C84200]/20 text-[#C84200] px-3 py-0.5 font-mono text-xs font-bold uppercase mb-1.5">
                      {faq.category}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] leading-snug">
                      {faq.question}
                    </h2>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#C84200] shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#6E6E73] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-3 text-[15px] sm:text-base text-[#5E5E63] leading-relaxed border-t border-[#1D1D1F]/[0.06] bg-[#FAF6F0]/35">
                    <p>{faq.answer}</p>
                    {faq.relatedLink && (
                      <Link
                        href={faq.relatedLink.href}
                        className="mt-3 inline-block text-sm font-bold text-[#C84200] hover:underline"
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
        <div className="mt-10 relative overflow-hidden rounded-3xl bg-[#0B0B0D] text-white p-7 sm:p-9 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#C84200]/25 blur-[70px]" />

          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Still have a{" "}
              <span className="font-serif italic font-medium text-[#FF7F45]">
                question
              </span>
              ?
            </h3>
            <p className="text-sm text-[#D2CDC5] mt-1.5 leading-relaxed">
              Browse our 13-category Help Center or submit a tracked support
              ticket to our team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-5 py-2.5 text-sm font-bold text-white transition-colors"
            >
              <BookOpen className="h-4 w-4 text-[#FF7F45]" /> Help Center
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] px-5 py-2.5 text-sm font-bold text-white transition-colors"
            >
              <LifeBuoy className="h-4 w-4" /> Open Support Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
