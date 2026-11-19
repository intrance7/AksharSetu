import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const followerId = session.user.id
    const { id: followingId } = await params

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    let following = false
    if (existing) {
      await prisma.userFollow.delete({ where: { id: existing.id } })
      following = false
    } else {
      try {
        await prisma.userFollow.create({
          data: { followerId, followingId },
        })
      } catch (err: any) {
        if (err?.code !== "P2002") throw err
      }
      following = true

      const followerName =
        session.user.name || session.user.email?.split("@")[0] || "A reader"
      prisma.notification
        .create({
          data: {
            userId: followingId,
            type: "NEW_FOLLOWER",
            message: `${followerName} started following your reading journey.`,
            link: `/profile/${followerId}`,
          },
        })
        .catch(() => {})
    }

    const followersCount = await prisma.userFollow.count({
      where: { followingId },
    })

    return NextResponse.json({ following, followersCount })
  } catch (error) {
    console.error("Follow toggle error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
