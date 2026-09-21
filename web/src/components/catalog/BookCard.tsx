"use client"

import { Book } from "@prisma/client"
import Link from "next/link"
import { Heart, MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { GeneratedCover } from "./GeneratedCover"

import { calculateDistance } from "@/lib/utils"

interface BookCardProps {
  book: Book & { owner?: { latitude: number | null, longitude: number | null, location: string | null } }
  userLocation?: { latitude: number | null, longitude: number | null } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  engineering: "#3B4CCA",
  medical: "#0B8577",
  fiction: "#C93A64",
  "non-fiction": "#D99A0B",
  default: "#1D1B26"
}

const CONDITION_COLORS: Record<string, string> = {
  LIKE_NEW: "#0A7D4F", // Leaf Green
  GOOD: "#3B82F6",
  FAIR: "#F4B22B", // Marigold
  POOR: "#C4420C", // Brand Orange
}

export function BookCard({ book, userLocation }: BookCardProps) {
  const coverImage = book.images && book.images.length > 0 
    ? book.images[0] 
    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"

  const isDonation = book.price === 0
  const catColor = CATEGORY_COLORS[book.category?.toLowerCase()] || CATEGORY_COLORS.default
  const condColor = CONDITION_COLORS[book.condition] || CONDITION_COLORS.GOOD

  // Distance / Location logic
  let locationText = book.owner?.location || "Unknown Location";
  if (userLocation?.latitude && userLocation?.longitude && book.owner?.latitude && book.owner?.longitude) {
    const dist = calculateDistance(userLocation.latitude, userLocation.longitude, book.owner.latitude, book.owner.longitude);
    locationText = `${dist.toFixed(1)} km away`;
  }

  return (
    <article className="flex flex-col min-w-0 group relative h-full">
      {/* Tile Container */}
      <div className="relative grid place-items-center aspect-[1/1.08] rounded-3xl overflow-hidden isolate" style={{ backgroundColor: `${catColor}15` }}>
        
        {/* Background gradient shadow */}
        <div className="absolute left-1/2 bottom-[9%] w-[56%] h-4 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(29,29,31,0.3),transparent)] z-0" />
        
        {/* Condition Badge (Top Left) */}
        <div className="absolute top-3 left-3 z-30 inline-flex items-center gap-1.5 bg-white text-[#1D1D1F] text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm pointer-events-none">
          <i className="w-2 h-2 rounded-full" style={{ backgroundColor: condColor }}></i>
          {book.condition.replace('_', ' ')}
        </div>

        {/* Wishlist Heart (Top Right) */}
        <button 
          onClick={(e) => { e.preventDefault() }}
          className="absolute top-3 right-3 z-50 grid place-items-center w-10 h-10 rounded-full bg-white text-[#1D1D1F] shadow-sm hover:scale-110 hover:text-[#D6335F] transition-all cursor-pointer"
          aria-label="Save to wishlist"
        >
          <Heart className="w-5 h-5" />
        </button>

        {/* The Cover Image */}
        <div className="relative z-10 w-[54%] aspect-[5/7] rounded-md overflow-hidden shadow-xl transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-[1.03]">
          {book.images && book.images.length > 0 ? (
            <>
              {/* Spine lighting effects for real images */}
              <div className="absolute inset-y-0 left-0 w-[11%] z-20 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.3), rgba(0,0,0,.06) 68%, rgba(255,255,255,.2) 88%, rgba(0,0,0,.1))" }} />
              <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "linear-gradient(115deg, rgba(255,255,255,.22), transparent 38%)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={book.images[0]} 
                alt={book.title} 
                className="w-full h-full object-fill relative z-10"
              />
            </>
          ) : (
            <GeneratedCover 
              title={book.title} 
              author={book.author} 
              category={book.category} 
            />
          )}
        </div>

        {/* Price Tag (Bottom Right) */}
        <div className={`absolute right-3 bottom-3 z-30 font-black text-base leading-none px-3 py-2 rounded-xl shadow-md pointer-events-none ${
          isDonation 
            ? "bg-[#0A7D4F] text-white -rotate-3" 
            : "bg-white text-[#1D1D1F] rotate-3"
        }`}>
          {isDonation ? "Free" : `₹${book.price}`}
        </div>
      </div>

      {/* Meta Data */}
      <div className="flex-1 flex flex-col pt-4 px-1">
        <div className="inline-flex items-center gap-2 text-sm font-bold text-[#1D1D1F]/70 mb-1">
          <i className="w-2 h-2 rounded-[2px] rotate-45" style={{ backgroundColor: catColor }}></i>
          {book.category}
        </div>
        
        <h3 title={book.title} className="font-bold text-lg leading-tight tracking-tight text-[#1D1D1F] line-clamp-2 mt-1 mb-1">
          <Link 
            href={`/catalog/${book.id}`} 
            className="hover:underline decoration-[#C84200] decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#C84200] rounded-sm after:absolute after:inset-0 after:z-10"
          >
            {book.title}
          </Link>
        </h3>
        
        <p className="text-[#1D1D1F]/60 text-sm font-medium">
          {book.author}
        </p>

        {/* Bottom Row */}
        <div className="flex items-center gap-4 mt-auto pt-4 text-xs font-semibold text-[#1D1D1F]/50">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {locationText}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(book.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </article>
  )
}
