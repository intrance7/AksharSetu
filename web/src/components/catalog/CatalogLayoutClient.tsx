"use client"

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CatalogTopBar } from "./CatalogTopBar"
import { CatalogSidebarFilters } from "./CatalogSidebarFilters"
import { BookCard, CatalogBookWithOwner } from "./BookCard"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  X,
  History,
  ArrowUpRight,
  BookOpen,
} from "lucide-react"
import { toast } from "sonner"
import { CatalogGridInterlude } from "./CatalogGridInterlude"
import { AIRecommendations } from "./AIRecommendations"
import dynamic from "next/dynamic"

const InteractiveMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] md:h-[680px] rounded-3xl bg-white/70 border border-[#1D1D1F]/[0.07] animate-pulse flex items-center justify-center font-bold text-sm text-[#1D1D1F]/50">
      Loading Interactive Book Map...
    </div>
  ),
})

interface CatalogLayoutClientProps {
  books: CatalogBookWithOwner[]
  totalCount?: number
  currentPage?: number
  totalPages?: number
  isFiltered: boolean
  userLocation: { latitude: number | null; longitude: number | null } | null
}

const FILTER_LABELS: Record<string, string> = {
  category: "Category",
  price: "Listing",
  condition: "Condition",
  delivery: "Delivery",
  bundles: "Semester Packs",
  university: "University",
  course: "Course",
  subject: "Subject",
  author: "Author",
  semester: "Semester",
  maxPrice: "Max ₹",
  q: "Search",
}

const PRICE_VALUE_LABELS: Record<string, string> = {
  free: "Free Vidya Daan",
  exchange: "1-for-1 Swap",
  under250: "Under ₹250",
  under500: "Under ₹500",
  paid: "Paid Resale",
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid")
  const [addingWishlist, setAddingWishlist] = useState(false)
  const [recentBooks, setRecentBooks] = useState<
    Array<{
      id: string
      title: string
      author: string
      price: number
      condition: string
      category: string
      image: string | null
      acceptsExchange: boolean
    }>
  >([])

  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || searchParams.get("query") || ""

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aksharsetu_recent_books_v1")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setRecentBooks(parsed.slice(0, 6))
      }
    } catch {}
  }, [])

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; value: string; label: string }> = []
    searchParams.forEach((value, key) => {
      if (key === "page" || key === "sort" || !value || value === "all") return
      const prefix = FILTER_LABELS[key] || key
      const prettyValue =
        key === "price" && PRICE_VALUE_LABELS[value]
          ? PRICE_VALUE_LABELS[value]
          : value.replace(/_/g, " ")
      chips.push({
        key,
        value,
        label:
          key === "bundles"
            ? "Semester Packs"
            : `${prefix}: ${prettyValue}`,
      })
    })
    return chips
  }, [searchParams])

  const removeFilterChip = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `/catalog?${qs}` : "/catalog")
  }

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
    <div className="container mx-auto max-w-[1400px] px-4 md:px-8 pb-24 pt-2">
      {/* Editorial Section Header, Quick-Filter Ribbon & View Controls */}
      <CatalogTopBar
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onOpenMobileFilters={() => setMobileFiltersOpen(true)}
        resultCount={totalCount ?? books.length}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        activeFilterCount={activeFilters.length}
      />

      {/* Active Filter Chips Bar */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-white/80 rounded-2xl px-4 py-3 border border-[#1D1D1F]/[0.07]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] mr-1">
            Active:
          </span>
          {activeFilters.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeFilterChip(chip.key)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.1] text-[13px] font-bold text-[#1D1D1F] hover:border-[#C84200] hover:text-[#C84200] hover:bg-white transition-colors cursor-pointer"
            >
              <span>{chip.label}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
          <Link
            href="/catalog"
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-[#C84200] hover:bg-[#C84200]/10 transition-colors ml-auto sm:ml-2"
          >
            Reset all
          </Link>
        </div>
      )}

      {/* AI Recommendations Bar */}
      <div className="mt-1">
        <AIRecommendations />
      </div>

      {/* Recently Viewed Shelf (when present & on page 1) */}
      {recentBooks.length > 0 && !isFiltered && currentPage === 1 && (
        <section className="mb-8 bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.03)]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#1D1D1F]/70 flex items-center gap-2">
              <History className="w-4 h-4 text-[#C84200]" /> Recently Viewed on
              Your Desk
            </h3>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("aksharsetu_recent_books_v1")
                setRecentBooks([])
              }}
              className="text-xs font-bold text-[#86868b] hover:text-[#C84200] transition-colors cursor-pointer"
            >
              Clear history
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentBooks.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/catalog/${item.id}`}
                className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF6F0] hover:bg-white border border-[#1D1D1F]/[0.06] hover:border-[#C84200]/30 hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1D1D1F] group-hover:text-[#C84200] transition-colors truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#6e6e73] truncate mt-0.5">
                    {item.author} ·{" "}
                    <span className="font-mono font-bold text-[#1D1D1F]">
                      {item.price === 0
                        ? item.acceptsExchange
                          ? "Swap"
                          : "Free"
                        : `₹${item.price}`}
                    </span>
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#C84200] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-start mt-2">
        {/* Desktop Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: showFilters ? 276 : 0,
            opacity: showFilters ? 1 : 0,
            marginRight: showFilters ? 28 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:block shrink-0 overflow-y-auto overflow-x-hidden sticky top-[184px] self-start max-h-[calc(100vh-196px)] scrollbar-hide"
        >
          <CatalogSidebarFilters />
        </motion.div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFiltersOpen(false)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[350px] bg-[#F2EBE1] p-5 overflow-y-auto shadow-2xl rounded-r-3xl md:hidden"
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1D1D1F]/10">
                  <h3 className="text-lg font-black text-[#1D1D1F]">
                    Refine{" "}
                    <span className="font-serif italic font-normal text-[#C84200]">
                      Shelves
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-9 h-9 rounded-full bg-white border border-[#1D1D1F]/10 text-[#1D1D1F] flex items-center justify-center cursor-pointer"
                    aria-label="Close filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <CatalogSidebarFilters
                  onAfterChange={() => setMobileFiltersOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Listing Area */}
        <div className="flex-1 min-w-0">
          {books.length > 0 ? (
            viewMode === "map" ? (
              <div className="rounded-3xl overflow-hidden border border-[#1D1D1F]/[0.08] shadow-sm bg-white p-2">
                <InteractiveMap
                  books={books as any}
                  userLocation={userLocation}
                />
              </div>
            ) : viewMode === "list" ? (
              <>
                <div className="flex flex-col gap-5">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      userLocation={userLocation}
                      variant="list"
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <CatalogPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                )}
              </>
            ) : (
              <>
                <div
                  className={`grid gap-6 ${
                    showFilters
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}
                >
                  {books.map((book, index) => (
                    <React.Fragment key={book.id}>
                      <BookCard book={book} userLocation={userLocation} />
                      {index === 5 && (
                        <div className="col-span-full">
                          <CatalogGridInterlude />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {totalPages > 1 && (
                  <CatalogPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                )}
              </>
            )
          ) : (
            <div className="text-center py-16 px-6 sm:px-10 border border-[#1D1D1F]/[0.07] rounded-3xl mt-4 max-w-2xl mx-auto bg-white shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-7 h-7 text-[#C84200]" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] mb-2.5 tracking-tight">
                No books on this{" "}
                <span className="font-serif italic font-normal text-[#C84200]">
                  shelf
                </span>{" "}
                yet
              </h3>
              <p className="text-[#6e6e73] font-medium max-w-[46ch] mx-auto mb-7 text-[15px] leading-relaxed">
                Try relaxing a filter, explore our 70,000+ Free Public-Domain
                E-Library, or activate a Wishlist Radar alert so we notify you
                the instant a copy arrives.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleAddToWishlist}
                    disabled={addingWishlist}
                    className="bg-[#C84200] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#A33500] transition-colors cursor-pointer shadow-xs"
                  >
                    {addingWishlist
                      ? "Adding Alert..."
                      : `Alert Me for "${searchQuery}"`}
                  </button>
                )}
                {isFiltered && (
                  <Link
                    href="/catalog"
                    className="bg-[#FAF6F0] border border-[#1D1D1F]/12 text-[#1D1D1F] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#E8E2D7] transition-colors"
                  >
                    Reset All Filters
                  </Link>
                )}
                <Link
                  href="/catalog/new"
                  className="bg-[#1D1D1F] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[#C84200] transition-colors"
                >
                  + List a Book
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <nav
      aria-label="Catalog pagination"
      className="mt-14 flex items-center justify-center gap-3"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#1D1D1F] text-[13px] font-bold border border-[#1D1D1F]/[0.08] shadow-xs hover:bg-[#FAF6F0] hover:border-[#C84200]/40 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </button>
      <span className="px-4 py-2.5 rounded-full bg-white border border-[#1D1D1F]/[0.08] font-mono text-xs sm:text-[13px] font-bold text-[#1D1D1F]">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#1D1D1F] text-[13px] font-bold border border-[#1D1D1F]/[0.08] shadow-xs hover:bg-[#FAF6F0] hover:border-[#C84200]/40 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
