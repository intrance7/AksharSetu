import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Providers } from "@/components/Providers"
import { Toaster } from "sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
})

const BASE_URL =
  process.env.AUTH_URL || "https://aksharsetu-iota.vercel.app"

export const viewport: Viewport = {
  themeColor: "#C84200",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Aksharसेतु — Bridge Knowledge Through Books",
    template: "%s | Aksharसेतु",
  },
  description:
    "India's student & community book marketplace, 1-for-1 book swaps, Vidya Daan NGO book donations, and 70,000+ free public-domain E-Library with Shanti Mode.",
  keywords: [
    "AksharSetu",
    "used textbooks India",
    "book exchange India",
    "college textbooks",
    "book donation NGO",
    "Vidya Daan",
    "free ebooks India",
    "Shanti Mode",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Aksharसेतु — Bridge Knowledge Through Books",
    description:
      "Buy, swap, or donate textbooks & novels across Indian campuses, or read 70,000+ free classics in Shanti Mode.",
    url: BASE_URL,
    siteName: "Aksharसेतु",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aksharसेतु — Bridge Knowledge Through Books",
    description:
      "Student textbook marketplace, 1-for-1 swaps, Vidya Daan NGO donations, and free E-Library.",
  },
}

const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "AksharSetu",
      alternateName: "Aksharसेतु",
      url: BASE_URL,
      description:
        "Student and community book marketplace, 1-for-1 book exchange, Vidya Daan NGO book donation platform, and public-domain E-Library.",
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Aksharसेतु — Bridge Knowledge",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/catalog?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F2EBE1] text-[#1D1D1F]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
