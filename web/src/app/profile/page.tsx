import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile/ProfileForm"
import Link from "next/link"
import { Settings, Eye } from "lucide-react"

export default async function ProfileDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      badges: {
        include: { badge: true }
      }
    }
  })

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Column: Edit Form */}
          <div className="w-full md:w-1/2 lg:w-2/3 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tight">
                My Profile
              </h1>
              <Link 
                href={`/user/${user.id}`}
                className="flex items-center gap-2 text-sm font-bold text-[#0066cc] hover:text-[#0071e3]"
              >
                <Eye className="w-4 h-4" /> View Public Profile
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-[#1D1D1F]/5 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#1D1D1F]/5 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#1D1D1F]/40" />
                </div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">Edit Details</h2>
              </div>
              <ProfileForm user={user} />
            </div>
          </div>

          {/* Right Column: Badges (Trophy Cabinet) */}
          <div className="w-full md:w-1/2 lg:w-1/3">
            <div className="bg-[#1D1D1F] rounded-3xl p-8 text-white sticky top-28 shadow-lg">
              <h2 className="text-xl font-black tracking-tight mb-2">Trophy Cabinet</h2>
              <p className="text-white/60 text-sm font-medium mb-8">Badges you've earned on AksharSetu.</p>

              {user.badges.length === 0 ? (
                <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
                  <p className="text-white/40 text-sm font-medium">You haven't earned any badges yet. Start donating books!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {user.badges.map(({ badge }) => (
                    <div key={badge.id} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shrink-0">
                        {badge.iconUrl}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{badge.name}</h3>
                        <p className="text-white/60 text-xs">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
