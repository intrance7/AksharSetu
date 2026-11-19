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
    <div className="min-h-[calc(100vh-4rem)] bg-[#F2EBE1] pb-12">
      {/* Compact Obsidian Editorial Header */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] border-b border-white/10 py-6 sm:py-7 px-3 sm:px-6 mb-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#C84200]/25 blur-[95px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#FF7F45]/12 blur-[85px]" />

        <div className="container mx-auto max-w-7xl relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-[#FF7F45]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F7] tracking-tight leading-tight">
                Messages &amp;{" "}
                <span className="font-serif italic font-medium text-[#FF7F45]">
                  Reader Connect
                </span>
              </h1>
              <p className="text-[#C9C4BC] text-sm mt-0.5">
                Real-time book offers, campus handoffs, and literary exchanges.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/profile/${session.user.id}`}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs sm:text-[13px] font-semibold text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#FF7F45]" /> My Profile
            </Link>
            <Link
              href="/leaderboard"
              className="px-4 py-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-xs sm:text-[13px] font-semibold text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-200" /> Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-3 sm:px-6">
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
