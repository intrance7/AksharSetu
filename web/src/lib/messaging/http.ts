import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"

export class MessagingError extends Error {
  status: number
  code: string

  constructor(status: number, message: string, code = "MESSAGING_ERROR") {
    super(message)
    this.status = status
    this.code = code
  }
}

export interface SessionUser {
  id: string
  name: string
}

export async function requireUser(): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new MessagingError(401, "Please sign in to continue.", "UNAUTHENTICATED")
  }
  return { id: session.user.id, name: session.user.name || "Reader" }
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new MessagingError(400, "Invalid request body.", "BAD_REQUEST")
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof MessagingError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return NextResponse.json({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 })
  }
  console.error("[messaging]", error)
  return NextResponse.json(
    { error: "Something went wrong. Please try again.", code: "INTERNAL" },
    { status: 500 }
  )
}

/** Wraps a route handler so thrown MessagingErrors become typed JSON responses. */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorResponse(error)
    }
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function assertId(value: unknown, label = "id"): string {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new MessagingError(400, `Invalid ${label}.`, "BAD_REQUEST")
  }
  return value
}
