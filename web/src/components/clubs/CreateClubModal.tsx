"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Loader2, Sparkles, Lock, Globe } from "lucide-react"
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
    isPrivate: false,
    maxMembers: 25,
    customCode: "",
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
      if (!res.ok) throw new Error(data.error || "Failed to create Sabha Team")
      toast.success(
        `Sabha Team created! Invite code: ${data.inviteCode || "Generated"}`
      )
      setOpen(false)
      router.push(`/clubs/${data.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not create reading team")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-colors cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4" /> Create Sabha Team
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
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white text-[#1D1D1F] rounded-3xl p-6 sm:p-8 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-black/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#C84200] mb-1">
                <Sparkles className="w-3.5 h-3.5" /> New Reading Team
              </div>
              <h2 className="text-2xl font-black mb-5">
                Create a Sabha Reading Team
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. IITD Systems & Algorithms Squad"
                    className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#C84200]/25"
                  />
                </div>

                {/* Team Visibility Toggle */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5">
                    Team Access Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isPrivate: false })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        !form.isPrivate
                          ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                          : "bg-[#FAF6F0] text-[#1D1D1F] border-black/10"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Globe className="w-3.5 h-3.5 text-[#C84200]" /> Public
                        Team
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          !form.isPrivate ? "text-white/70" : "text-[#86868b]"
                        }`}
                      >
                        Listed in directory + joinable via code
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isPrivate: true })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        form.isPrivate
                          ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                          : "bg-[#FAF6F0] text-[#1D1D1F] border-black/10"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Lock className="w-3.5 h-3.5 text-amber-500" /> Private
                        Team
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          form.isPrivate ? "text-white/70" : "text-[#86868b]"
                        }`}
                      >
                        Invite-code only · hidden from public
                      </p>
                    </button>
                  </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Custom Team Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.customCode}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          customCode: e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9-]/g, ""),
                        })
                      }
                      placeholder="Auto (e.g. SABHA-7K2M)"
                      className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-xs font-mono font-bold uppercase outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Max Team Members
                    </label>
                    <select
                      value={form.maxMembers}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          maxMembers: Number(e.target.value) || 25,
                        })
                      }
                      className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-bold outline-none"
                    >
                      <option value={5}>5 Members (Study Squad)</option>
                      <option value={10}>10 Members (Reading Pod)</option>
                      <option value={25}>25 Members (Standard Sabha)</option>
                      <option value={50}>50 Members (Campus Chapter)</option>
                      <option value={100}>100 Members (Open Guild)</option>
                    </select>
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
                    Team Description & Goals
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="What chapters, problem sets, or themes will your team tackle?"
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
                    "Launch Sabha Team & Generate Code"
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
