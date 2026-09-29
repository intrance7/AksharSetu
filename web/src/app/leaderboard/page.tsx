import prisma from "@/lib/prisma"
import { Trophy, Medal, Award } from "lucide-react"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function LeaderboardPage() {
  // Fetch top 50 donors based on the count of their donations
  const topDonorsRaw = await prisma.user.findMany({
    where: {
      donations: {
        some: {}
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      _count: {
        select: { donations: true }
      }
    },
    orderBy: {
      donations: {
        _count: 'desc'
      }
    },
    take: 50
  })

  // Add ranking and format
  const topDonors = topDonorsRaw.map((donor, index) => ({
    ...donor,
    rank: index + 1,
    donationCount: donor._count.donations
  }))

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-16">
      <div className="container mx-auto max-w-4xl px-4">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-[#C84200]/10 text-[#C84200] rounded-full mb-6">
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[#1D1D1F] tracking-tight mb-4">
            Vidya Daan <span className="text-[#C84200]">Leaderboard</span>
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto font-medium">
            Celebrating the most generous members of the AksharSetu community. Every book donated is a mind enlightened.
          </p>
        </div>

        {/* Top 3 Podium (Desktop) */}
        {topDonors.length >= 3 && (
          <div className="hidden md:flex justify-center items-end gap-6 mb-16 h-64">
            {/* Rank 2 */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-gray-300">
                <Image src={topDonors[1].image || '/default-avatar.png'} alt={topDonors[1].name || 'User'} fill className="object-cover" />
              </div>
              <div className="text-[#1d1d1f] font-bold text-lg mb-2">{topDonors[1].name?.split(' ')[0] || 'User'}</div>
              <div className="w-32 h-24 bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-2xl flex items-center justify-center text-4xl font-black text-gray-500 shadow-inner relative">
                2
                <div className="absolute -top-3 bg-white text-gray-600 px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  {topDonors[1].donationCount} Books
                </div>
              </div>
            </div>

            {/* Rank 1 */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-yellow-400 shadow-xl z-10">
                <Image src={topDonors[0].image || '/default-avatar.png'} alt={topDonors[0].name || 'User'} fill className="object-cover" />
              </div>
              <div className="text-[#1d1d1f] font-black text-xl mb-2">{topDonors[0].name?.split(' ')[0] || 'User'}</div>
              <div className="w-36 h-32 bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-t-2xl flex items-center justify-center text-5xl font-black text-yellow-700 shadow-inner relative">
                1
                <div className="absolute -top-3 bg-white text-yellow-600 px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  {topDonors[0].donationCount} Books
                </div>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-amber-600">
                <Image src={topDonors[2].image || '/default-avatar.png'} alt={topDonors[2].name || 'User'} fill className="object-cover" />
              </div>
              <div className="text-[#1d1d1f] font-bold text-lg mb-2">{topDonors[2].name?.split(' ')[0] || 'User'}</div>
              <div className="w-32 h-20 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-2xl flex items-center justify-center text-4xl font-black text-amber-200 shadow-inner relative">
                3
                <div className="absolute -top-3 bg-white text-amber-800 px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  {topDonors[2].donationCount} Books
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-black/[0.04]">
          {topDonors.length === 0 ? (
             <div className="text-center text-[#86868b] py-12">
               No donations recorded yet. Be the first to make a difference!
             </div>
          ) : (
            <div className="flex flex-col gap-4">
              {topDonors.map((donor, idx) => (
                <div 
                  key={donor.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#F2EBE1] transition-colors"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Rank */}
                    <div className={`w-10 text-center font-black text-xl ${
                      donor.rank === 1 ? 'text-yellow-500' :
                      donor.rank === 2 ? 'text-gray-400' :
                      donor.rank === 3 ? 'text-amber-600' :
                      'text-[#86868b]'
                    }`}>
                      #{donor.rank}
                    </div>

                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      <Image 
                        src={donor.image || '/default-avatar.png'} 
                        alt={donor.name || 'User'} 
                        fill 
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="font-bold text-[#1d1d1f] text-lg">{donor.name || donor.email?.split('@')[0] || 'Anonymous'}</h3>
                      <p className="text-sm font-medium text-[#86868b] hidden sm:block">Generous Contributor</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 bg-[#C84200]/10 px-4 py-2 rounded-full">
                    <Award className="w-5 h-5 text-[#C84200]" />
                    <span className="font-black text-[#C84200]">{donor.donationCount}</span>
                    <span className="text-sm font-bold text-[#C84200]/70 hidden sm:inline">Donated</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
