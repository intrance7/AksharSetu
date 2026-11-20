/**
 * Client-side cookie helpers for AksharSetu user preferences, reader settings,
 * and first-time onboarding state.
 */

export const COOKIE_KEYS = {
  ONBOARDED: "akshar_onboarded",
  USER_PREFS: "akshar_prefs",
  READER_PREFS: "akshar_reader_prefs",
  COOKIE_CONSENT: "akshar_cookie_consent",
} as const

export interface UserPrefsCookie {
  genres?: string[]
  city?: string
  intent?: string
  readingGoal?: number
}

export interface ReaderPrefsCookie {
  theme?: "light" | "sepia" | "dark"
  font?: "serif" | "sans"
  fontSize?: number
  viewMode?: "classic" | "book" | "scanned"
}

export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const prefix = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(";")
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      try {
        return decodeURIComponent(trimmed.slice(prefix.length))
      } catch {
        return trimmed.slice(prefix.length)
      }
    }
  }
  return null
}

export function setClientCookie(name: string, value: string, days = 180) {
  if (typeof document === "undefined") return
  const maxAge = Math.floor(days * 24 * 60 * 60)
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : ""
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

export function getJsonCookie<T>(name: string): T | null {
  const raw = getClientCookie(name)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setJsonCookie<T>(name: string, value: T, days = 180) {
  try {
    setClientCookie(name, JSON.stringify(value), days)
  } catch {}
}
