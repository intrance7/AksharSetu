import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { BookCard } from "@/components/catalog/BookCard"
import {
  GraduationCap,
  Package,
  Plus,
  Search,
  BookOpen,
  ArrowLeftRight,
} from "lucide-react"
import { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const POPULAR_UNIVERSITIES = [
  "Delhi University",
  "KR Mangalam University",
  "Mumbai University",
  "IIT",
  "VTU",
  "SPPU Pune",
]

export default async function CampusTextbookHubPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const university =
    typeof params.university === "string" ? params.university : ""
  const course = typeof params.course === "string" ? params.course : ""
  const semesterStr =
    typeof params.semester === "string" ? params.semester : ""
  const bundlesOnly = params.bundles === "true"
  const q = typeof params.q === "string" ? params.q : ""

  const session = await auth()
  let userLocation: { latitude: number | null; longitude: number | null } | null =
    null
  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { latitude: true, longitude: true },
    })
    if (u?.latitude && u?.longitude) {
      userLocation = { latitude: u.latitude, longitude: u.longitude }
    }
  }

  const where: Prisma.BookWhereInput = {
    status: "AVAILABLE",
  }

  // Default to academic categories/listings unless searching broadly
  if (!university && !course && !semesterStr && !bundlesOnly && !q) {
    where.OR = [
      { category: { in: ["engineering", "medical", "school"], mode: "insensitive" } },
      { university: { not: null } },
      { semester: { not: null } },
      { isBundle: true },
    ]
  } else {
    if (university) {
      where.university = { contains: university, mode: "insensitive" }
    }
    if (course) {
      where.course = { contains: course, mode: "insensitive" }
    }
    if (semesterStr && !Number.isNaN(parseInt(semesterStr, 10))) {
      where.semester = parseInt(semesterStr, 10)
    }
    if (bundlesOnly) {
      where.isBundle = true
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { bundleDescription: { contains: q, mode: "insensitive" } },
      ]
    }
  }

  const [books, distinctUniRows, bundleCount] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: [{ isBundle: "desc" }, { createdAt: "desc" }],
      include: {
        owner: {
          select: {
            latitude: true,
            longitude: true,
            location: true,
          },
        },
      },
      take: 36,
    }),
    prisma.book.findMany({
      where: { status: "AVAILABLE", university: { not: null } },
      distinct: ["university"],
      select: { university: true },
      take: 10,
    }),
    prisma.book.count({ where: { status: "AVAILABLE", isBundle: true } }),
  ])

  const liveUniversities = Array.from(
    new Set([
      ...distinctUniRows
        .map((r) => r.university?.trim())
        .filter((v): v is string => Boolean(v)),
      ...POPULAR_UNIVERSITIES,
    ])
  ).slice(0, 8)

  const buildHref = (overrides: Record<string, string | null>) => {
    const sp = new URLSearchParams()
    const merged: Record<string, string> = {
      ...(university ? { university } : {}),
      ...(course ? { course } : {}),
      ...(semesterStr ? { semester: semesterStr } : {}),
      ...(bundlesOnly ? { bundles: "true" } : {}),
      ...(q ? { q } : {}),
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (!v) delete merged[k]
      else merged[k] = v
    }
    for (const [k, v] of Object.entries(merged)) {
      sp.set(k, v)
    }
    const qs = sp.toString()
    return qs ? `/campus?${qs}` : "/campus"
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Dark Hero */}
      <section className="bg-black text-[#F5F5F7] py-16 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-[#F5F5F7]/85 mb-4">
              <GraduationCap className="w-4 h-4 text-[#C84200]" /> Campus Desk ·
              Syllabus Stacks
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.03] mb-4 max-w-3xl">
              Senior Stacks. Half the Cover Price.
            </h1>
            <p className="text-[#86868b] text-base md:text-lg max-w-2xl">
              Pick up exact syllabus editions and full-semester bundles straight
              from seniors on your campus—or swap last term&apos;s set 1-for-1
              for the incoming semester.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/catalog/new?bundle=true"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-colors"
            >
              <Package className="w-4 h-4" /> List a Semester Pack
            </Link>
            <Link
              href="/catalog/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <Plus className="w-4 h-4" /> List One Textbook
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-8 space-y-8">
        {/* Search & Academic Filter Console */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-5">
          <form
            action="/campus"
            method="GET"
            className="grid grid-cols-1 md:grid-cols-12 gap-3"
          >
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Subject, textbook, or author (e.g. DSA, Cormen, Anatomy)..."
                className="w-full h-12 rounded-2xl bg-[#FAF6F0] pl-11 pr-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/25"
              />
            </div>

            <div className="md:col-span-3">
              <input
                type="text"
                name="university"
                defaultValue={university}
                placeholder="University / College..."
                className="w-full h-12 rounded-2xl bg-[#FAF6F0] px-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/25"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                name="course"
                defaultValue={course}
                placeholder="Course (e.g. B.Tech CSE)"
                className="w-full h-12 rounded-2xl bg-[#FAF6F0] px-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/25"
              />
            </div>

            {semesterStr && (
              <input type="hidden" name="semester" value={semesterStr} />
            )}
            {bundlesOnly && <input type="hidden" name="bundles" value="true" />}

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 h-12 rounded-2xl bg-[#1D1D1F] hover:bg-[#C84200] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Search Hub
              </button>
            </div>
          </form>

          {/* Semester Pills + Bundles Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-[#86868b] mr-1">
                Semester:
              </span>
              <Link
                href={buildHref({ semester: null })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  !semesterStr
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-[#FAF6F0] text-[#1D1D1F] hover:bg-black/5"
                }`}
              >
                All
              </Link>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const active = semesterStr === String(sem)
                return (
                  <Link
                    key={sem}
                    href={buildHref({ semester: active ? null : String(sem) })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      active
                        ? "bg-[#C84200] text-white"
                        : "bg-[#FAF6F0] text-[#1D1D1F] hover:bg-black/5"
                    }`}
                  >
                    Sem {sem}
                  </Link>
                )
              })}
            </div>

            <Link
              href={buildHref({ bundles: bundlesOnly ? null : "true" })}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-colors border ${
                bundlesOnly
                  ? "bg-[#0066cc] text-white border-[#0066cc]"
                  : "bg-[#FAF6F0] text-[#1D1D1F] border-black/10 hover:bg-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Semester Bundles ({bundleCount}
              )
            </Link>
          </div>

          {/* Quick Campus Chips */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-[#86868b] mr-1">
                Campuses:
              </span>
              {liveUniversities.map((uni) => {
                const active =
                  university.toLowerCase() === uni.toLowerCase()
                return (
                  <Link
                    key={uni}
                    href={buildHref({ university: active ? null : uni })}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      active
                        ? "bg-[#C84200]/15 text-[#C84200] border border-[#C84200]/30 font-bold"
                        : "bg-[#FAF6F0] text-[#86868b] hover:text-[#1D1D1F]"
                    }`}
                  >
                    {uni}
                  </Link>
                )
              })}
            </div>

            {(university || course || semesterStr || bundlesOnly || q) && (
              <Link
                href="/campus"
                className="text-xs font-bold text-[#C84200] hover:underline shrink-0"
              >
                Reset All Filters
              </Link>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {books.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-black/5">
            <BookOpen className="w-12 h-12 text-[#C84200]/40 mx-auto mb-3" />
            <h2 className="text-2xl font-black text-[#1D1D1F] mb-2">
              No textbooks listed for this filter yet
            </h2>
            <p className="text-sm text-[#86868b] max-w-md mx-auto mb-6">
              Be the first on your campus to list this semester&apos;s pack, or
              post a request so seniors at your university get notified.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/catalog/new?bundle=true"
                className="px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                List a Semester Bundle
              </Link>
              <Link
                href="/requests"
                className="px-6 py-3 rounded-full bg-[#FAF6F0] hover:bg-[#E8E2D7] text-[#1D1D1F] font-bold text-xs uppercase tracking-wider border border-black/10 transition-colors"
              >
                Request from Seniors
              </Link>
              <Link
                href="/campus"
                className="px-6 py-3 rounded-full bg-white hover:bg-black/5 text-[#86868b] font-bold text-xs uppercase tracking-wider border border-black/10 transition-colors"
              >
                Reset Filters
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <h2 className="text-xl font-black text-[#1D1D1F]">
                Campus Textbooks &amp; Semester Packs ({books.length})
              </h2>
              <Link
                href="/catalog?price=exchange"
                className="text-xs font-bold text-[#0066cc] hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" /> View All 1-for-1
                Swaps →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book as any}
                  userLocation={userLocation}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

