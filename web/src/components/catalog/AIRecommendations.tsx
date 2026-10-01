"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, BookOpen, ShoppingBag, PlusCircle, X } from "lucide-react"
import { getAIRecommendations, AIRecommendation } from "@/app/actions/ai-recommendations"
import { toast } from "sonner"
import Link from "next/link"

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setIsOpen(true)
    try {
      const recs = await getAIRecommendations()
      setRecommendations(recs)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch recommendations")
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToWishlist = async (title: string) => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      })
      if (res.ok) {
        toast.success(`${title} added to wishlist!`)
      } else {
        toast.error("Failed to add to wishlist")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  return (
    <div className="mb-8">
      {!isOpen && (
        <button
          onClick={handleGenerate}
          className="group relative inline-flex items-center gap-2 px-6 py-3 bg-[#1d1d1f] text-white rounded-full font-bold overflow-hidden shadow-sm transition-transform hover:scale-[1.02]"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span>Ask AI for Recommendations</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-[#1d1d1f]/5 relative mt-4">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1d1d1f] tracking-tight">AI Curated Picks</h2>
                  <p className="text-[#86868b] font-medium text-sm">Personalized just for you based on your reading history.</p>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-black/5 animate-pulse rounded-2xl h-48 w-full"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {recommendations.map((rec, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-[#f5f5f7] rounded-2xl p-5 flex flex-col h-full border border-black/5 hover:border-black/10 transition-colors group"
                    >
                      <BookOpen className="w-8 h-8 text-[#1d1d1f]/20 mb-4 group-hover:text-purple-500 transition-colors" />
                      <h3 className="font-bold text-[#1d1d1f] leading-tight mb-1 line-clamp-2">{rec.title}</h3>
                      <p className="text-xs font-bold text-[#86868b] mb-3">{rec.author}</p>
                      <p className="text-xs text-[#1d1d1f]/70 mb-6 flex-1 italic">"{rec.reason}"</p>
                      
                      <div className="mt-auto">
                        {rec.availableBookId ? (
                          <Link 
                            href={`/book/${rec.availableBookId}`}
                            className="w-full flex justify-center items-center gap-2 bg-[#0066cc] hover:bg-[#0071e3] text-white py-2 rounded-full text-xs font-bold transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" /> View in Store
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleAddToWishlist(rec.title)}
                            className="w-full flex justify-center items-center gap-2 bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1d1d1f] py-2 rounded-full text-xs font-bold transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Add to Wishlist
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
