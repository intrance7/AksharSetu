import prisma from "@/lib/prisma"

/**
 * Returns the set of user IDs who mutually follow `viewerId` (plus `viewerId` itself).
 * Shanti Mode status (`isShantiModeActive`, `liveStatus`, and Shanti Together sanctuary)
 * is strictly visible only between mutual followers (and to the user themselves).
 */
export async function getMutualFollowIds(
  viewerId: string | null | undefined
): Promise<Set<string>> {
  if (!viewerId) return new Set<string>()

  const [following, followers] = await Promise.all([
    prisma.userFollow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    }),
    prisma.userFollow.findMany({
      where: { followingId: viewerId },
      select: { followerId: true },
    }),
  ])

  const followingSet = new Set(following.map((f) => f.followingId))
  const mutualIds = new Set<string>([viewerId])

  for (const f of followers) {
    if (followingSet.has(f.followerId)) {
      mutualIds.add(f.followerId)
    }
  }

  return mutualIds
}

export async function areMutualFollowers(
  viewerId: string | null | undefined,
  targetUserId: string
): Promise<boolean> {
  if (!viewerId) return false
  if (viewerId === targetUserId) return true

  const count = await prisma.userFollow.count({
    where: {
      OR: [
        { followerId: viewerId, followingId: targetUserId },
        { followerId: targetUserId, followingId: viewerId },
      ],
    },
  })

  return count === 2
}
