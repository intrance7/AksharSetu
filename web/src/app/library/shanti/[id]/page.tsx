import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ShantiTimer } from "@/components/library/ShantiTimer"
import { ShantiModeChooser } from "@/components/library/ShantiModeChooser"
import { EReader } from "@/components/ebooks/EReader"
import { getEbook, searchEbooks } from "@/lib/gutenberg"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}

export default async function ShantiModePage({ params, searchParams }: Props) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const { mode } = await searchParams
  
  const libraryBook = await prisma.libraryBook.findUnique({
    where: { id: id },
  })

  if (!libraryBook || libraryBook.userId !== session.user.id) {
    redirect("/library")
  }

  const timer = (compact = false) => (
    <ShantiTimer bookId={libraryBook.id} title={libraryBook.title} author={libraryBook.author} compact={compact} />
  )

  if (mode === "physical") {
    return (
      <div className="fixed inset-0 bg-[#000000] z-50 flex items-center justify-center overflow-hidden">
        {/* Deep Zen Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0066cc]/10 via-[#000000] to-[#000000] pointer-events-none" />
        {timer()}
      </div>
    )
  }

  // Find a readable e-book: linked one first, otherwise try matching by title + author
  const ebookMatch = libraryBook.gutenbergId
    ? { id: libraryBook.gutenbergId, title: libraryBook.title, author: libraryBook.author }
    : (await searchEbooks(`${libraryBook.title} ${libraryBook.author}`))[0] ?? null

  if (mode === "read" && ebookMatch) {
    const ebook = await getEbook(ebookMatch.id)
    if (ebook) {
      if (!libraryBook.gutenbergId) {
        await prisma.libraryBook.update({ where: { id: libraryBook.id }, data: { gutenbergId: ebook.id } })
      }
      return (
        <EReader
          {...ebook}
          defaultDark
          leading={
            <Link id="shanti-reader-exit" href={`/library/shanti/${libraryBook.id}`} className="flex items-center gap-1.5 text-sm font-medium text-[#86868b] hover:text-[#0066cc] transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" /> Shanti
            </Link>
          }
          trailing={timer(true)}
        />
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-[#000000] z-50 flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0066cc]/10 via-[#000000] to-[#000000] pointer-events-none" />
      <ShantiModeChooser title={libraryBook.title} author={libraryBook.author} ebook={ebookMatch} />
    </div>
  )
}
