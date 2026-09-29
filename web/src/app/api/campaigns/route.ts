import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || !session.user?.id || session.user.role !== 'ADMIN') { // simple role check
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, ngoName, targetBooks, imageUrl } = body

    if (!title || !description || !ngoName || !targetBooks) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        ngoName,
        targetBooks: Number(targetBooks),
        imageUrl
      }
    });

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error("Campaign creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
