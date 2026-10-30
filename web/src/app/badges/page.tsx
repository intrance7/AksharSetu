import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Shield, Lock } from "lucide-react"
import { checkAndAwardBadges, ensureDefaultBadges } from "@/services/badgeService"

export default async function BadgesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  await checkAndAwardBadges(session.user.id)
  const allBadges = await ensureDefaultBadges()

  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: { badge: true },
  })

  const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))

  return (
    <div className="min-h-screen bg-[#f5f5f7] pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-[#0066cc]/10 text-[#0066cc] rounded-full mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-[#1d1d1f] tracking-tighter leading-none mb-4">
            Your Achievements
          </h1>
          <p className="text-lg text-[#86868b] max-w-2xl mx-auto font-medium">
            Collect verified badges automatically by donating books, completing Shanti reading sessions, saving literary highlights, and exchanging books.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allBadges.map((badge) => {
            const isUnlocked = unlockedBadgeIds.has(badge.id)
            const userBadge = userBadges.find((ub) => ub.badgeId === badge.id)

            return (
              <div
                key={badge.id}
                className={`relative group bg-white rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border border-black/5 shadow-sm ${
                  isUnlocked
                    ? "hover:shadow-xl hover:-translate-y-1.5"
                    : "opacity-65 grayscale hover:opacity-85"
                }`}
              >
                <div className="relative aspect-square w-full mb-6 rounded-2xl overflow-hidden bg-[#f5f5f7] shadow-inner">
                  <Image
                    src={badge.iconUrl}
                    alt={badge.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center backdrop-blur-xs">
                      <div className="bg-white/95 p-4 rounded-full shadow-lg">
                        <Lock className="w-6 h-6 text-[#1d1d1f]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0066cc] block mb-1">
                    {badge.category}
                  </span>
                  <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight mb-2">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-[#86868b] mb-5 min-h-[40px] font-medium">
                    {badge.description}
                  </p>

                  {isUnlocked ? (
                    <div className="inline-flex items-center px-4 py-1.5 bg-[#0066cc]/10 text-[#0066cc] rounded-full text-xs font-bold tracking-wide">
                      UNLOCKED {userBadge?.earnedAt.toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-4 py-1.5 bg-[#e8e8ed] text-[#86868b] rounded-full text-xs font-bold tracking-wide uppercase">
                      Threshold: {badge.requirementThreshold}
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
