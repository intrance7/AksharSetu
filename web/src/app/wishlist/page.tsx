"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { AIRecommendations } from "@/components/catalog/AIRecommendations"
import {
  Trash2,
  Bell,
  BookOpen,
  AlertCircle,
  Plus,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

type BookMatch = {
  id: string
  title: string
  author: string
  price: number
  condition: string
  acceptsExchange: boolean
}

type WishlistItem = {
  id: string
  title: string | null
  isbn: string | null
  createdAt: string
  matches?: BookMatch[]
}

export default function WishlistPage() {
  const { status } = useSession()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const [newTitle, setNewTitle] = useState("")
  const [newIsbn, setNewIsbn] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      fetchWishlist()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status])

  const fetchWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist")
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch {
      toast.error("Failed to load wishlist")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() && !newIsbn.trim()) {
      toast.error("Please provide either a Title or ISBN")
      return
    }

    setAdding(true)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || null,
          isbn: newIsbn.trim() || null,
        }),
      })

      if (res.ok) {
        toast.success("Radar alert activated!")
        setNewTitle("")
        setNewIsbn("")
        fetchWishlist()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/wishlist?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Removed from wishlist")
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        toast.error("Failed to remove")
      }
    } catch {
      toast.error("An error occurred")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EBE1] p-8 flex justify-center items-center">
        <div className="animate-pulse font-bold text-[#1D1D1F]/60">
          Scanning Wishlist Radar...
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#F2EBE1] flex flex-col justify-center items-center px-4 text-center">
        <Bell className="w-12 h-12 text-[#C84200] mb-4" />
        <h1 className="text-3xl font-black text-[#1D1D1F] mb-2">
          Wishlist Discovery Radar
        </h1>
        <p className="text-[#86868b] font-medium mb-6 max-w-md">
          Sign in to set instant alerts when any textbook or novel you want is
          listed—and cross-check our 4-archive Free E-Library automatically.
        </p>
        <Link
          href="/login?callbackUrl=/wishlist"
          className="px-6 py-3 rounded-full bg-[#C84200] text-white font-bold text-sm"
        >
          Sign In to Set Alerts
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] py-12 px-4 md:px-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C84200]/10 text-[#C84200] text-xs font-black uppercase tracking-wider mb-3">
            <Bell className="w-3.5 h-3.5" /> Real-Time Match Radar
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1D1D1F]">
            Wishlist & Live Availability
          </h1>
          <p className="text-[#86868b] font-medium mt-2 max-w-2xl">
            Every book on your radar is continuously matched against new
            physical listings and our 4-source Free Legal E-Library.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Add Alert Form */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 sticky top-24">
              <h2 className="text-xl font-black text-[#1D1D1F] mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C84200]" /> Track a Book
              </h2>
              <p className="text-xs text-[#86868b] font-medium mb-6">
                Get an instant notification bell alert the second another reader
                lists a matching title or ISBN.
              </p>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] uppercase mb-1.5">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full bg-[#FAF6F0] border border-black/5 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84200]/30"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-black/10"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-white px-2 text-[#86868b] font-black uppercase">
                      And / Or
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] uppercase mb-1.5">
                    ISBN Number
                  </label>
                  <input
                    type="text"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="e.g. 9780262046305"
                    className="w-full bg-[#FAF6F0] border border-black/5 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84200]/30"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-[#C84200] text-white hover:bg-[#A33500] rounded-full font-black py-6 uppercase tracking-wider text-xs"
                >
                  {adding ? "Activating..." : "Activate Radar Alert"}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Active Alerts + Live Matches */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[#1D1D1F] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#C84200]" /> Active Alerts
                  ({items.length})
                </h2>
                <Link
                  href="/requests"
                  className="text-xs font-bold text-[#0066cc] hover:underline"
                >
                  Post Public Community Request →
                </Link>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-[#86868b] text-center">
                  <AlertCircle className="w-12 h-12 mb-3 opacity-25" />
                  <p className="font-bold text-base text-[#1D1D1F]">
                    Your Wishlist Radar is empty
                  </p>
                  <p className="text-xs mt-1 max-w-sm">
                    Add a textbook, classic, or novel on the left to watch both
                    the physical marketplace and Free E-Library.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const matches = item.matches || []
                    const searchTarget = item.title || item.isbn || ""
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl border border-black/5 bg-[#FAF6F0]/70 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-lg text-[#1D1D1F]">
                                {item.title || `ISBN ${item.isbn}`}
                              </h3>
                              {matches.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                                  <CheckCircle2 className="w-3 h-3" />{" "}
                                  {matches.length} Live Match
                                  {matches.length > 1 ? "es" : ""}
                                </span>
                              )}
                            </div>
                            {item.isbn && item.title && (
                              <p className="text-xs font-mono font-bold text-[#86868b] mt-0.5">
                                ISBN: {item.isbn}
                              </p>
                            )}
                            <p className="text-[11px] text-[#86868b] mt-1 font-medium">
                              Tracking since{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {searchTarget && (
                              <Link
                                href={`/ebooks?q=${encodeURIComponent(
                                  searchTarget
                                )}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-black/5 border border-black/10 text-xs font-bold text-[#1D1D1F]"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />{" "}
                                Check Free E-Library
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-[#86868b] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                              title="Remove alert"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {matches.length > 0 && (
                          <div className="pt-3 border-t border-black/5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {matches.map((m) => (
                              <Link
                                key={m.id}
                                href={`/catalog/${m.id}`}
                                className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-500/20 hover:border-emerald-500 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-xs font-bold text-[#1D1D1F] truncate">
                                    {m.title}
                                  </p>
                                  <p className="text-[11px] text-[#86868b] truncate">
                                    {m.author} · {m.condition.replace(/_/g, " ")}
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black shrink-0">
                                  {m.price === 0
                                    ? m.acceptsExchange
                                      ? "Swap"
                                      : "Free"
                                    : `₹${m.price}`}
                                  <ExternalLink className="w-3 h-3" />
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <AIRecommendations />
          </div>
        </div>
      </div>
    </div>
  )
}
