import prisma from "@/lib/prisma"

export async function checkAndAwardBadges(userId: string) {
  if (!userId) return

  // 1. Get the user and their current badges
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: true,
      books: {
        where: { status: 'DONATED' }
      },
      readingSessions: true
    }
  })

  if (!user) return

  const currentBadgeIds = new Set(user.badges.map(ub => ub.badgeId))
  
  // 2. Calculate stats
  const donationCount = user.books.length
  const readingSessionsCount = user.readingSessions.length
  
  const isVerified = user.emailVerified != null

  // 3. Fetch all possible badges
  const allBadges = await prisma.badge.findMany()

  const newBadgesToAward = []

  for (const badge of allBadges) {
    if (currentBadgeIds.has(badge.id)) continue // Already has it

    let qualifies = false

    if (badge.category === 'DONATION') {
      if (donationCount >= badge.requirementThreshold) {
        qualifies = true
      }
    } else if (badge.category === 'COMMUNITY') {
      if (readingSessionsCount >= badge.requirementThreshold) {
        qualifies = true
      }
    } else if (badge.category === 'TRUST') {
      if (badge.name === 'Trusted Member' && isVerified) {
        qualifies = true
      }
    }

    if (qualifies) {
      newBadgesToAward.push({
        userId: user.id,
        badgeId: badge.id
      })
    }
  }

  // 4. Award the new badges
  if (newBadgesToAward.length > 0) {
    await prisma.userBadge.createMany({
      data: newBadgesToAward,
      skipDuplicates: true
    })
    console.log(`Awarded ${newBadgesToAward.length} new badges to user ${userId}`)
  }
}
