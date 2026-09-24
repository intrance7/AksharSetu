import Link from "next/link"
import { ArrowLeft, Construction, Pickaxe } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const feature = typeof resolvedParams.feature === "string" ? resolvedParams.feature : "This Feature"

  return (
    <div className="min-h-[80vh] bg-[#F2EBE1] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 md:left-32 opacity-20 transform -rotate-12">
        <Pickaxe className="w-24 h-24 text-[#C84200]" />
      </div>
      <div className="absolute bottom-20 right-10 md:right-32 opacity-20 transform rotate-12">
        <Construction className="w-24 h-24 text-[#C84200]" />
      </div>

      <div className="relative z-10 text-center max-w-2xl bg-white/50 backdrop-blur-md p-10 md:p-16 rounded-[3rem] border border-white shadow-xl">
        <div className="w-20 h-20 bg-[#C84200]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Pickaxe className="w-10 h-10 text-[#C84200]" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight mb-4 uppercase">
          {feature.replace(/-/g, ' ')}
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-black text-[#C84200] tracking-tight mb-6">
          Is Currently Under Construction
        </h2>
        
        <p className="text-lg text-[#86868B] font-medium mb-10 max-w-xl mx-auto leading-relaxed">
          We're working hard in the background to bring you this feature. It will be available in an upcoming update!
        </p>

        <Link 
          href="/" 
          className="inline-flex items-center justify-center gap-2 bg-[#C84200] text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-[#A33500] hover:scale-105 transition-all shadow-lg shadow-[#C84200]/20"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
      </div>
    </div>
  )
}
