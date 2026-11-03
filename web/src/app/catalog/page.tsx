import prisma from "@/lib/prisma"
import { CatalogHero } from "@/components/catalog/CatalogHero"
import { CatalogLayoutClient } from "@/components/catalog/CatalogLayoutClient"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 24

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const category =
    typeof resolvedParams.category === "string" ? resolvedParams.category : undefined
  const query =
    typeof resolvedParams.q === "string"
      ? resolvedParams.q
      : typeof resolvedParams.query === "string"
      ? resolvedParams.query
      : undefined
  const condition =
    typeof resolvedParams.condition === "string" ? resolvedParams.condition : undefined
  const price =
    typeof resolvedParams.price === "string" ? resolvedParams.price : undefined
  const sort =
    typeof resolvedParams.sort === "string" ? resolvedParams.sort : "new"
  const university =
    typeof resolvedParams.university === "string" ? resolvedParams.university : undefined
  const course =
    typeof resolvedParams.course === "string" ? resolvedParams.course : undefined
  const semesterStr =
    typeof resolvedParams.semester === "string" ? resolvedParams.semester : undefined
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

  if (semesterStr && !Number.isNaN(parseInt(semesterStr, 10))) {
    whereClause.semester = parseInt(semesterStr, 10)
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
    ]
  }

  const session = await auth()
  let userLocation: { latitude: number | null; longitude: number | null } | null = null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true },
    })
    if (user?.latitude && user?.longitude) {
      userLocation = { latitude: user.latitude, longitude: user.longitude }
    }
  }

  let orderBy: Prisma.BookOrderByWithRelationInput | Prisma.BookOrderByWithRelationInput[] =
    { createdAt: "desc" }
  if (sort === "low") {
    orderBy = { price: "asc" }
  } else if (sort === "az") {
    orderBy = { title: "asc" }
  } else if (sort === "popular") {
    orderBy = [
      { requests: { _count: "desc" } },
      { owner: { sellerRating: "desc" } },
      { createdAt: "desc" },
    ]
  }

  const totalCount = await prisma.book.count({ where: whereClause })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  // Distance sort requires full matching set before slicing; all other sorts paginate directly in SQL
  const isDistanceSort = sort === "distance" && Boolean(userLocation)

  const books = await prisma.book.findMany({
    where: whereClause,
    orderBy,
    ...(isDistanceSort
      ? {}
      : {
          skip: (safePage - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
    include: {
      owner: {
        select: {
          latitude: true,
          longitude: true,
          location: true,
        },
      },
    },
  })

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
      condition ||
      query ||
      bundlesOnly ||
      university ||
      course ||
      semesterStr
  )

  return (
    <div className="min-h-screen bg-[#F2EBE1] relative overflow-hidden">
      <div className="hidden xl:block absolute -left-8 top-64 w-[320px] pointer-events-none z-0">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/doodle-plant-books.png"
            alt="Decorative sketch"
            className="w-full h-auto drop-shadow-2xl mix-blend-multiply transition-transform duration-500 hover:scale-105 hover:rotate-2 pointer-events-auto"
          />
        </div>
      </div>

      <div className="hidden xl:block absolute -right-8 bottom-64 w-[320px] pointer-events-none z-0">
        <div className="relative transform rotate-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/doodle-glasses-books.png"
            alt="Decorative sketch"
            className="w-full h-auto drop-shadow-2xl mix-blend-multiply transition-transform duration-500 hover:scale-105 hover:-rotate-2 pointer-events-auto"
          />
        </div>
      </div>

      <div className="relative z-10 w-full">
        <CatalogHero isFiltered={isFiltered} />
        <CatalogLayoutClient
          books={finalBooks as any}
          totalCount={totalCount}
          currentPage={safePage}
          totalPages={totalPages}
          isFiltered={isFiltered}
          userLocation={userLocation}
        />
      </div>
    </div>
  )
}
