import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")
    if (!slug) {
      return NextResponse.json({ helpfulCount: 0, notHelpfulCount: 0 })
    }

    const [helpfulCount, notHelpfulCount] = await Promise.all([
      prisma.helpArticleFeedback.count({ where: { slug, helpful: true } }),
      prisma.helpArticleFeedback.count({ where: { slug, helpful: false } }),
    ])

    return NextResponse.json({ helpfulCount, notHelpfulCount })
  } catch {
    return NextResponse.json({ helpfulCount: 0, notHelpfulCount: 0 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const slug = String(body.slug || "").trim()
    const helpful = Boolean(body.helpful)

    if (!slug) {
      return NextResponse.json({ error: "Missing article slug" }, { status: 400 })
    }

    await prisma.helpArticleFeedback.create({
      data: {
        slug,
        userId: session?.user?.id || null,
        helpful,
      },
    })

    const [helpfulCount, notHelpfulCount] = await Promise.all([
      prisma.helpArticleFeedback.count({ where: { slug, helpful: true } }),
      prisma.helpArticleFeedback.count({ where: { slug, helpful: false } }),
    ])

    return NextResponse.json({ helpfulCount, notHelpfulCount, recorded: true })
  } catch (error) {
    console.error("Help feedback error:", error)
    return NextResponse.json(
      { error: "Failed to record feedback" },
      { status: 500 }
    )
  }
}
