"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { CatalogTopBar } from "./CatalogTopBar"
import { CatalogSidebarFilters } from "./CatalogSidebarFilters"
import { BookCard } from "./BookCard"
import { Book } from "@prisma/client"
import Link from "next/link"

import { CatalogGridInterlude } from "./CatalogGridInterlude"

interface CatalogLayoutClientProps {
  books: (Book & { owner: { latitude: number | null, longitude: number | null, location: string | null } })[];
  isFiltered: boolean;
  userLocation: { latitude: number | null, longitude: number | null } | null;
}

export function CatalogLayoutClient({ books, isFiltered, userLocation }: CatalogLayoutClientProps) {
  const [showFilters, setShowFilters] = useState(true)

  return (
    <div className="container mx-auto max-w-[1400px] px-4 md:px-8 pb-24">
      
      {/* Top Bar with Sort and Toggle */}
      <CatalogTopBar 
        showFilters={showFilters} 
        onToggleFilters={() => setShowFilters(!showFilters)}
        resultCount={books.length}
      />

      <div className="flex items-start mt-6">
        
        {/* Animated Sidebar */}
        <motion.div
          initial={{ width: 260, opacity: 1, marginRight: 32 }}
          animate={{ 
            width: showFilters ? 260 : 0, 
            opacity: showFilters ? 1 : 0,
            marginRight: showFilters ? 32 : 0
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:block shrink-0 overflow-y-auto overflow-x-hidden sticky top-[140px] self-start max-h-[calc(100vh-140px)] scrollbar-hide"
        >
          <CatalogSidebarFilters />
        </motion.div>

        {/* Main Grid Area */}
        <motion.div 
          layout
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-w-0"
        >
          {books.length > 0 ? (
            <motion.div 
              layout
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <BookCard book={book} userLocation={userLocation} />
                  </motion.div>

                  {/* Inject Interlude banner after 8th book */}
                  {index === 7 && (
                    <motion.div layout transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="col-span-full">
                      <CatalogGridInterlude />
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 px-4 border-2 border-dashed border-[#1D1D1F]/10 rounded-3xl mt-4 max-w-2xl mx-auto">
              <h3 className="text-2xl font-black text-[#1D1D1F] mb-2 tracking-[-0.02em]">No books match those filters</h3>
              <p className="text-[#1D1D1F]/60 font-medium max-w-[42ch] mx-auto mb-6">
                Try removing a filter or searching by author. Or be the first to list it.
              </p>
              <div className="flex justify-center gap-3">
                {isFiltered && (
                  <Link href="/catalog" className="bg-[#C84200] text-white px-5 py-2.5 rounded-full font-bold">
                    Clear filters
                  </Link>
                )}
                <Link href="/catalog" className="bg-transparent border-[1.5px] border-[#1D1D1F]/20 text-[#1D1D1F] px-5 py-2.5 rounded-full font-bold hover:border-[#1D1D1F]">
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
