import { NextResponse } from "next/server"
import { ensureDefaultBadges } from "@/services/badgeService"

export async function GET() {
  try {
    const badges = await ensureDefaultBadges()
    return NextResponse.json(badges)
  } catch (error) {
    console.error("Error fetching badges:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
