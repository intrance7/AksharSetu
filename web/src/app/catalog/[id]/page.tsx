import type { Metadata } from "next"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { RequestBookButton } from "@/components/catalog/RequestBookButton"
import { SellerReputationCard } from "@/components/catalog/SellerReputationCard"
import { ProposeSwapModal } from "@/components/catalog/ProposeSwapModal"
import { OwnerListingControls } from "@/components/catalog/OwnerListingControls"
import { GeneratedCover } from "@/components/catalog/GeneratedCover"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Tag,
  User,
  MessageCircle,
  ChevronRight,
  MapPin,
} from "lucide-react"

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
      images: book.images?.[0] ? [{ url: book.images[0], alt: book.title }] : undefined,
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
  const baseUrl =
    process.env.AUTH_URL || "https://aksharsetu-iota.vercel.app"

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

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-10 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container mx-auto max-w-5xl px-4 md:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#1D1D1F]/60 mb-6"
        >
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-[#1D1D1F] hover:text-[#C84200] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Catalog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link
            href={`/catalog?category=${encodeURIComponent(
              book.category.toLowerCase()
            )}`}
            className="hover:text-[#C84200] capitalize transition-colors"
          >
            {book.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-[#1D1D1F] truncate max-w-[260px]">
            {book.title}
          </span>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm border border-[#1D1D1F]/10 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Editorial Cover Stage */}
          <div className="w-full md:w-1/2 lg:w-5/12 bg-[#FAF6F0] p-8 md:p-12 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#1D1D1F]/[0.08]">
            <div className="relative w-[68%] max-w-[280px] aspect-[5/7] rounded-lg overflow-hidden shadow-[18px_22px_44px_rgba(0,0,0,0.22)]">
              {hasCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.images[0]}
                  alt={`${book.title} by ${book.author}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <GeneratedCover
                  title={book.title}
                  author={book.author}
                  category={book.category}
                />
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-1/2 lg:w-7/12 p-6 sm:p-8 md:p-10 flex flex-col">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-[#C84200]/10 text-[#C84200] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                  {book.category}
                </span>
                <span className="bg-[#FAF6F0] text-[#1D1D1F] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-black/10">
                  {book.condition.replace("_", " ")}
                </span>

                {book.isBundle && (
                  <span className="bg-purple-50 text-purple-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-purple-200">
                    Bundle: {book.booksInBundle} Books
                  </span>
                )}

                {(book.deliveryType === "MEETUP" ||
                  book.deliveryType === "BOTH") && (
                  <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200">
                    Campus / City Meetup
                  </span>
                )}
                {(book.deliveryType === "SHIPPING" ||
                  book.deliveryType === "BOTH") && (
                  <span className="bg-[#0066cc]/10 text-[#0066cc] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Courier Delivery
                  </span>
                )}

                {book.university && (
                  <span className="bg-[#FAF6F0] text-[#1D1D1F] text-[11px] font-bold px-3 py-1 rounded-full border border-black/10">
                    {book.university}
                  </span>
                )}
                {book.course && (
                  <span className="bg-[#FAF6F0] text-[#1D1D1F] text-[11px] font-bold px-3 py-1 rounded-full border border-black/10">
                    {book.course}
                  </span>
                )}
                {book.semester && (
                  <span className="bg-[#FAF6F0] text-[#C84200] text-[11px] font-bold px-3 py-1 rounded-full border border-[#C84200]/20">
                    Semester {book.semester}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1D1D1F] leading-tight mb-2 tracking-tight">
                {book.title}
              </h1>

              <p className="text-base text-[#86868b] font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C84200]" />
                by {book.author}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#86868b] mb-5">
                {book.isbn && <span>ISBN: {book.isbn}</span>}
                {book.owner.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C84200]" />{" "}
                    {book.owner.location}
                  </span>
                )}
              </div>

              <div className="my-5 h-px w-full bg-black/[0.08]" />

              <div className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-[#86868b] mb-2">
                  Seller Notes & Description
                </h2>
                <p className="text-[#1D1D1F]/85 leading-relaxed text-sm whitespace-pre-wrap">
                  {book.description ||
                    "No additional notes provided by the seller."}
                </p>
                {book.isBundle && book.bundleDescription && (
                  <div className="mt-4 p-4 bg-[#FAF6F0] rounded-2xl border border-black/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-800 mb-1">
                      Books Included in Bundle:
                    </p>
                    <p className="text-[#1D1D1F] text-sm whitespace-pre-wrap">
                      {book.bundleDescription}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6 p-5 bg-[#FAF6F0] rounded-2xl border border-black/[0.08]">
                <h2 className="text-xs font-black uppercase tracking-widest text-[#86868b] mb-3">
                  5-Point Condition Breakdown
                </h2>
                <div className="space-y-2.5">
                  {[
                    { label: "Cover & Spine", score: book.condCover || 5 },
                    { label: "Pages", score: book.condPages || 5 },
                    {
                      label: "Highlighting",
                      score: book.condHighlighting || 5,
                    },
                    { label: "Margin Notes", score: book.condNotes || 5 },
                    { label: "Binding", score: book.condBinding || 5 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center text-xs font-semibold"
                    >
                      <span className="w-1/3 text-[#1D1D1F]/80">
                        {item.label}
                      </span>
                      <div className="flex-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              item.score >= star
                                ? "text-amber-500 fill-amber-500"
                                : "text-black/15 fill-black/15"
                            }`}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-[#FAF6F0] border border-black/[0.08] flex items-center gap-3">
                <Link href={`/profile/${book.owner.id}`} className="shrink-0">
                  {book.owner.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.owner.image}
                      alt={book.owner.name || "Owner"}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-white border border-black/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#C84200]" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">
                    Listed by
                  </p>
                  <Link
                    href={`/profile/${book.owner.id}`}
                    className="font-bold text-sm text-[#1D1D1F] hover:text-[#C84200] truncate block"
                  >
                    {book.owner.name || "Reader"}
                  </Link>
                </div>
                {!isOwner && session && (
                  <Link
                    href={`/messages/${book.owner.id}?book=${book.id}`}
                    className="flex items-center gap-1.5 bg-[#1D1D1F] hover:bg-[#C84200] text-white text-xs font-bold px-4 py-2.5 rounded-full transition-colors shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message Seller
                  </Link>
                )}
              </div>

              <div className="mb-6">
                <SellerReputationCard user={book.owner as any} />
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-black/10">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-1">
                    Listing Price
                  </p>
                  <p className="text-3xl font-black text-[#1D1D1F]">
                    {isDonation ? (
                      <span className="text-emerald-700 flex items-center gap-2">
                        Free Donation <Tag className="w-5 h-5" />
                      </span>
                    ) : isExchange && book.price === 0 ? (
                      <span className="text-[#0066cc]">1-for-1 Swap</span>
                    ) : (
                      `₹${book.price}`
                    )}
                  </p>
                </div>
                {book.status !== "AVAILABLE" && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase">
                    {book.status}
                  </span>
                )}
              </div>

              {isExchange && book.exchangePreferences && (
                <div className="mb-5 p-3.5 bg-[#0066cc]/[0.06] rounded-2xl border border-[#0066cc]/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0066cc] mb-0.5">
                    Seller is Looking For:
                  </p>
                  <p className="text-xs font-medium text-[#1D1D1F]">
                    {book.exchangePreferences}
                  </p>
                </div>
              )}

              {session ? (
                isOwner ? (
                  <OwnerListingControls book={book} />
                ) : book.status !== "AVAILABLE" ? (
                  <div className="w-full py-3.5 px-6 bg-[#FAF6F0] text-[#86868b] rounded-full text-sm font-bold flex items-center justify-center">
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
                  <div className="space-y-2.5">
                    <Link
                      href={`/checkout/${book.id}`}
                      className="w-full py-4 px-6 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors text-center shadow-sm"
                    >
                      Buy or Reserve Meetup for ₹{book.price}
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
                  className="w-full py-4 px-6 bg-[#1D1D1F] hover:bg-[#C84200] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors text-center"
                >
                  Log in to{" "}
                  {isDonation ? "Request Donation" : isExchange ? "Propose Swap" : "Buy or Reserve"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
