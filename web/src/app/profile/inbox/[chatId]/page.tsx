import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ChatWindow } from "@/components/inbox/ChatWindow"
import { RequestManager } from "@/components/inbox/RequestManager"

export default async function ChatPage({
  params
}: {
  params: Promise<{ chatId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const resolvedParams = await params

  // Fetch the request
  const request = await prisma.bookRequest.findUnique({
    where: { id: resolvedParams.chatId },
    include: {
      book: {
        include: {
          owner: { select: { id: true, name: true, image: true } }
        }
      },
      requester: { select: { id: true, name: true, image: true } }
    }
  })

  if (!request) {
    notFound()
  }

  // Ensure user is authorized (either requester or book owner)
  const isOwner = session.user.id === request.book.ownerId
  const isRequester = session.user.id === request.requesterId

  if (!isOwner && !isRequester) {
    redirect("/profile/inbox")
  }

  // Determine chat partner
  const chatPartner = isOwner ? request.requester : request.book.owner

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-28 pb-16 flex flex-col h-screen">
      <div className="container mx-auto max-w-5xl px-4 flex-1 flex flex-col">
        
        <Link 
          href="/profile/inbox"
          className="inline-flex items-center gap-2 text-[#1D1D1F]/60 hover:text-[#1D1D1F] font-bold text-sm tracking-wider uppercase mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inbox
        </Link>

        <div className="bg-white rounded-[2rem] shadow-sm border border-[#1D1D1F]/5 overflow-hidden flex flex-col flex-1 max-h-[70vh]">
          
          {/* Header */}
          <div className="p-6 border-b border-[#1D1D1F]/5 flex flex-wrap gap-4 items-center justify-between bg-[#1D1D1F] text-white">
            <div className="flex items-center gap-4">
              {chatPartner.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={chatPartner.image} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/10" />
              )}
              <div>
                <h2 className="font-bold text-lg leading-tight">{chatPartner.name}</h2>
                <p className="text-white/60 text-sm font-medium">Re: {request.book.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                request.status === "PENDING" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                request.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                request.status === "COMPLETED" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                "bg-red-500/20 text-red-300 border-red-500/30"
              }`}>
                {request.status}
              </span>

              {isOwner && request.status === "PENDING" && (
                <RequestManager requestId={request.id} />
              )}
              {isOwner && request.status === "APPROVED" && (
                <RequestManager requestId={request.id} isCompleting={true} />
              )}
            </div>
          </div>

          {/* Chat Window Client Component */}
          <ChatWindow 
            requestId={request.id} 
            currentUserId={session.user.id} 
            receiverId={chatPartner.id}
          />
          
        </div>
      </div>
    </div>
  )
}
