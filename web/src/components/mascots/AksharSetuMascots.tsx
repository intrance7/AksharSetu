"use client"

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react"

// ---------------------------------------------------------------------------
// 12x12 PIXEL ART SPRITE ENGINE (Exact Akshar & Setu palette & matrices)
// ---------------------------------------------------------------------------

export type MascotCharacter = "setu" | "akshar"

export type MascotStaticPose =
  | "IDLE"
  | "RUN_1"
  | "RUN_2"
  | "READ"
  | "SNEAK"
  | "CONFUSED"
  | "SURPRISE"
  | "HIDE"

export type MascotPose = MascotStaticPose | "RUN"

export const MASCOT_PALETTE: Record<string, string> = {
  ".": "transparent",
  k: "#1D1B26", // Outline / ink
  s: "#FFB899", // Skin
  w: "#FFFFFF", // Book pages / highlight
  r: "#C4420C", // Setu burnt-orange tunic
  g: "#0B8577", // Akshar teal-green tunic
  b: "#3B4CCA", // Blue pants
  y: "#F4B22B", // Golden book cover
  q: "#F4B22B", // Alert / question pixel
}

// Setu — The Campus Book Runner (#C4420C tunic + #3B4CCA pants + #F4B22B golden book)
const SETU_SPRITES: Record<MascotStaticPose, readonly string[]> = {
  IDLE: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....krrk....",
    "...krrkyywk.",
    "...krrkyywk.",
    "....kbbk....",
    "....kkkk....",
    "....k..k....",
    "...kk..kk...",
    "............",
  ],
  RUN_1: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "...kkrrk....",
    "..k.krrkyywk",
    "..k.krrkyywk",
    "....kbbk....",
    "...kk..k....",
    "...k...kk...",
    "..kk....k...",
    "............",
  ],
  RUN_2: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "...kkrrk....",
    "..k.krrkyywk",
    "..k.krrkyywk",
    "....kbbkk...",
    ".....kk..k..",
    "....kk...k..",
    "....k.......",
    "............",
  ],
  READ: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....krrk....",
    "...kyw.wk...",
    "...kywwwk...",
    "....kbbk....",
    "....kkkk....",
    "....k..k....",
    "...kk..kk...",
    "............",
  ],
  SNEAK: [
    "............",
    "............",
    "....kkkk....",
    "...kksssk...",
    "...ksskks...",
    "...kksssk...",
    "...k.krrk...",
    "....krrkyywk",
    "...kkrrkyywk",
    "...kbbbbk...",
    "..kk.kk.kk..",
    "............",
  ],
  CONFUSED: [
    ".....qq.....",
    "....q..q....",
    "......q.....",
    ".....q......",
    "............",
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....krrk....",
    "...krrkyywk.",
    "............",
  ],
  SURPRISE: [
    ".....qq.....",
    ".....qq.....",
    ".....qq.....",
    "............",
    ".....qq.....",
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....krrk....",
    "...krrkyywk.",
    "............",
  ],
  HIDE: [
    "............",
    "............",
    "............",
    "............",
    "....kkkk....",
    "...kyyywk...",
    "...kyyywk...",
    "...kyyywk...",
    "....krrk....",
    "....kbbk....",
    "...kk..kk...",
    "............",
  ],
}

// Akshar — Keeper of the Stacks (#0B8577 teal-green tunic + #3B4CCA pants)
const AKSHAR_SPRITES: Record<MascotStaticPose, readonly string[]> = {
  IDLE: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....kggk....",
    "...kkggkk...",
    "...k.gg.k...",
    "....kbbk....",
    "....kkkk....",
    "....k..k....",
    "...kk..kk...",
    "............",
  ],
  RUN_1: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....kggk....",
    "...k.gg.k...",
    "...k.gg.k...",
    "....kbbk....",
    "...kk..k....",
    "...k...kk...",
    "..kk....k...",
    "............",
  ],
  RUN_2: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....kggk....",
    "...kkggkk...",
    "...k.gg.k...",
    "....kbbkk...",
    ".....kk..k..",
    "....kk...k..",
    "....k.......",
    "............",
  ],
  READ: [
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....kggk....",
    "...kyw.wk...",
    "...kywwwk...",
    "....kbbk....",
    "....kkkk....",
    "....k..k....",
    "...kk..kk...",
    "............",
  ],
  SNEAK: [
    "............",
    "............",
    "....kkkk....",
    "...kksssk...",
    "...ksskks...",
    "...kksssk...",
    "...k.kggk...",
    "....kkggkk..",
    "...k.kggk...",
    "...kbbbbk...",
    "..kk.kk.kk..",
    "............",
  ],
  CONFUSED: [
    ".....qq.....",
    "....q..q....",
    "......q.....",
    ".....q......",
    "............",
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....kggk....",
    "...kkggkk...",
    "............",
  ],
  SURPRISE: [
    ".....qq.....",
    ".....qq.....",
    ".....qq.....",
    "............",
    ".....qq.....",
    "....kkkk....",
    "...kssskk...",
    "...kskssk...",
    "....ksskk...",
    "....kggk....",
    "...kkggkk...",
    "............",
  ],
  HIDE: [
    "............",
    "............",
    "............",
    "............",
    "....kkkk....",
    "...kyyywk...",
    "...kyyywk...",
    "...kyyywk...",
    "....kggk....",
    "....kbbk....",
    "...kk..kk...",
    "............",
  ],
}

// ---------------------------------------------------------------------------
// COMPONENT A: AnimatedMascotSprite & PixelPairSprite
// ---------------------------------------------------------------------------

export interface AnimatedMascotSpriteProps {
  character: MascotCharacter
  pose?: MascotPose
  pixelSize?: number
  flip?: boolean
  animate?: boolean
  frameMs?: number
  className?: string
  ariaLabel?: string
}

export function AnimatedMascotSprite({
  character,
  pose = "IDLE",
  pixelSize = 3,
  flip = false,
  animate = true,
  frameMs = 210,
  className = "",
  ariaLabel,
}: AnimatedMascotSpriteProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!animate) return
    if (pose !== "RUN" && pose !== "IDLE") return

    const interval = window.setInterval(
      () => setTick((t) => (t + 1) % 4),
      pose === "RUN" ? frameMs : 1150
    )
    return () => window.clearInterval(interval)
  }, [animate, pose, frameMs])

  const resolvedPose: MascotStaticPose = useMemo(() => {
    if (pose === "RUN") {
      return tick % 2 === 0 ? "RUN_1" : "RUN_2"
    }
    return pose
  }, [pose, tick])

  const grid =
    character === "setu"
      ? SETU_SPRITES[resolvedPose]
      : AKSHAR_SPRITES[resolvedPose]

  const dim = Math.round(12 * pixelSize)
  const bobOffset =
    animate && pose === "IDLE" && tick % 2 === 1 ? -1 : 0

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      role="img"
      aria-label={
        ariaLabel ||
        (character === "setu"
          ? "Setu, the Campus Book Runner pixel mascot"
          : "Akshar, Keeper of the Stacks pixel mascot")
      }
      className={`shrink-0 select-none ${className}`}
      style={{
        imageRendering: "pixelated",
        transform: bobOffset ? `translateY(${bobOffset}px)` : undefined,
        transition: "transform 180ms steps(2)",
      }}
    >
      {grid.map((row, r) =>
        row.split("").map((ch, c) => {
          if (ch === ".") return null
          const fill = MASCOT_PALETTE[ch]
          if (!fill || fill === "transparent") return null
          const x = flip ? 11 - c : c
          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={r}
              width={1}
              height={1}
              fill={fill}
            />
          )
        })
      )}
    </svg>
  )
}

export interface PixelPairSpriteProps {
  setuPose?: MascotPose
  aksharPose?: MascotPose
  pixelSize?: number
  facingEachOther?: boolean
  animate?: boolean
  className?: string
}

export function PixelPairSprite({
  setuPose = "IDLE",
  aksharPose = "IDLE",
  pixelSize = 2.5,
  facingEachOther = false,
  animate = true,
  className = "",
}: PixelPairSpriteProps) {
  return (
    <span
      className={`inline-flex items-end gap-0.5 shrink-0 ${className}`}
      aria-label="Akshar and Setu pixel mascots"
    >
      <AnimatedMascotSprite
        character="akshar"
        pose={aksharPose}
        pixelSize={pixelSize}
        flip={false}
        animate={animate}
      />
      <AnimatedMascotSprite
        character="setu"
        pose={setuPose}
        pixelSize={pixelSize}
        flip={facingEachOther}
        animate={animate}
      />
    </span>
  )
}

// ---------------------------------------------------------------------------
// ROUTE TIPS, POKE ROUTINES & QUICK FAQ CONTENT (Non-AI-slop, in-character)
// ---------------------------------------------------------------------------

interface RouteTip {
  pageLabel: string
  speaker: MascotCharacter
  bubble: string
  detail: string
  actionHref?: string
  actionLabel?: string
}

function getRouteTip(pathname: string): RouteTip {
  if (pathname === "/catalog/new") {
    return {
      pageLabel: "List a Book",
      speaker: "setu",
      bubble:
        "Setu says: Point your webcam at the ISBN barcode—I'll fetch the cover in 0.2s!",
      detail:
        "You can list for Sale, 1-for-1 Swap, or Vidya Daan donation from this same studio. Honest condition notes sell 2x faster.",
      actionHref: "/catalog",
      actionLabel: "Browse Catalog",
    }
  }
  if (pathname.startsWith("/catalog/")) {
    return {
      pageLabel: "Book Details",
      speaker: "akshar",
      bubble:
        "Akshar says: Check the 5-point condition grade before sending an offer in DM.",
      detail:
        "Compare the asking price against campus listings, or message the seller directly to agree on a library or gate meetup.",
      actionHref: "/messages",
      actionLabel: "Open Inbox",
    }
  }
  if (pathname === "/catalog") {
    return {
      pageLabel: "Marketplace Catalog",
      speaker: "setu",
      bubble:
        "Setu says: Filter by Swap or Donate to snag textbooks without spending a rupee.",
      detail:
        "Narrow results by condition, college campus, or subject—and save favorites to your wishlist so you don't lose a good copy.",
      actionHref: "/catalog/new",
      actionLabel: "List Your Book",
    }
  }
  if (pathname.startsWith("/profile")) {
    return {
      pageLabel: "Reader Profile",
      speaker: "akshar",
      bubble: "Akshar says: Claim your custom @username in Settings!",
      detail:
        "Your custom @handle gives you a clean shareable profile URL, tracks your reading streak, and displays pinned badges.",
      actionHref: "/achievements",
      actionLabel: "Badge Vault",
    }
  }
  if (pathname.startsWith("/clubs")) {
    return {
      pageLabel: "Sabha Reading Clubs",
      speaker: "setu",
      bubble:
        "Setu says: Got a SABHA-XXXXXX code? Paste it to join your squad!",
      detail:
        "Start a hostel reading circle or syllabus study group, pick a monthly read, and share annotated notes together.",
      actionHref: "/clubs",
      actionLabel: "All Clubs",
    }
  }
  if (pathname.startsWith("/map")) {
    return {
      pageLabel: "Book Radar Map",
      speaker: "setu",
      bubble:
        "Setu says: Pin your GPS to spot textbooks within walking distance.",
      detail:
        "Handing over a book outside the campus canteen beats paying courier charges every single semester.",
      actionHref: "/campus",
      actionLabel: "Campus Hub",
    }
  }
  if (pathname.startsWith("/donations")) {
    return {
      pageLabel: "Vidya Daan Drives",
      speaker: "akshar",
      bubble:
        "Akshar says: Every donated book gets a live NGO tracking ID you can follow.",
      detail:
        "Pick an active school or community literacy drive to donate finished semester notes and textbooks—and earn Vidya Daan XP.",
      actionHref: "/catalog/new?type=donation",
      actionLabel: "Donate a Book",
    }
  }
  if (pathname.startsWith("/library")) {
    return {
      pageLabel: "E-Library & Shelves",
      speaker: "akshar",
      bubble:
        "Akshar says: Open any book in Shanti Mode for distraction-free reading.",
      detail:
        "I quietly hide myself once you enter Shanti Mode so nothing interrupts your focus or reading streak timer.",
      actionHref: "/ebooks",
      actionLabel: "70k+ Free Ebooks",
    }
  }
  if (pathname === "/ebooks") {
    return {
      pageLabel: "Public-Domain Ebooks",
      speaker: "akshar",
      bubble:
        "Akshar says: 70,000+ free classics—zero ads, zero paywalls, pure reading.",
      detail:
        "Search by author or genre and jump straight into the reader; every session counts toward your daily reading streak.",
      actionHref: "/library",
      actionLabel: "My Library",
    }
  }
  if (pathname.startsWith("/campus")) {
    return {
      pageLabel: "Campus Exchange",
      speaker: "setu",
      bubble:
        "Setu says: Filter by your college to trade between hostels with zero shipping.",
      detail:
        "Seniors offload last semester's textbooks right here before exams wrap up.",
      actionHref: "/requests",
      actionLabel: "Book Requests",
    }
  }
  if (pathname.startsWith("/requests")) {
    return {
      pageLabel: "Book Bounties",
      speaker: "setu",
      bubble:
        "Setu says: Hunting a specific edition? Post a request so sellers ping you.",
      detail:
        "Include the author or semester code so students clearing their shelves know you're looking.",
      actionHref: "/catalog",
      actionLabel: "Search Catalog",
    }
  }
  if (pathname.startsWith("/messages")) {
    return {
      pageLabel: "Direct Messages",
      speaker: "akshar",
      bubble:
        "Akshar says: Lock in the price and pick a public campus spot for handoff.",
      detail:
        "You can send structured book offers directly inside chat so both buyer and seller stay on the same page.",
      actionHref: "/help/safety-blocking-and-reporting",
      actionLabel: "Safety Guide",
    }
  }
  if (
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/achievements") ||
    pathname.startsWith("/badges")
  ) {
    return {
      pageLabel: "XP, Streaks & Badges",
      speaker: "akshar",
      bubble:
        "Akshar says: Daily reading, book swaps, and NGO donations all stack XP.",
      detail:
        "Check your rarity tiers and pin your favorite unlocked badges to your public profile.",
      actionHref: "/help/xp-and-levels",
      actionLabel: "XP Formula",
    }
  }
  if (
    pathname.startsWith("/faq") ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/support")
  ) {
    return {
      pageLabel: "Help & Docs",
      speaker: "akshar",
      bubble:
        "Akshar says: Need the 10-second answer? Open our Quick FAQ right here.",
      detail:
        "Browse 13 Help Center topics or drop a ticket with our team if something looks off.",
      actionHref: "/support",
      actionLabel: "Support Desk",
    }
  }
  if (pathname.startsWith("/orders") || pathname.startsWith("/wishlist")) {
    return {
      pageLabel: "Orders & Wishlist",
      speaker: "setu",
      bubble:
        "Setu says: Keep your pickup note handy when meeting up on campus.",
      detail:
        "Track active book purchases, swaps, and saved titles all from one dashboard.",
      actionHref: "/catalog",
      actionLabel: "Explore More",
    }
  }
  return {
    pageLabel: "AksharSetu",
    speaker: "setu",
    bubble:
      "Setu says: Buy, swap, or donate textbooks across Indian campuses—zero fluff.",
    detail:
      "Click any book on the catalog, scan an ISBN to list yours, or dive into 70,000+ free classics in the E-Library.",
    actionHref: "/catalog",
    actionLabel: "Browse Books",
  }
}

interface PokeRoutine {
  setuPose: MascotPose
  aksharPose: MascotPose
  line: string
}

const POKE_ROUTINES: readonly PokeRoutine[] = [
  {
    setuPose: "RUN",
    aksharPose: "RUN",
    line: "Setu: 'Sprint across Hostel 4!' · Akshar: 'Slow down—you'll crease the spine!'",
  },
  {
    setuPose: "READ",
    aksharPose: "READ",
    line: "Akshar: 'Quiet hours in the stacks.' · Setu: 'Okay fine, this chapter actually slaps.'",
  },
  {
    setuPose: "SURPRISE",
    aksharPose: "CONFUSED",
    line: "Setu: 'Whoa—CLRS Algorithms for ₹150!' · Akshar: 'Hold on, check the edition first.'",
  },
  {
    setuPose: "SNEAK",
    aksharPose: "SURPRISE",
    line: "Setu: 'Tip-toeing past idle shelves...' · Akshar: 'I can literally see the golden book.'",
  },
  {
    setuPose: "HIDE",
    aksharPose: "CONFUSED",
    line: "Setu: '*hides behind hardcover*' · Akshar: 'Setu, your blue shoes are sticking out.'",
  },
]

interface QuickFaqEntry {
  id: string
  speaker: MascotCharacter
  question: string
  answer: string
  href: string
  cta: string
}

const QUICK_FAQS: readonly QuickFaqEntry[] = [
  {
    id: "list-book",
    speaker: "setu",
    question: "How fast can I list a textbook or novel?",
    answer:
      "Under 30 seconds. Point your webcam at the ISBN barcode on the back cover—I pull the title, author, and cover automatically, then you pick Sale, 1-for-1 Swap, or Donate.",
    href: "/catalog/new",
    cta: "List a Book",
  },
  {
    id: "nearby-map",
    speaker: "setu",
    question: "How do I find books within walking distance?",
    answer:
      "Open Book Radar and pin your campus or neighborhood GPS. You'll spot books listed by students right next door—hand over at the canteen and skip courier fees.",
    href: "/map",
    cta: "Open Book Map",
  },
  {
    id: "sabha-clubs",
    speaker: "setu",
    question: "What are Sabha Reading Clubs & invite codes?",
    answer:
      "Sabhas are campus reading squads. Create one for your batch or paste a SABHA-XXXXXX invite code to join book discussions, group goals, and club shelves.",
    href: "/clubs",
    cta: "Explore Clubs",
  },
  {
    id: "vidya-daan",
    speaker: "akshar",
    question: "How does Vidya Daan NGO book donation work?",
    answer:
      "Pick a verified literacy campaign on Vidya Daan, pledge your finished textbooks, and receive a live tracking code from drop-off to classroom delivery.",
    href: "/donations",
    cta: "Vidya Daan Drives",
  },
  {
    id: "username-xp",
    speaker: "akshar",
    question: "How do I claim my @username & earn XP?",
    answer:
      "Head to your Profile settings to claim a clean @username handle. Reading in Shanti Mode, completing swaps, and donating books build your streak, XP level, and badge vault.",
    href: "/profile",
    cta: "Go to Profile",
  },
  {
    id: "full-faq",
    speaker: "akshar",
    question: "What about fees, condition grades & safety rules?",
    answer:
      "Student swaps and NGO donations carry zero platform fees. Every listing uses our 5-point condition scale, and full rules live in the FAQ & Help Center.",
    href: "/faq",
    cta: "Read Full FAQ",
  },
]

const AMBIENT_CAMEO_LINES: readonly {
  character: MascotCharacter
  pose: MascotPose
  tag: string
}[] = [
  { character: "setu", pose: "SNEAK", tag: "Setu is scouting deals..." },
  { character: "akshar", pose: "READ", tag: "Akshar is checking stacks" },
  { character: "setu", pose: "RUN", tag: "Setu on a hostel delivery!" },
  { character: "akshar", pose: "CONFUSED", tag: "Akshar spotted a loose page" },
]

// ---------------------------------------------------------------------------
// COMPONENT B: MascotCompanion (Mounted globally in layout.tsx)
// ---------------------------------------------------------------------------

const emptySubscribe = () => () => {}

const MINIMIZED_STORAGE_KEY = "aksharsetu-mascot-min"
const minimizedListeners = new Set<() => void>()

function subscribeMinimized(callback: () => void) {
  minimizedListeners.add(callback)
  return () => {
    minimizedListeners.delete(callback)
  }
}

function getMinimizedSnapshot(): boolean {
  try {
    return window.sessionStorage.getItem(MINIMIZED_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function getMinimizedServerSnapshot(): boolean {
  return false
}

function setMinimizedPreference(minimized: boolean) {
  try {
    if (minimized) {
      window.sessionStorage.setItem(MINIMIZED_STORAGE_KEY, "1")
    } else {
      window.sessionStorage.removeItem(MINIMIZED_STORAGE_KEY)
    }
  } catch {
    // Ignore storage access errors in private contexts
  }
  minimizedListeners.forEach((listener) => listener())
}

export function MascotCompanion() {
  const pathname = usePathname() || "/"

  // Auto-hide on distraction-free reading routes
  const isDistractionFreeRoute =
    pathname.startsWith("/library/shanti") ||
    (pathname.startsWith("/ebooks/") && pathname !== "/ebooks")

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const isMinimized = useSyncExternalStore(
    subscribeMinimized,
    getMinimizedSnapshot,
    getMinimizedServerSnapshot
  )

  const [isOpen, setIsOpen] = useState(false)
  const [dismissedBubblePath, setDismissedBubblePath] = useState<string | null>(
    null
  )
  const [pokeIndex, setPokeIndex] = useState<number>(-1)
  const [openFaqId, setOpenFaqId] = useState<string | null>(QUICK_FAQS[0].id)

  // Random ambient edge cameo state (scoped to pathname for instant cleanup)
  const [ambientCameo, setAmbientCameo] = useState<{
    path: string
    side: "left" | "right"
    character: MascotCharacter
    pose: MascotPose
    tag: string
  } | null>(null)

  const routeTip = useMemo(() => getRouteTip(pathname), [pathname])

  // Close popover on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  // Trigger a subtle random ambient edge cameo on route navigation
  useEffect(() => {
    if (!mounted || isDistractionFreeRoute || isOpen || isMinimized) {
      return
    }

    let hideTimer: number | undefined
    const delayMs = 2400 + Math.floor(Math.random() * 2200)
    const showTimer = window.setTimeout(() => {
      const pick =
        AMBIENT_CAMEO_LINES[
          Math.floor(Math.random() * AMBIENT_CAMEO_LINES.length)
        ]
      const side: "left" | "right" = Math.random() < 0.55 ? "left" : "right"
      setAmbientCameo({
        path: pathname,
        side,
        character: pick.character,
        pose: pick.pose,
        tag: pick.tag,
      })

      hideTimer = window.setTimeout(() => {
        setAmbientCameo(null)
      }, 4600)
    }, delayMs)

    return () => {
      window.clearTimeout(showTimer)
      if (hideTimer) window.clearTimeout(hideTimer)
    }
  }, [mounted, pathname, isDistractionFreeRoute, isOpen, isMinimized])

  if (isDistractionFreeRoute) return null

  const activeAmbientCameo =
    !isOpen && !isMinimized && ambientCameo?.path === pathname
      ? ambientCameo
      : null

  const showSpeechBubble =
    mounted && !isOpen && !isMinimized && dismissedBubblePath !== pathname

  const activeRoutine =
    pokeIndex >= 0 ? POKE_ROUTINES[pokeIndex % POKE_ROUTINES.length] : null

  const handleMinimize = () => {
    setIsOpen(false)
    setAmbientCameo(null)
    setMinimizedPreference(true)
  }

  const handleRestore = () => {
    setMinimizedPreference(false)
    setIsOpen(true)
  }

  const handlePoke = () => {
    setPokeIndex((prev) => (prev + 1) % POKE_ROUTINES.length)
  }

  return (
    <>
      {/* Ambient Edge Cameo (clipped neatly to viewport edge, 0px overflow) */}
      <AnimatePresence>
        {activeAmbientCameo && (
          <motion.button
            key={`${pathname}-${activeAmbientCameo.side}-${activeAmbientCameo.tag}`}
            type="button"
            onClick={() => {
              setAmbientCameo(null)
              setIsOpen(true)
            }}
            initial={{
              opacity: 0,
              x: activeAmbientCameo.side === "left" ? -36 : 36,
            }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: activeAmbientCameo.side === "left" ? -36 : 36,
            }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed bottom-24 z-30 hidden sm:flex items-center gap-2 border border-black/10 bg-[#FAF6F0]/95 backdrop-blur-md px-3 py-1.5 shadow-lg cursor-pointer hover:bg-white transition-colors ${
              activeAmbientCameo.side === "left"
                ? "left-0 rounded-r-full border-l-0"
                : "right-0 rounded-l-full border-r-0 flex-row-reverse"
            }`}
            aria-label={activeAmbientCameo.tag}
          >
            <AnimatedMascotSprite
              character={activeAmbientCameo.character}
              pose={activeAmbientCameo.pose}
              pixelSize={2.2}
              flip={activeAmbientCameo.side === "right"}
            />
            <span className="text-[11px] font-bold text-[#1D1D1F] whitespace-nowrap">
              {activeAmbientCameo.tag}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Bottom-Right Floating Guide Anchor */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)]">
        {/* Field Guide & Quick FAQ Popover Card */}
        <AnimatePresence>
          {isOpen && (
            <motion.section
              role="dialog"
              aria-label="Akshar and Setu Field Guide and Quick FAQ"
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] max-h-[min(76vh,620px)] flex flex-col rounded-2xl bg-white border border-black/10 shadow-2xl overflow-hidden"
            >
              {/* Popover Obsidian Header */}
              <div className="bg-[#1D1D1F] text-[#FAF6F0] px-4 pt-4 pb-3.5 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-silkscreen text-[10px] tracking-wider uppercase text-[#F4B22B]">
                      Akshar &amp; Setu · Field Guide
                    </div>
                    <h2 className="text-base font-bold tracking-tight text-white mt-0.5">
                      Campus Guides &amp; Quick FAQ
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close Field Guide"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Character Bio + Interactive Stage */}
                <div className="mt-3 rounded-xl bg-white/[0.06] border border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-end gap-2">
                      <div className="rounded-lg bg-[#FAF6F0] p-1.5 border border-black/10">
                        <AnimatedMascotSprite
                          character="akshar"
                          pose={activeRoutine ? activeRoutine.aksharPose : "READ"}
                          pixelSize={3}
                        />
                      </div>
                      <div className="rounded-lg bg-[#FAF6F0] p-1.5 border border-black/10">
                        <AnimatedMascotSprite
                          character="setu"
                          pose={activeRoutine ? activeRoutine.setuPose : "IDLE"}
                          pixelSize={3}
                          flip={Boolean(activeRoutine)}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePoke}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#C84200] hover:bg-[#A33500] px-3 py-1.5 text-[11px] font-bold text-white transition-colors cursor-pointer shrink-0"
                    >
                      <Sparkles className="h-3 w-3" />
                      Poke Mascots
                    </button>
                  </div>

                  {activeRoutine ? (
                    <p className="mt-2.5 text-[11px] leading-snug text-[#FAF6F0] bg-black/40 rounded-lg px-2.5 py-2 border border-white/10">
                      {activeRoutine.line}
                    </p>
                  ) : (
                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] leading-snug">
                      <div className="rounded-lg bg-black/30 px-2.5 py-1.5 border border-white/10">
                        <span className="font-bold text-[#4AD3C1]">Akshar</span>{" "}
                        <span className="text-white/70">
                          — Keeper of Stacks, grades &amp; Shanti Mode.
                        </span>
                      </div>
                      <div className="rounded-lg bg-black/30 px-2.5 py-1.5 border border-white/10">
                        <span className="font-bold text-[#FF8A4C]">Setu</span>{" "}
                        <span className="text-white/70">
                          — Book Runner, ISBN scans &amp; campus swaps.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto p-4 space-y-4 bg-white">
                {/* Tips for This Page Box */}
                <div className="rounded-xl bg-[#FAF6F0] border border-black/[0.07] p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1D1D1F]">
                      <Compass className="h-3.5 w-3.5 text-[#C84200]" />
                      Tips for This Page · {routeTip.pageLabel}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                        routeTip.speaker === "setu"
                          ? "bg-[#C4420C]"
                          : "bg-[#0B8577]"
                      }`}
                    >
                      {routeTip.speaker === "setu" ? "Setu" : "Akshar"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#1D1D1F] leading-snug">
                    {routeTip.bubble}
                  </p>
                  <p className="text-[11px] text-[#6e6e73] mt-1 leading-relaxed">
                    {routeTip.detail}
                  </p>
                  {routeTip.actionHref && routeTip.actionLabel && (
                    <Link
                      href={routeTip.actionHref}
                      onClick={() => setIsOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#0066cc] hover:underline"
                    >
                      {routeTip.actionLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {/* Quick FAQ Accordion */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#1D1D1F]">
                      Quick FAQ with Akshar &amp; Setu
                    </h3>
                    <span className="font-caveat text-sm text-[#86868b]">
                      tap any question
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {QUICK_FAQS.map((item) => {
                      const expanded = openFaqId === item.id
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-black/[0.07] bg-white overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenFaqId(expanded ? null : item.id)
                            }
                            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#FAF6F0]/70 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span
                                className={`h-2 w-2 rounded-full shrink-0 ${
                                  item.speaker === "setu"
                                    ? "bg-[#C4420C]"
                                    : "bg-[#0B8577]"
                                }`}
                              />
                              <span className="text-xs font-bold text-[#1D1D1F] leading-snug">
                                {item.question}
                              </span>
                            </span>
                            {expanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-[#0066cc] shrink-0" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-[#86868b] shrink-0" />
                            )}
                          </button>

                          {expanded && (
                            <div className="px-3 pb-3 pt-1.5 border-t border-black/[0.05] bg-[#FAF6F0]/50">
                              <p className="text-[11px] text-[#52525b] leading-relaxed">
                                <span
                                  className={`font-bold ${
                                    item.speaker === "setu"
                                      ? "text-[#C4420C]"
                                      : "text-[#0B8577]"
                                  }`}
                                >
                                  {item.speaker === "setu"
                                    ? "Setu: "
                                    : "Akshar: "}
                                </span>
                                {item.answer}
                              </p>
                              <Link
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#1D1D1F] hover:bg-[#0066cc] px-3 py-1 text-[10px] font-bold text-white transition-colors"
                              >
                                {item.cta}
                                <ArrowRight className="h-2.5 w-2.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Popover Footer Bar */}
              <div className="px-4 py-2.5 border-t border-black/[0.07] bg-[#FAF6F0] flex items-center justify-between gap-2 shrink-0">
                <Link
                  href="/help"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D1D1F] hover:text-[#0066cc] transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#C84200]" />
                  Help Center
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0066cc] hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  All FAQs →
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Contextual 1-Line Speech Bubble (above pill when closed) */}
        <AnimatePresence>
          {showSpeechBubble && (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-start gap-2 max-w-[280px] sm:max-w-[310px] rounded-2xl rounded-br-sm bg-white border border-black/10 px-3.5 py-2.5 shadow-lg"
            >
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-left text-[11px] font-semibold text-[#1D1D1F] leading-snug hover:text-[#0066cc] transition-colors cursor-pointer"
              >
                {routeTip.bubble}
              </button>
              <button
                type="button"
                onClick={() => setDismissedBubblePath(pathname)}
                className="rounded-full p-0.5 text-[#86868b] hover:text-[#1D1D1F] hover:bg-black/5 shrink-0 cursor-pointer"
                aria-label="Dismiss page tip"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Interactive Guide Pill (or Minimized Tiny Pixel Icon) */}
        {isMinimized ? (
          <button
            type="button"
            onClick={handleRestore}
            title="Ask Akshar & Setu"
            aria-label="Open Akshar and Setu Field Guide"
            className="flex items-center gap-1 rounded-full bg-[#1D1D1F] hover:bg-black text-[#FAF6F0] border border-white/15 px-2.5 py-2 shadow-xl transition-colors cursor-pointer"
          >
            <PixelPairSprite pixelSize={1.8} />
          </button>
        ) : (
          <div className="flex items-center rounded-full bg-[#1D1D1F] text-[#FAF6F0] border border-white/15 shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-expanded={isOpen}
              aria-label="Toggle Akshar and Setu Field Guide"
              className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <span className="rounded-full bg-[#FAF6F0] px-1.5 py-0.5 inline-flex items-center">
                <PixelPairSprite
                  pixelSize={1.75}
                  setuPose={isOpen ? "READ" : "IDLE"}
                  aksharPose={isOpen ? "READ" : "IDLE"}
                />
              </span>
              <span className="flex flex-col text-left leading-none">
                <span className="text-xs font-bold tracking-tight text-white">
                  Ask Akshar &amp; Setu
                </span>
                <span className="text-[10px] text-[#FAF6F0]/65 mt-0.5 hidden sm:inline">
                  {routeTip.pageLabel} guide
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={handleMinimize}
              title="Minimize mascot guide"
              aria-label="Minimize Akshar and Setu guide"
              className="pr-2.5 pl-1.5 py-2.5 text-white/55 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-l border-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// COMPONENT C1: FooterMascotRunway (36px pixel runway on top of Footer.tsx)
// ---------------------------------------------------------------------------

const RUNWAY_QUIPS: readonly string[] = [
  "Setu: 'One last textbook drop before hostel curfew!'",
  "Akshar: 'Psst—keep your daily reading streak alive.'",
  "Setu: 'Zero shipping when you swap on campus!'",
  "Akshar: 'Donate finished notes via Vidya Daan.'",
]

export function FooterMascotRunway() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setuRef = useRef<HTMLDivElement>(null)
  const aksharRef = useRef<HTMLDivElement>(null)

  const [paused, setPaused] = useState(false)
  const [facingLeft, setFacingLeft] = useState(false)
  const [waveActive, setWaveActive] = useState(false)
  const [quipIndex, setQuipIndex] = useState(-1)

  const pausedRef = useRef(false)
  const waveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    pausedRef.current = paused || waveActive
  }, [paused, waveActive])

  useEffect(() => {
    return () => {
      if (waveTimerRef.current) {
        window.clearTimeout(waveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let x = 36
    let dir = 1
    let rafId = 0
    let lastTime = performance.now()
    const speedPxPerSec = 42
    const chaseGap = 38

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.08)
      lastTime = now

      const maxWidth = Math.max(container.clientWidth - 44, 120)

      if (!pausedRef.current) {
        x += dir * speedPxPerSec * dt
        if (x >= maxWidth) {
          x = maxWidth
          dir = -1
          setFacingLeft(true)
        } else if (x <= 12) {
          x = 12
          dir = 1
          setFacingLeft(false)
        }
      }

      const aksharX =
        dir === 1
          ? Math.max(4, x - chaseGap)
          : Math.min(maxWidth, x + chaseGap)

      if (setuRef.current) {
        setuRef.current.style.transform = `translate3d(${Math.round(x)}px, 0, 0)`
      }
      if (aksharRef.current) {
        aksharRef.current.style.transform = `translate3d(${Math.round(aksharX)}px, 0, 0)`
      }

      rafId = window.requestAnimationFrame(step)
    }

    rafId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  const handleRunwayClick = () => {
    setQuipIndex((i) => (i + 1) % RUNWAY_QUIPS.length)
    setWaveActive(true)
    if (waveTimerRef.current) {
      window.clearTimeout(waveTimerRef.current)
    }
    waveTimerRef.current = window.setTimeout(() => {
      setWaveActive(false)
      waveTimerRef.current = null
    }, 2400)
  }

  const activePoseSetu: MascotPose = waveActive
    ? "SURPRISE"
    : paused
      ? "READ"
      : "RUN"

  const activePoseAkshar: MascotPose = waveActive
    ? "SURPRISE"
    : paused
      ? "IDLE"
      : "RUN"

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={handleRunwayClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleRunwayClick()
        }
      }}
      aria-label="Akshar and Setu pixel runway. Hover to pause or click to wave."
      className="relative h-9 w-full overflow-hidden border-b border-black/[0.08] bg-[#FAF6F0] cursor-pointer select-none"
    >
      {/* Subtle dotted sidewalk baseline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-1 border-b border-dashed border-black/15"
      />

      {/* Running / Reading Pixel Sprites */}
      <div
        ref={aksharRef}
        className="absolute bottom-0.5 left-0 will-change-transform"
        style={{ transform: "translate3d(4px, 0, 0)" }}
      >
        <AnimatedMascotSprite
          character="akshar"
          pose={activePoseAkshar}
          pixelSize={2.25}
          flip={facingLeft}
          animate={!paused && !waveActive}
        />
      </div>

      <div
        ref={setuRef}
        className="absolute bottom-0.5 left-0 will-change-transform"
        style={{ transform: "translate3d(42px, 0, 0)" }}
      >
        <AnimatedMascotSprite
          character="setu"
          pose={activePoseSetu}
          pixelSize={2.25}
          flip={paused ? !facingLeft : facingLeft}
          animate={!paused && !waveActive}
        />
      </div>

      {/* Inline Quip or Quiet Label */}
      <div className="pointer-events-none relative z-10 flex h-full items-center justify-end px-4 md:px-8">
        <span className="rounded-full bg-[#FAF6F0]/90 backdrop-blur-xs border border-black/[0.07] px-2.5 py-0.5 text-[10px] font-bold text-[#52525b] truncate max-w-[72vw] sm:max-w-none">
          {quipIndex >= 0 && (waveActive || paused)
            ? RUNWAY_QUIPS[quipIndex]
            : paused
              ? "Akshar & Setu paused for a quick read · Click to wave"
              : "Akshar & Setu on campus book patrol"}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// COMPONENT C2: MascotCalloutCard (Editorial cameo for FAQ, Help & 404)
// ---------------------------------------------------------------------------

export interface MascotCalloutCardProps {
  variant?: "faq" | "help" | "not-found" | "custom"
  badge?: string
  title?: string
  message?: string
  handwrittenNote?: string
  actionHref?: string
  actionLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  className?: string
}

const CALLOUT_PRESETS: Record<
  "faq" | "help" | "not-found",
  {
    badge: string
    title: string
    message: string
    handwrittenNote: string
    setuPose: MascotPose
    aksharPose: MascotPose
    actionHref?: string
    actionLabel?: string
    secondaryHref?: string
    secondaryLabel?: string
  }
> = {
  faq: {
    badge: "AKSHAR & SETU · QUICK BRIEF",
    title: "Got questions about swaps, ISBN scans, or streaks?",
    message:
      "Akshar tracks condition grades, XP rules, and Vidya Daan donations; Setu knows every shortcut for campus handoffs and Sabha codes. Search above or tap either mascot to say hi.",
    handwrittenNote: "no fine print, just straight answers.",
    setuPose: "IDLE",
    aksharPose: "READ",
    actionHref: "/catalog/new",
    actionLabel: "List a Book",
    secondaryHref: "/help",
    secondaryLabel: "Browse Help Guides",
  },
  help: {
    badge: "AKSHAR & SETU · STACK KEEPERS",
    title: "Lost in the 13 documentation shelves?",
    message:
      "Start with Getting Started if you're listing your first textbook, or jump straight to XP & Levels to see how daily reading streaks and Vidya Daan donations level up your profile.",
    handwrittenNote: "we're always parked in the bottom corner too!",
    setuPose: "RUN",
    aksharPose: "READ",
    actionHref: "/faq",
    actionLabel: "Jump to Quick FAQ",
    secondaryHref: "/support",
    secondaryLabel: "Open Support Ticket",
  },
  "not-found": {
    badge: "ERROR 404 · MISSING FROM THE STACKS",
    title: "Akshar checked A–Z... Setu might have run off with this page.",
    message:
      "The book listing, profile handle, or guide you opened isn't on this shelf anymore. Head back to the catalog or let Setu sprint you home.",
    handwrittenNote: "oops — wrong aisle!",
    setuPose: "HIDE",
    aksharPose: "CONFUSED",
  },
}

export function MascotCalloutCard({
  variant = "faq",
  badge,
  title,
  message,
  handwrittenNote,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
  className = "",
}: MascotCalloutCardProps) {
  const preset =
    variant === "custom" ? CALLOUT_PRESETS.faq : CALLOUT_PRESETS[variant]
  const [poked, setPoked] = useState(false)

  const resolvedBadge = badge ?? preset.badge
  const resolvedTitle = title ?? preset.title
  const resolvedMessage = message ?? preset.message
  const resolvedNote = handwrittenNote ?? preset.handwrittenNote
  const resolvedActionHref = actionHref ?? preset.actionHref
  const resolvedActionLabel = actionLabel ?? preset.actionLabel
  const resolvedSecondaryHref = secondaryHref ?? preset.secondaryHref
  const resolvedSecondaryLabel = secondaryLabel ?? preset.secondaryLabel

  return (
    <div
      className={`rounded-2xl bg-white border border-black/[0.07] shadow-sm p-5 sm:p-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Interactive Pixel Pair Stage */}
        <button
          type="button"
          onClick={() => setPoked((p) => !p)}
          title="Click Akshar & Setu"
          className="self-start sm:self-center flex items-end justify-center gap-2 rounded-2xl bg-[#FAF6F0] border border-black/[0.07] px-4 py-3 shrink-0 hover:border-[#C84200]/40 transition-colors cursor-pointer"
        >
          <AnimatedMascotSprite
            character="akshar"
            pose={poked ? "SURPRISE" : preset.aksharPose}
            pixelSize={3.25}
          />
          <AnimatedMascotSprite
            character="setu"
            pose={poked ? "SNEAK" : preset.setuPose}
            pixelSize={3.25}
            flip={variant === "not-found" ? !poked : poked}
          />
        </button>

        {/* Copy & Actions */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-silkscreen text-[10px] tracking-wider uppercase text-[#C4420C]">
              {resolvedBadge}
            </span>
            {resolvedNote && (
              <span className="font-caveat text-base text-[#0B8577] leading-none">
                — {poked ? "hey, that tickles!" : resolvedNote}
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#1D1D1F]">
            {resolvedTitle}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
            {resolvedMessage}
          </p>

          {(resolvedActionHref || resolvedSecondaryHref) && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {resolvedActionHref && resolvedActionLabel && (
                <Link
                  href={resolvedActionHref}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] hover:bg-[#C84200] px-4 py-1.5 text-xs font-bold text-white transition-colors"
                >
                  {resolvedActionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
              {resolvedSecondaryHref && resolvedSecondaryLabel && (
                <Link
                  href={resolvedSecondaryHref}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F0] hover:bg-[#e8e8ed] border border-black/[0.07] px-4 py-1.5 text-xs font-bold text-[#1D1D1F] transition-colors"
                >
                  {resolvedSecondaryLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
