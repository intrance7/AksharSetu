"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { CatalogTopBar } from "./CatalogTopBar"
import { CatalogSidebarFilters } from "./CatalogSidebarFilters"
import { BookCard } from "./BookCard"
import { Book } from "@prisma/client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { CatalogGridInterlude } from "./CatalogGridInterlude"
import { AIRecommendations } from "./AIRecommendations"
import dynamic from "next/dynamic"

const InteractiveMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] md:h-[750px] rounded-3xl bg-black/5 animate-pulse flex items-center justify-center font-bold text-[#1D1D1F]/40">
      Loading Map...
    </div>
  ),
})

interface CatalogLayoutClientProps {
  books: (Book & {
    owner: {
      latitude: number | null
      longitude: number | null
      location: string | null
    }
  })[]
  totalCount?: number
  currentPage?: number
  totalPages?: number
  isFiltered: boolean
  userLocation: { latitude: number | null; longitude: number | null } | null
}

export function CatalogLayoutClient({
  books,
  totalCount,
  currentPage = 1,
  totalPages = 1,
  isFiltered,
  userLocation,
}: CatalogLayoutClientProps) {
  const [showFilters, setShowFilters] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [addingWishlist, setAddingWishlist] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || searchParams.get("query") || ""

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`/catalog?${params.toString()}`)
  }

  const handleAddToWishlist = async () => {
    if (!searchQuery) return
    setAddingWishlist(true)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: searchQuery }),
      })
      if (res.ok) {
        toast.success(`Added "${searchQuery}" to your Wishlist Radar!`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add to wishlist")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setAddingWishlist(false)
    }
  }

  return (
    <div className="container mx-auto max-w-[1400px] px-4 md:px-8 pb-24">
      {/* Top Bar with Sort and Toggle */}
      <CatalogTopBar
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        resultCount={totalCount ?? books.length}
        viewMode={viewMode}
        onToggleViewMode={() =>
          setViewMode(viewMode === "grid" ? "map" : "grid")
        }
      />

      <div className="mt-6">
        <AIRecommendations />
      </div>

      <div className="flex items-start mt-6">
        {/* Animated Sidebar */}
        <motion.div
          initial={{ width: 260, opacity: 1, marginRight: 32 }}
          animate={{
            width: showFilters ? 260 : 0,
            opacity: showFilters ? 1 : 0,
            marginRight: showFilters ? 32 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:block shrink-0 overflow-y-auto overflow-x-hidden sticky top-[140px] self-start max-h-[calc(100vh-140px)] scrollbar-hide"
        >
          <CatalogSidebarFilters />
        </motion.div>

        {/* Main Grid Area */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-w-0"
        >
          {books.length > 0 ? (
            viewMode === "grid" ? (
              <>
                <motion.div
                  layout
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`grid gap-x-6 gap-y-10 ${
                    showFilters
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}
                >
                  {books.map((book, index) => (
                    <React.Fragment key={book.id}>
                      <motion.div
                        layout
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <BookCard book={book} userLocation={userLocation} />
                      </motion.div>

                      {index === 7 && (
                        <motion.div
                          layout
                          transition={{
                            duration: 0.3,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="col-span-full"
                        >
                          <CatalogGridInterlude />
                        </motion.div>
                      )}
                    </React.Fragment>
                  ))}
                </motion.div>

                {totalPages > 1 && (
                  <div className="mt-14 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => goToPage(currentPage - 1)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#1D1D1F] text-sm font-bold border border-black/10 shadow-sm hover:bg-[#FAF6F0] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="px-4 py-2 rounded-full bg-white/60 text-sm font-black text-[#1D1D1F]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#1D1D1F] text-sm font-bold border border-black/10 shadow-sm hover:bg-[#FAF6F0] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <InteractiveMap books={books} userLocation={userLocation} />
              </motion.div>
            )
          ) : (
            <div className="text-center py-16 px-4 border-2 border-dashed border-[#1D1D1F]/10 rounded-3xl mt-4 max-w-2xl mx-auto bg-white/50">
              <h3 className="text-2xl font-black text-[#1D1D1F] mb-2 tracking-[-0.02em]">
                No books match those filters
              </h3>
              <p className="text-[#1D1D1F]/60 font-medium max-w-[42ch] mx-auto mb-6">
                Try removing a filter, check our Free E-Library, or add it to
                your Wishlist Radar for instant alerts.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {searchQuery && (
                  <button
                    onClick={handleAddToWishlist}
                    disabled={addingWishlist}
                    className="bg-[#C84200] text-white px-5 py-2.5 rounded-full font-bold hover:bg-[#A33500] transition-colors"
                  >
                    {addingWishlist
                      ? "Adding..."
                      : `Alert Me for "${searchQuery}"`}
                  </button>
                )}
                {isFiltered && (
                  <Link
                    href="/catalog"
                    className="bg-white border border-black/10 text-[#1D1D1F] px-5 py-2.5 rounded-full font-bold hover:bg-[#FAF6F0] transition-colors"
                  >
                    Clear filters
                  </Link>
                )}
                <Link
                  href="/catalog/new"
                  className="bg-transparent border-[1.5px] border-[#1D1D1F]/20 text-[#1D1D1F] px-5 py-2.5 rounded-full font-bold hover:border-[#1D1D1F] transition-colors"
                >
                  List a book
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
