import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { CampaignCard } from "@/components/donations/CampaignCard"
import { ImpactDashboard } from "@/components/donations/ImpactDashboard"

export const dynamic = "force-dynamic"

export default async function DonationsPage() {
  const session = await auth()
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" }
  })
  
  let userDonations = []
  if (session?.user?.id) {
    userDonations = await prisma.donation.findMany({
      where: { donorId: session.user.id },
      include: { campaign: true, book: true },
      orderBy: { createdAt: "desc" }
    })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Hero Section */}
      <section className="bg-black text-[#f5f5f7] py-24 px-6 sm:px-12 lg:px-24 rounded-b-[2.5rem] shadow-sm mb-12">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl tracking-tighter font-bold leading-none mb-6">
            Give a Book. <br className="hidden md:block"/> Give a Future.
          </h1>
          <p className="text-[#86868b] text-lg md:text-xl max-w-2xl mb-10">
            Join the AksharSetu community in supporting NGOs and students across the country. Track your donation from your hands to theirs.
          </p>
          <div className="flex gap-4">
            <a href="#campaigns" className="bg-[#0066cc] hover:bg-[#0071e3] text-white px-8 py-3 rounded-full font-medium transition-colors">
              View Campaigns
            </a>
            <a href="/catalog/new?type=donation" className="bg-[#e8e8ed] hover:bg-[#d2d2d7] text-black px-8 py-3 rounded-full font-medium transition-colors">
              Donate Now
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 pb-24 space-y-24">
        {/* User Impact Dashboard (if logged in and has donations) */}
        {session?.user && userDonations.length > 0 && (
          <section>
             <h2 className="text-3xl font-bold tracking-tight mb-8">Your Impact</h2>
             <ImpactDashboard donations={userDonations as any} />
          </section>
        )}

        {/* Active Campaigns */}
        <section id="campaigns">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Active NGO Campaigns</h2>
          </div>
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <p className="text-[#86868b]">No active campaigns at the moment. You can still donate to the general pool!</p>
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
