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
    <div className="min-h-screen bg-[#F2EBE1] py-12 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Action Bar (hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <Link
            href="/donations"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1D1D1F]/70 hover:text-[#C84200]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vidya Daan
          </Link>
          <CertificateActions />
        </div>

        {/* Live 6-Stage Verification Strip (hidden when printing) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Public Ledger Verified
              </span>
              <h2 className="text-xl font-black text-[#1D1D1F] mt-2">
                6-Stage Vidya Daan Chain of Custody
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase text-[#86868b] block">
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
                      ? "bg-[#0066cc]/6 border-[#0066cc]/30 text-[#1D1D1F]"
                      : "bg-[#FAF6F0]/60 border-transparent text-[#86868b]"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      done
                        ? "bg-[#0066cc] text-white"
                        : "bg-white text-[#86868b]/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold leading-tight">
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
            <div className="inline-flex items-center gap-2 text-[#C84200]">
              <BookOpen className="w-6 h-6" />
              <span className="text-2xl font-black tracking-tight text-[#1D1D1F]">
                Aksharसेतु
              </span>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C84200] mb-2">
                Vidya Daan · Certificate of Literacy Impact
              </p>
              <div className="w-24 h-0.5 bg-[#C84200]/30 mx-auto" />
            </div>

            <p className="text-sm font-medium text-[#86868b]">
              This official certificate gratefully recognizes that
            </p>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1D1D1F] py-1">
              {donorName}
            </h1>

            <p className="text-sm md:text-base text-[#1D1D1F]/80 leading-relaxed">
              has contributed <strong className="text-[#1D1D1F]">{bookDisplay}</strong>{" "}
              to <strong className="text-[#C84200]">{campaignTitle}</strong> in
              partnership with <strong className="text-[#1D1D1F]">{ngoName}</strong>,
              expanding equitable access to education and reading across India.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-black/10 text-left">
              <div className="bg-[#FAF6F0] rounded-2xl p-4 print:border print:border-black/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#86868b] block">
                  Verification Code
                </span>
                <span className="font-mono text-xs font-black text-[#1D1D1F] break-all">
                  {donation.trackingId}
                </span>
              </div>

              <div className="bg-[#FAF6F0] rounded-2xl p-4 print:border print:border-black/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#86868b] block">
                  Custody Stage
                </span>
                <span className="text-xs font-black text-[#0066cc]">
                  {STAGES[stageIdx]?.label || donation.status}
                </span>
              </div>

              <div className="bg-[#FAF6F0] rounded-2xl p-4 print:border print:border-black/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#86868b] block">
                  Recorded Date
                </span>
                <span className="text-xs font-black text-[#1D1D1F]">
                  {new Date(donation.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#86868b] font-semibold">
              <div>
                <p className="font-black text-[#1D1D1F]">
                  Vidya Daan Verification Registry
                </p>
                <p>AksharSetu Community Literacy Network</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-black text-[11px] shrink-0">
                <ShieldCheck className="w-4 h-4" /> Digitally Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

