"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Shield,
  Users,
  BookOpen,
  HeartHandshake,
  Megaphone,
  CheckCircle2,
  Trash2,
  Ban,
  Plus,
  ExternalLink,
  Loader2,
} from "lucide-react"
import {
  verifyUser,
  banUser,
  toggleUserRole,
  approveBook,
  removeBook,
  createCampaignAction,
  updateCampaignStatusAction,
} from "@/app/actions/admin"
import { toast } from "sonner"

type AdminTab = "donations" | "campaigns" | "books" | "users"

const DONATION_STAGES = [
  "DONATED",
  "COLLECTED",
  "VERIFIED",
  "SENT_TO_NGO",
  "RECEIVED",
  "DISTRIBUTED",
]

export function AdminConsoleClient({
  currentAdminId,
  users,
  books,
  campaigns,
  donations,
}: {
  currentAdminId: string
  users: any[]
  books: any[]
  campaigns: any[]
  donations: any[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>("donations")
  const [busyId, setBusyId] = useState<string | null>(null)

  // New Campaign Form
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [campForm, setCampForm] = useState({
    title: "",
    ngoName: "",
    targetBooks: 150,
    description: "",
    imageUrl: "",
  })

  const handleDonationStage = async (donationId: string, status: string) => {
    setBusyId(donationId)
    try {
      const res = await fetch(`/api/donations/${donationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success(`Donation updated to ${status.replace(/_/g, " ")} & donor notified!`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not update donation stage")
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingCampaign(true)
    try {
      await createCampaignAction(campForm)
      toast.success("New Vidya Daan NGO campaign launched!")
      setCampForm({
        title: "",
        ngoName: "",
        targetBooks: 150,
        description: "",
        imageUrl: "",
      })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not create campaign")
    } finally {
      setCreatingCampaign(false)
    }
  }

  const runAction = async (id: string, fn: () => Promise<unknown>, msg: string) => {
    setBusyId(id)
    try {
      await fn()
      toast.success(msg)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Operation failed")
    } finally {
      setBusyId(null)
    }
  }

  const tabs: { id: AdminTab; label: string; count: number; icon: any }[] = [
    {
      id: "donations",
      label: "6-Stage Donation Pipeline",
      count: donations.length,
      icon: HeartHandshake,
    },
    {
      id: "campaigns",
      label: "NGO Campaigns",
      count: campaigns.length,
      icon: Megaphone,
    },
    {
      id: "books",
      label: "Listing Moderation",
      count: books.length,
      icon: BookOpen,
    },
    {
      id: "users",
      label: "Users & Trust Verification",
      count: users.length,
      icon: Users,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? "bg-[#1D1D1F] text-white shadow-sm"
                  : "bg-white text-[#1D1D1F] hover:bg-black/5 border border-black/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  active ? "bg-white/20 text-white" : "bg-[#F2EBE1] text-[#1D1D1F]"
                }`}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: DONATIONS PIPELINE */}
      {tab === "donations" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-black/5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#1D1D1F]">
                Vidya Daan 6-Stage Logistics Pipeline
              </h2>
              <p className="text-xs text-[#86868b] font-medium mt-1">
                Advancing a stage sends a real-time notification to the donor and updates their public certificate.
              </p>
            </div>
          </div>

          {donations.length === 0 ? (
            <div className="py-12 text-center text-[#86868b] text-sm font-medium">
              No book donations recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-[#FAF6F0] border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-black/10 text-[#1D1D1F]">
                        #{d.trackingId}
                      </span>
                      <span className="text-xs font-bold text-[#0066cc]">
                        {d.campaign
                          ? `${d.campaign.title} (${d.campaign.ngoName})`
                          : "General Literacy Pool"}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1D1D1F]">
                      {d.book?.title || "Book Pledge"} —{" "}
                      <span className="text-[#86868b] font-medium">
                        Donated by {d.donor?.name || d.donor?.email || "Reader"}
                      </span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={d.status}
                      disabled={busyId === d.id}
                      onChange={(e) => handleDonationStage(d.id, e.target.value)}
                      className="h-9 rounded-full bg-white border border-black/15 px-4 text-xs font-bold text-[#1D1D1F] outline-none focus:border-[#0066cc]"
                    >
                      {DONATION_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>

                    <Link
                      href={`/donations/track/${d.trackingId}`}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-white hover:bg-black/5 border border-black/10 text-xs font-bold text-[#1D1D1F]"
                    >
                      Certificate <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NGO CAMPAIGNS */}
      {tab === "campaigns" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateCampaign}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4 self-start"
          >
            <h2 className="text-lg font-black text-[#1D1D1F] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C84200]" /> Launch NGO Drive
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase text-[#1D1D1F] mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                value={campForm.title}
                onChange={(e) =>
                  setCampForm({ ...campForm, title: e.target.value })
                }
                placeholder="e.g. Rural STEM Textbooks Drive 2026"
                className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#C84200]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-[#1D1D1F] mb-1">
                  Partner NGO *
                </label>
                <input
                  type="text"
                  required
                  value={campForm.ngoName}
                  onChange={(e) =>
                    setCampForm({ ...campForm, ngoName: e.target.value })
                  }
                  placeholder="e.g. Pratham Foundation"
                  className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#C84200]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#1D1D1F] mb-1">
                  Target Books *
                </label>
                <input
                  type="number"
                  min={10}
                  required
                  value={campForm.targetBooks}
                  onChange={(e) =>
                    setCampForm({
                      ...campForm,
                      targetBooks: Number(e.target.value),
                    })
                  }
                  className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#C84200]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#1D1D1F] mb-1">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                value={campForm.imageUrl}
                onChange={(e) =>
                  setCampForm({ ...campForm, imageUrl: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
                className="w-full h-11 rounded-xl bg-[#FAF6F0] px-3.5 text-sm font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#1D1D1F] mb-1">
                Impact Description *
              </label>
              <textarea
                rows={3}
                required
                value={campForm.description}
                onChange={(e) =>
                  setCampForm({ ...campForm, description: e.target.value })
                }
                placeholder="Describe who receives these books and what subjects are needed..."
                className="w-full rounded-xl bg-[#FAF6F0] p-3.5 text-sm font-medium outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={creatingCampaign}
              className="w-full h-11 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {creatingCampaign ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Publish NGO Campaign"
              )}
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-[#1D1D1F]">
              Existing Campaigns ({campaigns.length})
            </h2>
            {campaigns.length === 0 ? (
              <p className="text-sm text-[#86868b] py-8 text-center">
                No NGO campaigns created yet. Launch your first drive on the left!
              </p>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-[#FAF6F0] border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-xs font-bold text-[#C84200]">
                        {c.ngoName}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1D1D1F] mt-1">
                      {c.title}
                    </h4>
                    <p className="text-xs text-[#86868b]">
                      Progress: {c.currentBooks} / {c.targetBooks} books pledged
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status !== "ACTIVE" ? (
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() =>
                          runAction(
                            c.id,
                            () => updateCampaignStatusAction(c.id, "ACTIVE"),
                            "Campaign reactivated"
                          )
                        }
                        className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() =>
                          runAction(
                            c.id,
                            () => updateCampaignStatusAction(c.id, "COMPLETED"),
                            "Campaign marked completed"
                          )
                        }
                        className="px-3.5 py-1.5 rounded-full bg-[#1D1D1F] text-white text-xs font-bold cursor-pointer"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LISTING MODERATION */}
      {tab === "books" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-black/5 shadow-sm">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6">
            Marketplace Listing Moderation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map((b) => (
              <div
                key={b.id}
                className="flex gap-4 p-4 bg-[#FAF6F0] rounded-2xl border border-black/5"
              >
                {b.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.images[0]}
                    alt={b.title}
                    className="w-16 h-22 object-cover rounded-lg shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-16 h-22 bg-white rounded-lg shrink-0 flex items-center justify-center border border-black/5">
                    <BookOpen className="w-5 h-5 text-[#86868b]" />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-[#1D1D1F]">
                        {b.status}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-[#C84200]">
                        {b.price === 0 ? "Free" : `₹${b.price}`}
                      </span>
                    </div>
                    <Link
                      href={`/catalog/${b.id}`}
                      className="font-bold text-[#1D1D1F] text-sm hover:underline line-clamp-1"
                    >
                      {b.title}
                    </Link>
                    <p className="text-xs text-[#86868b] truncate">
                      By {b.author} · Listed by {b.owner?.name || "Reader"}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {b.status !== "AVAILABLE" && (
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() =>
                          runAction(
                            b.id,
                            () => approveBook(b.id),
                            "Listing restored to AVAILABLE"
                          )
                        }
                        className="px-3.5 py-1.5 bg-emerald-600/10 text-emerald-700 text-xs font-bold rounded-full hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                      >
                        Restore
                      </button>
                    )}
                    {b.status !== "REMOVED" && (
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() =>
                          runAction(
                            b.id,
                            () => removeBook(b.id),
                            "Listing removed from catalog"
                          )
                        }
                        className="px-3.5 py-1.5 bg-red-500/10 text-red-600 text-xs font-bold rounded-full hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & VERIFICATION */}
      {tab === "users" && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-black/5 shadow-sm">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6">
            Community Members & Role Management
          </h2>
          <div className="space-y-3">
            {users.map((u) => {
              const initial = (u.name || u.email || "R").charAt(0).toUpperCase()
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#FAF6F0] rounded-2xl border border-black/5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1D1D1F] text-white font-black text-sm flex items-center justify-center shrink-0">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt={u.name || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${u.id}`}
                          className="font-bold text-sm text-[#1D1D1F] hover:underline"
                        >
                          {u.name || "Reader"}
                        </Link>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            u.role === "ADMIN"
                              ? "bg-[#C84200] text-white"
                              : "bg-white text-[#86868b]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#86868b]">
                        {u.email} · {u.sellerRating?.toFixed(1) || "5.0"}★ Trust
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() =>
                        runAction(
                          u.id,
                          () => verifyUser(u.id),
                          `Awarded Trusted Reader badge to ${u.name || "user"}`
                        )
                      }
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600/10 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verify Badge
                    </button>

                    {u.id !== currentAdminId && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() =>
                            runAction(
                              u.id,
                              () =>
                                toggleUserRole(
                                  u.id,
                                  u.role === "ADMIN" ? "USER" : "ADMIN"
                                ),
                              `Updated role for ${u.name || "user"}`
                            )
                          }
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#0066cc]/10 text-[#0066cc] rounded-full text-xs font-bold hover:bg-[#0066cc] hover:text-white transition-colors cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {u.role === "ADMIN" ? "Make User" : "Make Admin"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() =>
                            runAction(
                              u.id,
                              () => banUser(u.id),
                              "Unlisted active books for moderated user"
                            )
                          }
                          className="p-2 bg-red-500/10 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                          title="Moderate User (Unlist Active Books)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

