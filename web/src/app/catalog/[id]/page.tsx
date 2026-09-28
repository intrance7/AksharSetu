import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { RequestBookButton } from "@/components/catalog/RequestBookButton"
import { SellerReputationCard } from "@/components/catalog/SellerReputationCard"
import Link from "next/link"
import { ArrowLeft, BookOpen, Tag, User, MessageCircle } from "lucide-react"

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const session = await auth()

  const book = await prisma.book.findUnique({
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
  })

  if (!book) {
    notFound()
  }

  const isOwner = session?.user?.id === book.ownerId
  const coverImage = book.images && book.images.length > 0
    ? book.images[0]
    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"

  const isDonation = book.price === 0 && !book.acceptsExchange
  const isExchange = book.acceptsExchange

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-16">
      <div className="container mx-auto max-w-5xl px-4 md:px-8">
        
        <Link 
          href="/catalog" 
          className="inline-flex items-center gap-2 text-[#1D1D1F]/60 hover:text-[#1D1D1F] font-bold text-sm tracking-wider uppercase mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        <div className="bg-white rounded-[2rem] shadow-sm border border-[#1D1D1F]/5 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Image */}
          <div className="w-full md:w-1/2 lg:w-3/5 bg-[#E8E4DF] relative aspect-[4/3] md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={coverImage}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-1/2 lg:w-2/5 p-8 md:p-12 flex flex-col">
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-[#1D1D1F] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                  {book.category}
                </span>
                <span className="bg-[#1D1D1F]/5 text-[#1D1D1F] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#1D1D1F]/10">
                  {book.condition.replace('_', ' ')}
                </span>
                
                {/* Delivery Badges */}
                {(book as any).deliveryType === "MEETUP" || (book as any).deliveryType === "BOTH" ? (
                  <span className="bg-[#287F56]/10 text-[#287F56] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#287F56]/20">
                    🤝 Meetup
                  </span>
                ) : null}
                {(book as any).deliveryType === "SHIPPING" || (book as any).deliveryType === "BOTH" ? (
                  <span className="bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#0066cc]/20">
                    📦 Shipping
                  </span>
                ) : null}

                {book.university && (
                  <span className="bg-[#e8e8ed] text-[#1D1D1F] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                    {book.university}
                  </span>
                )}
                {book.course && (
                  <span className="bg-[#e8e8ed] text-[#1D1D1F] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                    {book.course}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] leading-tight mb-2 tracking-tight">
                {book.title}
              </h1>
              
              <p className="text-lg text-[#1D1D1F]/60 font-medium mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#C84200]" />
                {book.author}
              </p>

              {book.isbn && (
                <p className="text-sm font-bold text-[#1D1D1F]/40 tracking-wider mb-6">
                  ISBN: {book.isbn}
                </p>
              )}

              <div className="my-8 h-px w-full bg-[#1D1D1F]/5" />

              <div className="mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1D1D1F]/40 mb-3">Description</h3>
                <p className="text-[#1D1D1F]/70 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                  {book.description || "No description provided by the seller."}
                </p>
              </div>

              <div className="mb-8 p-5 bg-[#F9F9FB] rounded-2xl border border-[#1D1D1F]/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F]/60 mb-4">Condition Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: "Cover & Spine", score: book.condCover || 5 },
                    { label: "Pages", score: book.condPages || 5 },
                    { label: "Highlighting", score: book.condHighlighting || 5 },
                    { label: "Notes", score: book.condNotes || 5 },
                    { label: "Binding", score: book.condBinding || 5 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center text-sm font-medium">
                      <span className="w-1/3 text-[#1D1D1F]/70">{item.label}</span>
                      <div className="flex-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg 
                            key={star}
                            className={`w-4 h-4 ${item.score >= star ? 'text-[#F4B22B] fill-[#F4B22B]' : 'text-gray-200 fill-gray-200'}`} 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8 p-4 rounded-2xl bg-[#F2EBE1] border border-[#1D1D1F]/5 flex items-center gap-4">
                {book.owner.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.owner.image} alt={book.owner.name || "Owner"} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1D1D1F]/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#1D1D1F]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1D1D1F]/40">Listed by</p>
                  <p className="font-bold text-[#1D1D1F]">{book.owner.name || "Anonymous User"}</p>
                </div>
                {!isOwner && session && (
                  <Link
                    href={`/messages/${book.owner.id}`}
                    className="flex items-center gap-2 bg-[#1D1D1F] hover:bg-[#2d2d2f] text-white text-xs font-bold px-4 py-2.5 rounded-full transition-colors shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </Link>
                )}
              </div>

              <div className="mb-8">
                <SellerReputationCard user={book.owner as any} />
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1D1D1F]/40 mb-1">Price</p>
                  <p className="text-4xl font-black text-[#1D1D1F]">
                    {isDonation ? (
                      <span className="text-emerald-500 flex items-center gap-2">
                        Free <Tag className="w-6 h-6" />
                      </span>
                    ) : isExchange ? (
                      <span className="text-[#0066cc] flex items-center gap-2">
                        Exchange
                      </span>
                    ) : (
                      `₹${book.price}`
                    )}
                  </p>
                </div>
              </div>

              {isExchange && book.exchangePreferences && (
                <div className="mb-6 p-4 bg-[#F2EBE1] rounded-xl border border-[#0066cc]/20">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#0066cc] mb-1">Looking for:</p>
                  <p className="text-sm font-medium text-[#1D1D1F]">{book.exchangePreferences}</p>
                </div>
              )}

              {session ? (
                isDonation ? (
                  <RequestBookButton bookId={book.id} isOwner={isOwner} />
                ) : isExchange ? (
                  isOwner ? (
                    <div className="w-full py-4 px-6 bg-[#1D1D1F]/5 text-[#1D1D1F]/60 rounded-full font-bold flex items-center justify-center gap-2">
                      This is your listing
                    </div>
                  ) : (
                    <Link 
                      href={`/messages/${book.owner.id}?book=${book.id}&action=exchange`}
                      className="w-full py-4 px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors block text-center"
                    >
                      Propose Exchange
                    </Link>
                  )
                ) : isOwner ? (
                  <div className="w-full py-4 px-6 bg-[#1D1D1F]/5 text-[#1D1D1F]/60 rounded-full font-bold flex items-center justify-center gap-2">
                    This is your listing
                  </div>
                ) : (
                  <Link 
                    href={`/checkout/${book.id}`}
                    className="w-full py-4 px-6 bg-[#C84200] hover:bg-[#e65c19] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors block text-center"
                  >
                    Buy Now for ₹{book.price}
                  </Link>
                )
              ) : (
                <Link 
                  href="/login"
                  className="w-full py-4 px-6 bg-[#1D1D1F] hover:bg-[#2d2d2f] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors block text-center"
                >
                  Log in to {isDonation ? "Request" : isExchange ? "Exchange" : "Buy"}
                </Link>
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}
