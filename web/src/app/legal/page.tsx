import Link from "next/link"
import { LEGAL_DOCUMENT_LIST } from "@/lib/legalDocumentsData"
import {
  Scale,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileText,
} from "lucide-react"

export const metadata = {
  title: "Legal, Privacy & Platform Policies — AksharSetu",
  description:
    "All 14 AksharSetu legal agreements, privacy disclosures, marketplace rules, buyer protection, and community guidelines.",
}

export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] pt-16 pb-20 px-4 sm:px-6 border-b border-white/10">
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
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-4">
            <Scale className="h-3.5 w-3.5" /> Transparency, Governance &amp;
            Trust
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Legal &amp;{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Platform Policies
            </span>
            .
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
            Plain-language, versioned legal agreements and community standards
            governing the AksharSetu book marketplace, digital reading room,
            and progression ecosystem.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEGAL_DOCUMENT_LIST.map((doc) => (
            <Link
              key={doc.slug}
              href={`/legal/${doc.slug}`}
              className="rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07] hover:border-[#C84200] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#C84200]">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Version {doc.version}
                  </span>
                  <span className="text-[#6E6E73] font-medium normal-case inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Effective{" "}
                    {doc.effectiveDate}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#1D1D1F] group-hover:text-[#C84200] mt-2.5 tracking-tight transition-colors">
                  {doc.title}
                </h2>
                <p className="text-sm text-[#5E5E63] mt-2 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1D1D1F]/[0.06] flex items-center justify-between text-xs sm:text-[13px]">
                <span className="font-mono text-[#6E6E73]">
                  {doc.sections.length} clauses · Updated {doc.lastUpdated}
                </span>
                <span className="font-bold text-[#C84200] inline-flex items-center gap-1">
                  Read Policy <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-[#1D1D1F]/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#C84200]/15 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5 text-[#C84200]" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Questions Regarding Legal Compliance, Privacy, or Copyright?
              </h3>
              <p className="text-sm text-[#5E5E63] mt-1 leading-relaxed">
                Reach our Trust, Safety &amp; Legal Desk directly via the
                Official Contact &amp; Legal Notice page or submit a tracked
                ticket.
              </p>
            </div>
          </div>
          <Link
            href="/support?category=COPYRIGHT_DMCA"
            className="rounded-full bg-[#C84200] hover:bg-[#A33500] px-6 py-3 text-sm font-bold text-white shrink-0 text-center transition-colors"
          >
            Contact Legal &amp; Safety Desk
          </Link>
        </div>
      </div>
    </div>
  )
}
