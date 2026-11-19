import Link from "next/link"
import { ArrowLeft, BookOpen, Search, HelpCircle } from "lucide-react"
import { MascotCalloutCard } from "@/components/mascots/AksharSetuMascots"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[78vh] bg-[#F2EBE1] px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1D1D1F] text-[#F2EBE1] flex items-center justify-center mb-5 shadow-md">
        <BookOpen className="w-8 h-8 text-[#C84200]" />
      </div>

      <span className="font-silkscreen text-[11px] uppercase tracking-widest text-[#C84200] mb-2">
        Error 404 · Shelf Not Found
      </span>

      <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1D1D1F] mb-3">
        This page has left the library.
      </h1>

      <p className="text-[#1D1D1F]/65 text-base max-w-[46ch] font-medium mb-7">
        The book listing, profile, or guide you requested could not be found or
        may have been archived.
      </p>

      <MascotCalloutCard
        variant="not-found"
        className="w-full max-w-xl mb-8"
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full text-sm font-bold transition-colors shadow-xs"
        >
          <Search className="w-4 h-4" />
          Browse Book Catalog
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#FAF6F0] text-[#1D1D1F] border border-[#1D1D1F]/15 rounded-full text-sm font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return Home
        </Link>
        <Link
          href="/help"
          className="inline-flex items-center gap-2 px-5 py-3 bg-transparent hover:bg-black/5 text-[#1D1D1F]/80 rounded-full text-sm font-bold transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Help Center
        </Link>
      </div>
    </div>
  )
}
