"use client"

import type { BadgeRarity } from "@/lib/gamification"
import { resolveBadgeSpec } from "@/lib/badgeRegistry"

const RARITY_PALETTE: Record<
  BadgeRarity,
  {
    primary: string
    secondary: string
    accent: string
    ringOuter: string
    ringInner: string
    bg: string
  }
> = {
  COMMON: {
    primary: "#1d1d1f",
    secondary: "#6e6e73",
    accent: "#86868b",
    ringOuter: "#d2d2d7",
    ringInner: "#e8e8ed",
    bg: "#f5f5f7",
  },
  UNCOMMON: {
    primary: "#065f46",
    secondary: "#10b981",
    accent: "#34d399",
    ringOuter: "#34d399",
    ringInner: "#a7f3d0",
    bg: "#ecfdf5",
  },
  RARE: {
    primary: "#0052a3",
    secondary: "#0066cc",
    accent: "#60a5fa",
    ringOuter: "#3b82f6",
    ringInner: "#bfdbfe",
    bg: "#eff6ff",
  },
  EPIC: {
    primary: "#5b21b6",
    secondary: "#7c3aed",
    accent: "#c084fc",
    ringOuter: "#8b5cf6",
    ringInner: "#ddd6fe",
    bg: "#f5f3ff",
  },
  LEGENDARY: {
    primary: "#92400e",
    secondary: "#d97706",
    accent: "#fbbf24",
    ringOuter: "#f59e0b",
    ringInner: "#fde68a",
    bg: "#fffbeb",
  },
  MYTHIC: {
    primary: "#9f1239",
    secondary: "#e11d48",
    accent: "#fbbf24",
    ringOuter: "#f43f5e",
    ringInner: "#fecdd3",
    bg: "#fff1f2",
  },
}

export function VectorBadgeArtwork({
  code,
  name,
  category,
  rarity = "COMMON",
  unlocked = true,
  size = 60,
}: {
  code?: string | null
  name?: string | null
  category: string
  rarity?: string
  unlocked?: boolean
  size?: number
}) {
  const spec = resolveBadgeSpec({ code, name, category, rarity })
  const normRarity = (
    RARITY_PALETTE[rarity as BadgeRarity] ? rarity : spec.rarity || "COMMON"
  ) as BadgeRarity
  const p = RARITY_PALETTE[normRarity]
  const motif = spec.motif

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none transition-transform duration-300 ${
        unlocked ? "" : "opacity-55 grayscale"
      }`}
      role="img"
      aria-label={name || spec.name}
    >
      {/* 1. Rarity-Specific Outer Frame */}
      {normRarity === "MYTHIC" && (
        <polygon
          points="36,2 44,10 56,8 58,20 68,28 62,40 66,52 54,56 48,68 36,64 24,68 18,56 6,52 10,40 4,28 14,20 16,8 28,10"
          fill={p.bg}
          stroke={p.ringOuter}
          strokeWidth="2.2"
        />
      )}

      {normRarity === "LEGENDARY" && (
        <polygon
          points="36,3 45,9 56,9 61,19 69,27 65,38 67,49 58,56 51,66 40,65 36,69 32,65 21,66 14,56 5,49 7,38 3,27 11,19 16,9 27,9"
          fill={p.bg}
          stroke={p.ringOuter}
          strokeWidth="2.2"
        />
      )}

      {normRarity === "EPIC" && (
        <polygon
          points="36,4 58,15 66,36 58,57 36,68 14,57 6,36 14,15"
          fill={p.bg}
          stroke={p.ringOuter}
          strokeWidth="2.2"
        />
      )}

      {(normRarity === "RARE" ||
        normRarity === "UNCOMMON" ||
        normRarity === "COMMON") && (
        <circle
          cx="36"
          cy="36"
          r="31"
          fill={p.bg}
          stroke={p.ringOuter}
          strokeWidth={normRarity === "COMMON" ? "2" : "2.5"}
        />
      )}

      {/* Inner Filigree Ring */}
      <circle
        cx="36"
        cy="36"
        r="25.5"
        fill={p.bg}
        stroke={p.primary}
        strokeWidth="1.4"
        strokeDasharray={
          normRarity === "LEGENDARY" || normRarity === "MYTHIC"
            ? "3 2"
            : normRarity === "RARE"
            ? "5 2"
            : undefined
        }
        opacity="0.38"
      />

      {/* Corner / Cardinal Jewels for Rare+ */}
      {(normRarity === "RARE" ||
        normRarity === "EPIC" ||
        normRarity === "LEGENDARY" ||
        normRarity === "MYTHIC") && (
        <g fill={p.accent}>
          <circle cx="36" cy="9.5" r="2" />
          <circle cx="36" cy="62.5" r="2" />
          <circle cx="9.5" cy="36" r="2" />
          <circle cx="62.5" cy="36" r="2" />
        </g>
      )}

      {/* 2. Unique Achievement Vector Motif */}
      <g
        stroke={p.primary}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {motif === "open_page" && (
          <>
            <path
              d="M20 26C25 24 31 24 36 27C41 24 47 24 52 26V46C47 44 41 44 36 47C31 44 25 44 20 46V26Z"
              fill={p.secondary}
              fillOpacity="0.18"
            />
            <path d="M36 27V47" />
          </>
        )}

        {motif === "bookmark_finish" && (
          <>
            <path
              d="M25 20H47V52L36 44L25 52V20Z"
              fill={p.secondary}
              fillOpacity="0.22"
            />
            <path d="M31 31L35 35L42 27" />
          </>
        )}

        {motif === "book_stack" && (
          <>
            <rect
              x="21"
              y="22"
              width="30"
              height="7"
              rx="2"
              fill={p.secondary}
              fillOpacity="0.2"
            />
            <rect
              x="19"
              y="32"
              width="34"
              height="7"
              rx="2"
              fill={p.secondary}
              fillOpacity="0.3"
            />
            <rect
              x="22"
              y="42"
              width="28"
              height="7"
              rx="2"
              fill={p.secondary}
              fillOpacity="0.18"
            />
          </>
        )}

        {motif === "library_arch" && (
          <>
            <path
              d="M20 49H52M23 49V31M29 49V31M43 49V31M49 49V31"
              strokeWidth="2"
            />
            <path
              d="M19 31L36 20L53 31H19Z"
              fill={p.secondary}
              fillOpacity="0.24"
            />
            <circle cx="36" cy="27" r="2" fill={p.primary} />
          </>
        )}

        {motif === "crown_tome" && (
          <>
            <path
              d="M22 31L26 21L36 27L46 21L50 31H22Z"
              fill={p.accent}
              fillOpacity="0.45"
            />
            <path
              d="M21 35C26 33.5 31 33.5 36 36C41 33.5 46 33.5 51 35V49C46 47.5 41 47.5 36 50C31 47.5 26 47.5 21 49V35Z"
              fill={p.secondary}
              fillOpacity="0.22"
            />
            <path d="M36 36V50" />
          </>
        )}

        {motif === "owl_moon" && (
          <>
            <path
              d="M42 21C35 22 30 28 31 36C32 43 38 48 46 47C40 51 31 50 26 44C21 38 22 28 28 23C32 20 37 19.5 42 21Z"
              fill={p.secondary}
              fillOpacity="0.24"
            />
            <circle cx="44" cy="28" r="2" fill={p.primary} />
            <circle cx="49" cy="35" r="1.5" fill={p.secondary} />
          </>
        )}

        {(motif === "flame_streak" || motif === "eternal_torch") && (
          <>
            <path
              d="M36 18C36 18 48 28 46 40C44.5 47.5 39 51 36 51C33 51 27.5 47.5 26 40C24 28 36 18 36 18Z"
              fill={p.secondary}
              fillOpacity="0.25"
            />
            <path
              d="M36 30C36 30 41 35 40 41C39 45 36 47 36 47C36 47 33 45 32 41C31 35 36 30 36 30Z"
              fill={p.accent}
              fillOpacity="0.45"
            />
          </>
        )}

        {motif === "hourglass_century" && (
          <>
            <path d="M24 20H48M24 52H48" />
            <path
              d="M26 20C26 28 36 32 36 36C36 40 26 44 26 52H46C46 44 36 40 36 36C36 32 46 28 46 20H26Z"
              fill={p.secondary}
              fillOpacity="0.22"
            />
          </>
        )}

        {(motif === "quill_scroll" || motif === "inkwell_feather") && (
          <>
            <path
              d="M24 47L28 35L43 20C46 18 50 20 49 24L34 39L24 47Z"
              fill={p.secondary}
              fillOpacity="0.24"
            />
            <path d="M23 50H46" />
          </>
        )}

        {motif === "magnifying_lens" && (
          <>
            <circle
              cx="33"
              cy="33"
              r="10"
              fill={p.secondary}
              fillOpacity="0.2"
            />
            <path d="M40.5 40.5L50 50" strokeWidth="2.8" />
          </>
        )}

        {(motif === "voice_laurel" ||
          motif === "wax_seal" ||
          motif === "star_ribbon" ||
          motif === "five_star_medal") && (
          <>
            <polygon
              points="36,19 40.3,28.5 50.5,29.8 43,37 44.9,47.2 36,42.3 27.1,47.2 29,37 21.5,29.8 31.7,28.5"
              fill={p.secondary}
              fillOpacity="0.25"
            />
          </>
        )}

        {motif === "tag_bookmark" && (
          <>
            <path
              d="M22 25H38L50 37L38 49L22 33V25Z"
              fill={p.secondary}
              fillOpacity="0.22"
            />
            <circle cx="28" cy="31" r="2" fill={p.primary} />
          </>
        )}

        {motif === "handshake_coin" && (
          <>
            <circle
              cx="36"
              cy="36"
              r="13"
              fill={p.secondary}
              fillOpacity="0.22"
            />
            <path d="M31 30H41M31 35H41M34 30C38 30 39 38 33 39L41 44" />
          </>
        )}

        {motif === "shield_check" && (
          <>
            <path
              d="M36 19L50 25V35C50 44.5 44 51 36 54C28 51 22 44.5 22 35V25L36 19Z"
              fill={p.secondary}
              fillOpacity="0.22"
            />
            <path d="M29.5 36.5L34 41L43 32" strokeWidth="2.5" />
          </>
        )}

        {motif === "compass_globe" && (
          <>
            <circle
              cx="36"
              cy="36"
              r="14"
              fill={p.secondary}
              fillOpacity="0.18"
            />
            <polygon
              points="36,24 40,36 36,48 32,36"
              fill={p.secondary}
              fillOpacity="0.35"
            />
          </>
        )}

        {motif === "heart_book" && (
          <>
            <path
              d="M36 49C36 49 21 40 21 29C21 24.5 24.5 21 28.5 21C31.5 21 34 22.8 36 25.5C38 22.8 40.5 21 43.5 21C47.5 21 51 24.5 51 29C51 40 36 49 36 49Z"
              fill={p.secondary}
              fillOpacity="0.25"
            />
          </>
        )}

        {motif === "diya_lotus" && (
          <>
            <path
              d="M36 20C36 20 41 25.5 39.5 30C38.5 32.5 36 34 36 34C36 34 33.5 32.5 32.5 30C31 25.5 36 20 36 20Z"
              fill={p.accent}
              fillOpacity="0.6"
            />
            <path
              d="M20 38H52C50 46 44 50 36 50C28 50 22 46 20 38Z"
              fill={p.secondary}
              fillOpacity="0.28"
            />
          </>
        )}

        {(motif === "spark_hand" ||
          motif === "chat_lantern" ||
          motif === "circle_hands" ||
          motif === "temple_pillar" ||
          motif === "festival_banner" ||
          motif === "champion_chalice") && (
          <>
            <circle
              cx="29"
              cy="30"
              r="4.5"
              fill={p.secondary}
              fillOpacity="0.24"
            />
            <circle
              cx="43"
              cy="30"
              r="4.5"
              fill={p.secondary}
              fillOpacity="0.24"
            />
            <path d="M21 47C21 41.5 24.5 38.5 29.5 38.5C34.5 38.5 38 41.5 38 47" />
            <path d="M35 47C35 41.5 38.5 38.5 43.5 38.5C48.5 38.5 51 41.5 51 47" />
          </>
        )}

        {(motif === "chevron_5" ||
          motif === "chevron_10" ||
          motif === "crest_25" ||
          motif === "crest_50" ||
          motif === "crown_100" ||
          motif === "utsav_sun") && (
          <>
            <path
              d="M24 33L36 23L48 33"
              strokeWidth="2.8"
            />
            <path
              d="M24 42L36 32L48 42"
              strokeWidth="2.8"
            />
            <circle cx="36" cy="47" r="2.5" fill={p.secondary} />
          </>
        )}
      </g>
    </svg>
  )
}
