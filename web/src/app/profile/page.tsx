import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { BadgeCard } from "@/components/profile/BadgeCard"
import Link from "next/link"
import { Settings, Eye, Trophy, MessageSquare } from "lucide-react"

export default async function ProfileDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      badges: {
        include: { badge: true },
      },
    },
  })

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Edit Form */}
          <div className="w-full md:w-1/2 lg:w-2/3 flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight">
                  Edit Profile & Quote
                </h1>
                <p className="text-sm font-medium text-[#86868b] mt-1">
                  Manage your identity, location, and signature literary quote.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 text-xs font-bold bg-[#0066cc] hover:bg-[#0071e3] text-white px-4 py-2.5 rounded-full transition-colors"
                >
                  <Eye className="w-4 h-4" /> View My Profile
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-[#1D1D1F]/5 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#1D1D1F]/40" />
                </div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  Profile & Literary Quote Settings
                </h2>
              </div>
              <ProfileForm user={user} />
            </div>
          </div>

          {/* Right Column: Badges (Trophy Cabinet) + Quick Links */}
          <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col gap-6">
            <div className="bg-[#1D1D1F] rounded-3xl p-8 text-white shadow-lg">
              <h2 className="text-xl font-black tracking-tight mb-2">
                Trophy Cabinet
              </h2>
              <p className="text-white/60 text-sm font-medium mb-8">
                Badges you&apos;ve earned on AksharSetu.
              </p>

              {user.badges.length === 0 ? (
                <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
                  <p className="text-white/40 text-sm font-medium mb-4">
                    You haven&apos;t earned any badges yet. Start donating and reading!
                  </p>
                  <Link
                    href="/badges"
                    className="text-white/80 hover:text-white font-bold text-sm underline decoration-white/30 underline-offset-4"
                  >
                    View All Badges
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {user.badges.map(({ badge }) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}

                  <div className="mt-4 text-center">
                    <Link
                      href="/badges"
                      className="text-white/60 hover:text-white font-bold text-sm"
                    >
                      View all available badges &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/5 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#86868b]">
                Community Shortcuts
              </h3>
              <Link
                href="/messages"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-[#e8e8ed] transition-colors font-bold text-sm text-[#1D1D1F]"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-[#0066cc]" /> Find Profiles & Chat
                </span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-[#e8e8ed] transition-colors font-bold text-sm text-[#1D1D1F]"
              >
                <span className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-[#C84200]" /> Community Leaderboard
                </span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
