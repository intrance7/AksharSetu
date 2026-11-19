import prisma from "@/lib/prisma"

const RESERVED_USERNAMES = new Set([
  "me",
  "new",
  "edit",
  "settings",
  "admin",
  "api",
  "login",
  "register",
  "logout",
  "profile",
  "user",
  "users",
])

/**
 * Sanitizes a raw username handle:
 * - lowercase
 * - strips leading `@`
 * - collapses non-[a-z0-9_] runs into `_`
 * - trims leading/trailing `_`
 * - slices to 24 chars
 */
export function sanitizeUsername(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24)
    .replace(/_+$/g, "")
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase())
}

/**
 * Checks whether a username has a legacy auto-generated `_${uuid.slice(0,4)}` suffix.
 */
export function hasLegacyUuidSuffix(
  username: string | null | undefined,
  userId: string
): boolean {
  if (!username || !userId) return false
  const idPrefix = userId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4)
  if (!idPrefix) return false
  return username.toLowerCase().endsWith(`_${idPrefix}`)
}

/**
 * Derives a clean base handle from display name or email prefix.
 * Minimum 3 chars (falls back to `reader_<idSlice>`).
 */
export function generateBaseUsername(
  name?: string | null,
  email?: string | null,
  fallbackId?: string
): string {
  const fromName = name ? sanitizeUsername(name) : ""
  if (fromName.length >= 3 && !RESERVED_USERNAMES.has(fromName)) {
    return fromName.slice(0, 20).replace(/_+$/g, "")
  }

  const emailPrefix = email ? email.split("@")[0] : ""
  const fromEmail = emailPrefix ? sanitizeUsername(emailPrefix) : ""
  if (fromEmail.length >= 3 && !RESERVED_USERNAMES.has(fromEmail)) {
    return fromEmail.slice(0, 20).replace(/_+$/g, "")
  }

  if (fromName.length > 0 && !RESERVED_USERNAMES.has(`${fromName}_reader`)) {
    return `${fromName}_reader`.slice(0, 20)
  }

  const cleanFallback = (fallbackId || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6)

  return `reader_${cleanFallback || Math.random().toString(36).slice(2, 8)}`
}

/**
 * Ensures a specific user has a persisted unique `@username` in the database.
 * Also upgrades any legacy `_${uuid.slice(0,4)}` suffix (like `tanishqsethi_736e`)
 * to a clean handle (`tanishqsethi` or `tanishq_sethi`) when available.
 */
export async function ensureUserUsername(
  userId: string,
  hintName?: string | null,
  hintEmail?: string | null
): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, email: true },
  })

  if (!existing) {
    return generateBaseUsername(hintName, hintEmail, userId)
  }

  const currentClean = existing.username
    ? sanitizeUsername(existing.username)
    : ""
  const isLegacySuffix = hasLegacyUuidSuffix(existing.username, existing.id)

  if (
    existing.username &&
    currentClean.length >= 3 &&
    existing.username === currentClean &&
    !RESERVED_USERNAMES.has(currentClean) &&
    !isLegacySuffix
  ) {
    return existing.username
  }

  // If upgrading from a legacy `handle_736e`, prefer the stripped handle or clean name handle
  const strippedLegacy = isLegacySuffix && existing.username
    ? sanitizeUsername(
        existing.username.slice(0, existing.username.length - 5)
      )
    : ""

  const base =
    strippedLegacy.length >= 3 && !RESERVED_USERNAMES.has(strippedLegacy)
      ? strippedLegacy
      : generateBaseUsername(
          existing.name ?? hintName,
          existing.email ?? hintEmail,
          userId
        )

  for (let attempt = 1; attempt <= 12; attempt++) {
    let candidate = base
    if (attempt > 1 && attempt <= 8) {
      candidate = `${base.slice(0, 20)}_${attempt}`
    } else if (attempt > 8) {
      const rand = Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 4)
      candidate = `${base.slice(0, 19)}_${rand || attempt}`
    }

    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    })

    if (!taken || taken.id === userId) {
      try {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { username: candidate },
          select: { username: true },
        })
        if (updated.username) return updated.username
      } catch (err: any) {
        if (err?.code === "P2002") {
          continue
        }
        throw err
      }
    }
  }

  if (existing.username && currentClean.length >= 3) {
    return existing.username
  }

  const fallbackCandidate = `reader_${userId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8)}`
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username: fallbackCandidate },
    })
  } catch {}
  return fallbackCandidate
}

let backfilled = false
let backfillPromise: Promise<void> | null = null

/**
 * Memoized per-process backfill that ensures every existing user in the database
 * has a clean unique `@username` (and upgrades any legacy `_${id.slice(0,4)}` suffix).
 */
export async function ensureAllUsersHaveUsernames(): Promise<void> {
  if (backfilled) return
  if (backfillPromise) return backfillPromise

  backfillPromise = (async () => {
    try {
      const allUsers = await prisma.user.findMany({
        select: { id: true, username: true, name: true, email: true },
        orderBy: { createdAt: "asc" },
      })

      for (const u of allUsers) {
        if (
          !u.username ||
          u.username !== sanitizeUsername(u.username) ||
          hasLegacyUuidSuffix(u.username, u.id)
        ) {
          await ensureUserUsername(u.id, u.name, u.email)
        }
      }
      backfilled = true
    } catch (err) {
      console.error("Failed to backfill usernames:", err)
    } finally {
      backfillPromise = null
    }
  })()

  return backfillPromise
}
