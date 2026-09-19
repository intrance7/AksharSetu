import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ShantiTimer } from "@/components/library/ShantiTimer"

export default async function ShantiModePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  
  const libraryBook = await prisma.libraryBook.findUnique({
    where: { id: id },
  })

  if (!libraryBook || libraryBook.userId !== session.user.id) {
    redirect("/library")
  }

  return (
    <div className="fixed inset-0 bg-[#000000] z-50 flex items-center justify-center overflow-hidden">
      {/* Deep Zen Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0066cc]/10 via-[#000000] to-[#000000] pointer-events-none" />
      
      <ShantiTimer bookId={libraryBook.id} title={libraryBook.title} author={libraryBook.author} />
    </div>
  )
}
