"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const slides = [
  {
    id: 1,
    chapter: "CHAPTER I · CAMPUS STACKS",
    src: "/images/login/slide1.jpg",
    titleBefore: "Bridge Knowledge",
    titleAccent: "Across Campuses.",
    subtitle:
      "Pass down textbooks to the next batch, trade novels 1-for-1, and discover nearby student shelves.",
  },
  {
    id: 2,
    chapter: "CHAPTER II · VIDYA DAAN",
    src: "/images/login/slide2.jpg",
    titleBefore: "Verified Trust &",
    titleAccent: "Tracked Pledges.",
    subtitle:
      "Follow every donated book across six verified checkpoints until a classroom student opens it.",
  },
  {
    id: 3,
    chapter: "CHAPTER III · SHANTI MODE",
    src: "/images/login/slide3.jpg",
    titleBefore: "Read in Calm,",
    titleAccent: "Uninterrupted Focus.",
    subtitle:
      "Explore 70,000+ unabridged classics paired with quiet rain, forest, and study-room acoustics.",
  },
]

export function LoginCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  const active = slides[currentIndex]

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0B0B0D]">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={active.src}
            alt={`${active.titleBefore} ${active.titleAccent}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover opacity-55"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/60 to-[#0B0B0D]/25" />
        </motion.div>
      </AnimatePresence>

      {/* Subtle dot-grid texture & warm saffron ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] z-[1]"
        style={{
          backgroundImage:
            "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#C84200]/25 blur-[100px] z-[1]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#FF7F45]/15 blur-[100px] z-[1]" />

      {/* Top Editorial Brand Mark */}
      <div className="absolute top-8 left-9 right-9 z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#F5F5F7]/90">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF7F45]" />
          Aksharसेतु · Reading Studio
        </span>
        <span className="font-mono text-xs font-semibold text-white/60">
          0{currentIndex + 1} / 0{slides.length}
        </span>
      </div>

      {/* Bottom Editorial Copy */}
      <div className="absolute bottom-10 left-9 right-9 z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="wait">
            <motion.span
              key={active.chapter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#FF7F45]"
            >
              {active.chapter}
            </motion.span>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.h2
              key={active.titleBefore}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{
                duration: 0.5,
                delay: 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-3xl xl:text-[42px] font-bold tracking-tight text-[#F5F5F7] leading-[1.08]"
            >
              {active.titleBefore}{" "}
              <span className="font-serif italic font-medium text-[#FF7F45]">
                {active.titleAccent}
              </span>
            </motion.h2>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={active.subtitle}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{
                duration: 0.5,
                delay: 0.16,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-[15px] xl:text-base text-[#D2CDC5] font-normal leading-relaxed max-w-md"
            >
              {active.subtitle}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2.5 pt-1">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ease-[0.16,1,0.3,1] cursor-pointer ${
                idx === currentIndex
                  ? "w-10 bg-[#FF7F45]"
                  : "w-2.5 bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
