"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Loader2 } from "lucide-react"
import { createCommunityRequest } from "@/app/actions/requests"
import { toast } from "sonner"

export function RequestFormDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createCommunityRequest(formData)
      toast.success("Request posted successfully!")
      setIsOpen(false)
    } catch {
      toast.error("Failed to post request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-[#C84200] hover:bg-[#FF7F45] hover:text-[#0B0B0D] text-white px-6 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Post a Request
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1D1D1F]/[0.08] max-h-[90vh] overflow-y-auto text-[#1D1D1F]"
            >
              <div className="flex justify-between items-center gap-3 mb-6">
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">
                  What are you{" "}
                  <span className="font-serif italic font-normal text-[#C84200]">
                    looking for?
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close modal"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#FAF6F0] text-[#1D1D1F]/70 hover:bg-[#EFE7DC] hover:text-[#1D1D1F] transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-2">
                    Book Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-2xl px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-2">
                    Author (Optional)
                  </label>
                  <input
                    name="author"
                    placeholder="e.g. Thomas H. Cormen"
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-2xl px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="e.g. Need the 3rd edition for my CS101 class..."
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-2xl px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition-all resize-none placeholder:text-[#86868b]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#C84200] hover:bg-[#A33500] text-white py-3.5 rounded-full font-bold text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Post Book Request"
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
