"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { awardUserXP, checkAndAwardBadges } from "@/services/badgeService"
import { XP_REWARDS } from "@/lib/gamification"

const VALID_LIBRARY_STATUSES = new Set(["WANT_TO_READ", "READING", "READ"])

export async function updateLibraryBookStatus(bookId: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!bookId || !VALID_LIBRARY_STATUSES.has(status)) {
    throw new Error("Invalid status")
  }

  const book = await prisma.libraryBook.findUnique({ where: { id: bookId } })
  if (!book || book.userId !== session.user.id) {
    throw new Error("Forbidden")
  }

  await prisma.libraryBook.update({
    where: { id: bookId },
    data: {
      status,
      ...(status === "READ" ? { currentPage: book.totalPages } : {}),
    },
  })

  if (status === "READ" && book.status !== "READ") {
    await awardUserXP({
      userId: session.user.id,
      eventType: "BOOK_COMPLETED",
      idempotencyKey: `book_completed:${session.user.id}:${book.id}`,
      xpAmount: XP_REWARDS.BOOK_COMPLETED,
      pointsAmount: 40,
      description: `Completed reading "${book.title}" by ${book.author}`,
      sourceId: book.id,
      activityType: "BOOK_COMPLETED",
    }).catch(() => {})
    await checkAndAwardBadges(session.user.id).catch(() => {})
  }

  revalidatePath("/library")
  revalidatePath(`/profile/${session.user.id}`)
  return { success: true }
}
