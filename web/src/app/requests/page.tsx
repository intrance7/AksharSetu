import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Search, Plus, BookOpen, Clock, User, HeartHandshake } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { RequestFormDialog } from "@/components/requests/RequestFormDialog"

export const dynamic = "force-dynamic"

export default async function CommunityRequestsPage() {
  const session = await auth()
  
  const requests = await prisma.communityRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      requester: {
        select: { id: true, name: true, image: true, location: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-16">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
              <HeartHandshake className="w-3 h-3" /> Community Bulletin
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#1D1D1F] tracking-tight leading-none mb-4">
              Request a Book
            </h1>
            <p className="text-xl text-[#86868b] max-w-2xl font-medium">
              Can't find what you're looking for in the catalog? Put up a request and let the community help you out.
            </p>
          </div>
          
          <div className="shrink-0">
            {session ? (
              <RequestFormDialog />
            ) : (
              <Link 
                href="/login?callbackUrl=/requests"
                className="bg-[#C84200] hover:bg-[#A33500] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" /> Post a Request
              </Link>
            )}
          </div>
        </div>

        {/* List of Requests */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-[#1d1d1f]/5 shadow-sm">
            <BookOpen className="w-16 h-16 text-[#86868b]/30 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-[#1d1d1f] mb-2">No active requests</h3>
            <p className="text-[#86868b] font-medium max-w-md mx-auto">
              The community bulletin is quiet right now. Be the first to post a request if you need a specific book!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => (
              <div 
                key={req.id} 
                className="bg-white rounded-3xl p-6 shadow-sm border border-[#1d1d1f]/5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {req.status === "FULFILLED" && (
                   <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                     Fulfilled
                   </div>
                )}
                
                <h3 className="text-xl font-black text-[#1d1d1f] leading-tight mb-1 pr-16">{req.title}</h3>
                {req.author && <p className="text-sm font-bold text-[#C84200] mb-4">{req.author}</p>}
                
                <p className="text-[#86868b] text-sm font-medium line-clamp-3 mb-6">
                  {req.description || "No additional details provided."}
                </p>

                <div className="mt-auto pt-6 border-t border-[#1d1d1f]/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {req.requester.image ? (
                      <Image src={req.requester.image} alt="User" width={32} height={32} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1d1d1f]/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#1d1d1f]/40" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-[#1d1d1f]">{req.requester.name || "Anonymous"}</p>
                      <p className="text-[10px] text-[#86868b] font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {session?.user?.id !== req.requester.id && req.status !== "FULFILLED" && (
                    <Link 
                      href={`/messages/${req.requester.id}?action=fulfill_request&reqId=${req.id}`}
                      className="px-4 py-2 bg-[#F2EBE1] hover:bg-[#e8e0d5] text-[#1d1d1f] rounded-full text-xs font-bold transition-colors"
                    >
                      I have this
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
