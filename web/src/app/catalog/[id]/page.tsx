import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { RequestBookButton } from "@/components/catalog/RequestBookButton"
import { SellerReputationCard } from "@/components/catalog/SellerReputationCard"
import { ProposeSwapModal } from "@/components/catalog/ProposeSwapModal"
import Link from "next/link"
import { ArrowLeft, BookOpen, Tag, User, MessageCircle } from "lucide-react"

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
  const coverImage =
    book.images && book.images.length > 0
      ? book.images[0]
      : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"

  const isDonation = book.price === 0 && !book.acceptsExchange
  const isExchange = book.acceptsExchange

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-24 pb-16">
      <div className="container mx-auto max-w-5xl px-4 md:px-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] font-bold text-xs tracking-wider uppercase mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Image */}
          <div className="w-full md:w-1/2 lg:w-3/5 bg-[#e8e8ed] relative aspect-[4/3] md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-1/2 lg:w-2/5 p-8 md:p-10 flex flex-col">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-[#1d1d1f] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  {book.category}
                </span>
                <span className="bg-[#f5f5f7] text-[#1d1d1f] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-black/5">
                  {book.condition.replace("_", " ")}
                </span>

                {book.isBundle && (
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-purple-200">
                    Bundle: {book.booksInBundle} Books
                  </span>
                )}

                {(book.deliveryType === "MEETUP" || book.deliveryType === "BOTH") && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-200">
                    Meetup
                  </span>
                )}
                {(book.deliveryType === "SHIPPING" || book.deliveryType === "BOTH") && (
                  <span className="bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Shipping
                  </span>
                )}

                {book.university && (
                  <span className="bg-[#e8e8ed] text-[#1d1d1f] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {book.university}
                  </span>
                )}
                {book.course && (
                  <span className="bg-[#e8e8ed] text-[#1d1d1f] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {book.course}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-[#1d1d1f] leading-tight mb-2 tracking-tight">
                {book.title}
              </h1>

              <p className="text-base text-[#86868b] font-medium mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0066cc]" />
                {book.author}
              </p>

              {book.isbn && (
                <p className="text-xs font-semibold text-[#86868b] tracking-wider mb-5">
                  ISBN: {book.isbn}
                </p>
              )}

              <div className="my-6 h-px w-full bg-black/5" />

              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-2">
                  Description
                </h3>
                <p className="text-[#1d1d1f]/80 leading-relaxed text-sm whitespace-pre-wrap">
                  {book.description || "No description provided by the seller."}
                </p>
                {book.isBundle && book.bundleDescription && (
                  <div className="mt-4 p-4 bg-[#f5f5f7] rounded-2xl border border-black/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-700 mb-1">
                      Books Included in Bundle:
                    </p>
                    <p className="text-[#1d1d1f] text-sm whitespace-pre-wrap">
                      {book.bundleDescription}
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6 p-5 bg-[#f5f5f7] rounded-2xl border border-black/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-3">
                  Condition Breakdown
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Cover & Spine", score: book.condCover || 5 },
                    { label: "Pages", score: book.condPages || 5 },
                    { label: "Highlighting", score: book.condHighlighting || 5 },
                    { label: "Notes", score: book.condNotes || 5 },
                    { label: "Binding", score: book.condBinding || 5 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center text-xs font-medium">
                      <span className="w-1/3 text-[#1d1d1f]/80">{item.label}</span>
                      <div className="flex-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              item.score >= star
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-300 fill-gray-300"
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

              <div className="mb-6 p-4 rounded-2xl bg-[#f5f5f7] border border-black/5 flex items-center gap-3">
                <Link href={`/profile/${book.owner.id}`} className="shrink-0">
                  {book.owner.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.owner.image}
                      alt={book.owner.name || "Owner"}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#e8e8ed] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#86868b]" />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">
                    Listed by
                  </p>
                  <Link
                    href={`/profile/${book.owner.id}`}
                    className="font-bold text-sm text-[#1d1d1f] hover:text-[#0066cc] truncate block"
                  >
                    {book.owner.name || "Reader"}
                  </Link>
                </div>
                {!isOwner && session && (
                  <Link
                    href={`/messages/${book.owner.id}`}
                    className="flex items-center gap-1.5 bg-[#1d1d1f] hover:bg-[#0066cc] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </Link>
                )}
              </div>

              <div className="mb-6">
                <SellerReputationCard user={book.owner as any} />
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-black/5">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#86868b] mb-1">
                    Price
                  </p>
                  <p className="text-3xl font-bold text-[#1d1d1f]">
                    {isDonation ? (
                      <span className="text-emerald-600 flex items-center gap-2">
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
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase">
                    {book.status}
                  </span>
                )}
              </div>

              {isExchange && book.exchangePreferences && (
                <div className="mb-5 p-3.5 bg-[#0066cc]/6 rounded-2xl border border-[#0066cc]/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0066cc] mb-0.5">
                    Looking for:
                  </p>
                  <p className="text-xs font-medium text-[#1d1d1f]">
                    {book.exchangePreferences}
                  </p>
                </div>
              )}

              {session ? (
                isOwner ? (
                  <div className="w-full py-3.5 px-6 bg-[#f5f5f7] text-[#86868b] rounded-full text-sm font-semibold flex items-center justify-center">
                    This is your listing
                  </div>
                ) : book.status !== "AVAILABLE" ? (
                  <div className="w-full py-3.5 px-6 bg-[#f5f5f7] text-[#86868b] rounded-full text-sm font-semibold flex items-center justify-center">
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
                  <div>
                    <Link
                      href={`/checkout/${book.id}`}
                      className="w-full py-4 px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors text-center shadow-sm"
                    >
                      Buy Now for ₹{book.price}
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
                  className="w-full py-4 px-6 bg-[#1d1d1f] hover:bg-[#0066cc] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors text-center"
                >
                  Log in to {isDonation ? "Request" : isExchange ? "Swap" : "Buy"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
