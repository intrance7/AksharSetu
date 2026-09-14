import Link from "next/link"
import { BookOpen, Menu } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#faf9f6]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-[#0b1b3d] p-2 rounded-lg">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#0b1b3d]">AksharSetu</span>
        </div>
        
        {/* Center: Links */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-8 text-sm font-semibold text-[#4b5563]">
          <Link href="/catalog" className="hover:text-[#0b1b3d] transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-[#f97316] after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left pb-1">
            Browse Books
          </Link>
          <Link href="/leaderboard" className="hover:text-[#0b1b3d] transition-colors pb-1">
            Leaderboard
          </Link>
          <Link href="/about" className="hover:text-[#0b1b3d] transition-colors pb-1">
            About Us
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold text-[#0b1b3d] hover:text-[#f97316] transition-colors">
              Log In
            </Link>
            <Button variant="primary" className="px-6 rounded-full h-10">
              List a Book
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden text-[#0b1b3d]">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>

      </div>
    </header>
  )
}

