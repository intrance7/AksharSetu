import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const description =
      typeof body?.description === "string" ? body.description.trim() : ""
    const ngoName = typeof body?.ngoName === "string" ? body.ngoName.trim() : ""
    const targetBooks = Math.round(Number(body?.targetBooks))
    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() || null : null

    if (
      !title ||
      !description ||
      !ngoName ||
      !Number.isFinite(targetBooks) ||
      targetBooks < 1
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.create({
      data: {
        title: title.slice(0, 140),
        description: description.slice(0, 2000),
        ngoName: ngoName.slice(0, 120),
        targetBooks,
        imageUrl,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error("Campaign creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
