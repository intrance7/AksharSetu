import Link from "next/link"
import { EBookSource, EBookSummary, searchEbooks } from "@/lib/gutenberg"
import EbookGrid from "@/components/ebooks/EbookGrid"
import { HeroFeaturedStack } from "@/components/ebooks/HeroFeaturedStack"
import { LiveReadersStrip } from "@/components/library/LiveReadersStrip"
import {
  BookOpen,
  Search,
  Flame,
  Feather,
  Compass,
  ScrollText,
  Brain,
  Library,
  Globe,
} from "lucide-react"

export const revalidate = 3600

const CURATED_INDIAN_CLASSICS: EBookSummary[] = [
  { id: 7164, title: "Gitanjali", author: "Rabindranath Tagore", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 6686, title: "Sadhana: The Realisation of Life", author: "Rabindranath Tagore", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 2388, title: "The Bhagavad-Gita (Sir Edwin Arnold)", author: "Vyasa / Edwin Arnold", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 7235, title: "Raja Yoga", author: "Swami Vivekananda", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 16659, title: "The Home and the World", author: "Rabindranath Tagore", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 10371, title: "The Gardener", author: "Rabindranath Tagore", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 2520, title: "Hind Swaraj or Indian Home Rule", author: "Mahatma Gandhi", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 579, title: "The Golden Threshold", author: "Sarojini Naidu", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 1629, title: "Shakuntala", author: "Kalidasa", source: "gutenberg", sourceLabel: "Project Gutenberg" },
  { id: 3282, title: "The Crescent Moon", author: "Rabindranath Tagore", source: "gutenberg", sourceLabel: "Project Gutenberg" },
]

const CATEGORIES = [
  { label: "Popular Classics", query: "", icon: Flame },
  { label: "Indian Heritage", query: "india", icon: Feather },
  { label: "Philosophy & Wisdom", query: "philosophy", icon: Brain },
  { label: "Poetry & Verse", query: "poetry", icon: ScrollText },
  { label: "Mystery & Detective", query: "detective", icon: Compass },
  { label: "World Fiction", query: "fiction", icon: BookOpen },
]

const SOURCES: { id: "all" | EBookSource; label: string; badge: string }[] = [
  { id: "all", label: "All Free Libraries", badge: "4 Sources" },
  { id: "gutenberg", label: "Project Gutenberg", badge: "70k+ Public Domain" },
  { id: "archive", label: "Internet Archive", badge: "Scanned & Full Text" },
  { id: "openlibrary", label: "Open Library", badge: "Global Catalog" },
  { id: "google", label: "Google Books", badge: "Free E-Books & Previews" },
]

const QUICK_SEARCHES = [
  "Rabindranath Tagore",
  "Atomic Habits",
  "Swami Vivekananda",
  "Mahatma Gandhi",
  "Sherlock Holmes",
  "Jane Austen",
  "Bhagavad Gita",
  "Marcus Aurelius",
]

export default async function EbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>
}) {
  const { q, source } = await searchParams
  const activeQuery = q?.trim() || ""
  const activeSource: "all" | EBookSource =
    source === "gutenberg" ||
    source === "archive" ||
    source === "openlibrary" ||
    source === "google"
      ? source
      : "all"

  let books: EBookSummary[] = []
  try {
    books = await searchEbooks(activeQuery || undefined, activeSource)
  } catch {
    books = []
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* High-Contrast Editorial Obsidian Hero */}
      <section className="relative bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,178,43,0.08),transparent_50%)] text-[#F5F5F7] overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5 min-w-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-[13px] font-bold uppercase tracking-widest text-[#FF8A4C] max-w-full">
                <Globe className="w-4 h-4 shrink-0" />
                <span className="truncate">Open Archives · 70,000+ Public Domain Editions</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-white">
                Open{" "}
                <span className="font-serif italic font-medium text-[#FF7F45]">
                  E-Library.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/75 max-w-2xl leading-relaxed">
                Browse unabridged public-domain works from{" "}
                <span className="text-white font-semibold">Project Gutenberg</span>,{" "}
                <span className="text-white font-semibold">Internet Archive</span>,{" "}
                <span className="text-white font-semibold">Open Library</span>, and{" "}
                <span className="text-white font-semibold">Google Books</span>—formatted
                for a calm two-page <span className="text-white font-semibold">Book Spread</span>{" "}
                or clean <span className="text-white font-semibold">Classic Scroll</span>.
              </p>

              {/* Search Bar */}
              <form action="/ebooks" method="get" className="pt-1 max-w-xl">
                {activeSource !== "all" && (
                  <input type="hidden" name="source" value={activeSource} />
                )}
                <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/15 rounded-full p-1.5 focus-within:border-[#C84200] focus-within:bg-white/15 transition">
                  <Search className="w-4.5 h-4.5 text-white/60 ml-3 sm:ml-4 mr-2 shrink-0" />
                  <input
                    name="q"
                    defaultValue={activeQuery}
                    placeholder="Search book, author, or topic..."
                    className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder:text-white/50 focus:outline-none py-2 pr-2 sm:pr-3"
                  />
                  <button
                    type="submit"
                    className="px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold bg-[#C84200] hover:bg-[#A33500] text-white transition shrink-0 cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Quick Author & Title Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-white/55 mr-1">
                  Try:
                </span>
                {QUICK_SEARCHES.map((author) => (
                  <Link
                    key={author}
                    href={`/ebooks?q=${encodeURIComponent(author)}${
                      activeSource !== "all" ? `&source=${activeSource}` : ""
                    }`}
                    className="text-xs sm:text-[13px] font-medium px-3.5 py-1.5 rounded-full bg-white/8 hover:bg-white/16 border border-white/12 text-white/85 hover:text-white transition"
                  >
                    {author}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Featured Stack */}
            <div className="lg:col-span-5 hidden lg:flex justify-center">
              <HeroFeaturedStack books={CURATED_INDIAN_CLASSICS.slice(0, 3)} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        <LiveReadersStrip />

        {/* Source Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-3xl p-4 border border-[#1D1D1F]/[0.07] shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full lg:w-auto lg:flex-1 min-w-0 scrollbar-hide">
            {SOURCES.map((src) => {
              const isSelected = activeSource === src.id
              const href = `/ebooks?${new URLSearchParams({
                ...(activeQuery ? { q: activeQuery } : {}),
                ...(src.id !== "all" ? { source: src.id } : {}),
              }).toString()}`
              return (
                <Link
                  key={src.id}
                  href={href}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-[#1D1D1F] text-[#F2EBE1] shadow-sm"
                      : "bg-[#FAF6F0] text-[#1d1d1f] hover:bg-[#EFE7DC]"
                  }`}
                >
                  <span>{src.label}</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      isSelected ? "bg-white/15 text-[#F2EBE1]" : "bg-black/5 text-[#6e6e73]"
                    }`}
                  >
                    {src.badge}
                  </span>
                </Link>
              )
            })}
          </div>

          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#C84200] text-white hover:bg-[#A33500] transition shrink-0"
          >
            <Library className="w-4 h-4 text-amber-200" />
            Open My Shelf
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = activeQuery.toLowerCase() === cat.query.toLowerCase()
            const href = cat.query
              ? `/ebooks?q=${encodeURIComponent(cat.query)}${
                  activeSource !== "all" ? `&source=${activeSource}` : ""
                }`
              : `/ebooks${activeSource !== "all" ? `?source=${activeSource}` : ""}`
            return (
              <Link
                key={cat.label}
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  isActive
                    ? "bg-[#1d1d1f] text-[#F2EBE1] shadow-sm"
                    : "bg-white text-[#1d1d1f] hover:bg-[#FAF6F0] border border-[#1D1D1F]/[0.07]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Link>
            )
          })}
        </div>

        {/* Curated Indian Classics Shelf (shown when on default landing) */}
        {!activeQuery && activeSource === "all" && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-[#C84200]">
                  Curated Stack
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1d1d1f] mt-0.5">
                  Indian Classics Worth Keeping
                </h2>
              </div>
              <Link
                href="/ebooks?q=india"
                className="text-sm font-bold text-[#C84200] hover:underline"
              >
                Browse Indian Heritage →
              </Link>
            </div>
            <EbookGrid books={CURATED_INDIAN_CLASSICS.slice(0, 5)} />
          </section>
        )}

        {/* Search / Feed Results */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-[#6e6e73]">
                {activeQuery ? "Archive Results" : "Open Stacks"}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1d1d1f] mt-0.5">
                {activeQuery ? (
                  <>
                    Results for &ldquo;{activeQuery}&rdquo;{" "}
                    <span className="text-base font-medium text-[#6e6e73]">
                      ({books.length})
                    </span>
                  </>
                ) : (
                  "Most-Read Open Editions"
                )}
              </h2>
            </div>
            {(activeQuery || activeSource !== "all") && (
              <Link
                href="/ebooks"
                className="text-sm font-bold text-[#C84200] hover:underline"
              >
                Reset filters
              </Link>
            )}
          </div>

          {books.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#1D1D1F]/[0.07] shadow-sm max-w-xl mx-auto my-8">
              <BookOpen className="w-11 h-11 text-[#6e6e73] mx-auto mb-3" />
              <h3 className="text-xl font-black text-[#1d1d1f] mb-2">
                No editions matched &ldquo;{activeQuery}&rdquo;
              </h3>
              <p className="text-sm sm:text-base text-[#6e6e73] mb-6 leading-relaxed">
                Try switching the source filter to &ldquo;All Free Libraries&rdquo; or searching by
                author name.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/ebooks"
                  className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#C84200] text-white hover:bg-[#A33500] transition"
                >
                  Browse All Free Libraries
                </Link>
                <Link
                  href={`/catalog?q=${encodeURIComponent(activeQuery)}`}
                  className="px-5 py-2.5 rounded-full text-sm font-bold bg-[#FAF6F0] text-[#1d1d1f] hover:bg-[#EFE7DC] border border-black/8 transition"
                >
                  Search Physical Catalog
                </Link>
              </div>
            </div>
          ) : (
            <EbookGrid books={books} />
          )}
        </section>

        {/* Bottom Info Banner */}
        <section className="relative bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_55%)] text-white rounded-3xl p-8 sm:p-10 border border-white/10 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10 space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-[#FF8A4C]">
              <BookOpen className="w-4 h-4" /> Two-Page Spread · Shanti Audio
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Turn pages like a{" "}
              <span className="font-serif italic font-medium text-[#FF7F45]">
                quiet midnight library.
              </span>
            </h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Every edition supports <strong className="text-white">Book Read</strong>{" "}
              (a two-page hardcover spread with natural gutter depth),{" "}
              <strong className="text-white">Classic Scroll</strong>, and{" "}
              <strong className="text-white">Shanti Mode</strong> with rain and study-room soundscapes.
            </p>
          </div>
          <Link
            href="/library"
            className="relative z-10 px-6 py-3.5 rounded-full text-sm font-bold bg-[#C84200] hover:bg-[#A33500] text-white transition shrink-0 shadow-lg shadow-[#C84200]/20"
          >
            Open My Shelf →
          </Link>
        </section>
      </div>
    </div>
  )
}
