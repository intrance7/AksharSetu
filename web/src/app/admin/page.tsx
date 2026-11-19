import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import {
  Shield,
  Users,
  BookOpen,
  AlertTriangle,
  HeartHandshake,
  Megaphone,
} from "lucide-react"
import { AdminConsoleClient } from "@/components/admin/AdminConsoleClient"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin")
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-12 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md border border-black/5">
          <AlertTriangle className="w-12 h-12 text-[#C84200] mx-auto mb-4" />
          <h1 className="text-2xl font-black text-[#1d1d1f] mb-2">
            Admin Access Required
          </h1>
          <p className="text-[#86868b] font-medium mb-6 text-sm">
            This console is restricted to platform administrators and NGO
            coordinators.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs font-bold"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const [
    totalUsers,
    totalBooks,
    totalDonations,
    totalCampaigns,
    recentUsers,
    recentBooks,
    campaigns,
    donations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.book.count({ where: { status: "AVAILABLE" } }),
    prisma.donation.count(),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 24,
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        donor: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, author: true } },
        campaign: { select: { id: true, title: true, ngoName: true } },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-20">
      <section className="bg-black text-[#F5F5F7] py-12 md:py-14 px-4 md:px-8 border-b border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-[#FF8A4C] text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            <Shield className="w-3 h-3" /> Operations & NGO Command Center
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F5F5F7] tracking-tight leading-none">
            Trust, Safety & Vidya Daan
          </h1>
          <p className="text-[#86868B] font-medium mt-3 max-w-2xl text-sm sm:text-base">
            Manage NGO literacy campaigns, advance 6-stage book donation
            tracking, verify community members, and moderate listings.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-8">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#0066cc]/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#0066cc]" />
            </div>
            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
              Readers
            </p>
            <p className="text-3xl font-black text-[#1d1d1f] mt-1">
              {totalUsers}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#C84200]/10 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-[#C84200]" />
            </div>
            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
              Available Books
            </p>
            <p className="text-3xl font-black text-[#1d1d1f] mt-1">
              {totalBooks}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#287F56]/10 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5 text-[#287F56]" />
            </div>
            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
              Donations Tracked
            </p>
            <p className="text-3xl font-black text-[#1d1d1f] mt-1">
              {totalDonations}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
              <Megaphone className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
              Active NGO Drives
            </p>
            <p className="text-3xl font-black text-[#1d1d1f] mt-1">
              {totalCampaigns}
            </p>
          </div>
        </div>

        <AdminConsoleClient
          currentAdminId={user.id}
          users={recentUsers}
          books={recentBooks}
          campaigns={campaigns}
          donations={donations}
        />
      </div>
    </div>
  )
}
