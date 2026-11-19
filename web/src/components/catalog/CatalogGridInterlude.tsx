"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const SPINES = [
  { h: 46, c: "#3B4CCA" },
  { h: 66, c: "#0A7D4F" },
  { h: 82, c: "#C93A64" },
  { h: 94, c: "#27272A" },
  { h: 100, c: "#C84200" },
  { h: 94, c: "#3B4CCA" },
  { h: 82, c: "#0A7D4F" },
  { h: 66, c: "#C93A64" },
  { h: 46, c: "#27272A" },
]

export function CatalogGridInterlude() {
  return (
    <div className="col-span-full relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-6 md:gap-10 bg-[#0B0B0D] text-[#F5F5F7] rounded-3xl px-6 sm:px-8 md:px-10 overflow-hidden my-4 shadow-[0_12px_36px_-12px_rgba(11,11,13,0.35)] border border-white/10">
      {/* Subtle Obsidian Dot-Grid & Saffron Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #FF7F45 0%, #C84200 45%, transparent 72%)",
        }}
      />

      {/* Decorative Book Spines */}
      <div
        className="hidden md:flex relative z-10 self-end items-end gap-1.5 h-[146px]"
        aria-hidden="true"
      >
        {SPINES.map((s, i) => (
          <div
            key={i}
            className="relative flex-none w-[clamp(15px,2vw,22px)] rounded-t-md border-t border-white/15"
            style={{ height: `${s.h}%`, backgroundColor: s.c }}
          >
            <div className="absolute left-0 right-0 top-[12%] h-1 bg-white/40" />
            <div className="absolute left-[24%] right-[24%] top-[26%] h-[18%] border-[1.5px] border-white/35 rounded-[2px]" />
          </div>
        ))}
        {/* The leaning book */}
        <div
          className="relative flex-none w-[clamp(15px,2vw,22px)] rounded-t-md origin-bottom-left rotate-[12deg] ml-2.5 border-t border-white/15"
          style={{ height: "62%", backgroundColor: "#FF7F45" }}
        >
          <div className="absolute left-0 right-0 top-[12%] h-1 bg-white/45" />
          <div className="absolute left-[24%] right-[24%] top-[26%] h-[18%] border-[1.5px] border-white/40 rounded-[2px]" />
        </div>
      </div>

      {/* Editorial Copy */}
      <div className="relative z-10 py-8 text-center md:text-left">
        <span className="inline-block font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#FF7F45] mb-2">
          PASS IT FORWARD
        </span>
        <h3 className="font-black text-[clamp(1.6rem,2.8vw,2.25rem)] leading-[1.08] tracking-tight mb-2 text-balance text-[#F5F5F7]">
          Finished a book?{" "}
          <span className="font-serif italic font-normal text-[#FF7F45]">
            Pass it across.
          </span>
        </h3>
        <p className="max-w-[46ch] text-[#F2EBE1]/75 text-sm sm:text-[15px] leading-relaxed font-medium mx-auto md:mx-0">
          Set a fair campus price, swap 1-for-1 with another reader, or pledge
          it via Vidya Daan.
        </p>
      </div>

      {/* CTA Button */}
      <div className="relative z-10 pb-8 md:pb-0 text-center md:text-right">
        <Link
          href="/catalog/new"
          className="inline-flex items-center justify-center gap-2 bg-[#C84200] hover:bg-[#FF7F45] hover:text-[#0B0B0D] text-white font-bold text-sm px-6 py-3.5 rounded-full transition-colors shadow-lg whitespace-nowrap"
        >
          List a Book <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
