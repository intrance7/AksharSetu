import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ConversationList } from "@/components/messages/ConversationList"
import { MessageSquare, Trophy, User } from "lucide-react"
import Link from "next/link"

export default async function MessagesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-28 pb-16">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight">
                Messages & Reader Connect
              </h1>
              <p className="text-[#86868b] font-medium text-sm">
                Find reader profiles, discuss book handoffs, and chat with the community.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/profile/${session.user.id}`}
              className="px-4 py-2.5 rounded-full bg-white hover:bg-[#e8e8ed] border border-black/5 text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-[#0066cc]" /> My Profile
            </Link>
            <Link
              href="/leaderboard"
              className="px-4 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 text-[#E8B27A]" /> Leaderboard
            </Link>
          </div>
        </div>

        <ConversationList />
      </div>
    </div>
  )
}
