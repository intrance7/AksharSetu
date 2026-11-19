"use client"

import Link from "next/link"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import {
  MapPin,
  HeartHandshake,
  BookOpen,
  GraduationCap,
  ArrowUpRight,
  Compass,
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

type PlayingCardData = {
  indexTag: string
  title: string
  subtitle: string
  letter: string
  href: string
  cta: string
  items: string[]
}

const cards: PlayingCardData[] = [
  {
    indexTag: "INDEX 01 · CATALOG",
    title: "DISCOVER",
    subtitle: "Campus & Neighborhood Stacks",
    letter: "D",
    href: "/catalog",
    cta: "Browse the Stacks",
    items: [
      "Search by title, author, or 13-digit ISBN",
      "Filter by university, course & semester",
      "Spot books within walking distance on the map",
      "Instant ping when a wishlisted title drops",
      "Verified 5-point condition grades & trust scores",
    ],
  },
  {
    indexTag: "INDEX 02 · EXCHANGE",
    title: "SELL & SWAP",
    subtitle: "Peer-to-Peer Book Studio",
    letter: "S",
    href: "/catalog/new",
    cta: "List a Book",
    items: [
      "Barcode scan pulls cover & edition in 0.2s",
      "Honest 5-point spine, page & margin grading",
      "Fair campus resale estimate by condition",
      "Bundle full-semester syllabi or trade 1-for-1",
      "Zero-commission hostel gate or courier handoff",
    ],
  },
  {
    indexTag: "INDEX 03 · VIDYA DAAN",
    title: "DONATE",
    subtitle: "Verifiable Literacy Drives",
    letter: "V",
    href: "/donations",
    cta: "Pledge via Vidya Daan",
    items: [
      "Vidya Daan — pass books to classrooms",
      "Direct pledges to verified Indian NGO drives",
      "6-stage chain-of-custody tracking ID",
      "Printable literacy impact certificate",
      "Community donor milestones & recognition",
    ],
  },
  {
    indexTag: "INDEX 04 · SABHA & SHANTI",
    title: "CONNECT",
    subtitle: "Reading Circles & Open Classics",
    letter: "C",
    href: "/clubs",
    cta: "Enter the Sabhas",
    items: [
      "Direct reader chat & 1-for-1 swap offers",
      "Sabha reading squads with SABHA-XXXXXX codes",
      "Shanti Mode focus timer with rain & library audio",
      "70,000+ free classics in realistic 2-page spread",
      "Shared margin notes & daily reading streaks",
    ],
  },
]

const ecosystemLinks = [
  {
    routeTag: "ROUTE 01 · /campus",
    title: "Campus Semester Desk",
    desc: "Pick up exact semester syllabi and multi-book packs from seniors at your college—or pass your stack to the incoming batch.",
    href: "/campus",
    label: "Campus Desk",
    icon: GraduationCap,
  },
  {
    routeTag: "ROUTE 02 · /map",
    title: "Neighborhood Book Radar",
    desc: "Spot textbooks, 1-for-1 swaps, and free Vidya Daan pickups pinned within walking distance of your hostel or metro stop.",
    href: "/map",
    label: "Book Map",
    icon: MapPin,
  },
  {
    routeTag: "ROUTE 03 · /donations",
    title: "Vidya Daan Chain of Custody",
    desc: "Pledge books to active Indian NGO literacy drives and follow every parcel across six verified checkpoints from shelf to classroom.",
    href: "/donations",
    label: "Vidya Daan",
    icon: HeartHandshake,
  },
  {
    routeTag: "ROUTE 04 · /ebooks",
    title: "Open Archives & Reading Sabhas",
    desc: "Open 70,000+ unabridged public-domain works in a two-page hardcover spread, start a Shanti timer, and co-read with your squad.",
    href: "/ebooks",
    label: "Open Archives",
    icon: BookOpen,
  },
]

function EditorialPlayingCard({
  card,
  index,
  progress,
}: {
  card: PlayingCardData
  index: number
  progress: MotionValue<number>
}) {
  const initialRotate =
    index === 0 ? -4.5 : index === 1 ? -1.5 : index === 2 ? 1.5 : 4.5
  const y = useTransform(progress, [0, 1], [110 + index * 28, 0])
  const rotate = useTransform(progress, [0, 1], [initialRotate, 0])
  const scale = useTransform(progress, [0, 1], [0.93, 1])
  const opacity = useTransform(progress, [0, 1], [0.15, 1])

  return (
    <motion.div
      style={{ y, rotate, scale, opacity }}
      className="w-full will-change-transform"
    >
      <Link
        href={card.href}
        className="group relative bg-white text-[#1D1D1F] rounded-[26px] p-6 md:p-7 flex flex-col justify-between min-h-[430px] md:min-h-[470px] shadow-[0_16px_38px_-14px_rgba(29,29,31,0.08)] border border-[#1D1D1F]/[0.08] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_56px_-14px_rgba(200,66,0,0.16)] hover:border-[#C84200]/35 overflow-hidden"
      >
        {/* Subtle Index Card Inner Frame */}
        <div className="pointer-events-none absolute inset-2.5 rounded-[18px] border border-[#1D1D1F]/[0.04] group-hover:border-[#C84200]/15 transition-colors" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#86868b] mb-1">
                {card.indexTag}
              </span>
              <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase text-[#1D1D1F] group-hover:text-[#C84200] transition-colors">
                {card.title}
              </h3>
            </div>
            <span
              style={{
                fontFamily: "var(--font-silkscreen), 'Silkscreen', monospace",
              }}
              className="font-[family-name:var(--font-silkscreen)] text-[#C84200] font-bold text-2xl md:text-3xl leading-none select-none shrink-0 pt-0.5"
            >
              {card.letter}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#86868b]">
            {card.subtitle}
          </p>
        </div>

        {/* List Items with archival dotted ledger rules */}
        <div className="relative z-10 flex flex-col justify-center flex-1 my-6 space-y-3">
          {card.items.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-baseline gap-2.5 pb-2.5">
                <span className="text-[10px] font-mono font-bold text-[#C84200]/70 select-none">
                  0{idx + 1}
                </span>
                <span className="text-[14.5px] md:text-[15.5px] text-[#1D1D1F]/90 font-medium leading-snug">
                  {item}
                </span>
              </div>
              {idx < card.items.length - 1 && (
                <div className="w-full border-b border-dotted border-[#1D1D1F]/15 group-hover:border-[#C84200]/25 transition-colors" />
              )}
            </div>
          ))}
        </div>

        {/* Bottom Header (Rotated Playing Card Corner + CTA cue) */}
        <div className="relative z-10 flex items-center justify-between pt-3 border-t border-[#1D1D1F]/[0.06]">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#C84200]">
            {card.cta}
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
          <div className="flex items-center gap-2 rotate-180">
            <span
              style={{
                fontFamily: "var(--font-silkscreen), 'Silkscreen', monospace",
              }}
              className="font-[family-name:var(--font-silkscreen)] text-[#C84200] font-bold text-xl md:text-2xl leading-none select-none"
            >
              {card.letter}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Home() {
  const lenisRef = useRef<Lenis | null>(null)
  const cardsSectionRef = useRef<HTMLElement | null>(null)

  const { scrollYProgress: cardsScrollProgress } = useScroll({
    target: cardsSectionRef,
    offset: ["start 95%", "start 25%"],
  })

  const smoothCardsProgress = useSpring(cardsScrollProgress, {
    stiffness: 85,
    damping: 24,
    mass: 0.7,
  })

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
                Pass down semester textbooks, swap novels 1-for-1, or pledge
                books to classrooms across India.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
                <Link
                  href="/catalog"
                  className="bg-[#C84200] text-[#F2EBE1] px-8 py-3.5 rounded-full font-bold text-base sm:text-lg hover:bg-[#A33500] transition-colors shadow-lg shadow-[#C84200]/20 pointer-events-auto"
                >
                  Browse the Stacks
                </Link>
                <Link
                  href="/donations"
                  className="text-[#C84200] font-bold text-base sm:text-lg hover:underline underline-offset-4 flex items-center group pointer-events-auto"
                >
                  Explore Vidya Daan{" "}
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
              Buy used textbooks at hostel prices, trade 1-for-1, read 70,000+
              unabridged classics, or donate through Vidya Daan.
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

          {/* Seamless vertical gradient melt into the warm #F2EBE1 editorial canvas */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-44 bg-gradient-to-b from-transparent via-[#F2EBE1]/60 to-[#F2EBE1] z-20"
          />
        </div>
      </section>

      {/* Features Section - Seamless Scroll-Driven Editorial Playing Cards */}
      <section
        ref={cardsSectionRef}
        className="relative z-20 w-full bg-[#F2EBE1] pt-10 pb-24 md:pt-14 md:pb-32 overflow-hidden"
      >
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
          <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1D1D1F]/[0.06] border border-[#1D1D1F]/10 text-[#C84200] text-[11px] font-black uppercase tracking-[0.22em] mb-4">
              CHAPTER I · THE AKSHARSETU WAY
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1D1D1F] leading-[1.03] mb-4">
              Books shouldn&apos;t gather dust on a hostel shelf.
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#1D1D1F]/75 font-medium max-w-2xl mx-auto leading-relaxed">
              Pass textbooks to the next batch, trade novels 1-for-1, or send
              books to classrooms that need them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {cards.map((card, i) => (
              <EditorialPlayingCard
                key={card.title}
                card={card}
                index={i}
                progress={smoothCardsProgress}
              />
            ))}
          </div>
        </div>
      </section>

      {/* High-Contrast Dark Editorial Showcase */}
      <section className="w-full bg-black text-[#F5F5F7] py-20 md:py-28 px-4 md:px-8 border-t border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C84200] mb-3 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5" /> CHAPTER II · FIELD ROUTES
              </p>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[1.02] mb-3">
                From Hostel Desk to Next Reader.
              </h2>
              <p className="text-sm sm:text-base text-[#86868b] font-medium leading-relaxed">
                Four direct corridors across the AksharSetu network—whether you
                are clearing out last semester&apos;s stack or opening a classic
                at midnight.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[#F5F5F7] font-bold text-sm transition-colors"
              >
                Explore Catalog
              </Link>
              <Link
                href="/catalog/new"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-bold text-sm transition-colors shadow-lg shadow-[#C84200]/20"
              >
                List or Donate a Book <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ecosystemLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#C84200]/45 p-6 transition-all duration-300 flex flex-col justify-between gap-6 hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FF6B2B] group-hover:bg-[#C84200] group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#86868b] group-hover:text-[#F5F5F7]/80 transition-colors">
                        {item.routeTag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-[#F5F5F7] mb-2 group-hover:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#86868b] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F5F5F7]/85 group-hover:text-white">
                      Open {item.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#FF6B2B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
