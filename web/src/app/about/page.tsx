import Link from "next/link"
import prisma from "@/lib/prisma"
import {
  BookOpen,
  HeartHandshake,
  ShieldCheck,
  GraduationCap,
  Lock,
  FileText,
  ArrowRight,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AboutPage() {
  const [booksCount, readersCount, donationsCount, sessionsCount] =
    await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.donation.count(),
      prisma.readingSession.count(),
    ])

  return (
    <div className="min-h-screen bg-[#F2EBE1] text-[#1D1D1F]">
      {/* Hero Section */}
      <section className="bg-[#000000] text-[#F5F5F7] py-20 md:py-28 px-4 border-b border-white/10">
        <div className="container mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-[#F5F5F7]/85 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-[#C84200]" /> Aksharसेतु ·
            Bridge of Letters
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-6">
            A good book deserves more than one reader.
          </h1>
          <p className="text-lg md:text-xl text-[#86868b] max-w-3xl mx-auto leading-relaxed mb-10">
            AksharSetu links Indian college shelves, neighborhood readers, and
            verified classroom NGOs—making it simple to pass down textbooks,
            trade novels 1-for-1, track{" "}
            <strong className="text-white">Vidya Daan</strong> pledges, and read
            unabridged classics in{" "}
            <strong className="text-white">Shanti Mode</strong> without noise.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/catalog"
              className="px-7 py-3.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-bold text-sm inline-flex items-center gap-2 transition-colors"
            >
              Browse the Stacks <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/donations"
              className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
            >
              Pledge to Vidya Daan
            </Link>
          </div>
        </div>
      </section>

      {/* Live Impact Strip */}
      <section className="container mx-auto max-w-6xl px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Books Cataloged", value: booksCount },
            { label: "Active Readers", value: readersCount },
            { label: "Vidya Daan Pledges", value: donationsCount },
            { label: "Shanti Focus Sessions", value: sessionsCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 text-center"
            >
              <div className="text-3xl md:text-4xl font-black tracking-tight text-[#1D1D1F]">
                {stat.value.toLocaleString()}+
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#86868b] mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Four Pillars Bento Grid */}
      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            How Books Move Here
          </h2>
          <p className="text-[#86868b] font-medium mt-2">
            Four practical ways AksharSetu keeps good editions circulating
            instead of sitting idle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/5">
            <div className="w-11 h-11 rounded-xl bg-[#FFF5E6] text-[#C84200] flex items-center justify-center mb-5">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">
              Campus Textbooks & 1-for-1 Barter
            </h3>
            <p className="text-sm text-[#86868b] leading-relaxed mb-4">
              Filter textbooks by university, degree, and semester—or bundle an
              entire semester&apos;s books in one click. Prefer trading instead
              of paying? Propose a direct 1-for-1 swap from your own shelf.
            </p>
            <Link
              href="/campus"
              className="text-sm font-bold text-[#C84200] hover:underline"
            >
              Open Campus Textbook Hub →
            </Link>
          </div>

          <div
            id="ngo"
            className="bg-white rounded-2xl p-8 shadow-sm border border-black/5 scroll-mt-24"
          >
            <div className="w-11 h-11 rounded-xl bg-[#EBF5FF] text-[#0066cc] flex items-center justify-center mb-5">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">
              Vidya Daan: 6-Stage Verifiable NGO Pipeline
            </h3>
            <p className="text-sm text-[#86868b] leading-relaxed mb-4">
              Every donated book receives a public tracking ID advancing through
              six verified checkpoints:{" "}
              <strong className="text-[#1D1D1F]">
                Donated → Collected → Verified → Sent to NGO → Received →
                Distributed
              </strong>
              , culminating in a printable{" "}
              <strong className="text-[#1D1D1F]">
                Vidya Daan Literacy Impact Certificate
              </strong>
              .
            </p>
            <Link
              href="/donations"
              className="text-sm font-bold text-[#0066cc] hover:underline"
            >
              View Active NGO Drives →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-black/5">
            <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#0A7D4F] flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">
              Open Classics &amp; Shanti Reading Room
            </h3>
            <p className="text-sm text-[#86868b] leading-relaxed mb-4">
              Read 70,000+ unabridged public-domain works from Project
              Gutenberg, Internet Archive, Open Library, and Google Books in a
              two-page Book Spread or Classic Scroll—paired with quiet rain,
              forest, and study-room soundscapes.
            </p>
            <Link
              href="/ebooks"
              className="text-sm font-bold text-[#0A7D4F] hover:underline"
            >
              Open the Archives →
            </Link>
          </div>

          <div
            id="trust"
            className="bg-white rounded-2xl p-8 shadow-sm border border-black/5 scroll-mt-24"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2">
              5-Point Condition Grades &amp; Tracked Handoffs
            </h3>
            <p className="text-sm text-[#86868b] leading-relaxed mb-4">
              Listings include structured 1–5 scores for cover, pages,
              highlighting, margin notes, and binding. Paid orders generate
              instant airway-bill (AWB) shipment tracking and post-delivery
              verified seller reviews that dynamically compute seller trust
              scores.
            </p>
            <Link
              href="/orders"
              className="text-sm font-bold text-[#1D1D1F] hover:underline"
            >
              Go to Orders & Swaps Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy & Terms Sections */}
      <section className="container mx-auto max-w-6xl px-4 pb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          id="privacy"
          className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <Lock className="w-5 h-5 text-[#0066cc]" />
            <h3 className="text-lg font-black">Privacy Policy</h3>
          </div>
          <ul className="space-y-2.5 text-sm text-[#86868b] leading-relaxed list-disc pl-5">
            <li>
              <strong className="text-[#1D1D1F]">Minimal Data Footprint:</strong>{" "}
              We store only your account profile, reading shelf, book notes, and
              marketplace transactions.
            </li>
            <li>
              <strong className="text-[#1D1D1F]">Opt-In Location Privacy:</strong>{" "}
              GPS coordinates are saved only when you explicitly click
              &ldquo;Detect GPS&rdquo; for nearby campus distance matching, and
              exact coordinates are jittered on public maps.
            </li>
            <li>
              <strong className="text-[#1D1D1F]">Zero Ad Tracking:</strong>{" "}
              Reading highlights, Shanti sessions, and direct messages are never
              sold or shared with third-party ad networks.
            </li>
          </ul>
        </div>

        <div
          id="terms"
          className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm scroll-mt-24"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <FileText className="w-5 h-5 text-[#C84200]" />
            <h3 className="text-lg font-black">Terms of Service</h3>
          </div>
          <ul className="space-y-2.5 text-sm text-[#86868b] leading-relaxed list-disc pl-5">
            <li>
              <strong className="text-[#1D1D1F]">Honest Condition Grading:</strong>{" "}
              Sellers must accurately disclose highlighting, notes, and binding
              wear when listing physical books.
            </li>
            <li>
              <strong className="text-[#1D1D1F]">Legal Digital Works Only:</strong>{" "}
              Our E-Library exclusively serves public-domain and open-access
              editions; pirated uploads are strictly prohibited.
            </li>
            <li>
              <strong className="text-[#1D1D1F]">Respectful Campus Conduct:</strong>{" "}
              Meetups should take place in public campus or library spaces, and
              harassment or spam results in immediate moderation removal.
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

