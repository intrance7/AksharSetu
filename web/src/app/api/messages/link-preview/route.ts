import { NextResponse } from "next/server"
import { auth } from "@/auth"

function isSafePublicUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
    const host = parsed.hostname.toLowerCase()
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function extractMeta(html: string, property: string): string | null {
  const regex1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  )
  const m1 = html.match(regex1)
  if (m1?.[1]) return m1[1].trim()

  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  )
  const m2 = html.match(regex2)
  return m2?.[1]?.trim() || null
}

// GET /api/messages/link-preview?url=...
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const rawUrl = searchParams.get("url") || ""
    const safeUrl = isSafePublicUrl(rawUrl)

    if (!safeUrl) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)

    const res = await fetch(safeUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "AksharSetu-LinkPreview/1.0",
        Accept: "text/html",
      },
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      return NextResponse.json({ error: "Unreachable" }, { status: 404 })
    }

    const html = (await res.text()).slice(0, 60000)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)

    const title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      titleMatch?.[1]?.trim() ||
      safeUrl.hostname
    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      null
    const siteName = extractMeta(html, "og:site_name") || safeUrl.hostname

    return NextResponse.json({
      url: safeUrl.toString(),
      hostname: safeUrl.hostname,
      title: title.slice(0, 120),
      description: description ? description.slice(0, 180) : null,
      siteName: siteName.slice(0, 60),
    })
  } catch {
    return NextResponse.json({ error: "Preview unavailable" }, { status: 404 })
  }
}
