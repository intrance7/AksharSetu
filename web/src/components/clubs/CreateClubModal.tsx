"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function CreateClubModal({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    bookTitle: "",
    bookAuthor: "",
    scheduleText: "Sundays · 8:00 PM IST Shanti Session",
    description: "",
  })

  const handleOpen = () => {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/clubs")
      return
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create circle")
      toast.success("Sabha Reading Circle created!")
      setOpen(false)
      router.push(`/clubs/${data.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not create reading circle")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Start a Sabha Circle
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg bg-white text-[#1D1D1F] rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-black/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#C84200] mb-1">
                <Sparkles className="w-3.5 h-3.5" /> New Reading Sabha
              </div>
              <h2 className="text-2xl font-black mb-5">
                Start a Community Book Circle
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Circle Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Midnight Philosophy & Chai Sabha"
                    className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#C84200]/25"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Current Book Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.bookTitle}
                      onChange={(e) =>
                        setForm({ ...form, bookTitle: e.target.value })
                      }
                      placeholder="e.g. Gitanjali"
                      className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Book Author *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.bookAuthor}
                      onChange={(e) =>
                        setForm({ ...form, bookAuthor: e.target.value })
                      }
                      placeholder="e.g. Rabindranath Tagore"
                      className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Reading Schedule / Pace
                  </label>
                  <input
                    type="text"
                    value={form.scheduleText}
                    onChange={(e) =>
                      setForm({ ...form, scheduleText: e.target.value })
                    }
                    className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Circle Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="What chapters or themes will you explore together?"
                    className="w-full rounded-xl bg-[#FAF6F0] p-3.5 text-sm font-medium outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Launch Sabha Circle"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

