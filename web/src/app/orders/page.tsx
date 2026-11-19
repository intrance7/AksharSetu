import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { OrdersDashboardClient } from "@/components/orders/OrdersDashboardClient"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrdersAndSwapsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders")
  }

  const userId = session.user.id

  const [purchases, sales, incomingRequests, outgoingRequests, myListings] =
    await Promise.all([
      prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          book: {
            include: {
              owner: { select: { id: true, name: true, image: true } },
            },
          },
          shipment: true,
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        where: { book: { ownerId: userId } },
        include: {
          book: true,
          buyer: { select: { id: true, name: true, image: true } },
          shipment: true,
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bookRequest.findMany({
        where: { book: { ownerId: userId } },
        include: {
          book: true,
          requester: { select: { id: true, name: true, image: true } },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bookRequest.findMany({
        where: { requesterId: userId },
        include: {
          book: {
            include: {
              owner: { select: { id: true, name: true, image: true } },
            },
          },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.findMany({
        where: { ownerId: userId, status: { not: "REMOVED" } },
        orderBy: { createdAt: "desc" },
      }),
    ])

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-16 md:py-20 border-b border-white/10">
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
          className="pointer-events-none absolute -top-28 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF7F45 0%, #C84200 42%, transparent 72%)",
          }}
        />

        <div className="container mx-auto max-w-6xl px-4 md:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/15 text-[#F2EBE1]/90 text-xs font-bold uppercase tracking-[0.14em] mb-5">
            <Package className="w-4 h-4 text-[#FF7F45]" /> Escrow Logistics,
            Listings &amp; Barter Hub
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.03] mb-4">
            Orders, Swaps &amp;{" "}
            <span className="font-serif italic font-normal text-[#FF7F45]">
              Listings.
            </span>
          </h1>
          <p className="text-[#F2EBE1]/72 text-base md:text-lg leading-relaxed max-w-2xl">
            Manage your active book listings, track live AWB shipments, approve
            1-for-1 swap proposals, and rate verified reader handoffs.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pt-8">
        <OrdersDashboardClient
          purchases={purchases}
          sales={sales}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          myListings={myListings}
        />
      </div>
    </div>
  )
}
