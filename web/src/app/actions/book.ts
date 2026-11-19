"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { notifyWishlistMatches } from "@/lib/wishlistAlerts"
import { checkAndAwardBadges } from "@/services/badgeService"

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
  const parseCond = (key: string) =>
    formData.has(key) ? parseInt(formData.get(key) as string, 10) : 5
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

  // Location for Books Near Me Map
  const latRaw = formData.get("latitude") as string | null
  const lngRaw = formData.get("longitude") as string | null
  const locationLabel = ((formData.get("location") as string) || "").trim()
  const parsedLat = latRaw ? parseFloat(latRaw) : NaN
  const parsedLng = lngRaw ? parseFloat(lngRaw) : NaN
  const hasValidCoords =
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180

  if (!title || !author || !condition || !category) {
    throw new Error("Missing required fields")
  }

  const isForSale = !isDonation && !acceptsExchange
  if (isForSale && !hasValidCoords) {
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true },
    })
    if (existingUser?.latitude == null || existingUser?.longitude == null) {
      throw new Error(
        "Location access is required to post a book for sale and pin it on the map."
      )
    }
  }

  if (hasValidCoords) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        latitude: parsedLat,
        longitude: parsedLng,
        ...(locationLabel ? { location: locationLabel.slice(0, 120) } : {}),
      },
    })
  }

  const createdBook = await prisma.book.create({
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
      semester,
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
    },
  })

  // Trigger Wishlist Alerts & Badge evaluation asynchronously
  await notifyWishlistMatches({
    bookId: createdBook.id,
    title: createdBook.title,
    isbn: createdBook.isbn,
    sellerId: session.user.id,
  })
  checkAndAwardBadges(session.user.id).catch(() => {})

  revalidatePath("/catalog")
  revalidatePath("/campus")
  revalidatePath("/map")
  revalidatePath("/orders")

  redirect("/catalog")
}
