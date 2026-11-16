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
        className="rounded bg-[#0066cc]/15 px-1 text-[#0066cc] font-bold"
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
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      {/* Deep Black Hero Section */}
      <section className="bg-black text-[#f5f5f7] pt-16 pb-20 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80 mb-6">
            <BookOpen className="h-3.5 w-3.5 text-[#0066cc]" />
            AksharSetu Documentation, Policies & Support Hub
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter leading-none">
            How can we help you today?
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#86868b] max-w-2xl mx-auto">
            Search across all 13 Help Center categories, XP & Level formulas,
            achievement badges, FAQs, and platform legal policies.
          </p>

          {/* Unified Search Input */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <Search className="h-5 w-5 text-[#86868b] absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, XP rules, badges, safety policies, or FAQs..."
              className="w-full rounded-full bg-white/10 border border-white/15 pl-13 pr-12 py-4 text-sm sm:text-base text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#86868b] hover:text-white hover:bg-white/10"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Pill Shortcuts */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-[#86868b] font-medium">Quick Guides:</span>
            <Link
              href="/help/xp-and-levels"
              className="rounded-full bg-white/10 hover:bg-[#0066cc] px-3.5 py-1.5 text-white font-medium transition-colors"
            >
              XP & Levels Calculator
            </Link>
            <Link
              href="/help/badges-and-achievements"
              className="rounded-full bg-white/10 hover:bg-[#0066cc] px-3.5 py-1.5 text-white font-medium transition-colors"
            >
              Badges & Rarity Guide
            </Link>
            <Link
              href="/help/reading-streaks"
              className="rounded-full bg-white/10 hover:bg-[#0066cc] px-3.5 py-1.5 text-white font-medium transition-colors"
            >
              Reading Streaks
            </Link>
            <Link
              href="/help/quests-and-rewards"
              className="rounded-full bg-white/10 hover:bg-[#0066cc] px-3.5 py-1.5 text-white font-medium transition-colors"
            >
              Quests & Rewards
            </Link>
            <Link
              href="/help/leaderboards"
              className="rounded-full bg-white/10 hover:bg-[#0066cc] px-3.5 py-1.5 text-white font-medium transition-colors"
            >
              Leaderboards
            </Link>
            <Link
              href="/achievements"
              className="rounded-full bg-white/10 hover:bg-[#0066cc] px-3.5 py-1.5 text-white font-medium transition-colors"
            >
              Badge Gallery
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-8">
        {/* Unified Search Results Panel when searching */}
        {unifiedResults && (
          <div className="mb-10 rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#1d1d1f]">
                  Unified Search Results for &ldquo;{searchQuery}&rdquo;
                </h2>
                <p className="text-xs text-[#86868b]">
                  Found {unifiedResults.total} matching results across Help
                  Articles, FAQs, Badges, and Legal Policies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] px-4 py-1.5 text-xs font-bold text-[#1d1d1f]"
              >
                Reset Search
              </button>
            </div>

            {unifiedResults.total === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-[#1d1d1f]">
                  No matching documentation found for &ldquo;{searchQuery}
                  &rdquo;.
                </p>
                <p className="text-xs text-[#86868b] mt-1">
                  Try searching for &ldquo;XP&rdquo;, &ldquo;offer&rdquo;,
                  &ldquo;streak&rdquo;, &ldquo;refund&rdquo;, or open a support
                  ticket.
                </p>
                <Link
                  href="/support"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0066cc] px-5 py-2.5 text-xs font-bold text-white"
                >
                  Contact Support
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {unifiedResults.articles.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                      Help Center Articles ({unifiedResults.articles.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {unifiedResults.articles.map((art) => (
                        <Link
                          key={art.slug}
                          href={`/help/${art.slug}`}
                          className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 hover:bg-[#f5f5f7] p-4 transition-all"
                        >
                          <div className="text-sm font-bold text-[#1d1d1f]">
                            {highlightText(art.title, searchQuery)}
                          </div>
                          <p className="text-xs text-[#86868b] mt-1 line-clamp-2">
                            {highlightText(art.summary, searchQuery)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {unifiedResults.faqs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                      Frequently Asked Questions ({unifiedResults.faqs.length})
                    </h3>
                    <div className="space-y-2.5">
                      {unifiedResults.faqs.map((faq) => (
                        <Link
                          key={faq.id}
                          href={`/faq`}
                          className="block rounded-xl border border-black/[0.06] bg-[#f5f5f7]/50 hover:bg-[#f5f5f7] p-4 transition-all"
                        >
                          <div className="text-sm font-bold text-[#1d1d1f]">
                            {highlightText(faq.question, searchQuery)}
                          </div>
                          <p className="text-xs text-[#6e6e73] mt-1">
                            {highlightText(faq.answer, searchQuery)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {unifiedResults.badges.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                      Matching Badges ({unifiedResults.badges.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {unifiedResults.badges.map((b) => (
                        <Link
                          key={b.code}
                          href={`/achievements`}
                          className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 hover:bg-[#f5f5f7] p-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#1d1d1f]">
                              {highlightText(b.name, searchQuery)}
                            </div>
                            <div className="text-[10px] font-semibold text-[#86868b]">
                              {b.category} · {b.rarity}
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-[#0066cc]" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {unifiedResults.legalDocs.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                      Legal & Platform Policies ({unifiedResults.legalDocs.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {unifiedResults.legalDocs.map((doc) => (
                        <Link
                          key={doc.slug}
                          href={`/legal/${doc.slug}`}
                          className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/60 hover:bg-[#f5f5f7] p-4"
                        >
                          <div className="text-sm font-bold text-[#1d1d1f]">
                            {highlightText(doc.title, searchQuery)}
                          </div>
                          <p className="text-xs text-[#86868b] mt-1 line-clamp-2">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-10">
          <Link
            href="/help/xp-and-levels"
            className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06] hover:border-[#0066cc] transition-all group"
          >
            <div className="h-9 w-9 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center mb-3">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">
              XP & Levels
            </h3>
            <p className="text-xs text-[#86868b] mt-1">
              Live XP formulas, rank titles & interactive level calculator.
            </p>
          </Link>

          <Link
            href="/help/badges-and-achievements"
            className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06] hover:border-[#0066cc] transition-all group"
          >
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
              <Trophy className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">
              Badges & Rarity
            </h3>
            <p className="text-xs text-[#86868b] mt-1">
              All 6 rarity tiers, unlock thresholds & showcase pinning.
            </p>
          </Link>

          <Link
            href="/help/reading-streaks"
            className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06] hover:border-[#0066cc] transition-all group"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
              <Flame className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">
              Reading Streaks
            </h3>
            <p className="text-xs text-[#86868b] mt-1">
              Qualifying daily actions, UTC resets & 365-day heatmap rules.
            </p>
          </Link>

          <Link
            href="/help/quests-and-rewards"
            className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06] hover:border-[#0066cc] transition-all group"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <Target className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">
              Quests & Rewards
            </h3>
            <p className="text-xs text-[#86868b] mt-1">
              Daily/Weekly quests, Akshar Points (AP) & cosmetic frames.
            </p>
          </Link>

          <Link
            href="/help/leaderboards"
            className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06] hover:border-[#0066cc] transition-all group"
          >
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0066cc]">
              Leaderboards
            </h3>
            <p className="text-xs text-[#86868b] mt-1">
              Ranking categories, fair play & privacy opt-out controls.
            </p>
          </Link>
        </div>

        {/* 13 Documentation Categories Filter Grid */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                Browse by Category (13 Topics)
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                Select any category to filter articles or explore step-by-step
                guides.
              </p>
            </div>
            {selectedCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="self-start rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] px-4 py-1.5 text-xs font-bold text-[#1d1d1f]"
              >
                Show All Categories
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                  className={`text-left rounded-2xl p-5 transition-all border ${
                    isSelected
                      ? "bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md"
                      : "bg-white text-[#1d1d1f] border-black/[0.06] hover:border-[#0066cc] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{cat.name}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isSelected
                          ? "bg-white/15 text-white"
                          : "bg-[#f5f5f7] text-[#6e6e73]"
                      }`}
                    >
                      {count} {count === 1 ? "guide" : "guides"}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1.5 leading-relaxed ${
                      isSelected ? "text-white/75" : "text-[#86868b]"
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
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
              {selectedCategory === "all"
                ? "All Help Center Guides"
                : `${
                    HELP_CATEGORIES.find((c) => c.id === selectedCategory)
                      ?.name || "Category"
                  } Guides`}
            </h2>
            <span className="text-xs font-semibold text-[#86868b]">
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
                  className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06] hover:border-[#0066cc] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-[#0066cc]">
                      <span>{categoryTitle}</span>
                      <span className="inline-flex items-center gap-1 text-[#86868b] font-medium normal-case">
                        <Clock className="h-3 w-3" />{" "}
                        {Math.max(2, article.sections.length)} min read
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1d1d1f] group-hover:text-[#0066cc] mt-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[#86868b] mt-1.5 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.05] flex items-center justify-between text-xs">
                    <span className="text-[#86868b]">
                      Updated {article.updatedAt}
                    </span>
                    <span className="font-bold text-[#0066cc] inline-flex items-center gap-1">
                      Read Guide <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Popular & Recently Updated Articles Split */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h3 className="text-base font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#0066cc]" />
              Popular Articles
            </h3>
            <div className="space-y-3">
              {popularArticles.map((art) => (
                <Link
                  key={art.slug}
                  href={`/help/${art.slug}`}
                  className="flex items-center justify-between rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] px-4 py-3 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1d1d1f]">
                      {art.title}
                    </div>
                    <div className="text-[11px] text-[#86868b] line-clamp-1">
                      {art.summary}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#0066cc] shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
            <h3 className="text-base font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Recently Updated Articles
            </h3>
            <div className="space-y-3">
              {recentArticles.map((art) => (
                <Link
                  key={art.slug}
                  href={`/help/${art.slug}`}
                  className="flex items-center justify-between rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] px-4 py-3 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1d1d1f]">
                      {art.title}
                    </div>
                    <div className="text-[11px] text-[#86868b]">
                      Updated {art.updatedAt}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#0066cc] shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Support, FAQ & Legal Hub Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06] flex flex-col justify-between">
            <div>
              <HelpCircle className="h-6 w-6 text-[#0066cc] mb-3" />
              <h3 className="text-base font-bold text-[#1d1d1f]">
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                Instant answers across General, Buying, Selling, Messaging,
                Gamification, Privacy, and Payments.
              </p>
            </div>
            <Link
              href="/faq"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] px-4 py-2.5 text-xs font-bold text-[#1d1d1f] transition-colors"
            >
              Explore FAQ System
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06] flex flex-col justify-between">
            <div>
              <Scale className="h-6 w-6 text-[#0066cc] mb-3" />
              <h3 className="text-base font-bold text-[#1d1d1f]">
                Legal & Platform Policies
              </h3>
              <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                Read our 14 transparent policies including Terms of Service,
                Privacy Policy, Buyer Protection, and Community Guidelines.
              </p>
            </div>
            <Link
              href="/legal"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[#e8e8ed] hover:bg-[#d2d2d7] px-4 py-2.5 text-xs font-bold text-[#1d1d1f] transition-colors"
            >
              View All 14 Policies
            </Link>
          </div>

          <div className="rounded-2xl bg-black text-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <LifeBuoy className="h-6 w-6 text-[#0066cc] mb-3" />
              <h3 className="text-base font-bold">
                Need Personal Support or Want to Report an Issue?
              </h3>
              <p className="text-xs text-[#86868b] mt-1 leading-relaxed">
                Submit a tracked support ticket or report a suspicious listing
                directly to our Trust & Safety team.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/support"
                className="flex-1 inline-flex items-center justify-center rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-4 py-2.5 text-xs font-bold text-white transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/support?category=BUG_REPORT"
                className="inline-flex items-center justify-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-bold text-white transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Report Problem
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
