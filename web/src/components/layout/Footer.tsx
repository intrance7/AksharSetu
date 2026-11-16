import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-black/10 bg-white">
      <div className="container mx-auto px-4 py-14 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-[#0066cc]" />
              <span className="text-xl font-black tracking-tight text-[#1d1d1f]">
                Aksharसेतु
              </span>
            </Link>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Bridging readers across every Indian campus and city through book
              sharing, real-time messaging, Vidya Daan donations, and a unified
              literary progression ecosystem.
            </p>
          </div>

          {/* 1. AKSHARSETU */}
          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#1d1d1f]">
              AKSHARSETU
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-[#86868b]">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/help/welcome-to-aksharsetu"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/clubs"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Community (Sabha Clubs)
                </Link>
              </li>
              <li>
                <Link
                  href="/donations"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Vidya Daan NGO Drives
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* 2. EXPLORE */}
          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#1d1d1f]">
              EXPLORE
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-[#86868b]">
              <li>
                <Link
                  href="/catalog"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Browse Books
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog/new"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Sell a Book
                </Link>
              </li>
              <li>
                <Link
                  href="/library"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Reading Library
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Leaderboards
                </Link>
              </li>
              <li>
                <Link
                  href="/achievements"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Achievements & Badges
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. HELP */}
          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#1d1d1f]">
              HELP
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-[#86868b]">
              <li>
                <Link
                  href="/help"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/help/badges-and-achievements"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Badges Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/help/xp-and-levels"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  XP & Levels Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/help/account-security-and-privacy"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link
                  href="/support?category=BUG_REPORT"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. LEGAL */}
          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-wider text-[#1d1d1f]">
              LEGAL
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-[#86868b]">
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/community-guidelines"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/marketplace-policy"
                  className="hover:text-[#0066cc] transition-colors"
                >
                  Marketplace Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="hover:text-[#0066cc] transition-colors font-bold text-[#1d1d1f]"
                >
                  All 14 Policies →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row">
          <p className="text-xs font-medium text-[#86868b]">
            © {new Date().getFullYear()} Aksharसेतु. Built for students,
            readers, and literacy across India.
          </p>
          <div className="flex flex-wrap items-center gap-5 text-xs font-bold text-[#86868b]">
            <Link
              href="/help"
              className="hover:text-[#0066cc] transition-colors"
            >
              Help Center
            </Link>
            <Link
              href="/faq"
              className="hover:text-[#0066cc] transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/achievements"
              className="hover:text-[#0066cc] transition-colors"
            >
              Badge Vault
            </Link>
            <Link
              href="/support"
              className="hover:text-[#0066cc] transition-colors"
            >
              Support Desk
            </Link>
            <Link
              href="/legal"
              className="hover:text-[#0066cc] transition-colors"
            >
              Legal Hub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
