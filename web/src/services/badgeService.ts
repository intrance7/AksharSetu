import prisma from "@/lib/prisma"

const DEFAULT_BADGES = [
  {
    name: "First Donation",
    description: "Donated your first book to spread literacy in the community.",
    category: "DONATION",
    iconUrl: "/badges/first_donation.jpg",
    requirementThreshold: 1,
  },
  {
    name: "Library Builder",
    description: "Donated 5 or more books or curated an active digital shelf.",
    category: "DONATION",
    iconUrl: "/badges/library_builder.jpg",
    requirementThreshold: 5,
  },
  {
    name: "Shanti Scholar",
    description: "Completed your first mindful Shanti Mode reading session or literary highlight.",
    category: "COMMUNITY",
    iconUrl: "/badges/community_pioneer.jpg",
    requirementThreshold: 1,
  },
  {
    name: "Community Pioneer",
    description: "Completed 5 Shanti focus sessions or literary annotations.",
    category: "COMMUNITY",
    iconUrl: "/badges/community_pioneer.jpg",
    requirementThreshold: 5,
  },
  {
    name: "Trusted Reader",
    description: "Completed a verified book exchange, sale, or profile quote setup.",
    category: "TRUST",
    iconUrl: "/badges/trusted_reader.jpg",
    requirementThreshold: 1,
  },
]

export async function ensureDefaultBadges() {
  const existing = await prisma.badge.findMany()
  if (existing.length >= 4) return existing

  const existingNames = new Set(existing.map((b) => b.name.toLowerCase()))
  for (const def of DEFAULT_BADGES) {
    if (!existingNames.has(def.name.toLowerCase())) {
      await prisma.badge.create({ data: def })
    }
  }
  return prisma.badge.findMany({ orderBy: { requirementThreshold: "asc" } })
}

export async function checkAndAwardBadges(userId: string) {
  if (!userId) return []

  const allBadges = await ensureDefaultBadges()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: true,
      books: true,
      donations: true,
      readingSessions: true,
      libraryBooks: true,
      bookNotes: true,
    },
  })

  if (!user) return []

  const currentBadgeIds = new Set(user.badges.map((ub) => ub.badgeId))

  const donatedBooksCount = Math.max(
    user.donations.length,
    user.books.filter((b) => b.status === "DONATED").length
  )
  const communityActionsCount =
    user.readingSessions.length + user.bookNotes.length + Math.floor(user.libraryBooks.length / 2)
  const trustScoreQualifies =
    user.emailVerified != null ||
    user.booksSold + user.successfulExchanges >= 1 ||
    Boolean(user.favoriteQuote && user.bio)

  const newlyUnlocked: typeof allBadges = []

  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue

    let qualifies = false

    if (badge.category === "DONATION") {
      if (donatedBooksCount >= badge.requirementThreshold) qualifies = true
    } else if (badge.category === "COMMUNITY") {
      if (communityActionsCount >= badge.requirementThreshold) qualifies = true
    } else if (badge.category === "TRUST") {
      if (trustScoreQualifies && badge.requirementThreshold <= 1) qualifies = true
      if (user.booksSold + user.successfulExchanges >= badge.requirementThreshold) qualifies = true
    }

    if (qualifies) {
      newlyUnlocked.push(badge)
    }
  }

  if (newlyUnlocked.length > 0) {
    await prisma.userBadge.createMany({
      data: newlyUnlocked.map((b) => ({
        userId: user.id,
        badgeId: b.id,
      })),
      skipDuplicates: true,
    })

    await prisma.notification.createMany({
      data: newlyUnlocked.map((b) => ({
        userId: user.id,
        type: "BADGE_EARNED",
        message: `Achievement Unlocked: "${b.name}"! View your new badge.`,
        link: "/badges",
      })),
    })
  }

  return newlyUnlocked
}
