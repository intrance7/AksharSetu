"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateLibraryBookStatus(bookId: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const book = await prisma.libraryBook.findUnique({ where: { id: bookId } })
  if (!book || book.userId !== session.user.id) {
    throw new Error("Forbidden")
  }

  await prisma.libraryBook.update({
    where: { id: bookId },
    data: { status }
  })

  revalidatePath("/library")
  revalidatePath(`/profile/${session.user.id}`)
  return { success: true }
}
