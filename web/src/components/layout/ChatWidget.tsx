"use client"

import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { useSession } from "next-auth/react"

export function ChatWidget() {
  const { data: session } = useSession()

  // Only show the chat bubble if the user is logged in
  if (!session) return null

  return (
    <Link 
      href="/messages"
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#C84200] text-[#F2EBE1] shadow-[0_8px_30px_rgba(200,66,0,0.3)] hover:scale-110 hover:bg-[#A33500] transition-all duration-300 group"
      aria-label="Messages"
    >
      <MessageCircle className="w-7 h-7" />
      {/* Unread indicator dot */}
      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#F2EBE1] rounded-full"></span>
    </Link>
  )
}
