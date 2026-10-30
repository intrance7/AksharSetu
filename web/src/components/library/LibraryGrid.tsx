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

type FilterTab = "ALL" | "READING" | "WANT_TO_READ" | "READ" | "EBOOKS"

const TABS: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "All Books" },
  { id: "READING", label: "Currently Reading" },
  { id: "WANT_TO_READ", label: "Want to Read" },
  { id: "READ", label: "Completed" },
  { id: "EBOOKS", label: "Digital E-Books" },
]

export function LibraryGrid({ initialBooks }: { initialBooks: LibraryBook[] }) {
  const router = useRouter()
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks)
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedCovers, setFailedCovers] = useState<Record<string, boolean>>({})

  const filteredBooks = books.filter((book) => {
    if (activeTab === "ALL") return true
    if (activeTab === "EBOOKS") return book.gutenbergId !== null
    return book.status === activeTab
  })

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author }),
      })

      if (res.ok) {
        const newBook = await res.json()
        setBooks([newBook, ...books])
        setIsModalOpen(false)
        setTitle("")
        setAuthor("")
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-[#1D1D1F]/10 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#C84200] text-white shadow-sm"
                  : "bg-white text-[#1D1D1F]/70 hover:bg-[#1D1D1F] hover:text-[#F2EBE1]"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Add Book Button (First Card) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="min-h-[360px] rounded-[2rem] border-2 border-dashed border-[#1D1D1F]/20 bg-white/40 flex flex-col items-center justify-center gap-4 hover:border-[#C84200] hover:bg-white transition-all group p-6 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-[#1D1D1F]/5 group-hover:bg-[#C84200] flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-[#1D1D1F] group-hover:text-white transition-colors" />
          </div>
          <div className="text-center">
            <span className="block font-black text-lg text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
              Add Physical Book
            </span>
            <span className="text-xs font-medium text-[#86868B] mt-1 block">
              Track reading & launch Shanti Mode
            </span>
          </div>
        </button>

        {/* Existing Books */}
        {filteredBooks.map((book) => {
          const imgSrc =
            book.coverImage || (book.gutenbergId ? coverUrl(book.gutenbergId) : null)
          const showImg = imgSrc && !failedCovers[book.id]

          return (
            <div
              key={book.id}
              className="group flex flex-col bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.07)] border border-[#1D1D1F]/5 hover:shadow-[0_18px_40px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1.5"
            >
              {/* Top Row: Ebook/Physical Pill + Status Select */}
              <div className="flex items-center justify-between gap-2 mb-3 z-20">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2EBE1] text-[#1D1D1F] text-[10px] font-black uppercase tracking-wider">
                  {book.gutenbergId ? (
                    <>
                      <Tablet className="w-3 h-3 text-[#C84200]" /> E-Book
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3 h-3 text-[#287F56]" /> Physical
                    </>
                  )}
                </span>

                <select
                  className="bg-[#F2EBE1] hover:bg-[#e5ddd0] rounded-full px-3 py-1 text-[11px] font-black text-[#1D1D1F] outline-none cursor-pointer transition-colors"
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
                className="relative grid place-items-center w-full aspect-[1/1.05] isolate mb-3"
              >
                <div className="absolute left-1/2 bottom-[4%] w-[62%] h-5 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(29,29,31,0.25),transparent)] z-0" />

                <div className="relative z-10 w-[58%] aspect-[5/7] rounded-r-md rounded-l-[3px] overflow-hidden shadow-[18px_18px_36px_rgba(0,0,0,0.16),_4px_4px_12px_rgba(0,0,0,0.08)] transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-[1.04]">
                  <GeneratedCover
                    title={book.title}
                    author={book.author}
                    category={book.gutenbergId ? "fiction" : "non-fiction"}
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

              {/* Title & Author */}
              <div className="flex flex-col flex-1 pt-2">
                <h3
                  title={book.title}
                  className="font-black text-[#1D1D1F] text-[1.15rem] leading-tight mb-1 line-clamp-2"
                >
                  {book.title}
                </h3>
                <p className="text-[#86868B] text-sm font-semibold mb-4 line-clamp-1">
                  {book.author}
                </p>

                {/* Actions */}
                <div className="mt-auto pt-3 border-t border-[#1D1D1F]/5 flex items-center justify-between gap-2">
                  <Link
                    href={`/library/shanti/${book.id}`}
                    className="inline-flex items-center gap-1.5 bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-full transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F4B22B]" />
                    Shanti Mode
                  </Link>

                  {book.gutenbergId && (
                    <Link
                      href={`/ebooks/${book.gutenbergId}`}
                      className="inline-flex items-center gap-1 bg-[#F2EBE1] hover:bg-[#F4B22B] text-[#1D1D1F] text-xs font-bold px-3.5 py-2.5 rounded-full transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Read
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center hover:bg-[#1D1D1F]/10 transition-colors"
              >
                <X className="w-4 h-4 text-[#1D1D1F]" />
              </button>

              <h2 className="text-2xl font-black text-[#1D1D1F] mb-2">Add to Library</h2>
              <p className="text-[#1D1D1F]/60 text-sm font-medium mb-6">
                Enter the details of the book you want to track, or{" "}
                <Link href="/ebooks" className="text-[#C84200] font-bold underline">
                  browse the E-Library
                </Link>{" "}
                for instant digital classics.
              </p>

              <form onSubmit={handleAddBook} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#1D1D1F]">Book Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#F2EBE1] border border-transparent focus:border-[#C84200] focus:bg-white text-[#1D1D1F] rounded-xl px-4 py-3.5 text-sm outline-none transition-all placeholder:text-[#1D1D1F]/30 font-medium"
                    placeholder="e.g. Gitanjali or Atomic Habits"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#1D1D1F]">Author Name</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#F2EBE1] border border-transparent focus:border-[#C84200] focus:bg-white text-[#1D1D1F] rounded-xl px-4 py-3.5 text-sm outline-none transition-all placeholder:text-[#1D1D1F]/30 font-medium"
                    placeholder="e.g. Rabindranath Tagore"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full py-4 font-black uppercase tracking-wider text-sm transition-colors shadow-sm flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add to Library"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
