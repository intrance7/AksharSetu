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
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Obsidian Editorial Hero */}
      <section className="relative overflow-hidden bg-[#0B0B0D] text-[#F5F5F7] pt-16 pb-20 px-4 sm:px-6 border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(#F2EBE1 1.25px, transparent 1.25px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-[#C84200]/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#FF7F45]/12 blur-[100px]" />

        <div className="mx-auto max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/12 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7F45] mb-4">
            <LifeBuoy className="h-3.5 w-3.5" /> Trust, Safety &amp; Support Desk
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Support &amp;{" "}
            <span className="font-serif italic font-medium text-[#FF7F45]">
              Issue Resolution
            </span>
            .
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#D2CDC5] max-w-2xl leading-relaxed">
            Submit a support ticket, report a bug or suspicious listing, or
            track the real-time status of your open inquiries.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-8 relative z-10 space-y-8">
        {/* Category Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SUPPORT_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const selected = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`text-left rounded-3xl p-5 border transition-all cursor-pointer ${
                  selected
                    ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-md"
                    : "bg-white text-[#1D1D1F] border-[#1D1D1F]/[0.07] hover:border-[#C84200] shadow-sm"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    selected
                      ? "bg-white/10 text-[#FF7F45]"
                      : "bg-[#FAF6F0] text-[#C84200]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-bold">{cat.label}</div>
                <p
                  className={`text-xs sm:text-[13px] mt-1.5 leading-relaxed ${
                    selected ? "text-white/75" : "text-[#5E5E63]"
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
          <div className="lg:col-span-7 rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#1D1D1F]/[0.07]">
            <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
              Submit a Support Ticket
            </h2>
            <p className="text-sm text-[#5E5E63] mt-1 mb-6">
              Selected Category:{" "}
              <strong className="text-[#C84200]">
                {SUPPORT_CATEGORIES.find((c) => c.id === category)?.label}
              </strong>
            </p>

            {createdTicket && (
              <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-[#0A7D4F]">
                  <CheckCircle2 className="h-4 w-4" />
                  Ticket Submitted — Reference{" "}
                  <span className="font-mono">#{createdTicket.ticketNumber}</span>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  We have logged your request (&ldquo;{createdTicket.subject}
                  &rdquo;) with status <strong>{createdTicket.status}</strong>.
                  You can track updates right on this page.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 text-sm font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/80 mb-2">
                  Your Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="reader@university.edu"
                  className="w-full rounded-2xl border border-[#1D1D1F]/10 bg-[#FAF6F0] px-4 py-3.5 text-sm sm:text-base text-[#1D1D1F] focus:outline-none focus:border-[#C84200] focus:ring-2 focus:ring-[#C84200]/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/80 mb-2">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the issue or inquiry"
                  className="w-full rounded-2xl border border-[#1D1D1F]/10 bg-[#FAF6F0] px-4 py-3.5 text-sm sm:text-base text-[#1D1D1F] focus:outline-none focus:border-[#C84200] focus:ring-2 focus:ring-[#C84200]/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/80 mb-2">
                  Related Book Listing, Profile, or Order URL (Optional)
                </label>
                <input
                  type="text"
                  value={relatedUrl}
                  onChange={(e) => setRelatedUrl(e.target.value)}
                  placeholder="e.g. /catalog/book-id or /profile/username"
                  className="w-full rounded-2xl border border-[#1D1D1F]/10 bg-[#FAF6F0] px-4 py-3.5 text-sm sm:text-base text-[#1D1D1F] focus:outline-none focus:border-[#C84200] focus:ring-2 focus:ring-[#C84200]/15 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/80 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include steps to reproduce, order/offer details, or relevant context..."
                  className="w-full rounded-2xl border border-[#1D1D1F]/10 bg-[#FAF6F0] p-4 text-sm sm:text-base text-[#1D1D1F] focus:outline-none focus:border-[#C84200] focus:ring-2 focus:ring-[#C84200]/15 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#C84200] hover:bg-[#A33500] disabled:opacity-50 px-8 py-3.5 text-sm sm:text-[15px] font-bold text-white transition-colors shadow-sm cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting Ticket..." : "Submit Support Ticket"}
              </button>
            </form>
          </div>

          {/* Right Column: My Support Tickets & Self-Service Links */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
              <h3 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#C84200]" />
                My Submitted Tickets ({myTickets.length})
              </h3>
              <p className="text-sm text-[#5E5E63] mt-1 mb-4 leading-relaxed">
                Live ticket tracking from Open and In Progress through Resolved.
              </p>

              {myTickets.length === 0 ? (
                <div className="rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-5 text-center text-sm text-[#5E5E63] leading-relaxed">
                  {session?.user
                    ? "You have no submitted support tickets yet."
                    : "Sign in to view and track your support ticket history across sessions."}
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {myTickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-[#1D1D1F]/[0.06] bg-[#FAF6F0] p-4 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#C84200]">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold uppercase ${
                            t.status === "RESOLVED" || t.status === "CLOSED"
                              ? "bg-emerald-100 text-[#0A7D4F]"
                              : t.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-[#0066cc]"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="font-bold text-[#1D1D1F] mt-2">
                        {t.subject}
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#5E5E63] mt-1 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                      {t.adminResponse && (
                        <div className="mt-3 rounded-xl bg-white border border-[#C84200]/20 p-3.5">
                          <div className="font-mono text-xs font-bold uppercase text-[#C84200]">
                            Official Support Response
                          </div>
                          <p className="text-sm text-[#1D1D1F] mt-1 leading-relaxed">
                            {t.adminResponse}
                          </p>
                        </div>
                      )}
                      <div className="mt-2.5 font-mono text-xs text-[#6E6E73]">
                        Submitted {new Date(t.createdAt).toLocaleDateString()} ·{" "}
                        {t.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#1D1D1F]/[0.07]">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Self-Service Resources
              </h3>
              <div className="mt-4 space-y-2.5 text-sm font-semibold">
                <Link
                  href="/help"
                  className="block rounded-2xl bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.06] px-4 py-3 text-[#1D1D1F] transition-colors"
                >
                  Browse 13-Category Help Center →
                </Link>
                <Link
                  href="/faq"
                  className="block rounded-2xl bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.06] px-4 py-3 text-[#1D1D1F] transition-colors"
                >
                  Frequently Asked Questions (FAQ) →
                </Link>
                <Link
                  href="/legal/account-appeals"
                  className="block rounded-2xl bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.06] px-4 py-3 text-[#1D1D1F] transition-colors"
                >
                  Account Appeals &amp; Moderation Policy →
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
        <div className="min-h-screen bg-[#F2EBE1] p-12 text-center text-sm font-semibold text-[#5E5E63]">
          Loading Support Desk...
        </div>
      }
    >
      <SupportPageContent />
    </Suspense>
  )
}
