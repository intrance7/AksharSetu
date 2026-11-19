"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { Bell, CheckCheck } from "lucide-react"
import Link from "next/link"
import { getPusherClient, isPusherClientConfigured } from "@/lib/pusher"
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
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    }
  }, [])

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    })
  }, [])

  useEffect(() => {
    fetchNotifications()

    if (!userId || !isPusherClientConfigured()) return

    const pusher = getPusherClient()
    const channel = pusher.subscribe(`notify-${userId}`)

    channel.bind(
      "new-notification",
      (data: { message: string; link: string | null }) => {
        toast.success(data.message, {
          action: data.link
            ? {
                label: "View",
                onClick: () => router.push(data.link as string),
              }
            : undefined,
        })
        fetchNotifications()
      }
    )

    return () => {
      channel.unbind("new-notification")
      pusher.unsubscribe(`notify-${userId}`)
    }
  }, [userId, router, fetchNotifications])

  useEffect(() => {
    if (!open) return
    updatePosition()
    fetchNotifications()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, updatePosition, fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          updatePosition()
          setOpen((prev) => !prev)
        }}
        className="relative p-2 rounded-full hover:bg-[#C84200]/10 transition-colors cursor-pointer"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-[#C84200]" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-[#C84200] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setOpen(false)}
            />
            <div
              style={{ top: coords.top, right: coords.right }}
              className="fixed w-84 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl z-[100] overflow-hidden border border-black/10"
            >
              <div className="p-4 bg-[#FAF6F0] border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-[#1D1D1F]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] bg-[#C84200]/10 text-[#C84200] px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-[#0066cc] hover:text-[#0071e3] flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[#86868b] text-sm font-medium">
                    You&apos;re all caught up.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-black/5 hover:bg-[#FAF6F0]/60 transition-colors cursor-pointer ${
                        !notification.read ? "bg-[#FFF8F0]" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id)
                        if (notification.link) {
                          router.push(notification.link)
                          setOpen(false)
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {!notification.read && (
                          <div className="mt-1.5 w-2 h-2 bg-[#C84200] rounded-full shrink-0" />
                        )}
                        <div>
                          <p
                            className={`text-sm leading-snug ${
                              !notification.read
                                ? "text-[#1D1D1F] font-semibold"
                                : "text-[#86868b]"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-[#86868b] mt-1 font-medium">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-[#FAF6F0] border-t border-black/5 flex items-center justify-between px-4">
                <Link
                  href="/orders"
                  className="text-xs text-[#1D1D1F] hover:text-[#C84200] font-bold"
                  onClick={() => setOpen(false)}
                >
                  Orders & Swaps
                </Link>
                <Link
                  href="/wishlist"
                  className="text-xs text-[#0066cc] hover:text-[#0071e3] font-bold"
                  onClick={() => setOpen(false)}
                >
                  Wishlist Radar →
                </Link>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
