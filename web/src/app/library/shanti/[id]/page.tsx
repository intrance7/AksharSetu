import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { EBook, getEbook, searchEbooks } from "@/lib/gutenberg"
import { ShantiModeChooser } from "@/components/library/ShantiModeChooser"
import { ShantiTimer } from "@/components/library/ShantiTimer"
import EReader from "@/components/ebooks/EReader"

export const dynamic = "force-dynamic"

export default async function ShantiModePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const { mode } = await searchParams

  const book = await prisma.libraryBook.findUnique({
    where: { id },
  })

  if (!book || book.userId !== session.user.id) {
    notFound()
  }

  let ebook: EBook | null = null

  const sourceId =
    book.gutenbergId ||
    (book.platformBookId && /^(ia-|ol-|gb-|pg-|\d+)/.test(book.platformBookId)
      ? book.platformBookId
      : null)

  if (sourceId) {
    ebook = await getEbook(sourceId)
  } else {
    try {
      const results = await searchEbooks(book.title)
      const match = results.find(
        (r) =>
          r.title.toLowerCase().includes(book.title.toLowerCase().slice(0, 12)) ||
          book.title.toLowerCase().includes(r.title.toLowerCase().slice(0, 12))
      )
      if (match) {
        ebook = await getEbook(match.id)
        if (ebook) {
          if (typeof match.id === "number") {
            await prisma.libraryBook
              .update({
                where: { id: book.id },
                data: { gutenbergId: match.id },
              })
              .catch(() => {})
          } else {
            await prisma.libraryBook
              .update({
                where: { id: book.id },
                data: { platformBookId: String(match.id) },
              })
              .catch(() => {})
          }
        }
      }
    } catch {}
  }

  if (mode === "read" && ebook) {
    return (
      <EReader
        book={ebook}
        defaultViewMode="book"
        libraryBookId={book.id}
        initialCloudPage={book.currentPage > 1 ? book.currentPage : undefined}
        shantiSlot={
          <ShantiTimer
            bookId={book.id}
            title={book.title}
            author={book.author}
            compact
          />
        }
      />
    )
  }

  if (mode === "physical") {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
        <ShantiTimer
          bookId={book.id}
          title={book.title}
          author={book.author}
          initialPage={book.currentPage}
          initialTotalPages={book.totalPages}
        />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#0B0B0D] bg-[radial-gradient(ellipse_at_top_right,rgba(200,66,0,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(244,178,43,0.08),transparent_50%)] flex items-center justify-center py-20 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
          backgroundSize: "24px 24px",
        }}
      />
      <ShantiModeChooser
        title={book.title}
        author={book.author}
        ebook={ebook ? { title: ebook.title, author: ebook.author } : null}
      />
    </div>
  )
}
