import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import {
  Plus,
  BookOpen,
  Clock,
  User,
  HeartHandshake,
  MessageCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { RequestFormDialog } from "@/components/requests/RequestFormDialog"
import { RequestCardActions } from "@/components/requests/RequestCardActions"

export const dynamic = "force-dynamic"

export default async function CommunityRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const session = await auth()
  const { filter = "all" } = await searchParams

  const whereClause =
    filter === "open"
      ? { status: "OPEN" }
      : filter === "fulfilled"
      ? { status: "FULFILLED" }
      : filter === "mine" && session?.user?.id
      ? { requesterId: session.user.id }
      : {}

  const requests = await prisma.communityRequest.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          location: true,
        },
      },
    },
  })

  const filters = [
    { id: "all", label: "All Requests" },
    { id: "open", label: "Open Needs" },
    { id: "fulfilled", label: "Fulfilled" },
    ...(session?.user?.id ? [{ id: "mine", label: "My Requests" }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#F2EBE1] pb-24">
      {/* Signature Obsidian Editorial Hero */}
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

        <div className="container mx-auto max-w-6xl px-4 md:px-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.07] border border-white/15 text-[#F2EBE1]/90 text-xs font-bold uppercase tracking-[0.14em] rounded-full mb-5">
              <HeartHandshake className="w-4 h-4 text-[#FF7F45]" /> Community
              Book Bulletin
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.03] mb-4">
              Request a{" "}
              <span className="font-serif italic font-normal text-[#FF7F45]">
                Book.
              </span>
            </h1>
            <p className="text-base md:text-lg text-[#F2EBE1]/72 leading-relaxed max-w-2xl">
              Looking for an out-of-print edition, semester textbook, or rare
              classic? Post a request and connect directly with readers who own
              a copy.
            </p>
          </div>

          <div className="shrink-0">
            {session ? (
              <RequestFormDialog />
            ) : (
              <Link
                href="/login?callbackUrl=/requests"
                className="inline-flex bg-[#C84200] hover:bg-[#FF7F45] hover:text-[#0B0B0D] text-white px-6 py-3.5 rounded-full text-sm font-bold items-center gap-2 transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" /> Post a Request
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pt-8">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-6">
          {filters.map((f) => {
            const active = filter === f.id
            return (
              <Link
                key={f.id}
                href={f.id === "all" ? "/requests" : `/requests?filter=${f.id}`}
                className={`px-4 py-2 rounded-full text-[13px] font-bold transition whitespace-nowrap shrink-0 border ${
                  active
                    ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-xs"
                    : "bg-white text-[#1D1D1F] border-[#1D1D1F]/[0.07] hover:bg-[#FAF6F0]"
                }`}
              >
                {f.label}
              </Link>
            )
          })}
          <span className="ml-auto hidden sm:inline-flex px-3 py-1.5 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] font-mono text-xs font-bold text-[#6e6e73] shrink-0">
            {requests.length} {requests.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {/* List of Requests */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-7 h-7 text-[#C84200]" />
            </div>
            <h3 className="text-2xl font-black text-[#1D1D1F] mb-2 tracking-tight">
              No matching requests yet
            </h3>
            <p className="text-[#6e6e73] text-[15px] leading-relaxed max-w-md mx-auto">
              Be the first to post a book request and let fellow readers across
              campuses help you track down a copy.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => {
              const isMine = session?.user?.id === req.requester.id
              const isAdmin = session?.user?.role === "ADMIN"
              const requesterHandle = req.requester.username || req.requester.id

              return (
                <article
                  key={req.id}
                  className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] flex flex-col hover:-translate-y-1 hover:shadow-[0_20px_44px_-14px_rgba(29,29,31,0.12)] hover:border-[#C84200]/25 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        req.status === "FULFILLED"
                          ? "bg-[#0A7D4F]/10 text-[#0A7D4F] border border-[#0A7D4F]/20"
                          : "bg-[#C84200]/10 text-[#C84200] border border-[#C84200]/20"
                      }`}
                    >
                      {req.status === "FULFILLED"
                        ? "Fulfilled"
                        : "Looking for Copy"}
                    </span>

                    {(isMine || isAdmin) && (
                      <RequestCardActions
                        requestId={req.id}
                        status={req.status}
                      />
                    )}
                  </div>

                  <h3 className="text-xl font-black text-[#1D1D1F] leading-snug tracking-tight mb-1 break-words">
                    {req.title}
                  </h3>
                  {req.author && (
                    <p className="text-sm font-serif italic text-[#0066cc] mb-3">
                      by {req.author}
                    </p>
                  )}

                  <p className="text-[#6e6e73] text-[15px] leading-relaxed line-clamp-3 mb-6">
                    {req.description ||
                      "Open to buying, borrowing, or swapping a clean copy."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-[#1D1D1F]/[0.07] flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/profile/${requesterHandle}`}
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      {req.requester.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={req.requester.image}
                          alt={req.requester.name || "Reader"}
                          className="w-9 h-9 rounded-full object-cover shrink-0 bg-[#FAF6F0] border border-[#1D1D1F]/[0.08]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#C84200]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#1D1D1F] group-hover:text-[#C84200] transition-colors truncate">
                          {req.requester.name || "Reader"}
                        </p>
                        <p className="text-xs text-[#86868b] flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {formatDistanceToNow(new Date(req.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </Link>

                    {!isMine && req.status !== "FULFILLED" && (
                      <Link
                        href={
                          session
                            ? `/messages/${req.requester.id}?action=fulfill_request&reqId=${req.id}`
                            : `/login?callbackUrl=${encodeURIComponent(
                                `/messages/${req.requester.id}?action=fulfill_request&reqId=${req.id}`
                              )}`
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full text-xs font-bold transition shrink-0 shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />I Have This
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
