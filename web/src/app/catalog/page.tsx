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
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Hero Section */}
      <div className="bg-[#1D1D1F] pt-28 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center gap-6">
            <span className="text-[#C84200] text-xs font-black uppercase tracking-[0.3em]">
              Book Catalog
            </span>
            <h1
              className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9]"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Discover Your Next<br />
              <span className="text-[#C84200]">Great Read</span>
            </h1>
            <p className="text-white/60 text-lg font-medium max-w-xl">
              Browse donated and resale books. Search by category, title, or author.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 md:px-8 -mt-8">
        <CatalogFilters />

        {books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 pb-24">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-2xl shadow-sm border border-[#1D1D1F]/5 mt-10">
            <h3 className="text-2xl font-black text-[#1D1D1F] mb-2">No books found</h3>
            <p className="text-[#1D1D1F]/50 font-medium">Try adjusting your filters or searching for something else.</p>
          </div>
        )}
      </div>
    </div>
  )
}
