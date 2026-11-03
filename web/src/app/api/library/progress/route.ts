import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { libraryBookId, bookKey, currentPage, totalPages } = body

    const pageNum = Math.max(1, Number(currentPage) || 1)
    const totalNum = Math.max(pageNum, Number(totalPages) || 250)

    let targetBook = null

    if (libraryBookId) {
      targetBook = await prisma.libraryBook.findFirst({
        where: { id: String(libraryBookId), userId: session.user.id },
      })
    } else if (bookKey !== undefined && bookKey !== null) {
      const keyStr = String(bookKey)
      if (/^\d+$/.test(keyStr)) {
        targetBook = await prisma.libraryBook.findFirst({
          where: { userId: session.user.id, gutenbergId: Number(keyStr) },
        })
      } else {
        targetBook = await prisma.libraryBook.findFirst({
          where: { userId: session.user.id, platformBookId: keyStr },
        })
      }
    }

    if (!targetBook) {
      return NextResponse.json({ synced: false }, { status: 200 })
    }

    const nextStatus =
      pageNum >= totalNum
        ? "READ"
        : targetBook.status === "WANT_TO_READ" && pageNum > 1
          ? "READING"
          : targetBook.status

    const updated = await prisma.libraryBook.update({
      where: { id: targetBook.id },
      data: {
        currentPage: pageNum,
        totalPages: totalNum,
        status: nextStatus,
      },
    })

    return NextResponse.json({ synced: true, book: updated })
  } catch (error) {
    console.error("Progress sync error:", error)
    return NextResponse.json({ error: "Failed to sync progress" }, { status: 500 })
  }
}

