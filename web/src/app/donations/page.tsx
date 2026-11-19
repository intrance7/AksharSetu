import Link from "next/link"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { cached } from "@/lib/fastCache"
import { CampaignCard } from "@/components/donations/CampaignCard"
import { ImpactDashboard } from "@/components/donations/ImpactDashboard"
import { TrackingLookupForm } from "@/components/donations/TrackingLookupForm"
import { HeartHandshake, BookOpen, Building2, Award } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DonationsPage() {
  const [session, publicStats] = await Promise.all([
    auth(),
    cached("donations:public", 20_000, async () => {
      const [campaigns, totalDonationsCount] = await Promise.all([
        prisma.campaign.findMany({
          orderBy: { createdAt: "desc" },
        }),
        prisma.donation.count(),
      ])
      return { campaigns, totalDonationsCount }
    }),
  ])

  const { campaigns, totalDonationsCount } = publicStats

  let userDonations: any[] = []
  if (session?.user?.id) {
    userDonations = await prisma.donation.findMany({
      where: { donorId: session.user.id },
      include: { campaign: true, book: true },
      orderBy: { createdAt: "desc" },
    })
  }

  const totalCampaignBooks = campaigns.reduce(
    (sum, c) => sum + (c.currentBooks || 0),
    0
  )

  return (
    <div className="min-h-screen bg-[#F2EBE1] text-[#1D1D1F]">
      {/* Signature Obsidian Editorial Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-16 md:py-24 px-4 sm:px-8 border-b border-white/10">
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
          className="pointer-events-none absolute -top-28 -right-24 w-[460px] h-[460px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF7F45 0%, #C84200 42%, transparent 72%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-[360px] h-[360px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #0A7D4F 0%, transparent 72%)",
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/15 text-xs font-bold uppercase tracking-[0.14em] text-[#F2EBE1]/90 mb-5">
            <HeartHandshake className="w-4 h-4 text-[#FF7F45]" /> Vidya Daan ·
            Classroom Book Drives
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl tracking-tight font-black leading-[1.02] mb-6 max-w-4xl">
            Pass a Book <br className="hidden sm:block" /> to a{" "}
            <span className="font-serif italic font-normal text-[#FF7F45]">
              Classroom.
            </span>
          </h1>
          <p className="text-[#F2EBE1]/72 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
            Pledge outgrown textbooks and storybooks straight to verified Indian
            NGO drives—and follow every parcel across six checkpoints until a
            student opens it.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href="/catalog/new?type=donation"
              className="bg-[#C84200] hover:bg-[#FF7F45] hover:text-[#0B0B0D] text-white px-7 py-3.5 rounded-full font-bold text-sm transition-colors shadow-lg"
            >
              Pledge a Book
            </Link>
            <a
              href="#campaigns"
              className="bg-white/10 hover:bg-white/20 text-[#F5F5F7] border border-white/15 px-7 py-3.5 rounded-full font-bold text-sm transition-colors"
            >
              Browse Classroom Drives
            </a>
          </div>

          {/* Live Impact Stat Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-12">
            <div className="rounded-3xl bg-white/[0.05] backdrop-blur-xs border border-white/12 p-5 text-center">
              <Building2 className="w-5 h-5 text-[#FF7F45] mx-auto mb-2" />
              <p className="font-mono text-3xl font-black text-white">
                {campaigns.length}
              </p>
              <p className="text-[13px] font-medium text-[#F2EBE1]/70 mt-1">
                Verified NGO Drives
              </p>
            </div>
            <div className="rounded-3xl bg-white/[0.05] backdrop-blur-xs border border-white/12 p-5 text-center">
              <BookOpen className="w-5 h-5 text-[#FF7F45] mx-auto mb-2" />
              <p className="font-mono text-3xl font-black text-white">
                {Math.max(totalCampaignBooks, totalDonationsCount)}
              </p>
              <p className="text-[13px] font-medium text-[#F2EBE1]/70 mt-1">
                Books Pledged to Students
              </p>
            </div>
            <div className="rounded-3xl bg-white/[0.05] backdrop-blur-xs border border-white/12 p-5 text-center">
              <Award className="w-5 h-5 text-[#FF7F45] mx-auto mb-2" />
              <p className="font-mono text-3xl font-black text-white">
                6-Stage
              </p>
              <p className="text-[13px] font-medium text-[#F2EBE1]/70 mt-1">
                Verifiable Chain of Custody
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-24 space-y-16">
        {/* Public Verification ID Lookup */}
        <TrackingLookupForm />

        {/* User Impact Dashboard (if logged in and has donations) */}
        {session?.user && userDonations.length > 0 && (
          <section>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-6 text-[#1D1D1F]">
              Your Vidya Daan{" "}
              <span className="font-serif italic font-normal text-[#C84200]">
                Impact
              </span>
            </h2>
            <ImpactDashboard donations={userDonations as any} />
          </section>
        )}

        {/* Active Campaigns */}
        <section id="campaigns">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                Active Classroom &amp;{" "}
                <span className="font-serif italic font-normal text-[#C84200]">
                  NGO Drives
                </span>
              </h2>
              <p className="text-[15px] font-medium text-[#6e6e73] mt-1.5 max-w-2xl">
                Choose a verified partner drive below to pledge textbooks, exam
                guides, or storybooks directly.
              </p>
            </div>
            <Link
              href="/catalog/new?type=donation"
              className="text-sm font-bold text-[#C84200] hover:underline"
            >
              Or pledge to the General Student Pool →
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07]">
              <p className="text-[#6e6e73] text-[15px] font-medium mb-5">
                No active campaigns at the moment. You can still donate to the
                general pool!
              </p>
              <Link
                href="/catalog/new?type=donation"
                className="inline-flex px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition-colors"
              >
                Donate to General Pool
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
