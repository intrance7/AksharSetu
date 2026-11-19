import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { BooksMapClient } from "@/components/map/BooksMapClient"
import { MapPin } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BooksNearMeMapPage() {
  const session = await auth()
  let userLocation: { latitude: number | null; longitude: number | null } | null =
    null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true },
    })
    if (user?.latitude && user?.longitude) {
      userLocation = { latitude: user.latitude, longitude: user.longitude }
    }
  }

  const books = await prisma.book.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          location: true,
          latitude: true,
          longitude: true,
          sellerRating: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-16 md:py-20 px-4 md:px-8 border-b border-white/10">
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

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/15 text-xs font-bold uppercase tracking-[0.14em] text-[#F2EBE1]/90 mb-5">
            <MapPin className="w-3.5 h-3.5 text-[#FF7F45]" /> Hyperlocal Book
            Radar
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.03] mb-4 max-w-3xl">
            Books Near{" "}
            <span className="font-serif italic font-normal text-[#FF7F45]">
              You.
            </span>
          </h1>
          <p className="text-[#F2EBE1]/72 text-base md:text-lg leading-relaxed max-w-2xl">
            Discover textbooks, novels, free Vidya Daan pickups, and 1-for-1
            swaps within walking distance of your hostel, library, or metro
            stop.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-8">
        <BooksMapClient
          books={books}
          initialLocation={userLocation}
          isLoggedIn={Boolean(session?.user?.id)}
        />
      </div>
    </div>
  )
}
