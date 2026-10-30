"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Minus, Plus, Moon, Sun } from "lucide-react"

const CHARS_PER_PAGE = 2800
const EASE = [0.16, 1, 0.3, 1] as const

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
  const [dark, setDark] = useState(defaultDark)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Restore progress + prefs
  useEffect(() => {
    const saved = Number(localStorage.getItem(progressKey))
    if (saved > 0 && saved < pages.length) setPage(saved)
    const fs = Number(localStorage.getItem("ereader:fontSize"))
    if (fs) setFontSize(fs)
  }, [progressKey, pages.length])

  useEffect(() => {
    localStorage.setItem(progressKey, String(page))
    scrollRef.current?.scrollTo({ top: 0 })
  }, [page, progressKey])

  useEffect(() => {
    localStorage.setItem("ereader:fontSize", String(fontSize))
  }, [fontSize])

  const go = (delta: number) => setPage((p) => Math.min(pages.length - 1, Math.max(0, p + delta)))

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
  const t = dark
    ? { bg: "bg-[#000000]", bar: "bg-[rgba(0,0,0,0.8)] border-white/10", text: "text-[#f5f5f7]/85", muted: "text-[#86868b]", btn: "bg-white/10 hover:bg-white/20 text-[#f5f5f7]" }
    : { bg: "bg-[#ffffff]", bar: "bg-[rgba(255,255,255,0.8)] border-black/5", text: "text-[#1d1d1f]", muted: "text-[#86868b]", btn: "bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1d1d1f]" }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${t.bg} transition-colors duration-500`}>
      {/* Top bar */}
      <header className={`h-12 shrink-0 flex items-center justify-between gap-4 px-4 border-b backdrop-blur-md ${t.bar}`}>
        <div className="flex items-center gap-4 min-w-0">
          {leading}
          <p className={`hidden md:block text-sm font-semibold truncate ${t.text}`}>
            {title} <span className={t.muted}>· {author}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button id="reader-font-down" aria-label="Smaller text" onClick={() => setFontSize((s) => Math.max(14, s - 1))} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t.btn}`}>
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button id="reader-font-up" aria-label="Larger text" onClick={() => setFontSize((s) => Math.min(28, s + 1))} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t.btn}`}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button id="reader-theme" aria-label="Toggle theme" onClick={() => setDark((d) => !d)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${t.btn}`}>
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {trailing}
        </div>
      </header>

      {/* Page */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <motion.article
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className={`mx-auto max-w-2xl px-6 py-12 md:py-16 ${t.text}`}
          style={{ fontSize, lineHeight: 1.75 }}
        >
          {page === 0 && (
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none mb-3">{title}</h1>
              <p className={`text-lg ${t.muted}`}>{author}</p>
            </div>
          )}
          {pages[page].map((p, i) => (
            <p key={i} className="mb-5">{p}</p>
          ))}
        </motion.article>
      </div>

      {/* Bottom bar */}
      <footer className={`shrink-0 border-t ${t.bar}`}>
        <div className="h-0.5 w-full bg-transparent">
          <div className="h-full bg-[#0066cc] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="h-14 flex items-center justify-between px-4 max-w-2xl mx-auto">
          <button id="reader-prev" onClick={() => go(-1)} disabled={page === 0} className={`rounded-full h-9 px-4 text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-30 ${t.btn}`}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className={`text-xs font-medium tabular-nums ${t.muted}`}>
            Page {page + 1} of {pages.length} · {Math.round(progress)}%
          </span>
          <button id="reader-next" onClick={() => go(1)} disabled={page === pages.length - 1} className="rounded-full h-9 px-4 text-sm font-medium flex items-center gap-1 bg-[#0066cc] hover:bg-[#0071e3] text-white transition-colors disabled:opacity-30">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  )
}
