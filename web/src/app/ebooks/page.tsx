import Link from "next/link"
import { EBookSource, EBookSummary, searchEbooks, coverUrl } from "@/lib/gutenberg"
import EbookGrid from "@/components/ebooks/EbookGrid"
import {
  BookOpen,
  Search,
  Sparkles,
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
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      {/* High-Contrast Hero Banner */}
      <section className="relative bg-black text-[#f5f5f7] overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(0, 102, 204, 0.35), transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 149, 0, 0.2), transparent 55%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 py-14 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold tracking-wide text-blue-300">
                <Globe className="w-3.5 h-3.5" />
                Unified Open E-Library · Gutenberg + Internet Archive + Open Library + Google Books
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-none">
                Every Free Library.{" "}
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200 bg-clip-text text-transparent">
                  Read Like a Real Book.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#86868b] max-w-2xl leading-relaxed">
                Search millions of legal public-domain and open-access books across{" "}
                <span className="text-white font-medium">Project Gutenberg</span>,{" "}
                <span className="text-white font-medium">Internet Archive</span>,{" "}
                <span className="text-white font-medium">Open Library</span>, and{" "}
                <span className="text-white font-medium">Google Books</span>. Switch effortlessly
                between <span className="text-white font-medium">Book Read</span> (realistic 2-page spread)
                and <span className="text-white font-medium">Classic Read</span>.
              </p>

              {/* Search Bar */}
              <form action="/ebooks" method="get" className="pt-1 max-w-xl">
                {activeSource !== "all" && (
                  <input type="hidden" name="source" value={activeSource} />
                )}
                <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/15 rounded-full p-1.5 focus-within:border-[#0066cc] focus-within:bg-white/15 transition">
                  <Search className="w-4 h-4 text-[#86868b] ml-4 mr-2 shrink-0" />
                  <input
                    name="q"
                    defaultValue={activeQuery}
                    placeholder="Search any book, author, or topic (e.g. Atomic Habits, Tagore, Gita)..."
                    className="w-full bg-transparent text-sm text-white placeholder:text-[#86868b] focus:outline-none py-2 pr-3"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0066cc] hover:bg-[#0071e3] text-white transition shrink-0"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Quick Author & Title Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] uppercase tracking-wider text-[#86868b] mr-1">
                  Try:
                </span>
                {QUICK_SEARCHES.map((author) => (
                  <Link
                    key={author}
                    href={`/ebooks?q=${encodeURIComponent(author)}${
                      activeSource !== "all" ? `&source=${activeSource}` : ""
                    }`}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition"
                  >
                    {author}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Featured Stack */}
            <div className="lg:col-span-5 hidden lg:flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="grid grid-cols-3 gap-3">
                  {CURATED_INDIAN_CLASSICS.slice(0, 3).map((b, idx) => (
                    <Link
                      key={b.id}
                      href={`/ebooks/${b.id}?view=book`}
                      className={`group relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                        idx === 1 ? "-mt-4 mb-4" : ""
                      }`}
                    >
                      <div className="aspect-[2/3] bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverUrl(b.id)}
                          alt={b.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-2.5 bg-zinc-900/95 backdrop-blur-md">
                        <p className="text-[11px] font-bold text-white truncate">{b.title}</p>
                        <p className="text-[10px] text-[#86868b] truncate">{b.author}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-10">
        {/* Source Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-black/5 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-[#0066cc] text-white shadow-sm"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  <span>{src.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-black/5 text-[#86868b]"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#1d1d1f] text-white hover:bg-[#0066cc] transition shrink-0"
          >
            <Library className="w-3.5 h-3.5 text-amber-400" />
            My Reading Room
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-[#1d1d1f] text-white shadow-sm"
                    : "bg-white text-[#1d1d1f] hover:bg-[#e8e8ed] border border-black/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </Link>
            )
          })}
        </div>

        {/* Curated Indian Classics Shelf (shown when on default landing) */}
        {!activeQuery && activeSource === "all" && (
          <section className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#0066cc]">
                  Featured Shelf
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                  Timeless Indian Classics
                </h2>
              </div>
              <Link
                href="/ebooks?q=india"
                className="text-xs font-semibold text-[#0066cc] hover:underline"
              >
                Explore all Indian Heritage →
              </Link>
            </div>
            <EbookGrid books={CURATED_INDIAN_CLASSICS.slice(0, 5)} />
          </section>
        )}

        {/* Search / Feed Results */}
        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#86868b]">
                {activeQuery ? "Multi-Library Search Results" : "Global Open Catalog"}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                {activeQuery ? (
                  <>
                    Results for &ldquo;{activeQuery}&rdquo;{" "}
                    <span className="text-base font-normal text-[#86868b]">
                      ({books.length})
                    </span>
                  </>
                ) : (
                  "Trending Free E-Books Across All Libraries"
                )}
              </h2>
            </div>
            {(activeQuery || activeSource !== "all") && (
              <Link
                href="/ebooks"
                className="text-xs font-semibold text-[#0066cc] hover:underline"
              >
                Reset filters
              </Link>
            )}
          </div>

          {books.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-black/5 shadow-sm max-w-xl mx-auto my-8">
              <BookOpen className="w-10 h-10 text-[#86868b] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#1d1d1f] mb-1">
                No editions matched &ldquo;{activeQuery}&rdquo;
              </h3>
              <p className="text-sm text-[#86868b] mb-6">
                Try switching the source filter to &ldquo;All Free Libraries&rdquo; or searching by
                author name.
              </p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/ebooks"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0066cc] text-white hover:bg-[#0071e3] transition"
                >
                  Browse All Free Libraries
                </Link>
                <Link
                  href={`/books?q=${encodeURIComponent(activeQuery)}`}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#e8e8ed] text-[#1d1d1f] hover:bg-[#d2d2d7] transition"
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
        <section className="bg-black text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="w-4 h-4" /> Book Read Mode + Shanti Focus
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Read like a real two-page hardcover book.
            </h3>
            <p className="text-sm text-[#86868b] leading-relaxed">
              Every book in our E-Library features <strong className="text-white">Book Read</strong>{" "}
              (a realistic two-page open spread with spine depth and page turns),{" "}
              <strong className="text-white">Classic Read</strong> (clean continuous view), and{" "}
              <strong className="text-white">Shanti Mode</strong> with ambient soundscapes.
            </p>
          </div>
          <Link
            href="/library"
            className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0066cc] hover:bg-[#0071e3] text-white transition shrink-0"
          >
            Go to My Reading Room →
          </Link>
        </section>
      </div>
    </div>
  )
}
