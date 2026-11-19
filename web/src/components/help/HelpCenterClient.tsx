"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  BookOpen,
  Sparkles,
  Trophy,
  Flame,
  Target,
  BarChart3,
  HelpCircle,
  Scale,
  LifeBuoy,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react"
import {
  HELP_CATEGORIES,
  HELP_ARTICLES,
  FAQ_ITEMS,
  type HelpArticle,
} from "@/lib/helpCenterData"
import { LEGAL_DOCUMENT_LIST } from "@/lib/legalDocumentsData"
import { BADGE_ARTWORK_LIST } from "@/lib/badgeRegistry"

function highlightText(text: string, query: string) {
  const q = query.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escaped})`, "gi"))
  return parts.map((part, idx) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={idx}
        className="rounded bg-[#C84200]/15 px-1 text-[#C84200] font-bold"
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export interface CustomHelpArticleItem {
  slug: string
  title: string
  category: string
  summary: string
  updatedAt: string
}

export function HelpCenterClient({
  customArticles = [],
}: {
  customArticles?: CustomHelpArticleItem[]
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const allArticles: HelpArticle[] = useMemo(() => {
    const customMapped: HelpArticle[] = customArticles.map((c) => ({
      slug: c.slug,
      title: c.title,
      category: c.category,
      summary: c.summary,
      updatedAt: c.updatedAt.slice(0, 10),
      popular: false,
      recentlyUpdated: true,
      sections: [
        {
          id: "overview",
          heading: c.title,
          body: c.summary,
        },
      ],
      relatedSlugs: ["getting-started-with-aksharsetu"],
    }))
    const existingSlugs = new Set(customMapped.map((c) => c.slug))
    return [
      ...customMapped,
      ...HELP_ARTICLES.filter((a) => !existingSlugs.has(a.slug)),
    ]
  }, [customArticles])

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allArticles.filter((article) => {
      if (selectedCategory !== "all" && article.category !== selectedCategory) {
        return false
      }
      if (!q) return true
      return (
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.sections.some(
          (s) =>
            s.heading.toLowerCase().includes(q) ||
            s.body.toLowerCase().includes(q)
        )
      )
    })
  }, [allArticles, searchQuery, selectedCategory])

  const unifiedResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null

    const faqs = FAQ_ITEMS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    ).slice(0, 5)

    const legalDocs = LEGAL_DOCUMENT_LIST.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.sections.some((s) => s.heading.toLowerCase().includes(q))
    ).slice(0, 4)

    const badges = BADGE_ARTWORK_LIST.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.rarity.toLowerCase().includes(q)
    ).slice(0, 6)

    return {
      articles: filteredArticles,
      faqs,
      legalDocs,
      badges,
      total:
        filteredArticles.length +
        faqs.length +
        legalDocs.length +
        badges.length,
    }
  }, [searchQuery, filteredArticles])

  const popularArticles = useMemo(
    () => allArticles.filter((a) => a.popular),
    [allArticles]
  )
  const recentArticles = useMemo(
    () => allArticles.filter((a) => a.recentlyUpdated),
    [allArticles]
  )

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Hero Section */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] pt-16 pb-22 px-4 sm:px-6 border-b border-white/10">
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

        <div className="mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-5">
            <BookOpen className="h-3.5 w-3.5" />
            Documentation, Policies &amp; Support Hub
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            How can we{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              help you
            </span>{" "}
            today?
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#D2CDC5] max-w-2xl mx-auto leading-relaxed">
            Search across all 13 Help Center topics, XP &amp; Level formulas,
            achievement badges, FAQs, and platform legal policies.
          </p>

          {/* Unified Search Input */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <Search className="h-5 w-5 text-[#C9C4BC] absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, XP rules, badges, safety policies, or FAQs..."
              className="w-full rounded-full bg-white/10 border border-white/15 pl-13 pr-12 py-4 text-sm sm:text-base text-white placeholder:text-[#C9C4BC]/75 focus:outline-none focus:border-[#FF7F45] focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#C9C4BC] hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Pill Shortcuts */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-[13px]">
            <span className="text-[#C9C4BC] font-medium">Quick Guides:</span>
            <Link
              href="/help/xp-and-levels"
              className="rounded-full bg-white/10 hover:bg-[#C84200] border border-white/10 px-4 py-1.5 text-white font-semibold transition-colors"
            >
              XP &amp; Levels Calculator
            </Link>
            <Link
              href="/help/badges-and-achievements"
              className="rounded-full bg-white/10 hover:bg-[#C84200] border border-white/10 px-4 py-1.5 text-white font-semibold transition-colors"
            >
              Badges &amp; Rarity Guide
            </Link>
            <Link
              href="/help/reading-streaks"
              className="rounded-full bg-white/10 hover:bg-[#C84200] border border-white/10 px-4 py-1.5 text-white font-semibold transition-colors"
            >
              Reading Streaks
            </Link>
            <Link
              href="/help/quests-and-rewards"
              className="rounded-full bg-white/10 hover:bg-[#C84200] border border-white/10 px-4 py-1.5 text-white font-semibold transition-colors"
            >
              Quests &amp; Rewards
            </Link>
            <Link
              href="/help/leaderboards"
              className="rounded-full bg-white/10 hover:bg-[#C84200] border border-white/10 px-4 py-1.5 text-white font-semibold transition-colors"
            >
              Leaderboards
            </Link>
            <Link
              href="/achievements"
              className="rounded-full bg-white/10 hover:bg-[#C84200] border border-white/10 px-4 py-1.5 text-white font-semibold transition-colors"
            >
              Badge Gallery
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-8 relative z-10">
        {/* Unified Search Results Panel when searching */}
        {unifiedResults && (
          <div className="mb-10 rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1D1D1F]/[0.06] pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  Unified Search Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-sm text-[#5E5E63] mt-0.5">
                  Found{" "}
                  <span className="font-mono font-bold text-[#1D1D1F]">
                    {unifiedResults.total}
                  </span>{" "}
                  matching results across Help Articles, FAQs, Badges, and Legal
                  Policies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.08] px-4 py-2 text-xs font-bold text-[#1D1D1F] cursor-pointer"
              >
                Reset Search
              </button>
            </div>

            {unifiedResults.total === 0 ? (
              <div className="py-10 text-center">
                <p className="text-base font-bold text-[#1D1D1F]">
                  No matching documentation found for &ldquo;{searchQuery}
                  &rdquo;.
                </p>
                <p className="text-sm text-[#5E5E63] mt-1.5">
                  Try searching for &ldquo;XP&rdquo;, &ldquo;offer&rdquo;,
                  &ldquo;streak&rdquo;, &ldquo;refund&rdquo;, or open a support
                  ticket.
                </p>
                <Link
                  href="/support"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] px-6 py-2.5 text-sm font-bold text-white transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {unifiedResults.articles.length > 0 && (
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3">
                      Help Center Articles ({unifiedResults.articles.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {unifiedResults.articles.map((art) => (
                        <Link
                          key={art.slug}
                          href={`/help/${art.slug}`}
                          className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] hover:bg-[#EFE7DC]/70 p-4 transition-all"
                        >
                          <div className="text-sm sm:text-[15px] font-bold text-[#1D1D1F]">
                            {highlightText(art.title, searchQuery)}
                          </div>
                          <p className="text-sm text-[#5E5E63] mt-1 line-clamp-2 leading-relaxed">
                            {highlightText(art.summary, searchQuery)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {unifiedResults.faqs.length > 0 && (
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3">
                      Frequently Asked Questions ({unifiedResults.faqs.length})
                    </h3>
                    <div className="space-y-2.5">
                      {unifiedResults.faqs.map((faq) => (
                        <Link
                          key={faq.id}
                          href="/faq"
                          className="block rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] hover:bg-[#EFE7DC]/70 p-4 transition-all"
                        >
                          <div className="text-sm sm:text-[15px] font-bold text-[#1D1D1F]">
                            {highlightText(faq.question, searchQuery)}
                          </div>
                          <p className="text-sm text-[#5E5E63] mt-1 leading-relaxed">
                            {highlightText(faq.answer, searchQuery)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {unifiedResults.badges.length > 0 && (
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3">
                      Matching Badges ({unifiedResults.badges.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {unifiedResults.badges.map((b) => (
                        <Link
                          key={b.code}
                          href="/achievements"
                          className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] hover:bg-[#EFE7DC]/70 p-3.5 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-sm font-bold text-[#1D1D1F]">
                              {highlightText(b.name, searchQuery)}
                            </div>
                            <div className="font-mono text-xs font-semibold text-[#6E6E73] mt-0.5">
                              {b.category} · {b.rarity}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[#C84200]" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {unifiedResults.legalDocs.length > 0 && (
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3">
                      Legal &amp; Platform Policies (
                      {unifiedResults.legalDocs.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {unifiedResults.legalDocs.map((doc) => (
                        <Link
                          key={doc.slug}
                          href={`/legal/${doc.slug}`}
                          className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] hover:bg-[#EFE7DC]/70 p-4"
                        >
                          <div className="text-sm sm:text-[15px] font-bold text-[#1D1D1F]">
                            {highlightText(doc.title, searchQuery)}
                          </div>
                          <p className="text-sm text-[#5E5E63] mt-1 line-clamp-2 leading-relaxed">
                            {highlightText(doc.summary, searchQuery)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Featured Progression, XP & Badges Documentation Bento Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-12">
          <Link
            href="/help/xp-and-levels"
            className="rounded-3xl bg-white p-5 shadow-sm border border-[#1D1D1F]/[0.07] hover:border-[#C84200] hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#FAF6F0] text-[#0066cc] flex items-center justify-center mb-3.5 border border-[#0066cc]/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
              XP &amp; Levels
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E5E63] mt-1.5 leading-relaxed">
              Live XP formulas, rank titles &amp; interactive level calculator.
            </p>
          </Link>

          <Link
            href="/help/badges-and-achievements"
            className="rounded-3xl bg-white p-5 shadow-sm border border-[#1D1D1F]/[0.07] hover:border-[#C84200] hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#FAF6F0] text-[#C84200] flex items-center justify-center mb-3.5 border border-[#C84200]/15">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
              Badges &amp; Rarity
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E5E63] mt-1.5 leading-relaxed">
              All 6 rarity tiers, unlock thresholds &amp; showcase pinning.
            </p>
          </Link>

          <Link
            href="/help/reading-streaks"
            className="rounded-3xl bg-white p-5 shadow-sm border border-[#1D1D1F]/[0.07] hover:border-[#C84200] hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#FAF6F0] text-amber-600 flex items-center justify-center mb-3.5 border border-amber-500/20">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
              Reading Streaks
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E5E63] mt-1.5 leading-relaxed">
              Qualifying daily actions, UTC resets &amp; 365-day heatmap rules.
            </p>
          </Link>

          <Link
            href="/help/quests-and-rewards"
            className="rounded-3xl bg-white p-5 shadow-sm border border-[#1D1D1F]/[0.07] hover:border-[#C84200] hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#FAF6F0] text-[#0A7D4F] flex items-center justify-center mb-3.5 border border-[#0A7D4F]/15">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
              Quests &amp; Rewards
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E5E63] mt-1.5 leading-relaxed">
              Daily/Weekly quests, Akshar Points (AP) &amp; cosmetic frames.
            </p>
          </Link>

          <Link
            href="/help/leaderboards"
            className="rounded-3xl bg-white p-5 shadow-sm border border-[#1D1D1F]/[0.07] hover:border-[#C84200] hover:shadow-md transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#FAF6F0] text-rose-600 flex items-center justify-center mb-3.5 border border-rose-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
              Leaderboards
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E5E63] mt-1.5 leading-relaxed">
              Ranking categories, fair play &amp; privacy opt-out controls.
            </p>
          </Link>
        </div>

        {/* 13 Documentation Categories Filter Grid */}
        <section className="mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Browse by Category{" "}
                <span className="font-serif italic font-medium text-[#C84200]">
                  (13 Topics)
                </span>
              </h2>
              <p className="text-sm sm:text-[15px] text-[#5E5E63] mt-1">
                Select any topic to filter articles or explore step-by-step
                guides.
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="self-start rounded-full bg-white hover:bg-[#FAF6F0] border border-[#1D1D1F]/10 px-4 py-2 text-xs sm:text-sm font-bold text-[#1D1D1F] cursor-pointer"
              >
                Show All Categories
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HELP_CATEGORIES.map((cat) => {
              const count = allArticles.filter(
                (a) => a.category === cat.id
              ).length
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(isSelected ? "all" : cat.id)
                  }
                  className={`text-left rounded-3xl p-5 sm:p-6 transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-md"
                      : "bg-white text-[#1D1D1F] border-[#1D1D1F]/[0.07] hover:border-[#C84200] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold">{cat.name}</span>
                    <span
                      className={`rounded-full px-3 py-0.5 font-mono text-xs font-bold shrink-0 ${
                        isSelected
                          ? "bg-white/15 text-white"
                          : "bg-[#FAF6F0] text-[#5E5E63]"
                      }`}
                    >
                      {count} {count === 1 ? "guide" : "guides"}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-2 leading-relaxed ${
                      isSelected ? "text-white/80" : "text-[#5E5E63]"
                    }`}
                  >
                    {cat.description}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Filtered Articles List */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {selectedCategory === "all"
                ? "All Help Center Guides"
                : `${
                    HELP_CATEGORIES.find((c) => c.id === selectedCategory)
                      ?.name || "Category"
                  } Guides`}
            </h2>
            <span className="font-mono text-xs sm:text-sm font-semibold text-[#5E5E63]">
              {filteredArticles.length} articles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => {
              const categoryTitle =
                HELP_CATEGORIES.find((c) => c.id === article.category)?.name ||
                article.category
              return (
                <Link
                  key={article.slug}
                  href={`/help/${article.slug}`}
                  className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07] hover:border-[#C84200] hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#C84200]">
                      <span>{categoryTitle}</span>
                      <span className="inline-flex items-center gap-1 text-[#6E6E73] font-medium normal-case">
                        <Clock className="h-3.5 w-3.5" />{" "}
                        {Math.max(2, article.sections.length)} min read
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1D1D1F] group-hover:text-[#C84200] mt-2.5 leading-snug transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[#5E5E63] mt-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#1D1D1F]/[0.06] flex items-center justify-between text-xs sm:text-[13px]">
                    <span className="font-mono text-[#6E6E73]">
                      Updated {article.updatedAt}
                    </span>
                    <span className="font-bold text-[#C84200] inline-flex items-center gap-1">
                      Read Guide <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Popular & Recently Updated Articles Split */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#C84200]" />
              Popular Articles
            </h3>
            <div className="space-y-3">
              {popularArticles.map((art) => (
                <Link
                  key={art.slug}
                  href={`/help/${art.slug}`}
                  className="flex items-center justify-between rounded-2xl bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.06] px-4 py-3.5 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1D1D1F]">
                      {art.title}
                    </div>
                    <div className="text-xs text-[#5E5E63] line-clamp-1 mt-0.5">
                      {art.summary}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#C84200] shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#0A7D4F]" />
              Recently Updated Articles
            </h3>
            <div className="space-y-3">
              {recentArticles.map((art) => (
                <Link
                  key={art.slug}
                  href={`/help/${art.slug}`}
                  className="flex items-center justify-between rounded-2xl bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.06] px-4 py-3.5 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1D1D1F]">
                      {art.title}
                    </div>
                    <div className="font-mono text-xs text-[#6E6E73] mt-0.5">
                      Updated {art.updatedAt}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#0A7D4F] shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Support, FAQ & Legal Hub Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-[#C84200]/15 text-[#C84200] flex items-center justify-center mb-4">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F]">
                Frequently Asked Questions
              </h3>
              <p className="text-sm text-[#5E5E63] mt-1.5 leading-relaxed">
                Instant answers across General, Buying, Selling, Messaging,
                Gamification, Privacy, and Payments.
              </p>
            </div>
            <Link
              href="/faq"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.08] px-5 py-2.5 text-sm font-bold text-[#1D1D1F] transition-colors"
            >
              Explore FAQ System
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-[#0066cc]/15 text-[#0066cc] flex items-center justify-center mb-4">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F]">
                Legal &amp; Platform Policies
              </h3>
              <p className="text-sm text-[#5E5E63] mt-1.5 leading-relaxed">
                Read our 14 transparent policies including Terms of Service,
                Privacy Policy, Buyer Protection, and Community Guidelines.
              </p>
            </div>
            <Link
              href="/legal"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.08] px-5 py-2.5 text-sm font-bold text-[#1D1D1F] transition-colors"
            >
              View All 14 Policies
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-[#0B0B0D] text-white p-6 sm:p-7 shadow-sm border border-white/10 flex flex-col justify-between">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#C84200]/25 blur-[60px]" />

            <div className="relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-[#FF7F45] flex items-center justify-center mb-4">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">
                Need Personal Support or Want to Report an Issue?
              </h3>
              <p className="text-sm text-[#D2CDC5] mt-1.5 leading-relaxed">
                Submit a tracked support ticket or report a suspicious listing
                directly to our Trust &amp; Safety team.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5 relative z-10">
              <Link
                href="/support"
                className="flex-1 inline-flex items-center justify-center rounded-full bg-[#C84200] hover:bg-[#A33500] px-4 py-2.5 text-sm font-bold text-white transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/support?category=BUG_REPORT"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-[#FF7F45]" />
                Report Bug
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
