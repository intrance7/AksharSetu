import Link from "next/link"
import { Star, ShieldCheck, Zap, Activity, ArrowUpRight } from "lucide-react"

interface SellerReputationProps {
  user: {
    id?: string
    name?: string | null
    username?: string | null
    sellerRating?: number | null
    booksSold?: number | null
    successfulExchanges?: number | null
    responseTime?: string | null
    conditionAccuracy?: boolean | null
    meetupReliability?: boolean | null
  }
}

export function SellerReputationCard({ user }: SellerReputationProps) {
  const rating = typeof user.sellerRating === "number" ? user.sellerRating : 5
  const sold = user.booksSold ?? 0
  const exchanges = user.successfulExchanges ?? 0
  const responseTime = user.responseTime || "Fast"
  const profileHandle = user.username || user.id

  return (
    <div className="bg-[#FAF6F0] rounded-3xl border border-[#1D1D1F]/[0.07] p-5 sm:p-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#1D1D1F]/70 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0A7D4F]" />
          Seller Trust &amp; Reputation
        </h3>
        {profileHandle && (
          <Link
            href={`/profile/${profileHandle}`}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-[#0066cc] hover:text-[#0071e3] transition-colors truncate max-w-[180px]"
          >
            {user.username ? `@${user.username}` : "View Profile"}
            <ArrowUpRight className="w-4 h-4 shrink-0" />
          </Link>
        )}
      </div>

      {/* Top Stats (responsive 3-col grid so 375px never overflows) */}
      <div className="grid grid-cols-3 divide-x divide-[#1D1D1F]/[0.08] mb-5 bg-white rounded-2xl p-4 border border-[#1D1D1F]/[0.06]">
        <div className="pr-2 sm:pr-4">
          <div className="flex items-center gap-1.5 font-mono text-xl sm:text-2xl font-black text-[#1D1D1F]">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500 shrink-0" />
            {rating.toFixed(1)}
          </div>
          <p className="text-xs font-semibold text-[#6e6e73] mt-1">Rating</p>
        </div>

        <div className="px-2 sm:px-4">
          <div className="font-mono text-xl sm:text-2xl font-black text-[#1D1D1F]">
            {sold}
          </div>
          <p className="text-xs font-semibold text-[#6e6e73] mt-1">Sold</p>
        </div>

        <div className="pl-2 sm:pl-4">
          <div className="font-mono text-xl sm:text-2xl font-black text-[#1D1D1F]">
            {exchanges}
          </div>
          <p className="text-xs font-semibold text-[#6e6e73] mt-1">Swaps</p>
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-[#6e6e73] font-medium">Response Time</span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {responseTime === "Fast" ? (
              <>
                <Zap className="w-4 h-4 text-amber-500" /> Fast
              </>
            ) : (
              responseTime
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-[#6e6e73] font-medium">Condition Accuracy</span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {user.conditionAccuracy !== false ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#0A7D4F]" /> Accurate
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-[#C84200]" /> Variable
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-[#6e6e73] font-medium">Meetup Reliability</span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {user.meetupReliability !== false ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#0A7D4F]" /> Reliable
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-[#C84200]" /> Variable
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
