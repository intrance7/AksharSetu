"use client"

import Link from "next/link"
import { motion, useScroll, useSpring } from "framer-motion"
import { MapPin, Heart, BookCopy } from "lucide-react"
import dynamic from "next/dynamic"

const WordUniverse = dynamic(() => import("@/components/3d/WordUniverse").then(mod => mod.WordUniverse), { ssr: false })

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5DC] text-black">
      {/* Hero Section */}
      <section className="relative w-full h-screen min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
        <WordUniverse />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 flex flex-col items-center text-center px-4"
        >
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#FF5C00] mb-2">AksharSetu.</h2>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[120px] font-black tracking-normal leading-none mb-6 text-[#FF5C00]"
            style={{ fontFamily: "'Momo Trust Display', sans-serif" }}
          >
            Unlimited ज्ञान.<br />
            Zero distance.
          </motion.h1>
          <p className="text-lg md:text-2xl text-[#FF5C00]/80 max-w-2xl font-medium tracking-tight mb-10">
            The smartest way to buy, sell, and donate used books.
          </p>
          <div className="flex flex-row items-center gap-6">
            <Link 
              href="/catalog"    
              className="bg-[#FF5C00] text-[#F5F5DC] px-8 py-3 rounded-full font-bold text-lg hover:bg-[#E85D04] transition-colors shadow-lg shadow-[#FF5C00]/20"
            >
              Browse Books
            </Link>
            <Link 
              href="/donate" 
              className="text-[#FF5C00] font-bold text-lg hover:underline underline-offset-4 flex items-center group"
            >
              Learn more about donating <span className="ml-1 group-hover:translate-x-1 transition-transform">›</span>
            </Link>
          </div>
        </motion.div>

        {/* Ambient Glow (Using safe radial-gradient instead of buggy CSS blur) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none z-0" 
          style={{ background: 'radial-gradient(circle, rgba(255,92,0,0.15) 0%, rgba(255,92,0,0) 70%)' }}
        />
      </section>

      {/* Features Section - Playing Card Style */}
      <section className="relative z-10 w-full bg-[#F5F5DC] py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 w-full max-w-[1600px] 2xl:max-w-[1800px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 xl:gap-12">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <div
                  style={{ 
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                    animation: `float 2s ease-in-out ${i * 0.15}s infinite`,
                    willChange: 'transform'
                  }}
                  className="bg-white text-black rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-[450px] md:h-[480px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)] border border-black/[0.04] transition-shadow duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]"
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase text-black">
                      {card.title}
                    </h3>
                    <span 
                      style={{ fontFamily: "'Silkscreen', cursive, sans-serif" }} 
                      className="text-[#FF5C00] font-bold text-2xl md:text-3xl leading-none select-none"
                    >
                      {card.letter}
                    </span>
                  </div>
                  
                  {/* List Items with dotted dividers */}
                  <div className="flex flex-col justify-center flex-1 my-6 space-y-3.5">
                    {card.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[15px] md:text-[17px] text-zinc-900 font-medium pb-2.5">
                          {item}
                        </span>
                        {idx < card.items.length - 1 && (
                          <div className="w-full border-b border-dotted border-blue-300/80" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Header (Rotated Playing Card Style) */}
                  <div className="flex items-center justify-between rotate-180">
                    <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase text-black">
                      {card.title}
                    </h3>
                    <span 
                      style={{ fontFamily: "'Silkscreen', cursive, sans-serif" }} 
                      className="text-[#FF5C00] font-bold text-2xl md:text-3xl leading-none select-none"
                    >
                      {card.letter}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Sync Test Section */}
      <section className="relative z-10 w-full py-48 bg-transparent flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-[#FF5C00] mb-8">WebGL Scroll Sync Test</h2>
        <div id="test-anchor" className="w-64 h-64 border-2 border-dashed border-[#FF5C00]/50 rounded-2xl flex items-center justify-center backdrop-blur-sm bg-[#FF5C00]/5">
          <p className="text-[#FF5C00]/80 font-medium">DOM Anchor</p>
        </div>
        <p className="text-[#FF5C00]/80 mt-8 max-w-md text-center">
          The 3D wireframe box is rendered in the fixed WebGL Canvas but perfectly tracks this DOM element's position on screen.
        </p>
      </section>
    </div>
  )
}

// Data
const cards = [
  {
    title: "STRATEGY",
    letter: "S",
    items: [
      "Digital Experience Strategy",
      "Technology Strategy",
      "Creative Direction",
      "Discovery",
      "Research"
    ]
  },
  {
    title: "CREATIVE",
    letter: "C",
    items: [
      "Art Direction",
      "UX/UI Design",
      "Motion Design",
      "Interactive Design",
      "Illustration"
    ]
  },
  {
    title: "TECH",
    letter: "T",
    items: [
      "WebGL Development",
      "Front End Development",
      "Unity/Unreal",
      "Interactive Installations",
      "AR and VR Experiences"
    ]
  },
  {
    title: "PRODUCTION",
    letter: "P",
    items: [
      "Procedural Modeling",
      "3D Asset Creation",
      "3D Optimization",
      "Animation",
      "3D Pipeline Development"
    ]
  }
]
