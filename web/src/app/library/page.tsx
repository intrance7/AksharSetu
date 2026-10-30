import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LibraryGrid } from "@/components/library/LibraryGrid"
import { BookOpen, Tablet, Sparkles, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function LibraryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const [libraryBooks, readingSessions] = await Promise.all([
    prisma.libraryBook.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.readingSession.findMany({
      where: { userId: session.user.id },
      select: { durationMinutes: true },
    }),
  ])

  const totalMinutes = readingSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const readingCount = libraryBooks.filter((b) => b.status === "READING").length
  const completedCount = libraryBooks.filter((b) => b.status === "READ").length
  const ebookCount = libraryBooks.filter((b) => b.gutenbergId !== null).length

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-16 pb-24 relative overflow-hidden">
      {/* Decorative Side Doodles */}
      <div className="hidden xl:block absolute -left-10 top-64 w-[280px] pointer-events-none z-0 opacity-75">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/doodle-plant-books.png" alt="" className="w-full h-auto mix-blend-multiply" />
      </div>

      <div className="container mx-auto max-w-[1280px] px-4 md:px-8 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C84200]/10 text-[#C84200] text-xs font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Personal Reading Room
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#1D1D1F] tracking-tight leading-none mb-3">
              My Library
            </h1>
            <p className="text-[#1D1D1F]/65 text-lg font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C84200]" /> Track your physical books, saved e-books, and Shanti Mode focus sessions.
            </p>
          </div>

          <Link
            id="library-browse-ebooks"
            href="/ebooks"
            className="inline-flex items-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white px-6 h-12 text-sm font-black uppercase tracking-wider transition-colors shadow-md shrink-0"
          >
            <Tablet className="w-4 h-4" /> Browse E-Library
          </Link>
        </div>

        {/* Reading Stats Bento Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 border border-[#1D1D1F]/5 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-[#86868B] flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[#C84200]" /> Total Shelf
            </span>
            <p className="text-3xl font-black text-[#1D1D1F]">{libraryBooks.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#1D1D1F]/5 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-[#86868B] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D99A0B]" /> Currently Reading
            </span>
            <p className="text-3xl font-black text-[#1D1D1F]">{readingCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#1D1D1F]/5 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-[#86868B] flex items-center gap-1.5 mb-1">
              <Tablet className="w-3.5 h-3.5 text-[#3B4CCA]" /> Digital Classics
            </span>
            <p className="text-3xl font-black text-[#1D1D1F]">{ebookCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#1D1D1F]/5 shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-[#86868B] flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#287F56]" /> Shanti Focus
            </span>
            <p className="text-3xl font-black text-[#1D1D1F]">
              {totalMinutes} <span className="text-sm font-bold text-[#86868B]">mins ({completedCount} read)</span>
            </p>
          </div>
        </div>

        <LibraryGrid initialBooks={libraryBooks} />
      </div>
    </div>
  )
}
