export type EBookSource = "gutenberg" | "archive" | "openlibrary" | "google" | "standard"

export type EBookSummary = {
  id: string | number
  title: string
  author: string
  source?: EBookSource
  sourceLabel?: string
  coverImage?: string
  iaId?: string
  externalReadUrl?: string
  year?: number
}

export type EBook = EBookSummary & {
  paragraphs: string[]
  embedUrl?: string
}

export const CURATED_GUTENBERG_MAP: Record<
  number,
  {
    title: string
    author: string
    olCoverId: number
    iaId: string
    summary: string
  }
> = {
  7164: {
    title: "Gitanjali",
    author: "Rabindranath Tagore",
    olCoverId: 8246100,
    iaId: "gitanjalisongoff00tagor",
    summary:
      "Nobel Prize-winning English prose-poetry collection of 103 spiritual song offerings exploring devotion, nature, humility, and inner peace.",
  },
  6686: {
    title: "Sadhana: The Realisation of Life",
    author: "Rabindranath Tagore",
    olCoverId: 242601,
    iaId: "sadhanaderwegzur00tago",
    summary:
      "Eight philosophical essays bridging Upanishadic wisdom and everyday living across soul consciousness, ethics, love, and action.",
  },
  2388: {
    title: "The Bhagavad-Gita (Sir Edwin Arnold)",
    author: "Vyasa / Edwin Arnold",
    olCoverId: 13827121,
    iaId: "bhagavadgitasong0000unse_d6a4",
    summary:
      "Classic eighteen-chapter philosophical dialogue on dharma, selfless action (Karma Yoga), devotion, and equanimity of mind.",
  },
  7235: {
    title: "Raja Yoga",
    author: "Swami Vivekananda",
    olCoverId: 5555814,
    iaId: "raajayogabeingle00viveuoft",
    summary:
      "Foundational exposition of meditative concentration, mental discipline, and Patanjali's eightfold path of Raja Yoga.",
  },
  16659: {
    title: "The Home and the World",
    author: "Rabindranath Tagore",
    olCoverId: 7999994,
    iaId: "hometheworld00tagouoft",
    summary:
      "Novel set in early twentieth-century Bengal examining personal conscience, domestic harmony, and political idealism through three voices.",
  },
  10371: {
    title: "The Gardener",
    author: "Rabindranath Tagore",
    olCoverId: 5828263,
    iaId: "gardenertranslat00tagouoft",
    summary:
      "Collection of eighty-five lyrical prose poems reflecting on youth, love, longing, and the seasons of rural Bengal.",
  },
  2520: {
    title: "Hind Swaraj or Indian Home Rule",
    author: "Mahatma Gandhi",
    olCoverId: 108086,
    iaId: "gandhisautobiogr02gand",
    summary:
      "Socratic dialogue between an Editor and a Reader defining true self-rule (Swaraj), moral courage, and nonviolent civic duty.",
  },
  579: {
    title: "The Golden Threshold",
    author: "Sarojini Naidu",
    olCoverId: 1755619,
    iaId: "goldenthreshold00naidiala",
    summary:
      "Celebrated anthology of Indian folk songs, street scenes, and lyrical nature poetry by the Nightingale of India.",
  },
  1629: {
    title: "Shakuntala",
    author: "Kalidasa",
    olCoverId: 10073647,
    iaId: "sakuntalaorfatal00kalirich",
    summary:
      "Classical Sanskrit drama in seven acts tracing the forest hermitage romance, separation, and reunion of Shakuntala and King Dushyanta.",
  },
  3282: {
    title: "The Crescent Moon",
    author: "Rabindranath Tagore",
    olCoverId: 526747,
    iaId: "crescentmoon00tago",
    summary:
      "Evocative prose poems celebrating childhood imagination, maternal affection, and wonder at the natural world.",
  },
  2680: {
    title: "Meditations",
    author: "Marcus Aurelius",
    olCoverId: 211529,
    iaId: "marcusaureliusan00marcrich",
    summary:
      "Twelve books of personal Stoic reflections on virtue, mindfulness, duty, and calm resilience amidst daily challenges.",
  },
  1342: {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    olCoverId: 14348537,
    iaId: "bwb_KS-179-237",
    summary:
      "Witty nineteenth-century novel of manners following Elizabeth Bennet and Fitzwilliam Darcy as they overcome pride and first impressions.",
  },
}

export function coverUrl(id: string | number, customCover?: string): string {
  if (customCover) return customCover
  const raw = String(id)
  if (/^\d+$/.test(raw)) {
    const known = CURATED_GUTENBERG_MAP[Number(raw)]
    if (known) {
      return `https://covers.openlibrary.org/b/id/${known.olCoverId}-L.jpg`
    }
    return `https://www.gutenberg.org/cache/epub/${raw}/pg${raw}.cover.medium.jpg`
  }
  if (raw.startsWith("pg-")) {
    const num = raw.slice(3)
    const known = CURATED_GUTENBERG_MAP[Number(num)]
    if (known) {
      return `https://covers.openlibrary.org/b/id/${known.olCoverId}-L.jpg`
    }
    return `https://www.gutenberg.org/cache/epub/${num}/pg${num}.cover.medium.jpg`
  }
  if (raw.startsWith("ia-")) {
    const ia = raw.slice(3)
    return `https://archive.org/services/img/${ia}`
  }
  return `https://covers.openlibrary.org/b/id/8246100-L.jpg`
}

async function fetchWithTimeout(url: string, timeoutMs = 6500, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      next: { revalidate: 3600 },
    })
  } finally {
    clearTimeout(timer)
  }
}

async function searchGutenbergOpds(query?: string): Promise<EBookSummary[]> {
  const url = query
    ? `https://www.gutenberg.org/ebooks/search.opds/?query=${encodeURIComponent(query)}`
    : `https://www.gutenberg.org/ebooks/search.opds/?sort_order=downloads`
  const res = await fetchWithTimeout(url, 5500)
  if (!res.ok) return []
  const xml = await res.text()
  const entryMatches = xml.match(/<entry[\s\S]*?<\/entry>/gi) || []
  const out: EBookSummary[] = []
  for (const entry of entryMatches) {
    const idMatch =
      entry.match(/\/ebooks\/(\d+)/) ||
      entry.match(/<id>[^<]*?(\d+)<\/id>/i)
    const id = idMatch ? Number(idMatch[1]) : undefined
    if (!id) continue
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const authorMatch = entry.match(/<author[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i)
    const title = (titleMatch?.[1] || "Untitled").replace(/&amp;/g, "&").replace(/&#\d+;/g, "").trim()
    const author = (authorMatch?.[1] || "Unknown Author").replace(/&amp;/g, "&").trim()
    out.push({
      id,
      title,
      author,
      source: "gutenberg",
      sourceLabel: "Project Gutenberg",
      coverImage: coverUrl(id),
    })
  }
  return out
}

async function searchGutendex(query?: string): Promise<EBookSummary[]> {
  const url = query
    ? `https://gutendex.com/books/?search=${encodeURIComponent(query)}`
    : `https://gutendex.com/books/?sort=popular`
  const res = await fetchWithTimeout(url, 5500)
  if (!res.ok) return []
  const data = await res.json()
  const results = Array.isArray(data?.results) ? data.results : []
  return results.slice(0, 16).map((b: any) => {
    const authorRaw = b.authors?.[0]?.name || "Unknown Author"
    const author = authorRaw.includes(",")
      ? authorRaw
          .split(",")
          .reverse()
          .map((s: string) => s.trim())
          .join(" ")
      : authorRaw
    return {
      id: Number(b.id),
      title: String(b.title || "Untitled").trim(),
      author,
      source: "gutenberg" as EBookSource,
      sourceLabel: "Project Gutenberg",
      coverImage: b.formats?.["image/jpeg"] || coverUrl(b.id),
    }
  })
}

async function searchOpenLibraryAndArchive(query?: string): Promise<EBookSummary[]> {
  const q = query?.trim() || "classic literature india philosophy"
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=18&fields=key,title,author_name,cover_i,ia,first_publish_year,has_fulltext,public_scan_b`
  const res = await fetchWithTimeout(url, 6500)
  if (!res.ok) return []
  const data = await res.json()
  const docs = Array.isArray(data?.docs) ? data.docs : []
  return docs
    .map((doc: any) => {
      const workKey = String(doc.key || "").replace("/works/", "")
      const iaList = Array.isArray(doc.ia) ? doc.ia : []
      const iaId = iaList[0] ? String(iaList[0]) : undefined
      if (!workKey && !iaId) return null

      const isPublicArchive = Boolean(iaId && doc.public_scan_b)
      const id = isPublicArchive ? `ia-${iaId}` : `ol-${workKey || iaId}`
      const source: EBookSource = iaId ? "archive" : "openlibrary"
      const sourceLabel = isPublicArchive
        ? "Internet Archive (Full Text)"
        : iaId
          ? "Open Library · Archive"
          : "Open Library"

      const coverImage = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : iaId
          ? `https://archive.org/services/img/${iaId}`
          : undefined

      return {
        id,
        title: String(doc.title || "Untitled").trim(),
        author: Array.isArray(doc.author_name) && doc.author_name[0] ? String(doc.author_name[0]) : "Unknown Author",
        source,
        sourceLabel,
        coverImage,
        iaId,
        year: typeof doc.first_publish_year === "number" ? doc.first_publish_year : undefined,
        externalReadUrl: iaId
          ? `https://archive.org/details/${iaId}/mode/2up`
          : `https://openlibrary.org/works/${workKey}`,
      } as EBookSummary
    })
    .filter(Boolean) as EBookSummary[]
}

async function searchGoogleBooks(query?: string): Promise<EBookSummary[]> {
  if (!query?.trim()) return []
  const q = encodeURIComponent(query.trim())
  const freeUrl = `https://www.googleapis.com/books/v1/volumes?q=${q}&filter=free-ebooks&maxResults=8`
  const allUrl = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=10`

  const [freeRes, allRes] = await Promise.allSettled([
    fetchWithTimeout(freeUrl, 5000),
    fetchWithTimeout(allUrl, 5000),
  ])

  const items: any[] = []
  if (freeRes.status === "fulfilled" && freeRes.value.ok) {
    const d = await freeRes.value.json()
    if (Array.isArray(d?.items)) items.push(...d.items)
  }
  if (allRes.status === "fulfilled" && allRes.value.ok) {
    const d = await allRes.value.json()
    if (Array.isArray(d?.items)) items.push(...d.items)
  }

  const seen = new Set<string>()
  const out: EBookSummary[] = []
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue
    seen.add(item.id)
    const info = item.volumeInfo || {}
    const access = item.accessInfo || {}
    const thumb =
      info.imageLinks?.thumbnail ||
      info.imageLinks?.smallThumbnail ||
      undefined
    const coverImage = thumb ? String(thumb).replace(/^http:/, "https:").replace("&edge=curl", "") : undefined
    const isFree =
      access.viewability === "ALL_PAGES" ||
      access.publicDomain === true ||
      access.epub?.isAvailable === true

    out.push({
      id: `gb-${item.id}`,
      title: String(info.title || "Untitled").trim(),
      author: Array.isArray(info.authors) && info.authors[0] ? String(info.authors[0]) : "Unknown Author",
      source: "google",
      sourceLabel: isFree ? "Google Books (Free Full)" : "Google Books Preview",
      coverImage,
      externalReadUrl: access.webReaderLink || info.previewLink,
    })
  }
  return out
}

export async function searchEbooks(
  query?: string,
  sourceFilter: "all" | EBookSource = "all"
): Promise<EBookSummary[]> {
  const tasks: Promise<EBookSummary[]>[] = []

  if (sourceFilter === "all" || sourceFilter === "gutenberg") {
    tasks.push(searchGutenbergOpds(query), searchGutendex(query))
  }
  if (sourceFilter === "all" || sourceFilter === "archive" || sourceFilter === "openlibrary") {
    tasks.push(searchOpenLibraryAndArchive(query))
  }
  if (sourceFilter === "all" || sourceFilter === "google") {
    tasks.push(searchGoogleBooks(query))
  }

  const settled = await Promise.allSettled(tasks)
  const combined: EBookSummary[] = []
  for (const res of settled) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      combined.push(...res.value)
    }
  }

  const filtered =
    sourceFilter === "all"
      ? combined
      : combined.filter((b) => b.source === sourceFilter)

  const seenKeys = new Set<string>()
  const deduped: EBookSummary[] = []
  for (const item of filtered) {
    const normKey = `${String(item.title).toLowerCase().replace(/[^a-z0-9]/g, "")}::${String(item.author)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}`
    const idKey = String(item.id)
    if (seenKeys.has(idKey) || (seenKeys.has(normKey) && String(item.id).startsWith("gb-"))) {
      continue
    }
    seenKeys.add(idKey)
    seenKeys.add(normKey)
    deduped.push(item)
  }

  if (
    deduped.length === 0 &&
    (sourceFilter === "all" || sourceFilter === "gutenberg")
  ) {
    const qLower = (query || "").trim().toLowerCase()
    const fallbacks = Object.entries(CURATED_GUTENBERG_MAP)
      .map(([numStr, item]) => ({
        id: Number(numStr),
        title: item.title,
        author: item.author,
        source: "gutenberg" as EBookSource,
        sourceLabel: "Project Gutenberg",
        coverImage: coverUrl(Number(numStr)),
      }))
      .filter(
        (b) =>
          !qLower ||
          b.title.toLowerCase().includes(qLower) ||
          b.author.toLowerCase().includes(qLower)
      )
    return fallbacks
  }

  return deduped.slice(0, 36)
}

function cleanGutenbergText(rawText: string): string[] {
  const startIdx = rawText.indexOf("*** START OF")
  const endIdx = rawText.indexOf("*** END OF")
  let body = rawText
  if (startIdx !== -1) {
    const afterBanner = rawText.indexOf("\n", startIdx)
    body = rawText.slice(afterBanner !== -1 ? afterBanner : startIdx)
  }
  if (endIdx !== -1) {
    body = body.slice(0, body.indexOf("*** END OF"))
  }
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0)
}

async function getGutenbergBook(numId: number): Promise<EBook | null> {
  const known = CURATED_GUTENBERG_MAP[numId]
  let title = known?.title || `Classic Book #${numId}`
  let author = known?.author || "Classic Author"
  let coverImage = coverUrl(numId)
  let customTxtUrl: string | undefined

  if (!known) {
    try {
      const metaRes = await fetchWithTimeout(`https://gutendex.com/books/${numId}/`, 2200)
      if (metaRes.ok) {
        const meta = await metaRes.json()
        if (meta?.title) title = String(meta.title)
        if (meta?.authors?.[0]?.name) {
          const raw = String(meta.authors[0].name)
          author = raw.includes(",")
            ? raw
                .split(",")
                .reverse()
                .map((s: string) => s.trim())
                .join(" ")
            : raw
        }
        if (meta?.formats?.["image/jpeg"]) {
          coverImage = meta.formats["image/jpeg"]
        }
        customTxtUrl =
          meta?.formats?.["text/plain; charset=utf-8"] ||
          meta?.formats?.["text/plain; charset=us-ascii"] ||
          meta?.formats?.["text/plain"]
      }
    } catch {}
  }

  const candidateUrls = (
    known
      ? [`https://www.gutenberg.org/cache/epub/${numId}/pg${numId}.txt`]
      : [
          customTxtUrl,
          `https://www.gutenberg.org/cache/epub/${numId}/pg${numId}.txt`,
          `https://www.gutenberg.org/files/${numId}/${numId}-0.txt`,
        ]
  ).filter(Boolean) as string[]

  for (const txtUrl of candidateUrls) {
    try {
      const res = await fetchWithTimeout(txtUrl, 1800)
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.length < 200 || text.trim().startsWith("<!DOCTYPE html")) continue

      const titleMatch = text.match(/Title:\s*(.+)/i)
      const authorMatch = text.match(/Author:\s*(.+)/i)
      if (title.startsWith("Classic Book #") && titleMatch?.[1]) title = titleMatch[1].trim()
      if (author === "Classic Author" && authorMatch?.[1]) author = authorMatch[1].trim()

      const paragraphs = cleanGutenbergText(text)
      if (paragraphs.length > 0) {
        return {
          id: numId,
          title,
          author,
          source: "gutenberg",
          sourceLabel: "Project Gutenberg",
          coverImage,
          iaId: known?.iaId,
          embedUrl: known?.iaId
            ? `https://archive.org/embed/${known.iaId}?ui=embed&view=theater`
            : undefined,
          paragraphs: paragraphs.slice(0, 1500),
          externalReadUrl: known?.iaId
            ? `https://archive.org/details/${known.iaId}/mode/2up`
            : `https://www.gutenberg.org/ebooks/${numId}`,
        }
      }
    } catch {}
  }

  // Resilient Fallback 1: Fetch full public-domain text & interactive 2-page scan from Internet Archive (archive.org)
  let resolvedIaId = known?.iaId
  if (!resolvedIaId && !title.startsWith("Classic Book #")) {
    try {
      const olRes = await fetchWithTimeout(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(`${title} ${author}`)}&limit=3&fields=title,author_name,cover_i,ia`,
        3500
      )
      if (olRes.ok) {
        const olData = await olRes.json()
        const doc = Array.isArray(olData?.docs)
          ? olData.docs.find((d: any) => Array.isArray(d?.ia) && d.ia.length > 0)
          : null
        if (doc) {
          resolvedIaId = String(doc.ia[0])
          if (doc.cover_i) {
            coverImage = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          }
        }
      }
    } catch {}
  }

  if (resolvedIaId) {
    const iaBook = await getInternetArchiveBook(resolvedIaId)
    if (iaBook && iaBook.paragraphs.length > 0) {
      return {
        ...iaBook,
        id: numId,
        title: known?.title || iaBook.title,
        author: known?.author || iaBook.author,
        source: "gutenberg",
        sourceLabel: "Project Gutenberg · Internet Archive Mirror",
        coverImage,
      }
    }
  }

  // Resilient Fallback 2: Ensure reader page ALWAYS renders 200 OK with study overview & interactive scan embed
  return {
    id: numId,
    title,
    author,
    source: "gutenberg",
    sourceLabel: "Project Gutenberg · Open Mirror",
    coverImage,
    iaId: resolvedIaId,
    embedUrl: resolvedIaId
      ? `https://archive.org/embed/${resolvedIaId}?ui=embed&view=theater`
      : undefined,
    externalReadUrl: resolvedIaId
      ? `https://archive.org/details/${resolvedIaId}/mode/2up`
      : `https://www.gutenberg.org/ebooks/${numId}`,
    paragraphs: [
      `${title} — by ${author}.`,
      known?.summary ||
        "Public-domain literary edition preserved in the AksharSetu Digital E-Library.",
      "Reading Note: The primary Project Gutenberg mirror is temporarily rate-limited or under maintenance, so AksharSetu has automatically connected you to the Internet Archive & Open Library preservation mirror.",
      "You can switch to the interactive 'Scanned Book Embed' view above to turn through the complete high-resolution scanned pages, log your Shanti Mode focus timer, or save passage notes to your reading notebook.",
    ],
  }
}

async function getInternetArchiveBook(iaId: string): Promise<EBook | null> {
  try {
    const metaRes = await fetchWithTimeout(`https://archive.org/metadata/${encodeURIComponent(iaId)}`, 6500)
    if (!metaRes.ok) return null
    const data = await metaRes.json()
    const meta = data?.metadata || {}
    const files: any[] = Array.isArray(data?.files) ? data.files : []

    const title = Array.isArray(meta.title) ? meta.title[0] : meta.title || iaId
    const author = Array.isArray(meta.creator) ? meta.creator[0] : meta.creator || "Internet Archive Author"
    const coverImage = `https://archive.org/services/img/${iaId}`
    const embedUrl = `https://archive.org/embed/${iaId}?ui=embed&view=theater`
    const externalReadUrl = `https://archive.org/details/${iaId}/mode/2up`

    const txtFile = files.find(
      (f) =>
        typeof f?.name === "string" &&
        (f.name.endsWith("_djvu.txt") ||
          (f.name.endsWith(".txt") && !f.name.endsWith("_files.xml") && !f.name.includes("meta")))
    )

    let paragraphs: string[] = []
    if (txtFile?.name) {
      try {
        const txtUrl = `https://archive.org/download/${encodeURIComponent(iaId)}/${encodeURIComponent(txtFile.name)}`
        const txtRes = await fetchWithTimeout(txtUrl, 7500)
        if (txtRes.ok) {
          const raw = await txtRes.text()
          if (raw && !raw.trim().startsWith("<")) {
            paragraphs = raw
              .replace(/\r\n/g, "\n")
              .split(/\n\s*\n/)
              .map((p) => p.replace(/\s+/g, " ").trim())
              .filter((p) => p.length > 25)
              .slice(0, 1200)
          }
        }
      } catch {}
    }

    if (paragraphs.length === 0) {
      const desc = Array.isArray(meta.description) ? meta.description.join("\n\n") : String(meta.description || "")
      const cleanDesc = desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      paragraphs = [
        `${title} — by ${author}.`,
        cleanDesc ||
          "This edition is hosted on the Internet Archive & Open Library digital preservation network.",
        "Switch to the 'Scanned Book Embed' view above or open the full interactive Internet Archive 2-page scan to read every page of this volume.",
      ]
    }

    return {
      id: `ia-${iaId}`,
      title: String(title),
      author: String(author),
      source: "archive",
      sourceLabel: "Internet Archive",
      coverImage,
      iaId,
      embedUrl,
      externalReadUrl,
      paragraphs,
    }
  } catch {
    return null
  }
}

async function getOpenLibraryBook(workId: string): Promise<EBook | null> {
  try {
    const cleanWorkId = workId.replace(/^\/?works\//, "")
    const [workRes, edRes] = await Promise.allSettled([
      fetchWithTimeout(`https://openlibrary.org/works/${cleanWorkId}.json`, 6000),
      fetchWithTimeout(`https://openlibrary.org/works/${cleanWorkId}/editions.json?limit=15`, 6000),
    ])

    let title = cleanWorkId
    let author = "Open Library Author"
    let coverImage: string | undefined
    let iaId: string | undefined
    const paragraphs: string[] = []

    if (workRes.status === "fulfilled" && workRes.value.ok) {
      const work = await workRes.value.json()
      if (work?.title) title = String(work.title)
      if (Array.isArray(work?.covers) && work.covers[0]) {
        coverImage = `https://covers.openlibrary.org/b/id/${work.covers[0]}-L.jpg`
      }

      const authorKey = work?.authors?.[0]?.author?.key
      if (authorKey) {
        try {
          const aRes = await fetchWithTimeout(`https://openlibrary.org${authorKey}.json`, 4000)
          if (aRes.ok) {
            const aData = await aRes.json()
            if (aData?.name) author = String(aData.name)
          }
        } catch {}
      }

      // Match Gutenberg first if this classic exists on Project Gutenberg
      try {
        const gMatches = await searchGutendex(`${title} ${author !== "Open Library Author" ? author : ""}`)
        const exact = gMatches.find(
          (g) => g.title.toLowerCase().includes(title.toLowerCase().slice(0, 14))
        )
        if (exact && typeof exact.id === "number") {
          const fullGutenberg = await getGutenbergBook(exact.id)
          if (fullGutenberg && fullGutenberg.paragraphs.length > 5) {
            return {
              ...fullGutenberg,
              id: `ol-${cleanWorkId}`,
              coverImage: coverImage || fullGutenberg.coverImage,
            }
          }
        }
      } catch {}

      const desc =
        typeof work?.description === "string"
          ? work.description
          : work?.description?.value || ""
      if (desc) {
        for (const chunk of String(desc).split(/\n\s*\n/)) {
          const c = chunk.trim()
          if (c) paragraphs.push(c)
        }
      }

      if (work?.first_sentence) {
        const fs =
          typeof work.first_sentence === "string"
            ? work.first_sentence
            : work.first_sentence?.value
        if (fs) paragraphs.push(`Opening line: "${fs}"`)
      }

      if (Array.isArray(work?.excerpts)) {
        for (const ex of work.excerpts) {
          const txt = typeof ex?.excerpt === "string" ? ex.excerpt : ex?.excerpt?.value
          if (txt) paragraphs.push(String(txt).trim())
        }
      }

      if (Array.isArray(work?.subjects) && work.subjects.length > 0) {
        paragraphs.push(`Key Themes & Subjects: ${work.subjects.slice(0, 12).join(" · ")}`)
      }
    }

    if (edRes.status === "fulfilled" && edRes.value.ok) {
      const edData = await edRes.value.json()
      const entries: any[] = Array.isArray(edData?.entries) ? edData.entries : []
      for (const ed of entries) {
        if (!iaId && ed?.ocaid) iaId = String(ed.ocaid)
        if (!coverImage && Array.isArray(ed?.covers) && ed.covers[0]) {
          coverImage = `https://covers.openlibrary.org/b/id/${ed.covers[0]}-L.jpg`
        }
        if (ed?.first_sentence) {
          const fs =
            typeof ed.first_sentence === "string"
              ? ed.first_sentence
              : ed.first_sentence?.value
          if (fs && !paragraphs.some((p) => p.includes(fs))) {
            paragraphs.push(`"${fs}"`)
          }
        }
        if (ed?.notes) {
          const note = typeof ed.notes === "string" ? ed.notes : ed.notes?.value
          if (note && note.length > 30) paragraphs.push(String(note).trim())
        }
      }
    }

    if (iaId) {
      const iaBook = await getInternetArchiveBook(iaId)
      if (iaBook && iaBook.paragraphs.length > 3) {
        return {
          ...iaBook,
          id: `ol-${cleanWorkId}`,
          title: title || iaBook.title,
          author: author !== "Open Library Author" ? author : iaBook.author,
          coverImage: coverImage || iaBook.coverImage,
        }
      }
    }

    if (paragraphs.length === 0) {
      paragraphs.push(
        `${title} by ${author}.`,
        `This edition is cataloged in the Open Library global catalog. Use the external Open Library / Internet Archive reader link to check lending availability or full scan access.`
      )
    }

    return {
      id: `ol-${cleanWorkId}`,
      title,
      author,
      source: "openlibrary",
      sourceLabel: "Open Library",
      coverImage,
      iaId,
      embedUrl: iaId ? `https://archive.org/embed/${iaId}?ui=embed` : undefined,
      externalReadUrl: iaId
        ? `https://archive.org/details/${iaId}/mode/2up`
        : `https://openlibrary.org/works/${cleanWorkId}`,
      paragraphs,
    }
  } catch {
    return null
  }
}

async function getGoogleBook(volumeId: string): Promise<EBook | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(volumeId)}`,
      6000
    )
    if (!res.ok) return null
    const item = await res.json()
    const info = item?.volumeInfo || {}
    const access = item?.accessInfo || {}
    const title = String(info.title || "Untitled")
    const subtitle = info.subtitle ? ` — ${info.subtitle}` : ""
    const author =
      Array.isArray(info.authors) && info.authors[0] ? String(info.authors.join(", ")) : "Unknown Author"
    const thumb =
      info.imageLinks?.extraLarge ||
      info.imageLinks?.large ||
      info.imageLinks?.medium ||
      info.imageLinks?.thumbnail
    const coverImage = thumb ? String(thumb).replace(/^http:/, "https:").replace("&edge=curl", "") : undefined

    const paragraphs: string[] = []
    paragraphs.push(`${title}${subtitle} — by ${author}.`)

    if (info.description) {
      const clean = String(info.description)
        .replace(/<br\s*\/?>/gi, "\n\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .trim()
      for (const p of clean.split(/\n\s*\n/)) {
        if (p.trim()) paragraphs.push(p.trim())
      }
    }

    if (info.publisher || info.publishedDate || info.pageCount) {
      paragraphs.push(
        `Publication Details: ${[
          info.publisher ? `Published by ${info.publisher}` : null,
          info.publishedDate ? `Date: ${info.publishedDate}` : null,
          info.pageCount ? `${info.pageCount} pages` : null,
        ]
          .filter(Boolean)
          .join(" · ")}.`
      )
    }

    if (Array.isArray(info.categories) && info.categories.length > 0) {
      paragraphs.push(`Categories: ${info.categories.join(" · ")}.`)
    }

    // Check if Project Gutenberg has full public domain text for this title
    try {
      const gMatches = await searchGutendex(`${info.title || ""} ${info.authors?.[0] || ""}`)
      const exact = gMatches.find(
        (g) => g.title.toLowerCase() === title.toLowerCase()
      )
      if (exact && typeof exact.id === "number") {
        const gBook = await getGutenbergBook(exact.id)
        if (gBook && gBook.paragraphs.length > 5) {
          return {
            ...gBook,
            id: `gb-${volumeId}`,
            coverImage: coverImage || gBook.coverImage,
          }
        }
      }
    } catch {}

    return {
      id: `gb-${volumeId}`,
      title,
      author,
      source: "google",
      sourceLabel: "Google Books",
      coverImage,
      embedUrl: `https://books.google.com/books?id=${encodeURIComponent(volumeId)}&printsec=frontcover&output=embed`,
      externalReadUrl: access.webReaderLink || info.previewLink || `https://books.google.com/books?id=${volumeId}`,
      paragraphs,
    }
  } catch {
    return null
  }
}

export async function getEbook(rawId: string | number): Promise<EBook | null> {
  const str = decodeURIComponent(String(rawId)).trim()
  if (/^\d+$/.test(str)) {
    return getGutenbergBook(Number(str))
  }
  if (str.startsWith("pg-")) {
    const num = Number(str.slice(3))
    return Number.isNaN(num) ? null : getGutenbergBook(num)
  }
  if (str.startsWith("ia-")) {
    return getInternetArchiveBook(str.slice(3))
  }
  if (str.startsWith("ol-")) {
    return getOpenLibraryBook(str.slice(3))
  }
  if (str.startsWith("gb-")) {
    return getGoogleBook(str.slice(3))
  }
  const maybeNum = Number(str)
  if (!Number.isNaN(maybeNum)) {
    return getGutenbergBook(maybeNum)
  }
  return null
}
