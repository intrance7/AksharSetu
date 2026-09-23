import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-[#1D1D1F]/10 bg-white">
      <div className="container mx-auto px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-[#C84200]" />
              <span className="text-xl font-bold tracking-tight text-[#1D1D1F]">Aksharसेतु</span>
            </Link>
            <p className="text-sm text-[#86868b]">
              Bridging people through knowledge via book resale and donations. Let's make books accessible to everyone.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1D1D1F]">Platform</h3>
            <ul className="space-y-2 text-sm text-[#86868b]">
              <li><Link href="/catalog" className="hover:text-[#C84200] transition-colors">Browse Books</Link></li>
              <li><Link href="/sell" className="hover:text-[#C84200] transition-colors">Sell a Book</Link></li>
              <li><Link href="/donate" className="hover:text-[#C84200] transition-colors">Donate (Vidya Daan)</Link></li>
              <li><Link href="/wishlist" className="hover:text-[#C84200] transition-colors">Wishlist Alerts</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1D1D1F]">Community</h3>
            <ul className="space-y-2 text-sm text-[#86868b]">
              <li><Link href="/about" className="hover:text-[#C84200] transition-colors">About Us</Link></li>
              <li><Link href="/ngo" className="hover:text-[#C84200] transition-colors">NGO Partnerships</Link></li>
              <li><Link href="/leaderboard" className="hover:text-[#C84200] transition-colors">Leaderboard</Link></li>
              <li><Link href="/blog" className="hover:text-[#C84200] transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#1D1D1F]">Legal</h3>
            <ul className="space-y-2 text-sm text-[#86868b]">
              <li><Link href="/terms" className="hover:text-[#C84200] transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#C84200] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/trust" className="hover:text-[#C84200] transition-colors">Trust & Safety</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#1D1D1F]/10 pt-6 sm:flex-row">
          <p className="text-xs text-[#86868b]">
            © {new Date().getFullYear()} Aksharसेतु. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social Icons would go here */}
          </div>
        </div>
      </div>
    </footer>
  )
}

