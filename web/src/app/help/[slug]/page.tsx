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
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      {/* Header */}
      <section className="bg-black text-[#f5f5f7] pt-12 pb-14 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-2 text-xs text-[#86868b] mb-4">
            <Link href="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href="/help"
              className="hover:text-white transition-colors text-[#0066cc] font-semibold"
            >
              {category?.name || "Documentation"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white line-clamp-1">{article.title}</span>
          </nav>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter">
            {article.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-3xl">
            {article.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#86868b]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#0066cc]" /> Last updated:{" "}
              <strong className="text-white">{article.updatedAt}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#0066cc]" />{" "}
              {Math.max(2, article.sections.length)} minute read
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#0066cc]" /> Table of
                Contents
              </h2>
              <ul className="space-y-2 text-xs">
                {article.sections.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] hover:text-[#0066cc] transition-colors"
                    >
                      <span className="text-[#86868b] font-mono">
                        0{idx + 1}
                      </span>
                      <span>{item.heading}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {relatedArticles.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                  Related Guides
                </h2>
                <div className="space-y-2.5">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/help/${rel.slug}`}
                      className="block rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] p-3 transition-colors"
                    >
                      <div className="text-xs font-bold text-[#1d1d1f] flex items-center justify-between">
                        <span>{rel.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#0066cc] shrink-0" />
                      </div>
                      <p className="text-[11px] text-[#86868b] mt-0.5 line-clamp-2">
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
            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06] space-y-8">
              {article.sections.map((section, idx) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={
                    idx > 0 ? "pt-8 border-t border-black/[0.06]" : undefined
                  }
                >
                  <h2 className="text-xl font-bold text-[#1d1d1f]">
                    {section.heading}
                  </h2>

                  <div className="mt-3 space-y-3 text-sm text-[#1d1d1f]/85 leading-relaxed">
                    {section.body.split(/\n\n+/).map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>

                  {section.steps && section.steps.length > 0 && (
                    <div className="mt-4 rounded-xl bg-[#f5f5f7] p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-3">
                        Step-by-Step Instructions
                      </div>
                      <ol className="space-y-2.5">
                        {section.steps.map((step, sIdx) => (
                          <li
                            key={sIdx}
                            className="flex items-start gap-3 text-xs sm:text-sm text-[#1d1d1f]"
                          >
                            <span className="h-5 w-5 rounded-full bg-[#0066cc] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
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
