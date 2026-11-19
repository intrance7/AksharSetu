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
      {/* High-Contrast Hero */}
      <section className="bg-black text-[#f5f5f7] py-12 md:py-14 border-b border-white/10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#FF8A4C] text-xs font-bold uppercase tracking-widest mb-4">
              <BookOpen className="w-3.5 h-3.5" /> Bookshelf · Shanti Desk
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none mb-3">
              My Bookshelf.
            </h1>
            <p className="text-[#86868b] text-base md:text-lg max-w-2xl">
              Your shelf across print copies, open-archive editions, quiet Shanti timers, and every line you underlined along the way.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white px-5 h-11 text-xs font-semibold transition-colors"
            >
              Orders & Swaps
            </Link>
            <Link
              id="library-browse-ebooks"
              href="/ebooks"
              className="inline-flex items-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white px-6 h-11 text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
            >
              <Tablet className="w-4 h-4" /> Browse E-Library
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Reading Stats Bento Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[#0066cc]" /> Total Shelf
            </span>
            <p className="text-3xl font-bold text-[#1d1d1f]">{libraryBooks.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5 mb-1">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" /> Reading Now
            </span>
            <p className="text-3xl font-bold text-[#1d1d1f]">{readingCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5 mb-1">
              <Tablet className="w-3.5 h-3.5 text-[#0066cc]" /> Digital Editions
            </span>
            <p className="text-3xl font-bold text-[#1d1d1f]">{ebookCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5 mb-1">
              <Highlighter className="w-3.5 h-3.5 text-rose-500" /> Highlights
            </span>
            <p className="text-3xl font-bold text-[#1d1d1f]">{recentNotes.length}</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Shanti Focus
            </span>
            <p className="text-3xl font-bold text-[#1d1d1f]">
              {totalMinutes}{" "}
              <span className="text-xs font-semibold text-[#86868b]">
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
              <p className="text-xs font-bold uppercase tracking-widest text-[#0066cc]">
                Marginalia &amp; Notes
              </p>
              <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                Underlined Passages &amp; Margin Notes
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentNotes.slice(0, 3).map((note) => (
                <Link
                  key={note.id}
                  href={`/ebooks/${encodeURIComponent(note.bookKey)}?view=book`}
                  className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <p className="font-serif italic text-sm text-[#1d1d1f] line-clamp-3 mb-2">
                      “{note.quoteText}”
                    </p>
                    {note.noteText && (
                      <p className="text-xs text-[#86868b] bg-[#f5f5f7] rounded-xl px-3 py-2 mb-3 line-clamp-2">
                        Note: {note.noteText}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#86868b] pt-2 border-t border-black/5">
                    <span className="font-semibold text-[#1d1d1f] truncate max-w-[180px]">
                      {note.bookTitle}
                    </span>
                    <span className="text-[#0066cc] font-bold">Page {note.pageNumber} →</span>
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
