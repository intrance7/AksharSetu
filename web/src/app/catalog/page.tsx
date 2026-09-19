import prisma from "@/lib/prisma"
import { CatalogHero } from "@/components/catalog/CatalogHero"
import { CatalogLayoutClient } from "@/components/catalog/CatalogLayoutClient"
import { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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

  // Construct the Sort Order
  let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: "desc" }
  if (sort === "low") {
    orderBy = { price: "asc" }
  } else if (sort === "az") {
    orderBy = { title: "asc" }
  }

  const books = await prisma.book.findMany({
    where: whereClause,
    orderBy: orderBy,
  })

  // Has filters?
  const isFiltered = !!(category && category !== "all" || price && price !== "all" || condition || query)

  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      <CatalogHero />
      <CatalogLayoutClient books={books} isFiltered={isFiltered} />
    </div>
  )
}
