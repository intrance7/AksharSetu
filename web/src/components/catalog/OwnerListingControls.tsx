"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface OwnerListingControlsProps {
  book: {
    id: string
    title: string
    author: string
    price: number
    condition: string
    category: string
    status: string
    description: string | null
    university: string | null
    course: string | null
    semester: number | null
    acceptsExchange: boolean
    exchangePreferences: string | null
  }
}

export function OwnerListingControls({ book }: OwnerListingControlsProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)
  const [price, setPrice] = useState(String(book.price))
  const [condition, setCondition] = useState(book.condition)
  const [status, setStatus] = useState(book.status)
  const [description, setDescription] = useState(book.description || "")
  const [university, setUniversity] = useState(book.university || "")
  const [course] = useState(book.course || "")
  const [semester, setSemester] = useState(
    book.semester ? String(book.semester) : ""
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/listings/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          price: Math.max(0, Number(price) || 0),
          condition,
          status,
          description,
          university,
          course,
          semester: semester ? Number(semester) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Failed to update listing")
      }
      toast.success("Listing updated!")
      setEditing(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setSaving(false)
    }
  }

  const handleQuickStatus = async (nextStatus: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/listings/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setStatus(nextStatus)
      toast.success(`Listing marked as ${nextStatus}`)
      router.refresh()
    } catch {
      toast.error("Could not update status")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete or unlist "${book.title}"?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/listings/${book.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete listing")
      toast.success("Listing removed from catalog")
      router.push("/catalog")
      router.refresh()
    } catch {
      toast.error("Could not delete listing")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="p-5 rounded-3xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#1D1D1F]">
            Seller Listing Controls
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-[#1D1D1F]/[0.08] font-mono text-xs font-bold text-[#C84200]">
            {status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1D1D1F] text-white text-[13px] font-bold hover:bg-[#C84200] transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editing ? "Close Editor" : "Edit Listing"}
          </button>

          {status !== "SOLD" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleQuickStatus("SOLD")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0A7D4F] text-white text-[13px] font-bold hover:bg-[#08633F] transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Sold
            </button>
          )}

          {status !== "AVAILABLE" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleQuickStatus("AVAILABLE")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-[#1D1D1F]/15 text-[#1D1D1F] text-[13px] font-bold hover:bg-black/5 transition-colors cursor-pointer"
            >
              Relist as Available
            </button>
          )}

          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[13px] font-bold hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Delete
          </button>
        </div>

        {editing && (
          <form
            onSubmit={handleSave}
            className="pt-4 border-t border-[#1D1D1F]/[0.08] space-y-3.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6e6e73] mb-1">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl bg-white border border-[#1D1D1F]/10 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#C84200]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6e6e73] mb-1">
                  Author
                </label>
                <input
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full rounded-2xl bg-white border border-[#1D1D1F]/10 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#C84200]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6e6e73] mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-2xl bg-white border border-[#1D1D1F]/10 px-3.5 py-2.5 font-mono text-sm font-bold outline-none focus:border-[#C84200]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6e6e73] mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-2xl bg-white border border-[#1D1D1F]/10 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-[#C84200]"
                >
                  <option value="NEW">Brand New</option>
                  <option value="LIKE_NEW">Like New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Readable</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6e6e73] mb-1">
                  University
                </label>
                <input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-2xl bg-white border border-[#1D1D1F]/10 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#C84200]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6e6e73] mb-1">
                  Semester
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="1-8"
                  className="w-full rounded-2xl bg-white border border-[#1D1D1F]/10 px-3.5 py-2.5 font-mono text-sm font-medium outline-none focus:border-[#C84200]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6e6e73] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl bg-white border border-[#1D1D1F]/10 p-3.5 text-sm font-medium outline-none focus:border-[#C84200]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 rounded-full bg-white border border-[#1D1D1F]/10 text-[13px] font-bold cursor-pointer hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-[13px] font-bold cursor-pointer transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
