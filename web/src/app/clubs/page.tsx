import { Suspense } from "react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { cached } from "@/lib/fastCache"
import { CreateClubModal } from "@/components/clubs/CreateClubModal"
import { JoinClubByCodeBar } from "@/components/clubs/JoinClubByCodeBar"
import { generateSabhaCode } from "@/lib/sabha"
import {
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  ArrowRight,
  KeyRound,
  Lock,
  Globe,
} from "lucide-react"

export const dynamic = "force-dynamic"

let clubsBootstrapped = false

async function ensureDefaultClubsAndCodes() {
  if (clubsBootstrapped) return
  const existingClubs = await prisma.bookClub.findMany({
    select: { id: true, name: true, inviteCode: true },
  })

  if (existingClubs.length === 0) {
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    })
    if (!firstUser) return

    const defaults = [
      {
        name: "Tagore & Indian Literary Renaissance",
        bookTitle: "Gitanjali",
        bookAuthor: "Rabindranath Tagore",
        ebookKey: "7164",
        inviteCode: "SABHA-TAGORE",
        scheduleText: "Sundays · 8:00 PM IST Shanti Co-Read",
        description:
          "Exploring lyrical poetry, swadeshi humanism, and classic Indian works available free in our E-Library.",
      },
      {
        name: "Systems, DSA & Engineering Study Sabha",
        bookTitle: "Introduction to Algorithms",
        bookAuthor: "Thomas H. Cormen",
        ebookKey: null,
        inviteCode: "SABHA-DSA101",
        scheduleText: "Wednesdays & Saturdays · 9:30 PM IST",
        description:
          "Peer problem-solving team for CS & engineering students tackling graphs, dynamic programming, and systems.",
      },
      {
        name: "Stoic Wisdom & Mindful Focus Circle",
        bookTitle: "Meditations",
        bookAuthor: "Marcus Aurelius",
        ebookKey: "2680",
        inviteCode: "SABHA-STOIC",
        scheduleText: "Daily 25-Min Morning Shanti Session",
        description:
          "Slow, reflective reading of timeless philosophical classics—one passage each morning before classes or work.",
      },
    ]

    for (const item of defaults) {
      await prisma.bookClub.create({
        data: {
          ...item,
          creatorId: firstUser.id,
          members: { create: { userId: firstUser.id, role: "LEADER" } },
        },
      })
    }
    return
  }

  // Backfill inviteCode on any legacy clubs missing one
  for (const c of existingClubs) {
    if (!c.inviteCode) {
      const lower = c.name.toLowerCase()
      const preset = lower.includes("tagore")
        ? "SABHA-TAGORE"
        : lower.includes("dsa") || lower.includes("algorithm")
        ? "SABHA-DSA101"
        : lower.includes("stoic")
        ? "SABHA-STOIC"
        : generateSabhaCode()

      await prisma.bookClub
        .update({
          where: { id: c.id },
          data: { inviteCode: preset },
        })
        .catch(async () => {
          await prisma.bookClub.update({
            where: { id: c.id },
            data: { inviteCode: generateSabhaCode() },
          })
        })
    }
  }
  clubsBootstrapped = true
}

export default async function SabhaClubsPage() {
  const [, session] = await Promise.all([
    ensureDefaultClubsAndCodes(),
    auth(),
  ])
  const userId = session?.user?.id || null

  const clubs = await cached(`clubs:${userId || "public"}`, 15_000, () =>
    prisma.bookClub.findMany({
      where: userId
        ? {
            OR: [
              { isPrivate: false },
              { members: { some: { userId } } },
              { creatorId: userId },
            ],
          }
        : { isPrivate: false },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        members: userId
          ? {
              where: { userId },
              select: { userId: true, role: true },
            }
          : false,
        _count: { select: { members: true, posts: true } },
      },
    })
  )

  const myTeams = userId
    ? clubs.filter(
        (c) =>
          c.creatorId === userId ||
          (Array.isArray(c.members) && c.members.length > 0)
      )
    : []

  const publicTeams = clubs.filter((c) => !c.isPrivate)

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
        <div className="container mx-auto max-w-6xl relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-[13px] font-bold uppercase tracking-widest text-[#FF8A4C] mb-4">
              <Users className="w-4 h-4" /> Reading Sabhas · Study Squads
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none mb-4 text-white max-w-2xl">
              Sabha{" "}
              <span className="font-serif italic font-medium text-[#FF7F45]">
                Reading Teams.
              </span>
            </h1>
            <p className="text-white/75 text-base md:text-lg max-w-2xl leading-relaxed">
              Start a hostel exam prep squad or an evening poetry circle. Share
              your{" "}
              <span className="text-white font-mono font-bold">
                SABHA-XXXXXX
              </span>{" "}
              code with friends to co-read in Shanti Mode and trade notes
              chapter by chapter.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Suspense fallback={null}>
              <JoinClubByCodeBar isLoggedIn={Boolean(userId)} />
            </Suspense>
            <CreateClubModal isLoggedIn={Boolean(userId)} />
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pt-10 space-y-12">
        {/* My Joined Sabha Teams */}
        {myTeams.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-[#C84200]">
                  Your Circles
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight mt-0.5">
                  My Reading Sabhas ({myTeams.length})
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.map((club) => (
                <SabhaTeamCard
                  key={`my-${club.id}`}
                  club={club}
                  isMember={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Open Public Sabha Teams Directory */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-[#6e6e73]">
                Open Circles
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight mt-0.5">
                Public Reading Sabhas ({publicTeams.length})
              </h2>
            </div>
            <p className="text-sm font-medium text-[#6e6e73]">
              Have a private team code? Enter it in the top bar above to join
              directly.
            </p>
          </div>

          {publicTeams.length === 0 ? (
            <div className="bg-white rounded-3xl p-14 text-center border border-[#1D1D1F]/[0.07]">
              <Users className="w-12 h-12 text-[#C84200]/40 mx-auto mb-3" />
              <h3 className="text-2xl font-black text-[#1D1D1F] mb-2">
                Start the first Public Sabha Team
              </h3>
              <p className="text-base text-[#6e6e73] max-w-md mx-auto mb-6 leading-relaxed">
                Create a reading team and share your invite code with classmates
                or fellow readers.
              </p>
              <CreateClubModal isLoggedIn={Boolean(userId)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTeams.map((club) => {
                const isMember = myTeams.some((m) => m.id === club.id)
                return (
                  <SabhaTeamCard
                    key={club.id}
                    club={club}
                    isMember={isMember}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SabhaTeamCard({
  club,
  isMember,
}: {
  club: any
  isMember: boolean
}) {
  return (
    <Link
      href={`/clubs/${club.id}`}
      className="group bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07] hover:shadow-xl hover:border-[#C84200]/35 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {club.isPrivate ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black uppercase">
                <Lock className="w-3.5 h-3.5" /> Private Team
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] text-[#C84200] text-xs font-black uppercase">
                <Globe className="w-3.5 h-3.5" /> Public Team
              </span>
            )}
            {isMember && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase">
                Joined
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6e6e73]">
            <Users className="w-4 h-4" /> {club._count.members}/
            {club.maxMembers || 25}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] group-hover:text-[#C84200] transition-colors leading-snug mb-3">
          {club.name}
        </h3>

        <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] mb-4">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#C84200] mb-1">
            <BookOpen className="w-3.5 h-3.5" /> Current Book
          </div>
          <p className="text-base font-bold text-[#1D1D1F] truncate">
            {club.bookTitle}
          </p>
          <p className="text-sm text-[#6e6e73] font-medium truncate">
            by {club.bookAuthor}
          </p>
        </div>

        <p className="text-sm sm:text-[15px] text-[#525257] line-clamp-2 leading-relaxed mb-5">
          {club.description}
        </p>
      </div>

      <div className="pt-4 border-t border-[#1D1D1F]/[0.06] space-y-3">
        <div className="flex items-center justify-between gap-2">
          {club.inviteCode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D1D1F] text-white font-mono text-xs font-bold tracking-wider shrink-0">
              <KeyRound className="w-3.5 h-3.5 text-[#FF8A4C]" />
              {club.inviteCode}
            </span>
          )}
          {club.scheduleText && (
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#6e6e73] truncate">
              <Calendar className="w-3.5 h-3.5 text-[#C84200] shrink-0" />
              <span className="truncate">{club.scheduleText}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6e6e73]">
            <MessageSquare className="w-4 h-4" /> {club._count.posts}{" "}
            reflections
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-[#C84200]">
            Open Team <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
