"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeftRight, X, Check, Plus, Loader2, BookOpen } from "lucide-react"
import { toast } from "sonner"

export interface SwapCandidateBook {
  id: string
  title: string
  author: string
  condition: string
  images: string[]
}

export function ProposeSwapModal({
  targetBook,
  ownerId,
  myBooks,
  secondary = false,
}: {
  targetBook: {
    id: string
    title: string
    author: string
    exchangePreferences?: string | null
  }
  ownerId: string
  myBooks: SwapCandidateBook[]
  secondary?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string>(myBooks[0]?.id || "")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const selectedBook = myBooks.find((b) => b.id === selectedBookId)
      const composedMessage = selectedBook
        ? `1-for-1 Swap Offer: Offering "${selectedBook.title}" by ${selectedBook.author} (${selectedBook.condition.replace(
            "_",
            " "
          )}).${note.trim() ? ` Note: ${note.trim()}` : ""}`
        : note.trim() || `Interested in proposing a book exchange for "${targetBook.title}".`

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: targetBook.id,
          offeredBookId: selectedBook?.id || null,
          message: composedMessage,
        }),
      })

      const data = await res.json()
      if (!res.ok && !String(data?.error || "").includes("already")) {
        throw new Error(data.error || "Could not submit swap proposal")
      }

      toast.success("Swap proposal sent! Opening direct chat...")
      setOpen(false)
      const params = new URLSearchParams({
        action: "exchange",
        book: targetBook.id,
        ...(selectedBook?.id ? { offeredBook: selectedBook.id } : {}),
      })
      router.push(`/messages/${ownerId}?${params.toString()}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to send swap proposal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          secondary
            ? "w-full mt-3 py-3.5 px-6 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            : "w-full py-4 px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        }
      >
        <ArrowLeftRight className="w-4 h-4" />
        {secondary ? "Or Offer a 1-for-1 Book Swap" : "Propose 1-for-1 Book Swap"}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#1d1d1f]" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[11px] font-bold uppercase tracking-wider mb-3">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Barter Matchmaker
              </div>

              <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">
                Swap for “{targetBook.title}”
              </h2>
              <p className="text-xs text-[#86868b] mb-5">
                Select one of your available listed books to offer in a direct 1-for-1 exchange.
              </p>

              {targetBook.exchangePreferences && (
                <div className="mb-5 p-3.5 rounded-2xl bg-[#f5f5f7] border border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0066cc] mb-0.5">
                    Owner’s Wishlist / Preferences
                  </p>
                  <p className="text-xs font-medium text-[#1d1d1f]">
                    {targetBook.exchangePreferences}
                  </p>
                </div>
              )}

              <form onSubmit={handlePropose} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                      Choose Your Book to Offer ({myBooks.length})
                    </label>
                    <Link
                      href="/catalog/new"
                      className="text-xs font-semibold text-[#0066cc] hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> List New Book
                    </Link>
                  </div>

                  {myBooks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/15 p-5 text-center bg-[#f5f5f7]/60">
                      <BookOpen className="w-7 h-7 text-[#86868b] mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#1d1d1f] mb-1">
                        You don’t have any active listings yet
                      </p>
                      <p className="text-[11px] text-[#86868b] mb-3">
                        You can still describe the book you want to offer below, or list it first.
                      </p>
                      <Link
                        href="/catalog/new"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-semibold hover:bg-[#0066cc] transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> List a Book Now
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {myBooks.map((b) => {
                        const selected = selectedBookId === b.id
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBookId(b.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition cursor-pointer ${
                              selected
                                ? "border-[#0066cc] bg-[#0066cc]/6"
                                : "border-black/10 hover:bg-[#f5f5f7]"
                            }`}
                          >
                            <div className="w-10 h-14 rounded-lg bg-[#e8e8ed] overflow-hidden shrink-0">
                              {b.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={b.images[0]}
                                  alt={b.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#1d1d1f] truncate">{b.title}</p>
                              <p className="text-xs text-[#86868b] truncate">
                                {b.author} · {b.condition.replace("_", " ")}
                              </p>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                selected
                                  ? "bg-[#0066cc] text-white"
                                  : "border border-black/15"
                              }`}
                            >
                              {selected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5">
                    Message / Meetup Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Clean hardcover copy! Can meet on campus or ship."
                    className="w-full rounded-xl bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white p-3 text-sm text-[#1d1d1f] outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowLeftRight className="w-4 h-4" />
                  )}
                  Send Swap Proposal & Open Chat
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

