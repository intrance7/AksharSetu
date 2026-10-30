import type { Metadata } from "next"
import Link from "next/link"
import { Search, Sparkles, BookOpen, Library, Compass, Feather, ScrollText, Brain, Flame } from "lucide-react"
import { searchEbooks } from "@/lib/gutenberg"
import { EbookGrid } from "@/components/ebooks/EbookGrid"

export const metadata: Metadata = {
  title: "E-Library · Read Free Classics Online | AksharSetu",
  description:
    "Read 70,000+ public-domain classics online, free. Tagore, Austen, Doyle and more, with a distraction-free reader and Shanti Mode focus sessions.",
}

const QUICK_SEARCHES = [
  "Rabindranath Tagore",
  "Sarojini Naidu",
  "Kalidasa",
  "Mahatma Gandhi",
  "Swami Vivekananda",
  "Sherlock Holmes",
  "Jane Austen",
  "Leo Tolstoy",
]

const COLLECTIONS = [
  { label: "Popular Classics", query: "", icon: Flame, color: "#C84200" },
  { label: "Indian Heritage", query: "Tagore", icon: Feather, color: "#D99A0B" },
  { label: "Philosophy & Wisdom", query: "Upanishads", icon: Brain, color: "#3B4CCA" },
  { label: "Poetry & Verse", query: "Poetry", icon: ScrollText, color: "#C93A64" },
  { label: "Mystery & Detective", query: "Sherlock Holmes", icon: Compass, color: "#0B8577" },
  { label: "World Fiction", query: "Jane Austen", icon: BookOpen, color: "#C4420C" },
]

const HERO_CLASSICS = [
  { title: "Gitanjali", author: "Rabindranath Tagore", color: "#C84200", rotate: "-10deg", y: "18px" },
  { title: "The Golden Threshold", author: "Sarojini Naidu", color: "#C93A64", rotate: "-3deg", y: "2px" },
  { title: "Raja Yoga", author: "Swami Vivekananda", color: "#3B4CCA", rotate: "4deg", y: "6px" },
  { title: "Shakuntala", author: "Kalidasa", color: "#0B8577", rotate: "11deg", y: "22px" },
]

export default async function EbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ""
  const books = await searchEbooks(query || undefined)

  return (
    <main className="min-h-screen bg-[#F2EBE1] text-[#1D1D1F] relative overflow-hidden">
      {/* Side Decorative Doodles matching Catalog & Home */}
      <div className="hidden xl:block absolute -left-10 top-[520px] w-[300px] pointer-events-none z-0 opacity-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/doodle-bulb-books.png"
          alt=""
          className="w-full h-auto drop-shadow-2xl mix-blend-multiply"
        />
      </div>
      <div className="hidden xl:block absolute -right-10 bottom-48 w-[300px] pointer-events-none z-0 opacity-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/doodle-glasses-books.png"
          alt=""
          className="w-full h-auto drop-shadow-2xl mix-blend-multiply rotate-6"
        />
      </div>

      {/* Hero Section */}
      <section className="bg-[#1D1D1F] text-[#F2EBE1] pt-20 pb-28 px-4 md:px-8 relative overflow-hidden">
        {/* Subtle Radial Dot Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(#F2EBE1 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container mx-auto max-w-[1200px] relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          {/* Left Column: Copy + Search */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C84200]/20 border border-[#FF7F45]/30 text-[#FF7F45] text-xs font-black uppercase tracking-widest mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Digital Commons · 70,000+ Free Books
            </div>

            <h1 className="text-[clamp(3rem,6.8vw,5.6rem)] font-black leading-[0.94] tracking-[-0.035em] text-[#F2EBE1] mb-6">
              Read free.
              <span className="block text-[#F4B22B]">Read forever.</span>
            </h1>

            <p className="text-[#F2EBE1]/75 text-lg max-w-[48ch] mb-8 font-medium">
              Timeless Indian and world classics from Project Gutenberg. Instant distraction-free reading in your browser with{" "}
              <span className="text-[#F2EBE1] font-bold">Shanti Mode</span> focus sessions.
            </p>

            {/* Search Form */}
            <form
              action="/ebooks"
              className="flex items-center gap-2.5 w-full max-w-xl bg-[#2A2837] border-2 border-[#2A2837] text-white rounded-2xl p-2 pl-4 shadow-xl focus-within:border-[#F4B22B] transition-colors"
            >
              <Search className="w-5 h-5 text-[#F2EBE1]/50 shrink-0" />
              <input
                id="ebook-search"
                name="q"
                defaultValue={query}
                placeholder="Search by title, author, or topic (e.g. Tagore, Gita, Holmes)"
                className="flex-1 bg-transparent border-none outline-none py-2 px-1 text-[1rem] text-[#F2EBE1] placeholder:text-[#F2EBE1]/40"
              />
              <button
                id="ebook-search-submit"
                type="submit"
                className="bg-[#FF7F45] hover:bg-[#FF9A68] text-[#1D1B26] px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-colors cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            {/* Quick Search Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-5 text-xs">
              <span className="font-bold text-[#F2EBE1]/60 mr-1 uppercase tracking-wider">Try:</span>
              {QUICK_SEARCHES.map((term) => {
                const active = query.toLowerCase() === term.toLowerCase()
                return (
                  <Link
                    key={term}
                    href={`/ebooks?q=${encodeURIComponent(term)}`}
                    className={`rounded-full px-3.5 py-1.5 font-bold border transition-colors ${
                      active
                        ? "bg-[#F4B22B] border-[#F4B22B] text-[#1D1D1F]"
                        : "border-[#F2EBE1]/25 text-[#F2EBE1]/80 hover:bg-[#F4B22B] hover:border-[#F4B22B] hover:text-[#1D1D1F]"
                    }`}
                  >
                    {term}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right Column: Fan of Classic Books */}
          <div className="hidden lg:flex items-center justify-center relative h-[360px]">
            <svg
              className="absolute top-2 left-[4%] w-[92%] h-auto overflow-visible opacity-75"
              viewBox="0 0 500 250"
              fill="none"
            >
              <path
                d="M14 240C14 -30 486 -30 486 240"
                stroke="#F4B22B"
                strokeWidth="3"
                strokeDasharray="2 12"
                strokeLinecap="round"
              />
              <circle cx="14" cy="236" r="6" fill="#F4B22B" />
              <circle cx="486" cy="236" r="6" fill="#FBF6E8" />
            </svg>

            <div className="flex items-end justify-center -space-x-6 pt-12">
              {HERO_CLASSICS.map((item, i) => (
                <Link
                  key={item.title}
                  href={`/ebooks?q=${encodeURIComponent(item.title)}`}
                  style={{
                    backgroundColor: item.color,
                    transform: `rotate(${item.rotate}) translateY(${item.y})`,
                    zIndex: i + 1,
                  }}
                  className="w-36 aspect-[5/7] rounded-r-xl rounded-l-sm p-4 flex flex-col justify-end text-white shadow-[18px_18px_36px_rgba(0,0,0,0.55)] border-l-[7px] border-black/25 hover:-translate-y-3 transition-transform duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-75 mb-auto">
                    Aksharसेतु Classic
                  </span>
                  <p className="font-black text-base leading-tight tracking-tight mb-1 drop-shadow-sm">
                    {item.title}
                  </p>
                  <p className="text-[11px] font-semibold opacity-90 truncate">{item.author}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Scalloped Arch Cutouts matching CatalogHero */}
        <div
          className="absolute left-0 right-0 bottom-[-1px] h-[28px] pointer-events-none z-20"
          style={{
            background:
              "radial-gradient(ellipse 22px 26px at 50% 100%, #F2EBE1 96%, transparent 100%) 50% 0 / 56px 100% repeat-x",
          }}
        />
      </section>

      {/* Curated Collections & Results */}
      <section className="container mx-auto max-w-[1320px] px-4 md:px-8 py-12 relative z-10">
        {/* Collection Shelf Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-[#1D1D1F]/10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {COLLECTIONS.map((col) => {
              const Icon = col.icon
              const isActive = query.toLowerCase() === col.query.toLowerCase()
              return (
                <Link
                  key={col.label}
                  href={col.query ? `/ebooks?q=${encodeURIComponent(col.query)}` : "/ebooks"}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-black tracking-tight whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#C84200] text-white shadow-sm"
                      : "bg-white text-[#1D1D1F]/80 hover:bg-[#1D1D1F] hover:text-[#F2EBE1] border border-[#1D1D1F]/5"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {col.label}
                </Link>
              )
            })}
          </div>

          <Link
            href="/library"
            className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-full bg-white border border-[#1D1D1F]/10 hover:border-[#C84200] text-xs sm:text-sm font-black text-[#1D1D1F] hover:text-[#C84200] transition-colors shadow-sm shrink-0"
          >
            <Library className="w-4 h-4 text-[#C84200]" />
            My Reading Room
          </Link>
        </div>

        {/* Section Heading */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#C84200] mb-1">
              {query ? "Search Results" : "Curated Digital Shelf"}
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#1D1D1F]">
              {query ? `Results for “${query}”` : "Most Read This Month"}
              <span className="text-[#1D1D1F]/40 text-xl font-bold ml-3">({books.length})</span>
            </h2>
          </div>

          {query && (
            <Link
              href="/ebooks"
              className="text-sm font-black text-[#C84200] hover:text-[#A33500] underline underline-offset-4"
            >
              Clear search
            </Link>
          )}
        </div>

        {/* Books Grid or Empty State */}
        {books.length ? (
          <EbookGrid books={books} />
        ) : (
          <div className="rounded-[2rem] bg-white border-2 border-dashed border-[#1D1D1F]/10 p-16 text-center max-w-2xl mx-auto my-8">
            <BookOpen className="w-12 h-12 text-[#C84200]/50 mx-auto mb-4" />
            <p className="text-2xl font-black text-[#1D1D1F] mb-2">No classics matched “{query}”</p>
            <p className="text-[#86868b] font-medium mb-6">
              Our digital library includes public-domain classics. Try searching for an author like “Tagore”, “Dickens”, or “Austen”.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/ebooks"
                className="bg-[#C84200] hover:bg-[#A33500] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
              >
                Browse Popular Classics
              </Link>
              <Link
                href={`/catalog?q=${encodeURIComponent(query)}`}
                className="bg-[#F2EBE1] hover:bg-[#e5ddd0] text-[#1D1D1F] px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
              >
                Search Physical Catalog Instead
              </Link>
            </div>
          </div>
        )}

        {/* Shanti Mode Feature Banner (Editorial Interlude style) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6 bg-[#F4B22B] text-[#1D1B26] rounded-[28px] p-8 md:px-12 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#1D1B26] text-[#FBF6E8] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3 h-3 text-[#F4B22B]" /> Shanti Mode · Deep Focus
            </div>
            <h3 className="font-black text-2xl md:text-3xl tracking-tight leading-tight mb-2">
              Turn every chapter into a mindful reading ritual.
            </h3>
            <p className="text-[#3A3320] font-medium max-w-2xl">
              Open any classic in Shanti Mode to pair our distraction-free paper reader with a Pomodoro focus timer, live status, and reading session streaks.
            </p>
          </div>
          <div>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 bg-[#1D1B26] text-[#FBF6E8] hover:bg-black font-bold px-7 py-4 rounded-full transition-colors shadow-lg whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#F4B22B]" />
              Open My Library
            </Link>
          </div>
        </div>

        <p className="text-xs font-medium text-[#1D1D1F]/60 text-center mt-12">
          Digital texts courtesy of{" "}
          <a
            href="https://www.gutenberg.org"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#C84200] underline underline-offset-2"
          >
            Project Gutenberg
          </a>
          . Free of copyright in the USA and open to all readers.
        </p>
      </section>
    </main>
  )
}
