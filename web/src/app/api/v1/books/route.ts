import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

// In-memory per-IP rate limiter (60 req/min); upgrade to Upstash Redis when multi-region horizontally scaled
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now()
  if (rateBuckets.size > 1000) {
    for (const [k, v] of rateBuckets.entries()) {
      if (now > v.resetAt) rateBuckets.delete(k)
    }
  }
  const entry = rateBuckets.get(ip)
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) {
    return false
  }
  entry.count += 1
  return true
}

export async function GET(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please retry in 60 seconds.",
          },
        },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    )
    const q = searchParams.get("q")?.trim()
    const category = searchParams.get("category")?.trim()
    const condition = searchParams.get("condition")?.trim()
    const university = searchParams.get("university")?.trim()

    const where: Prisma.BookWhereInput = {
      status: "AVAILABLE",
    }

    if (category && category !== "all") {
      where.category = { equals: category, mode: "insensitive" }
    }
    if (condition) {
      where.condition = condition
    }
    if (university) {
      where.university = { contains: university, mode: "insensitive" }
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { isbn: { contains: q, mode: "insensitive" } },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          author: true,
          isbn: true,
          category: true,
          condition: true,
          price: true,
          acceptsExchange: true,
          deliveryType: true,
          isBundle: true,
          booksInBundle: true,
          university: true,
          course: true,
          semester: true,
          images: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              location: true,
              sellerRating: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      meta: {
        apiVersion: "1.0",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("API v1 books error:", error)
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch catalog listings.",
        },
      },
      { status: 500 }
    )
  }
}
