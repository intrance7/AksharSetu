import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ListBookForm } from "@/components/catalog/ListBookForm"

export const dynamic = "force-dynamic"

export default async function ListBookPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/catalog/new")
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-12 relative overflow-hidden">
      
      {/* Background Decorations - Left */}
      <div className="hidden xl:block absolute -left-12 top-32 w-[380px] pointer-events-none z-0">
        <div className="relative transform -rotate-12 mb-12 left-24">
           <p className="font-['Caveat'] text-3xl text-[#86868b] leading-tight flex flex-col gap-1">
             <span>Books</span>
             <span>build</span>
             <span>brighter</span>
             <span className="flex items-center gap-2">tomorrows <span className="w-8 h-8 inline-flex hover:-translate-y-1 hover:scale-125 hover:drop-shadow-lg transition-transform duration-300 cursor-default"><img src="/doodle-heart.png" alt="heart" className="w-full h-full object-contain" /></span></span>
           </p>
        </div>
        
        <div className="relative">
           <img src="/books-left-ai.png" alt="Decorative books and plant" className="w-full h-auto drop-shadow-2xl mix-blend-multiply transition-transform duration-500 hover:scale-105 hover:-rotate-2 pointer-events-auto" />
        </div>
      </div>

      {/* Background Decorations - Right */}
      <div className="hidden xl:block absolute -right-12 top-24 w-[380px] pointer-events-none z-0">
        <div className="relative transform rotate-6 mb-24 right-16 text-right">
           <p className="font-['Caveat'] text-3xl text-[#86868b] leading-tight">
             Good books <br/> find better people.
           </p>
        </div>

        <div className="relative">
           <img src="/books-right-ai.png" alt="Decorative books and coffee" className="w-full h-auto drop-shadow-2xl mix-blend-multiply transition-transform duration-500 hover:scale-105 hover:rotate-2 pointer-events-auto" />
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 md:px-8 relative z-10 w-full">
        {/* Header Section */}
        <div className="mb-10 w-full flex flex-col justify-start">
          <Link href="/catalog" className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#C84200] transition-colors mb-6 font-semibold w-fit">
            <ArrowLeft className="w-5 h-5" /> Back to Catalog
          </Link>
          <h1 className="text-5xl md:text-6xl font-black text-[#1D1D1F] tracking-tight leading-none mb-3">
            List a <span className="text-[#C84200] relative inline-block">Book<img src="/doodle-lightning.png" alt="" className="absolute -top-4 -right-10 w-12 h-12 opacity-60 mix-blend-multiply rotate-12" /></span>
          </h1>
          <p className="text-lg md:text-xl text-[#86868B] font-medium max-w-xl leading-snug">
            Give your books a second home. Donate them to someone in need, or sell them to a fellow reader in your city.
          </p>
        </div>
        
        {/* Form Container */}
        <ListBookForm />
      </div>
    </div>
  )
}
