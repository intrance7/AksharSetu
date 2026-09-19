import { Search } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F5DC]">
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

      {/* Content Skeleton */}
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

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 pb-24">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col gap-4 animate-pulse">
              <div className="w-full aspect-video bg-[#E8E4DF] rounded-2xl"></div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-16 bg-[#1D1D1F]/10 rounded-sm"></div>
                <div className="h-5 w-3/4 bg-[#1D1D1F]/20 rounded-md"></div>
                <div className="h-4 w-1/2 bg-[#1D1D1F]/10 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
