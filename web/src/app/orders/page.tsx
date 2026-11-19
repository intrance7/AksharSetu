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
      <section className="bg-black text-[#F5F5F7] py-14 md:py-16 border-b border-white/10">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#F5F5F7]/90 text-xs font-bold uppercase tracking-wider mb-4">
            <Package className="w-3.5 h-3.5 text-[#C84200]" /> Escrow Logistics,
            Listings & Barter Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-3">
            Orders, Swaps & Listings.
          </h1>
          <p className="text-[#86868b] text-base md:text-lg max-w-2xl">
            Manage your active book listings, track live AWB shipments, approve
            1-for-1 book swap proposals, and rate verified handoffs.
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
