import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/messages/ConversationList"
import { MessageSquare, Trophy, User, Loader2 } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F2EBE1] pt-6 pb-12">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1D1D1F] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-[#C84200]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight leading-tight">
                Messages & Reader Connect
              </h1>
              <p className="text-[#86868b] font-medium text-xs sm:text-sm">
                Real-time book handoffs, offers, and reader conversations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/profile/${session.user.id}`}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#e8e8ed] border border-black/5 text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-[#0066cc]" /> My Profile
            </Link>
            <Link
              href="/leaderboard"
              className="px-4 py-2 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-[#E8B27A]" /> Leaderboard
            </Link>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]/30" />
            </div>
          }
        >
          <ConversationList />
        </Suspense>
      </div>
    </div>
  )
}
