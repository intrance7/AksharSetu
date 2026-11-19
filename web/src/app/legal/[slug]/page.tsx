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
          <nav className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-[#C9C4BC] mb-4">
            <Link href="/legal" className="hover:text-white transition-colors">
              Legal &amp; Policies
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white font-semibold">{doc.shortTitle}</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-3.5">
            <Scale className="h-3.5 w-3.5" /> Version {doc.version}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
            {doc.title}
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#D2CDC5] max-w-3xl leading-relaxed">
            {doc.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-5 font-mono text-xs text-[#C9C4BC]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#FF7F45]" /> Effective
              Date: <strong className="text-white">{doc.effectiveDate}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-[#FF7F45]" /> Last Updated:{" "}
              <strong className="text-white">{doc.lastUpdated}</strong>
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation Across All 14 Policies */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3.5">
                All 14 Platform Policies
              </h2>
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {LEGAL_DOCUMENT_LIST.map((item) => {
                  const active = item.slug === doc.slug
                  return (
                    <Link
                      key={item.slug}
                      href={`/legal/${item.slug}`}
                      className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[#1D1D1F] text-white"
                          : "text-[#1D1D1F] hover:bg-[#FAF6F0]"
                      }`}
                    >
                      {item.shortTitle}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Policy Change History Card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#6E6E73] mb-3.5 flex items-center gap-1.5">
                <History className="h-4 w-4 text-[#C84200]" /> Policy Revision
                Log
              </h2>
              <div className="space-y-3">
                {doc.changeHistory.map((ch) => (
                  <div
                    key={ch.version}
                    className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-3.5 text-xs sm:text-[13px]"
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[#1D1D1F]">
                      <span>v{ch.version}</span>
                      <span className="text-[#6E6E73]">{ch.date}</span>
                    </div>
                    <p className="text-[#5E5E63] mt-1.5 leading-relaxed">
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
              <div className="rounded-3xl border border-amber-500/30 bg-amber-50/90 p-5 flex items-start gap-3 text-sm text-amber-950 leading-relaxed">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">
                    Governance &amp; Legal Review Notice:
                  </strong>{" "}
                  This policy accurately reflects AksharSetu&apos;s live data
                  models, authentication flows, marketplace mechanics, and
                  moderation pipelines. Prior to commercial production launch in
                  regulated jurisdictions, formal review by qualified legal
                  counsel is recommended.
                </div>
              </div>
            )}

            <div className="rounded-3xl bg-white p-6 sm:p-9 shadow-sm border border-[#1D1D1F]/[0.07] space-y-9">
              {doc.sections.map((section, idx) => (
                <section
                  key={section.heading}
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
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
