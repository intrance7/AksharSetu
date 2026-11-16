export interface UserStatsInput {
  booksListed: number
  booksDonated: number
  badgesEarned: number
  readingMinutes: number
  libraryCount?: number
  booksCompleted?: number
  reviewsCount?: number
  booksSold?: number
  purchasesCount?: number
  clubPostsCount?: number
  bonusXP?: number
}

export interface ComputedProfileStats extends UserStatsInput {
  libraryCount: number
  totalXP: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  progressPercent: number
  rankTitle: string
  unlockedTitles: string[]
}

export const XP_REWARDS = {
  BOOK_COMPLETED: 100,
  REVIEW_PUBLISHED: 30,
  REVIEW_HELPFUL: 5,
  DAILY_READING_GOAL: 20,
  DAILY_CHECKIN: 25,
  WEEKLY_CHALLENGE: 100,
  BOOK_SOLD: 40,
  BOOK_PURCHASED: 20,
  BOOK_DONATED: 100,
  BOOK_LISTED: 25,
  READING_SESSION: 20,
  CLUB_CONTRIBUTION: 15,
} as const

export const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 100, title: "Legendary Scholar" },
  { minLevel: 75, title: "Grand Curator" },
  { minLevel: 50, title: "Bibliophile" },
  { minLevel: 30, title: "Literary Voyager" },
  { minLevel: 20, title: "Avid Reader" },
  { minLevel: 15, title: "Akshar Guardian" },
  { minLevel: 10, title: "Book Enthusiast" },
  { minLevel: 5, title: "Page Explorer" },
  { minLevel: 3, title: "Chapter Seeker" },
  { minLevel: 1, title: "Newcomer" },
]

export type BadgeRarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"

export const RARITY_CONFIG: Record<
  BadgeRarity,
  {
    label: string
    order: number
    bg: string
    border: string
    text: string
    badgeBg: string
    ring: string
  }
> = {
  COMMON: {
    label: "Common",
    order: 1,
    bg: "bg-white",
    border: "border-black/10",
    text: "text-[#86868b]",
    badgeBg: "bg-[#f5f5f7]",
    ring: "ring-black/5",
  },
  UNCOMMON: {
    label: "Uncommon",
    order: 2,
    bg: "bg-emerald-50/40",
    border: "border-emerald-500/30",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-100/80",
    ring: "ring-emerald-500/20",
  },
  RARE: {
    label: "Rare",
    order: 3,
    bg: "bg-[#0066cc]/[0.04]",
    border: "border-[#0066cc]/35",
    text: "text-[#0066cc]",
    badgeBg: "bg-[#0066cc]/10",
    ring: "ring-[#0066cc]/25",
  },
  EPIC: {
    label: "Epic",
    order: 4,
    bg: "bg-purple-50/50",
    border: "border-purple-500/35",
    text: "text-purple-700",
    badgeBg: "bg-purple-100",
    ring: "ring-purple-500/25",
  },
  LEGENDARY: {
    label: "Legendary",
    order: 5,
    bg: "bg-amber-50/60",
    border: "border-amber-500/45",
    text: "text-amber-700",
    badgeBg: "bg-amber-100",
    ring: "ring-amber-500/30",
  },
  MYTHIC: {
    label: "Mythic",
    order: 6,
    bg: "bg-rose-50/60",
    border: "border-rose-500/50",
    text: "text-rose-700",
    badgeBg: "bg-rose-100",
    ring: "ring-rose-500/35",
  },
}

export const BADGE_RARITY_META: Record<
  BadgeRarity,
  { label: string; bg: string; color: string; border: string }
> = {
  COMMON: {
    label: "Common",
    bg: "#f5f5f7",
    color: "#1d1d1f",
    border: "#d2d2d7",
  },
  UNCOMMON: {
    label: "Uncommon",
    bg: "#ecfdf5",
    color: "#065f46",
    border: "#34d399",
  },
  RARE: {
    label: "Rare",
    bg: "#eff6ff",
    color: "#0052a3",
    border: "#3b82f6",
  },
  EPIC: {
    label: "Epic",
    bg: "#f5f3ff",
    color: "#5b21b6",
    border: "#8b5cf6",
  },
  LEGENDARY: {
    label: "Legendary",
    bg: "#fffbeb",
    color: "#92400e",
    border: "#f59e0b",
  },
  MYTHIC: {
    label: "Mythic",
    bg: "#fff1f2",
    color: "#9f1239",
    border: "#f43f5e",
  },
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365] as const

export interface CosmeticItem {
  id: string
  type: "frame" | "banner" | "theme"
  key: string
  name: string
  description: string
  minLevel: number
  pointsCost: number
  previewClass: string
}

export const COSMETIC_CATALOG: CosmeticItem[] = [
  {
    id: "frame:classic",
    type: "frame",
    key: "classic",
    name: "Minimalist Ring",
    description: "Clean monochrome ring frame.",
    minLevel: 1,
    pointsCost: 0,
    previewClass: "ring-4 ring-[#1d1d1f]/20",
  },
  {
    id: "frame:cobalt",
    type: "frame",
    key: "cobalt",
    name: "Cobalt Pulse",
    description: "Signature AksharSetu cobalt blue halo.",
    minLevel: 2,
    pointsCost: 75,
    previewClass: "ring-4 ring-[#0066cc] shadow-[0_0_20px_rgba(0,102,204,0.35)]",
  },
  {
    id: "frame:saffron",
    type: "frame",
    key: "saffron",
    name: "Vidya Saffron",
    description: "Warm terracotta heritage border.",
    minLevel: 3,
    pointsCost: 100,
    previewClass: "ring-4 ring-[#C84200] shadow-[0_0_20px_rgba(200,66,0,0.35)]",
  },
  {
    id: "frame:emerald",
    type: "frame",
    key: "emerald",
    name: "Shanti Emerald",
    description: "Calm emerald aura for mindful readers.",
    minLevel: 5,
    pointsCost: 150,
    previewClass: "ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)]",
  },
  {
    id: "frame:gold",
    type: "frame",
    key: "gold",
    name: "Scholar's Gold",
    description: "Gilded prestige frame for top contributors.",
    minLevel: 10,
    pointsCost: 300,
    previewClass: "ring-4 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.5)]",
  },
  {
    id: "frame:mythic",
    type: "frame",
    key: "mythic",
    name: "Mythic Luminary",
    description: "High-contrast crimson & gold collector frame.",
    minLevel: 20,
    pointsCost: 500,
    previewClass: "ring-4 ring-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)]",
  },
  {
    id: "banner:obsidian",
    type: "banner",
    key: "obsidian",
    name: "Obsidian Ink",
    description: "Deep pitch-black minimalist study header.",
    minLevel: 1,
    pointsCost: 0,
    previewClass: "bg-[#000000]",
  },
  {
    id: "banner:cobalt_grid",
    type: "banner",
    key: "cobalt_grid",
    name: "Cobalt Blueprint",
    description: "Architectural dark navy & cobalt canvas.",
    minLevel: 2,
    pointsCost: 80,
    previewClass: "bg-[#071324]",
  },
  {
    id: "banner:library_dawn",
    type: "banner",
    key: "library_dawn",
    name: "Nalanda Terracotta",
    description: "Rich espresso & warm terracotta literary header.",
    minLevel: 4,
    pointsCost: 120,
    previewClass: "bg-[#1F110B]",
  },
  {
    id: "banner:emerald_grove",
    type: "banner",
    key: "emerald_grove",
    name: "Shanti Sanctuary",
    description: "Deep forest green focus canopy.",
    minLevel: 6,
    pointsCost: 160,
    previewClass: "bg-[#091E16]",
  },
]

export const PRESET_QUOTES: { quote: string; author: string }[] = [
  {
    quote:
      "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin",
  },
  {
    quote:
      "Where the mind is without fear and the head is held high, into that heaven of freedom, my Father, let my country awake.",
    author: "Rabindranath Tagore",
  },
  {
    quote:
      "One best book is equal to hundred good friends, but one good friend is equal to a library.",
    author: "Dr. A.P.J. Abdul Kalam",
  },
  {
    quote: "I have always imagined that Paradise will be a kind of library.",
    author: "Jorge Luis Borges",
  },
  {
    quote:
      "If there's a book that you want to read, but it hasn't been written yet, then you must write it.",
    author: "Toni Morrison",
  },
  {
    quote: "A book is a proof that humans are capable of working magic.",
    author: "Carl Sagan",
  },
]

export function xpRequiredForStep(level: number): number {
  return Math.round(100 * Math.pow(Math.max(1, level), 1.5))
}

export function getRankTitle(level: number): string {
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.minLevel) return entry.title
  }
  return "Newcomer"
}

export function getUnlockedTitles(level: number): string[] {
  return LEVEL_TITLES.filter((t) => level >= t.minLevel).map((t) => t.title)
}

export function calculateLevelFromXP(rawTotalXP: number) {
  const totalXP = Math.max(0, Math.round(rawTotalXP))
  let level = 1
  let remaining = totalXP
  let stepReq = xpRequiredForStep(level)

  while (remaining >= stepReq && level < 100) {
    remaining -= stepReq
    level += 1
    stepReq = xpRequiredForStep(level)
  }

  const progressPercent = Math.min(
    100,
    Math.round((remaining / Math.max(1, stepReq)) * 100)
  )

  return {
    totalXP,
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: stepReq,
    progressPercent,
    rankTitle: getRankTitle(level),
    unlockedTitles: getUnlockedTitles(level),
  }
}

export function computeUserStats(input: UserStatsInput): ComputedProfileStats {
  const libraryCount = input.libraryCount ?? 0
  const booksCompleted = input.booksCompleted ?? 0
  const reviewsCount = input.reviewsCount ?? 0
  const booksSold = input.booksSold ?? 0
  const purchasesCount = input.purchasesCount ?? 0
  const clubPostsCount = input.clubPostsCount ?? 0
  const bonusXP = input.bonusXP ?? 0

  const computedXP =
    input.booksListed * XP_REWARDS.BOOK_LISTED +
    input.booksDonated * XP_REWARDS.BOOK_DONATED +
    booksCompleted * XP_REWARDS.BOOK_COMPLETED +
    reviewsCount * XP_REWARDS.REVIEW_PUBLISHED +
    booksSold * XP_REWARDS.BOOK_SOLD +
    purchasesCount * XP_REWARDS.BOOK_PURCHASED +
    clubPostsCount * XP_REWARDS.CLUB_CONTRIBUTION +
    input.readingMinutes * 2 +
    input.badgesEarned * 50 +
    libraryCount * 20 +
    bonusXP

  const levelInfo = calculateLevelFromXP(computedXP)

  return {
    ...input,
    libraryCount,
    ...levelInfo,
  }
}
