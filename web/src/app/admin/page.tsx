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
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm text-center max-w-md border border-[#1D1D1F]/[0.07]">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#C84200]/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-[#C84200]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] mb-2 tracking-tight">
            Admin Access Required
          </h1>
          <p className="text-[#5E5E63] mb-6 text-sm sm:text-[15px] leading-relaxed">
            This console is restricted to platform administrators and NGO
            coordinators.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-sm font-bold transition-colors"
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
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-14 md:py-18 px-4 sm:px-6 md:px-8 border-b border-white/10">
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

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.08] border border-white/12 text-[#FF7F45] font-mono text-xs font-bold uppercase tracking-widest rounded-full mb-4">
            <Shield className="w-3.5 h-3.5" /> Operations &amp; NGO Command
            Center
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight leading-[1.06]">
            Trust, Safety &amp;{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Vidya Daan
            </span>
            .
          </h1>
          <p className="text-[#D2CDC5] mt-3.5 max-w-2xl text-base sm:text-lg leading-relaxed">
            Manage NGO literacy campaigns, advance 6-stage book donation
            tracking, verify community members, and moderate listings.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 -mt-7 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-[#0066cc]/15 flex items-center justify-center mb-3.5">
              <Users className="w-5 h-5 text-[#0066cc]" />
            </div>
            <p className="text-xs font-bold text-[#5E5E63] uppercase tracking-wider">
              Readers
            </p>
            <p className="font-mono text-3xl font-bold text-[#1D1D1F] mt-1">
              {totalUsers}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-[#C84200]/15 flex items-center justify-center mb-3.5">
              <BookOpen className="w-5 h-5 text-[#C84200]" />
            </div>
            <p className="text-xs font-bold text-[#5E5E63] uppercase tracking-wider">
              Available Books
            </p>
            <p className="font-mono text-3xl font-bold text-[#1D1D1F] mt-1">
              {totalBooks}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-[#0A7D4F]/15 flex items-center justify-center mb-3.5">
              <HeartHandshake className="w-5 h-5 text-[#0A7D4F]" />
            </div>
            <p className="text-xs font-bold text-[#5E5E63] uppercase tracking-wider">
              Donations Tracked
            </p>
            <p className="font-mono text-3xl font-bold text-[#1D1D1F] mt-1">
              {totalDonations}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] border border-amber-500/20 flex items-center justify-center mb-3.5">
              <Megaphone className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-[#5E5E63] uppercase tracking-wider">
              Active NGO Drives
            </p>
            <p className="font-mono text-3xl font-bold text-[#1D1D1F] mt-1">
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
