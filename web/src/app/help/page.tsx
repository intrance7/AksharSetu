import prisma from "@/lib/prisma"
import { HelpCenterClient } from "@/components/help/HelpCenterClient"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Help Center & Platform Documentation — AksharSetu",
  description:
    "Searchable documentation, step-by-step guides, XP & badge formulas, FAQs, and support for AksharSetu.",
}

export default async function HelpCenterPage() {
  const customArticlesRaw = await prisma.helpCustomArticle
    .findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: "desc" },
    })
    .catch(() => [])

  const customArticles = customArticlesRaw.map((c) => ({
    slug: c.slug,
    title: c.title,
    categorySlug: c.categorySlug,
    summary: c.summary,
    updatedAt: c.updatedAt.toISOString(),
  }))

  return <HelpCenterClient customArticles={customArticles} />
}
