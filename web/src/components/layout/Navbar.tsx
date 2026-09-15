"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Menu } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    wasOpen.current = !!activeMenu
  }, [activeMenu])

  const handleMouseEnter = (label: string) => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current)
    setActiveMenu(label)
  }

  const handleMouseLeave = () => {
    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current)
    
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 150)
  }

  const activeNavData = navData.find((item) => item.label === activeMenu)

  return (
    <>
      <AnimatePresence>
        {activeMenu && activeNavData?.dropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
      <div className="sticky top-0 z-50 w-full h-12" onMouseLeave={handleMouseLeave}>
        <motion.div 
        className={`absolute top-0 left-0 w-full overflow-hidden backdrop-blur-md text-[#f5f5f7] border-b border-white/10 transition-colors duration-200 ease-in-out ${activeMenu && activeNavData?.dropdown ? 'bg-[#1d1d1f]/85 shadow-2xl' : 'bg-[rgba(0,0,0,0.8)]'}`}
        initial={false}
        animate={{ height: activeMenu && activeNavData?.dropdown ? "auto" : 48 }}
        transition={{ duration: wasOpen.current ? 0.4 : 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="w-full h-12">
          <div className="container mx-auto flex h-12 items-center justify-between px-4 md:px-8 text-xs font-medium">
            
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity z-50">
              <BookOpen className="h-4 w-4" />
              <span className="font-semibold tracking-tight">AksharSetu</span>
            </Link>
            
            {/* Center: Links */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-8 text-[#cecece] z-50 h-full">
              {navData.map((item) => (
                <div 
                  key={item.label}
                  className="h-full flex items-center"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                >
                  <Link href={item.href} className={`transition-colors ${activeMenu === item.label ? "text-white" : "hover:text-white"}`}>
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-6 z-50">
              <div className="hidden md:flex items-center gap-4">
                <Link href="/login" className="hover:text-white transition-colors">
                  Log In
                </Link>
                <Button variant="default" size="sm" className="h-6 text-[10px] px-3 font-semibold bg-[#f5f5f7] text-black hover:bg-white">
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

        {/* Mega Menu Dropdown */}
        <div 
          className={`w-full ${activeMenu && activeNavData?.dropdown ? 'pointer-events-auto' : 'pointer-events-none'}`}
          onMouseEnter={() => activeMenu && handleMouseEnter(activeMenu)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="container mx-auto px-4 md:px-8 py-12">
            <AnimatePresence>
              {activeMenu && activeNavData?.dropdown && (
                <motion.div
                  initial={{ y: -8 }}
                  animate={{ y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.17 }}
                  className="relative w-full"
                >
                  <AnimatePresence mode="popLayout">
                    <motion.div 
                      key={activeMenu}
                      custom={!wasOpen.current}
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="flex justify-center gap-12 md:gap-24 text-sm max-w-5xl mx-auto w-full"
                    >
                      {activeNavData.dropdown.columns.map((col, idx) => (
                        <motion.div 
                          key={idx} 
                          variants={columnVariants}
                          className={`flex flex-col gap-3 ${idx === 0 ? "min-w-[200px]" : "min-w-[140px]"}`}
                        >
                          <h3 className="text-[#86868b] text-[11px] font-semibold mb-2 tracking-wide">{col.title}</h3>
                          <div className="flex flex-col gap-3">
                            {col.links.map((link, lIdx) => (
                              <Link 
                                key={lIdx} 
                                href={link.href}
                                className={`text-[#f5f5f7] hover:text-white transition-colors ${
                                  idx === 0 
                                    ? "text-xl md:text-2xl font-bold tracking-tight mb-1" 
                                    : "text-[13px] font-medium"
                                }`}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
    </>
  )
}

const containerVariants = {
  hidden: {},
  show: (isFirstOpen: boolean) => ({
    transition: {
      staggerChildren: 0.05,
      delayChildren: isFirstOpen ? 0.17 : 0
    }
  }),
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
}

const columnVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.15, ease: "easeOut" } 
  }
}

const navData = [
  {
    label: "Browse Books",
    href: "/catalog",
    dropdown: {
      columns: [
        {
          title: "Explore Books",
          links: [
            { label: "All Categories", href: "/catalog" },
            { label: "Engineering", href: "/catalog?category=engineering" },
            { label: "Medical", href: "/catalog?category=medical" },
            { label: "Fiction", href: "/catalog?category=fiction" },
            { label: "Non-Fiction", href: "/catalog?category=non-fiction" },
          ]
        },
        {
          title: "Popular",
          links: [
            { label: "Bestsellers", href: "/catalog?sort=popular" },
            { label: "Recently Added", href: "/catalog?sort=new" },
            { label: "Free Books", href: "/catalog?price=free" },
          ]
        },
        {
          title: "More from AksharSetu",
          links: [
            { label: "Request a Book", href: "/request" },
            { label: "Book Bundles", href: "/bundles" },
          ]
        }
      ]
    }
  },
  {
    label: "Donate",
    href: "/donate",
    dropdown: {
      columns: [
        {
          title: "Vidya Daan",
          links: [
            { label: "How to Donate", href: "/donate/guide" },
            { label: "NGO Partners", href: "/donate/ngos" },
            { label: "Donation Leaderboard", href: "/leaderboard" },
          ]
        },
        {
          title: "Impact",
          links: [
            { label: "Success Stories", href: "/stories" },
            { label: "Community Badges", href: "/badges" },
          ]
        }
      ]
    }
  },
  {
    label: "About Us",
    href: "/about",
    dropdown: null
  }
]

