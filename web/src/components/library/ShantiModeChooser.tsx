"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Tablet, ArrowRight, Sparkles } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

type Props = {
  title: string
  author: string
  ebook: { title: string; author: string } | null
}

export function ShantiModeChooser({ title, author, ebook }: Props) {
  return (
    <div className="relative z-10 w-full max-w-3xl px-4 sm:px-6 text-[#F2EBE1]">
      <div className="mb-8 flex justify-start">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#F2EBE1]/85 hover:text-[#F2EBE1] transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Shanti Mode
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C84200]/20 border border-[#FF7F45]/30 text-[#FF7F45] text-xs sm:text-[13px] font-black uppercase tracking-[0.22em] mb-5">
          <Sparkles className="w-4 h-4 text-[#F4B22B]" /> Shanti Mode
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none mb-4 text-white">
          How are you{" "}
          <span className="font-serif italic font-medium text-[#FF7F45]">
            reading today?
          </span>
        </h1>
        <p className="text-[#F2EBE1]/80 text-lg sm:text-xl font-medium">
          {title} <span className="text-[#F2EBE1]/50">· {author}</span>
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
        >
          <Link
            id="shanti-mode-physical"
            href="?mode=physical"
            className="group flex flex-col h-full rounded-3xl bg-white/[0.06] border border-white/12 hover:bg-white/[0.11] hover:border-[#F4B22B]/40 p-8 transition-all duration-500"
          >
            <div className="w-13 h-13 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-[#F4B22B]" />
            </div>
            <h2 className="text-2xl sm:text-[26px] font-black tracking-tight mb-2.5 text-white">
              I have the physical book
            </h2>
            <p className="text-base text-[#F2EBE1]/70 mb-8 flex-1 font-medium leading-relaxed">
              Just a deep-focus Pomodoro timer. Your book, your pace, no screen in the way.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#F4B22B]">
              Start timer <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        >
          {ebook ? (
            <Link
              id="shanti-mode-read"
              href="?mode=read"
              className="group flex flex-col h-full rounded-3xl bg-[#C84200] hover:bg-[#A33500] p-8 transition-all duration-500 shadow-xl"
            >
              <div className="w-13 h-13 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                <Tablet className="w-6 h-6 text-[#F4B22B]" />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-black tracking-tight mb-2.5 text-white">
                Read it here
              </h2>
              <p className="text-base text-white/85 mb-8 flex-1 font-medium leading-relaxed">
                Open <span className="text-white font-bold">{ebook.title}</span> by {ebook.author} in our e-reader, with the focus timer alongside.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                Open e-reader <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ) : (
            <div
              id="shanti-mode-read-unavailable"
              className="flex flex-col h-full rounded-3xl bg-white/[0.03] border border-dashed border-white/15 p-8"
            >
              <div className="w-13 h-13 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                <Tablet className="w-6 h-6 text-white/45" />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-black tracking-tight mb-2.5 text-[#F2EBE1]/55">
                Read it here
              </h2>
              <p className="text-base text-[#F2EBE1]/50 mb-8 flex-1 font-medium leading-relaxed">
                This book isn&apos;t in our digital library yet. Only public-domain classics can be read online.
              </p>
              <Link
                href="/ebooks"
                className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#FF7F45] hover:text-[#F4B22B]"
              >
                Browse the E-Library <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
