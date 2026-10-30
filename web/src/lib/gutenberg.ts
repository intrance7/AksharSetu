// Project Gutenberg: public-domain books. Search uses the official OPDS feed
// (Gutendex is unreliable); text and covers come straight from gutenberg.org.
const BASE = "https://www.gutenberg.org"

export type EBookSummary = { id: number; title: string; author: string }
export type EBook = EBookSummary & { paragraphs: string[] }

export const coverUrl = (id: number) => `${BASE}/cache/epub/${id}/pg${id}.cover.medium.jpg`

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim()

export async function searchEbooks(query?: string): Promise<EBookSummary[]> {
  const url = query
    ? `${BASE}/ebooks/search.opds/?query=${encodeURIComponent(query)}`
    : `${BASE}/ebooks/search.opds/?sort_order=downloads`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const xml = await res.text()
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([, entry]) => {
      const id = entry.match(/\/ebooks\/(\d+)\.opds/)?.[1]
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      if (!id || !title) return []
      const author = entry.match(/<content type="text">([\s\S]*?)<\/content>/)?.[1] ?? "Unknown"
      return [{ id: Number(id), title: decode(title), author: decode(author) }]
    })
  } catch {
    return []
  }
}

export async function getEbook(id: number): Promise<EBook | null> {
  try {
    const res = await fetch(`${BASE}/cache/epub/${id}/pg${id}.txt`, { next: { revalidate: 604800 } })
    if (!res.ok) return null
    const raw = (await res.text()).replace(/\r/g, "")
    const meta = (key: string) => raw.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim()
    // Strip the Gutenberg licence header/footer
    const body = raw.split(/\*{3}\s*START OF.*?\*{3}/i)[1]?.split(/\*{3}\s*END OF/i)[0] ?? raw
    const paragraphs = body
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean)
    return { id, title: meta("Title") ?? "Untitled", author: meta("Author") ?? "Unknown", paragraphs }
  } catch {
    return null
  }
}
