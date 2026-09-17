import prisma from "@/lib/prisma"
import { BookCard } from "@/components/catalog/BookCard"
import { CatalogFilters } from "@/components/catalog/CatalogFilters"

export const dynamic = "force-dynamic"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined

  // Construct the Prisma query
  const whereClause: any = {
    status: "AVAILABLE",
  }

  if (category && category !== "all") {
    whereClause.category = category
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
    ]
  }

  const books = await prisma.book.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-[#F5F5DC] pt-24 pb-32">
      <div className="container mx-auto px-4 md:px-8">

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#1D1D1F] mb-6">
            Discover Your Next <span className="text-[#0066cc]">Great Read</span>
          </h1>
          <p className="text-[#86868b] text-lg font-medium max-w-2xl mx-auto">
            Browse our collection of donated and resale books. Search by category, title, or author to find exactly what you need.
          </p>
        </div>

        <CatalogFilters />

        {books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-[#1D1D1F] mb-2">No books found</h3>
            <p className="text-[#86868b] font-medium">Try adjusting your filters or searching for something else.</p>
          </div>
        )}

      </div>
    </div>
  )
}
