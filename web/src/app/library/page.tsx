import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LibraryGrid } from "@/components/library/LibraryGrid"
import { BookOpen } from "lucide-react"

export default async function LibraryPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const libraryBooks = await prisma.libraryBook.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-16">
      <div className="container mx-auto max-w-6xl px-4">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight mb-2">
              My Library
            </h1>
            <p className="text-[#1D1D1F]/60 font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Your personal collection of books.
            </p>
          </div>
        </div>

        <LibraryGrid initialBooks={libraryBooks} />

      </div>
    </div>
  )
}
