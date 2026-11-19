import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import {
  getHelpArticleBySlug,
  HELP_ARTICLES,
  HELP_CATEGORIES,
  type HelpArticle,
} from "@/lib/helpCenterData"
import { ArticleFeedbackWidget } from "@/components/help/ArticleFeedbackWidget"
import {
  ChevronRight,
  Clock,
  Calendar,
  BookOpen,
  ArrowRight,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function HelpArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let article: HelpArticle | undefined = getHelpArticleBySlug(slug)

  if (!article) {
    const custom = await prisma.helpCustomArticle
      .findUnique({
        where: { slug },
      })
      .catch(() => null)

    if (custom && custom.published) {
      article = {
        slug: custom.slug,
        title: custom.title,
        category: custom.category,
        summary: custom.summary,
        updatedAt: custom.updatedAt.toISOString().slice(0, 10),
        popular: false,
        recentlyUpdated: true,
        sections: [
          {
            id: "content",
            heading: custom.title,
            body: custom.body,
          },
        ],
        relatedSlugs: [
          "getting-started-with-aksharsetu",
          "safety-blocking-and-reporting",
        ],
      }
    }
  }

  if (!article) {
    notFound()
  }

  const category = HELP_CATEGORIES.find((c) => c.id === article.category)
  const relatedArticles = article.relatedSlugs
    .map((s) => HELP_ARTICLES.find((a) => a.slug === s))
    .filter((a): a is HelpArticle => Boolean(a))

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Header */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] pt-12 pb-16 px-4 sm:px-6 border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#C84200]/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#FF7F45]/12 blur-[100px]" />

        <div className="mx-auto max-w-5xl relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-[#C9C4BC] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href="/help"
              className="hover:text-white transition-colors text-[#FF7F45] font-semibold"
            >
              {category?.name || "Documentation"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white line-clamp-1">{article.title}</span>
          </nav>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
            {article.title}
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#D2CDC5] max-w-3xl leading-relaxed">
            {article.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-5 font-mono text-xs text-[#C9C4BC]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#FF7F45]" /> Last updated:{" "}
              <strong className="text-white">{article.updatedAt}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#FF7F45]" />{" "}
              {Math.max(2, article.sections.length)} minute read
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3.5 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-[#C84200]" /> Table of
                Contents
              </h2>
              <ul className="space-y-1.5 text-sm">
                {article.sections.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-semibold text-[#1D1D1F] hover:bg-[#FAF6F0] hover:text-[#C84200] transition-colors"
                    >
                      <span className="text-[#6E6E73] font-mono text-xs">
                        0{idx + 1}
                      </span>
                      <span>{item.heading}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {relatedArticles.length > 0 && (
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3.5">
                  Related Guides
                </h2>
                <div className="space-y-3">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/help/${rel.slug}`}
                      className="block rounded-2xl bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.06] p-3.5 transition-colors"
                    >
                      <div className="text-sm font-bold text-[#1D1D1F] flex items-center justify-between gap-2">
                        <span>{rel.title}</span>
                        <ArrowRight className="h-4 w-4 text-[#C84200] shrink-0" />
                      </div>
                      <p className="text-xs text-[#5E5E63] mt-1 line-clamp-2 leading-relaxed">
                        {rel.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Article Content */}
          <main className="lg:col-span-8">
            <div className="rounded-3xl bg-white p-6 sm:p-9 shadow-sm border border-[#1D1D1F]/[0.07] space-y-9">
              {article.sections.map((section, idx) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={
                    idx > 0
                      ? "pt-8 border-t border-[#1D1D1F]/[0.07]"
                      : undefined
                  }
                >
                  <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
                    {section.heading}
                  </h2>

                  <div className="mt-3.5 space-y-3.5 text-[15px] sm:text-base text-[#1D1D1F]/85 leading-relaxed">
                    {section.body.split(/\n\n+/).map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>

                  {section.steps && section.steps.length > 0 && (
                    <div className="mt-5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-5 sm:p-6">
                      <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#C84200] mb-3.5">
                        Step-by-Step Instructions
                      </div>
                      <ol className="space-y-3">
                        {section.steps.map((step, sIdx) => (
                          <li
                            key={sIdx}
                            className="flex items-start gap-3 text-sm sm:text-[15px] text-[#1D1D1F] leading-relaxed"
                          >
                            <span className="h-6 w-6 rounded-full bg-[#C84200] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </section>
              ))}
            </div>

            <ArticleFeedbackWidget slug={article.slug} />
          </main>
        </div>
      </div>
    </div>
  )
}
