"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, BookOpen, ShoppingBag, PlusCircle, X } from "lucide-react"
import {
  getAIRecommendations,
  AIRecommendation,
} from "@/app/actions/ai-recommendations"
import { toast } from "sonner"
import Link from "next/link"

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    setIsOpen(true)
    try {
      const recs = await getAIRecommendations()
      setRecommendations(Array.isArray(recs) ? recs : [])
      setHasFetched(true)
    } catch (error: any) {
      toast.error(error?.message || "Failed to fetch recommendations")
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
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        toast.success(`"${title}" added to your Wishlist Radar!`)
      } else if (res.status === 401) {
        toast.error("Please sign in to save books to your Wishlist Radar")
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to add to wishlist")
      }
    } catch {
      toast.error("An error occurred")
    }
  }

  return (
    <div className="mb-8">
      {!isOpen && (
        <button
          type="button"
          onClick={handleGenerate}
          className="group relative inline-flex items-center gap-2 px-6 py-3 bg-[#1d1d1f] hover:bg-[#C84200] text-white rounded-full text-sm font-bold overflow-hidden shadow-sm transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Ask AI for Book Recommendations</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-[#1d1d1f]/10 relative mt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI recommendations"
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-[#e8e2d7] flex items-center justify-center text-[#1d1d1f] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6 pr-12">
                <div className="w-11 h-11 rounded-2xl bg-[#C84200]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#C84200]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-[#1d1d1f] tracking-tight">
                    AI Curated Picks
                  </h2>
                  <p className="text-[#86868b] font-medium text-xs sm:text-sm">
                    Personalized suggestions matched against our live catalog.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="bg-[#FAF6F0] animate-pulse rounded-2xl h-48 w-full"
                    />
                  ))}
                </div>
              ) : hasFetched && recommendations.length === 0 ? (
                <div className="rounded-2xl bg-[#FAF6F0] p-8 text-center border border-black/5">
                  <BookOpen className="w-8 h-8 text-[#86868b]/50 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1d1d1f]">
                    No tailored picks yet
                  </p>
                  <p className="text-xs text-[#86868b] mt-1">
                    Add a few books to your library or wishlist to personalize AI
                    recommendations.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {recommendations.map((rec, idx) => (
                    <motion.div
                      key={`${rec.title}-${idx}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: idx * 0.06,
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="bg-[#FAF6F0] rounded-2xl p-5 flex flex-col h-full border border-black/5 hover:border-[#C84200]/30 transition-colors group"
                    >
                      <BookOpen className="w-7 h-7 text-[#C84200]/50 mb-3 group-hover:text-[#C84200] transition-colors" />
                      <h3 className="font-bold text-sm text-[#1d1d1f] leading-snug mb-1 line-clamp-2">
                        {rec.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#86868b] mb-3 truncate">
                        {rec.author}
                      </p>
                      <p className="text-xs text-[#1d1d1f]/75 mb-5 flex-1 italic leading-relaxed">
                        &ldquo;{rec.reason}&rdquo;
                      </p>

                      <div className="mt-auto">
                        {rec.availableBookId ? (
                          <Link
                            href={`/catalog/${rec.availableBookId}`}
                            className="w-full flex justify-center items-center gap-1.5 bg-[#C84200] hover:bg-[#A33500] text-white py-2.5 px-3 rounded-full text-xs font-bold transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" /> View in
                            Catalog
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToWishlist(rec.title)}
                            className="w-full flex justify-center items-center gap-1.5 bg-white hover:bg-[#1D1D1F] hover:text-white text-[#1d1d1f] border border-black/10 py-2.5 px-3 rounded-full text-xs font-bold transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Add to
                            Wishlist
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
