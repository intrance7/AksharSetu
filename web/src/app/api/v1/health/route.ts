import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const bookCount = await prisma.book.count({
      where: { status: "AVAILABLE" },
    })
    return NextResponse.json({
      status: "ok",
      service: "aksharsetu-api",
      apiVersion: "1.0",
      availableBooks: bookCount,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
