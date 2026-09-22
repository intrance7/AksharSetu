import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#F2EBE1] px-4 text-center">
      
      {/* Lottie Animation Embed */}
      <div className="w-full max-w-[400px] h-[300px] md:h-[400px] relative mb-6">
        <iframe 
          src="https://lottie.host/embed/6ce43729-a989-42f8-bbcb-03e0e30e5ecf/mRa1z4kvsQ.lottie" 
          className="absolute inset-0 w-full h-full border-none"
          title="404 Animation"
          allowFullScreen
        ></iframe>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-[#1d1d1f] mb-4">
        Page not found.
      </h1>
      
      <p className="text-[#86868b] text-lg max-w-[500px] font-medium tracking-tight mb-8">
        The page you're looking for seems to have drifted out of our library. Let's get you back to discovering great books.
      </p>

      <Link 
        href="/" 
        className="flex items-center gap-2 px-6 py-3 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return Home
      </Link>

    </div>
  )
}
