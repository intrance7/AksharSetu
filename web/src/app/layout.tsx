import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.AUTH_URL || "https://aksharsetu-iota.vercel.app"
  ),
  title: {
    default: "Aksharसेतु — Bridge Knowledge Through Books",
    template: "%s | Aksharसेतु",
  },
  description:
    "India's student & community book exchange, textbook resale, free public-domain E-Library with Shanti Mode, and Vidya Daan NGO book donation platform.",
  keywords: [
    "AksharSetu",
    "book exchange India",
    "college textbooks",
    "book donation NGO",
    "Vidya Daan",
    "free ebooks India",
    "Shanti Mode",
  ],
  openGraph: {
    title: "Aksharसेतु — Bridge Knowledge Through Books",
    description:
      "Buy, swap, or donate textbooks & novels across Indian campuses, or read 70,000+ free classics in Shanti Mode.",
    siteName: "Aksharसेतु",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aksharसेतु — Bridge Knowledge Through Books",
    description:
      "Student textbook marketplace, 1-for-1 swaps, Vidya Daan NGO donations, and free E-Library.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Silkscreen:wght@400;700&family=Momo+Trust+Display&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Caveat:wght@400..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,512&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#F2EBE1] text-gray-900">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
