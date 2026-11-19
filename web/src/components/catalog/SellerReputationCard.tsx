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
    <div className="bg-[#FAF6F0] rounded-2xl border border-[#1D1D1F]/[0.08] p-5 w-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F]/60 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C84200]" />
          Seller Reputation
        </h3>
        {profileHandle && (
          <Link
            href={`/profile/${profileHandle}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0066cc] hover:text-[#0071e3] transition-colors truncate max-w-[160px]"
          >
            {user.username ? `@${user.username}` : "View Profile"}
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        )}
      </div>

      {/* Top Stats (responsive 3-col grid so 375px never overflows) */}
      <div className="grid grid-cols-3 divide-x divide-[#1D1D1F]/10 mb-5">
        <div className="pr-2 sm:pr-4">
          <div className="flex items-center gap-1 text-xl sm:text-2xl font-black text-[#1D1D1F]">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#F4B22B] fill-[#F4B22B] shrink-0" />
            {rating.toFixed(1)}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1D1D1F]/45 mt-1">
            Rating
          </p>
        </div>

        <div className="px-2 sm:px-4">
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F]">
            {sold}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1D1D1F]/45 mt-1">
            Books Sold
          </p>
        </div>

        <div className="pl-2 sm:pl-4">
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F]">
            {exchanges}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#1D1D1F]/45 mt-1">
            Exchanges
          </p>
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-3 pt-4 border-t border-[#1D1D1F]/[0.08]">
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="text-[#1D1D1F]/65 font-medium">Response Time</span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {responseTime === "Fast" ? (
              <>
                <Zap className="w-4 h-4 text-[#F4B22B]" /> Fast
              </>
            ) : (
              responseTime
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="text-[#1D1D1F]/65 font-medium">
            Condition Accuracy
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {user.conditionAccuracy !== false ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#287F56]" /> Accurate
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-[#C84200]" /> Variable
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="text-[#1D1D1F]/65 font-medium">
            Meetup Reliability
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {user.meetupReliability !== false ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#287F56]" /> Reliable
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
