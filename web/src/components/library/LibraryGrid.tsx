"use client"

import { useState } from "react"
import { LibraryBook } from "@prisma/client"
import { Plus, X, Loader2, Sparkles, BookOpen, Tablet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  if (book.platformBookId && /^(ia-|ol-|gb-|pg-|\d+)/.test(book.platformBookId)) {
    return book.platformBookId
  }
  return null
}

export function LibraryGrid({ initialBooks }: { initialBooks: LibraryBook[] }) {
  const router = useRouter()
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks)
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [totalPagesInput, setTotalPagesInput] = useState("250")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({})

  const filteredBooks = books.filter((book) => {
    if (activeTab === "ALL") return true
    if (activeTab === "EBOOKS") return isDigitalEbook(book)
    return book.status === activeTab
  })

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          totalPages: Number(totalPagesInput) || 250,
        }),
      })

      if (res.ok) {
        const newBook = await res.json()
        setBooks([newBook, ...books])
        setIsModalOpen(false)
        setTitle("")
        setAuthor("")
        setTotalPagesInput("250")
        toast.success(`Added "${newBook.title}" to your Reading Room`)
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickProgress = async (book: LibraryBook, delta: number) => {
    const total = Math.max(10, book.totalPages || 250)
    const nextPage = Math.min(total, Math.max(1, (book.currentPage || 1) + delta))
    const nextStatus = nextPage >= total ? "READ" : book.status === "WANT_TO_READ" ? "READING" : book.status

    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id ? { ...b, currentPage: nextPage, status: nextStatus } : b
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
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-black/10 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0066cc] text-white shadow-sm"
                  : "bg-white text-[#1d1d1f] hover:bg-[#e8e8ed] border border-black/5"
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
          className="min-h-[380px] rounded-2xl border-2 border-dashed border-black/15 bg-white/50 flex flex-col items-center justify-center gap-4 hover:border-[#0066cc] hover:bg-white transition-all group p-6 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-[#e8e8ed] group-hover:bg-[#0066cc] flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-[#1d1d1f] group-hover:text-white transition-colors" />
          </div>
          <div className="text-center">
            <span className="block font-bold text-base text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">
              Add Physical Book
            </span>
            <span className="text-xs font-medium text-[#86868b] mt-1 block">
              Track page progress & Shanti focus
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
          const pct = book.status === "READ" ? 100 : Math.min(100, Math.round((current / total) * 100))

          return (
            <div
              key={book.id}
              className="group flex flex-col bg-white rounded-2xl p-5 shadow-sm border border-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Top Row */}
              <div className="flex items-center justify-between gap-2 mb-3 z-20">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-[10px] font-bold uppercase tracking-wider">
                  {digital ? (
                    <>
                      <Tablet className="w-3 h-3 text-[#0066cc]" /> E-Book
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3 h-3 text-emerald-600" /> Physical
                    </>
                  )}
                </span>

                <select
                  className="bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full px-3 py-1 text-[11px] font-semibold text-[#1d1d1f] outline-none cursor-pointer transition-colors"
                  value={book.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value
                    setBooks(books.map((b) => (b.id === book.id ? { ...b, status: newStatus } : b)))
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
                        src={imgSrc}
                        alt={book.title}
                        onError={() =>
                          setFailedCovers((prev) => ({ ...prev, [book.id]: true }))
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
                  className="font-bold text-[#1d1d1f] text-base leading-snug mb-0.5 line-clamp-2"
                >
                  {book.title}
                </h3>
                <p className="text-[#86868b] text-xs font-medium mb-3 line-clamp-1">
                  {book.author}
                </p>

                {/* Cloud Reading Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] text-[#86868b] mb-1">
                    <span>
                      Page <strong className="text-[#1d1d1f]">{book.status === "READ" ? total : current}</strong> / {total}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#0066cc]">{pct}%</span>
                      {!digital && book.status !== "READ" && (
                        <button
                          type="button"
                          onClick={() => handleQuickProgress(book, 10)}
                          className="px-2 py-0.5 rounded-full bg-[#f5f5f7] hover:bg-[#0066cc] hover:text-white text-[10px] font-bold text-[#1d1d1f] transition cursor-pointer"
                          title="Log +10 pages read"
                        >
                          +10p
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#f5f5f7] overflow-hidden">
                    <div
                      className="h-full bg-[#0066cc] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                  <Link
                    href={`/library/shanti/${book.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1d1d1f] hover:bg-[#0066cc] text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Shanti
                  </Link>

                  {ebookRouteId && (
                    <Link
                      href={`/ebooks/${encodeURIComponent(ebookRouteId)}?view=book`}
                      className="inline-flex items-center gap-1 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#0066cc]" />
                      Book Read
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Book Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e8e8ed] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-[#1d1d1f]" />
              </button>

              <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-2">Add to Library</h2>
              <p className="text-[#86868b] text-sm mb-6">
                Track a physical book on your shelf, or{" "}
                <Link href="/ebooks" className="text-[#0066cc] font-semibold hover:underline">
                  browse the E-Library
                </Link>{" "}
                for instant digital editions.
              </p>

              <form onSubmit={handleAddBook} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Book Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    placeholder="e.g. Gitanjali or Atomic Habits"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Author Name</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    placeholder="e.g. Rabindranath Tagore"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">Total Pages</label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={totalPagesInput}
                    onChange={(e) => setTotalPagesInput(e.target.value)}
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white text-[#1d1d1f] rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full py-3.5 font-semibold text-sm transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add to My Library"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
