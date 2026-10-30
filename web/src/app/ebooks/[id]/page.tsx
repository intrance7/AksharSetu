import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getEbook } from "@/lib/gutenberg"
import { EReader } from "@/components/ebooks/EReader"
import { StartShantiButton } from "@/components/ebooks/StartShantiButton"

type Params = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ shanti?: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const book = await getEbook(Number((await params).id))
  return book
    ? {
        title: `Read ${book.title} by ${book.author} free online | AksharSetu`,
        description: `Read ${book.title} by ${book.author} free in the AksharSetu e-library.`,
      }
    : { title: "Book not found | AksharSetu" }
}

export default async function EbookReaderPage({ params, searchParams }: Params) {
  const id = Number((await params).id)
  const { shanti } = await searchParams
  const book = Number.isInteger(id) ? await getEbook(id) : null
  if (!book) notFound()

  return (
    <EReader
      {...book}
      defaultDark={shanti === "1"}
      leading={
        <Link
          id="reader-back"
          href="/ebooks"
          className="flex items-center gap-1.5 text-sm font-bold text-[#C84200] hover:text-[#A33500] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> E-Library
        </Link>
      }
      trailing={<StartShantiButton gutenbergId={book.id} title={book.title} author={book.author} />}
    />
  )
}
