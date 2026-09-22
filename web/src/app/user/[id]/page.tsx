import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BookCard } from "@/components/catalog/BookCard"
import { BadgeCard } from "@/components/profile/BadgeCard"
import { MapPin } from "lucide-react"
import Link from "next/link"

export default async function UserProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: {
      badges: {
        include: { badge: true }
      },
      books: {
        where: { status: "AVAILABLE" },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        
        {/* Header Profile Card */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-[#1D1D1F]/5 shadow-sm mb-12 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
          
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center shrink-0 overflow-hidden border-4 border-white shadow-md">
            {user.image ? (
               // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-[#1D1D1F]/40 font-black">
                {user.name ? user.name.charAt(0).toUpperCase() : "?"}
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center h-full pt-2">
            <h1 className="text-3xl md:text-5xl font-black text-[#1D1D1F] tracking-tight mb-2">
              {user.name}
            </h1>
            
            {user.location && (
              <p className="flex items-center justify-center md:justify-start gap-1 text-[#1D1D1F]/50 font-bold tracking-wider uppercase text-sm mb-6">
                <MapPin className="w-4 h-4" /> {user.location}
              </p>
            )}

            <p className="text-[#1D1D1F]/70 text-lg font-medium max-w-2xl leading-relaxed">
              {user.bio || "This user hasn't written a bio yet."}
            </p>

            {user.isShantiModeActive && user.liveStatus && (
              <div className="mt-6 inline-flex items-center gap-3 bg-[#1D1D1F] text-white px-5 py-3 rounded-2xl shadow-lg border border-white/10 animate-pulse">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]"></span>
                </span>
                <p className="font-bold text-sm tracking-wide">{user.liveStatus}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Badges */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-black text-[#1D1D1F] mb-6">Trophy Cabinet</h2>
            
            <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/5 shadow-sm flex flex-col gap-4">
              {user.badges.length === 0 ? (
                <p className="text-[#1D1D1F]/40 font-medium text-sm text-center py-4">No badges earned yet.</p>
              ) : (
                <>
                  {user.badges.map(({ badge, earnedAt }) => (
                    <BadgeCard key={badge.id} badge={badge} earnedAt={earnedAt} earned={true} />
                  ))}
                  <div className="mt-2 text-center">
                    <Link href="/badges" className="text-[#1D1D1F]/50 hover:text-[#1D1D1F] font-bold text-xs underline decoration-[#1D1D1F]/20 underline-offset-4">
                      What are these badges?
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Listings */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-black text-[#1D1D1F] mb-6">Active Listings</h2>
            
            {user.books.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-[#1D1D1F]/5 shadow-sm text-center">
                <p className="text-[#1D1D1F]/40 font-medium">{user.name} currently has no active book listings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
