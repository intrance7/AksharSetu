import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.AUTH_URL || "https://aksharsetu-iota.vercel.app"

  const routes = [
    "",
    "/catalog",
    "/campus",
    "/map",
    "/clubs",
    "/ebooks",
    "/donations",
    "/requests",
    "/leaderboard",
    "/badges",
    "/about",
    "/login",
    "/register",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/catalog" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : route === "/catalog" ? 0.9 : 0.8,
  }))
}
