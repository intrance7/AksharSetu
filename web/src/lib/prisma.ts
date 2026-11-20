import { PrismaClient } from "@prisma/client"

function buildResilientDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) return undefined
  // Only append PostgreSQL pool/timeout params to postgres/postgresql URLs
  if (!/^postgres(ql)?:\/\//i.test(raw)) return raw
  try {
    const parsed = new URL(raw)
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "20")
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "20")
    }
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "10")
    }
    return parsed.toString()
  } catch {
    return raw
  }
}

const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1017", "P2024"])

function isTransientConnectionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as { code?: string; message?: string; name?: string }
  if (e.code && TRANSIENT_PRISMA_CODES.has(e.code)) return true
  const msg = String(e.message || "")
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Server has closed the connection") ||
    msg.includes("Connection terminated unexpectedly") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT")
  )
}

const createPrismaClient = () => {
  const url = buildResilientDatabaseUrl()
  const base = new PrismaClient(
    url ? { datasources: { db: { url } } } : undefined
  )

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          let lastError: unknown
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              return await query(args)
            } catch (err) {
              lastError = err
              if (!isTransientConnectionError(err) || attempt === 2) {
                throw err
              }
              await new Promise((r) => setTimeout(r, 350 * (attempt + 1)))
            }
          }
          throw lastError
        },
      },
    },
  }) as unknown as PrismaClient
}

declare const globalThis: {
  prismaGlobalV12?: PrismaClient
} & typeof global

const existing = globalThis.prismaGlobalV12
const prisma: PrismaClient =
  existing &&
  "bookNote" in existing &&
  "sellerReview" in existing &&
  "bookClub" in existing &&
  "conversation" in existing &&
  "bookOffer" in existing &&
  "xpTransaction" in existing &&
  "supportTicket" in existing
    ? existing
    : createPrismaClient()

globalThis.prismaGlobalV12 = prisma

export default prisma
