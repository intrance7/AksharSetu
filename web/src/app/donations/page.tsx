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
      {/* Hero Section */}
      <section className="bg-black text-[#F5F5F7] py-16 md:py-24 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-widest text-[#F5F5F7]/90 mb-5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#C84200]" /> Vidya Daan
            Literacy Network
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl tracking-tighter font-black leading-[1.02] mb-6">
            Give a Book. <br className="hidden sm:block" /> Give a Future.
          </h1>
          <p className="text-[#86868b] text-base sm:text-lg md:text-xl max-w-2xl mb-10">
            Join the AksharSetu community in supporting NGOs and students across
            India. Track every donated book across 6 verified stages from your
            hands to theirs.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href="/catalog/new?type=donation"
              className="bg-[#C84200] hover:bg-[#A33500] text-white px-7 py-3.5 rounded-full font-bold text-sm transition-colors shadow-sm"
            >
              Donate a Book Now
            </Link>
            <a
              href="#campaigns"
              className="bg-white/10 hover:bg-white/20 text-[#F5F5F7] border border-white/15 px-7 py-3.5 rounded-full font-bold text-sm transition-colors"
            >
              Explore NGO Campaigns
            </a>
          </div>

          {/* Live Impact Stat Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-12">
            <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 text-center">
              <Building2 className="w-4 h-4 text-[#C84200] mx-auto mb-1.5" />
              <p className="text-2xl font-black text-white">
                {campaigns.length}
              </p>
              <p className="text-xs font-semibold text-[#86868b]">
                Verified NGO Drives
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 text-center">
              <BookOpen className="w-4 h-4 text-[#C84200] mx-auto mb-1.5" />
              <p className="text-2xl font-black text-white">
                {Math.max(totalCampaignBooks, totalDonationsCount)}
              </p>
              <p className="text-xs font-semibold text-[#86868b]">
                Books Pledged to Students
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4 text-center">
              <Award className="w-4 h-4 text-[#C84200] mx-auto mb-1.5" />
              <p className="text-2xl font-black text-white">6-Stage</p>
              <p className="text-xs font-semibold text-[#86868b]">
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
              Your Vidya Daan Impact
            </h2>
            <ImpactDashboard donations={userDonations as any} />
          </section>
        )}

        {/* Active Campaigns */}
        <section id="campaigns">
          <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
                Active NGO Campaigns
              </h2>
              <p className="text-sm font-medium text-[#86868b] mt-1">
                Pick a partner literacy drive below to pledge textbooks or
                storybooks directly.
              </p>
            </div>
            <Link
              href="/catalog/new?type=donation"
              className="text-xs font-bold text-[#C84200] hover:underline"
            >
              Or donate to the General Literacy Pool →
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-12 text-center shadow-sm border border-black/5">
              <p className="text-[#86868b] font-medium mb-4">
                No active campaigns at the moment. You can still donate to the
                general pool!
              </p>
              <Link
                href="/catalog/new?type=donation"
                className="inline-flex px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-bold transition-colors"
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
