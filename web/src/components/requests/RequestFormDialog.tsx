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
    } catch (error) {
      toast.error("Failed to post request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#C84200] hover:bg-[#A33500] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-colors shadow-sm"
      >
        <Plus className="w-5 h-5" /> Post a Request
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl p-8 z-50 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#1d1d1f]">What are you looking for?</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1d1d1f]/5 text-[#1d1d1f]/60 hover:bg-[#1d1d1f]/10 hover:text-[#1d1d1f] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Book Title <span className="text-red-500">*</span></label>
                  <input 
                    name="title"
                    required
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Author (Optional)</label>
                  <input 
                    name="author"
                    placeholder="e.g. Thomas H. Cormen"
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Additional Details (Optional)</label>
                  <textarea 
                    name="description"
                    rows={3}
                    placeholder="e.g. Need the 3rd edition for my CS101 class..."
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all resize-none placeholder:text-[#86868b]/60"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#C84200] hover:bg-[#A33500] text-white py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Request"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
