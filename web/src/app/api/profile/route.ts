import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { invalidateCache } from "@/lib/fastCache"
import { invalidateCacheKey, invalidateCachePrefix } from "@/lib/cache"
import {
  ensureUserUsername,
  hasLegacyUuidSuffix,
  isReservedUsername,
  sanitizeUsername,
} from "@/lib/username"
import { checkAndAwardBadges } from "@/services/badgeService"
import {
  COSMETIC_CATALOG,
  calculateLevelFromXP,
  getUnlockedTitles,
} from "@/lib/gamification"

export const dynamic = "force-dynamic"

const SAFE_PROFILE_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  image: true,
  coverImage: true,
  profileFrame: true,
  profileTheme: true,
  selectedTitle: true,
  bio: true,
  favoriteQuote: true,
  quoteAuthor: true,
  location: true,
  latitude: true,
  longitude: true,
  liveStatus: true,
  isShantiModeActive: true,
  totalXP: true,
  aksharPoints: true,
  currentStreak: true,
  longestStreak: true,
  readingGoalBooks: true,
  unlockedCosmetics: true,
  isPublicProfile: true,
  showOnlineStatus: true,
  showReadingActivity: true,
  showContributionGraph: true,
  leaderboardOptOut: true,
} as const

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: SAFE_PROFILE_SELECT,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.username || hasLegacyUuidSuffix(user.username, user.id)) {
      const cleanUsername = await ensureUserUsername(
        user.id,
        user.name,
        user.email
      )
      return NextResponse.json({ ...user, username: cleanUsername })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    // 1. Pin / Unpin Achievement Badge (max 5 pinned)
    if (body.action === "pin_badge") {
      const { badgeId, isPinned } = body
      if (!badgeId || typeof badgeId !== "string") {
        return NextResponse.json({ error: "Missing badgeId" }, { status: 400 })
      }
      if (isPinned) {
        const pinnedCount = await prisma.userBadge.count({
          where: { userId, isPinned: true },
        })
        if (pinnedCount >= 5) {
          return NextResponse.json(
            { error: "You can pin up to 5 achievements to your showcase." },
            { status: 400 }
          )
        }
      }
      try {
        const updatedBadge = await prisma.userBadge.update({
          where: {
            userId_badgeId: {
              userId,
              badgeId,
            },
          },
          data: { isPinned: Boolean(isPinned) },
        })
        return NextResponse.json(updatedBadge)
      } catch (err: any) {
        if (err?.code === "P2025") {
          return NextResponse.json(
            { error: "Badge not unlocked yet" },
            { status: 404 }
          )
        }
        throw err
      }
    }

    // 2. Unlock or Equip Cosmetic with Akshar Points / Level
    if (body.action === "unlock_cosmetic") {
      const { cosmeticId } = body
      const item = COSMETIC_CATALOG.find((c) => c.id === cosmeticId)
      if (!item) {
        return NextResponse.json(
          { error: "Cosmetic item not found" },
          { status: 404 }
        )
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      })
      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const levelInfo = calculateLevelFromXP(currentUser.totalXP)
      const unlockedSet = new Set(currentUser.unlockedCosmetics || [])

      if (!unlockedSet.has(item.id)) {
        if (
          levelInfo.level < item.minLevel &&
          currentUser.aksharPoints < item.pointsCost
        ) {
          return NextResponse.json(
            {
              error: `Requires Level ${item.minLevel} or ${item.pointsCost} Akshar Points.`,
            },
            { status: 403 }
          )
        }

        const deductPoints =
          levelInfo.level >= item.minLevel ? 0 : item.pointsCost

        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: {
              aksharPoints: { decrement: deductPoints },
              unlockedCosmetics: {
                set: Array.from(new Set([...unlockedSet, item.id])),
              },
              ...(item.type === "frame" ? { profileFrame: item.key } : {}),
              ...(item.type === "banner" ? { coverImage: item.key } : {}),
            },
          })

          if (deductPoints > 0) {
            await tx.xpTransaction
              .create({
                data: {
                  userId,
                  eventType: "COSMETIC_UNLOCK",
                  idempotencyKey: `cosmetic:${userId}:${item.id}`,
                  xpAmount: 0,
                  pointsAmount: -deductPoints,
                  description: `Unlocked cosmetic "${item.name}"`,
                },
              })
              .catch(() => {})
          }
        })
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(item.type === "frame" ? { profileFrame: item.key } : {}),
            ...(item.type === "banner" ? { coverImage: item.key } : {}),
          },
        })
      }

      const refreshed = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          profileFrame: true,
          coverImage: true,
          aksharPoints: true,
          unlockedCosmetics: true,
        },
      })
      return NextResponse.json(refreshed)
    }

    // 3. Standard Profile & Privacy Update (Never accepts client XP / level / streak)
    const {
      bio,
      location,
      name,
      username,
      latitude,
      longitude,
      image,
      coverImage,
      profileFrame,
      profileTheme,
      selectedTitle,
      readingGoalBooks,
      favoriteQuote,
      quoteAuthor,
      liveStatus,
      isPublicProfile,
      showOnlineStatus,
      showReadingActivity,
      showContributionGraph,
      leaderboardOptOut,
    } = body

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, unlockedCosmetics: true },
    })
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    if (name !== undefined) updateData.name = String(name).trim().slice(0, 80)
    if (bio !== undefined) updateData.bio = String(bio).trim().slice(0, 600)
    if (location !== undefined)
      updateData.location = String(location).trim().slice(0, 100)
    if (latitude !== undefined) {
      if (latitude === null || latitude === "") {
        updateData.latitude = null
      } else {
        const parsedLat = Number(latitude)
        if (Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90) {
          updateData.latitude = parsedLat
        }
      }
    }
    if (longitude !== undefined) {
      if (longitude === null || longitude === "") {
        updateData.longitude = null
      } else {
        const parsedLng = Number(longitude)
        if (Number.isFinite(parsedLng) && parsedLng >= -180 && parsedLng <= 180) {
          updateData.longitude = parsedLng
        }
      }
    }
    if (image !== undefined) {
      updateData.image = image ? String(image).trim().slice(0, 2000000) : null
    }
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage ? String(coverImage).trim().slice(0, 500) : null
    }
    if (favoriteQuote !== undefined)
      updateData.favoriteQuote = String(favoriteQuote).trim().slice(0, 320)
    if (quoteAuthor !== undefined)
      updateData.quoteAuthor = String(quoteAuthor).trim().slice(0, 80)
    if (liveStatus !== undefined)
      updateData.liveStatus = String(liveStatus).trim().slice(0, 80)

    if (username !== undefined) {
      const rawUsername = String(username).trim()
      if (!rawUsername) {
        return NextResponse.json(
          { error: "Username cannot be empty." },
          { status: 400 }
        )
      }
      const cleanUsername = sanitizeUsername(rawUsername)
      if (cleanUsername.length < 3 || cleanUsername.length > 24) {
        return NextResponse.json(
          { error: "Username must be 3–24 characters using letters, numbers, or underscores." },
          { status: 400 }
        )
      }
      if (isReservedUsername(cleanUsername)) {
        return NextResponse.json(
          { error: "That @username is reserved. Please pick another handle." },
          { status: 400 }
        )
      }
      const conflict = await prisma.user.findFirst({
        where: { username: cleanUsername, id: { not: userId } },
        select: { id: true },
      })
      if (conflict) {
        return NextResponse.json(
          { error: "That @username is already taken" },
          { status: 400 }
        )
      }
      updateData.username = cleanUsername
    }

    if (readingGoalBooks !== undefined) {
      const goal = Math.max(1, Math.min(200, Math.round(Number(readingGoalBooks) || 12)))
      updateData.readingGoalBooks = goal
    }

    if (selectedTitle !== undefined) {
      const levelInfo = calculateLevelFromXP(currentUser.totalXP)
      const unlockedTitles = getUnlockedTitles(levelInfo.level)
      if (!selectedTitle || unlockedTitles.includes(selectedTitle)) {
        updateData.selectedTitle = selectedTitle || null
      }
    }

    if (profileFrame !== undefined) {
      updateData.profileFrame = String(profileFrame).slice(0, 40)
    }
    if (profileTheme !== undefined) {
      updateData.profileTheme = String(profileTheme).slice(0, 40)
    }

    if (typeof isPublicProfile === "boolean")
      updateData.isPublicProfile = isPublicProfile
    if (typeof showOnlineStatus === "boolean")
      updateData.showOnlineStatus = showOnlineStatus
    if (typeof showReadingActivity === "boolean")
      updateData.showReadingActivity = showReadingActivity
    if (typeof showContributionGraph === "boolean")
      updateData.showContributionGraph = showContributionGraph
    if (typeof leaderboardOptOut === "boolean")
      updateData.leaderboardOptOut = leaderboardOptOut

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: SAFE_PROFILE_SELECT,
    })

    invalidateCache(`session-user:${userId}`)
    invalidateCache(`user-loc:${userId}`)
    invalidateCache("leaderboard:")
    invalidateCacheKey(`profile:bundle:${userId}`)
    invalidateCachePrefix("profile:lookup:")
    checkAndAwardBadges(userId).catch(() => {})

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "That @username is already taken" },
        { status: 400 }
      )
    }
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
