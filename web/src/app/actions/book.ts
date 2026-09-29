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

  // Academic Tags
  const university = formData.get("university") as string
  const course = formData.get("course") as string
  const semesterStr = formData.get("semester") as string
  const semester = semesterStr ? parseInt(semesterStr, 10) : null
  const subject = formData.get("subject") as string

  // Exchange
  const acceptsExchange = formData.get("acceptsExchange") === "true"
  const exchangePreferences = formData.get("exchangePreferences") as string

  // Detailed Condition
  const parseCond = (key: string) => formData.has(key) ? parseInt(formData.get(key) as string, 10) : 5
  const condCover = parseCond("condCover")
  const condPages = parseCond("condPages")
  const condHighlighting = parseCond("condHighlighting")
  const condNotes = parseCond("condNotes")
  const condBinding = parseCond("condBinding")

  // Bundle Fields
  const isBundle = formData.get("isBundle") === "true"
  const booksInBundleStr = formData.get("booksInBundle") as string
  const booksInBundle = booksInBundleStr ? parseInt(booksInBundleStr, 10) : 1
  const bundleDescription = formData.get("bundleDescription") as string

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
      
      university: university || null,
      course: course || null,
      semester: semester,
      subject: subject || null,

      acceptsExchange,
      exchangePreferences: exchangePreferences || null,

      condCover,
      condPages,
      condHighlighting,
      condNotes,
      condBinding,

      isBundle,
      booksInBundle,
      bundleDescription: bundleDescription || null,

      deliveryType: (formData.get("deliveryType") as string) || "SHIPPING",
    }
  })

  // Revalidate catalog page so the new book shows up
  revalidatePath("/catalog")
  
  // Redirect to catalog
  redirect("/catalog")
}
