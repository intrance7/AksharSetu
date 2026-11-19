import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Shield, Lock, CheckCircle2, ArrowRight, Trophy } from "lucide-react"
import {
  checkAndAwardBadges,
  ensureDefaultBadges,
  getBadgeProgressMap,
} from "@/services/badgeService"
import {
  computeUserStats,
  RARITY_CONFIG,
  type BadgeRarity,
} from "@/lib/gamification"
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
  const completionPct =
    allBadges.length > 0 ? Math.round((earnedCount / allBadges.length) * 100) : 0
  const totalXpPool = allBadges.reduce((acc, b) => acc + (b.xpReward || 0), 0)

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-14 md:py-20 px-4 sm:px-6 border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#C84200]/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#FF7F45]/12 blur-[100px]" />

        <div className="container mx-auto max-w-6xl relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/12 text-[#FF7F45] font-mono text-xs font-bold uppercase tracking-widest mb-4">
              <Shield className="w-3.5 h-3.5" /> Achievement Ecosystem
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#F5F5F7] tracking-tight leading-[1.04]">
              Community{" "}
              <span className="font-serif italic font-medium text-[#FF7F45]">
                Badges
              </span>
              .
            </h1>
            <p className="text-base sm:text-lg text-[#D2CDC5] max-w-2xl mt-4 leading-relaxed">
              Earn original collectible vector medallions across 6 rarity tiers
              by finishing books, logging Shanti focus sessions, publishing
              reviews, and donating through Vidya Daan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/achievements"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-bold transition-colors"
            >
              <Trophy className="w-4 h-4 text-[#FF7F45]" /> Interactive Vault
            </Link>
            {user ? (
              <Link
                href={`/profile/${user.username || user.id}?tab=achievements`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition-colors shadow-sm"
              >
                Manage Showcase <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login?callbackUrl=/badges"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition-colors shadow-sm"
              >
                Sign In to Track Progress <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 -mt-6 relative z-10 space-y-8">
        {/* Warm Stat Chips Strip */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#1D1D1F]/[0.07] shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5E5E63]">
              Total Medallions
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-[#1D1D1F] mt-1">
              {allBadges.length}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5E5E63]">
              {user ? "Unlocked by You" : "Rarity Tiers"}
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-[#C84200] mt-1">
              {user ? `${earnedCount}/${allBadges.length}` : "6 Tiers"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5E5E63]">
              {user ? "Vault Completion" : "Total XP Pool"}
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-[#0A7D4F] mt-1">
              {user ? `${completionPct}%` : `${totalXpPool.toLocaleString()} XP`}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] px-4 py-3.5 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5E5E63]">
              Rules &amp; Rarity
            </p>
            <Link
              href="/help/badges-and-achievements"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#C84200] hover:underline mt-2"
            >
              Read Guide <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Badge Vault Cards */}
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
                className={`rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  isUnlocked
                    ? `${rConf.bg} ${rConf.border}`
                    : "bg-white border-[#1D1D1F]/[0.07]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] shrink-0 shadow-xs">
                    <VectorBadgeArtwork
                      code={badge.code}
                      name={badge.name}
                      category={badge.category}
                      rarity={badge.rarity}
                      unlocked={user ? isUnlocked : true}
                      size={66}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold uppercase ${rConf.badgeBg} ${rConf.text}`}
                      >
                        {rConf.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#C84200]">
                        +{badge.xpReward} XP
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight leading-snug">
                      {badge.name}
                    </h3>
                    <p className="text-sm text-[#5E5E63] mt-1.5 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-[#1D1D1F]/[0.07]">
                  <div className="flex items-center justify-between text-xs sm:text-[13px] font-semibold">
                    {isUnlocked ? (
                      <span className="text-[#0A7D4F] flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Unlocked{" "}
                        {ub?.earnedAt.toLocaleDateString()}
                      </span>
                    ) : user ? (
                      <span className="text-[#5E5E63] flex items-center gap-1.5 font-mono">
                        <Lock className="w-3.5 h-3.5" />{" "}
                        {Math.min(currentProgress, badge.requirementThreshold)}{" "}
                        / {badge.requirementThreshold}
                      </span>
                    ) : (
                      <span className="text-[#5E5E63] font-mono">
                        Target: {badge.requirementThreshold}
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold text-[#5E5E63] bg-[#FAF6F0] px-2.5 py-0.5 rounded-full border border-[#1D1D1F]/[0.06]">
                      +{badge.pointsReward} AP
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.05] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isUnlocked ? "bg-[#0A7D4F]" : "bg-[#C84200]"
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
