"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const slides = [
  {
    id: 1,
    src: "/images/login/slide1.jpg",
    title: "Bridging People Through Knowledge",
    subtitle: "Join a modern community dedicated to sharing books and ideas."
  },
  {
    id: 2,
    src: "/images/login/slide2.jpg",
    title: "Trust & Transparency",
    subtitle: "Donate and resell with confidence on our secure platform."
  },
  {
    id: 3,
    src: "/images/login/slide3.jpg",
    title: "A Premium Experience",
    subtitle: "Enjoy a sleek, minimalist interface designed for readers."
  }
]

export function LoginCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#000000]">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slides[currentIndex].src}
            alt={slides[currentIndex].title}
            fill
            className="object-cover opacity-70"
            priority
          />
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlays */}
      <div className="absolute bottom-12 left-12 right-12 z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="wait">
            <motion.h2
              key={slides[currentIndex].title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-[#f5f5f7]"
            >
              {slides[currentIndex].title}
            </motion.h2>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={slides[currentIndex].subtitle}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl text-[#f5f5f7]/80 font-medium max-w-lg"
            >
              {slides[currentIndex].subtitle}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ease-[0.16,1,0.3,1] ${
                idx === currentIndex ? "w-8 bg-[#0066cc]" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
