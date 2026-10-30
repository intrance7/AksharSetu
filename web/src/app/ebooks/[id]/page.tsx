import { notFound } from "next/navigation"
import { getEbook } from "@/lib/gutenberg"
import EReader, { ViewMode } from "@/components/ebooks/EReader"
import StartShantiButton from "@/components/ebooks/StartShantiButton"
import { coverUrl } from "@/lib/gutenberg"

export const revalidate = 86400

export default async function EbookReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}) {
  const { id } = await params
  const { view } = await searchParams
  if (!id) notFound()

  const book = await getEbook(id)
  if (!book) notFound()

  const defaultViewMode: ViewMode =
    view === "classic" ? "classic" : view === "scan" && book.embedUrl ? "scan" : "book"

  return (
    <div className="relative">
      <div className="fixed bottom-6 right-6 z-40">
        <StartShantiButton
          gutenbergId={book.id}
          title={book.title}
          author={book.author}
          coverImage={book.coverImage || coverUrl(book.id)}
          totalPages={Math.max(10, Math.ceil(book.paragraphs.length / 18))}
        />
      </div>
      <EReader book={book} defaultViewMode={defaultViewMode} />
    </div>
  )
}
