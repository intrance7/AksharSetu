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
    <div className="min-h-screen bg-[#F2EBE1] pb-20">
      <section className="bg-black text-[#F5F5F7] py-14 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-[#F5F5F7]/80 mb-4">
            <MapPin className="w-3.5 h-3.5 text-[#C84200]" /> Hyperlocal Book
            Radar
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-3">
            Books Near Your Campus & City.
          </h1>
          <p className="text-[#86868b] text-base md:text-lg max-w-2xl">
            Discover textbooks, novels, free community donations, and 1-for-1
            swaps walking distance from your hostel or neighborhood.
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

