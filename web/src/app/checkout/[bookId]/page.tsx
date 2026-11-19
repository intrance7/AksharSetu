import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { CheckoutClient } from "@/components/checkout/CheckoutClient"

export const dynamic = "force-dynamic"

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const resolvedParams = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/login?callbackUrl=/checkout/${resolvedParams.bookId}`)
  }

  const book = await prisma.book.findUnique({
    where: { id: resolvedParams.bookId },
    include: {
      owner: {
        select: { name: true },
      },
    },
  })

  if (
    !book ||
    book.status !== "AVAILABLE" ||
    book.price === 0 ||
    book.ownerId === session.user.id
  ) {
    notFound()
  }

  const platformFee = 25

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Compact Obsidian Checkout Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-12 md:py-16 border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF7F45 0%, #C84200 42%, transparent 72%)",
          }}
        />

        <div className="container mx-auto max-w-5xl px-4 md:px-8 relative z-10">
          <Link
            href={`/catalog/${book.id}`}
            className="inline-flex items-center gap-2 text-[#F2EBE1]/75 hover:text-[#FF7F45] font-bold text-xs tracking-wider uppercase mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Listing
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F5F5F7] tracking-tight leading-tight">
                Complete Your{" "}
                <span className="font-serif italic font-normal text-[#FF7F45]">
                  Handoff.
                </span>
              </h1>
              <p className="text-[#F2EBE1]/70 text-sm sm:text-base mt-2 max-w-xl">
                Choose zero-fee campus meetup reservation or tracked doorstep
                courier protected by AksharSetu escrow.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.07] border border-white/15 text-xs font-bold text-[#F2EBE1]/90">
              <ShieldCheck className="w-4 h-4 text-[#0A7D4F]" /> Escrow Protected
            </span>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 md:px-8 pt-8">
        <CheckoutClient
          book={book as any}
          user={session.user}
          platformFee={platformFee}
        />
      </div>
    </div>
  )
}
