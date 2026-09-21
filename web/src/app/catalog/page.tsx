import prisma from "@/lib/prisma"
import { CatalogHero } from "@/components/catalog/CatalogHero"
import { CatalogLayoutClient } from "@/components/catalog/CatalogLayoutClient"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Start a minimum delay timer immediately. We'll await it at the end to guarantee 
  // the beautiful loading animation plays for at least 1.5s, preventing glitchy flashes 
  // on ultra-fast internet connections.
  const minDelay = new Promise((resolve) => setTimeout(resolve, 1500))

  const resolvedParams = await searchParams
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined
  const condition = typeof resolvedParams.condition === "string" ? resolvedParams.condition : undefined
  const price = typeof resolvedParams.price === "string" ? resolvedParams.price : undefined
  const sort = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "new"

  // Construct the Prisma query
  const whereClause: Prisma.BookWhereInput = {
    status: "AVAILABLE",
  }

  if (category && category !== "all") {
    whereClause.category = {
      equals: category,
      mode: "insensitive"
    }
  }

  if (condition) {
    whereClause.condition = condition as any
  }

  if (price === "free") {
    whereClause.price = 0
  } else if (price === "paid") {
    whereClause.price = { gt: 0 }
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
    ]
  }

  const session = await auth()
  let userLocation: { latitude: number | null, longitude: number | null } | null = null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true }
    })
    if (user?.latitude && user?.longitude) {
      userLocation = { latitude: user.latitude, longitude: user.longitude }
    }
  }

  // Construct the Sort Order
  let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: "desc" }
  if (sort === "low") {
    orderBy = { price: "asc" }
  } else if (sort === "az") {
    orderBy = { title: "asc" }
  } else if (sort === "distance") {
     // Prisma doesn't natively support sorting by a calculated distance based on relations without raw queries.
     // We will fetch all matching books and sort them in JavaScript below.
     orderBy = { createdAt: "desc" }
  }

  const books = await prisma.book.findMany({
    where: whereClause,
    orderBy: orderBy,
    include: {
      owner: {
        select: {
          latitude: true,
          longitude: true,
          location: true
        }
      }
    }
  })

  // Manual Distance Sort
  let finalBooks = books;
  if (sort === "distance" && userLocation) {
      const { calculateDistance } = await import('@/lib/utils');
      finalBooks = books.sort((a, b) => {
          const aLat = a.owner.latitude;
          const aLng = a.owner.longitude;
          const bLat = b.owner.latitude;
          const bLng = b.owner.longitude;
          
          if (!aLat || !aLng) return 1; // Put books without location at the end
          if (!bLat || !bLng) return -1;
          
          const distA = calculateDistance(userLocation!.latitude!, userLocation!.longitude!, aLat, aLng);
          const distB = calculateDistance(userLocation!.latitude!, userLocation!.longitude!, bLat, bLng);
          
          return distA - distB;
      });
  }

  // Has filters?
  const isFiltered = !!(category && category !== "all" || price && price !== "all" || condition || query)

  // Ensure our 1.5s minimum timer has finished before rendering the page
  await minDelay;

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <CatalogHero isFiltered={isFiltered} />
      <CatalogLayoutClient books={finalBooks as any} isFiltered={isFiltered} userLocation={userLocation} />
    </div>
  )
}
