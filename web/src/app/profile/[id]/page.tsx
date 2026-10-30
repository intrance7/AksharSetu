import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ProfileContent } from "@/components/profile/ProfileContent"

export const dynamic = "force-dynamic"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const session = await auth()

  if (resolvedParams.id === "me") {
    if (!session?.user?.id) {
      redirect("/login")
    }
    redirect(`/profile/${session.user.id}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: {
      books: {
        orderBy: { createdAt: "desc" },
      },
      donations: true,
      badges: {
        include: { badge: true },
      },
      libraryBooks: {
        orderBy: { updatedAt: "desc" },
      },
      readingSessions: true,
    },
  })

  if (!user) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === user.id

  const booksListed = user.books.length
  const freeBooksCount = user.books.filter((b) => b.price === 0).length
  const booksDonated = Math.max(user.donations.length, freeBooksCount)
  const badgesEarned = user.badges.length
  const readingMinutes = user.readingSessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0
  )

  const stats = {
    booksListed,
    booksDonated,
    badgesEarned,
    readingMinutes,
    libraryCount: user.libraryBooks.length,
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pt-24 pb-16 relative overflow-hidden flex flex-col items-center">
      {/* Background Decorations - Left */}
      <div className="hidden xl:block absolute -left-12 top-32 w-[380px] pointer-events-none z-0">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/books-left-ai.png"
            alt="Decorative books and plant"
            className="w-full h-auto drop-shadow-2xl mix-blend-multiply transition-transform duration-500 hover:scale-105 hover:-rotate-2 pointer-events-auto"
          />
        </div>
      </div>

      {/* Background Decorations - Right */}
      <div className="hidden xl:block absolute -right-12 top-24 w-[380px] pointer-events-none z-0">
        <div className="relative transform rotate-6 text-right mb-12 right-16">
          <p className="font-['Caveat'] text-3xl text-[#86868b] leading-tight flex flex-col gap-1 items-end">
            <span>Same books.</span>
            <span>Brighter</span>
            <span className="flex items-center gap-2">
              tomorrows.{" "}
              <span className="w-8 h-8 inline-flex hover:-translate-y-1 hover:scale-125 hover:drop-shadow-lg transition-transform duration-300 cursor-default pointer-events-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/doodle-heart.png"
                  alt="heart"
                  className="w-full h-full object-contain"
                />
              </span>
            </span>
          </p>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 md:px-8 relative z-10 w-full">
        <ProfileHeader
          user={{
            id: user.id,
            name: user.name || user.email?.split("@")[0] || "Reader",
            image: user.image,
            bio: user.bio,
            favoriteQuote: user.favoriteQuote,
            quoteAuthor: user.quoteAuthor,
            location: user.location,
            latitude: user.latitude,
            longitude: user.longitude,
            liveStatus: user.liveStatus,
            isShantiModeActive: user.isShantiModeActive,
          }}
          stats={stats}
          isOwnProfile={isOwnProfile}
        />

        <ProfileContent
          books={user.books}
          badges={user.badges}
          libraryBooks={user.libraryBooks}
        />
      </div>
    </div>
  )
}
