import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        favoriteQuote: true,
        quoteAuthor: true,
        location: true,
        latitude: true,
        longitude: true,
        liveStatus: true,
        isShantiModeActive: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      bio,
      location,
      name,
      latitude,
      longitude,
      image,
      favoriteQuote,
      quoteAuthor,
      liveStatus,
    } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(name !== undefined && { name }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(image !== undefined && { image }),
        ...(favoriteQuote !== undefined && { favoriteQuote }),
        ...(quoteAuthor !== undefined && { quoteAuthor }),
        ...(liveStatus !== undefined && { liveStatus }),
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        favoriteQuote: true,
        quoteAuthor: true,
        location: true,
        latitude: true,
        longitude: true,
        liveStatus: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
