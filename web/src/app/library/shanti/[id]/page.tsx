import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { getEbook } from "@/lib/gutenberg"
import ShantiSession from "@/components/library/ShantiSession"

export default async function ShantiModePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const book = await prisma.libraryBook.findUnique({
    where: { id },
  })

  if (!book || book.userId !== session.user.id) {
    notFound()
  }

  let paragraphs: string[] = []
  let resolvedGutenbergId: number | null = book.gutenbergId

  const sourceId =
    book.gutenbergId ||
    (book.platformBookId && /^(ia-|ol-|gb-|pg-|\d+)/.test(book.platformBookId)
      ? book.platformBookId
      : null)

  if (sourceId) {
    const ebook = await getEbook(sourceId)
    if (ebook && ebook.paragraphs.length > 0) {
      paragraphs = ebook.paragraphs
    }
  } else {
    try {
      const results = await (await import("@/lib/gutenberg")).searchEbooks(book.title)
      const match = results.find(
        (r) =>
          r.title.toLowerCase().includes(book.title.toLowerCase().slice(0, 12)) ||
          book.title.toLowerCase().includes(r.title.toLowerCase().slice(0, 12))
      )
      if (match) {
        const ebook = await getEbook(match.id)
        if (ebook && ebook.paragraphs.length > 0) {
          paragraphs = ebook.paragraphs
          if (typeof match.id === "number") {
            resolvedGutenbergId = match.id
            await prisma.libraryBook.update({
              where: { id: book.id },
              data: { gutenbergId: match.id },
            })
          }
        }
      }
    } catch {}
  }

  return (
    <ShantiSession
      book={{
        id: book.id,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage,
        currentPage: book.currentPage,
        totalPages: book.totalPages,
        gutenbergId: resolvedGutenbergId,
      }}
      paragraphs={paragraphs}
    />
  )
}
