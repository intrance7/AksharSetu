import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { CreateClubModal } from "@/components/clubs/CreateClubModal"
import {
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react"

export const dynamic = "force-dynamic"

async function ensureDefaultClubs() {
  const count = await prisma.bookClub.count()
  if (count > 0) return

  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } })
  if (!firstUser) return

  const defaults = [
    {
      name: "Tagore & Indian Literary Renaissance",
      bookTitle: "Gitanjali",
      bookAuthor: "Rabindranath Tagore",
      ebookKey: "7164",
      scheduleText: "Sundays · 8:00 PM IST Shanti Co-Read",
      description:
        "Exploring lyrical poetry, swadeshi humanism, and classic Indian works available free in our E-Library.",
    },
    {
      name: "Systems, DSA & Engineering Study Sabha",
      bookTitle: "Introduction to Algorithms",
      bookAuthor: "Thomas H. Cormen",
      ebookKey: null,
      scheduleText: "Wednesdays & Saturdays · 9:30 PM IST",
      description:
        "Peer problem-solving circle for CS & engineering students tackling graphs, dynamic programming, and systems.",
    },
    {
      name: "Stoic Wisdom & Mindful Focus Circle",
      bookTitle: "Meditations",
      bookAuthor: "Marcus Aurelius",
      ebookKey: "2680",
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
        members: { create: { userId: firstUser.id } },
      },
    })
  }
}

export default async function SabhaClubsPage() {
  await ensureDefaultClubs()
  const session = await auth()

  const clubs = await prisma.bookClub.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, posts: true } },
    },
  })

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      <section className="bg-black text-[#F5F5F7] py-16 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-[#F5F5F7]/80 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#C84200]" /> Sabha —
              Literary Circles
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.04] mb-4 max-w-2xl">
              Read Together. Share Margin Reflections.
            </h1>
            <p className="text-[#86868b] text-base md:text-lg max-w-2xl">
              Join a community reading Sabha linked directly to our Free
              E-Library and physical textbook catalog—post chapter insights and
              co-read in Shanti Mode.
            </p>
          </div>

          <div className="shrink-0">
            <CreateClubModal isLoggedIn={Boolean(session?.user?.id)} />
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pt-10">
        {clubs.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center border border-black/5">
            <Users className="w-12 h-12 text-[#C84200]/40 mx-auto mb-3" />
            <h2 className="text-2xl font-black text-[#1D1D1F] mb-2">
              Be the founder of the first Sabha Circle
            </h2>
            <p className="text-sm text-[#86868b] max-w-md mx-auto mb-6">
              Pick any classic from the E-Library or a semester textbook and
              invite fellow readers to discuss chapters together.
            </p>
            <CreateClubModal isLoggedIn={Boolean(session?.user?.id)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="group bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6F0] text-[#C84200] text-[11px] font-black">
                      <BookOpen className="w-3 h-3" /> Currently Reading
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#86868b]">
                      <Users className="w-3.5 h-3.5" /> {club._count.members}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-[#1D1D1F] group-hover:text-[#C84200] transition-colors leading-snug mb-2">
                    {club.name}
                  </h2>

                  <div className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-black/5 mb-4">
                    <p className="text-sm font-bold text-[#1D1D1F] truncate">
                      {club.bookTitle}
                    </p>
                    <p className="text-xs text-[#86868b] font-medium truncate">
                      by {club.bookAuthor}
                    </p>
                  </div>

                  <p className="text-sm text-[#86868b] line-clamp-3 leading-relaxed mb-5">
                    {club.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-black/5 space-y-3">
                  {club.scheduleText && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]/80">
                      <Calendar className="w-3.5 h-3.5 text-[#0066cc] shrink-0" />
                      <span className="truncate">{club.scheduleText}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#86868b]">
                      <MessageSquare className="w-3.5 h-3.5" />{" "}
                      {club._count.posts} reflections
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#C84200]">
                      Enter Sabha <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

