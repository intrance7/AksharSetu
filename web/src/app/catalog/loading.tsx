import { Search, Loader2 } from "lucide-react"
import { MascotLoadingAnimation } from "@/components/catalog/MascotLoadingAnimation"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F2EBE1]">
      {/* Hero Section Skeleton */}
      <div className="bg-[#1D1D1F] pt-28 pb-16 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center gap-6 animate-pulse">
            <div className="h-4 w-32 bg-white/10 rounded-md"></div>
            <div className="h-16 w-3/4 max-w-2xl bg-white/10 rounded-2xl mt-4"></div>
            <div className="h-6 w-1/2 max-w-lg bg-white/10 rounded-md mt-4"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton & Animation */}
      <div className="container mx-auto max-w-6xl px-4 md:px-8 -mt-8">
        {/* Stub for filters to maintain layout during load */}
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="relative w-full">
            <div className="bg-white rounded-2xl shadow-lg border border-[#1D1D1F]/5 flex items-center p-2 h-[72px]">
              <div className="pl-4">
                <Search className="h-5 w-5 text-[#1D1D1F]/10" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-[#1D1D1F]/10 rounded-full"></div>
            ))}
          </div>
        </div>

        {/* Loading Animation Section */}
        <div className="w-full flex flex-col items-center justify-center py-16">
           <div className="flex items-center justify-center gap-3 mb-6 text-[#1D1D1F]/60">
             <Loader2 className="h-6 w-6 animate-spin" />
             <span className="font-bold tracking-tight text-lg">Fetching library...</span>
           </div>
           <div className="w-full max-w-md border border-[#1D1D1F]/10 rounded-3xl bg-[#E8E4DF]/50 overflow-hidden shadow-sm backdrop-blur-sm">
             <MascotLoadingAnimation radius={100} speed={4.5} />
           </div>
        </div>
      </div>
    </div>
  )
}


