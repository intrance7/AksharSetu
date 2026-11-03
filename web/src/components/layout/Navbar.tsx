"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Menu, X, User, MapPin, ChevronDown } from "lucide-react"
import { NotificationBell } from "./NotificationBell"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { motion, AnimatePresence, Variants } from "framer-motion"

export function Navbar() {
  const { data: session } = useSession()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [menuHeight, setMenuHeight] = useState<number>(64)
  const contentRef = useRef<HTMLDivElement>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    wasOpen.current = !!activeMenu
  }, [activeMenu])

  const activeNavData = navData.find((item) => item.label === activeMenu)

  useEffect(() => {
    if (!contentRef.current) return

    if (!activeMenu || !activeNavData?.dropdown) {
      setMenuHeight(64)
      return
    }

    const updateHeight = () => {
      if (contentRef.current) {
        const height =
          contentRef.current.offsetHeight || contentRef.current.scrollHeight
        if (height > 0) setMenuHeight(height)
      }
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })

    observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [activeMenu, activeNavData])

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

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <>
      <AnimatePresence>
        {activeMenu && activeNavData?.dropdown && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-black/20"
          />
        )}
      </AnimatePresence>

      <div
        className="sticky top-0 z-50 w-full h-16"
        onMouseLeave={handleMouseLeave}
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
      >
        <motion.div
          className={`absolute top-0 left-0 w-full overflow-hidden text-[#C84200] border-b border-[#C84200]/20 transition-colors duration-200 ease-in-out ${
            activeMenu && activeNavData?.dropdown
              ? "bg-[#F2EBE1]/90 backdrop-blur-xl shadow-2xl"
              : "bg-[#F2EBE1]/75 backdrop-blur-md"
          }`}
          initial={false}
          animate={{
            height: activeMenu && activeNavData?.dropdown ? menuHeight : 64,
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div ref={contentRef} className="w-full flex flex-col">
            <header className="w-full h-16 shrink-0">
              <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-4 md:px-8 font-medium">
                {/* Left: Logo */}
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity z-50 shrink-0"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="font-black tracking-tight text-lg md:text-xl">
                    Aksharसेतु
                  </span>
                </Link>

                {/* Center: Links */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-7 lg:gap-9 text-[#C84200] z-50 h-full">
                  {navData.map((item) => (
                    <div
                      key={item.label}
                      className="h-full flex items-center"
                      onMouseEnter={() => handleMouseEnter(item.label)}
                    >
                      <Link
                        href={item.href}
                        className={`transition-colors font-black uppercase tracking-wider text-sm whitespace-nowrap ${
                          activeMenu === item.label
                            ? "text-[#C84200] underline underline-offset-8 decoration-2"
                            : "hover:text-[#A33500]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </div>
                  ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 z-50 shrink-0">
                  <div className="hidden md:flex items-center gap-3">
                    <Link
                      href="/map"
                      className="text-[#C84200] hover:text-[#A33500] transition-colors p-2 rounded-full hover:bg-[#C84200]/10"
                      title="Books Near Me Map"
                    >
                      <MapPin className="h-5 w-5" />
                    </Link>

                    {!session && (
                      <Link
                        href="/login"
                        className="hover:text-[#A33500] font-black uppercase tracking-wider text-sm transition-colors"
                      >
                        Log In
                      </Link>
                    )}

                    <Link href="/catalog/new">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-9 text-xs px-5 font-black uppercase tracking-wider bg-[#C84200] text-[#F2EBE1] hover:bg-[#A33500] rounded-full shadow-md"
                      >
                        List a Book
                      </Button>
                    </Link>

                    {session && (
                      <div className="flex items-center gap-3 ml-1 pl-3 border-l border-[#C84200]/20">
                        <NotificationBell userId={session.user?.id || ""} />
                        <Link
                          href={`/profile/${session.user?.id || "me"}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <span className="text-sm font-bold text-[#C84200] max-w-[100px] truncate">
                            {session.user?.name?.split(" ")[0] ||
                              session.user?.email?.split("@")[0] ||
                              "Reader"}
                          </span>
                          <div className="h-8 w-8 bg-[#C84200]/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-[#C84200]/20">
                            {session.user?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={session.user.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-[#C84200]" />
                            )}
                          </div>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="cursor-pointer hover:text-[#A33500] font-black uppercase tracking-wider text-xs transition-colors px-2.5 py-1 rounded-full bg-[#C84200]/10"
                          >
                            Admin
                          </Link>
                        )}
                        <button
                          onClick={() => signOut()}
                          className="cursor-pointer hover:text-[#A33500] font-black uppercase tracking-wider text-xs transition-colors opacity-65 whitespace-nowrap"
                        >
                          Log Out
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex md:hidden items-center gap-2">
                    {session && (
                      <NotificationBell userId={session.user?.id || ""} />
                    )}
                    <button
                      type="button"
                      onClick={() => setMobileOpen((prev) => !prev)}
                      className="p-2 rounded-full text-[#C84200] hover:bg-[#C84200]/10 transition-colors"
                      aria-label="Toggle Menu"
                    >
                      {mobileOpen ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Menu className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Desktop Mega Menu Dropdown */}
            <div
              className={`w-full hidden md:block ${
                activeMenu && activeNavData?.dropdown
                  ? "pointer-events-auto"
                  : "pointer-events-none"
              }`}
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
                      transition={{
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.12,
                      }}
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
                              className={`flex flex-col gap-3 ${
                                idx === 0 ? "min-w-[200px]" : "min-w-[150px]"
                              }`}
                            >
                              <h3 className="text-[#C84200]/75 text-xs md:text-sm font-black uppercase mb-3 tracking-widest">
                                {col.title}
                              </h3>
                              <div className="flex flex-col gap-3.5">
                                {col.links.map((link, lIdx) => (
                                  <Link
                                    key={lIdx}
                                    href={link.href}
                                    onClick={() => setActiveMenu(null)}
                                    className={`text-[#C84200] hover:text-[#A33500] transition-colors ${
                                      idx === 0
                                        ? "text-xl md:text-2xl font-black uppercase tracking-tight mb-1"
                                        : "text-[14px] md:text-base font-bold uppercase tracking-wider"
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
          </div>
        </motion.div>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              className="fixed top-16 inset-x-0 z-50 bg-[#F2EBE1] border-b border-[#C84200]/20 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto md:hidden px-5 py-6"
            >
              <div className="flex flex-col gap-2">
                {navData.map((item) => {
                  const hasSub = Boolean(item.dropdown)
                  const isOpen = mobileExpanded === item.label
                  return (
                    <div
                      key={item.label}
                      className="border-b border-[#C84200]/10 pb-2"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="py-2 text-lg font-black uppercase tracking-wide text-[#C84200]"
                        >
                          {item.label}
                        </Link>
                        {hasSub && (
                          <button
                            type="button"
                            onClick={() =>
                              setMobileExpanded(isOpen ? null : item.label)
                            }
                            className="p-2 text-[#C84200]"
                            aria-label={`Expand ${item.label}`}
                          >
                            <ChevronDown
                              className={`w-5 h-5 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {hasSub && isOpen && item.dropdown && (
                        <div className="pl-3 pb-3 pt-1 flex flex-col gap-4">
                          {item.dropdown.columns.map((col, idx) => (
                            <div key={idx} className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-black uppercase tracking-widest text-[#C84200]/60">
                                {col.title}
                              </span>
                              {col.links.map((l, lIdx) => (
                                <Link
                                  key={lIdx}
                                  href={l.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="text-sm font-bold text-[#1D1D1F] hover:text-[#C84200] py-1"
                                >
                                  {l.label}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/map"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white text-[#1D1D1F] font-bold text-xs border border-black/10"
                  >
                    <MapPin className="w-4 h-4 text-[#C84200]" /> Books Near Me
                  </Link>
                  <Link
                    href="/catalog/new"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#C84200] text-white font-black uppercase tracking-wider text-xs shadow-sm"
                  >
                    + List a Book
                  </Link>
                </div>

                {session ? (
                  <div className="mt-2 pt-3 border-t border-[#C84200]/15 flex items-center justify-between">
                    <Link
                      href={`/profile/${session.user?.id || "me"}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 font-bold text-sm text-[#1D1D1F]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#C84200]/15 flex items-center justify-center text-[#C84200] overflow-hidden">
                        {session.user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={session.user.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <span>
                        {session.user?.name ||
                          session.user?.email?.split("@")[0] ||
                          "My Profile"}
                      </span>
                    </Link>

                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="text-xs font-black uppercase tracking-wider text-[#C84200] px-2.5 py-1 rounded-full bg-[#C84200]/10"
                        >
                          Admin
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false)
                          signOut()
                        }}
                        className="text-xs font-black uppercase tracking-wider text-[#1D1D1F]/70 hover:text-[#C84200]"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-3 rounded-full bg-[#1D1D1F] text-white text-center font-bold text-sm"
                  >
                    Sign In to Aksharसेतु
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

const containerVariants = {
  hidden: {},
  show: (isFirstOpen: boolean) => ({
    transition: {
      staggerChildren: 0.05,
      delayChildren: isFirstOpen ? 0.14 : 0,
    },
  }),
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
}

const columnVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeOut" },
  },
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
          ],
        },
        {
          title: "Popular",
          links: [
            { label: "Most Popular", href: "/catalog?sort=popular" },
            { label: "Recently Added", href: "/catalog?sort=new" },
            { label: "Free Donations", href: "/catalog?price=free" },
            { label: "1-for-1 Book Swaps", href: "/catalog?price=exchange" },
          ],
        },
        {
          title: "Campus & Local",
          links: [
            { label: "Campus Textbook Hub", href: "/campus" },
            { label: "Semester Bundles", href: "/catalog?bundles=true" },
            { label: "Books Near Me Map", href: "/map" },
            { label: "Request a Book", href: "/requests" },
          ],
        },
      ],
    },
  },
  {
    label: "Donate",
    href: "/donations",
    dropdown: {
      columns: [
        {
          title: "Vidya Daan",
          links: [
            { label: "Donate & Track Impact", href: "/donations" },
            { label: "NGO Campaigns", href: "/donations#campaigns" },
            { label: "Donor Leaderboard", href: "/leaderboard" },
          ],
        },
        {
          title: "Verification",
          links: [
            { label: "How Vidya Daan Works", href: "/about#ngo" },
            { label: "Community Badges", href: "/badges" },
          ],
        },
      ],
    },
  },
  {
    label: "Library",
    href: "/library",
    dropdown: {
      columns: [
        {
          title: "Reading Space",
          links: [
            { label: "My Library & Shanti", href: "/library" },
            { label: "Free E-Library", href: "/ebooks" },
            { label: "Sabha Book Clubs", href: "/clubs" },
          ],
        },
        {
          title: "Shelf & Activity",
          links: [
            { label: "Orders, Swaps & Listings", href: "/orders" },
            { label: "Wishlist Radar", href: "/wishlist" },
            { label: "Messages & Inbox", href: "/messages" },
          ],
        },
      ],
    },
  },
  {
    label: "Charts",
    href: "/leaderboard",
    dropdown: {
      columns: [
        {
          title: "Community",
          links: [
            { label: "Leaderboards", href: "/leaderboard" },
            { label: "Reader Directory", href: "/leaderboard?tab=directory" },
            { label: "Sabha Reading Circles", href: "/clubs" },
            { label: "Find & Message Readers", href: "/messages" },
          ],
        },
        {
          title: "Your Standing",
          links: [
            { label: "Edit Profile & Quote", href: "/profile" },
            { label: "Community Badges", href: "/badges" },
          ],
        },
      ],
    },
  },
  {
    label: "About Us",
    href: "/about",
    dropdown: null,
  },
]
