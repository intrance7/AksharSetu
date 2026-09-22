"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createBook(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const title = formData.get("title") as string
  const author = formData.get("author") as string
  const isbn = formData.get("isbn") as string
  const description = formData.get("description") as string
  const condition = formData.get("condition") as string
  const category = formData.get("category") as string
  const isDonation = formData.get("isDonation") === "true"
  const price = isDonation ? 0 : parseFloat(formData.get("price") as string)
  const imageUrl = formData.get("imageUrl") as string

  // Simple validation
  if (!title || !author || !condition || !category) {
    throw new Error("Missing required fields")
  }

  // Create Book
  await prisma.book.create({
    data: {
      title,
      author,
      isbn: isbn || null,
      description: description || null,
      condition,
      category,
      price: price || 0,
      images: imageUrl ? [imageUrl] : [],
      ownerId: session.user.id,
      status: "AVAILABLE",
    }
  })

  // Revalidate catalog page so the new book shows up
  revalidatePath("/catalog")
  
  // Redirect to catalog
  redirect("/catalog")
}
