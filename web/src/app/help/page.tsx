import prisma from "@/lib/prisma"
import { HelpCenterClient } from "@/components/help/HelpCenterClient"
import { MascotCalloutCard } from "@/components/mascots/AksharSetuMascots"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Help Center & Platform Documentation — AksharSetu",
  description:
    "Searchable documentation, step-by-step guides, XP & badge formulas, FAQs, and support for AksharSetu.",
}

export default async function HelpCenterPage() {
  const customArticlesRaw = await prisma.helpCustomArticle
    .findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
    })
    .catch(() => [])

  const customArticles = customArticlesRaw.map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    summary: c.summary,
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <>
      <HelpCenterClient customArticles={customArticles} />
      <section className="bg-[#F2EBE1] -mt-14 pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <MascotCalloutCard variant="help" />
        </div>
      </section>
    </>
  )
}
