import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { CertificateActions } from "@/components/donations/CertificateActions"
import {
  BookOpen,
  Package,
  CheckCircle2,
  Truck,
  Building2,
  HeartHandshake,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react"

export const dynamic = "force-dynamic"

const STAGES = [
  { key: "DONATED", label: "Pledge Recorded", icon: BookOpen },
  { key: "COLLECTED", label: "Collected", icon: Package },
  { key: "VERIFIED", label: "Condition Verified", icon: CheckCircle2 },
  { key: "SENT_TO_NGO", label: "Sent to NGO", icon: Truck },
  { key: "RECEIVED", label: "Received at Center", icon: Building2 },
  { key: "DISTRIBUTED", label: "Placed with Student", icon: HeartHandshake },
]

export default async function DonationCertificateTrackingPage({
  params,
}: {
  params: Promise<{ trackingId: string }>
}) {
  const { trackingId } = await params

  const donation = await prisma.donation.findUnique({
    where: { trackingId },
    include: {
      donor: { select: { id: true, name: true, location: true } },
      book: { select: { id: true, title: true, author: true, category: true } },
      campaign: {
        select: { id: true, title: true, ngoName: true, description: true },
      },
    },
  })

  if (!donation) notFound()

  const stageIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.key === donation.status)
  )
  const donorName = donation.donor?.name || "Honored Community Reader"
  const ngoName =
    donation.campaign?.ngoName || "AksharSetu Literacy Partner Network"
  const campaignTitle =
    donation.campaign?.title || "Vidya Daan National Book Access Pool"
  const bookDisplay = donation.book
    ? `"${donation.book.title}" by ${donation.book.author}`
    : "Educational Book Contribution"

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-20 print:bg-white print:pb-0">
      {/* Obsidian Top Verification Header (hidden when printing) */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-12 px-4 md:px-8 border-b border-white/10 print:hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF7F45 0%, #C84200 42%, transparent 72%)",
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <Link
              href="/donations"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F2EBE1]/75 hover:text-[#FF7F45] transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Vidya Daan
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Verified Custody{" "}
              <span className="font-serif italic font-normal text-[#FF7F45]">
                Ledger.
              </span>
            </h1>
          </div>
          <CertificateActions />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8 space-y-8 print:px-0 print:pt-0">
        {/* Live 6-Stage Verification Strip (hidden when printing) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0A7D4F] bg-[#0A7D4F]/10 px-3.5 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" /> Public Ledger Verified
              </span>
              <h2 className="text-xl font-black text-[#1D1D1F] mt-2.5">
                6-Stage Vidya Daan Chain of Custody
              </h2>
            </div>
            <div className="text-left sm:text-right bg-[#FAF6F0] px-4 py-2.5 rounded-2xl border border-[#1D1D1F]/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] block">
                Verification ID
              </span>
              <span className="font-mono text-sm font-black text-[#1D1D1F] break-all">
                {donation.trackingId}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {STAGES.map((st, idx) => {
              const Icon = st.icon
              const done = idx <= stageIdx
              return (
                <div
                  key={st.key}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 ${
                    done
                      ? "bg-[#0A7D4F]/[0.07] border-[#0A7D4F]/25 text-[#1D1D1F]"
                      : "bg-[#FAF6F0] border-transparent text-[#86868b]"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      done
                        ? "bg-[#0A7D4F] text-white shadow-sm"
                        : "bg-white text-[#86868b]/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold leading-snug">
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Printable Official Vidya Daan Certificate */}
        <div className="bg-white rounded-3xl p-8 md:p-14 shadow-xl border-4 border-double border-[#C84200]/40 relative overflow-hidden print:shadow-none print:rounded-none print:border-4">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2.5 text-[#C84200]">
              <BookOpen className="w-6 h-6" />
              <span className="text-2xl font-black tracking-tight text-[#1D1D1F]">
                Aksharसेतु
              </span>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#C84200] mb-2.5">
                Vidya Daan · Certificate of Literacy Impact
              </p>
              <div className="w-24 h-0.5 bg-[#C84200]/35 mx-auto" />
            </div>

            <p className="text-[15px] font-medium text-[#6e6e73]">
              This official certificate gratefully recognizes that
            </p>

            <h2 className="font-serif italic text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] py-1">
              {donorName}
            </h2>

            <p className="text-[15px] md:text-base text-[#1D1D1F]/85 leading-relaxed">
              has contributed{" "}
              <strong className="text-[#1D1D1F]">{bookDisplay}</strong> to{" "}
              <strong className="text-[#C84200]">{campaignTitle}</strong> in
              partnership with{" "}
              <strong className="text-[#1D1D1F]">{ngoName}</strong>, expanding
              equitable access to education and reading across India.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#1D1D1F]/10 text-left">
              <div className="bg-[#FAF6F0] rounded-2xl p-4 print:border print:border-black/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] block mb-1">
                  Verification Code
                </span>
                <span className="font-mono text-[13px] font-black text-[#1D1D1F] break-all">
                  {donation.trackingId}
                </span>
              </div>

              <div className="bg-[#FAF6F0] rounded-2xl p-4 print:border print:border-black/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] block mb-1">
                  Custody Stage
                </span>
                <span className="text-[13px] font-black text-[#0A7D4F]">
                  {STAGES[stageIdx]?.label || donation.status}
                </span>
              </div>

              <div className="bg-[#FAF6F0] rounded-2xl p-4 print:border print:border-black/10">
                <span className="text-xs font-bold uppercase tracking-wider text-[#86868b] block mb-1">
                  Recorded Date
                </span>
                <span className="text-[13px] font-black text-[#1D1D1F]">
                  {new Date(donation.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[13px] text-[#6e6e73] font-medium">
              <div>
                <p className="font-black text-[#1D1D1F]">
                  Vidya Daan Verification Registry
                </p>
                <p>AksharSetu Community Literacy Network</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0A7D4F]/10 text-[#0A7D4F] font-bold text-xs shrink-0">
                <ShieldCheck className="w-4 h-4" /> Digitally Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
