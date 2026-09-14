import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold tracking-tight">AksharSetu</span>
            </Link>
            <p className="text-sm text-gray-500">
              Bridging people through knowledge via book resale and donations. Let's make books accessible to everyone.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/catalog" className="hover:text-blue-600">Browse Books</Link></li>
              <li><Link href="/sell" className="hover:text-blue-600">Sell a Book</Link></li>
              <li><Link href="/donate" className="hover:text-emerald-600">Donate (Vidya Daan)</Link></li>
              <li><Link href="/wishlist" className="hover:text-blue-600">Wishlist Alerts</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Community</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-blue-600">About Us</Link></li>
              <li><Link href="/ngo" className="hover:text-blue-600">NGO Partnerships</Link></li>
              <li><Link href="/leaderboard" className="hover:text-blue-600">Leaderboard</Link></li>
              <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link href="/trust" className="hover:text-blue-600">Trust & Safety</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} AksharSetu. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social Icons would go here */}
          </div>
        </div>
      </div>
    </footer>
  )
}
