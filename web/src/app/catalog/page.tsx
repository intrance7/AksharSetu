import { Suspense } from "react"
import type { Metadata } from "next"
import prisma from "@/lib/prisma"
import { cached } from "@/lib/fastCache"
import { CatalogHero } from "@/components/catalog/CatalogHero"
import { CatalogLayoutClient } from "@/components/catalog/CatalogLayoutClient"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 24

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const resolved = await searchParams
  const category =
    typeof resolved.category === "string" && resolved.category !== "all"
      ? resolved.category
      : null
  const q =
    typeof resolved.q === "string" && resolved.q.trim()
      ? resolved.q.trim()
      : null

  const title = q
    ? `"${q}" — Browse Books & Textbooks`
    : category
    ? `${category.charAt(0).toUpperCase() + category.slice(1)} Books & Textbooks — Catalog`
    : "Browse Used Textbooks, Novels & Free Book Donations — Catalog"

  return {
    title,
    description:
      "Discover affordable second-hand textbooks, novels, 1-for-1 book swaps, and free Vidya Daan book donations from verified students and readers across India.",
    alternates: {
      canonical: category
        ? `/catalog?category=${encodeURIComponent(category.toLowerCase())}`
        : "/catalog",
    },
    openGraph: {
      title: `${title} | Aksharसेतु`,
      description:
        "Search by title, author, ISBN, university, or semester. Buy, swap, or claim free donated books across Indian campuses.",
      url: "/catalog",
    },
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const category =
    typeof resolvedParams.category === "string"
      ? resolvedParams.category
      : undefined
  const query =
    typeof resolvedParams.q === "string"
      ? resolvedParams.q
      : typeof resolvedParams.query === "string"
      ? resolvedParams.query
      : undefined
  const condition =
    typeof resolvedParams.condition === "string"
      ? resolvedParams.condition
      : undefined
  const price =
    typeof resolvedParams.price === "string" ? resolvedParams.price : undefined
  const maxPriceStr =
    typeof resolvedParams.maxPrice === "string"
      ? resolvedParams.maxPrice
      : undefined
  const delivery =
    typeof resolvedParams.delivery === "string"
      ? resolvedParams.delivery
      : undefined
  const sort =
    typeof resolvedParams.sort === "string" ? resolvedParams.sort : "new"
  const university =
    typeof resolvedParams.university === "string"
      ? resolvedParams.university
      : undefined
  const course =
    typeof resolvedParams.course === "string" ? resolvedParams.course : undefined
  const subject =
    typeof resolvedParams.subject === "string"
      ? resolvedParams.subject
      : undefined
  const author =
    typeof resolvedParams.author === "string" ? resolvedParams.author : undefined
  const semesterStr =
    typeof resolvedParams.semester === "string"
      ? resolvedParams.semester
      : undefined
  const bundlesOnly = resolvedParams.bundles === "true"
  const currentPage = Math.max(
    1,
    parseInt(
      typeof resolvedParams.page === "string" ? resolvedParams.page : "1",
      10
    ) || 1
  )

  const whereClause: Prisma.BookWhereInput = {
    status: "AVAILABLE",
  }

  if (category && category !== "all") {
    whereClause.category = {
      equals: category,
      mode: "insensitive",
    }
  }

  if (condition) {
    whereClause.condition = condition as any
  }

  if (price === "free") {
    whereClause.price = 0
    whereClause.acceptsExchange = false
  } else if (price === "paid") {
    whereClause.price = { gt: 0 }
  } else if (price === "exchange") {
    whereClause.acceptsExchange = true
  } else if (price === "under250") {
    whereClause.price = { lte: 250 }
  } else if (price === "under500") {
    whereClause.price = { lte: 500 }
  }

  if (maxPriceStr && !Number.isNaN(parseInt(maxPriceStr, 10))) {
    const maxP = parseInt(maxPriceStr, 10)
    if (maxP >= 0) {
      whereClause.price = { lte: maxP }
    }
  }

  if (delivery === "MEETUP") {
    whereClause.deliveryType = { in: ["MEETUP", "BOTH"] }
  } else if (delivery === "SHIPPING") {
    whereClause.deliveryType = { in: ["SHIPPING", "BOTH"] }
  }

  if (bundlesOnly) {
    whereClause.isBundle = true
  }

  if (university) {
    whereClause.university = { contains: university, mode: "insensitive" }
  }

  if (course) {
    whereClause.course = { contains: course, mode: "insensitive" }
  }

  if (subject) {
    whereClause.subject = { contains: subject, mode: "insensitive" }
  }

  if (author) {
    whereClause.author = { contains: author, mode: "insensitive" }
  }

  if (semesterStr && !Number.isNaN(parseInt(semesterStr, 10))) {
    whereClause.semester = parseInt(semesterStr, 10)
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
      { university: { contains: query, mode: "insensitive" } },
    ]
  }

  let orderBy:
    | Prisma.BookOrderByWithRelationInput
    | Prisma.BookOrderByWithRelationInput[] = { createdAt: "desc" }
  if (sort === "low") {
    orderBy = { price: "asc" }
  } else if (sort === "high") {
    orderBy = { price: "desc" }
  } else if (sort === "az") {
    orderBy = { title: "asc" }
  } else if (sort === "popular") {
    orderBy = [
      { requests: { _count: "desc" } },
      { owner: { sellerRating: "desc" } },
      { createdAt: "desc" },
    ]
  }

  const cacheKey = `catalog:${JSON.stringify({
    whereClause,
    orderBy,
    page: currentPage,
    distance: sort === "distance",
  })}`

  const [session, catalogResult] = await Promise.all([
    auth(),
    cached(cacheKey, 15_000, async () => {
      const [totalCount, books] = await Promise.all([
        prisma.book.count({ where: whereClause }),
        prisma.book.findMany({
          where: whereClause,
          orderBy,
          ...(sort === "distance"
            ? {}
            : {
                skip: (currentPage - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
              }),
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true,
                sellerRating: true,
                booksSold: true,
                successfulExchanges: true,
                latitude: true,
                longitude: true,
                location: true,
              },
            },
            _count: {
              select: { requests: true },
            },
          },
        }),
      ])
      return { totalCount, books }
    }),
  ])

  let userLocation: {
    latitude: number | null
    longitude: number | null
  } | null = null

  if (session?.user?.id) {
    const user = await cached(
      `user-loc:${session.user.id}`,
      60_000,
      () =>
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { latitude: true, longitude: true },
        })
    )
    if (user?.latitude && user?.longitude) {
      userLocation = { latitude: user.latitude, longitude: user.longitude }
    }
  }

  const { totalCount, books } = catalogResult
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const isDistanceSort = sort === "distance" && Boolean(userLocation)

  let finalBooks = books
  if (isDistanceSort && userLocation) {
    const { calculateDistance } = await import("@/lib/utils")
    const sorted = [...books].sort((a, b) => {
      const aLat = a.owner.latitude
      const aLng = a.owner.longitude
      const bLat = b.owner.latitude
      const bLng = b.owner.longitude

      if (!aLat || !aLng) return 1
      if (!bLat || !bLng) return -1

      const distA = calculateDistance(
        userLocation!.latitude!,
        userLocation!.longitude!,
        aLat,
        aLng
      )
      const distB = calculateDistance(
        userLocation!.latitude!,
        userLocation!.longitude!,
        bLat,
        bLng
      )

      return distA - distB
    })
    finalBooks = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  }

  const isFiltered = Boolean(
    (category && category !== "all") ||
      (price && price !== "all") ||
      maxPriceStr ||
      delivery ||
      condition ||
      query ||
      bundlesOnly ||
      university ||
      course ||
      subject ||
      author ||
      semesterStr
  )

  return (
    <div className="min-h-screen bg-[#F2EBE1] relative overflow-x-clip">
      <div className="relative z-10 w-full">
        <CatalogHero isFiltered={isFiltered} />
        <Suspense
          fallback={
            <div className="container mx-auto max-w-[1400px] px-4 md:px-8 py-12">
              <div className="h-12 w-full bg-white/60 rounded-2xl mb-6 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-[420px] bg-white/80 rounded-3xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          }
        >
          <CatalogLayoutClient
            books={finalBooks as any}
            totalCount={totalCount}
            currentPage={safePage}
            totalPages={totalPages}
            isFiltered={isFiltered}
            userLocation={userLocation}
          />
        </Suspense>
      </div>
    </div>
  )
}
