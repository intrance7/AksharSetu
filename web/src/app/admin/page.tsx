import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Shield, Users, BookOpen, AlertTriangle, CheckCircle, Trash2, Ban } from "lucide-react"
import { verifyUser, banUser, approveBook, removeBook } from "@/app/actions/admin"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Ensure the user is an admin
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "ADMIN") {
    // Return unauthorized view or redirect. Let's show a polite message.
    return (
      <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-12 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-[#1d1d1f] mb-2">Access Denied</h1>
          <p className="text-[#86868b] font-medium mb-6">You do not have the required permissions to view this page.</p>
        </div>
      </div>
    )
  }

  // Fetch some stats
  const totalUsers = await prisma.user.count()
  const totalBooks = await prisma.book.count()
  const totalDonations = await prisma.donation.count()

  // Fetch recent users for verification
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // Fetch recent books for moderation
  const recentBooks = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { owner: true }
  })

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-12">
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
              <Shield className="w-3 h-3" /> Admin Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight leading-none">
              Trust & Safety
            </h1>
            <p className="text-[#86868B] font-medium mt-3 max-w-xl">
              Monitor the platform, moderate listings, and verify users to maintain a trusted community.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl p-6 border border-[#1d1d1f]/5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#0066cc]/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-[#0066cc]" />
            </div>
            <p className="text-sm font-bold text-[#86868b] uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-4xl font-black text-[#1d1d1f]">{totalUsers}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-[#1d1d1f]/5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#C84200]/10 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-[#C84200]" />
            </div>
            <p className="text-sm font-bold text-[#86868b] uppercase tracking-wider mb-1">Active Listings</p>
            <p className="text-4xl font-black text-[#1d1d1f]">{totalBooks}</p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-[#1d1d1f]/5 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#287F56]/10 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-[#287F56]" />
            </div>
            <p className="text-sm font-bold text-[#86868b] uppercase tracking-wider mb-1">Donations</p>
            <p className="text-4xl font-black text-[#1d1d1f]">{totalDonations}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Verification Panel */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1d1d1f]/5">
            <h2 className="text-xl font-black text-[#1d1d1f] mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#86868b]" /> User Verification
            </h2>
            <div className="space-y-4">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-[#F9F9FB] rounded-2xl border border-[#1d1d1f]/5 hover:border-[#1d1d1f]/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                       <Image src={u.image || '/default-avatar.png'} alt={u.name || 'User'} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1d1d1f] text-sm">{u.name || 'Anonymous'}</h4>
                      <p className="text-xs font-medium text-[#86868b]">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={async () => {
                      "use server"
                      await verifyUser(u.id)
                    }}>
                      <button className="p-2 bg-green-500/10 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-colors" title="Verify User">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </form>
                    
                    <form action={async () => {
                      "use server"
                      await banUser(u.id)
                    }}>
                      <button className="p-2 bg-red-500/10 text-red-600 rounded-full hover:bg-red-500 hover:text-white transition-colors" title="Ban User (Remove Books)">
                        <Ban className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book Moderation Panel */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#1d1d1f]/5">
            <h2 className="text-xl font-black text-[#1d1d1f] mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#86868b]" /> Listing Moderation
            </h2>
            <div className="space-y-4">
              {recentBooks.map(b => (
                <div key={b.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-[#F9F9FB] rounded-2xl border border-[#1d1d1f]/5 hover:border-[#1d1d1f]/10 transition-colors">
                  {b.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.images[0]} alt={b.title} className="w-16 h-20 object-cover rounded-md shadow-sm shrink-0" />
                  ) : (
                    <div className="w-16 h-20 bg-gray-200 rounded-md shrink-0 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-[#1d1d1f] text-sm truncate">{b.title}</h4>
                      <p className="text-xs font-medium text-[#86868b] truncate mb-1">Listed by {b.owner.name}</p>
                      <div className="inline-flex text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#1d1d1f]/5 text-[#1d1d1f]/70">
                        {b.category}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0 sm:self-end">
                      <form action={async () => {
                        "use server"
                        await approveBook(b.id)
                      }}>
                        <button className="px-4 py-1.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full hover:bg-green-500 hover:text-white transition-colors">
                          Approve
                        </button>
                      </form>

                      <form action={async () => {
                        "use server"
                        await removeBook(b.id)
                      }}>
                        <button className="px-4 py-1.5 bg-red-500/10 text-red-600 text-xs font-bold rounded-full hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
