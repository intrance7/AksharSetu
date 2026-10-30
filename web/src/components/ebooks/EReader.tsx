"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Minus, Plus, Moon, Sun, BookOpen } from "lucide-react"

const CHARS_PER_PAGE = 2800
const EASE = [0.16, 1, 0.3, 1] as const

type ThemeMode = "paper" | "light" | "dark"

type Props = {
  id: number
  title: string
  author: string
  paragraphs: string[]
  /** Left side of the top bar (back link, etc.) */
  leading?: ReactNode
  /** Right side of the top bar (Shanti timer, CTA, etc.) */
  trailing?: ReactNode
  defaultDark?: boolean
}

const THEMES: Record<
  ThemeMode,
  {
    label: string
    bg: string
    bar: string
    text: string
    muted: string
    btn: string
    accent: string
  }
> = {
  paper: {
    label: "Paper",
    bg: "bg-[#F2EBE1]",
    bar: "bg-[#F2EBE1]/90 border-[#1D1D1F]/10",
    text: "text-[#1D1D1F]",
    muted: "text-[#1D1D1F]/60",
    btn: "bg-[#1D1D1F]/8 hover:bg-[#1D1D1F]/15 text-[#1D1D1F]",
    accent: "bg-[#C84200] hover:bg-[#A33500]",
  },
  light: {
    label: "Light",
    bg: "bg-[#ffffff]",
    bar: "bg-white/90 border-black/10",
    text: "text-[#1d1d1f]",
    muted: "text-[#86868b]",
    btn: "bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1d1d1f]",
    accent: "bg-[#C84200] hover:bg-[#A33500]",
  },
  dark: {
    label: "Night",
    bg: "bg-[#0f0f12]",
    bar: "bg-[#0f0f12]/90 border-white/10",
    text: "text-[#F2EBE1]/90",
    muted: "text-[#86868b]",
    btn: "bg-white/10 hover:bg-white/20 text-[#F2EBE1]",
    accent: "bg-[#C84200] hover:bg-[#A33500]",
  },
}

export function EReader({ id, title, author, paragraphs, leading, trailing, defaultDark = false }: Props) {
  const pages = useMemo(() => {
    const out: string[][] = [[]]
    let size = 0
    for (const p of paragraphs) {
      if (size > 0 && size + p.length > CHARS_PER_PAGE) {
        out.push([])
        size = 0
      }
      out[out.length - 1].push(p)
      size += p.length
    }
    return out
  }, [paragraphs])

  const progressKey = `ereader:progress:${id}`
  const [page, setPage] = useState(0)
  const [fontSize, setFontSize] = useState(19)
  const [serif, setSerif] = useState(true)
  const [theme, setTheme] = useState<ThemeMode>(defaultDark ? "dark" : "paper")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Restore progress + prefs
  useEffect(() => {
    const saved = Number(localStorage.getItem(progressKey))
    if (saved > 0 && saved < pages.length) setPage(saved)
    const fs = Number(localStorage.getItem("ereader:fontSize"))
    if (fs) setFontSize(fs)
    const savedFont = localStorage.getItem("ereader:serif")
    if (savedFont !== null) setSerif(savedFont === "1")
  }, [progressKey, pages.length])

  useEffect(() => {
    localStorage.setItem(progressKey, String(page))
    scrollRef.current?.scrollTo({ top: 0 })
  }, [page, progressKey])

  useEffect(() => {
    localStorage.setItem("ereader:fontSize", String(fontSize))
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem("ereader:serif", serif ? "1" : "0")
  }, [serif])

  const go = (delta: number) => setPage((p) => Math.min(pages.length - 1, Math.max(0, p + delta)))

  const cycleTheme = () => {
    setTheme((prev) => (prev === "paper" ? "dark" : prev === "dark" ? "light" : "paper"))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length])

  const progress = pages.length > 1 ? (page / (pages.length - 1)) * 100 : 100
  const t = THEMES[theme]

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${t.bg} transition-colors duration-500`}>
      {/* Top bar */}
      <header className={`h-14 shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 border-b backdrop-blur-md ${t.bar}`}>
        <div className="flex items-center gap-4 min-w-0">
          {leading}
          <p className={`hidden md:flex items-center gap-2 text-sm font-bold truncate ${t.text}`}>
            <BookOpen className="w-4 h-4 text-[#C84200] shrink-0" />
            <span className="truncate">{title}</span>
            <span className={`font-medium ${t.muted}`}>· {author}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Font Family Toggle */}
          <button
            type="button"
            onClick={() => setSerif((s) => !s)}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-colors hidden sm:inline-flex items-center ${t.btn}`}
            title="Switch between Serif and Sans font"
          >
            {serif ? "Serif" : "Sans"}
          </button>

          {/* Font Size Controls */}
          <button
            id="reader-font-down"
            aria-label="Smaller text"
            onClick={() => setFontSize((s) => Math.max(14, s - 1))}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t.btn}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            id="reader-font-up"
            aria-label="Larger text"
            onClick={() => setFontSize((s) => Math.min(28, s + 1))}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t.btn}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            id="reader-theme"
            aria-label="Toggle theme"
            onClick={cycleTheme}
            title={`Theme: ${t.label} (click to switch)`}
            className={`h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-colors ${t.btn}`}
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-[#F4B22B]" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{t.label}</span>
          </button>

          {trailing}
        </div>
      </header>

      {/* Page Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <motion.article
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className={`mx-auto max-w-2xl px-6 py-12 md:py-16 ${t.text}`}
          style={{
            fontSize,
            lineHeight: 1.8,
            fontFamily: serif ? 'Georgia, Cambria, "Times New Roman", Times, serif' : undefined,
          }}
        >
          {page === 0 && (
            <div className="mb-12 pb-8 border-b border-current/10" style={{ fontFamily: "system-ui, sans-serif" }}>
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#C84200] mb-3">
                Aksharसेतु E-Library Edition
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-3">{title}</h1>
              <p className={`text-lg font-semibold ${t.muted}`}>by {author}</p>
            </div>
          )}
          {pages[page].map((p, i) => (
            <p key={i} className="mb-5 text-pretty">
              {p}
            </p>
          ))}
        </motion.article>
      </div>

      {/* Bottom Bar */}
      <footer className={`shrink-0 border-t ${t.bar}`}>
        <div className="h-1 w-full bg-black/5">
          <div className="h-full bg-[#C84200] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="h-14 flex items-center justify-between gap-4 px-4 max-w-2xl mx-auto">
          <button
            id="reader-prev"
            onClick={() => go(-1)}
            disabled={page === 0}
            className={`rounded-full h-9 px-4 text-sm font-bold flex items-center gap-1 transition-colors disabled:opacity-30 ${t.btn}`}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <div className="flex items-center gap-3 flex-1 max-w-xs justify-center">
            <input
              type="range"
              min={0}
              max={Math.max(0, pages.length - 1)}
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              aria-label="Page scrubber"
              className="hidden sm:block w-28 accent-[#C84200] cursor-pointer"
            />
            <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${t.muted}`}>
              Page {page + 1} of {pages.length} · {Math.round(progress)}%
            </span>
          </div>

          <button
            id="reader-next"
            onClick={() => go(1)}
            disabled={page === pages.length - 1}
            className={`rounded-full h-9 px-4 text-sm font-bold flex items-center gap-1 text-white transition-colors disabled:opacity-30 ${t.accent}`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  )
}
