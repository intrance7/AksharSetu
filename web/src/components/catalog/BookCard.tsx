"use client"

import { Book } from "@prisma/client"
import Link from "next/link"
import { Heart, MapPin, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { GeneratedCover } from "./GeneratedCover"
import { PixelMascot } from "./PixelMascot"
import { useState } from "react"

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
  const [imgLoading, setImgLoading] = useState(true);

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

  // Use a pseudo-random generator based on book id so they don't jump on re-render
  const hash = book.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(hash + seed) * 10000;
    return x - Math.floor(x);
  };

  const doodles = [
    'doodle-star.png', 'doodle-smile.png', 'doodle-heart.png', 'doodle-bulb.png',
    'doodle-flower.png', 'doodle-lightning.png', 'doodle-cloud.png', 'doodle-leaf.png'
  ];
  
  const doodle1 = doodles[hash % doodles.length];
  const doodle2 = doodles[(hash + 1) % doodles.length];

  // Randomize placement (use toFixed to prevent SSR hydration mismatches due to floating point precision)
  const top1 = (10 + pseudoRandom(1) * 30).toFixed(2); // 10% to 40%
  const left1 = (-6 + pseudoRandom(2) * 10).toFixed(2); // -6 to +4
  const rot1 = (-30 + pseudoRandom(3) * 60).toFixed(2); // -30deg to 30deg
  
  const top2 = (40 + pseudoRandom(4) * 40).toFixed(2); // 40% to 80%
  const right2 = (-6 + pseudoRandom(5) * 10).toFixed(2); // -6 to +4
  const rot2 = (-30 + pseudoRandom(6) * 60).toFixed(2); // -30deg to 30deg

  const size1 = (14 + pseudoRandom(7) * 8).toFixed(2); // 14 to 22 (w/h basis is 4 = 1rem, so w-14 to w-22 equivalent but in px/rem)
  const size2 = (16 + pseudoRandom(8) * 10).toFixed(2);

  return (
    <article className="flex flex-col min-w-0 group relative h-full bg-white rounded-[2rem] p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#1D1D1F]/5 overflow-hidden transition-shadow duration-300 hover:shadow-[0_15px_40px_rgb(0,0,0,0.12)]">
      {/* Playful Textures (Absolute) */}
      <img 
        src={`/${doodle1}`} 
        className="absolute opacity-40 pointer-events-none mix-blend-multiply z-0" 
        style={{ 
          top: `${top1}%`, 
          left: `${left1}%`, 
          transform: `rotate(${rot1}deg)`,
          width: `${parseFloat(size1) * 4}px`, height: `${parseFloat(size1) * 4}px`
        }} 
        alt="" 
      />
      <img 
        src={`/${doodle2}`} 
        className="absolute opacity-30 pointer-events-none mix-blend-multiply z-0" 
        style={{ 
          top: `${top2}%`, 
          right: `${right2}%`, 
          transform: `rotate(${rot2}deg)`,
          width: `${parseFloat(size2) * 4}px`, height: `${parseFloat(size2) * 4}px`
        }} 
        alt="" 
      />
      
      {/* Decorative SVG squiggles */}
      <div className="absolute top-[25%] right-[8%] opacity-30 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4B22B" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 20L10 14" />
          <path d="M14 10L20 4" />
          <path d="M18 20L20 18" />
        </svg>
      </div>
      <div className="absolute bottom-[40%] left-[8%] opacity-30 pointer-events-none">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0B8577" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" />
          <path d="M15 12c0 3.3 2.7 6 6 6" />
        </svg>
      </div>

      {/* Badges Row */}
      <div className="flex justify-between items-start z-30 mb-4 relative">
        <div className="inline-flex items-center gap-2 bg-white text-[#1D1D1F] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm pointer-events-none tracking-wide">
          <i className="w-2 h-2 rounded-full" style={{ backgroundColor: condColor }}></i>
          {book.condition.replace('_', ' ')}
        </div>

        <button 
          onClick={(e) => { e.preventDefault() }}
          className="grid place-items-center w-10 h-10 rounded-full bg-white text-[#1D1D1F] shadow-sm hover:scale-110 hover:text-[#D6335F] transition-all cursor-pointer z-40"
          aria-label="Save to wishlist"
        >
          <Heart className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Tile Container for Cover */}
      <div className="relative grid place-items-center w-full aspect-[1/1.08] isolate mb-2">
        {/* Background gradient shadow */}
        <div className="absolute left-1/2 bottom-[5%] w-[60%] h-6 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(29,29,31,0.25),transparent)] z-0" />
        
        {/* Condition Badge (Top Left) */}

        {/* The Cover Image */}
        <div className="relative z-10 w-[58%] aspect-[5/7] rounded-md overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.15),_5px_5px_15px_rgba(0,0,0,0.08)] transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-[1.03]">
          {book.images && book.images.length > 0 ? (
            <>
              {imgLoading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white">
                  <div className="relative animate-bounce" style={{ animationDuration: '0.8s' }}>
                    <PixelMascot size={3.5} />
                  </div>
                  {/* Soft shadow that pulses with the bounce */}
                  <div className="w-8 h-1.5 bg-black/10 rounded-[100%] mt-1 animate-pulse" style={{ animationDuration: '0.8s' }}></div>
                  <span className="mt-4 text-[10px] font-black text-[#C84200] tracking-widest uppercase animate-pulse">
                    Loading
                  </span>
                </div>
              )}
              {/* Spine lighting effects for real images */}
              <div className="absolute inset-y-0 left-0 w-[11%] z-20 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.3), rgba(0,0,0,.06) 68%, rgba(255,255,255,.2) 88%, rgba(0,0,0,.1))" }} />
              <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "linear-gradient(115deg, rgba(255,255,255,.22), transparent 38%)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={book.images[0]} 
                alt={book.title} 
                className={`w-full h-full object-fill relative z-10 transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImgLoading(false)}
                onError={(e) => {
                  setImgLoading(false);
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800';
                }}
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

      </div>

      {/* Meta Data */}
      <div className="flex flex-col pt-4 relative z-20">
        <div className="inline-flex items-center gap-2 text-[15px] font-bold text-[#1D1D1F]/60 mb-2">
          <i className="w-2.5 h-2.5 rounded-[2px] rotate-45" style={{ backgroundColor: catColor }}></i>
          {book.category}
        </div>
        
        <h3 title={book.title} className="font-bold text-[1.45rem] leading-[1.1] tracking-[-0.02em] text-[#1D1D1F] line-clamp-2 mb-1">
          <Link 
            href={`/catalog/${book.id}`} 
            className="hover:underline decoration-[#C84200] decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[#C84200] rounded-sm after:absolute after:inset-0 after:z-10"
          >
            {book.title}
          </Link>
        </h3>
        
        <p className="text-[#86868B] text-[16px] font-medium mb-4">
          {book.author}
        </p>

        {/* Location & Time Row */}
        <div className="flex items-center gap-3 text-[14px] font-medium text-[#86868B] mb-6">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-[18px] h-[18px] text-[#C84200]" /> {locationText}
          </span>
          <span className="text-[#D4CCC0]">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-[18px] h-[18px] text-[#C84200]" /> {formatDistanceToNow(new Date(book.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Bottom Row: Tags (Optional) and Price */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-2">
            <span className="bg-[#FDECE8] text-[#C84200] px-3.5 py-1.5 rounded-full text-[13px] font-semibold">
              {book.category}
            </span>
          </div>
          
          <div className="relative z-30">
            {/* Sparkles around price */}
            <svg className="absolute -top-3 -right-2 w-6 h-6 rotate-[15deg] opacity-70" viewBox="0 0 24 24" fill="none" stroke="#F4B22B" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            
            <div className={`font-black text-lg leading-none px-5 py-2.5 shadow-md pointer-events-none transform transition-transform duration-300 group-hover:scale-110 ${
              isDonation 
                ? "bg-[#287F56] text-white -rotate-2" 
                : "bg-[#C84200] text-white rotate-2"
            }`}
            style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}>
              {isDonation ? "Free" : `₹${book.price}`}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
