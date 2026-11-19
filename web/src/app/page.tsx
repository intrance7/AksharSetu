"use client"

import Link from "next/link"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"
import {
  MapPin,
  HeartHandshake,
  BookOpen,
  GraduationCap,
  Users,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const WordUniverse = dynamic(
  () => import("@/components/3d/WordUniverse").then((mod) => mod.WordUniverse),
  { ssr: false }
)

export default function Home() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenisRef.current = lenis

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    const introTween = gsap.fromTo(
      "#hero-initial-text-inner",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.3, ease: "power3.out", delay: 0.7 }
    )

    const tl1 = gsap.to("#hero-initial-text-wrapper", {
      opacity: 0,
      scale: 0.92,
      y: -48,
      pointerEvents: "none",
      scrollTrigger: {
        trigger: "#hero-scroll-container",
        start: "top top",
        end: "4.5% top",
        scrub: 1,
        onLeave: () => {
          const el = document.getElementById("hero-initial-text-inner")
          if (el) el.style.pointerEvents = "none"
        },
        onEnterBack: () => {
          const el = document.getElementById("hero-initial-text-inner")
          if (el) el.style.pointerEvents = "auto"
        },
      },
    })

    const tl2 = gsap.to("#hero-title-new", {
      opacity: 1,
      x: 0,
      scrollTrigger: {
        trigger: "#hero-scroll-container",
        start: "33% top",
        end: "44% top",
        scrub: 1,
        onEnter: () => {
          const el = document.getElementById("hero-title-new")
          if (el) el.style.pointerEvents = "auto"
        },
        onLeaveBack: () => {
          const el = document.getElementById("hero-title-new")
          if (el) el.style.pointerEvents = "none"
        },
      },
    })

    const tl3 = gsap.to("#ambient-glow", {
      opacity: 0,
      scrollTrigger: {
        trigger: "#hero-scroll-container",
        start: "top top",
        end: "4.5% top",
        scrub: 1,
      },
    })

    return () => {
      introTween.kill()
      if (tl1.scrollTrigger) tl1.scrollTrigger.kill()
      if (tl2.scrollTrigger) tl2.scrollTrigger.kill()
      if (tl3.scrollTrigger) tl3.scrollTrigger.kill()
      tl1.kill()
      tl2.kill()
      tl3.kill()
    }
  }, [])

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(useTransform(scrollYProgress, [0, 0.4], [0, 1]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <div className="flex flex-col min-h-screen bg-[#F2EBE1] text-[#1D1D1F] overflow-x-clip">
      {/* Scroll-Driven Hero Section */}
      <section id="hero-scroll-container" className="relative w-full h-[550vh]">
        <div className="sticky top-0 w-full h-screen min-h-[560px] flex flex-col items-center justify-center overflow-hidden">
          <WordUniverse />

          {/* ORIGINAL INITIAL TEXT */}
          <div
            id="hero-initial-text-wrapper"
            className="absolute inset-x-0 z-10 flex flex-col items-center justify-center w-full pointer-events-none"
          >
            <div
              id="hero-initial-text-inner"
              className="flex flex-col items-center text-center px-4 sm:px-6 max-w-5xl mx-auto pointer-events-auto"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[#C84A04] mb-2">
                Aksharसेतु.
              </h2>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-6xl md:text-8xl lg:text-[116px] font-black tracking-tight leading-[0.98] mb-5 sm:mb-6 text-[#FF5C00]"
                style={{ fontFamily: "'Momo Trust Display', sans-serif" }}
              >
                Unlimited ज्ञान.
                <br />
                Zero distance.
              </motion.h1>
              <p className="text-base sm:text-lg md:text-2xl text-[#1D1D1F] max-w-2xl font-medium tracking-tight mb-8 sm:mb-10">
                The smartest way to buy, sell, swap, and donate used books across
                Indian campuses.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
                <Link
                  href="/catalog"
                  className="bg-[#C84200] text-[#F2EBE1] px-8 py-3.5 rounded-full font-bold text-base sm:text-lg hover:bg-[#A33500] transition-colors shadow-lg shadow-[#C84200]/20 pointer-events-auto"
                >
                  Browse Books
                </Link>
                <Link
                  href="/donations"
                  className="text-[#C84200] font-bold text-base sm:text-lg hover:underline underline-offset-4 flex items-center group pointer-events-auto"
                >
                  Learn more about donating{" "}
                  <span className="ml-1 group-hover:translate-x-1 transition-transform">
                    ›
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* NEW TEXT (Fades in after book animation) */}
          <div
            id="hero-title-new"
            className="z-10 flex flex-col items-center md:items-start text-center md:text-left px-4 sm:px-6 absolute inset-x-0 md:inset-x-auto md:right-[10%] lg:right-[15%] opacity-0 translate-x-[24px] md:translate-x-[50px] pointer-events-none"
          >
            <h2
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-black tracking-tight leading-none mb-5 sm:mb-6 text-[#8B4513]"
              style={{ fontFamily: "'Momo Trust Display', sans-serif" }}
            >
              Akshar<span className="font-serif">सेतु</span>
            </h2>
            <p className="text-base sm:text-lg md:text-2xl text-black/80 max-w-xl font-medium tracking-tight mb-8 sm:mb-10">
              Buy, swap 1-for-1, read 70,000+ free classics, or gift books
              through Vidya Daan.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
              <Link
                href="/catalog"
                className="bg-[#8B4513] text-[#F2EBE1] px-8 py-3.5 rounded-full font-bold text-base sm:text-lg hover:bg-[#6b3410] transition-colors shadow-lg shadow-[#8B4513]/20"
              >
                Browse Books
              </Link>
              <Link
                href="/donations"
                className="text-[#8B4513] font-bold text-base sm:text-lg hover:underline underline-offset-4 flex items-center group"
              >
                Explore Vidya Daan{" "}
                <span className="ml-1 group-hover:translate-x-1 transition-transform">
                  ›
                </span>
              </Link>
            </div>
          </div>

          {/* Ambient Glow / Contrast Halo */}
          <div
            id="ambient-glow"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[800px] rounded-[100%] pointer-events-none z-0"
            style={{
              background:
                "radial-gradient(ellipse, rgba(253,251,247,0.9) 0%, rgba(253,251,247,0.6) 35%, rgba(253,251,247,0) 70%)",
            }}
          />
        </div>
      </section>

      {/* Scroll Synced Animated Divider */}
      <div className="w-full bg-[#F2EBE1] flex items-center justify-center relative z-20">
        <motion.div
          className="h-2.5 bg-[#1D1D1F] w-full origin-center"
          style={{ scaleX }}
        />
      </div>

      {/* Features Section - Editorial Playing Card Style */}
      <section className="relative z-10 w-full bg-[#F2EBE1] py-20 md:py-28 overflow-hidden">
        {/* Background Decorations - Left */}
        <div className="hidden xl:block absolute -left-12 top-32 w-[340px] pointer-events-none z-0 opacity-80">
          <div className="relative transform -rotate-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/doodle-bulb-books.png"
              alt=""
              className="w-full h-auto drop-shadow-2xl mix-blend-multiply"
            />
          </div>
        </div>

        {/* Background Decorations - Right */}
        <div className="hidden xl:block absolute -right-12 bottom-24 w-[340px] pointer-events-none z-0 opacity-80">
          <div className="relative transform rotate-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/doodle-airplane-books.png"
              alt=""
              className="w-full h-auto drop-shadow-2xl mix-blend-multiply"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 lg:px-12 w-full max-w-[1520px] relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C84200]/10 text-[#C84200] text-xs font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Built for Indian Readers
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-[#1D1D1F] leading-tight">
              Four Pillars of Aksharसेतु.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.65,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="w-full"
              >
                <Link
                  href={card.href}
                  className="group bg-white text-[#1D1D1F] rounded-[24px] p-6 md:p-7 flex flex-col justify-between min-h-[410px] md:min-h-[450px] shadow-[0_14px_34px_-12px_rgba(0,0,0,0.07)] border border-[#1D1D1F]/[0.06] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] hover:border-[#C84200]/25"
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
                      {card.title}
                    </h3>
                    <span
                      style={{
                        fontFamily: "'Silkscreen', cursive, sans-serif",
                      }}
                      className="text-[#C84200] font-bold text-2xl md:text-3xl leading-none select-none"
                    >
                      {card.letter}
                    </span>
                  </div>

                  {/* List Items with dotted dividers */}
                  <div className="flex flex-col justify-center flex-1 my-6 space-y-3">
                    {card.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[15px] md:text-[16px] text-[#1D1D1F]/85 font-medium pb-2.5">
                          {item}
                        </span>
                        {idx < card.items.length - 1 && (
                          <div className="w-full border-b border-dotted border-[#0066cc]/30" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Header (Rotated Playing Card Style + CTA cue) */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#C84200]">
                      {card.cta}
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                    <div className="flex items-center gap-2 rotate-180">
                      <span
                        style={{
                          fontFamily: "'Silkscreen', cursive, sans-serif",
                        }}
                        className="text-[#C84200] font-bold text-xl md:text-2xl leading-none select-none"
                      >
                        {card.letter}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Contrast Dark Editorial Ecosystem Strip */}
      <section className="w-full bg-black text-[#F5F5F7] py-20 md:py-24 px-4 md:px-8 border-t border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C84200] mb-3">
                Complete Reading Ecosystem
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none">
                Every Way Knowledge Moves.
              </h2>
            </div>
            <Link
              href="/catalog/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-bold text-sm transition-colors w-fit"
            >
              List or Donate a Book <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ecosystemLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 p-6 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-[#FF6B2B]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-[#F5F5F7] mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#86868b] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F5F5F7]/80 group-hover:text-white">
                    Open {item.label}{" "}
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#FF6B2B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

const cards = [
  {
    title: "DISCOVER",
    letter: "D",
    href: "/catalog",
    cta: "Explore Catalog",
    items: [
      "Search by title, author or ISBN",
      "Browse by subject & category",
      "Find books near you on the map",
      "Get real-time wishlist alerts",
      "See verified seller ratings",
    ],
  },
  {
    title: "SELL & SWAP",
    letter: "S",
    href: "/catalog/new",
    cta: "List a Book",
    items: [
      "AI fair campus price estimator",
      "Auto-fill via ISBN camera scan",
      "5-point condition grading",
      "Semester bundles & 1-for-1 swaps",
      "Zero-fee campus meetups",
    ],
  },
  {
    title: "DONATE",
    letter: "V",
    href: "/donations",
    cta: "Vidya Daan",
    items: [
      "Vidya Daan: gift of knowledge",
      "Verified NGO partner campaigns",
      "6-stage chain-of-custody tracking",
      "Printable literacy certificates",
      "Earn community impact badges",
    ],
  },
  {
    title: "CONNECT",
    letter: "C",
    href: "/clubs",
    cta: "Join Community",
    items: [
      "Direct chat & price offers",
      "Sabha book clubs & discussions",
      "Shanti Mode distraction-free timer",
      "70,000+ free public-domain e-books",
      "Gamified XP, streaks & leaderboards",
    ],
  },
]

const ecosystemLinks = [
  {
    title: "Campus Textbook Hub",
    desc: "Filter exact semester syllabi and multi-book packs from seniors at your university.",
    href: "/campus",
    label: "Campus Hub",
    icon: GraduationCap,
  },
  {
    title: "Hyperlocal Book Map",
    desc: "Locate books, free donations, and swaps within walking distance of your hostel.",
    href: "/map",
    label: "Book Map",
    icon: MapPin,
  },
  {
    title: "Vidya Daan Impact",
    desc: "Support active NGO drives and verify every donated book from pledge to student.",
    href: "/donations",
    label: "Donations",
    icon: HeartHandshake,
  },
  {
    title: "Free E-Library & Clubs",
    desc: "Read 70,000+ free legal classics in Shanti Mode and join reader Sabhas.",
    href: "/ebooks",
    label: "E-Library",
    icon: BookOpen,
  },
]
