"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCommunityRequest(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be logged in to post a request.")
  }

  const title = (formData.get("title") as string)?.trim()
  const author = (formData.get("author") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()

  if (!title) {
    throw new Error("Title is required.")
  }

  await prisma.communityRequest.create({
    data: {
      title,
      author: author || null,
      description: description || null,
      requesterId: session.user.id,
    },
  })

  revalidatePath("/requests")
  return { success: true }
}

export async function fulfillCommunityRequest(requestId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.communityRequest.findUnique({
    where: { id: requestId },
  })

  if (!existing) {
    throw new Error("Request not found")
  }

  if (existing.requesterId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  await prisma.communityRequest.update({
    where: { id: requestId },
    data: { status: "FULFILLED" },
  })

  revalidatePath("/requests")
  return { success: true }
}

export async function deleteCommunityRequest(requestId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.communityRequest.findUnique({
    where: { id: requestId },
  })

  if (!existing) {
    throw new Error("Request not found")
  }

  if (existing.requesterId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  await prisma.communityRequest.delete({
    where: { id: requestId },
  })

  revalidatePath("/requests")
  return { success: true }
}
