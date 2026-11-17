import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { ClubRoomClient } from "@/components/clubs/ClubRoomClient"
import { ArrowLeft, Calendar, Sparkles, Lock, Globe, Users } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SingleClubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const currentUserId = session?.user?.id || null

  const club = await prisma.bookClub.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              isShantiModeActive: true,
              liveStatus: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      posts: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!club) notFound()

  const isMember = Boolean(
    currentUserId &&
      (club.creatorId === currentUserId ||
        club.members.some((m) => m.userId === currentUserId))
  )
  const isLeader = Boolean(currentUserId && club.creatorId === currentUserId)

  // Mask posts and inviteCode if the team is private and the viewer is not a member
  const safeClub =
    club.isPrivate && !isMember
      ? {
          ...club,
          inviteCode: null,
          posts: [],
        }
      : club

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      <section className="bg-black text-[#F5F5F7] py-14 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-6xl">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#86868b] hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Sabha Teams
          </Link>

          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#C84200]">
              <Sparkles className="w-3.5 h-3.5" /> Sabha Reading Team
            </span>
            {club.isPrivate ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" /> Private Invite-Only Team
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                <Globe className="w-3.5 h-3.5" /> Public Team
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/80">
              <Users className="w-3.5 h-3.5" /> {club.members.length} /{" "}
              {club.maxMembers || 25} Members
            </span>
            {club.scheduleText && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#F5F5F7]/80">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />{" "}
                {club.scheduleText}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight mb-3">
            {club.name}
          </h1>
          <p className="text-[#86868b] text-sm md:text-base max-w-3xl leading-relaxed">
            {club.description}
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pt-8">
        <ClubRoomClient
          club={safeClub}
          initialJoined={isMember}
          isLeader={isLeader}
          isLoggedIn={Boolean(currentUserId)}
        />
      </div>
    </div>
  )
}
