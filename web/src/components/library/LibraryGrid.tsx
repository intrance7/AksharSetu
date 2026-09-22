"use client"

import { useState } from "react"
import { LibraryBook } from "@prisma/client"
import { Plus, X, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function LibraryGrid({ initialBooks }: { initialBooks: LibraryBook[] }) {
  const router = useRouter()
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author })
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
      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        
        {/* Add Book Button (First Card) */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="aspect-[1/1.4] rounded-3xl border-2 border-dashed border-[#1D1D1F]/20 flex flex-col items-center justify-center gap-4 hover:border-[#C84200] hover:bg-[#C84200]/5 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[#1D1D1F]/5 group-hover:bg-[#C84200]/20 flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-[#1D1D1F] group-hover:text-[#C84200]" />
          </div>
          <span className="font-bold text-[#1D1D1F]/60 group-hover:text-[#C84200]">Add Book</span>
        </button>

        {/* Existing Books */}
        {books.map((book) => (
          <Link key={book.id} href={`/library/shanti/${book.id}`} className="group relative aspect-[1/1.4] rounded-3xl overflow-hidden bg-white shadow-sm border border-[#1D1D1F]/5 hover:shadow-xl transition-all hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            
            {/* Minimal Generated Cover since we don't force image upload here yet */}
            <div className="absolute inset-0 bg-[#E8E4DF] z-0 flex items-center justify-center p-6 text-center">
              <span className="font-black text-2xl text-[#1D1D1F]/20 uppercase tracking-tighter leading-none">{book.title.substring(0, 10)}</span>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-5 z-20">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest mb-2">
                Shanti Mode
              </div>
              <h3 className="font-black text-white text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
              <p className="text-white/70 text-sm font-medium">{book.author}</p>
            </div>
          </Link>
        ))}
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
              <p className="text-[#1D1D1F]/60 text-sm font-medium mb-8">Enter the details of the physical book you want to track.</p>

              <form onSubmit={handleAddBook} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#1D1D1F]">Book Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#F2EBE1] border border-transparent focus:border-[#C84200] focus:bg-white text-[#1D1D1F] rounded-xl px-4 py-3.5 text-sm outline-none transition-all placeholder:text-[#1D1D1F]/30 font-medium"
                    placeholder="e.g. Atomic Habits"
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
                    placeholder="e.g. James Clear"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full py-4 font-bold tracking-wide text-sm transition-colors shadow-sm flex items-center justify-center"
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
