"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bookmark, Check, Sparkles, BookOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { coverUrl, type EBookSummary } from "@/lib/gutenberg"
import { GeneratedCover } from "@/components/catalog/GeneratedCover"

const CATEGORIES = ["fiction", "non-fiction", "engineering", "medical"] as const

export function EbookGrid({ books }: { books: EBookSummary[] }) {
  const router = useRouter()
  const [savedIds, setSavedIds] = useState<Record<number, boolean>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [failedCovers, setFailedCovers] = useState<Record<number, boolean>>({})

  const handleSaveToLibrary = async (e: React.MouseEvent, book: EBookSummary) => {
    e.preventDefault()
    e.stopPropagation()
    if (savedIds[book.id] || savingId === book.id) return

    setSavingId(book.id)
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          gutenbergId: book.id,
          coverImage: coverUrl(book.id),
        }),
      })
      if (res.status === 401) {
        router.push("/login?callbackUrl=/ebooks")
        return
      }
      if (res.ok) {
        setSavedIds((prev) => ({ ...prev, [book.id]: true }))
        toast.success(`Saved "${book.title}" to My Library`)
      } else {
        toast.error("Could not save to library")
      }
    } catch {
      toast.error("Could not save to library")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {books.map((book, i) => {
        const cat = CATEGORIES[book.id % CATEGORIES.length]
        const isSaved = !!savedIds[book.id]
        const isSaving = savingId === book.id

        return (
          <motion.article
            key={book.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col min-w-0 group relative h-full bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.07)] border border-[#1D1D1F]/5 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgb(0,0,0,0.12)]"
          >
            {/* Top Row: Badge + Save to Library */}
            <div className="flex justify-between items-center z-30 mb-3 relative">
              <span className="inline-flex items-center gap-1.5 bg-[#F2EBE1] text-[#1D1D1F] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#287F56]" />
                Free Classic
              </span>

              <button
                type="button"
                onClick={(e) => handleSaveToLibrary(e, book)}
                title={isSaved ? "Saved in My Library" : "Save to My Library"}
                aria-label="Save to My Library"
                className={`grid place-items-center w-9 h-9 rounded-full shadow-sm transition-all cursor-pointer z-40 ${
                  isSaved
                    ? "bg-[#287F56] text-white"
                    : "bg-[#F2EBE1] text-[#1D1D1F] hover:bg-[#C84200] hover:text-white"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSaved ? (
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <Bookmark className="w-4 h-4" strokeWidth={2.2} />
                )}
              </button>
            </div>

            {/* 3D Book Tile */}
            <Link
              id={`ebook-${book.id}`}
              href={`/ebooks/${book.id}`}
              className="relative grid place-items-center w-full aspect-[1/1.05] isolate mb-3 outline-none"
            >
              {/* Floor Shadow */}
              <div className="absolute left-1/2 bottom-[4%] w-[62%] h-5 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(29,29,31,0.26),transparent)] z-0" />

              {/* Book Cover with Spine Lighting */}
              <div className="relative z-10 w-[58%] aspect-[5/7] rounded-r-md rounded-l-[3px] overflow-hidden shadow-[18px_18px_36px_rgba(0,0,0,0.16),_4px_4px_12px_rgba(0,0,0,0.08)] transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-[1.04]">
                <GeneratedCover title={book.title} author={book.author} category={cat} />

                {!failedCovers[book.id] && (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 w-[11%] z-20 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(0,0,0,.32), rgba(0,0,0,.06) 68%, rgba(255,255,255,.22) 88%, rgba(0,0,0,.1))",
                      }}
                    />
                    <div
                      className="absolute inset-0 z-20 pointer-events-none"
                      style={{ background: "linear-gradient(115deg, rgba(255,255,255,.2), transparent 38%)" }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrl(book.id)}
                      alt={book.title}
                      loading="lazy"
                      onError={() => setFailedCovers((prev) => ({ ...prev, [book.id]: true }))}
                      className="absolute inset-0 w-full h-full object-cover z-10"
                    />
                  </>
                )}
              </div>
            </Link>

            {/* Metadata */}
            <div className="flex flex-col flex-1 pt-2 relative z-20">
              <h3
                title={book.title}
                className="font-black text-[1.2rem] leading-[1.15] tracking-[-0.02em] text-[#1D1D1F] line-clamp-2 mb-1"
              >
                <Link
                  href={`/ebooks/${book.id}`}
                  className="hover:text-[#C84200] transition-colors"
                >
                  {book.title}
                </Link>
              </h3>
              <p className="text-[#86868B] text-sm font-semibold mb-4 line-clamp-1">
                {book.author}
              </p>

              {/* Actions Footer */}
              <div className="mt-auto pt-3 border-t border-[#1D1D1F]/5 flex items-center justify-between gap-2">
                <Link
                  href={`/ebooks/${book.id}`}
                  className="inline-flex items-center gap-1.5 bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-full transition-colors shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Read Now
                </Link>

                <Link
                  href={`/ebooks/${book.id}?shanti=1`}
                  className="inline-flex items-center gap-1 bg-[#F2EBE1] hover:bg-[#F4B22B] text-[#1D1D1F] text-xs font-bold px-3.5 py-2.5 rounded-full transition-colors"
                  title="Read with Shanti Focus Timer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C84200]" />
                  Shanti
                </Link>
              </div>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
