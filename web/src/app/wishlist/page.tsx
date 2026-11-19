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
        <div className="animate-pulse font-bold text-sm text-[#1D1D1F]/60">
          Scanning Wishlist Radar...
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#F2EBE1] pb-24">
        <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-20 px-4 border-b border-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, #FF7F45 0%, #C84200 42%, transparent 72%)",
            }}
          />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/15 text-xs font-bold uppercase tracking-[0.14em] text-[#F2EBE1]/90 mb-5">
              <Bell className="w-3.5 h-3.5 text-[#FF7F45]" /> Real-Time Match
              Radar
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.03] mb-4">
              Wishlist{" "}
              <span className="font-serif italic font-normal text-[#FF7F45]">
                Discovery
              </span>{" "}
              Radar.
            </h1>
            <p className="text-[#F2EBE1]/72 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-8">
              Sign in to set instant alerts when any textbook or novel you want
              is listed—and cross-check our 4-archive Free E-Library
              automatically.
            </p>
            <Link
              href="/login?callbackUrl=/wishlist"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#C84200] hover:bg-[#FF7F45] hover:text-[#0B0B0D] text-white font-bold text-sm transition-colors shadow-lg"
            >
              Sign In to Set Alerts
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] py-16 md:py-20 border-b border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF7F45 0%, #C84200 42%, transparent 72%)",
          }}
        />

        <div className="container mx-auto max-w-6xl px-4 md:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/15 text-[#F2EBE1]/90 text-xs font-bold uppercase tracking-[0.14em] mb-5">
            <Bell className="w-3.5 h-3.5 text-[#FF7F45]" /> Real-Time Match
            Radar
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.03] mb-4">
            Wishlist &amp; Live{" "}
            <span className="font-serif italic font-normal text-[#FF7F45]">
              Radar.
            </span>
          </h1>
          <p className="text-[#F2EBE1]/72 font-medium text-base md:text-lg leading-relaxed max-w-2xl">
            Every title on your radar is continuously matched against new
            campus listings and our 4-source Free Legal E-Library.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pt-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Add Alert Form */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] lg:sticky lg:top-24">
              <h2 className="text-xl font-black text-[#1D1D1F] mb-2 flex items-center gap-2 tracking-tight">
                <Plus className="w-5 h-5 text-[#C84200]" /> Track a Book
              </h2>
              <p className="text-sm text-[#6e6e73] leading-relaxed mb-6">
                Get an instant notification bell alert the second another reader
                lists a matching title or ISBN.
              </p>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-[#C84200]/50 focus:outline-none focus:ring-4 focus:ring-[#C84200]/10 transition-all"
                  />
                </div>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#1D1D1F]/10"></span>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-[#86868b] font-bold uppercase tracking-wider">
                      And / Or
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                    ISBN Number
                  </label>
                  <input
                    type="text"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="e.g. 9780262046305"
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] rounded-2xl px-4 py-3 font-mono text-sm font-medium focus:bg-white focus:border-[#C84200]/50 focus:outline-none focus:ring-4 focus:ring-[#C84200]/10 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-[#C84200] text-white hover:bg-[#A33500] rounded-full font-bold py-6 text-sm cursor-pointer shadow-sm"
                >
                  {adding ? "Activating..." : "Activate Radar Alert"}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Active Alerts + Live Matches */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            <div className="bg-white rounded-3xl p-6 sm:p-7 md:p-8 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] flex items-center gap-2.5 tracking-tight">
                  <BookOpen className="w-5 h-5 text-[#C84200]" /> Active Alerts
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#1D1D1F]/75">
                    {items.length}
                  </span>
                </h2>
                <Link
                  href="/requests"
                  className="text-[13px] font-bold text-[#0066cc] hover:underline"
                >
                  Post Public Community Request →
                </Link>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-[#6e6e73] text-center">
                  <AlertCircle className="w-12 h-12 mb-3 opacity-25" />
                  <p className="font-black text-lg text-[#1D1D1F]">
                    Your Wishlist Radar is quiet
                  </p>
                  <p className="text-sm mt-1.5 max-w-sm leading-relaxed">
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
                        className="p-5 rounded-3xl border border-[#1D1D1F]/[0.07] bg-[#FAF6F0] space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-lg text-[#1D1D1F] break-words tracking-tight">
                                {item.title || `ISBN ${item.isbn}`}
                              </h3>
                              {matches.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#0A7D4F]/12 text-[#0A7D4F] font-mono text-xs font-bold shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                  {matches.length} Live Match
                                  {matches.length > 1 ? "es" : ""}
                                </span>
                              )}
                            </div>
                            {item.isbn && item.title && (
                              <p className="text-xs font-mono font-bold text-[#6e6e73] mt-1">
                                ISBN: {item.isbn}
                              </p>
                            )}
                            <p className="text-xs text-[#86868b] mt-1 font-medium">
                              Tracking since{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {searchTarget && (
                              <Link
                                href={`/ebooks?q=${encodeURIComponent(
                                  searchTarget
                                )}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#1D1D1F] hover:text-white border border-[#1D1D1F]/[0.1] text-xs font-bold text-[#1D1D1F] transition-colors whitespace-nowrap"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />{" "}
                                Check E-Library
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="w-9 h-9 flex items-center justify-center text-[#86868b] hover:text-red-600 hover:bg-red-50 bg-white border border-[#1D1D1F]/[0.07] rounded-full transition-colors cursor-pointer"
                              title="Remove alert"
                              aria-label="Remove alert"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {matches.length > 0 && (
                          <div className="pt-3.5 border-t border-[#1D1D1F]/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {matches.map((m) => (
                              <Link
                                key={m.id}
                                href={`/catalog/${m.id}`}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#0A7D4F]/25 hover:border-[#0A7D4F] hover:shadow-sm transition-all"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="text-sm font-bold text-[#1D1D1F] truncate">
                                    {m.title}
                                  </p>
                                  <p className="text-xs text-[#6e6e73] truncate">
                                    {m.author} · {m.condition.replace(/_/g, " ")}
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0A7D4F]/10 text-[#0A7D4F] font-mono text-xs font-black shrink-0">
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
