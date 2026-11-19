import type { Metadata } from "next"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { RequestBookButton } from "@/components/catalog/RequestBookButton"
import { SellerReputationCard } from "@/components/catalog/SellerReputationCard"
import { ProposeSwapModal } from "@/components/catalog/ProposeSwapModal"
import { OwnerListingControls } from "@/components/catalog/OwnerListingControls"
import { BookGallery } from "@/components/catalog/BookGallery"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Tag,
  User,
  MessageCircle,
  ChevronRight,
  MapPin,
  Package,
  Handshake,
  Truck,
  Sparkles,
} from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      title: true,
      author: true,
      isbn: true,
      category: true,
      price: true,
      condition: true,
      acceptsExchange: true,
      description: true,
      images: true,
      university: true,
    },
  })

  if (!book) {
    return { title: "Book Not Found" }
  }

  const priceTag =
    book.price === 0
      ? book.acceptsExchange
        ? "1-for-1 Swap"
        : "Free Donation"
      : `₹${book.price}`

  const cleanDesc =
    book.description ||
    `Buy, swap, or claim "${book.title}" by ${book.author} (${book.condition.replace(
      "_",
      " "
    )} condition, ${priceTag})${
      book.university ? ` at ${book.university}` : ""
    } on AksharSetu.`

  return {
    title: `${book.title} by ${book.author} (${priceTag})`,
    description: cleanDesc.slice(0, 160),
    alternates: {
      canonical: `/catalog/${id}`,
    },
    openGraph: {
      title: `${book.title} by ${book.author} · ${priceTag} | Aksharसेतु`,
      description: cleanDesc.slice(0, 200),
      url: `/catalog/${id}`,
      type: "book",
      images: book.images?.[0]
        ? [{ url: book.images[0], alt: book.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} by ${book.author} (${priceTag})`,
      description: cleanDesc.slice(0, 160),
      images: book.images?.[0] ? [book.images[0]] : undefined,
    },
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const session = await auth()

  const [book, myAvailableBooks] = await Promise.all([
    prisma.book.findUnique({
      where: { id: resolvedParams.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            location: true,
            sellerRating: true,
            booksSold: true,
            successfulExchanges: true,
            responseTime: true,
            conditionAccuracy: true,
            meetupReliability: true,
          },
        },
      },
    }),
    session?.user?.id
      ? prisma.book.findMany({
          where: { ownerId: session.user.id, status: "AVAILABLE" },
          select: {
            id: true,
            title: true,
            author: true,
            condition: true,
            images: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ])

  if (!book) {
    notFound()
  }

  const isOwner = session?.user?.id === book.ownerId
  const hasCover = Boolean(book.images && book.images.length > 0)
  const isDonation = book.price === 0 && !book.acceptsExchange
  const isExchange = book.acceptsExchange
  const ownerHandle = book.owner.username || book.owner.id
  const baseUrl =
    process.env.AUTH_URL || "https://aksharsetu-iota.vercel.app"

  const avgCondition = (
    ((book.condCover || 5) +
      (book.condPages || 5) +
      (book.condHighlighting || 5) +
      (book.condNotes || 5) +
      (book.condBinding || 5)) /
    5
  ).toFixed(1)

  // Real Schema.org JSON-LD (Book + Offer + BreadcrumbList) grounded strictly in DB fields
  const conditionSchemaMap: Record<string, string> = {
    LIKE_NEW: "https://schema.org/UsedCondition",
    GOOD: "https://schema.org/UsedCondition",
    FAIR: "https://schema.org/UsedCondition",
    POOR: "https://schema.org/DamagedCondition",
  }

  const verifiedTransactionsCount =
    (book.owner.booksSold || 0) + (book.owner.successfulExchanges || 0)

  const bookJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Book", "Product"],
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author,
    },
    ...(book.isbn ? { isbn: book.isbn } : {}),
    description:
      book.description ||
      `${book.title} by ${book.author} (${book.condition.replace(
        "_",
        " "
      )} condition) on AksharSetu.`,
    category: book.category,
    ...(hasCover ? { image: book.images[0] } : {}),
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/catalog/${book.id}`,
      priceCurrency: "INR",
      price: book.price,
      itemCondition:
        conditionSchemaMap[book.condition] ||
        "https://schema.org/UsedCondition",
      availability:
        book.status === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Person",
        name: book.owner.name || "AksharSetu Reader",
      },
    },
    ...(verifiedTransactionsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number((book.owner.sellerRating || 5).toFixed(1)),
            reviewCount: verifiedTransactionsCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalog",
        item: `${baseUrl}/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: book.category,
        item: `${baseUrl}/catalog?category=${encodeURIComponent(
          book.category.toLowerCase()
        )}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: book.title,
        item: `${baseUrl}/catalog/${book.id}`,
      },
    ],
  }

  const conditionMetrics = [
    { label: "Cover & Spine", score: book.condCover || 5 },
    { label: "Pages & Crispness", score: book.condPages || 5 },
    { label: "Clean of Highlights", score: book.condHighlighting || 5 },
    { label: "Margin Notes", score: book.condNotes || 5 },
    { label: "Binding Integrity", score: book.condBinding || 5 },
  ]

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-8 sm:pt-12 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#6e6e73] mb-6"
        >
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-[#1D1D1F] hover:text-[#C84200] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
          <ChevronRight className="w-4 h-4 opacity-40" />
          <Link
            href={`/catalog?category=${encodeURIComponent(
              book.category.toLowerCase()
            )}`}
            className="hover:text-[#C84200] capitalize transition-colors"
          >
            {book.category}
          </Link>
          <ChevronRight className="w-4 h-4 opacity-40" />
          <span className="text-[#1D1D1F] truncate max-w-[180px] sm:max-w-[340px]">
            {book.title}
          </span>
        </nav>

        <div className="bg-white rounded-3xl shadow-[0_12px_48px_-18px_rgba(29,29,31,0.12)] border border-[#1D1D1F]/[0.07] overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Museum-Grade Editorial Cover Stage */}
          <div className="w-full md:w-5/12 lg:w-[44%] shrink-0">
            <BookGallery
              images={book.images || []}
              title={book.title}
              author={book.author}
              category={book.category}
              isbn={book.isbn}
              showWishlist={!isOwner}
            />
          </div>

          {/* Right Column: Editorial Book Specification & Action Dock */}
          <div className="w-full md:w-7/12 lg:w-[56%] p-6 sm:p-9 lg:p-11 flex flex-col">
            <div className="flex-1">
              {/* Tag Strip */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="bg-[#C84200]/10 text-[#C84200] text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full">
                  {book.category}
                </span>
                <span className="bg-[#FAF6F0] text-[#1D1D1F] text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-[#1D1D1F]/[0.08]">
                  {book.condition.replace("_", " ")}
                </span>

                {book.isBundle && (
                  <span className="inline-flex items-center gap-1.5 bg-[#1D1D1F] text-white text-xs font-bold px-3.5 py-1 rounded-full">
                    <Package className="w-3.5 h-3.5 text-[#FF7F45]" />
                    Pack · <span className="font-mono">{book.booksInBundle}</span>{" "}
                    Books
                  </span>
                )}

                {(book.deliveryType === "MEETUP" ||
                  book.deliveryType === "BOTH") && (
                  <span className="inline-flex items-center gap-1 bg-[#0A7D4F]/10 text-[#0A7D4F] text-xs font-bold px-3.5 py-1 rounded-full border border-[#0A7D4F]/20">
                    <Handshake className="w-3.5 h-3.5" /> Meetup
                  </span>
                )}
                {(book.deliveryType === "SHIPPING" ||
                  book.deliveryType === "BOTH") && (
                  <span className="inline-flex items-center gap-1 bg-[#0066cc]/10 text-[#0066cc] text-xs font-bold px-3.5 py-1 rounded-full border border-[#0066cc]/20">
                    <Truck className="w-3.5 h-3.5" /> Courier
                  </span>
                )}
              </div>

              {/* Headline & Literary Author Credit */}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#1D1D1F] leading-[1.08] tracking-tight mb-3">
                {book.title}
              </h1>

              <p className="text-lg text-[#4a4a4f] mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C84200] shrink-0" />
                <span>
                  by{" "}
                  <span className="font-serif italic font-medium text-[#1D1D1F]">
                    {book.author}
                  </span>
                </span>
              </p>

              {/* Academic & Metadata Row */}
              <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-semibold text-[#6e6e73] mb-6">
                {book.isbn && (
                  <span className="font-mono text-xs bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#1D1D1F]/80 px-3 py-1 rounded-full">
                    ISBN {book.isbn}
                  </span>
                )}
                {book.owner.location && (
                  <span className="inline-flex items-center gap-1.5 bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#1D1D1F]/80 px-3 py-1 rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-[#C84200]" />
                    {book.owner.location}
                  </span>
                )}
                {book.university && (
                  <span className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] px-3 py-1 rounded-full">
                    {book.university}
                  </span>
                )}
                {book.course && (
                  <span className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] px-3 py-1 rounded-full">
                    {book.course}
                  </span>
                )}
                {book.semester && (
                  <span className="bg-[#FAF6F0] border border-[#C84200]/20 text-[#C84200] font-mono px-3 py-1 rounded-full">
                    Semester {book.semester}
                  </span>
                )}
              </div>

              <div className="my-6 h-px w-full bg-[#1D1D1F]/[0.08]" />

              {/* Seller Notes */}
              <div className="mb-7">
                <h2 className="text-xs font-black uppercase tracking-[0.14em] text-[#86868b] mb-2.5">
                  Reader Notes &amp; Edition Details
                </h2>
                <p className="text-[#1D1D1F]/85 leading-relaxed text-[15px] whitespace-pre-wrap">
                  {book.description ||
                    "No additional notes provided by the reader. Message them directly to inspect spine photos or meetup times."}
                </p>
                {book.isBundle && book.bundleDescription && (
                  <div className="mt-4 p-5 bg-[#FAF6F0] rounded-2xl border border-[#1D1D1F]/[0.08]">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#C84200] mb-1.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Books Included in
                      Semester Pack
                    </p>
                    <p className="text-[#1D1D1F] text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
                      {book.bundleDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* 5-Point Condition Radar */}
              <div className="mb-7 p-5 sm:p-6 bg-[#FAF6F0] rounded-3xl border border-[#1D1D1F]/[0.07]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.14em] text-[#1D1D1F]/70 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C84200]" />
                    5-Point Condition Radar
                  </h2>
                  <span className="font-mono text-xs font-black text-[#0A7D4F] bg-[#0A7D4F]/10 border border-[#0A7D4F]/20 px-3 py-1 rounded-full">
                    {avgCondition} / 5.0 ★
                  </span>
                </div>

                <div className="space-y-3">
                  {conditionMetrics.map((item) => {
                    const pct = Math.max(0, Math.min(100, (item.score / 5) * 100))
                    return (
                      <div
                        key={item.label}
                        className="grid grid-cols-[128px_1fr_auto] sm:grid-cols-[150px_1fr_auto] items-center gap-3 text-[13px]"
                      >
                        <span className="font-semibold text-[#1D1D1F]/80 truncate">
                          {item.label}
                        </span>
                        <div className="h-2 rounded-full bg-white border border-[#1D1D1F]/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#C84200] to-[#FF7F45]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#1D1D1F] w-8 text-right">
                          {item.score}/5
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Seller Header Strip */}
              <div className="mb-5 p-4 sm:p-5 rounded-3xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] flex flex-wrap sm:flex-nowrap items-center gap-3.5">
                <Link href={`/profile/${ownerHandle}`} className="shrink-0">
                  {book.owner.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.owner.image}
                      alt={book.owner.name || "Owner"}
                      className="w-12 h-12 rounded-full object-cover border border-[#1D1D1F]/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white border border-[#1D1D1F]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#C84200]" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#6e6e73]">
                    Listed by
                  </p>
                  <Link
                    href={`/profile/${ownerHandle}`}
                    className="font-black text-base text-[#1D1D1F] hover:text-[#C84200] transition-colors truncate block"
                  >
                    {book.owner.name || "Community Reader"}
                  </Link>
                  {book.owner.username && (
                    <span className="font-mono text-xs text-[#86868b]">
                      @{book.owner.username}
                    </span>
                  )}
                </div>
                {!isOwner && session && (
                  <Link
                    href={`/messages/${book.owner.id}?book=${book.id}`}
                    className="inline-flex items-center gap-2 bg-[#1D1D1F] hover:bg-[#C84200] text-white text-[13px] font-bold px-5 py-2.5 rounded-full transition-colors shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message Seller
                  </Link>
                )}
              </div>

              {/* Reputation Card */}
              <div className="mb-7">
                <SellerReputationCard user={book.owner as any} />
              </div>
            </div>

            {/* Primary Action Dock */}
            <div className="mt-auto pt-6 border-t border-[#1D1D1F]/[0.09]">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#86868b] mb-1.5">
                    {isDonation
                      ? "Vidya Daan Gift"
                      : isExchange && book.price === 0
                      ? "1-for-1 Barter Exchange"
                      : "Listing Price"}
                  </p>
                  <div className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-[#1D1D1F]">
                    {isDonation ? (
                      <span className="text-[#0A7D4F] inline-flex items-center gap-2.5">
                        Free <Tag className="w-6 h-6" />
                      </span>
                    ) : isExchange && book.price === 0 ? (
                      <span className="text-[#0066cc]">1-for-1 Swap</span>
                    ) : (
                      `₹${book.price}`
                    )}
                  </div>
                </div>
                {book.status !== "AVAILABLE" && (
                  <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-mono text-xs font-bold uppercase">
                    {book.status}
                  </span>
                )}
              </div>

              {isExchange && book.exchangePreferences && (
                <div className="mb-5 p-4 bg-[#0066cc]/[0.06] rounded-2xl border border-[#0066cc]/20">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0066cc] mb-1">
                    Reader Is Looking To Swap For
                  </p>
                  <p className="text-sm font-medium text-[#1D1D1F] leading-relaxed">
                    {book.exchangePreferences}
                  </p>
                </div>
              )}

              {session ? (
                isOwner ? (
                  <OwnerListingControls book={book} />
                ) : book.status !== "AVAILABLE" ? (
                  <div className="w-full py-4 px-6 bg-[#FAF6F0] text-[#6e6e73] border border-[#1D1D1F]/[0.08] rounded-full text-sm font-bold flex items-center justify-center">
                    Currently {book.status.toLowerCase()}
                  </div>
                ) : isDonation ? (
                  <RequestBookButton bookId={book.id} isOwner={isOwner} />
                ) : isExchange && book.price === 0 ? (
                  <ProposeSwapModal
                    targetBook={{
                      id: book.id,
                      title: book.title,
                      author: book.author,
                      exchangePreferences: book.exchangePreferences,
                    }}
                    ownerId={book.owner.id}
                    myBooks={myAvailableBooks}
                  />
                ) : (
                  <div className="space-y-3">
                    <Link
                      href={`/checkout/${book.id}`}
                      className="w-full py-4 px-6 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition-colors text-center shadow-sm"
                    >
                      Buy or Reserve Meetup for{" "}
                      <span className="font-mono">₹{book.price}</span>
                    </Link>
                    <ProposeSwapModal
                      targetBook={{
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        exchangePreferences: book.exchangePreferences,
                      }}
                      ownerId={book.owner.id}
                      myBooks={myAvailableBooks}
                      secondary
                    />
                  </div>
                )
              ) : (
                <Link
                  href={`/login?callbackUrl=/catalog/${book.id}`}
                  className="w-full py-4 px-6 bg-[#1D1D1F] hover:bg-[#C84200] text-white rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition-colors text-center shadow-sm"
                >
                  Sign In to{" "}
                  {isDonation
                    ? "Request Free Book"
                    : isExchange
                    ? "Propose 1-for-1 Swap"
                    : "Buy or Reserve Meetup"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
