import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aksharसेतु — Bridge Knowledge Through Books",
    short_name: "Aksharसेतु",
    description:
      "Student textbook marketplace, 1-for-1 swaps, Vidya Daan NGO book donations, and free E-Library with Shanti Mode.",
    start_url: "/catalog",
    display: "standalone",
    background_color: "#F2EBE1",
    theme_color: "#C84200",
    categories: ["books", "education", "shopping"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
