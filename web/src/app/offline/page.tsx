import Link from "next/link"
import { WifiOff, BookOpen } from "lucide-react"

export const metadata = {
  title: "Offline — AksharSetu",
}

export default function OfflinePage() {
  return (
    <div className="min-h-[75vh] bg-[#F2EBE1] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center mb-6">
        <WifiOff className="w-8 h-8 text-[#C84200]" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tight mb-2">
        You are currently offline
      </h1>
      <p className="text-sm sm:text-base text-[#1D1D1F]/65 max-w-md mb-6 font-medium">
        Reconnect to the internet to browse live book listings, send real-time
        messages, or sync your reading streak.
      </p>
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C84200] text-white text-xs sm:text-sm font-bold hover:bg-[#A33500] transition-colors"
      >
        <BookOpen className="w-4 h-4" /> Retry Catalog
      </Link>
    </div>
  )
}
