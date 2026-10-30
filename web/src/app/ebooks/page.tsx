import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { searchEbooks } from "@/lib/gutenberg"
import { EbookGrid } from "@/components/ebooks/EbookGrid"

export const metadata: Metadata = {
  title: "E-Library · Read Free Classics Online | AksharSetu",
  description: "Read 70,000+ public-domain classics online, free. Tagore, Austen, Doyle and more, with a distraction-free reader and Shanti Mode focus sessions.",
}

const QUICK = ["Tagore", "Sarojini Naidu", "Kalidasa", "Gandhi", "Jane Austen", "Sherlock Holmes", "Tolstoy", "Poetry"]

export default async function EbooksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q?.trim()
  const books = await searchEbooks(query)

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      {/* Hero */}
      <section className="bg-[#000000] text-[#f5f5f7] pt-24 pb-20 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[#86868b] text-sm font-semibold tracking-wide mb-4">E-Library</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
            Read free.<br />Read forever.
          </h1>
          <p className="text-[#86868b] text-lg md:text-xl max-w-xl mx-auto mb-10">
            70,000+ public-domain classics, right here. No downloads, no sign-up to start reading.
          </p>

          <form action="/ebooks" className="relative max-w-xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input
              id="ebook-search"
              name="q"
              defaultValue={query}
              placeholder="Search by title or author"
              className="w-full h-14 rounded-full bg-white/10 border border-white/10 focus:border-[#0066cc] focus:bg-white/15 pl-14 pr-32 text-[#f5f5f7] placeholder:text-[#86868b] outline-none transition-colors"
            />
            <button id="ebook-search-submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-semibold transition-colors">
              Search
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {QUICK.map((term) => (
              <Link
                key={term}
                href={`/ebooks?q=${encodeURIComponent(term)}`}
                className="rounded-full px-4 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/15 text-[#f5f5f7]/80 transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-[#1d1d1f]">
            {query ? `Results for “${query}”` : "Most read this month"}
          </h2>
          {query && (
            <Link href="/ebooks" className="text-sm font-medium text-[#0066cc] hover:text-[#0071e3]">
              Clear search
            </Link>
          )}
        </div>

        {books.length ? (
          <EbookGrid books={books} />
        ) : (
          <div className="rounded-2xl bg-white shadow-sm p-16 text-center">
            <p className="text-xl font-semibold text-[#1d1d1f] mb-2">No books found</p>
            <p className="text-[#86868b]">Only public-domain titles are available. Try an author like “Tagore” or “Dickens”.</p>
          </div>
        )}

        <p className="text-xs text-[#86868b] text-center mt-16">
          Books courtesy of <a href="https://www.gutenberg.org" target="_blank" rel="noreferrer" className="underline">Project Gutenberg</a>, free of copyright in the USA.
        </p>
      </section>
    </main>
  )
}
