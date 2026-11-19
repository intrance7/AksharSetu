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
      creator: { select: { id: true, name: true, username: true, image: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
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
          author: { select: { id: true, name: true, username: true, image: true } },
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
      <section className="relative bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,178,43,0.08),transparent_50%)] text-[#F5F5F7] py-14 md:py-16 px-4 border-b border-white/10 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container mx-auto max-w-6xl relative z-10">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Sabha Teams
          </Link>

          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-[13px] font-bold text-[#FF8A4C]">
              <Sparkles className="w-3.5 h-3.5" /> Sabha Reading Team
            </span>
            {club.isPrivate ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs sm:text-[13px] font-bold">
                <Lock className="w-3.5 h-3.5" /> Private Invite-Only Team
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs sm:text-[13px] font-bold">
                <Globe className="w-3.5 h-3.5" /> Public Team
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-xs sm:text-[13px] font-semibold text-white/85">
              <Users className="w-3.5 h-3.5" /> {club.members.length} /{" "}
              {club.maxMembers || 25} Members
            </span>
            {club.scheduleText && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-xs sm:text-[13px] font-semibold text-white/85">
                <Calendar className="w-3.5 h-3.5 text-[#FF8A4C]" />{" "}
                {club.scheduleText}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-tight mb-3 text-white">
            {club.name}
          </h1>
          <p className="text-white/75 text-base md:text-lg max-w-3xl leading-relaxed">
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
