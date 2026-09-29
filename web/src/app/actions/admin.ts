"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "ADMIN") throw new Error("Forbidden")
}

export async function verifyUser(userId: string) {
  await checkAdmin()
  
  // Create or award the 'Trusted Member' badge
  const trustedBadge = await prisma.badge.findFirst({
    where: { name: 'Trusted Member' }
  })

  if (trustedBadge) {
    await prisma.userBadge.upsert({
      where: {
        userId_badgeId: {
          userId,
          badgeId: trustedBadge.id
        }
      },
      update: {},
      create: {
        userId,
        badgeId: trustedBadge.id
      }
    })
  }

  // Update user rating or any specific verified field if we want
  // Currently we just award the badge
  revalidatePath("/admin")
  return { success: true }
}

export async function banUser(userId: string) {
  await checkAdmin()
  
  // Change role to BANNED or just delete them for V1
  // Let's just delete the user for simplicity in V1, or maybe clear their books?
  // Since we don't have a 'BANNED' role yet, let's just delete their active books to 'moderate' them
  await prisma.book.updateMany({
    where: { ownerId: userId },
    data: { status: "REMOVED" }
  })
  
  revalidatePath("/admin")
  return { success: true }
}

export async function approveBook(bookId: string) {
  await checkAdmin()
  
  // If we had a PENDING_REVIEW state, we'd change it to AVAILABLE.
  // Currently, let's just return success to simulate approval logging.
  await prisma.book.update({
    where: { id: bookId },
    data: { status: "AVAILABLE" }
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function removeBook(bookId: string) {
  await checkAdmin()
  
  // Set status to REMOVED or delete it
  // But wait, our schema doesn't have REMOVED in comments, but we can set status = "REMOVED"
  await prisma.book.update({
    where: { id: bookId },
    data: { status: "REMOVED" }
  })

  revalidatePath("/admin")
  return { success: true }
}
