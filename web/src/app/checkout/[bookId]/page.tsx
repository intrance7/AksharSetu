import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react"
import { RazorpayButton } from "@/components/checkout/RazorpayButton"

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const resolvedParams = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const book = await prisma.book.findUnique({
    where: { id: resolvedParams.bookId },
    include: {
      owner: {
        select: { name: true }
      }
    }
  })

  if (!book || book.status !== "AVAILABLE" || book.price === 0 || book.ownerId === session.user.id) {
    notFound()
  }

  const platformFee = 25
  const shippingFee = 40
  const total = book.price + platformFee + shippingFee

  const coverImage = book.images && book.images.length > 0
    ? book.images[0]
    : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-28 pb-16">
      <div className="container mx-auto max-w-4xl px-4">
        
        <Link 
          href={`/catalog/${book.id}`}
          className="inline-flex items-center gap-2 text-[#1D1D1F]/60 hover:text-[#1D1D1F] font-bold text-sm tracking-wider uppercase mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listing
        </Link>

        <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Order Summary (Left/Top) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#1D1D1F]/5">
              <h2 className="text-xl font-black text-[#1D1D1F] mb-6">Item Summary</h2>
              
              <div className="flex gap-6">
                <div className="w-24 h-32 bg-[#E8E4DF] rounded-xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex flex-col justify-center">
                  <h3 className="font-bold text-lg text-[#1D1D1F] leading-tight mb-1">{book.title}</h3>
                  <p className="text-[#1D1D1F]/60 text-sm font-medium mb-3 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" /> {book.author}
                  </p>
                  <p className="text-[#1D1D1F]/40 text-xs font-bold uppercase tracking-widest">
                    Condition: {book.condition.replace("_", " ")}
                  </p>
                  <p className="text-[#1D1D1F]/40 text-xs font-bold uppercase tracking-widest mt-1">
                    Seller: {book.owner.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#1D1D1F]/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-[#1D1D1F] mb-1">Buyer Protection Guarantee</h4>
                <p className="text-sm text-[#1D1D1F]/60 font-medium">Your payment is held securely until you receive the book in the described condition.</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown (Right/Bottom) */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1D1D1F]/5 sticky top-28">
              <h2 className="text-xl font-black text-[#1D1D1F] mb-6">Payment Details</h2>
              
              <div className="space-y-4 mb-6 text-sm font-medium text-[#1D1D1F]/70">
                <div className="flex justify-between">
                  <span>Book Price</span>
                  <span className="font-bold text-[#1D1D1F]">₹{book.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-[#1D1D1F]">₹{platformFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-bold text-[#1D1D1F]">₹{shippingFee}</span>
                </div>
              </div>

              <div className="h-px w-full bg-[#1D1D1F]/10 mb-6" />

              <div className="flex justify-between items-center mb-8">
                <span className="font-black text-[#1D1D1F] uppercase tracking-wider text-sm">Total</span>
                <span className="font-black text-2xl text-[#1D1D1F]">₹{total}</span>
              </div>

              <RazorpayButton book={book} user={session.user} amount={total} />
              
              <p className="text-center text-xs text-[#1D1D1F]/40 font-medium mt-4">
                By confirming, you agree to our Terms of Service.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
