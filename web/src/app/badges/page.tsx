import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Shield, Lock } from "lucide-react"

export default async function BadgesPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch all badges
  const allBadges = await prisma.badge.findMany({
    orderBy: { requirementThreshold: 'asc' }
  })

  // Fetch user's unlocked badges
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: { badge: true }
  })

  const unlockedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-[#0066cc]/10 text-[#0066cc] rounded-full mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[#1D1D1F] tracking-tight mb-4">
            Your Achievements
          </h1>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto font-medium">
            Collect badges by donating books, maintaining high trust ratings, and being an active member of the AksharSetu community.
          </p>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allBadges.map(badge => {
            const isUnlocked = unlockedBadgeIds.has(badge.id)
            const userBadge = userBadges.find(ub => ub.badgeId === badge.id)
            
            return (
              <div 
                key={badge.id}
                className={`relative group bg-white rounded-3xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border border-black/[0.04]
                  ${isUnlocked ? 'hover:shadow-2xl hover:-translate-y-2' : 'opacity-60 grayscale hover:opacity-80'}
                `}
              >
                {/* Badge Image */}
                <div className="relative aspect-square w-full mb-6 rounded-2xl overflow-hidden bg-[#F2EBE1] shadow-inner">
                  <Image 
                    src={badge.iconUrl}
                    alt={badge.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-[#F2EBE1]/40 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
                      <div className="bg-white/90 p-4 rounded-full shadow-lg">
                        <Lock className="w-6 h-6 text-[#1d1d1f]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Badge Info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight mb-2">{badge.name}</h3>
                  <p className="text-sm text-[#86868b] mb-5 h-10 font-medium">{badge.description}</p>
                  
                  {isUnlocked ? (
                    <div className="inline-flex items-center px-4 py-1.5 bg-[#0066cc]/10 text-[#0066cc] rounded-full text-xs font-bold tracking-wide">
                      UNLOCKED {userBadge?.earnedAt.toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-4 py-1.5 bg-[#1d1d1f]/5 text-[#1d1d1f]/60 rounded-full text-xs font-bold tracking-wide uppercase">
                      Locked
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
