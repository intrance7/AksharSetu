import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"

const RESET_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "aksharsetu-local-dev-reset-secret"

function createResetToken(userId: string, email: string, pwdHash: string | null) {
  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
  const payload = `${userId}:${email.toLowerCase()}:${(pwdHash || "").slice(0, 12)}:${expiresAt}`
  const sig = crypto
    .createHmac("sha256", RESET_SECRET)
    .update(payload)
    .digest("hex")
  return `${Buffer.from(payload).toString("base64url")}.${sig}`
}

function verifyResetToken(
  token: string,
  userId: string,
  email: string,
  pwdHash: string | null
): boolean {
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [encodedPayload, sig] = parts
  let decoded = ""
  try {
    decoded = Buffer.from(encodedPayload, "base64url").toString("utf8")
  } catch {
    return false
  }
  const segments = decoded.split(":")
  if (segments.length !== 4) return false
  const [tUserId, tEmail, tHashPrefix, expStr] = segments
  const expiresAt = Number(expStr)
  if (!expiresAt || Math.floor(Date.now() / 1000) > expiresAt) {
    return false
  }
  if (
    tUserId !== userId ||
    tEmail !== email.toLowerCase() ||
    tHashPrefix !== (pwdHash || "").slice(0, 12)
  ) {
    return false
  }

  const expectedSig = crypto
    .createHmac("sha256", RESET_SECRET)
    .update(decoded)
    .digest("hex")

  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

export async function POST(req: Request) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      )
    }
    const action = body.action || "reset"
    const normalizedEmail = String(body.email || "")
      .trim()
      .toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Registered email address is required." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Step 1: Request a signed time-limited reset token after verifying current password or active session
    if (action === "request_token") {
      const session = await auth()
      const isSameSessionUser =
        session?.user?.id && user && session.user.id === user.id

      if (!user) {
        return NextResponse.json(
          { error: "No account found with that email address." },
          { status: 404 }
        )
      }

      if (!isSameSessionUser) {
        const currentPassword = String(body.currentPassword || "")
        if (!currentPassword || !user.password) {
          return NextResponse.json(
            {
              error:
                "For security, please enter your current password or sign in via Google/Support to request a password reset.",
            },
            { status: 403 }
          )
        }
        const matches = await bcrypt.compare(currentPassword, user.password)
        if (!matches) {
          return NextResponse.json(
            { error: "Current password verification failed." },
            { status: 403 }
          )
        }
      }

      const resetToken = createResetToken(
        user.id,
        user.email || normalizedEmail,
        user.password
      )
      return NextResponse.json({
        success: true,
        resetToken,
        expiresInMinutes: 15,
      })
    }

    // Step 2: Execute password update using verified resetToken or currentPassword
    const newPassword = String(body.newPassword || "")
    const resetToken = String(body.resetToken || "")
    const currentPassword = String(body.currentPassword || "")

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email address." },
        { status: 404 }
      )
    }

    const session = await auth()
    const isAuthenticatedOwner =
      Boolean(session?.user?.id) && session?.user?.id === user.id

    let authorized = false
    if (
      resetToken &&
      verifyResetToken(
        resetToken,
        user.id,
        user.email || normalizedEmail,
        user.password
      )
    ) {
      authorized = true
    } else if (currentPassword && user.password) {
      authorized = await bcrypt.compare(currentPassword, user.password)
    } else if (isAuthenticatedOwner && !user.password) {
      // OAuth user setting an initial password while signed in
      authorized = true
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "Unauthorized password change attempt. Please verify your current password or open a verified Account Access ticket at /support.",
        },
        { status: 403 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: "Password updated securely. You can now sign in.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    )
  }
}
