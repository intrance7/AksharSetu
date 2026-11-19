import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
    <div className="min-h-screen bg-[#F2EBE1] pt-10 md:pt-14 pb-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-8">
        <Link
          href={`/catalog/${book.id}`}
          className="inline-flex items-center gap-2 text-[#1D1D1F]/60 hover:text-[#C84200] font-bold text-xs tracking-wider uppercase mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listing
        </Link>

        <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight mb-8">
          Checkout
        </h1>

        <CheckoutClient
          book={book as any}
          user={session.user}
          platformFee={platformFee}
        />
      </div>
    </div>
  )
}
