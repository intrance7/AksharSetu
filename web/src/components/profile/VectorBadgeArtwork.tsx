"use client"

import type { BadgeRarity } from "@/lib/gamification"

const RARITY_PALETTE: Record<
  BadgeRarity,
  { primary: string; secondary: string; ring: string; bg: string }
> = {
  COMMON: {
    primary: "#1d1d1f",
    secondary: "#86868b",
    ring: "#d2d2d7",
    bg: "#f5f5f7",
  },
  UNCOMMON: {
    primary: "#047857",
    secondary: "#10b981",
    ring: "#6ee7b7",
    bg: "#ecfdf5",
  },
  RARE: {
    primary: "#0066cc",
    secondary: "#3b82f6",
    ring: "#93c5fd",
    bg: "#eff6ff",
  },
  EPIC: {
    primary: "#6d28d9",
    secondary: "#a855f7",
    ring: "#d8b4fe",
    bg: "#faf5ff",
  },
  LEGENDARY: {
    primary: "#b45309",
    secondary: "#f59e0b",
    ring: "#fcd34d",
    bg: "#fffbeb",
  },
  MYTHIC: {
    primary: "#be123c",
    secondary: "#f43f5e",
    ring: "#fda4af",
    bg: "#fff1f2",
  },
}

export function VectorBadgeArtwork({
  category,
  rarity = "COMMON",
  unlocked = true,
  size = 56,
}: {
  category: string
  rarity?: string
  unlocked?: boolean
  size?: number
}) {
  const normRarity = (
    RARITY_PALETTE[rarity as BadgeRarity] ? rarity : "COMMON"
  ) as BadgeRarity
  const palette = RARITY_PALETTE[normRarity]
  const cat = (category || "READING").toUpperCase()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={unlocked ? "" : "opacity-55 grayscale"}
      aria-hidden="true"
    >
      {/* Outer Medallion Shield / Crest */}
      <circle
        cx="32"
        cy="32"
        r="29"
        fill={palette.bg}
        stroke={palette.ring}
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke={palette.primary}
        strokeWidth="1.5"
        strokeDasharray={normRarity === "MYTHIC" || normRarity === "LEGENDARY" ? "3 2" : undefined}
        opacity="0.35"
      />

      {/* Category-Specific Vector Glyph */}
      {cat === "READING" && (
        <g stroke={palette.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M18 23C22 21.5 27 21.5 32 24C37 21.5 42 21.5 46 23V42C42 40.5 37 40.5 32 43C27 40.5 22 40.5 18 42V23Z"
            fill={palette.secondary}
            fillOpacity="0.18"
          />
          <path d="M32 24V43" />
          <circle cx="32" cy="17" r="2" fill={palette.secondary} stroke="none" />
        </g>
      )}

      {cat === "REVIEW" && (
        <g stroke={palette.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M22 42L25 32L39 18L45 24L31 38L22 42Z"
            fill={palette.secondary}
            fillOpacity="0.2"
          />
          <path d="M35 22L41 28" />
        </g>
      )}

      {(cat === "MARKETPLACE" || cat === "TRUST") && (
        <g stroke={palette.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M32 16L45 22V32C45 40.5 39.5 46.5 32 49C24.5 46.5 19 40.5 19 32V22L32 16Z"
            fill={palette.secondary}
            fillOpacity="0.18"
          />
          <path d="M26 32.5L30 36.5L38.5 28" />
        </g>
      )}

      {cat === "DONATION" && (
        <g stroke={palette.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M32 44C32 44 20 36.5 20 26.5C20 22.5 23 19.5 26.5 19.5C29 19.5 31 21 32 23C33 21 35 19.5 37.5 19.5C41 19.5 44 22.5 44 26.5C44 36.5 32 44 32 44Z"
            fill={palette.secondary}
            fillOpacity="0.22"
          />
        </g>
      )}

      {cat === "COMMUNITY" && (
        <g stroke={palette.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle
            cx="26"
            cy="27"
            r="4.5"
            fill={palette.secondary}
            fillOpacity="0.2"
          />
          <circle
            cx="38"
            cy="27"
            r="4.5"
            fill={palette.secondary}
            fillOpacity="0.2"
          />
          <path d="M18 42C18 37.5 21.5 34.5 26 34.5C30.5 34.5 34 37.5 34 42" />
          <path d="M32 42C32 37.5 35 34.5 39 34.5C43 34.5 46 37.5 46 42" />
        </g>
      )}

      {(cat === "PROGRESSION" || cat === "SEASONAL") && (
        <g stroke={palette.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon
            points="32,16 36.2,25.2 46,26.4 38.8,33.2 40.6,43 32,38.2 23.4,43 25.2,33.2 18,26.4 27.8,25.2"
            fill={palette.secondary}
            fillOpacity="0.24"
          />
        </g>
      )}
    </svg>
  )
}
