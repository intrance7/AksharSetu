import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.AUTH_URL || "https://aksharsetu-iota.vercel.app"

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/catalog",
          "/campus",
          "/map",
          "/clubs",
          "/ebooks",
          "/donations",
          "/requests",
          "/leaderboard",
          "/achievements",
          "/badges",
          "/help",
          "/faq",
          "/legal",
          "/about",
        ],
        disallow: [
          "/admin",
          "/api/",
          "/messages",
          "/orders",
          "/checkout",
          "/wishlist",
          "/login",
          "/register",
          "/forgot-password",
          "/profile/inbox",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
