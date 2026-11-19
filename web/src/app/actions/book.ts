"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { invalidateCache } from "@/lib/fastCache"
import { notifyWishlistMatches } from "@/lib/wishlistAlerts"
import { checkAndAwardBadges } from "@/services/badgeService"

export async function createBook(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  const userId = session.user.id

  const title = ((formData.get("title") as string) || "").trim()
  const author = ((formData.get("author") as string) || "").trim()
  const isbn = ((formData.get("isbn") as string) || "").trim()
  const description = ((formData.get("description") as string) || "").trim()
  const condition = ((formData.get("condition") as string) || "").trim()
  const category = ((formData.get("category") as string) || "").trim()
  const isDonation = formData.get("isDonation") === "true"
  const rawPrice = parseFloat((formData.get("price") as string) || "0")
  const price = isDonation
    ? 0
    : Number.isFinite(rawPrice) && rawPrice >= 0
      ? rawPrice
      : 0
  const imageUrl = ((formData.get("imageUrl") as string) || "").trim()
  const campaignIdRaw = ((formData.get("campaignId") as string) || "").trim()

  // Academic Tags
  const university = ((formData.get("university") as string) || "").trim()
  const course = ((formData.get("course") as string) || "").trim()
  const semesterStr = ((formData.get("semester") as string) || "").trim()
  const parsedSemester = semesterStr ? parseInt(semesterStr, 10) : NaN
  const semester =
    Number.isFinite(parsedSemester) && parsedSemester >= 1 && parsedSemester <= 12
      ? parsedSemester
      : null
  const subject = ((formData.get("subject") as string) || "").trim()

  // Exchange
  const acceptsExchange = formData.get("acceptsExchange") === "true"
  const exchangePreferences = (
    (formData.get("exchangePreferences") as string) || ""
  ).trim()

  // Detailed Condition (1-5 clamped)
  const parseCond = (key: string) => {
    if (!formData.has(key)) return 5
    const n = parseInt((formData.get(key) as string) || "5", 10)
    return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 5
  }
  const condCover = parseCond("condCover")
  const condPages = parseCond("condPages")
  const condHighlighting = parseCond("condHighlighting")
  const condNotes = parseCond("condNotes")
  const condBinding = parseCond("condBinding")

  // Bundle Fields
  const isBundle = formData.get("isBundle") === "true"
  const booksInBundleStr = ((formData.get("booksInBundle") as string) || "").trim()
  const parsedBundle = booksInBundleStr ? parseInt(booksInBundleStr, 10) : 1
  const booksInBundle =
    Number.isFinite(parsedBundle) && parsedBundle >= 1 ? parsedBundle : 1
  const bundleDescription = (
    (formData.get("bundleDescription") as string) || ""
  ).trim()

  // Delivery option
  const rawDelivery = ((formData.get("deliveryType") as string) || "SHIPPING").trim()
  const deliveryType = ["SHIPPING", "MEETUP", "BOTH"].includes(rawDelivery)
    ? rawDelivery
    : "SHIPPING"

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
      where: { id: userId },
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
      where: { id: userId },
      data: {
        latitude: parsedLat,
        longitude: parsedLng,
        ...(locationLabel ? { location: locationLabel.slice(0, 120) } : {}),
      },
    })
  }

  // Validate campaignId if donating toward a Vidya Daan NGO campaign
  let validCampaign: { id: string; title: string } | null = null
  if (isDonation && campaignIdRaw) {
    const found = await prisma.campaign.findUnique({
      where: { id: campaignIdRaw },
      select: { id: true, title: true, status: true },
    })
    if (found && found.status === "ACTIVE") {
      validCampaign = { id: found.id, title: found.title }
    }
  }

  const { createdBook, createdDonation } = await prisma.$transaction(async (tx) => {
    const book = await tx.book.create({
      data: {
        title,
        author,
        isbn: isbn || null,
        description: description || null,
        condition,
        category,
        price,
        images: imageUrl ? [imageUrl] : [],
        ownerId: userId,
        status: validCampaign ? "DONATED" : "AVAILABLE",

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

        deliveryType,
      },
    })

    let donation: { id: string; trackingId: string } | null = null
    if (isDonation) {
      donation = await tx.donation.create({
        data: {
          donorId: userId,
          bookId: book.id,
          campaignId: validCampaign?.id || null,
          status: "DONATED",
        },
        select: { id: true, trackingId: true },
      })

      if (validCampaign) {
        await tx.campaign.update({
          where: { id: validCampaign.id },
          data: { currentBooks: { increment: 1 } },
        })
      }
    }

    return { createdBook: book, createdDonation: donation }
  })

  if (createdDonation) {
    await prisma.notification
      .create({
        data: {
          userId,
          type: "DONATION_LOGGED",
          message: validCampaign
            ? `Thank you! Your donation "${createdBook.title}" for "${validCampaign.title}" (Tracking: ${createdDonation.trackingId.slice(0, 8)}) has been registered.`
            : `Thank you! Your donation "${createdBook.title}" (Tracking: ${createdDonation.trackingId.slice(0, 8)}) has been registered.`,
          link: `/donations/track/${createdDonation.trackingId}`,
        },
      })
      .catch(() => {})
  }

  // Trigger Wishlist Alerts & Badge evaluation
  if (createdBook.status === "AVAILABLE") {
    await notifyWishlistMatches({
      bookId: createdBook.id,
      title: createdBook.title,
      isbn: createdBook.isbn,
      sellerId: userId,
    })
  }
  checkAndAwardBadges(userId).catch(() => {})

  invalidateCache("catalog:")
  invalidateCache("donations:")
  invalidateCache("leaderboard:")
  invalidateCache(`user-loc:${userId}`)

  revalidatePath("/catalog")
  revalidatePath("/campus")
  revalidatePath("/map")
  revalidatePath("/orders")
  if (isDonation) {
    revalidatePath("/donations")
    revalidatePath("/admin")
  }

  redirect(validCampaign ? "/donations" : "/catalog")
}
