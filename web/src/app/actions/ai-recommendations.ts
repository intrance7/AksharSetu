"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

export type AIRecommendation = {
  title: string
  author: string
  reason: string
  availableBookId?: string | null
}

const CURATED_CLASSICS: AIRecommendation[] = [
  {
    title: "Gitanjali",
    author: "Rabindranath Tagore",
    reason: "Nobel Prize-winning lyrical reflections—available free in our E-Library.",
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    reason: "The foundational computer science reference sought across engineering semesters.",
  },
  {
    title: "Malgudi Days",
    author: "R.K. Narayan",
    reason: "Timeless Indian short stories capturing warmth, humor, and everyday humanity.",
  },
  {
    title: "The Discovery of India",
    author: "Jawaharlal Nehru",
    reason: "A sweeping philosophical and historical journey through Indian civilization.",
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    reason: "Enduring Stoic wisdom ideal for mindful Shanti Mode reading sessions.",
  },
]

async function buildAlgorithmicRecommendations(
  userId: string,
  preferredCategories: string[],
  knownTitles: Set<string>
): Promise<AIRecommendation[]> {
  const candidates = await prisma.book.findMany({
    where: {
      status: "AVAILABLE",
      ownerId: { not: userId },
    },
    orderBy: [{ owner: { sellerRating: "desc" } }, { createdAt: "desc" }],
    take: 25,
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      price: true,
      acceptsExchange: true,
    },
  })

  const scored = candidates
    .filter((b) => !knownTitles.has(b.title.toLowerCase()))
    .map((b) => {
      const catMatch = preferredCategories.some(
        (c) => c.toLowerCase() === b.category.toLowerCase()
      )
      return {
        book: b,
        score: (catMatch ? 10 : 0) + (b.price === 0 ? 3 : 0) + (b.acceptsExchange ? 2 : 0),
        catMatch,
      }
    })
    .sort((a, b) => b.score - a.score)

  const results: AIRecommendation[] = []
  const seen = new Set<string>()

  for (const item of scored) {
    const key = item.book.title.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    results.push({
      title: item.book.title,
      author: item.book.author,
      reason: item.catMatch
        ? `Matches your interest in ${item.book.category} and is available right now in the marketplace.`
        : item.book.price === 0
        ? `Available as a free community donation from a verified reader.`
        : `Top-rated listing currently available in the AksharSetu catalog.`,
      availableBookId: item.book.id,
    })
    if (results.length >= 5) break
  }

  for (const fallback of CURATED_CLASSICS) {
    if (results.length >= 5) break
    if (
      !seen.has(fallback.title.toLowerCase()) &&
      !knownTitles.has(fallback.title.toLowerCase())
    ) {
      results.push(fallback)
    }
  }

  return results
}

export async function getAIRecommendations(): Promise<AIRecommendation[]> {
  const session = await auth()
  const userId = session?.user?.id || "guest"

  const [wishlists, libraryBooks, pastOrders] =
    userId !== "guest"
      ? await Promise.all([
          prisma.wishlist.findMany({
            where: { userId },
            select: { title: true },
          }),
          prisma.libraryBook.findMany({
            where: { userId },
            select: { title: true, author: true },
          }),
          prisma.order.findMany({
            where: { buyerId: userId },
            include: {
              book: { select: { title: true, author: true, category: true } },
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          }),
        ])
      : [[], [], []]

  const knownTitles = new Set<string>([
    ...wishlists.map((w) => (w.title || "").toLowerCase()).filter(Boolean),
    ...libraryBooks.map((b) => b.title.toLowerCase()),
    ...pastOrders.map((o) => o.book.title.toLowerCase()),
  ])

  const preferredCategories = Array.from(
    new Set(pastOrders.map((o) => o.book.category).filter(Boolean))
  )

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return buildAlgorithmicRecommendations(userId, preferredCategories, knownTitles)
  }

  const contextData = {
    wishlists: wishlists.map((w) => w.title).filter(Boolean),
    library: libraryBooks.map((b) => `${b.title} by ${b.author}`),
    recentPurchases: pastOrders.map(
      (o) => `${o.book.title} by ${o.book.author} (${o.book.category})`
    ),
  }

  const hasContext =
    contextData.wishlists.length > 0 ||
    contextData.library.length > 0 ||
    contextData.recentPurchases.length > 0

  const prompt = hasContext
    ? `Based on this reader's history, recommend 5 books they have not read yet:
Wishlisted: ${contextData.wishlists.join(", ")}
In Library: ${contextData.library.join(", ")}
Recently Purchased: ${contextData.recentPurchases.join(", ")}

Respond STRICTLY with a JSON array of 5 objects with keys: title, author, reason (max 1 sentence).`
    : `Recommend 5 acclaimed books across Indian Literature, Computer Science/Academic, Philosophy, and Fiction.
Respond STRICTLY with a JSON array of 5 objects with keys: title, author, reason (max 1 sentence).`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(prompt)
    let jsonStr = result.response.text().trim()
    jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim()
    const parsed = JSON.parse(jsonStr)
    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.recommendations)
        ? parsed.recommendations
        : []
    const recommendations: AIRecommendation[] = rawList
      .filter(
        (rec: any) =>
          rec &&
          typeof rec.title === "string" &&
          rec.title.trim().length > 0 &&
          typeof rec.author === "string"
      )
      .slice(0, 5)
      .map((rec: any) => ({
        title: rec.title.trim(),
        author: rec.author.trim() || "Unknown Author",
        reason:
          typeof rec.reason === "string" && rec.reason.trim()
            ? rec.reason.trim()
            : "Recommended for your AksharSetu reading list.",
      }))

    if (recommendations.length === 0) {
      return buildAlgorithmicRecommendations(userId, preferredCategories, knownTitles)
    }

    const enriched = await Promise.all(
      recommendations.map(async (rec) => {
        const availableBook = await prisma.book.findFirst({
          where: {
            title: { contains: rec.title, mode: "insensitive" },
            status: "AVAILABLE",
          },
          select: { id: true },
        })

        return {
          ...rec,
          availableBookId: availableBook?.id || null,
        }
      })
    )

    return enriched
  } catch (error) {
    console.warn("Gemini recommendation fallback triggered:", error)
    return buildAlgorithmicRecommendations(userId, preferredCategories, knownTitles)
  }
}
