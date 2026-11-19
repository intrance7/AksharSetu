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
      {
        category: {
          in: ["engineering", "medical", "school"],
          mode: "insensitive",
        },
      },
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
            id: true,
            name: true,
            username: true,
            sellerRating: true,
            booksSold: true,
            successfulExchanges: true,
            latitude: true,
            longitude: true,
            location: true,
          },
        },
        _count: {
          select: { requests: true },
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
      {/* Obsidian Editorial Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-16 md:py-20 px-4 md:px-8 border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 w-[440px] h-[440px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF7F45 0%, #C84200 42%, transparent 72%)",
          }}
        />

        <div className="container mx-auto max-w-7xl relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/15 text-xs font-bold uppercase tracking-[0.14em] text-[#F2EBE1]/90 mb-5">
              <GraduationCap className="w-4 h-4 text-[#FF7F45]" /> Campus Desk ·
              Syllabus Stacks
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.03] mb-4 max-w-3xl">
              Senior{" "}
              <span className="font-serif italic font-normal text-[#FF7F45]">
                Stacks.
              </span>{" "}
              Half the Cover Price.
            </h1>
            <p className="text-[#F2EBE1]/72 text-base md:text-lg leading-relaxed max-w-2xl">
              Pick up exact syllabus editions and full-semester packs straight
              from seniors on your campus—or swap last term&apos;s set 1-for-1
              for the incoming semester.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/catalog/new?bundle=true"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#C84200] hover:bg-[#FF7F45] hover:text-[#0B0B0D] text-white font-bold text-sm shadow-lg transition-colors"
            >
              <Package className="w-4 h-4" /> List a Semester Pack
            </Link>
            <Link
              href="/catalog/new"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> List One Textbook
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-8 space-y-8">
        {/* Search & Academic Filter Console */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] space-y-5">
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
                className="w-full h-12 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] pl-11 pr-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]/50 focus:ring-4 focus:ring-[#C84200]/10 transition-all"
              />
            </div>

            <div className="md:col-span-3">
              <input
                type="text"
                name="university"
                defaultValue={university}
                placeholder="University / College..."
                className="w-full h-12 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]/50 focus:ring-4 focus:ring-[#C84200]/10 transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                name="course"
                defaultValue={course}
                placeholder="Course (B.Tech, MBBS)"
                className="w-full h-12 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]/50 focus:ring-4 focus:ring-[#C84200]/10 transition-all"
              />
            </div>

            {semesterStr && (
              <input type="hidden" name="semester" value={semesterStr} />
            )}
            {bundlesOnly && <input type="hidden" name="bundles" value="true" />}

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 h-12 rounded-2xl bg-[#1D1D1F] hover:bg-[#C84200] text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Search Hub
              </button>
            </div>
          </form>

          {/* Semester Pills + Bundles Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1D1D1F]/[0.07]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#86868b] mr-1">
                Semester
              </span>
              <Link
                href={buildHref({ semester: null })}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${
                  !semesterStr
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-[#FAF6F0] text-[#1D1D1F] hover:bg-[#EFE7DC]"
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
                    className={`px-3.5 py-1.5 rounded-full font-mono text-[13px] font-bold transition-colors ${
                      active
                        ? "bg-[#C84200] text-white"
                        : "bg-[#FAF6F0] text-[#1D1D1F] hover:bg-[#EFE7DC]"
                    }`}
                  >
                    Sem {sem}
                  </Link>
                )
              })}
            </div>

            <Link
              href={buildHref({ bundles: bundlesOnly ? null : "true" })}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-colors border ${
                bundlesOnly
                  ? "bg-[#0066cc] text-white border-[#0066cc]"
                  : "bg-[#FAF6F0] text-[#1D1D1F] border-[#1D1D1F]/[0.08] hover:bg-white hover:border-[#0066cc]/40"
              }`}
            >
              <Package className="w-4 h-4" /> Semester Packs
              <span className="font-mono text-xs opacity-85">
                ({bundleCount})
              </span>
            </Link>
          </div>

          {/* Quick Campus Chips */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#86868b] mr-1">
                Campuses
              </span>
              {liveUniversities.map((uni) => {
                const active = university.toLowerCase() === uni.toLowerCase()
                return (
                  <Link
                    key={uni}
                    href={buildHref({ university: active ? null : uni })}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${
                      active
                        ? "bg-[#C84200]/12 text-[#C84200] border-[#C84200]/30 font-bold"
                        : "bg-[#FAF6F0] text-[#6e6e73] border-transparent hover:text-[#1D1D1F] hover:bg-[#EFE7DC]"
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
                className="text-[13px] font-bold text-[#C84200] hover:underline shrink-0"
              >
                Reset All Filters
              </Link>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {books.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-7 h-7 text-[#C84200]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] mb-2.5 tracking-tight">
              No textbooks on this{" "}
              <span className="font-serif italic font-normal text-[#C84200]">
                campus shelf
              </span>{" "}
              yet
            </h2>
            <p className="text-[15px] text-[#6e6e73] leading-relaxed max-w-md mx-auto mb-7">
              Be the first on your campus to list this semester&apos;s pack, or
              post a request so seniors at your university get notified.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/catalog/new?bundle=true"
                className="px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-bold text-sm transition-colors"
              >
                List a Semester Pack
              </Link>
              <Link
                href="/requests"
                className="px-6 py-3 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1D1D1F] font-bold text-sm border border-[#1D1D1F]/[0.1] transition-colors"
              >
                Request from Seniors
              </Link>
              <Link
                href="/campus"
                className="px-6 py-3 rounded-full bg-white hover:bg-[#FAF6F0] text-[#6e6e73] font-bold text-sm border border-[#1D1D1F]/[0.1] transition-colors"
              >
                Reset Filters
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight">
                  Campus Textbooks &amp;{" "}
                  <span className="font-serif italic font-normal text-[#C84200]">
                    Packs
                  </span>
                </h2>
                <span className="px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] font-mono text-xs font-bold text-[#1D1D1F]/75">
                  {books.length} available
                </span>
              </div>
              <Link
                href="/catalog?price=exchange"
                className="text-sm font-bold text-[#0066cc] hover:underline inline-flex items-center gap-1.5"
              >
                <ArrowLeftRight className="w-4 h-4" /> View All 1-for-1 Swaps →
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
