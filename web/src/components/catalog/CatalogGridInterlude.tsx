"use client"

import Link from "next/link"

const SPINES = [
  { h: 46, c: "#3B4CCA" },
  { h: 66, c: "#0B8577" },
  { h: 82, c: "#C93A64" },
  { h: 94, c: "#1D1B26" },
  { h: 100, c: "#C4420C" },
  { h: 94, c: "#3B4CCA" },
  { h: 82, c: "#0B8577" },
  { h: 66, c: "#C93A64" },
  { h: 46, c: "#1D1B26" },
]

export function CatalogGridInterlude() {
  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-6 md:gap-11 bg-[#F4B22B] text-[#1D1B26] rounded-[28px] px-6 md:px-10 overflow-hidden my-4 shadow-sm">
      
      {/* Decorative Book Spines */}
      <div className="hidden md:flex self-end items-end gap-1.5 h-[150px]" aria-hidden="true">
        {SPINES.map((s, i) => (
          <div 
            key={i} 
            className="relative flex-none w-[clamp(15px,2.1vw,24px)] rounded-t-md"
            style={{ height: `${s.h}%`, backgroundColor: s.c }}
          >
            {/* Top highlight */}
            <div className="absolute left-0 right-0 top-[12%] h-1 bg-white/45" />
            {/* Title box border */}
            <div className="absolute left-[24%] right-[24%] top-[26%] h-[18%] border-[1.5px] border-white/40 rounded-[2px]" />
          </div>
        ))}
        {/* The leaning book */}
        <div 
          className="relative flex-none w-[clamp(15px,2.1vw,24px)] rounded-t-md origin-bottom-left rotate-[13deg] ml-3"
          style={{ height: "62%", backgroundColor: "#C4420C" }}
        >
          <div className="absolute left-0 right-0 top-[12%] h-1 bg-white/45" />
          <div className="absolute left-[24%] right-[24%] top-[26%] h-[18%] border-[1.5px] border-white/40 rounded-[2px]" />
        </div>
      </div>

      {/* Copy */}
      <div className="py-8 text-center md:text-left">
        <h3 className="font-black text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.05] tracking-[-0.025em] mb-2 text-balance">
          Finished a book? Send it across.
        </h3>
        <p className="max-w-[46ch] text-[#3A3320] font-medium mx-auto md:mx-0">
          Give it away or set your own price. Readers looking for it will find it here.
        </p>
      </div>

      {/* CTA Button */}
      <div className="pb-8 md:pb-0 text-center md:text-right">
        <Link 
          href="/catalog" 
          className="inline-flex items-center justify-center bg-[#1D1B26] text-[#FBF6E8] hover:bg-black font-bold px-6 py-3.5 rounded-full transition-colors shadow-lg"
        >
          List a book
        </Link>
      </div>

    </div>
  )
}
