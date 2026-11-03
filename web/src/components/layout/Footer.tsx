import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-[#1D1D1F]/10 bg-white">
      <div className="container mx-auto px-4 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-[#C84200]" />
              <span className="text-xl font-black tracking-tight text-[#1D1D1F]">
                Aksharसेतु
              </span>
            </Link>
            <p className="text-sm text-[#86868b] leading-relaxed">
              Bridging readers across every Indian campus and city through book
              sharing, 1-for-1 exchanges, verifiable NGO donations, and a free
              public-domain E-Library.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#1D1D1F]">
              Marketplace & Campus
            </h3>
            <ul className="space-y-2.5 text-sm font-medium text-[#86868b]">
              <li>
                <Link
                  href="/catalog"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Browse Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/campus"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Campus Textbook Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/map"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Books Near Me Map
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog/new"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Sell, Swap, or Donate a Book
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Wishlist Radar Alerts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#1D1D1F]">
              Reading & Community
            </h3>
            <ul className="space-y-2.5 text-sm font-medium text-[#86868b]">
              <li>
                <Link
                  href="/ebooks"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Free Legal E-Library
                </Link>
              </li>
              <li>
                <Link
                  href="/clubs"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Sabha Book Clubs
                </Link>
              </li>
              <li>
                <Link
                  href="/donations"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Vidya Daan NGO Drives
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Reader Leaderboards
                </Link>
              </li>
              <li>
                <Link
                  href="/requests"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Community Book Requests
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#1D1D1F]">
              About & Trust
            </h3>
            <ul className="space-y-2.5 text-sm font-medium text-[#86868b]">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/about#ngo"
                  className="hover:text-[#C84200] transition-colors"
                >
                  How Vidya Daan Works
                </Link>
              </li>
              <li>
                <Link
                  href="/about#trust"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Escrow Trust & Safety
                </Link>
              </li>
              <li>
                <Link
                  href="/about#privacy"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/about#terms"
                  className="hover:text-[#C84200] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#1D1D1F]/10 pt-6 sm:flex-row">
          <p className="text-xs font-medium text-[#86868b]">
            © {new Date().getFullYear()} Aksharसेतु. Built for students,
            readers, and literacy across India.
          </p>
          <div className="flex items-center gap-5 text-xs font-bold text-[#86868b]">
            <Link href="/about" className="hover:text-[#C84200] transition-colors">
              Mission
            </Link>
            <Link href="/campus" className="hover:text-[#C84200] transition-colors">
              Campus Hub
            </Link>
            <Link href="/clubs" className="hover:text-[#C84200] transition-colors">
              Sabha Clubs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
