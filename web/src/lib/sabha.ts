import crypto from "crypto"

export function generateSabhaCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.randomBytes(6)
  let suffix = ""
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(bytes[i] % chars.length)
  }
  return `SABHA-${suffix}`
}
