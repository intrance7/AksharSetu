import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { checkAndAwardBadges } from "@/services/badgeService"

async function enrichBookMetadata(params: {
  isbn?: string | null
  title?: string | null
  author?: string | null
  coverImage?: string | null
  totalPages?: number | null
}) {
  const cleanIsbn = (params.isbn || "").replace(/[^0-9Xx]/g, "").trim()
  let resolvedTitle = (params.title || "").trim()
  let resolvedAuthor = (params.author || "").trim()
  let resolvedCover = (params.coverImage || "").trim() || null
  let resolvedPages = Number(params.totalPages) || 0

  // 1. Search Google Books by ISBN or Title + Author
  const searchQuery = cleanIsbn
    ? `isbn:${cleanIsbn}`
    : [
        resolvedTitle ? `intitle:${resolvedTitle}` : "",
        resolvedAuthor ? `inauthor:${resolvedAuthor}` : "",
      ]
        .filter(Boolean)
        .join("+")

  if (searchQuery) {
    try {
      const gbRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchQuery
        )}&maxResults=3`,
        { signal: AbortSignal.timeout(4500) }
      )
      if (gbRes.ok) {
        const gbData = await gbRes.json()
        const item = gbData.items?.[0]?.volumeInfo
        if (item) {
          if (!resolvedTitle && item.title) resolvedTitle = item.title
          if (!resolvedAuthor && Array.isArray(item.authors)) {
            resolvedAuthor = item.authors.join(", ")
          }
          if (!resolvedPages && item.pageCount && item.pageCount >= 10) {
            resolvedPages = Number(item.pageCount)
          }
          if (!resolvedCover && item.imageLinks) {
            const rawImg =
              item.imageLinks.extraLarge ||
              item.imageLinks.large ||
              item.imageLinks.medium ||
              item.imageLinks.thumbnail ||
              item.imageLinks.smallThumbnail ||
              ""
            if (rawImg) {
              resolvedCover = rawImg
                .replace("http://", "https://")
                .replace("&edge=curl", "")
            }
          }
        }
      }
    } catch {}
  }

  // 2. Fallback / Supplement with Open Library Search (Cover + Page Count)
  if (!resolvedCover || !resolvedPages || !resolvedTitle || !resolvedAuthor) {
    try {
      const olUrl = cleanIsbn
        ? `https://openlibrary.org/search.json?isbn=${encodeURIComponent(
            cleanIsbn
          )}&limit=1`
        : `https://openlibrary.org/search.json?title=${encodeURIComponent(
            resolvedTitle
          )}${
            resolvedAuthor
              ? `&author=${encodeURIComponent(resolvedAuthor)}`
              : ""
          }&limit=1`

      const olRes = await fetch(olUrl, { signal: AbortSignal.timeout(4500) })
      if (olRes.ok) {
        const olData = await olRes.json()
        const doc = olData.docs?.[0]
        if (doc) {
          if (!resolvedTitle && doc.title) resolvedTitle = doc.title
          if (!resolvedAuthor && Array.isArray(doc.author_name)) {
            resolvedAuthor = doc.author_name.join(", ")
          }
          if (!resolvedPages && doc.number_of_pages_median) {
            resolvedPages = Number(doc.number_of_pages_median)
          }
          if (!resolvedCover) {
            if (doc.cover_i) {
              resolvedCover = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            } else if (cleanIsbn) {
              resolvedCover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
            }
          }
        }
      }
    } catch {}
  }

  // 3. AI Metadata Resolution via Gemini if title/author/pages are still missing
  if (
    (!resolvedTitle || !resolvedAuthor || !resolvedPages) &&
    process.env.GEMINI_API_KEY
  ) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const prompt = `Return a strict JSON object with keys {"title": string, "author": string, "totalPages": number} for the book matching ISBN="${cleanIsbn}", Title="${resolvedTitle}", Author="${resolvedAuthor}". Output ONLY valid JSON.`
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (!resolvedTitle && parsed.title) resolvedTitle = String(parsed.title)
        if (!resolvedAuthor && parsed.author) {
          resolvedAuthor = String(parsed.author)
        }
        if (!resolvedPages && Number(parsed.totalPages) >= 20) {
          resolvedPages = Number(parsed.totalPages)
        }
      }
    } catch {}
  }

  // Final fallback cover by ISBN if cleanIsbn exists
  if (!resolvedCover && cleanIsbn.length >= 10) {
    resolvedCover = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
  }

  return {
    title: resolvedTitle || "Untitled Book",
    author: resolvedAuthor || "Unknown Author",
    coverImage: resolvedCover,
    totalPages: Math.max(10, resolvedPages || 250),
    cleanIsbn: cleanIsbn || null,
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const books = await prisma.libraryBook.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(books)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      isbn,
      title,
      author,
      coverImage,
      platformBookId,
      gutenbergId,
      totalPages,
      status,
    } = body

    if (!title?.trim() && !isbn?.trim()) {
      return NextResponse.json(
        { error: "Please provide a Book Title or ISBN" },
        { status: 400 }
      )
    }

    const numericGutenberg =
      gutenbergId !== undefined &&
      gutenbergId !== null &&
      /^\d+$/.test(String(gutenbergId))
        ? Number(gutenbergId)
        : null

    const enriched = await enrichBookMetadata({
      isbn,
      title,
      author,
      coverImage,
      totalPages,
    })

    const resolvedPlatformId =
      platformBookId ||
      (!numericGutenberg && gutenbergId
        ? String(gutenbergId)
        : enriched.cleanIsbn
        ? `isbn-${enriched.cleanIsbn}`
        : null)

    if (numericGutenberg) {
      const existing = await prisma.libraryBook.findFirst({
        where: { userId: session.user.id, gutenbergId: numericGutenberg },
      })
      if (existing) return NextResponse.json(existing)
    } else if (resolvedPlatformId) {
      const existing = await prisma.libraryBook.findFirst({
        where: { userId: session.user.id, platformBookId: resolvedPlatformId },
      })
      if (existing) return NextResponse.json(existing)
    }

    const newBook = await prisma.libraryBook.create({
      data: {
        title: enriched.title,
        author: enriched.author,
        coverImage: enriched.coverImage,
        platformBookId: resolvedPlatformId,
        gutenbergId: numericGutenberg,
        totalPages: enriched.totalPages,
        status: ["WANT_TO_READ", "READING", "READ"].includes(status)
          ? status
          : "WANT_TO_READ",
        userId: session.user.id,
      },
    })

    checkAndAwardBadges(session.user.id).catch(() => {})

    return NextResponse.json(newBook, { status: 201 })
  } catch (error) {
    console.error("Failed to add book to library:", error)
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 })
  }
}
