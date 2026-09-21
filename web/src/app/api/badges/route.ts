import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { requirementThreshold: 'asc' }
    })

    return NextResponse.json(badges)
  } catch (error) {
    console.error("Error fetching badges:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
