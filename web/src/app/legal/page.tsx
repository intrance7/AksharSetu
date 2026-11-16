import Link from "next/link"
import { LEGAL_DOCUMENTS } from "@/lib/legalDocumentsData"
import { Scale, ArrowRight, ShieldCheck, Calendar, FileText } from "lucide-react"

export const metadata = {
  title: "Legal, Privacy & Platform Policies — AksharSetu",
  description:
    "All 14 AksharSetu legal agreements, privacy disclosures, marketplace rules, buyer protection, and community guidelines.",
}

export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-14 pb-18 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-3">
            <Scale className="h-3.5 w-3.5" /> Transparency, Governance & Trust
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter">
            Legal & Platform Policies
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
            Plain-language, versioned legal agreements and community standards
            governing the AksharSetu book marketplace, digital reading room,
            and progression ecosystem.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEGAL_DOCUMENTS.map((doc) => (
            <Link
              key={doc.slug}
              href={`/legal/${doc.slug}`}
              className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06] hover:border-[#0066cc] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-[#0066cc]">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Version {doc.version}
                  </span>
                  <span className="text-[#86868b] font-medium normal-case inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Effective{" "}
                    {doc.effectiveDate}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#1d1d1f] group-hover:text-[#0066cc] mt-2">
                  {doc.title}
                </h2>
                <p className="text-xs text-[#6e6e73] mt-1.5 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-black/[0.05] flex items-center justify-between text-xs">
                <span className="text-[#86868b]">
                  {doc.sections.length} clauses · Updated {doc.lastUpdated}
                </span>
                <span className="font-bold text-[#0066cc] inline-flex items-center gap-1">
                  Read Policy <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#0066cc] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1f]">
                Questions Regarding Legal Compliance, Privacy, or Copyright?
              </h3>
              <p className="text-xs text-[#6e6e73] mt-0.5">
                Reach our Trust, Safety & Legal Desk directly via the Official
                Contact & Legal Notice page or submit a tracked ticket.
              </p>
            </div>
          </div>
          <Link
            href="/support?category=COPYRIGHT_DMCA"
            className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] px-5 py-2.5 text-xs font-bold text-white shrink-0 text-center"
          >
            Contact Legal & Safety Desk
          </Link>
        </div>
      </div>
    </div>
  )
}
