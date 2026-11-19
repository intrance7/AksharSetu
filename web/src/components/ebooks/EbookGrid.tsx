"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, ScrollText, Bookmark } from "lucide-react"
import { EBookSummary, coverUrl } from "@/lib/gutenberg"
import StartShantiButton from "./StartShantiButton"

const FALLBACK_COLORS = [
  "from-[#8B3A2B] to-[#4A1C14]",
  "from-[#1E3F5A] to-[#0D2133]",
  "from-[#2E5A44] to-[#152E22]",
  "from-[#5B3A6E] to-[#2B1936]",
  "from-[#7A5220] to-[#3B260C]",
  "from-[#2C3E50] to-[#1A252F]",
]

const SOURCE_BADGE_STYLES: Record<string, string> = {
  gutenberg: "bg-amber-600/95 text-white",
  archive: "bg-emerald-700/95 text-white",
  openlibrary: "bg-[#0066cc]/95 text-white",
  google: "bg-[#C84200]/95 text-white",
}

function hashNumber(id: string | number): number {
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

function EbookCard({ book }: { book: EBookSummary }) {
  const [imgError, setImgError] = useState(false)
  const [savedPage, setSavedPage] = useState<number | null>(null)
  const [savedSpread, setSavedSpread] = useState<number | null>(null)

  useEffect(() => {
    try {
      const p = localStorage.getItem(`ereader:${book.id}:page`)
      if (p) {
        const num = Number(p)
        if (!Number.isNaN(num) && num > 1) setSavedPage(num)
      }
      const s = localStorage.getItem(`ereader:${book.id}:spread`)
      if (s) {
        const num = Number(s)
        if (!Number.isNaN(num) && num > 0) setSavedSpread(num + 1)
      }
    } catch {}
  }, [book.id])

  const gradient = FALLBACK_COLORS[hashNumber(book.id) % FALLBACK_COLORS.length]
  const resolvedCover = book.coverImage || coverUrl(book.id)
  const badgeStyle = SOURCE_BADGE_STYLES[book.source || "gutenberg"] || SOURCE_BADGE_STYLES.gutenberg

  return (
    <div className="group bg-white rounded-3xl border border-[#1D1D1F]/[0.07] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Book Cover */}
      <Link
        href={`/ebooks/${encodeURIComponent(String(book.id))}?view=book`}
        className="relative aspect-[2/3] w-full bg-[#1a1a1d] overflow-hidden block"
      >
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
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} p-5 flex flex-col justify-between text-white relative`}
          >
            <div className="absolute inset-y-0 left-0 w-3 bg-black/25" />
            <div className="pl-2 flex items-center justify-between text-xs uppercase tracking-wider text-white/75 font-semibold">
              <span className="truncate">{book.sourceLabel || "Digital Edition"}</span>
              {book.year && <span className="shrink-0 ml-1">{book.year}</span>}
            </div>
            <div className="pl-2 my-auto">
              <p className="font-serif text-lg sm:text-xl font-bold leading-snug line-clamp-4 drop-shadow">
                {book.title}
              </p>
              <div className="w-8 h-0.5 bg-amber-300/70 my-3" />
              <p className="text-sm text-white/85 line-clamp-2">{book.author}</p>
            </div>
            <div className="pl-2 text-xs text-white/60 uppercase tracking-wider font-semibold">
              AksharSetu E-Library
            </div>
          </div>
        )}

        {/* Source Badge */}
        <div
          className={`absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-1 rounded-full shadow backdrop-blur-sm max-w-[85%] truncate ${badgeStyle}`}
        >
          {book.sourceLabel || "Project Gutenberg"}
        </div>

        {/* Resume Bookmark Badge */}
        {(savedSpread || savedPage) && (
          <div className="absolute top-2.5 left-2.5 bg-[#0066cc] text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Bookmark className="w-3 h-3 fill-current" />
            {savedSpread ? `Spread ${savedSpread}` : `Page ${savedPage}`}
          </div>
        )}

        {/* Hover Quick-Read Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-[#C84200] px-4 py-2 rounded-full shadow">
            <BookOpen className="w-4 h-4" />
            {savedSpread || savedPage ? "Continue Reading" : "Open Book Reader"}
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/ebooks/${encodeURIComponent(String(book.id))}?view=book`}>
            <h3 className="font-bold text-base text-[#1d1d1f] line-clamp-2 leading-snug group-hover:text-[#C84200] transition-colors">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs sm:text-[13px] font-medium text-[#6e6e73] mt-1 line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Action Buttons: Book Read, Classic Read, Shanti */}
        <div className="mt-4 pt-3.5 border-t border-[#1D1D1F]/[0.06] flex flex-col gap-2">
          <Link
            href={`/ebooks/${encodeURIComponent(String(book.id))}?view=book`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-xs sm:text-[13px] font-bold bg-[#1d1d1f] text-white hover:bg-[#C84200] transition"
            title="Read as a realistic open 2-page hardcover book"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            Book Read
          </Link>
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href={`/ebooks/${encodeURIComponent(String(book.id))}?view=classic`}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-full text-xs font-bold bg-[#FAF6F0] text-[#1d1d1f] hover:bg-[#EFE7DC] border border-black/6 transition"
              title="Read in classic single-column mode"
            >
              <ScrollText className="w-3.5 h-3.5 shrink-0" />
              Classic
            </Link>
            <StartShantiButton
              gutenbergId={book.id}
              title={book.title}
              author={book.author}
              coverImage={resolvedCover}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EbookGrid({ books }: { books: EBookSummary[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {books.map((b) => (
        <EbookCard key={String(b.id)} book={b} />
      ))}
    </div>
  )
}
