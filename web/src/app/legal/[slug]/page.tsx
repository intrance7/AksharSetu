import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getLegalDocumentBySlug,
  LEGAL_DOCUMENT_LIST,
} from "@/lib/legalDocumentsData"
import {
  Scale,
  ChevronRight,
  Calendar,
  History,
  AlertCircle,
} from "lucide-react"

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const doc = getLegalDocumentBySlug(slug)

  if (!doc) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Header */}
      <section className="bg-black text-[#f5f5f7] pt-12 pb-14 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-[#86868b] mb-4">
            <Link href="/legal" className="hover:text-white transition-colors">
              Legal & Policies
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">{doc.shortTitle}</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-3">
            <Scale className="h-3.5 w-3.5" /> Version {doc.version}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter">
            {doc.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-3xl">
            {doc.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#86868b]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#0066cc]" /> Effective
              Date: <strong className="text-white">{doc.effectiveDate}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-[#0066cc]" /> Last Updated:{" "}
              <strong className="text-white">{doc.lastUpdated}</strong>
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation Across All 14 Policies */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                All 14 Platform Policies
              </h2>
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {LEGAL_DOCUMENT_LIST.map((item) => {
                  const active = item.slug === doc.slug
                  return (
                    <Link
                      key={item.slug}
                      href={`/legal/${item.slug}`}
                      className={`block rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-[#1d1d1f] text-white"
                          : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
                      }`}
                    >
                      {item.shortTitle}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Policy Change History Card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-black/[0.06]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-[#0066cc]" /> Policy
                Revision Log
              </h2>
              <div className="space-y-3">
                {doc.changeHistory.map((ch) => (
                  <div
                    key={ch.version}
                    className="rounded-xl bg-[#f5f5f7] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#1d1d1f]">
                      <span>v{ch.version}</span>
                      <span className="text-[11px] text-[#86868b]">
                        {ch.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6e6e73] mt-1">
                      {ch.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Policy Clauses */}
          <main className="lg:col-span-8 space-y-6">
            {doc.requiresCounselNotice && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-50/90 p-4 flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">
                    Governance & Legal Review Notice:
                  </strong>{" "}
                  This policy accurately reflects AksharSetu&apos;s live data
                  models, authentication flows, marketplace mechanics, and
                  moderation pipelines. Prior to commercial production launch in
                  regulated jurisdictions, formal review by qualified legal
                  counsel is recommended.
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06] space-y-8">
              {doc.sections.map((section, idx) => (
                <section
                  key={section.heading}
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
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
