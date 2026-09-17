"use client"

import { Book } from "@prisma/client"
import { motion } from "framer-motion"
import Link from "next/link"

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  // Use a fallback if images array is empty
  const coverImage = book.images && book.images.length > 0 
    ? book.images[0] 
    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"

  return (
    <Link href={`/catalog/${book.id}`}>
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer h-full"
      >
        <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={coverImage} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <span className="bg-[#000000]/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
              {book.condition.replace('_', ' ')}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
             <span className="bg-white/90 backdrop-blur-md text-[#0066cc] text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
              {book.category}
            </span>
          </div>
        </div>

        <div className="flex flex-col p-5 flex-1">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="font-black text-lg leading-tight text-[#1D1D1F] line-clamp-2">
              {book.title}
            </h3>
            <span className="font-black text-lg text-[#FF5C00]">
              {book.price === 0 ? "Free" : `$${book.price}`}
            </span>
          </div>
          
          <p className="text-sm font-semibold text-[#86868b] mb-4">
            {book.author}
          </p>

          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
              {book.status}
            </span>
            <span className="text-xs font-bold text-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity">
              View Details →
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
