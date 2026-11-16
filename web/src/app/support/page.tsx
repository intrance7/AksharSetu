"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  LifeBuoy,
  Bug,
  ShieldAlert,
  BookOpen,
  CreditCard,
  Scale,
  KeyRound,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react"

interface SupportTicketItem {
  id: string
  ticketNumber: string
  category: string
  subject: string
  description: string
  status: string
  priority: string
  adminResponse: string | null
  respondedAt: string | null
  createdAt: string
}

const SUPPORT_CATEGORIES = [
  {
    id: "GENERAL",
    label: "Contact Support",
    desc: "General platform questions, library assistance, or feedback.",
    icon: LifeBuoy,
  },
  {
    id: "BUG_REPORT",
    label: "Report a Bug",
    desc: "Something broken in reading room, chat, or marketplace.",
    icon: Bug,
  },
  {
    id: "USER_REPORT",
    label: "Report a User",
    desc: "Harassment, spam messages, or abusive behavior.",
    icon: ShieldAlert,
  },
  {
    id: "SUSPICIOUS_LISTING",
    label: "Suspicious Listing",
    desc: "Counterfeit, pirated, or misleading book listing.",
    icon: BookOpen,
  },
  {
    id: "PAYMENT_ISSUE",
    label: "Payment / Order Issue",
    desc: "Checkout, refund request, or BookOffer dispute.",
    icon: CreditCard,
  },
  {
    id: "COPYRIGHT_DMCA",
    label: "Copyright / DMCA",
    desc: "Intellectual property or takedown notification.",
    icon: Scale,
  },
  {
    id: "ACCOUNT_ACCESS",
    label: "Account Access / Appeal",
    desc: "Login trouble, verification, or moderation appeal.",
    icon: KeyRound,
  },
]

function SupportPageContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [category, setCategory] = useState(
    searchParams.get("category") || "GENERAL"
  )
  const [subject, setSubject] = useState("")
  const [contactEmail, setContactEmail] = useState(session?.user?.email || "")
  const [relatedUrl, setRelatedUrl] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<SupportTicketItem | null>(
    null
  )
  const [errorMsg, setErrorMsg] = useState("")
  const [myTickets, setMyTickets] = useState<SupportTicketItem[]>([])

  useEffect(() => {
    if (session?.user?.email && !contactEmail) {
      setContactEmail(session.user.email)
    }
  }, [session?.user?.email, contactEmail])

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.tickets)) {
          setMyTickets(d.tickets)
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_ticket",
          category,
          subject,
          contactEmail,
          relatedUrl,
          description,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit support ticket.")
      } else if (data.ticket) {
        setCreatedTicket(data.ticket)
        setMyTickets((prev) => [data.ticket, ...prev])
        setSubject("")
        setDescription("")
        setRelatedUrl("")
      }
    } catch {
      setErrorMsg("Network error while submitting ticket.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      <section className="bg-black text-[#f5f5f7] pt-14 pb-18 px-4 sm:px-6 border-b border-white/10">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-3">
            <LifeBuoy className="h-3.5 w-3.5" /> AksharSetu Trust, Safety &
            Support Desk
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter">
            Support & Issue Resolution
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#86868b] max-w-2xl">
            Submit a support ticket, report a bug or suspicious listing, or
            track the real-time status of your open inquiries.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 space-y-8">
        {/* Category Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUPPORT_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const selected = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`text-left rounded-2xl p-4 border transition-all ${
                  selected
                    ? "bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-md"
                    : "bg-white text-[#1d1d1f] border-black/[0.06] hover:border-[#0066cc] shadow-sm"
                }`}
              >
                <Icon
                  className={`h-5 w-5 mb-2 ${
                    selected ? "text-[#0066cc]" : "text-[#0066cc]"
                  }`}
                />
                <div className="text-xs font-bold">{cat.label}</div>
                <p
                  className={`text-[11px] mt-1 leading-relaxed ${
                    selected ? "text-white/75" : "text-[#86868b]"
                  }`}
                >
                  {cat.desc}
                </p>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Ticket Submission Form */}
          <div className="lg:col-span-7 rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-black/[0.06]">
            <h2 className="text-xl font-bold text-[#1d1d1f]">
              Submit a Support Ticket
            </h2>
            <p className="text-xs text-[#86868b] mt-1 mb-6">
              Selected Category:{" "}
              <strong className="text-[#0066cc]">
                {SUPPORT_CATEGORIES.find((c) => c.id === category)?.label}
              </strong>
            </p>

            {createdTicket && (
              <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Ticket Submitted — Reference #{createdTicket.ticketNumber}
                </div>
                <p className="mt-1">
                  We have logged your request (&ldquo;{createdTicket.subject}
                  &rdquo;) with status <strong>{createdTicket.status}</strong>.
                  You can track updates right on this page.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1d1d1f] mb-1.5">
                  Your Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="reader@university.edu"
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d1d1f] mb-1.5">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue or inquiry"
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d1d1f] mb-1.5">
                  Related Book Listing, Profile, or Order URL (Optional)
                </label>
                <input
                  type="text"
                  value={relatedUrl}
                  onChange={(e) => setRelatedUrl(e.target.value)}
                  placeholder="e.g. /catalog/book-id or /profile/username"
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1d1d1f] mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include steps to reproduce, order/offer details, or relevant context..."
                  className="w-full rounded-xl border border-black/10 bg-[#f5f5f7] p-4 text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] disabled:opacity-50 px-7 py-3 text-xs sm:text-sm font-bold text-white transition-colors"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting Ticket..." : "Submit Support Ticket"}
              </button>
            </form>
          </div>

          {/* Right Column: My Support Tickets & Self-Service Links */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
              <h3 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0066cc]" />
                My Submitted Tickets ({myTickets.length})
              </h3>
              <p className="text-xs text-[#86868b] mt-1 mb-4">
                Real-time ticket status (`OPEN`, `IN_PROGRESS`,
                `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`).
              </p>

              {myTickets.length === 0 ? (
                <div className="rounded-xl bg-[#f5f5f7] p-5 text-center text-xs text-[#86868b]">
                  {session?.user
                    ? "You have no submitted support tickets yet."
                    : "Sign in to view and track your support ticket history across sessions."}
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {myTickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-black/[0.06] bg-[#f5f5f7]/70 p-4 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[#0066cc]">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            t.status === "RESOLVED" || t.status === "CLOSED"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="font-bold text-[#1d1d1f] mt-1.5">
                        {t.subject}
                      </div>
                      <p className="text-[#6e6e73] mt-1 line-clamp-2">
                        {t.description}
                      </p>
                      {t.adminResponse && (
                        <div className="mt-2.5 rounded-lg bg-white border border-[#0066cc]/20 p-3">
                          <div className="text-[10px] font-bold uppercase text-[#0066cc]">
                            Official Support Response
                          </div>
                          <p className="text-[#1d1d1f] mt-0.5">
                            {t.adminResponse}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 text-[10px] text-[#86868b]">
                        Submitted {new Date(t.createdAt).toLocaleDateString()} ·{" "}
                        {t.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-black/[0.06]">
              <h3 className="text-sm font-bold text-[#1d1d1f]">
                Self-Service Resources
              </h3>
              <div className="mt-3 space-y-2 text-xs font-semibold">
                <Link
                  href="/help"
                  className="block rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] px-4 py-2.5 text-[#1d1d1f]"
                >
                  Browse 13-Category Help Center →
                </Link>
                <Link
                  href="/faq"
                  className="block rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] px-4 py-2.5 text-[#1d1d1f]"
                >
                  Frequently Asked Questions (FAQ) →
                </Link>
                <Link
                  href="/legal/account-appeals"
                  className="block rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] px-4 py-2.5 text-[#1d1d1f]"
                >
                  Account Appeals & Moderation Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] p-12 text-center text-sm text-[#86868b]">
          Loading Support Desk...
        </div>
      }
    >
      <SupportPageContent />
    </Suspense>
  )
}
