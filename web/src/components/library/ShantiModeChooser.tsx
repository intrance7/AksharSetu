"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Tablet, ArrowRight } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

type Props = {
  title: string
  author: string
  ebook: { title: string; author: string } | null
}

export function ShantiModeChooser({ title, author, ebook }: Props) {
  return (
    <div className="relative w-full max-w-3xl px-6 text-[#f5f5f7]">
      <Link href="/library" className="fixed top-8 left-8 flex items-center gap-2 text-[#86868b] hover:text-[#f5f5f7] transition-colors text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" /> Exit Shanti Mode
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="text-center mb-12">
        <p className="text-[#86868b] text-sm font-semibold tracking-[0.3em] uppercase mb-4">Shanti Mode</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none mb-3">How are you reading today?</h1>
        <p className="text-[#86868b] text-lg">
          {title} <span className="text-[#86868b]/60">· {author}</span>
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: EASE }}>
          <Link
            id="shanti-mode-physical"
            href="?mode=physical"
            className="group flex flex-col h-full rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 p-8 transition-all duration-500"
          >
            <BookOpen className="w-8 h-8 text-[#f5f5f7] mb-6" />
            <h2 className="text-2xl font-bold tracking-tight mb-2">I have the physical book</h2>
            <p className="text-[#86868b] mb-8 flex-1">Just a focus timer. Your book, your pace, no screen in the way.</p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5f5f7]">
              Start timer <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: EASE }}>
          {ebook ? (
            <Link
              id="shanti-mode-read"
              href="?mode=read"
              className="group flex flex-col h-full rounded-2xl bg-[#0066cc] hover:bg-[#0071e3] p-8 transition-all duration-500"
            >
              <Tablet className="w-8 h-8 text-white mb-6" />
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-white">Read it here</h2>
              <p className="text-white/75 mb-8 flex-1">
                Open <span className="text-white font-semibold">{ebook.title}</span> by {ebook.author} in our e-reader, with the focus timer alongside.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                Open e-reader <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ) : (
            <div id="shanti-mode-read-unavailable" className="flex flex-col h-full rounded-2xl bg-white/[0.03] border border-dashed border-white/10 p-8">
              <Tablet className="w-8 h-8 text-[#86868b] mb-6" />
              <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#86868b]">Read it here</h2>
              <p className="text-[#86868b]/80 mb-8 flex-1">
                This book isn&apos;t in our e-library yet. Only public-domain books can be read online.
              </p>
              <Link href="/ebooks" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066cc] hover:text-[#0071e3]">
                Browse the E-Library <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
