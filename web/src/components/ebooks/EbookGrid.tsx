"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { coverUrl, type EBookSummary } from "@/lib/gutenberg"

export function EbookGrid({ books }: { books: EBookSummary[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {books.map((book, i) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link id={`ebook-${book.id}`} href={`/ebooks/${book.id}`} className="group block rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="relative aspect-[2/3] bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] overflow-hidden">
              {/* Fallback cover (shown when the image is missing) */}
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <p className="text-[#f5f5f7] font-bold tracking-tight leading-tight line-clamp-4">{book.title}</p>
                <p className="text-[#86868b] text-xs mt-1">{book.author}</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl(book.id)}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm text-[#1d1d1f] leading-snug line-clamp-2">{book.title}</h3>
              <p className="text-xs text-[#86868b] mt-1 truncate">{book.author}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
