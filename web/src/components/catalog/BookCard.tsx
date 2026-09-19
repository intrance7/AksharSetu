"use client"

import { Book } from "@prisma/client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Heart } from "lucide-react"

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  const coverImage = book.images && book.images.length > 0 
    ? book.images[0] 
    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"

  const isDonation = book.price === 0

  return (
    <Link href={`/catalog/${book.id}`}>
      <motion.div 
        whileHover={{ y: -6 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="group cursor-pointer h-full"
      >
        {/* Cover Image Container */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#E8E4DF] mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={coverImage} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top row: Condition + Wishlist */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="bg-[#1D1D1F]/90 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg">
              {book.condition.replace('_', ' ')}
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); }}
              className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
            >
              <Heart className="w-4 h-4 text-[#1D1D1F]" />
            </button>
          </div>

          {/* Price tag */}
          <div className="absolute bottom-3 right-3">
            <span className={`text-sm font-black px-3 py-1.5 rounded-lg ${
              isDonation 
                ? "bg-emerald-500 text-white" 
                : "bg-white text-[#1D1D1F]"
            }`}>
              {isDonation ? "Free" : `₹${book.price}`}
            </span>
          </div>
        </div>

        {/* Info below image */}
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C84200]">
              {book.category}
            </span>
          </div>
          <h3 className="font-bold text-[15px] leading-snug text-[#1D1D1F] line-clamp-2 group-hover:text-[#C84200] transition-colors duration-200">
            {book.title}
          </h3>
          <p className="text-[13px] text-[#1D1D1F]/40 line-clamp-1">
            {book.author}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}
