export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#F2EBE1]">
      {/* Slim animated top progress indicator */}
      <div className="fixed top-16 inset-x-0 z-40 h-1 bg-[#C84200]/15 overflow-hidden">
        <div className="h-full w-1/3 bg-[#C84200] animate-pulse rounded-full" />
      </div>

      {/* High-contrast obsidian header skeleton */}
      <div className="bg-black py-14 px-4 md:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
          <div className="h-6 w-40 bg-white/10 rounded-full" />
          <div className="h-12 w-2/3 max-w-xl bg-white/10 rounded-2xl" />
          <div className="h-5 w-1/2 max-w-md bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Warm ivory bento content skeleton */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-white/80 border border-black/5 shadow-sm p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-24 bg-black/5 rounded-full" />
                <div className="h-6 w-3/4 bg-black/10 rounded-lg" />
                <div className="h-4 w-full bg-black/5 rounded-md" />
              </div>
              <div className="h-10 w-1/2 bg-[#FAF6F0] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
