"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { getPusherClient } from "@/lib/pusher"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  type: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const pusher = getPusherClient()
    const channel = pusher.subscribe(`notify-${userId}`)

    channel.bind("new-notification", (data: { message: string, link: string | null }) => {
      toast.success(data.message, {
        action: data.link ? {
          label: "View",
          onClick: () => router.push(data.link as string)
        } : undefined
      })
      // Refresh the dropdown list
      fetchNotifications()
    })

    return () => {
      channel.unbind("new-notification")
      pusher.unsubscribe(`notify-${userId}`)
    }
  }, [userId, router])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true })
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-[#C84200]/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-[#C84200]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black"></span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  You have no notifications yet.
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id)
                      if (notification.link) {
                        router.push(notification.link)
                        setOpen(false)
                      }
                    }}
                  >
                    <div className="flex gap-3 cursor-pointer">
                      {!notification.read && (
                        <div className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                      )}
                      <div>
                        <p className={`text-sm ${!notification.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <Link href="/wishlist" className="text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={() => setOpen(false)}>
                Manage Wishlist
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
