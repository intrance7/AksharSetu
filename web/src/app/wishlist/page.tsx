"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Trash2, Bell, BookOpen, AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"

type WishlistItem = {
  id: string
  title: string | null
  isbn: string | null
  createdAt: string
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
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
    } catch (e) {
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
          isbn: newIsbn.trim() || null 
        })
      })

      if (res.ok) {
        toast.success("Added to wishlist!")
        setNewTitle("")
        setNewIsbn("")
        fetchWishlist()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add")
      }
    } catch (e) {
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
        setItems(prev => prev.filter(item => item.id !== id))
      } else {
        toast.error("Failed to remove")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F2EBE1] p-8 flex justify-center items-center"><div className="animate-pulse">Loading...</div></div>
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#F2EBE1] flex flex-col justify-center items-center">
        <h1 className="text-3xl font-black text-[#C84200] mb-4">Wishlist & Alerts</h1>
        <p className="text-[#A33500] font-bold">Please log in to view your wishlist.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2EBE1] p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-8 h-8 text-[#C84200]" />
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#C84200]">
            Wishlist & Alerts
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C84200]/10">
              <h2 className="text-xl font-bold text-[#C84200] mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Alert
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                We'll notify you instantly when a book matching your criteria is listed.
              </p>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Book Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Clean Code"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84200]/50"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400 font-bold uppercase">Or</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ISBN Number</label>
                  <input
                    type="text"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="e.g. 9780132350884"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84200]/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={adding}
                  className="w-full bg-[#C84200] text-[#F2EBE1] hover:bg-[#A33500] rounded-xl font-bold py-6 uppercase tracking-wider"
                >
                  {adding ? "Adding..." : "Set Alert"}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: List */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C84200]/10 min-h-[400px]">
              <h2 className="text-xl font-bold text-[#C84200] mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Active Alerts
              </h2>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium text-sm">Your wishlist is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div>
                        {item.title && (
                          <div className="font-bold text-gray-800">
                            Title: <span className="text-[#C84200]">{item.title}</span>
                          </div>
                        )}
                        {item.isbn && (
                          <div className="text-sm font-bold text-gray-500 mt-0.5">
                            ISBN: {item.isbn}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2 font-medium">
                          Added {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove alert"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
