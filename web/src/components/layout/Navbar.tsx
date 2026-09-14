import Link from "next/link"
import { BookOpen, Menu } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(0,0,0,0.8)] text-[#f5f5f7] backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto flex h-12 items-center justify-between px-4 md:px-8 text-xs font-medium">
        
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-4 w-4" />
          <span className="font-semibold tracking-tight">AksharSetu</span>
        </Link>
        
        {/* Center: Links */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-8 text-[#cecece]">
          <Link href="/catalog" className="hover:text-white transition-colors">
            Browse Books
          </Link>
          <Link href="/leaderboard" className="hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About Us
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">
              Log In
            </Link>
            <Button variant="default" size="sm" className="h-6 text-[10px] px-3 font-semibold">
              List a Book
            </Button>
          </div>
          <button className="md:hidden text-[#f5f5f7] hover:text-white">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </button>
        </div>

      </div>
    </header>
  )
}

