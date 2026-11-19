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
        select: { id: true, name: true, image: true, location: true },
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
    <div className="min-h-screen bg-[#F2EBE1] pb-20">
      {/* High-Contrast Hero */}
      <section className="bg-black text-[#F5F5F7] py-14 md:py-16 border-b border-white/10">
        <div className="container mx-auto max-w-6xl px-4 md:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 text-[#F5F5F7]/90 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              <HeartHandshake className="w-3.5 h-3.5 text-[#C84200]" />{" "}
              Community Book Bulletin
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-3">
              Request a Book.
            </h1>
            <p className="text-base md:text-lg text-[#86868b] max-w-2xl">
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
                className="inline-flex bg-[#C84200] hover:bg-[#A33500] text-white px-6 py-3 rounded-full text-sm font-bold items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Post a Request
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 md:px-8 pt-8">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6">
          {filters.map((f) => {
            const active = filter === f.id
            return (
              <Link
                key={f.id}
                href={f.id === "all" ? "/requests" : `/requests?filter=${f.id}`}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-[#1D1D1F] text-white shadow-sm"
                    : "bg-white text-[#1d1d1f] hover:bg-[#FAF6F0] border border-black/5"
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        {/* List of Requests */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-black/5 shadow-sm">
            <BookOpen className="w-12 h-12 text-[#C84200]/40 mx-auto mb-4" />
            <h3 className="text-xl font-black text-[#1d1d1f] mb-1">
              No matching requests
            </h3>
            <p className="text-[#86868b] text-sm max-w-md mx-auto">
              Be the first to post a book request and let fellow readers help
              you track it down.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => {
              const isMine = session?.user?.id === req.requester.id
              const isAdmin = session?.user?.role === "ADMIN"

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === "FULFILLED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-[#C84200]/10 text-[#C84200]"
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

                  <h3 className="text-lg font-black text-[#1d1d1f] leading-snug mb-1 break-words">
                    {req.title}
                  </h3>
                  {req.author && (
                    <p className="text-xs font-bold text-[#0066cc] mb-3">
                      by {req.author}
                    </p>
                  )}

                  <p className="text-[#86868b] text-sm line-clamp-3 mb-6">
                    {req.description ||
                      "Open to buying, borrowing, or swapping a clean copy."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/profile/${req.requester.id}`}
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      {req.requester.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={req.requester.image}
                          alt={req.requester.name || "Reader"}
                          className="w-8 h-8 rounded-full object-cover shrink-0 bg-[#FAF6F0]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-black/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#C84200]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#C84200] truncate">
                          {req.requester.name || "Reader"}
                        </p>
                        <p className="text-[10px] text-[#86868b] flex items-center gap-1">
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full text-xs font-bold transition shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />I Have This
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
