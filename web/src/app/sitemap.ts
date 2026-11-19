import type { MetadataRoute } from "next"
import prisma from "@/lib/prisma"
import { HELP_ARTICLES } from "@/lib/helpCenterData"
import { LEGAL_DOCUMENT_LIST } from "@/lib/legalDocumentsData"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://aksharsetu-iota.vercel.app"
  ).replace(/\/+$/, "")

  const staticRoutes = [
    "",
    "/catalog",
    "/campus",
    "/map",
    "/clubs",
    "/ebooks",
    "/donations",
    "/requests",
    "/leaderboard",
    "/achievements",
    "/badges",
    "/about",
    "/help",
    "/help/xp-and-levels",
    "/help/badges-and-achievements",
    "/help/reading-streaks",
    "/help/quests-and-rewards",
    "/help/leaderboards",
    "/faq",
    "/legal",
    "/support",
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/catalog" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : route === "/catalog" ? 0.95 : 0.8,
  }))

  const helpEntries: MetadataRoute.Sitemap = HELP_ARTICLES.map((art) => ({
    url: `${baseUrl}/help/${art.slug}`,
    lastModified: new Date(art.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const legalEntries: MetadataRoute.Sitemap = LEGAL_DOCUMENT_LIST.map(
    (doc) => ({
      url: `${baseUrl}/legal/${doc.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    })
  )

  const books = await prisma.book
    .findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    })
    .catch(() => [])

  const bookEntries: MetadataRoute.Sitemap = books.map((b) => ({
    url: `${baseUrl}/catalog/${b.id}`,
    lastModified: b.updatedAt,
    changeFrequency: "daily",
    priority: 0.85,
  }))

  return [...staticEntries, ...bookEntries, ...helpEntries, ...legalEntries]
}
