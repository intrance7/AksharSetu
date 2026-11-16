import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, name, newPassword } = await req.json()

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required." },
        { status: 400 }
      )
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email address." },
        { status: 404 }
      )
    }

    // Verify account ownership via registered display name (if set on account)
    if (
      user.name &&
      name &&
      user.name.trim().toLowerCase() !== String(name).trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Account name does not match our records for this email." },
        { status: 403 }
      )
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: "Password updated! You can now sign in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    )
  }
}
