"use client"

import { useState } from "react"
import { LibraryBook } from "@prisma/client"
import {
  Plus,
  X,
  Loader2,
  Sparkles,
  BookOpen,
  Tablet,
  ScanBarcode,
  Search,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { IsbnCameraScanner } from "@/components/catalog/IsbnCameraScanner"
import { updateLibraryBookStatus } from "@/app/actions/library"
import { coverUrl } from "@/lib/gutenberg"
import { GeneratedCover } from "@/components/catalog/GeneratedCover"
import { toast } from "sonner"

type FilterTab = "ALL" | "READING" | "WANT_TO_READ" | "READ" | "EBOOKS"

const TABS: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "All Books" },
  { id: "READING", label: "Currently Reading" },
  { id: "WANT_TO_READ", label: "Want to Read" },
  { id: "READ", label: "Completed" },
  { id: "EBOOKS", label: "Digital E-Books" },
]

function isDigitalEbook(book: LibraryBook): boolean {
  return Boolean(
    book.gutenbergId !== null ||
      (book.platformBookId && /^(ia-|ol-|gb-|pg-|\d+)/.test(book.platformBookId))
  )
}

function getEbookRouteId(book: LibraryBook): string | null {
  if (book.gutenbergId !== null) return String(book.gutenbergId)
  if (
    book.platformBookId &&
    /^(ia-|ol-|gb-|pg-|\d+)/.test(book.platformBookId)
  ) {
    return book.platformBookId
  }
  return null
}

export function LibraryGrid({ initialBooks }: { initialBooks: LibraryBook[] }) {
  const router = useRouter()
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks)
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [isbn, setIsbn] = useState("")
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [previewCover, setPreviewCover] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [lookingUpIsbn, setLookingUpIsbn] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({})

  const filteredBooks = books.filter((book) => {
    if (activeTab === "ALL") return true
    if (activeTab === "EBOOKS") return isDigitalEbook(book)
    return book.status === activeTab
  })

  const lookupByIsbn = async (rawIsbn?: string) => {
    const clean = (rawIsbn ?? isbn).replace(/[^0-9Xx]/g, "").trim()
    if (!clean) {
      toast.error("Please enter or scan an ISBN first")
      return
    }
    setLookingUpIsbn(true)
    try {
      const gbRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(
          clean
        )}`
      )
      const gbData = await gbRes.json()
      if (gbData.items && gbData.items.length > 0) {
        const info = gbData.items[0].volumeInfo
        if (info.title) setTitle(info.title)
        if (Array.isArray(info.authors)) setAuthor(info.authors.join(", "))
        if (info.imageLinks) {
          const rawImg =
            info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || ""
          if (rawImg) {
            setPreviewCover(
              rawImg
                .replace("http://", "https://")
                .replace("&edge=curl", "")
            )
          }
        }
        toast.success(`Found "${info.title || clean}"!`)
        return
      }

      // Fallback Open Library ISBN lookup
      const olRes = await fetch(
        `https://openlibrary.org/search.json?isbn=${encodeURIComponent(
          clean
        )}&limit=1`
      )
      const olData = await olRes.json()
      if (olData.docs && olData.docs.length > 0) {
        const doc = olData.docs[0]
        if (doc.title) setTitle(doc.title)
        if (Array.isArray(doc.author_name)) {
          setAuthor(doc.author_name.join(", "))
        }
        setPreviewCover(
          doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`
        )
        toast.success(`Found "${doc.title || clean}"!`)
        return
      }

      toast.info(
        "ISBN scanned! Enter the title/author or click Add and AI will resolve it."
      )
    } catch {
      toast.error("Could not reach ISBN directory, you can still add manually.")
    } finally {
      setLookingUpIsbn(false)
    }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() && !isbn.trim()) {
      toast.error("Please enter a Book Title or scan an ISBN")
      return
    }
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isbn: isbn.trim() || undefined,
          title: title.trim(),
          author: author.trim(),
          coverImage: previewCover || undefined,
        }),
      })

      if (res.ok) {
        const newBook = await res.json()
        setBooks((prev) => [
          newBook,
          ...prev.filter((b) => b.id !== newBook.id),
        ])
        setIsModalOpen(false)
        setShowScanner(false)
        setIsbn("")
        setTitle("")
        setAuthor("")
        setPreviewCover(null)
        toast.success(
          `AI & Search added "${newBook.title}" (${newBook.totalPages} pages) with cover to your Library!`
        )
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Could not add book to library")
      }
    } catch (error) {
      console.error(error)
      toast.error("Network error while adding book")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickProgress = async (book: LibraryBook, delta: number) => {
    const total = Math.max(10, book.totalPages || 250)
    const nextPage = Math.min(
      total,
      Math.max(1, (book.currentPage || 1) + delta)
    )
    const nextStatus =
      nextPage >= total
        ? "READ"
        : book.status === "WANT_TO_READ"
        ? "READING"
        : book.status

    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id
          ? { ...b, currentPage: nextPage, status: nextStatus }
          : b
      )
    )

    try {
      await fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryBookId: book.id,
          currentPage: nextPage,
          totalPages: total,
        }),
      })
    } catch {}
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 border-b border-[#1D1D1F]/10 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#1D1D1F] text-[#F2EBE1] shadow-sm"
                  : "bg-white text-[#1d1d1f] hover:bg-[#FAF6F0] border border-[#1D1D1F]/[0.07]"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add Book Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="min-h-[380px] rounded-3xl border-2 border-dashed border-[#1D1D1F]/15 bg-white/55 flex flex-col items-center justify-center gap-4 hover:border-[#C84200] hover:bg-white transition-all group p-6 cursor-pointer"
        >
          <div className="w-15 h-15 rounded-full bg-[#FAF6F0] group-hover:bg-[#C84200] flex items-center justify-center transition-colors border border-black/5">
            <Plus className="w-7 h-7 text-[#1d1d1f] group-hover:text-white transition-colors" />
          </div>
          <div className="text-center">
            <span className="block font-black text-lg text-[#1d1d1f] group-hover:text-[#C84200] transition-colors">
              Add Physical Book
            </span>
            <span className="text-sm font-medium text-[#6e6e73] mt-1.5 block max-w-[210px] leading-snug">
              Scan ISBN or enter title · automatically fetches cover &amp; pages
            </span>
          </div>
        </button>

        {/* Books */}
        {filteredBooks.map((book) => {
          const ebookRouteId = getEbookRouteId(book)
          const digital = isDigitalEbook(book)
          const imgSrc =
            book.coverImage || (ebookRouteId ? coverUrl(ebookRouteId) : null)
          const showImg = imgSrc && !failedCovers[book.id]

          const current = book.currentPage || 1
          const total = Math.max(current, book.totalPages || 250)
          const pct =
            book.status === "READ"
              ? 100
              : Math.min(100, Math.round((current / total) * 100))

          return (
            <div
              key={book.id}
              className="group flex flex-col bg-white rounded-3xl p-5 shadow-sm border border-[#1D1D1F]/[0.07] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Top Row */}
              <div className="flex items-center justify-between gap-2 mb-3 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] text-[#1d1d1f] text-xs font-bold uppercase tracking-wider">
                  {digital ? (
                    <>
                      <Tablet className="w-3.5 h-3.5 text-[#0066cc]" /> E-Book
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-[#0A7D4F]" /> Physical
                    </>
                  )}
                </span>

                <select
                  className="bg-[#FAF6F0] hover:bg-[#EFE7DC] rounded-full px-3 py-1.5 text-xs sm:text-[13px] font-bold text-[#1d1d1f] outline-none cursor-pointer transition-colors"
                  value={book.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value
                    setBooks(
                      books.map((b) =>
                        b.id === book.id ? { ...b, status: newStatus } : b
                      )
                    )
                    await updateLibraryBookStatus(book.id, newStatus)
                  }}
                >
                  <option value="WANT_TO_READ">Want to Read</option>
                  <option value="READING">Reading</option>
                  <option value="READ">Completed</option>
                </select>
              </div>

              {/* 3D Book Cover */}
              <Link
                href={`/library/shanti/${book.id}`}
                className="relative grid place-items-center w-full aspect-[1/1.02] isolate mb-3"
              >
                <div className="absolute left-1/2 bottom-[4%] w-[62%] h-5 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(29,29,31,0.22),transparent)] z-0" />

                <div className="relative z-10 w-[56%] aspect-[5/7] rounded-r-md rounded-l-[3px] overflow-hidden shadow-[16px_16px_32px_rgba(0,0,0,0.16)] transform transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                  <GeneratedCover
                    title={book.title}
                    author={book.author}
                    category={digital ? "fiction" : "non-fiction"}
                  />
                  {showImg && (
                    <>
                      <div
                        className="absolute inset-y-0 left-0 w-[11%] z-20 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(0,0,0,.32), rgba(0,0,0,.06) 68%, rgba(255,255,255,.22) 88%, rgba(0,0,0,.1))",
                        }}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={(el) => {
                          if (el && el.complete && el.naturalWidth === 0) {
                            setFailedCovers((prev) =>
                              prev[book.id] ? prev : { ...prev, [book.id]: true }
                            )
                          }
                        }}
                        src={imgSrc}
                        alt={book.title}
                        onError={() =>
                          setFailedCovers((prev) => ({
                            ...prev,
                            [book.id]: true,
                          }))
                        }
                        className="absolute inset-0 w-full h-full object-cover z-10"
                      />
                    </>
                  )}
                </div>
              </Link>

              {/* Title, Author & Cloud Reading Progress */}
              <div className="flex flex-col flex-1 pt-1">
                <h3
                  title={book.title}
                  className="font-bold text-[#1d1d1f] text-base sm:text-lg leading-snug mb-1 line-clamp-2"
                >
                  {book.title}
                </h3>
                <p className="text-[#6e6e73] text-sm font-medium mb-3.5 line-clamp-1">
                  {book.author}
                </p>

                {/* Cloud Reading Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs sm:text-[13px] text-[#6e6e73] mb-1.5">
                    <span>
                      Page{" "}
                      <strong className="text-[#1d1d1f]">
                        {book.status === "READ" ? total : current}
                      </strong>{" "}
                      / {total}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#C84200]">
                        {pct}%
                      </span>
                      {!digital && book.status !== "READ" && (
                        <button
                          type="button"
                          onClick={() => handleQuickProgress(book, 10)}
                          className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] hover:bg-[#C84200] hover:text-white text-xs font-bold text-[#1d1d1f] transition cursor-pointer"
                          title="Log +10 pages read"
                        >
                          +10p
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#EFE7DC] overflow-hidden">
                    <div
                      className="h-full bg-[#C84200] transition-all duration-300 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-3.5 border-t border-[#1D1D1F]/[0.06] flex items-center justify-between gap-2">
                  <Link
                    href={`/library/shanti/${book.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1d1d1f] hover:bg-[#C84200] text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#F4B22B]" />
                    Shanti
                  </Link>

                  {ebookRouteId && (
                    <Link
                      href={`/ebooks/${encodeURIComponent(
                        ebookRouteId
                      )}?view=book`}
                      className="inline-flex items-center gap-1.5 bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1d1d1f] text-sm font-bold px-4 py-2.5 rounded-full transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-[#C84200]" />
                      Book Read
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Book Modal with ISBN Scanner + AI Auto-Cover & Page Resolution */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowScanner(false)
                setIsModalOpen(false)
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-7 sm:p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => {
                  setShowScanner(false)
                  setIsModalOpen(false)
                }}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#FAF6F0] flex items-center justify-center hover:bg-[#EFE7DC] transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5 text-[#1d1d1f]" />
              </button>

              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#C84200] mb-1.5">
                <Sparkles className="w-4 h-4" /> Shelf Builder · ISBN Scanner
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1d1d1f] tracking-tight mb-2">
                Add to Library
              </h2>
              <p className="text-[#6e6e73] text-sm leading-relaxed mb-6">
                Scan the ISBN barcode or enter the title and author—we automatically fetch the edition cover and page count.
              </p>

              {/* Camera Barcode Scanner Viewport */}
              {showScanner && (
                <div className="mb-5">
                  <IsbnCameraScanner
                    onScan={(cleanIsbn) => {
                      setShowScanner(false)
                      setIsbn(cleanIsbn)
                      lookupByIsbn(cleanIsbn)
                    }}
                    onClose={() => setShowScanner(false)}
                  />
                </div>
              )}

              <form onSubmit={handleAddBook} className="flex flex-col gap-4">
                {/* 1. ISBN + Barcode Scanner */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#1d1d1f]">
                      ISBN Number
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowScanner((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#C84200] hover:underline cursor-pointer"
                    >
                      <ScanBarcode className="w-4 h-4" />
                      {showScanner ? "Hide Scanner" : "Scan Barcode"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="flex-1 bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200] focus:bg-white text-[#1d1d1f] rounded-2xl px-4 py-3 text-sm sm:text-base font-mono outline-none transition-all"
                      placeholder="e.g. 9780143442295"
                    />
                    <button
                      type="button"
                      disabled={lookingUpIsbn || !isbn.trim()}
                      onClick={() => lookupByIsbn()}
                      className="px-4 rounded-2xl bg-[#1d1d1f] hover:bg-[#C84200] disabled:opacity-40 text-white text-sm font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      title="Auto-fill book details from ISBN"
                    >
                      {lookingUpIsbn ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Fetch
                    </button>
                  </div>
                </div>

                {/* 2. Book Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#1d1d1f]">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200] focus:bg-white text-[#1d1d1f] rounded-2xl px-4 py-3 text-sm sm:text-base outline-none transition-all"
                    placeholder="e.g. Gitanjali or Atomic Habits"
                  />
                </div>

                {/* 3. Author Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#1d1d1f]">
                    Author Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200] focus:bg-white text-[#1d1d1f] rounded-2xl px-4 py-3 text-sm sm:text-base outline-none transition-all"
                    placeholder="e.g. Rabindranath Tagore"
                  />
                </div>

                {/* Live Cover Preview if fetched via ISBN */}
                {previewCover && (
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF6F0] border border-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewCover}
                      alt="Cover preview"
                      className="w-12 h-17 object-cover rounded-lg shadow-xs shrink-0"
                    />
                    <div className="min-w-0 text-sm">
                      <p className="font-bold text-[#1d1d1f] truncate">
                        {title || "Cover Detected"}
                      </p>
                      <p className="text-xs sm:text-[13px] text-[#6e6e73] truncate">
                        {author || "Official edition cover matched"}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full py-3.5 font-bold text-base transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      Searching Cover & Adding Book...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5" />
                      Add to My Library
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
