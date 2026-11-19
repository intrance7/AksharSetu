import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const CATEGORY_BASE_MRP: Record<string, number> = {
  medical: 650,
  engineering: 480,
  "non-fiction": 340,
  fiction: 270,
  school: 240,
  other: 280,
}

const CONDITION_MULTIPLIER: Record<string, number> = {
  NEW: 0.72,
  LIKE_NEW: 0.58,
  GOOD: 0.45,
  FAIR: 0.32,
  POOR: 0.2,
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const title = typeof body?.title === "string" ? body.title : ""
    const author = typeof body?.author === "string" ? body.author : ""
    const category =
      typeof body?.category === "string" && body.category.trim()
        ? body.category.trim()
        : "other"
    const condition =
      typeof body?.condition === "string" && body.condition.trim()
        ? body.condition.trim()
        : "LIKE_NEW"
    const isBundle = Boolean(body?.isBundle)
    const booksInBundle = body?.booksInBundle ?? 1

    const clampScore = (v: unknown) => {
      const n = Number(v)
      return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 5
    }
    const fivePointSum =
      clampScore(body?.condCover) +
      clampScore(body?.condPages) +
      clampScore(body?.condHighlighting) +
      clampScore(body?.condNotes) +
      clampScore(body?.condBinding)
    const integrityPct = Math.max(
      20,
      Math.min(100, Math.round((fivePointSum / 25) * 100))
    )

    // Query live marketplace comps in the same category
    const comps = await prisma.book.findMany({
      where: {
        category: { equals: category, mode: "insensitive" },
        price: { gt: 0 },
        isBundle: false,
      },
      select: { price: true },
      take: 30,
      orderBy: { createdAt: "desc" },
    })

    const baseMrp = CATEGORY_BASE_MRP[category.toLowerCase()] || 300
    const condMult = CONDITION_MULTIPLIER[condition] || 0.5
    const sliderFactor = 0.7 + (integrityPct / 100) * 0.35

    let unitEstimate = Math.round(baseMrp * condMult * sliderFactor)

    if (comps.length >= 3) {
      const avgComp =
        comps.reduce((acc, c) => acc + c.price, 0) / comps.length
      unitEstimate = Math.round(unitEstimate * 0.65 + avgComp * 0.35)
    }

    const bundleCount = isBundle ? Math.max(2, Number(booksInBundle) || 2) : 1
    const bundleDiscount = isBundle ? 0.82 : 1
    const suggestedPrice = Math.max(
      40,
      Math.round((unitEstimate * bundleCount * bundleDiscount) / 10) * 10
    )
    const minPrice = Math.max(30, Math.round((suggestedPrice * 0.82) / 10) * 10)
    const maxPrice = Math.round((suggestedPrice * 1.18) / 10) * 10

    const gradeLabel =
      integrityPct >= 92
        ? "Collector / Mint Grade"
        : integrityPct >= 78
        ? "Clean Campus Grade"
        : integrityPct >= 60
        ? "Study-Worn Grade"
        : "Reading Copy Grade"

    let insight = `${gradeLabel} (${integrityPct}% condition integrity)${
      isBundle ? ` across ${bundleCount} bundled books (18% pack discount applied)` : ""
    }${
      comps.length >= 3
        ? `, calibrated against ${comps.length} recent ${category} listings.`
        : `, calibrated for fast student resale in ${category}.`
    }`

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (apiKey && apiKey !== "placeholder" && title.trim()) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
        const prompt = `In 1 concise sentence (under 150 chars), explain why ₹${suggestedPrice} (range ₹${minPrice}–₹${maxPrice}) is a fair Indian student resale price for "${title}"${
          author ? ` by ${author}` : ""
        } in ${condition} condition (${integrityPct}% integrity score).`
        const res = await model.generateContent(prompt)
        const aiText = res.response.text().trim()
        if (aiText) insight = aiText
      } catch {
        // Keep deterministic valuation insight
      }
    }

    return NextResponse.json({
      suggestedPrice,
      minPrice,
      maxPrice,
      integrityPct,
      gradeLabel,
      insight,
    })
  } catch (error) {
    console.error("Smart price estimator error:", error)
    return NextResponse.json(
      { error: "Could not compute price estimate" },
      { status: 500 }
    )
  }
}
