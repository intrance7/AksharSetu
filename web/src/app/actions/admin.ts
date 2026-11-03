"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ensureDefaultBadges } from "@/services/badgeService"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "ADMIN") throw new Error("Forbidden")
  return user
}

export async function verifyUser(userId: string) {
  await requireAdmin()
  await ensureDefaultBadges()

  const trustedBadge =
    (await prisma.badge.findFirst({
      where: { name: { in: ["Trusted Reader", "Trusted Member"] } },
    })) ||
    (await prisma.badge.create({
      data: {
        name: "Trusted Reader",
        description: "Verified trustworthy member of the AksharSetu community.",
        category: "TRUST",
        iconUrl: "/badges/trusted-reader.jpg",
        requirementThreshold: 1,
      },
    }))

  await prisma.userBadge.upsert({
    where: {
      userId_badgeId: {
        userId,
        badgeId: trustedBadge.id,
      },
    },
    update: {},
    create: {
      userId,
      badgeId: trustedBadge.id,
    },
  })

  await prisma.notification.create({
    data: {
      userId,
      type: "BADGE_EARNED",
      message: `You have been verified and awarded the "${trustedBadge.name}" badge!`,
      link: "/badges",
    },
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function toggleUserRole(userId: string, role: "USER" | "ADMIN") {
  const admin = await requireAdmin()
  if (admin.id === userId && role !== "ADMIN") {
    throw new Error("Cannot remove your own admin role")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function banUser(userId: string) {
  const admin = await requireAdmin()
  if (admin.id === userId) {
    throw new Error("Cannot moderate your own account")
  }

  await prisma.book.updateMany({
    where: { ownerId: userId, status: "AVAILABLE" },
    data: { status: "REMOVED" },
  })

  revalidatePath("/admin")
  revalidatePath("/catalog")
  return { success: true }
}

export async function approveBook(bookId: string) {
  await requireAdmin()

  await prisma.book.update({
    where: { id: bookId },
    data: { status: "AVAILABLE" },
  })

  revalidatePath("/admin")
  revalidatePath("/catalog")
  return { success: true }
}

export async function removeBook(bookId: string) {
  await requireAdmin()

  await prisma.book.update({
    where: { id: bookId },
    data: { status: "REMOVED" },
  })

  revalidatePath("/admin")
  revalidatePath("/catalog")
  return { success: true }
}

export async function createCampaignAction(data: {
  title: string
  ngoName: string
  targetBooks: number
  description: string
  imageUrl?: string
}) {
  await requireAdmin()

  if (!data.title.trim() || !data.ngoName.trim() || !data.description.trim()) {
    throw new Error("Missing required campaign fields")
  }

  const campaign = await prisma.campaign.create({
    data: {
      title: data.title.trim(),
      ngoName: data.ngoName.trim(),
      targetBooks: Math.max(10, Number(data.targetBooks) || 100),
      description: data.description.trim(),
      imageUrl: data.imageUrl?.trim() || null,
      status: "ACTIVE",
    },
  })

  revalidatePath("/admin")
  revalidatePath("/donations")
  return campaign
}

export async function updateCampaignStatusAction(
  campaignId: string,
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
) {
  await requireAdmin()

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status },
  })

  revalidatePath("/admin")
  revalidatePath("/donations")
  return { success: true }
}
