import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params
    const donation = await prisma.donation.findUnique({
      where: { trackingId },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            image: true,
            location: true,
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            category: true,
            condition: true,
            images: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
            ngoName: true,
            description: true,
            status: true,
          },
        },
      },
    })

    if (!donation) {
      return NextResponse.json({ error: "Tracking ID not found" }, { status: 404 })
    }

    return NextResponse.json(donation)
  } catch (error) {
    console.error("Track donation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

