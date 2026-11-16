import type { BadgeRarity } from "./gamification"

export interface BadgeArtworkSpec {
  code: string
  name: string
  category:
    | "READING"
    | "REVIEW"
    | "MARKETPLACE"
    | "DONATION"
    | "COMMUNITY"
    | "PROGRESSION"
    | "SEASONAL"
  rarity: BadgeRarity
  motif: string
  svgPath: string
}

export const BADGE_ARTWORK_REGISTRY: Record<string, BadgeArtworkSpec> = {
  // READING
  first_page: {
    code: "first_page",
    name: "First Page",
    category: "READING",
    rarity: "COMMON",
    motif: "open_page",
    svgPath: "/badges/reading/first_page.svg",
  },
  first_finish: {
    code: "first_finish",
    name: "First Finish",
    category: "READING",
    rarity: "COMMON",
    motif: "bookmark_finish",
    svgPath: "/badges/reading/first_finish.svg",
  },
  bookworm: {
    code: "bookworm",
    name: "Bookworm",
    category: "READING",
    rarity: "UNCOMMON",
    motif: "book_stack",
    svgPath: "/badges/reading/bookworm.svg",
  },
  bibliophile: {
    code: "bibliophile",
    name: "Bibliophile",
    category: "READING",
    rarity: "EPIC",
    motif: "library_arch",
    svgPath: "/badges/reading/bibliophile.svg",
  },
  literary_legend: {
    code: "literary_legend",
    name: "Literary Legend",
    category: "READING",
    rarity: "MYTHIC",
    motif: "crown_tome",
    svgPath: "/badges/reading/literary_legend.svg",
  },
  night_owl: {
    code: "night_owl",
    name: "Night Owl",
    category: "READING",
    rarity: "RARE",
    motif: "owl_moon",
    svgPath: "/badges/reading/night_owl.svg",
  },
  consistent_reader: {
    code: "consistent_reader",
    name: "Consistent Reader",
    category: "READING",
    rarity: "RARE",
    motif: "flame_streak",
    svgPath: "/badges/reading/consistent_reader.svg",
  },
  unstoppable_reader: {
    code: "unstoppable_reader",
    name: "Unstoppable Reader",
    category: "READING",
    rarity: "LEGENDARY",
    motif: "eternal_torch",
    svgPath: "/badges/reading/unstoppable_reader.svg",
  },
  century_reader: {
    code: "century_reader",
    name: "Century Reader",
    category: "READING",
    rarity: "LEGENDARY",
    motif: "hourglass_century",
    svgPath: "/badges/reading/century_reader.svg",
  },

  // REVIEWS
  first_impression: {
    code: "first_impression",
    name: "First Impression",
    category: "REVIEW",
    rarity: "COMMON",
    motif: "quill_scroll",
    svgPath: "/badges/reviews/first_impression.svg",
  },
  critical_thinker: {
    code: "critical_thinker",
    name: "Critical Thinker",
    category: "REVIEW",
    rarity: "RARE",
    motif: "magnifying_lens",
    svgPath: "/badges/reviews/critical_thinker.svg",
  },
  literary_critic: {
    code: "literary_critic",
    name: "Literary Critic",
    category: "REVIEW",
    rarity: "EPIC",
    motif: "inkwell_feather",
    svgPath: "/badges/reviews/literary_critic.svg",
  },
  helpful_voice: {
    code: "helpful_voice",
    name: "Helpful Voice",
    category: "REVIEW",
    rarity: "UNCOMMON",
    motif: "voice_laurel",
    svgPath: "/badges/reviews/helpful_voice.svg",
  },
  trusted_reviewer: {
    code: "trusted_reviewer",
    name: "Trusted Reviewer",
    category: "REVIEW",
    rarity: "LEGENDARY",
    motif: "wax_seal",
    svgPath: "/badges/reviews/trusted_reviewer.svg",
  },
  community_favourite: {
    code: "community_favourite",
    name: "Community Favourite",
    category: "REVIEW",
    rarity: "EPIC",
    motif: "star_ribbon",
    svgPath: "/badges/reviews/community_favourite.svg",
  },

  // MARKETPLACE & DONATION
  first_listing: {
    code: "first_listing",
    name: "First Listing",
    category: "MARKETPLACE",
    rarity: "COMMON",
    motif: "tag_bookmark",
    svgPath: "/badges/marketplace/first_listing.svg",
  },
  first_sale: {
    code: "first_sale",
    name: "First Sale",
    category: "MARKETPLACE",
    rarity: "UNCOMMON",
    motif: "handshake_coin",
    svgPath: "/badges/marketplace/first_sale.svg",
  },
  trusted_seller: {
    code: "trusted_seller",
    name: "Trusted Seller",
    category: "MARKETPLACE",
    rarity: "EPIC",
    motif: "shield_check",
    svgPath: "/badges/marketplace/trusted_seller.svg",
  },
  marketplace_veteran: {
    code: "marketplace_veteran",
    name: "Marketplace Veteran",
    category: "MARKETPLACE",
    rarity: "LEGENDARY",
    motif: "compass_globe",
    svgPath: "/badges/marketplace/marketplace_veteran.svg",
  },
  generous_collector: {
    code: "generous_collector",
    name: "Generous Collector",
    category: "DONATION",
    rarity: "UNCOMMON",
    motif: "heart_book",
    svgPath: "/badges/marketplace/generous_collector.svg",
  },
  vidya_daan_patron: {
    code: "vidya_daan_patron",
    name: "Vidya Daan Patron",
    category: "DONATION",
    rarity: "LEGENDARY",
    motif: "diya_lotus",
    svgPath: "/badges/marketplace/vidya_daan_patron.svg",
  },
  five_star_seller: {
    code: "five_star_seller",
    name: "Five-Star Seller",
    category: "MARKETPLACE",
    rarity: "RARE",
    motif: "five_star_medal",
    svgPath: "/badges/marketplace/five_star_seller.svg",
  },

  // COMMUNITY
  first_contribution: {
    code: "first_contribution",
    name: "First Contribution",
    category: "COMMUNITY",
    rarity: "COMMON",
    motif: "spark_hand",
    svgPath: "/badges/community/first_contribution.svg",
  },
  conversation_starter: {
    code: "conversation_starter",
    name: "Conversation Starter",
    category: "COMMUNITY",
    rarity: "COMMON",
    motif: "chat_lantern",
    svgPath: "/badges/community/conversation_starter.svg",
  },
  helpful_member: {
    code: "helpful_member",
    name: "Helpful Member",
    category: "COMMUNITY",
    rarity: "RARE",
    motif: "circle_hands",
    svgPath: "/badges/community/helpful_member.svg",
  },
  community_pillar: {
    code: "community_pillar",
    name: "Community Pillar",
    category: "COMMUNITY",
    rarity: "EPIC",
    motif: "temple_pillar",
    svgPath: "/badges/community/community_pillar.svg",
  },
  event_participant: {
    code: "event_participant",
    name: "Event Participant",
    category: "COMMUNITY",
    rarity: "UNCOMMON",
    motif: "festival_banner",
    svgPath: "/badges/community/event_participant.svg",
  },
  community_champion: {
    code: "community_champion",
    name: "Community Champion",
    category: "COMMUNITY",
    rarity: "MYTHIC",
    motif: "champion_chalice",
    svgPath: "/badges/community/community_champion.svg",
  },

  // PROGRESSION
  level_5: {
    code: "level_5",
    name: "Rising Scholar (Level 5)",
    category: "PROGRESSION",
    rarity: "UNCOMMON",
    motif: "chevron_5",
    svgPath: "/badges/progression/level_5.svg",
  },
  level_10: {
    code: "level_10",
    name: "Book Enthusiast (Level 10)",
    category: "PROGRESSION",
    rarity: "RARE",
    motif: "chevron_10",
    svgPath: "/badges/progression/level_10.svg",
  },
  level_25: {
    code: "level_25",
    name: "Literary Luminary (Level 25)",
    category: "PROGRESSION",
    rarity: "LEGENDARY",
    motif: "crest_25",
    svgPath: "/badges/progression/level_25.svg",
  },
  level_50: {
    code: "level_50",
    name: "Grand Bibliophile (Level 50)",
    category: "PROGRESSION",
    rarity: "LEGENDARY",
    motif: "crest_50",
    svgPath: "/badges/progression/level_50.svg",
  },
  level_100: {
    code: "level_100",
    name: "Legendary Scholar (Level 100)",
    category: "PROGRESSION",
    rarity: "MYTHIC",
    motif: "crown_100",
    svgPath: "/badges/progression/level_100.svg",
  },

  // SPECIAL / SEASONAL
  seasonal_vidya_utsav: {
    code: "seasonal_vidya_utsav",
    name: "Vidya Utsav 2026 Pioneer",
    category: "SEASONAL",
    rarity: "EPIC",
    motif: "utsav_sun",
    svgPath: "/badges/special/seasonal_vidya_utsav.svg",
  },
}

export const BADGE_ARTWORK_LIST: BadgeArtworkSpec[] = Object.values(
  BADGE_ARTWORK_REGISTRY
)

export function resolveBadgeSpec(badge: {
  code?: string | null
  name?: string | null
  category?: string | null
  rarity?: string | null
}): BadgeArtworkSpec {
  if (badge.code && BADGE_ARTWORK_REGISTRY[badge.code]) {
    return BADGE_ARTWORK_REGISTRY[badge.code]
  }
  const normName = (badge.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
  if (BADGE_ARTWORK_REGISTRY[normName]) {
    return BADGE_ARTWORK_REGISTRY[normName]
  }

  // Match legacy seeded names
  if (normName.includes("first_donation") || normName.includes("generous")) {
    return BADGE_ARTWORK_REGISTRY.generous_collector
  }
  if (normName.includes("library_builder")) {
    return BADGE_ARTWORK_REGISTRY.bookworm
  }
  if (normName.includes("trusted")) {
    return BADGE_ARTWORK_REGISTRY.trusted_seller
  }
  if (normName.includes("shanti") || normName.includes("first_step")) {
    return BADGE_ARTWORK_REGISTRY.first_page
  }

  const cat = (badge.category || "READING").toUpperCase() as any
  return {
    code: normName || "custom_badge",
    name: badge.name || "Achievement",
    category: cat,
    rarity: ((badge.rarity || "COMMON").toUpperCase() as BadgeRarity) || "COMMON",
    motif:
      cat === "REVIEW"
        ? "quill_scroll"
        : cat === "MARKETPLACE"
        ? "shield_check"
        : cat === "DONATION"
        ? "diya_lotus"
        : cat === "COMMUNITY"
        ? "temple_pillar"
        : cat === "PROGRESSION"
        ? "crest_25"
        : cat === "SEASONAL"
        ? "utsav_sun"
        : "open_page",
    svgPath: "/badges/reading/first_page.svg",
  }
}
