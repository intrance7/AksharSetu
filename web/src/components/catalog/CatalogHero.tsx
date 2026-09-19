"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState } from "react"
import { Search } from "lucide-react"
import { motion } from "framer-motion"

const POPULAR_SEARCHES = ["Algorithms", "Anatomy", "Atomic Habits", "Kalam"]

const FAN_BOOKS = [
  { title: "Clean Code", author: "Robert C. Martin", color: "#3B4CCA", r: -13, y: 24, k: -0.95, icon: "M12 22H38V44H66V16H88" },
  { title: "Harrison's", author: "J. Larry Jameson", color: "#0B8577", r: -4.5, y: 4, k: -0.32, icon: "M28 19h44v18H28z M41 6h18v44H41z" },
  { title: "milk and honey", author: "Rupi Kaur", color: "#C93A64", r: 4.5, y: 4, k: 0.32, icon: "circle" },
  { title: "Sapiens", author: "Yuval Noah Harari", color: "#F4B22B", r: 13, y: 24, k: 0.95, icon: "sun" }
]

export function CatalogHero() {
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
    <div className="bg-[#1D1D1F] text-[#F5F5DC] pt-24 pb-32 px-4 md:px-8 relative overflow-hidden">
      
      {/* Background Dots Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.08]" 
        style={{
          backgroundImage: "radial-gradient(#F5F5DC 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="container mx-auto max-w-[1200px] relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Copy */}
        <div className="max-w-[600px]">
          <h1 className="text-[clamp(3.2rem,7.6vw,6.4rem)] font-black leading-[0.92] tracking-[-0.035em] text-[#F5F5DC]">
            <span className="block">Read it.</span>
            <span className="block pl-[0.75em]">Pass it on.</span>
          </h1>
          
          <p className="text-[#F5F5DC]/70 text-lg max-w-[44ch] mt-6 mb-7 font-medium">
            Donated and resale books from readers across India. Search by title, author or ISBN, or pick a subject below.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5 w-full bg-[#2A2837] border-2 border-[#2A2837] text-white rounded-2xl p-2 pl-4 shadow-xl focus-within:border-[#F4B22B] transition-colors">
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
        </div>

        {/* Right Art (Fan of Books) */}
        <div className="hidden md:block relative h-[410px] w-full">
          <svg className="absolute top-0 left-[2%] w-[96%] h-auto overflow-visible" viewBox="0 0 500 250" fill="none">
            <path d="M14 240C14 -30 486 -30 486 240" stroke="#F4B22B" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round"/>
            <circle cx="14" cy="236" r="6" fill="#F4B22B"/>
            <circle cx="486" cy="236" r="6" fill="#FBF6E8"/>
          </svg>
          
          <div className="absolute inset-0">
            {FAN_BOOKS.map((book, i) => {
              return (
                <motion.div 
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    x: "-50%", 
                    y: 46, 
                    rotate: 0 
                  }}
                  animate={{ 
                    opacity: 1, 
                    x: `calc(-50% + clamp(118px, 14.5vw, 172px) * ${book.k})`, 
                    y: book.y, 
                    rotate: book.r 
                  }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.2, 0.8, 0.2, 1], 
                    delay: (i * 0.09) + 0.12 
                  }}
                  className="absolute bottom-4 left-1/2 origin-[50%_90%] shadow-[0_1.2em_3em_-0.6em_rgba(0,0,0,0.55),0_0.2em_0.6em_rgba(0,0,0,0.3)] rounded-md overflow-hidden flex flex-col justify-end p-4 pb-5 text-white"
                  style={{
                    width: 'clamp(118px, 14.5vw, 172px)',
                    aspectRatio: '5/7',
                    backgroundColor: book.color,
                    zIndex: i + 1,
                  }}
                >
                  
                  {/* Decorative faint grid / lines behind text */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" 
                       style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  <h3 className="font-black text-[clamp(1rem,1.8vw,1.5rem)] leading-[1.05] tracking-tight mb-1 relative z-10 shadow-sm" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    {book.title}
                  </h3>
                  <p className="text-[clamp(0.7rem,0.9vw,0.875rem)] font-semibold opacity-90 relative z-10">
                    {book.author}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>

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
