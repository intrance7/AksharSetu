import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LibraryGrid } from "@/components/library/LibraryGrid"
import { LiveReadersStrip } from "@/components/library/LiveReadersStrip"
import { BookOpen, Tablet, Bookmark, Clock, Highlighter } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function LibraryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [libraryBooks, readingSessions, recentNotes] = await Promise.all([
    prisma.libraryBook.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.readingSession.findMany({
      where: { userId: session.user.id },
      select: { durationMinutes: true },
    }),
    prisma.bookNote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ])

  const totalMinutes = readingSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const readingCount = libraryBooks.filter((b) => b.status === "READING").length
  const completedCount = libraryBooks.filter((b) => b.status === "READ").length
  const ebookCount = libraryBooks.filter(
    (b) =>
      b.gutenbergId !== null ||
      (b.platformBookId && /^(ia-|ol-|gb-|pg-|\d+)/.test(b.platformBookId))
  ).length

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* High-Contrast Editorial Obsidian Hero */}
      <section className="relative bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,178,43,0.08),transparent_50%)] text-[#F5F5F7] py-14 md:py-16 border-b border-white/10 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#FF8A4C] text-xs sm:text-[13px] font-bold uppercase tracking-widest mb-4">
              <BookOpen className="w-4 h-4" /> Bookshelf · Shanti Desk
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none mb-4 text-white">
              My{" "}
              <span className="font-serif italic font-medium text-[#FF7F45]">
                Library.
              </span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl leading-relaxed">
              Your shelf across print copies, open-archive editions, quiet Shanti timers, and every line you underlined along the way.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white px-5 h-11 text-sm font-bold transition-colors"
            >
              Orders & Swaps
            </Link>
            <Link
              id="library-browse-ebooks"
              href="/ebooks"
              className="inline-flex items-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white px-6 h-11 text-sm font-bold transition-colors shadow-lg shadow-[#C84200]/20"
            >
              <Tablet className="w-4 h-4" /> Browse E-Library
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Reading Stats Bento Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#6e6e73] flex items-center gap-1.5 mb-2">
              <BookOpen className="w-4 h-4 text-[#C84200]" /> Total Shelf
            </span>
            <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
              {libraryBooks.length}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#6e6e73] flex items-center gap-1.5 mb-2">
              <Bookmark className="w-4 h-4 text-amber-600" /> Reading Now
            </span>
            <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
              {readingCount}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#6e6e73] flex items-center gap-1.5 mb-2">
              <Tablet className="w-4 h-4 text-[#0066cc]" /> Digital Editions
            </span>
            <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
              {ebookCount}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#6e6e73] flex items-center gap-1.5 mb-2">
              <Highlighter className="w-4 h-4 text-rose-600" /> Highlights
            </span>
            <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
              {recentNotes.length}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[#6e6e73] flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-[#0A7D4F]" /> Shanti Focus
            </span>
            <p className="text-3xl sm:text-4xl font-black text-[#1d1d1f] leading-none">
              {totalMinutes}
              <span className="text-sm font-semibold text-[#6e6e73] ml-1">
                m ({completedCount} done)
              </span>
            </p>
          </div>
        </div>

        {/* Live Reading Rooms ("Shanti Together") */}
        <LiveReadersStrip />

        {/* Recent Literary Highlights & Notes Shelf */}
        {recentNotes.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-[#C84200]">
                Marginalia &amp; Notes
              </p>
              <h2 className="text-2xl font-black tracking-tight text-[#1d1d1f] mt-0.5">
                Underlined Passages &amp; Margin Notes
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentNotes.slice(0, 3).map((note) => (
                <Link
                  key={note.id}
                  href={`/ebooks/${encodeURIComponent(note.bookKey)}?view=book`}
                  className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm hover:shadow-md hover:border-[#C84200]/30 transition flex flex-col justify-between"
                >
                  <div>
                    <p className="font-serif italic text-base text-[#1d1d1f] line-clamp-3 leading-relaxed mb-3">
                      “{note.quoteText}”
                    </p>
                    {note.noteText && (
                      <p className="text-sm text-[#525257] bg-[#FAF6F0] rounded-2xl px-3.5 py-2.5 mb-3 line-clamp-2">
                        Note: {note.noteText}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-[13px] text-[#6e6e73] pt-3 border-t border-[#1D1D1F]/[0.06]">
                    <span className="font-bold text-[#1d1d1f] truncate max-w-[190px]">
                      {note.bookTitle}
                    </span>
                    <span className="text-[#C84200] font-bold shrink-0">
                      Page {note.pageNumber} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <LibraryGrid initialBooks={libraryBooks} />
      </div>
    </div>
  )
}
