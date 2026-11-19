"use client"

import { useState } from "react"
import Link from "next/link"
import { EBookSummary, coverUrl } from "@/lib/gutenberg"

const HERO_GRADIENTS = [
  "from-[#8B3A2B] via-[#5E2318] to-[#2A0E09]",
  "from-[#1E3F5A] via-[#132A3E] to-[#091520]",
  "from-[#7A5220] via-[#4E3312] to-[#241606]",
]

function HeroBookCard({ book, index }: { book: EBookSummary; index: number }) {
  const [imgError, setImgError] = useState(false)
  const resolvedCover = book.coverImage || coverUrl(book.id)
  const gradient = HERO_GRADIENTS[index % HERO_GRADIENTS.length]

  return (
    <Link
      href={`/ebooks/${book.id}?view=book`}
      className={`group relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
        index === 1 ? "-mt-4 mb-4" : ""
      }`}
    >
      <div className="aspect-[2/3] bg-[#141416] relative overflow-hidden">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={(el) => {
              if (el && el.complete && el.naturalWidth === 0) {
                setImgError(true)
              }
            }}
            src={resolvedCover}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} p-3.5 flex flex-col justify-between text-white relative`}
          >
            <div className="absolute inset-y-0 left-0 w-2.5 bg-black/30" />
            <div className="pl-2 text-[11px] uppercase tracking-wider text-amber-200/85 font-bold">
              Classic Edition
            </div>
            <div className="pl-2 my-auto">
              <p className="font-serif text-base font-bold leading-snug line-clamp-3 drop-shadow">
                {book.title}
              </p>
              <div className="w-6 h-0.5 bg-amber-300/70 my-2" />
              <p className="text-xs text-white/85 line-clamp-2">
                {book.author}
              </p>
            </div>
            <div className="pl-2 text-[11px] text-white/60 uppercase tracking-wider font-semibold">
              AksharSetu
            </div>
          </div>
        )}
      </div>
      <div className="p-3 bg-[#1D1D1F]/95 backdrop-blur-md">
        <p className="text-xs sm:text-[13px] font-bold text-white truncate">{book.title}</p>
        <p className="text-xs text-white/60 truncate mt-0.5">{book.author}</p>
      </div>
    </Link>
  )
}

export function HeroFeaturedStack({ books }: { books: EBookSummary[] }) {
  return (
    <div className="relative w-full max-w-md">
      <div className="grid grid-cols-3 gap-3">
        {books.map((b, idx) => (
          <HeroBookCard key={String(b.id)} book={b} index={idx} />
        ))}
      </div>
    </div>
  )
}
