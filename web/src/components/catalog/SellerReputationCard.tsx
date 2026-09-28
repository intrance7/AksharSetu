import { Star, ShieldCheck, Zap, Activity } from "lucide-react"

interface SellerReputationProps {
  user: {
    sellerRating: number
    booksSold: number
    successfulExchanges: number
    responseTime: string
    conditionAccuracy: boolean
    meetupReliability: boolean
  }
}

export function SellerReputationCard({ user }: SellerReputationProps) {
  return (
    <div className="bg-[#F9F9FB] rounded-2xl border border-[#1D1D1F]/5 p-5 w-full">
      <h3 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F]/60 mb-4 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#C84200]" />
        Seller Reputation
      </h3>
      
      {/* Top Stats */}
      <div className="flex items-center gap-6 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-2xl font-black text-[#1D1D1F]">
            <Star className="w-5 h-5 text-[#F4B22B] fill-[#F4B22B]" />
            {user.sellerRating.toFixed(1)}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1D1D1F]/40 mt-1">Rating</p>
        </div>
        
        <div className="h-8 w-px bg-[#1D1D1F]/10" />
        
        <div>
          <div className="text-2xl font-black text-[#1D1D1F]">{user.booksSold}</div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1D1D1F]/40 mt-1">Books Sold</p>
        </div>

        <div className="h-8 w-px bg-[#1D1D1F]/10" />
        
        <div>
          <div className="text-2xl font-black text-[#1D1D1F]">{user.successfulExchanges}</div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1D1D1F]/40 mt-1">Exchanges</p>
        </div>
      </div>
      
      {/* Metrics List */}
      <div className="space-y-3 pt-4 border-t border-[#1D1D1F]/5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#1D1D1F]/60 font-medium">Response Time</span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {user.responseTime === "Fast" ? (
              <><Zap className="w-4 h-4 text-[#F4B22B]" /> Fast</>
            ) : user.responseTime}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#1D1D1F]/60 font-medium">Condition Accuracy</span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {user.conditionAccuracy ? (
              <><ShieldCheck className="w-4 h-4 text-[#287F56]" /> Accurate</>
            ) : (
              <><Activity className="w-4 h-4 text-[#C84200]" /> Variable</>
            )}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#1D1D1F]/60 font-medium">Meetup Reliability</span>
          <span className="flex items-center gap-1.5 font-bold text-[#1D1D1F]">
            {user.meetupReliability ? (
              <><ShieldCheck className="w-4 h-4 text-[#287F56]" /> Reliable</>
            ) : (
              <><Activity className="w-4 h-4 text-[#C84200]" /> Variable</>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
