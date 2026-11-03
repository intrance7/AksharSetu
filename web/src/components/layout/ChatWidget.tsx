"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { useSession } from "next-auth/react"

export function ChatWidget() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  const shouldHide =
    !pathname ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/ebooks/") ||
    pathname.startsWith("/library/shanti")

  useEffect(() => {
    if (!session?.user?.id || shouldHide) return

    let active = true
    const loadUnread = async () => {
      try {
        const res = await fetch("/api/messages/unread")
        if (res.ok && active) {
          const data = await res.json()
          setUnreadCount(Number(data.unreadCount) || 0)
        }
      } catch {
        // Ignore transient network errors
      }
    }

    loadUnread()
    const timer = setInterval(loadUnread, 25000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [session?.user?.id, pathname, shouldHide])

  if (!session || shouldHide) return null

  return (
    <Link
      href="/messages"
      className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#C84200] text-[#F2EBE1] shadow-[0_8px_30px_rgba(200,66,0,0.3)] hover:scale-105 hover:bg-[#A33500] transition-all duration-300 group"
      aria-label="Messages"
      title={
        unreadCount > 0
          ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
          : "Messages"
      }
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-[#0066cc] text-white text-[11px] font-black border-2 border-[#F2EBE1] rounded-full flex items-center justify-center shadow-sm">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  )
}
