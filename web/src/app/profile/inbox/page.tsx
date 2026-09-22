import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react"

export default async function InboxPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch incoming requests (people asking for the user's books)
  const incomingRequests = await prisma.bookRequest.findMany({
    where: {
      book: {
        ownerId: session.user.id
      }
    },
    include: {
      book: true,
      requester: {
        select: { name: true, image: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch outgoing requests (books the user has asked for)
  const outgoingRequests = await prisma.bookRequest.findMany({
    where: {
      requesterId: session.user.id
    },
    include: {
      book: {
        include: {
          owner: { select: { name: true, image: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "PENDING": return <Clock className="w-4 h-4 text-amber-500" />
      case "APPROVED": return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "REJECTED": return <XCircle className="w-4 h-4 text-red-500" />
      case "COMPLETED": return <CheckCircle className="w-4 h-4 text-blue-500" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        
        <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight mb-12">
          Inbox & Requests
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Incoming Requests */}
          <div>
            <h2 className="text-xl font-black text-[#1D1D1F] mb-6 flex items-center gap-2">
              <span className="bg-[#1D1D1F] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {incomingRequests.length}
              </span>
              Requests for your books
            </h2>
            
            <div className="space-y-4">
              {incomingRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-[#1D1D1F]/5 shadow-sm">
                  <p className="text-[#1D1D1F]/40 font-medium">No incoming requests yet.</p>
                </div>
              ) : (
                incomingRequests.map(req => (
                  <Link href={`/profile/inbox/${req.id}`} key={req.id}>
                    <div className="bg-white rounded-2xl p-5 border border-[#1D1D1F]/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                      {req.requester.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={req.requester.image} alt={req.requester.name || ""} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#1D1D1F]/5 shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1D1D1F] truncate">{req.requester.name} requested</p>
                        <p className="text-[#1D1D1F]/60 text-sm truncate font-medium">{req.book.title}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/50">
                          <StatusIcon status={req.status} /> {req.status}
                        </span>
                        <MessageSquare className="w-4 h-4 text-[#C84200]" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Outgoing Requests */}
          <div>
            <h2 className="text-xl font-black text-[#1D1D1F] mb-6 flex items-center gap-2">
              <span className="bg-white border border-[#1D1D1F]/10 text-[#1D1D1F] w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {outgoingRequests.length}
              </span>
              Your requests
            </h2>

            <div className="space-y-4">
              {outgoingRequests.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-[#1D1D1F]/5 shadow-sm">
                  <p className="text-[#1D1D1F]/40 font-medium">You haven't requested any books.</p>
                </div>
              ) : (
                outgoingRequests.map(req => (
                  <Link href={`/profile/inbox/${req.id}`} key={req.id}>
                    <div className="bg-white rounded-2xl p-5 border border-[#1D1D1F]/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 opacity-80 hover:opacity-100">
                      <div className="w-12 h-16 bg-[#E8E4DF] rounded overflow-hidden shrink-0">
                        {req.book.images?.[0] && (
                           // eslint-disable-next-line @next/next/no-img-element
                          <img src={req.book.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1D1D1F] truncate">{req.book.title}</p>
                        <p className="text-[#1D1D1F]/60 text-sm truncate font-medium">From {req.book.owner.name}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/50">
                          <StatusIcon status={req.status} /> {req.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
