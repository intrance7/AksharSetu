import { BadgeCard } from "@/components/profile/BadgeCard"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export default async function BadgesPage() {
  const session = await auth()
  
  const allBadges = await prisma.badge.findMany({
    orderBy: [
      { category: 'asc' },
      { requirementThreshold: 'asc' }
    ]
  })

  let earnedBadgeIds = new Set<string>()
  
  if (session?.user?.id) {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: session.user.id },
      select: { badgeId: true }
    })
    earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))
  }

  // Group badges by category
  const badgesByCategory = allBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = []
    }
    acc[badge.category].push(badge)
    return acc
  }, {} as Record<string, typeof allBadges>)

  return (
    <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-16">
      <div className="container mx-auto max-w-4xl px-4">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight mb-4">
            Badge Directory
          </h1>
          <p className="text-[#1D1D1F]/60 text-lg max-w-2xl mx-auto font-medium">
            Earn badges by donating books, reading in the library, and building a trusted community. 
            Here are all the badges you can unlock on AksharSetu.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {Object.entries(badgesByCategory).map(([category, badges]) => (
            <div key={category} className="bg-white rounded-[2rem] p-8 md:p-12 border border-[#1D1D1F]/5 shadow-sm">
              <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight mb-8 uppercase flex items-center gap-3">
                <span className="w-8 h-1 bg-[#1D1D1F] rounded-full inline-block" />
                {category} Badges
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {badges.map(badge => (
                  <BadgeCard 
                    key={badge.id} 
                    badge={badge} 
                    size="large"
                    earned={earnedBadgeIds.has(badge.id)} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
