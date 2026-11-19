export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F2EBE1]">
      {/* Hero Section Skeleton */}
      <div className="bg-[#1D1D1F] pt-24 pb-32 px-4 md:px-8">
        <div className="container mx-auto max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-pulse">
          <div className="space-y-5">
            <div className="h-24 w-4/5 bg-white/10 rounded-2xl" />
            <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
            <div className="h-14 w-full bg-white/10 rounded-2xl" />
          </div>
          <div className="hidden md:block h-[360px] bg-white/5 rounded-3xl" />
        </div>
      </div>

      {/* Catalog Grid Skeleton */}
      <div className="container mx-auto max-w-[1400px] px-4 md:px-8 py-8">
        <div className="h-20 w-full bg-white/75 rounded-3xl mb-6 animate-pulse border border-[#1D1D1F]/[0.06]" />
        <div className="flex gap-7">
          <div className="hidden md:block w-[276px] shrink-0">
            <div className="h-[540px] bg-white/80 rounded-3xl animate-pulse border border-[#1D1D1F]/[0.06]" />
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[460px] bg-white/85 rounded-3xl p-5 border border-[#1D1D1F]/[0.06] animate-pulse flex flex-col justify-between"
              >
                <div className="h-60 bg-[#FAF6F0] rounded-2xl" />
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-black/10 rounded-md" />
                  <div className="h-4 w-1/2 bg-black/5 rounded-md" />
                  <div className="h-10 w-full bg-black/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
