"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { EBook, coverUrl } from "@/lib/gutenberg"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  ScrollText,
  ExternalLink,
  Layers,
} from "lucide-react"
import StartShantiButton from "./StartShantiButton"

type ThemeMode = "paper" | "sepia" | "night"
type FontFamily = "serif" | "sans"
export type ViewMode = "classic" | "book" | "scan"

const THEMES: Record<
  ThemeMode,
  {
    label: string
    bg: string
    pageBg: string
    text: string
    sub: string
    bar: string
    border: string
    bookCover: string
    pageEdge: string
  }
> = {
  paper: {
    label: "Paper",
    bg: "bg-[#f5f5f7]",
    pageBg: "bg-[#fffdf9]",
    text: "text-[#1d1d1f]",
    sub: "text-[#6e6e73]",
    bar: "bg-white/90 border-black/10",
    border: "border-black/10",
    bookCover: "bg-[#231f20] border-[#3a3335]",
    pageEdge: "bg-[#ebe5d9]",
  },
  sepia: {
    label: "Sepia",
    bg: "bg-[#eadec9]",
    pageBg: "bg-[#f6eedf]",
    text: "text-[#2c2217]",
    sub: "text-[#7a6348]",
    bar: "bg-[#f4ecd8]/95 border-[#dccbb0]",
    border: "border-[#d8c4a3]",
    bookCover: "bg-[#3d2616] border-[#593822]",
    pageEdge: "bg-[#dfd1b8]",
  },
  night: {
    label: "Night",
    bg: "bg-[#0a0a0c]",
    pageBg: "bg-[#151518]",
    text: "text-[#e5e5ea]",
    sub: "text-[#8e8e93]",
    bar: "bg-[#141416]/90 border-white/10",
    border: "border-white/10",
    bookCover: "bg-[#050507] border-white/15",
    pageEdge: "bg-[#222227]",
  },
}

export default function EReader({
  book,
  defaultViewMode = "book",
}: {
  book: EBook
  defaultViewMode?: ViewMode
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [pageSize] = useState(18)
  const [page, setPage] = useState(1)
  const [bookSpread, setBookSpread] = useState(0)
  const [flipDirection, setFlipDirection] = useState<1 | -1>(1)
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [theme, setTheme] = useState<ThemeMode>("sepia")
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif")
  const [bookmarked, setBookmarked] = useState(false)

  // Classic mode pagination
  const totalClassicPages = useMemo(
    () => Math.max(1, Math.ceil(book.paragraphs.length / pageSize)),
    [book.paragraphs.length, pageSize]
  )

  // Book mode pagination: group paragraphs into balanced physical-sized pages (~1250 chars per page)
  const bookPages = useMemo(() => {
    const pages: string[][] = []
    let current: string[] = []
    let charCount = 0
    const targetChars = fontSize > 20 ? 900 : fontSize < 17 ? 1450 : 1200

    for (const para of book.paragraphs) {
      if (current.length > 0 && charCount + para.length > targetChars) {
        pages.push(current)
        current = [para]
        charCount = para.length
      } else {
        current.push(para)
        charCount += para.length
      }
    }
    if (current.length > 0) pages.push(current)
    if (pages.length === 0) pages.push(["No text content available for this edition."])
    return pages
  }, [book.paragraphs, fontSize])

  const totalSpreads = useMemo(
    () => Math.max(1, Math.ceil(bookPages.length / 2)),
    [bookPages.length]
  )

  const progressKey = `ereader:${book.id}:page`
  const spreadKey = `ereader:${book.id}:spread`
  const prefsKey = `ereader:prefs`

  useEffect(() => {
    const savedPage = localStorage.getItem(progressKey)
    if (savedPage) {
      const p = Number(savedPage)
      if (!Number.isNaN(p) && p >= 1 && p <= totalClassicPages) {
        setPage(p)
        setBookmarked(true)
      }
    }
    const savedSpread = localStorage.getItem(spreadKey)
    if (savedSpread) {
      const s = Number(savedSpread)
      if (!Number.isNaN(s) && s >= 0 && s < totalSpreads) {
        setBookSpread(s)
      }
    }
    const savedPrefs = localStorage.getItem(prefsKey)
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs)
        if (parsed.theme && THEMES[parsed.theme as ThemeMode]) setTheme(parsed.theme)
        if (parsed.fontSize) setFontSize(parsed.fontSize)
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily)
        if (parsed.viewMode && (parsed.viewMode === "classic" || parsed.viewMode === "book")) {
          setViewMode(parsed.viewMode)
        }
      } catch {}
    }
  }, [progressKey, spreadKey, totalClassicPages, totalSpreads])

  useEffect(() => {
    localStorage.setItem(progressKey, String(page))
  }, [page, progressKey])

  useEffect(() => {
    localStorage.setItem(spreadKey, String(bookSpread))
  }, [bookSpread, spreadKey])

  useEffect(() => {
    localStorage.setItem(
      prefsKey,
      JSON.stringify({
        theme,
        fontSize,
        fontFamily,
        viewMode: viewMode === "scan" ? "book" : viewMode,
      })
    )
  }, [theme, fontSize, fontFamily, viewMode])

  const goNextSpread = () => {
    if (bookSpread < totalSpreads - 1) {
      setFlipDirection(1)
      setBookSpread((s) => Math.min(totalSpreads - 1, s + 1))
    }
  }

  const goPrevSpread = () => {
    if (bookSpread > 0) {
      setFlipDirection(-1)
      setBookSpread((s) => Math.max(0, s - 1))
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        if (viewMode === "book") {
          goNextSpread()
        } else if (viewMode === "classic") {
          setPage((p) => Math.min(totalClassicPages, p + 1))
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      } else if (e.key === "ArrowLeft") {
        if (viewMode === "book") {
          goPrevSpread()
        } else if (viewMode === "classic") {
          setPage((p) => Math.max(1, p - 1))
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [viewMode, bookSpread, totalSpreads, totalClassicPages])

  const slice = useMemo(() => {
    const start = (page - 1) * pageSize
    return book.paragraphs.slice(start, start + pageSize)
  }, [book.paragraphs, page, pageSize])

  const leftPageIndex = bookSpread * 2
  const rightPageIndex = bookSpread * 2 + 1
  const leftParagraphs = bookPages[leftPageIndex] || []
  const rightParagraphs = bookPages[rightPageIndex] || []

  const currentTheme = THEMES[theme]
  const progressPct =
    viewMode === "book"
      ? Math.round(((bookSpread + 1) / totalSpreads) * 100)
      : Math.round((page / totalClassicPages) * 100)

  return (
    <div className={`min-h-screen transition-colors duration-300 ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Sticky Top Reader Bar */}
      <div className={`sticky top-12 z-30 border-b backdrop-blur-md transition-colors ${currentTheme.bar}`}>
        {/* Reading Progress Line */}
        <div className="h-1 w-full bg-black/5 overflow-hidden">
          <div
            className="h-full bg-[#0066cc] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Back + Book Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/ebooks"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${currentTheme.border} hover:opacity-80 transition`}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> E-Library
            </Link>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate max-w-[180px] sm:max-w-xs">{book.title}</p>
                {book.sourceLabel && (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0066cc]/10 text-[#0066cc]">
                    {book.sourceLabel}
                  </span>
                )}
              </div>
              <p className={`text-[11px] truncate ${currentTheme.sub}`}>{book.author}</p>
            </div>
          </div>

          {/* Reading Mode Switcher: Classic Read vs Book Read (+ Scanned Original if available) */}
          <div className={`inline-flex items-center rounded-full border p-0.5 ${currentTheme.border} bg-black/5`}>
            <button
              type="button"
              onClick={() => setViewMode("classic")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === "classic"
                  ? "bg-[#0066cc] text-white shadow-sm"
                  : "hover:opacity-80"
              }`}
              title="Single-column continuous classic scroll"
            >
              <ScrollText className="w-3.5 h-3.5" />
              Classic Read
            </button>
            <button
              type="button"
              onClick={() => setViewMode("book")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === "book"
                  ? "bg-[#0066cc] text-white shadow-sm"
                  : "hover:opacity-80"
              }`}
              title="Realistic open two-page hardcover book experience"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Book Read
            </button>
            {book.embedUrl && (
              <button
                type="button"
                onClick={() => setViewMode("scan")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === "scan"
                    ? "bg-[#0066cc] text-white shadow-sm"
                    : "hover:opacity-80"
                }`}
                title="Interactive scanned edition viewer"
              >
                <Layers className="w-3.5 h-3.5" />
                Scanned Edition
              </button>
            )}
          </div>

          {/* Typography & Theme Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Font Family */}
            <div className={`inline-flex rounded-full border p-0.5 text-xs ${currentTheme.border}`}>
              <button
                onClick={() => setFontFamily("serif")}
                className={`px-2.5 py-1 rounded-full font-serif transition ${
                  fontFamily === "serif" ? "bg-[#0066cc] text-white font-semibold" : ""
                }`}
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily("sans")}
                className={`px-2.5 py-1 rounded-full font-sans transition ${
                  fontFamily === "sans" ? "bg-[#0066cc] text-white font-semibold" : ""
                }`}
              >
                Sans
              </button>
            </div>

            {/* Font Size */}
            <div className={`inline-flex items-center rounded-full border px-1 py-0.5 text-xs ${currentTheme.border}`}>
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className="px-2 py-0.5 font-bold hover:opacity-70"
                title="Decrease font size"
              >
                A-
              </button>
              <span className={`px-1.5 text-[11px] ${currentTheme.sub}`}>{fontSize}</span>
              <button
                onClick={() => setFontSize((s) => Math.min(26, s + 2))}
                className="px-2 py-0.5 font-bold hover:opacity-70"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Theme Pills */}
            <div className={`inline-flex items-center rounded-full border p-0.5 text-xs ${currentTheme.border}`}>
              <button
                onClick={() => setTheme("paper")}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition ${
                  theme === "paper" ? "bg-white text-black shadow-sm font-semibold" : ""
                }`}
                title="Paper Mode"
              >
                <Sun className="w-3 h-3" /> Paper
              </button>
              <button
                onClick={() => setTheme("sepia")}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition ${
                  theme === "sepia" ? "bg-[#e3d2b4] text-[#2b2115] font-semibold" : ""
                }`}
                title="Sepia Mode"
              >
                <Sparkles className="w-3 h-3" /> Sepia
              </button>
              <button
                onClick={() => setTheme("night")}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition ${
                  theme === "night" ? "bg-[#2c2c30] text-white font-semibold" : ""
                }`}
                title="Night Mode"
              >
                <Moon className="w-3 h-3" /> Night
              </button>
            </div>

            {/* Shanti Focus Mode Launch */}
            <div className="hidden lg:block">
              <StartShantiButton
                gutenbergId={book.id}
                title={book.title}
                author={book.author}
                coverImage={book.coverImage || coverUrl(book.id)}
                totalPages={viewMode === "book" ? bookPages.length : totalClassicPages}
                compact
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODE 1: REALISTIC 2-PAGE OPEN HARDCOVER BOOK READ */}
      {viewMode === "book" && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
          {/* Open Hardcover Book Casing */}
          <div
            className={`relative rounded-[28px] p-2.5 sm:p-4 md:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] border-2 transition-colors ${currentTheme.bookCover}`}
            style={{ perspective: "1800px" }}
          >
            {/* Outer Stacked Paper Page Edges */}
            <div className={`relative rounded-[20px] p-1 sm:p-2 ${currentTheme.pageEdge} shadow-inner`}>
              {/* Top Crimson Bookmark Ribbon */}
              <div
                onClick={() => setBookmarked(true)}
                title="Bookmark current spread"
                className="hidden lg:block absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-6 h-12 bg-gradient-to-b from-[#b91c1c] to-[#7f1d1d] shadow-md cursor-pointer transition-transform hover:translate-y-0.5"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
                }}
              />

              {/* Animated 2-Page Book Spread */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={bookSpread}
                  initial={{
                    opacity: 0.35,
                    rotateY: flipDirection > 0 ? 8 : -8,
                    scale: 0.995,
                  }}
                  animate={{
                    opacity: 1,
                    rotateY: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0.35,
                    rotateY: flipDirection > 0 ? -8 : 8,
                    scale: 0.995,
                  }}
                  transition={{
                    duration: 0.38,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`relative grid grid-cols-1 lg:grid-cols-2 rounded-[16px] overflow-hidden shadow-xl ${currentTheme.pageBg}`}
                >
                  {/* Center Book Spine Crease & Shadow (Desktop 2-Page Spread) */}
                  <div
                    aria-hidden="true"
                    className="hidden lg:block pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 z-20"
                    style={{
                      background:
                        theme === "night"
                          ? "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 46%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.65) 54%, rgba(0,0,0,0) 100%)"
                          : "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(40,26,13,0.12) 45%, rgba(0,0,0,0.28) 50%, rgba(40,26,13,0.14) 55%, rgba(0,0,0,0) 100%)",
                    }}
                  />

                  {/* LEFT PAGE (Verso) */}
                  <div
                    onClick={goPrevSpread}
                    className={`relative flex flex-col justify-between min-h-[580px] sm:min-h-[660px] px-6 sm:px-10 md:px-14 py-8 sm:py-10 border-b lg:border-b-0 lg:border-r ${currentTheme.border} cursor-pointer select-text`}
                    style={{
                      backgroundImage:
                        theme === "night"
                          ? "radial-gradient(circle at 0% 50%, rgba(255,255,255,0.015), transparent 70%)"
                          : "linear-gradient(90deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 8%, rgba(0,0,0,0) 92%, rgba(0,0,0,0.04) 100%)",
                    }}
                  >
                    {/* Running Header (Left Page) */}
                    <div>
                      <div
                        className={`flex items-center justify-between text-[11px] uppercase tracking-[0.2em] pb-4 mb-6 border-b ${currentTheme.border} ${currentTheme.sub}`}
                      >
                        <span>{ leftPageIndex + 1 }</span>
                        <span className="truncate max-w-[240px] font-semibold">{book.title}</span>
                      </div>

                      {/* First Spread Decorative Title Ornament */}
                      {bookSpread === 0 && (
                        <div className={`mb-6 pb-5 border-b ${currentTheme.border}`}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0066cc] mb-1">
                            {book.sourceLabel || "Digital Edition"}
                          </p>
                          <h1
                            className={`text-xl sm:text-2xl font-bold tracking-tight ${
                              fontFamily === "serif" ? "font-serif" : "font-sans"
                            }`}
                          >
                            {book.title}
                          </h1>
                          <p className={`text-xs mt-1 italic ${currentTheme.sub}`}>by {book.author}</p>
                        </div>
                      )}

                      {/* Left Page Body Paragraphs */}
                      <div
                        style={{ fontSize: `${fontSize}px`, lineHeight }}
                        className={`space-y-4 ${fontFamily === "serif" ? "font-serif" : "font-sans"}`}
                      >
                        {leftParagraphs.map((para, idx) => (
                          <p
                            key={idx}
                            className={`text-justify hyphens-auto ${
                              bookSpread === 0 && idx === 0
                                ? "first-letter:float-left first-letter:text-5xl first-letter:font-bold first-letter:pr-3 first-letter:leading-none first-letter:text-[#0066cc]"
                                : "indent-6"
                            }`}
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Left Page Footer Folio */}
                    <div className={`pt-6 mt-6 flex items-center justify-between text-xs ${currentTheme.sub}`}>
                      <span className="inline-flex items-center gap-1 font-medium hover:text-[#0066cc]">
                        <ChevronLeft className="w-3.5 h-3.5" />
                        {bookSpread > 0 ? "Turn Back" : "Opening Page"}
                      </span>
                      <span className="font-mono text-[11px]">Page {leftPageIndex + 1}</span>
                    </div>
                  </div>

                  {/* RIGHT PAGE (Recto) */}
                  <div
                    onClick={goNextSpread}
                    className="relative flex flex-col justify-between min-h-[580px] sm:min-h-[660px] px-6 sm:px-10 md:px-14 py-8 sm:py-10 cursor-pointer select-text"
                    style={{
                      backgroundImage:
                        theme === "night"
                          ? "radial-gradient(circle at 100% 50%, rgba(255,255,255,0.015), transparent 70%)"
                          : "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 8%, rgba(0,0,0,0) 92%, rgba(0,0,0,0.03) 100%)",
                    }}
                  >
                    <div>
                      {/* Running Header (Right Page) */}
                      <div
                        className={`flex items-center justify-between text-[11px] uppercase tracking-[0.2em] pb-4 mb-6 border-b ${currentTheme.border} ${currentTheme.sub}`}
                      >
                        <span className="truncate max-w-[240px] font-semibold">{book.author}</span>
                        <span>{rightParagraphs.length > 0 ? rightPageIndex + 1 : ""}</span>
                      </div>

                      {/* Right Page Body Paragraphs */}
                      {rightParagraphs.length > 0 ? (
                        <div
                          style={{ fontSize: `${fontSize}px`, lineHeight }}
                          className={`space-y-4 ${fontFamily === "serif" ? "font-serif" : "font-sans"}`}
                        >
                          {rightParagraphs.map((para, idx) => (
                            <p key={idx} className="text-justify hyphens-auto indent-6">
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-16">
                          <BookOpen className={`w-10 h-10 mb-3 opacity-30 ${currentTheme.sub}`} />
                          <p className="text-sm font-semibold">End of Available Text</p>
                          <p className={`text-xs mt-1 max-w-xs ${currentTheme.sub}`}>
                            You have reached the final page of this edition in Book Read mode.
                          </p>
                          {book.externalReadUrl && (
                            <a
                              href={book.externalReadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] text-white text-xs font-semibold hover:bg-[#0071e3] transition"
                            >
                              View Source Edition <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Page Footer Folio */}
                    <div className={`pt-6 mt-6 flex items-center justify-between text-xs ${currentTheme.sub}`}>
                      <span className="font-mono text-[11px]">
                        {rightParagraphs.length > 0 ? `Page ${rightPageIndex + 1}` : "Finis"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium hover:text-[#0066cc]">
                        {bookSpread < totalSpreads - 1 ? "Turn Page" : "Last Spread"}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Book Spread Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-2">
            <button
              onClick={goPrevSpread}
              disabled={bookSpread <= 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition ${
                currentTheme.border
              } ${bookSpread <= 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-[#0066cc] hover:text-white hover:border-[#0066cc]"}`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous Pages
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-medium ${currentTheme.sub}`}>
                Pages <strong className={currentTheme.text}>{leftPageIndex + 1}</strong>
                {rightParagraphs.length > 0 ? `–${rightPageIndex + 1}` : ""} of{" "}
                <strong className={currentTheme.text}>{bookPages.length}</strong> ({progressPct}%)
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(0, totalSpreads - 1)}
                value={bookSpread}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setFlipDirection(next >= bookSpread ? 1 : -1)
                  setBookSpread(next)
                }}
                className="w-32 sm:w-44 accent-[#0066cc] cursor-pointer"
                title="Scrub through book pages"
              />
              {book.externalReadUrl && (
                <a
                  href={book.externalReadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border ${currentTheme.border} hover:opacity-80`}
                >
                  Source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={goNextSpread}
              disabled={bookSpread >= totalSpreads - 1}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0066cc] text-white hover:bg-[#0071e3] transition ${
                bookSpread >= totalSpreads - 1 ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              Turn Page <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: CLASSIC READ (Single-Column Scroll View) */}
      {viewMode === "classic" && (
        <article className="max-w-3xl mx-auto px-6 sm:px-10 py-10 sm:py-14">
          {page === 1 && (
            <header className={`mb-10 pb-8 border-b ${currentTheme.border}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-[#0066cc]">
                  {book.sourceLabel || "Project Gutenberg"} · Classic Read Mode
                </p>
                {book.externalReadUrl && (
                  <a
                    href={book.externalReadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066cc] hover:underline"
                  >
                    Original Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{book.title}</h1>
              <p className={`text-base ${currentTheme.sub}`}>By {book.author}</p>
              {bookmarked && (
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#0066cc]">
                  <Bookmark className="w-3.5 h-3.5 fill-current" /> Resumed from your saved bookmark
                </div>
              )}
            </header>
          )}

          <div
            style={{ fontSize: `${fontSize}px`, lineHeight }}
            className={`space-y-6 ${fontFamily === "serif" ? "font-serif" : "font-sans"}`}
          >
            {slice.map((p, idx) => (
              <p key={idx} className="leading-relaxed text-justify">
                {p}
              </p>
            ))}
          </div>

          <div
            className={`mt-14 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${currentTheme.border}`}
          >
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1))
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              disabled={page <= 1}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition ${
                currentTheme.border
              } ${page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"}`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous Page
            </button>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium ${currentTheme.sub}`}>
                Page <strong className={currentTheme.text}>{page}</strong> of{" "}
                <strong className={currentTheme.text}>{totalClassicPages}</strong> ({progressPct}%)
              </span>
              <input
                type="number"
                min={1}
                max={totalClassicPages}
                value={page}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (!Number.isNaN(val)) {
                    setPage(Math.min(totalClassicPages, Math.max(1, val)))
                  }
                }}
                className={`w-16 px-2.5 py-1 text-center text-xs rounded-full border bg-transparent ${currentTheme.border}`}
              />
            </div>

            <button
              onClick={() => {
                setPage((p) => Math.min(totalClassicPages, p + 1))
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              disabled={page >= totalClassicPages}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0066cc] text-white hover:bg-[#0071e3] transition ${
                page >= totalClassicPages ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              Next Page <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </article>
      )}

      {/* MODE 3: SCANNED ORIGINAL EMBED (Internet Archive / Google Books Interactive Reader) */}
      {viewMode === "scan" && book.embedUrl && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl overflow-hidden border border-black/15 shadow-2xl bg-black">
            <iframe
              src={book.embedUrl}
              title={book.title}
              className="w-full h-[76vh] border-0"
              allowFullScreen
            />
          </div>
          {book.externalReadUrl && (
            <div className="mt-4 flex justify-end">
              <a
                href={book.externalReadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066cc] hover:underline"
              >
                Open Fullscreen on {book.sourceLabel || "Archive"} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
