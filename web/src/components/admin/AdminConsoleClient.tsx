"use client"

import { useState, useEffect, useCallback } from "react"
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
  Trophy,
  RotateCcw,
  LifeBuoy,
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

type AdminTab =
  | "donations"
  | "campaigns"
  | "books"
  | "users"
  | "gamification"
  | "support"

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

  const [gamificationData, setGamificationData] = useState<{
    badges: any[]
    quests: any[]
    recentTx: any[]
    reports: any[]
  } | null>(null)
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    category: "READING",
    rarity: "RARE",
    requirementThreshold: 5,
    xpReward: 100,
  })
  const [xpAdjust, setXpAdjust] = useState({
    targetUserId: users[0]?.id || "",
    xpDelta: 50,
    reason: "",
  })

  const loadGamificationAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gamification")
      if (res.ok) {
        const data = await res.json()
        setGamificationData(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (tab === "gamification" && !gamificationData) {
      loadGamificationAdmin()
    }
  }, [tab, gamificationData, loadGamificationAdmin])

  const [supportData, setSupportData] = useState<{
    allTickets: any[]
    customArticles: any[]
  } | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [articleForm, setArticleForm] = useState({
    slug: "",
    title: "",
    categorySlug: "getting-started",
    summary: "",
    contentMarkdown: "",
  })

  const loadSupportAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/support")
      if (res.ok) {
        const d = await res.json()
        setSupportData({
          allTickets: d.allTickets || [],
          customArticles: d.customArticles || [],
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (tab === "support" && !supportData) {
      loadSupportAdmin()
    }
  }, [tab, supportData, loadSupportAdmin])

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
    {
      id: "gamification",
      label: "Gamification, XP & Audit",
      count: gamificationData?.badges?.length || 34,
      icon: Trophy,
    },
    {
      id: "support",
      label: "Support & Help Docs",
      count: supportData?.allTickets?.length || 0,
      icon: LifeBuoy,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
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

                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={d.status}
                      disabled={busyId === d.id}
                      onChange={(e) => handleDonationStage(d.id, e.target.value)}
                      className="h-9 rounded-full bg-white border border-black/15 px-4 text-xs font-bold text-[#1D1D1F] outline-none focus:border-[#0066cc] cursor-pointer"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="flex flex-wrap items-center gap-2">
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

                  <div className="flex flex-wrap items-center gap-2">
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
                      <div className="flex flex-wrap items-center gap-2">
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

                  <div className="flex flex-wrap items-center gap-2">
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

      {/* TAB 5: GAMIFICATION, XP & FRAUD AUDIT */}
      {tab === "gamification" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Achievement Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const res = await fetch("/api/admin/gamification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "create_badge",
                    ...newBadge,
                  }),
                })
                if (res.ok) {
                  toast.success("Achievement created!")
                  setNewBadge({
                    name: "",
                    description: "",
                    category: "READING",
                    rarity: "RARE",
                    requirementThreshold: 5,
                    xpReward: 100,
                  })
                  loadGamificationAdmin()
                } else {
                  toast.error("Could not create achievement")
                }
              }}
              className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-black text-[#1d1d1f]">
                Create Achievement Badge
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  value={newBadge.name}
                  onChange={(e) =>
                    setNewBadge((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Achievement Name"
                  className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
                />
                <select
                  value={newBadge.rarity}
                  onChange={(e) =>
                    setNewBadge((p) => ({ ...p, rarity: e.target.value }))
                  }
                  className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
                >
                  {[
                    "COMMON",
                    "UNCOMMON",
                    "RARE",
                    "EPIC",
                    "LEGENDARY",
                    "MYTHIC",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  value={newBadge.category}
                  onChange={(e) =>
                    setNewBadge((p) => ({ ...p, category: e.target.value }))
                  }
                  className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
                >
                  {[
                    "READING",
                    "REVIEW",
                    "MARKETPLACE",
                    "DONATION",
                    "COMMUNITY",
                    "PROGRESSION",
                    "SEASONAL",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newBadge.xpReward}
                  onChange={(e) =>
                    setNewBadge((p) => ({
                      ...p,
                      xpReward: Number(e.target.value) || 50,
                    }))
                  }
                  placeholder="XP Reward"
                  className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
                />
              </div>
              <input
                required
                value={newBadge.description}
                onChange={(e) =>
                  setNewBadge((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Unlock requirement description..."
                className="w-full rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-medium"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-bold cursor-pointer"
              >
                + Publish Achievement
              </button>
            </form>

            {/* Admin XP Override with Mandatory Audit Log */}
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const res = await fetch("/api/admin/gamification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "adjust_xp",
                    ...xpAdjust,
                  }),
                })
                if (res.ok) {
                  toast.success("XP adjustment recorded in audit log!")
                  setXpAdjust((p) => ({ ...p, reason: "" }))
                  loadGamificationAdmin()
                } else {
                  toast.error("Adjustment failed")
                }
              }}
              className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-black text-[#1d1d1f]">
                Admin XP Adjustment & Audit Override
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={xpAdjust.targetUserId}
                  onChange={(e) =>
                    setXpAdjust((p) => ({ ...p, targetUserId: e.target.value }))
                  }
                  className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={xpAdjust.xpDelta}
                  onChange={(e) =>
                    setXpAdjust((p) => ({
                      ...p,
                      xpDelta: Number(e.target.value),
                    }))
                  }
                  placeholder="XP Delta (e.g. 50 or -50)"
                  className="rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
                />
              </div>
              <input
                required
                value={xpAdjust.reason}
                onChange={(e) =>
                  setXpAdjust((p) => ({ ...p, reason: e.target.value }))
                }
                placeholder="Mandatory audit reason (e.g., Campus Book Drive winner)..."
                className="w-full rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-medium"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white text-xs font-bold cursor-pointer"
              >
                Apply Audited XP Adjustment
              </button>
            </form>
          </div>

          {/* Live XP Transaction Audit Log with Reversal */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-[#1d1d1f]">
              XP Transaction Audit Ledger (Anti-Abuse & Reversal)
            </h3>
            {!gamificationData ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#86868b]" />
              </div>
            ) : gamificationData.recentTx.length === 0 ? (
              <p className="text-xs text-[#86868b]">
                No XP transactions recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-black/5 max-h-96 overflow-y-auto">
                {gamificationData.recentTx.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#1d1d1f]">
                        {tx.user?.name || tx.user?.email || "Reader"} ·{" "}
                        <span className="text-[#0066cc]">{tx.eventType}</span>
                      </p>
                      <p className="text-[#86868b]">{tx.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-black ${
                          tx.reversedAt
                            ? "line-through text-[#86868b]"
                            : "text-[#0066cc]"
                        }`}
                      >
                        {tx.xpAmount >= 0 ? `+${tx.xpAmount}` : tx.xpAmount} XP
                      </span>
                      {!tx.reversedAt ? (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch("/api/admin/gamification", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "reverse_tx",
                                txId: tx.id,
                              }),
                            })
                            if (res.ok) {
                              toast.success("Transaction reversed!")
                              loadGamificationAdmin()
                            }
                          }}
                          className="px-3 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Reverse
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-red-600 uppercase">
                          Reversed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SUPPORT TICKETS & HELP CENTER ARTICLE MANAGEMENT */}
      {tab === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Publish / Update Help Article */}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "admin_save_article",
                  ...articleForm,
                }),
              })
              if (res.ok) {
                toast.success("Help Center article published!")
                setArticleForm({
                  slug: "",
                  title: "",
                  categorySlug: "getting-started",
                  summary: "",
                  contentMarkdown: "",
                })
                loadSupportAdmin()
              } else {
                toast.error("Failed to save article")
              }
            }}
            className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-3.5"
          >
            <h3 className="text-lg font-black text-[#1d1d1f]">
              Publish / Edit Help Center Article
            </h3>
            <input
              required
              value={articleForm.slug}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, slug: e.target.value }))
              }
              placeholder="URL Slug (e.g. campus-pickup-tips)"
              className="w-full rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
            />
            <input
              required
              value={articleForm.title}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Article Title"
              className="w-full rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
            />
            <select
              value={articleForm.categorySlug}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, categorySlug: e.target.value }))
              }
              className="w-full rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-bold"
            >
              <option value="getting-started">Getting Started</option>
              <option value="account-and-profiles">Account & Profiles</option>
              <option value="buying-books">Buying Books</option>
              <option value="selling-books">Selling Books</option>
              <option value="messaging-and-communication">
                Messaging & Communication
              </option>
              <option value="reading-and-digital-library">
                Reading & Digital Library
              </option>
              <option value="xp-levels-and-progression">
                XP, Levels & Progression
              </option>
              <option value="badges-and-achievements">
                Badges & Achievements
              </option>
              <option value="quests-streaks-and-rewards">
                Quests, Streaks & Rewards
              </option>
              <option value="community-and-social-features">
                Community & Social Features
              </option>
              <option value="payments-and-transactions">
                Payments & Transactions
              </option>
              <option value="safety-privacy-and-security">
                Safety, Privacy & Security
              </option>
              <option value="technical-support">Technical Support</option>
            </select>
            <input
              required
              value={articleForm.summary}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, summary: e.target.value }))
              }
              placeholder="Short summary for search cards"
              className="w-full rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-xs font-medium"
            />
            <textarea
              rows={4}
              required
              value={articleForm.contentMarkdown}
              onChange={(e) =>
                setArticleForm((p) => ({
                  ...p,
                  contentMarkdown: e.target.value,
                }))
              }
              placeholder="Article paragraphs (separate paragraphs with a blank line)..."
              className="w-full rounded-xl bg-[#f5f5f7] p-3.5 text-xs font-medium"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-[#0066cc] hover:bg-[#0071e3] py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              Publish to /help
            </button>
          </form>

          {/* Support Ticket Queue */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-[#1d1d1f]">
              Support Tickets Queue ({supportData?.allTickets?.length || 0})
            </h3>
            {!supportData ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#86868b]" />
              </div>
            ) : supportData.allTickets.length === 0 ? (
              <p className="text-xs text-[#86868b] py-6 text-center">
                No support tickets in the queue.
              </p>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {supportData.allTickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="rounded-2xl bg-[#f5f5f7] p-4 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#0066cc]">
                        {t.ticketNumber} · {t.category}
                      </span>
                      <select
                        value={t.status}
                        onChange={async (e) => {
                          const nextStatus = e.target.value
                          const res = await fetch("/api/support", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "admin_update_ticket",
                              ticketId: t.id,
                              status: nextStatus,
                            }),
                          })
                          if (res.ok) {
                            toast.success(`Ticket updated to ${nextStatus}`)
                            loadSupportAdmin()
                          }
                        }}
                        className="rounded-full bg-white px-3 py-1 text-[11px] font-bold border border-black/10"
                      >
                        {[
                          "OPEN",
                          "IN_PROGRESS",
                          "WAITING_FOR_USER",
                          "RESOLVED",
                          "CLOSED",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="font-bold text-[#1d1d1f]">{t.subject}</div>
                    <p className="text-[#6e6e73]">{t.description}</p>
                    <div className="text-[11px] text-[#86868b]">
                      From: {t.contactEmail}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        value={
                          replyDrafts[t.id] !== undefined
                            ? replyDrafts[t.id]
                            : t.adminResponse || ""
                        }
                        onChange={(e) =>
                          setReplyDrafts((p) => ({
                            ...p,
                            [t.id]: e.target.value,
                          }))
                        }
                        placeholder="Write official support response..."
                        className="flex-1 min-w-0 rounded-full bg-white px-3.5 py-1.5 text-xs border border-black/10"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch("/api/support", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "admin_update_ticket",
                              ticketId: t.id,
                              status: "RESOLVED",
                              adminResponse:
                                replyDrafts[t.id] ?? t.adminResponse ?? "",
                            }),
                          })
                          if (res.ok) {
                            toast.success("Response sent & ticket resolved!")
                            loadSupportAdmin()
                          }
                        }}
                        className="rounded-full bg-[#0066cc] text-white px-4 py-1.5 text-xs font-bold cursor-pointer shrink-0"
                      >
                        Send & Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

