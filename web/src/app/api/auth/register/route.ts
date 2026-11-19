import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {
  ensureUserUsername,
  isReservedUsername,
  sanitizeUsername,
} from "@/lib/username"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
    }

    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : ""
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const requestedUsername =
      typeof body?.username === "string" && body.username.trim()
        ? sanitizeUsername(body.username)
        : ""

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      )
    }

    if (requestedUsername && (requestedUsername.length < 3 || isReservedUsername(requestedUsername))) {
      return NextResponse.json(
        {
          error: isReservedUsername(requestedUsername)
            ? "That @username is reserved. Please choose another handle."
            : "Username must be at least 3 characters (letters, numbers, underscore).",
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      )
    }

    if (requestedUsername) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: requestedUsername },
        select: { id: true },
      })
      if (existingUsername) {
        return NextResponse.json(
          { error: "That @username is already taken." },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in db
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ...(requestedUsername ? { username: requestedUsername } : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    })

    const finalUsername =
      user.username || (await ensureUserUsername(user.id, user.name, user.email))

    return NextResponse.json({ ...user, username: finalUsername }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email or @username already exists." },
        { status: 400 }
      )
    }
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "An error occurred during registration." },
      { status: 500 }
    )
  }
}
