"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCommunityRequest(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("You must be logged in to post a request.")
  }

  const title = formData.get("title") as string
  const author = formData.get("author") as string
  const description = formData.get("description") as string

  if (!title) {
    throw new Error("Title is required.")
  }

  await prisma.communityRequest.create({
    data: {
      title,
      author: author || null,
      description: description || null,
      requesterId: session.user.id
    }
  })

  revalidatePath("/requests")
  return { success: true }
}
