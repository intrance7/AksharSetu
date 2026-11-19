import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Shield, Lock, CheckCircle2, ArrowRight, Trophy } from "lucide-react"
import {
  checkAndAwardBadges,
  ensureDefaultBadges,
  getBadgeProgressMap,
} from "@/services/badgeService"
import { computeUserStats, RARITY_CONFIG, type BadgeRarity } from "@/lib/gamification"
import { VectorBadgeArtwork } from "@/components/profile/VectorBadgeArtwork"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Community Badges & Medallions — AksharSetu",
  description:
    "Explore AksharSetu's collectible vector badges across 6 rarity tiers for reading, reviews, swaps, and Vidya Daan donations.",
}

export default async function BadgesPage() {
  const session = await auth()
  const userId = session?.user?.id || null

  if (userId) {
    await checkAndAwardBadges(userId).catch(() => {})
  }

  const [allBadges, user] = await Promise.all([
    ensureDefaultBadges(),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          include: {
            badges: true,
            books: true,
            donations: true,
            readingSessions: true,
            libraryBooks: true,
            bookNotes: true,
            reviewsGiven: true,
            clubPosts: true,
            clubMemberships: true,
            orders: { where: { status: "PAID" } },
            xpTransactions: { where: { reversedAt: null } },
          },
        })
      : Promise.resolve(null),
  ])

  let progressMap: Record<string, number> = {}
  const userBadgeMap = new Map<string, { earnedAt: Date }>()

  if (user) {
    const readingMinutes = user.readingSessions.reduce(
      (acc, s) => acc + s.durationMinutes,
      0
    )
    const booksDonated = Math.max(
      user.donations.length,
      user.books.filter((b) => b.price === 0 || b.status === "DONATED").length
    )
    const computed = computeUserStats({
      booksListed: user.books.length,
      booksDonated,
      badgesEarned: user.badges.length,
      readingMinutes,
      libraryCount: user.libraryBooks.length,
      booksCompleted: user.libraryBooks.filter((b) => b.status === "READ")
        .length,
      reviewsCount: user.reviewsGiven.length,
      booksSold: user.booksSold,
      purchasesCount: user.orders.length,
      clubPostsCount: user.clubPosts.length,
      bonusXP: user.xpTransactions.reduce((acc, t) => acc + t.xpAmount, 0),
    })

    progressMap = getBadgeProgressMap({
      readingSessions: user.readingSessions,
      libraryBooks: user.libraryBooks,
      books: user.books,
      donations: user.donations,
      reviewsGiven: user.reviewsGiven,
      bookNotes: user.bookNotes,
      clubPosts: user.clubPosts,
      clubMemberships: user.clubMemberships,
      booksSold: user.booksSold,
      successfulExchanges: user.successfulExchanges,
      sellerRating: user.sellerRating,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      level: computed.level,
    })

    for (const ub of user.badges) {
      userBadgeMap.set(ub.badgeId, { earnedAt: ub.earnedAt })
    }
  }

  const earnedCount = userBadgeMap.size

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-20">
      <section className="bg-black text-[#f5f5f7] py-12 md:py-16 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#FF8A4C] text-xs font-bold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" /> Achievement Ecosystem
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#f5f5f7] tracking-tighter leading-none">
              Community Badges{" "}
              {user ? `(${earnedCount}/${allBadges.length})` : `(${allBadges.length})`}
            </h1>
            <p className="text-sm sm:text-base text-[#86868b] max-w-2xl mt-3 font-medium">
              Earn collectible vector medallions across 6 rarity tiers by
              completing books, logging Shanti focus sessions, publishing
              reviews, and sharing books through Vidya Daan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/achievements"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Interactive Vault
            </Link>
            {user ? (
              <Link
                href={`/profile/${user.id}?tab=achievements`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold transition-colors"
              >
                Manage Showcase <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login?callbackUrl=/badges"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold transition-colors"
              >
                Sign In to Track Progress <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allBadges.map((badge) => {
            const ub = userBadgeMap.get(badge.id)
            const isUnlocked = Boolean(ub)
            const rConf =
              RARITY_CONFIG[(badge.rarity || "COMMON") as BadgeRarity] ||
              RARITY_CONFIG.COMMON
            const currentProgress =
              progressMap[badge.metricKey] ??
              (isUnlocked ? badge.requirementThreshold : 0)
            const pct = isUnlocked
              ? 100
              : Math.min(
                  100,
                  Math.round(
                    (currentProgress /
                      Math.max(1, badge.requirementThreshold)) *
                      100
                  )
                )

            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-6 border transition-all flex flex-col justify-between gap-5 shadow-sm ${
                  isUnlocked
                    ? `${rConf.bg} ${rConf.border}`
                    : "bg-white border-black/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <VectorBadgeArtwork
                    code={badge.code}
                    name={badge.name}
                    category={badge.category}
                    rarity={badge.rarity}
                    unlocked={user ? isUnlocked : true}
                    size={64}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${rConf.badgeBg} ${rConf.text}`}
                      >
                        {rConf.label} · {badge.category}
                      </span>
                      <span className="text-xs font-bold text-[#0066cc]">
                        +{badge.xpReward} XP
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-[#86868b] font-medium mt-1">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-black/5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    {isUnlocked ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked{" "}
                        {ub?.earnedAt.toLocaleDateString()}
                      </span>
                    ) : user ? (
                      <span className="text-[#86868b] flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Progress:{" "}
                        {Math.min(currentProgress, badge.requirementThreshold)}{" "}
                        / {badge.requirementThreshold}
                      </span>
                    ) : (
                      <span className="text-[#86868b]">
                        Target: {badge.requirementThreshold}
                      </span>
                    )}
                    <span className="text-[11px] text-amber-700">
                      +{badge.pointsReward} AP
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isUnlocked ? "bg-emerald-600" : "bg-[#0066cc]"
                      }`}
                      style={{ width: `${user ? pct : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
