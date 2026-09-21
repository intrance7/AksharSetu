"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState } from "react"
import { Search } from "lucide-react"
import { motion } from "framer-motion"
import { BookChaseAnimation } from "./BookChaseAnimation"

const POPULAR_SEARCHES = ["Algorithms", "Anatomy", "Atomic Habits", "Kalam"]

const FAN_BOOKS = [
  { title: "Clean Code", author: "Robert C. Martin", color: "#3B4CCA", r: -13, y: 24, k: -0.95, icon: "M12 22H38V44H66V16H88" },
  { title: "Harrison's", author: "J. Larry Jameson", color: "#0B8577", r: -4.5, y: 4, k: -0.32, icon: "M28 19h44v18H28z M41 6h18v44H41z" },
  { title: "milk and honey", author: "Rupi Kaur", color: "#C93A64", r: 4.5, y: 4, k: 0.32, icon: "circle" },
  { title: "Sapiens", author: "Yuval Noah Harari", color: "#F4B22B", r: 13, y: 24, k: 0.95, icon: "sun" }
]

export function CatalogHero({ isFiltered = false }: { isFiltered?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const currentQuery = searchParams.get("q") || ""
  const [searchValue, setSearchValue] = useState(currentQuery)

  const submitSearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("q", val)
    } else {
      params.delete("q")
    }
    startTransition(() => router.push(`/catalog?${params.toString()}`))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitSearch(searchValue)
  }

  return (
    <div className={`bg-[#1D1D1F] text-[#F5F5DC] ${isFiltered ? 'pt-8 pb-16' : 'pt-24 pb-32'} px-4 md:px-8 relative overflow-hidden transition-all duration-300`}>
      
      {/* Background Dots Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.08]" 
        style={{
          backgroundImage: "radial-gradient(#F5F5DC 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className={`container mx-auto max-w-[1200px] relative z-10 ${isFiltered ? 'flex flex-col max-w-3xl mx-auto' : 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center'}`}>
        
        {/* Left Copy */}
        <div className={`w-full ${isFiltered ? '' : 'max-w-[600px]'}`}>
          {!isFiltered && (
            <>
              <h1 className="text-[clamp(3.2rem,7.6vw,6.4rem)] font-black leading-[0.92] tracking-[-0.035em] text-[#F5F5DC]">
                <span className="block">Read it.</span>
                <span className="block pl-[0.75em]">Pass it on.</span>
              </h1>
              
              <p className="text-[#F5F5DC]/70 text-lg max-w-[44ch] mt-6 mb-7 font-medium">
                Donated and resale books from readers across India. Search by title, author or ISBN, or pick a subject below.
              </p>
            </>
          )}

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 w-full bg-[#2A2837] border-2 border-[#2A2837] text-white rounded-2xl p-2 pl-4 shadow-xl focus-within:border-[#F4B22B] transition-colors relative z-20">
            <Search className="w-5 h-5 text-[#F5F5DC]/50 shrink-0" />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by title, author or ISBN"
              className="flex-1 bg-transparent border-none outline-none py-2 px-1 text-[1.02rem] placeholder:text-[#F5F5DC]/40"
            />
            <button 
              type="submit"
              className="bg-[#FF7F45] hover:bg-[#FF9A68] text-[#1D1B26] px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Search
            </button>
          </form>

          {!isFiltered && (
            <div className="flex flex-wrap items-center gap-2 mt-5 text-[0.92rem] text-[#F5F5DC]/70">
              <span className="font-semibold mr-1">Popular searches</span>
              {POPULAR_SEARCHES.map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchValue(term)
                    submitSearch(term)
                  }}
                  className="border-[1.5px] border-[#F5F5DC]/30 rounded-full px-3 py-1 font-semibold hover:bg-[#F4B22B] hover:border-[#F4B22B] hover:text-[#1D1D1F] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Art (Fan of Books) */}
        {!isFiltered && (
          <div className="hidden md:block relative h-[410px] w-full">
            <svg className="absolute top-0 left-[2%] w-[96%] h-auto overflow-visible" viewBox="0 0 500 250" fill="none">
              <path d="M14 240C14 -30 486 -30 486 240" stroke="#F4B22B" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round"/>
              <circle cx="14" cy="236" r="6" fill="#F4B22B"/>
              <circle cx="486" cy="236" r="6" fill="#FBF6E8"/>
            </svg>
            
            <div className="absolute inset-0" style={{ perspective: 1200 }}>
              {FAN_BOOKS.map((book, i) => {
                return (
                  <motion.div 
                    key={i}
                    initial={{ 
                      opacity: 0, 
                      x: "-50%", 
                      y: 200, 
                      rotateZ: -40, 
                      rotateY: 90,
                      scale: 0.8
                    }}
                    animate={{ 
                      opacity: 1, 
                      x: `calc(-50% + clamp(118px, 14.5vw, 172px) * ${book.k})`, 
                      y: book.y, 
                      rotateZ: book.r,
                      rotateY: book.k * -18,
                      scale: 1
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      mass: 0.8,
                      delay: (i * 0.1) + 0.1
                    }}
                    className="absolute bottom-4 left-1/2 origin-[50%_90%]"
                    style={{ zIndex: i + 1, transformStyle: "preserve-3d" }}
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0], rotateZ: [0, i % 2 === 0 ? 1 : -1, 0] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3 // Stagger the levitation
                      }}
                      className="relative shadow-[20px_20px_40px_rgba(0,0,0,0.6),_5px_5px_15px_rgba(0,0,0,0.4)] rounded-r-lg rounded-l-sm overflow-hidden flex flex-col justify-end p-4 pb-5 text-white border-l-[8px] border-black/20"
                      style={{
                        width: 'clamp(118px, 14.5vw, 172px)',
                        aspectRatio: '5/7',
                        backgroundColor: book.color,
                        transformStyle: "preserve-3d"
                      }}
                    >
                      {/* Spine Highlight */}
                      <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-white/30 to-transparent z-10 pointer-events-none" />
                      
                      {/* Lighting Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none mix-blend-overlay z-10" />

                      {/* Decorative faint grid / lines behind text */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none" 
                           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      
                      <h3 className="font-black text-[clamp(1rem,1.8vw,1.5rem)] leading-[1.05] tracking-tight mb-1 relative z-20 shadow-sm" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                        {book.title}
                      </h3>
                      <p className="text-[clamp(0.7rem,0.9vw,0.875rem)] font-semibold opacity-90 relative z-20">
                        {book.author}
                      </p>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Easter Egg: Book Chase Platformer Animation */}
      {!isFiltered && (
        <div className="absolute left-0 right-0 bottom-[10px] z-10 opacity-90 mix-blend-screen overflow-hidden pointer-events-none">
          <BookChaseAnimation 
            sneakPoints={[
              { position: 0.25, pauseDuration: 1200, direction: "right" },
              { position: 0.65, pauseDuration: 1800, direction: "left" },
              { position: 0.85, pauseDuration: 1000, direction: "right" }
            ]}
            chaseDistance={160}
            speed={1.5}
          />
        </div>
      )}

      {/* Bottom Arch cutouts */}
      <div 
        className="absolute left-0 right-0 bottom-[-1px] h-[28px] pointer-events-none z-20"
        style={{
          background: "radial-gradient(ellipse 22px 26px at 50% 100%, #F5F5DC 96%, transparent 100%) 50% 0 / 56px 100% repeat-x"
        }}
      />
    </div>
  )
}
