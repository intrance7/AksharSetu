"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Truck,
  CheckCircle2,
  ArrowLeftRight,
  Star,
  MessageCircle,
  Loader2,
  X,
  Clock,
  ShieldCheck,
  BookOpen,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { GeneratedCover } from "@/components/catalog/GeneratedCover"

type TabId = "purchases" | "sales" | "incoming" | "outgoing" | "listings"

function OrderThumb({ book }: { book: any }) {
  const [err, setErr] = useState(false)
  if (book?.images?.[0] && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.images[0]}
        alt={book.title || "Book cover"}
        onError={() => setErr(true)}
        className="w-full h-full object-cover"
      />
    )
  }
  return (
    <GeneratedCover
      title={book?.title || "Book"}
      author={book?.author || "Reader"}
      category={book?.category}
    />
  )
}

const SHIPMENT_STEPS = ["READY_TO_SHIP", "SHIPPED", "DELIVERED"] as const

export function OrdersDashboardClient({
  purchases,
  sales,
  incomingRequests,
  outgoingRequests,
  myListings = [],
}: {
  purchases: any[]
  sales: any[]
  incomingRequests: any[]
  outgoingRequests: any[]
  myListings?: any[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>("purchases")
  const [busyId, setBusyId] = useState<string | null>(null)

  // Review Modal State
  const [reviewTarget, setReviewTarget] = useState<{
    orderId?: string
    requestId?: string
    bookTitle: string
    sellerName: string
  } | null>(null)
  const [rating, setRating] = useState(5)
  const [conditionAccurate, setConditionAccurate] = useState(true)
  const [meetupReliable, setMeetupReliable] = useState(true)
  const [comment, setComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  // Listing Edit Modal State
  const [editBook, setEditBook] = useState<any | null>(null)
  const [savingListing, setSavingListing] = useState(false)

  const handleShipmentUpdate = async (orderId: string, status: string) => {
    setBusyId(orderId)
    try {
      const res = await fetch(`/api/shipments/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(`Shipment updated to ${status.replace(/_/g, " ")}!`)
      router.refresh()
    } catch {
      toast.error("Could not update shipment status")
    } finally {
      setBusyId(null)
    }
  }

  const handleRequestStatus = async (requestId: string, status: string) => {
    setBusyId(requestId)
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success(`Request marked as ${status.toLowerCase()}!`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not update request")
    } finally {
      setBusyId(null)
    }
  }

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBook || savingListing) return
    setSavingListing(true)
    try {
      const res = await fetch(`/api/listings/${editBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editBook.title,
          price: Number(editBook.price) || 0,
          condition: editBook.condition,
          status: editBook.status,
          acceptsExchange: Boolean(editBook.acceptsExchange),
          exchangePreferences: editBook.exchangePreferences || "",
          description: editBook.description || "",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update listing")
      toast.success("Listing updated!")
      setEditBook(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not update listing")
    } finally {
      setSavingListing(false)
    }
  }

  const handleDeleteListing = async (bookId: string) => {
    setBusyId(bookId)
    try {
      const res = await fetch(`/api/listings/${bookId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success(
        data.archived
          ? "Listing archived (historical transactions preserved)."
          : "Listing deleted."
      )
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not remove listing")
    } finally {
      setBusyId(null)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewTarget || submittingReview) return
    setSubmittingReview(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: reviewTarget.orderId,
          requestId: reviewTarget.requestId,
          rating,
          conditionAccurate,
          meetupReliable,
          comment,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      toast.success(
        `Verified ${rating}★ review submitted! Seller trust score updated to ${data.newSellerRating}★.`
      )
      setReviewTarget(null)
      setComment("")
      setRating(5)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "purchases", label: "My Purchases", count: purchases.length },
    { id: "sales", label: "My Sales", count: sales.length },
    {
      id: "incoming",
      label: "Incoming Swaps & Requests",
      count: incomingRequests.length,
    },
    {
      id: "outgoing",
      label: "Sent Swaps & Requests",
      count: outgoingRequests.length,
    },
    { id: "listings", label: "My Listings", count: myListings.length },
  ]

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        {tabs.map((t) => {
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                active
                  ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm"
                  : "bg-white text-[#1D1D1F] hover:bg-[#FAF6F0] border-[#1D1D1F]/[0.07]"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-xs font-bold ${
                  active
                    ? "bg-[#C84200] text-white"
                    : "bg-[#FAF6F0] text-[#6e6e73]"
                }`}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: MY PURCHASES */}
      {activeTab === "purchases" && (
        <div className="space-y-5">
          {purchases.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
              <Package className="w-11 h-11 text-[#86868b]/40 mx-auto mb-3.5" />
              <p className="font-black text-xl text-[#1D1D1F]">
                No purchases yet
              </p>
              <p className="text-sm text-[#6e6e73] mt-1.5 mb-6 max-w-md mx-auto leading-relaxed">
                Books you purchase in the marketplace will appear here with live
                shipment tracking and verified handoff controls.
              </p>
              <Link
                href="/catalog"
                className="inline-flex px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition shadow-sm"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            purchases.map((order) => {
              const shipStatus = order.shipment?.status || "READY_TO_SHIP"
              const stepIdx = Math.max(0, SHIPMENT_STEPS.indexOf(shipStatus))

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.04)] space-y-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-20 rounded-xl bg-[#FAF6F0] overflow-hidden shrink-0 border border-[#1D1D1F]/[0.07] shadow-xs">
                        <OrderThumb book={order.book} />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#0A7D4F] bg-[#0A7D4F]/10 px-3 py-1 rounded-full mb-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> {order.status}{" "}
                          · ₹{order.amount}
                        </span>
                        <h3 className="text-lg font-black text-[#1D1D1F] break-words tracking-tight">
                          {order.book.title}
                        </h3>
                        <p className="text-[13px] text-[#6e6e73] truncate mt-0.5">
                          Seller: {order.book.owner?.name || "Reader"} ·{" "}
                          <span className="font-mono">
                            {order.shipment?.awbCode
                              ? `AWB #${order.shipment.awbCode}`
                              : "Preparing"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/messages/${order.book.ownerId}?orderId=${order.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-[13px] font-bold transition"
                      >
                        <MessageCircle className="w-4 h-4" /> Message Seller
                      </Link>

                      {shipStatus === "SHIPPED" && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() =>
                            handleShipmentUpdate(order.id, "DELIVERED")
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A7D4F] hover:bg-[#08633F] text-white text-[13px] font-bold transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Confirm Delivery
                        </button>
                      )}

                      {!order.review ? (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewTarget({
                              orderId: order.id,
                              bookTitle: order.book.title,
                              sellerName: order.book.owner?.name || "Seller",
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[13px] font-bold transition cursor-pointer"
                        >
                          <Star className="w-4 h-4" /> Rate Seller
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          Reviewed ({order.review.rating}★)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Shipment Timeline */}
                  <div className="pt-4 border-t border-[#1D1D1F]/[0.07]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Ready to Ship", sub: "Escrow Verified" },
                        {
                          label: "In Transit",
                          sub: order.shipment?.courierName || "Express Courier",
                        },
                        { label: "Delivered", sub: "Handoff Complete" },
                      ].map((st, idx) => {
                        const done = idx <= stepIdx
                        return (
                          <div
                            key={st.label}
                            className={`rounded-2xl p-3.5 border text-[13px] ${
                              done
                                ? "bg-[#0066cc]/[0.06] border-[#0066cc]/25 text-[#1D1D1F]"
                                : "bg-[#FAF6F0] border-transparent text-[#86868b]"
                            }`}
                          >
                            <p className="font-bold flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  done ? "bg-[#0066cc]" : "bg-[#86868b]/40"
                                }`}
                              />
                              {st.label}
                            </p>
                            <p className="text-xs opacity-80 mt-0.5">{st.sub}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* TAB 2: MY SALES */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          {sales.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
              <Truck className="w-11 h-11 text-[#86868b]/40 mx-auto mb-3.5" />
              <p className="font-black text-xl text-[#1D1D1F]">No sales yet</p>
              <p className="text-sm text-[#6e6e73] mt-1.5 mb-6 max-w-md mx-auto leading-relaxed">
                List your pre-loved textbooks or novels to earn or swap with
                readers nearby.
              </p>
              <Link
                href="/catalog/new"
                className="inline-flex px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition shadow-sm"
              >
                List a Book
              </Link>
            </div>
          ) : (
            sales.map((order) => {
              const shipStatus = order.shipment?.status || "READY_TO_SHIP"
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.04)] flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0066cc]">
                      AWB #{order.shipment?.awbCode || "PENDING"} ·{" "}
                      {shipStatus.replace(/_/g, " ")}
                    </span>
                    <h3 className="text-lg font-black text-[#1D1D1F] mt-1 tracking-tight">
                      {order.book.title}
                    </h3>
                    <p className="text-[13px] text-[#6e6e73] mt-0.5">
                      Buyer: {order.buyer?.name || "Reader"} · Order Total:{" "}
                      <span className="font-mono font-bold text-[#1D1D1F]">
                        ₹{order.amount}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/messages/${order.buyerId}?orderId=${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-[13px] font-bold transition"
                    >
                      <MessageCircle className="w-4 h-4" /> Message Buyer
                    </Link>
                    {shipStatus === "READY_TO_SHIP" && (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() =>
                          handleShipmentUpdate(order.id, "SHIPPED")
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[13px] font-bold transition cursor-pointer"
                      >
                        {busyId === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                        Mark Dispatched
                      </button>
                    )}
                    {shipStatus === "SHIPPED" && (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() =>
                          handleShipmentUpdate(order.id, "DELIVERED")
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A7D4F] hover:bg-[#08633F] text-white text-[13px] font-bold transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* TAB 3: INCOMING SWAPS & BOOK REQUESTS */}
      {activeTab === "incoming" && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
              <ArrowLeftRight className="w-11 h-11 text-[#86868b]/40 mx-auto mb-3.5" />
              <p className="font-black text-xl text-[#1D1D1F]">
                No incoming swap or donation requests
              </p>
              <p className="text-sm text-[#6e6e73] mt-1.5 max-w-md mx-auto leading-relaxed">
                When readers propose a 1-for-1 swap or request a free book you
                listed, you can approve or complete them here.
              </p>
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-xs font-bold uppercase tracking-wider">
                      {req.offeredBookId
                        ? "1-for-1 Swap Proposal"
                        : "Book Request"}{" "}
                      · {req.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#1D1D1F] tracking-tight">
                    {req.requester?.name || "Reader"} requested &ldquo;
                    {req.book.title}&rdquo;
                  </h3>
                  {req.message && (
                    <p className="text-sm text-[#6e6e73] bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] rounded-2xl px-4 py-2.5 max-w-xl leading-relaxed">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/messages/${req.requesterId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-[13px] font-bold transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </Link>

                  {req.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleRequestStatus(req.id, "APPROVED")}
                        className="px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[13px] font-bold transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleRequestStatus(req.id, "REJECTED")}
                        className="px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-red-50 hover:text-red-700 border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-[13px] font-bold transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {req.status === "APPROVED" && (
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleRequestStatus(req.id, "COMPLETED")}
                      className="px-4 py-2 rounded-full bg-[#0A7D4F] hover:bg-[#08633F] text-white text-[13px] font-bold transition cursor-pointer"
                    >
                      Mark Handoff Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: OUTGOING SWAPS & REQUESTS */}
      {activeTab === "outgoing" && (
        <div className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
              <Clock className="w-11 h-11 text-[#86868b]/40 mx-auto mb-3.5" />
              <p className="font-black text-xl text-[#1D1D1F]">
                No outgoing swap proposals yet
              </p>
              <p className="text-sm text-[#6e6e73] mt-1.5 max-w-md mx-auto leading-relaxed">
                Open any listing in the catalog and click &ldquo;Propose
                1-for-1 Book Swap&rdquo; to trade books directly.
              </p>
            </div>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.04)] flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] font-mono text-xs font-bold uppercase text-[#1D1D1F]">
                    Status: {req.status}
                  </span>
                  <h3 className="text-lg font-black text-[#1D1D1F] mt-1.5 tracking-tight">
                    {req.book.title}
                  </h3>
                  <p className="text-[13px] text-[#6e6e73]">
                    Owner: {req.book.owner?.name || "Reader"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/messages/${req.book.ownerId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-[13px] font-bold transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </Link>

                  {req.status === "COMPLETED" && !req.review && (
                    <button
                      type="button"
                      onClick={() =>
                        setReviewTarget({
                          requestId: req.id,
                          bookTitle: req.book.title,
                          sellerName: req.book.owner?.name || "Owner",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[13px] font-bold transition cursor-pointer"
                    >
                      <Star className="w-4 h-4" /> Leave Verified Review
                    </button>
                  )}

                  {req.review && (
                    <span className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {req.review.rating}★
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: MY LISTINGS (SELLER LISTING MANAGER) */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-[#6e6e73]">
              Edit pricing, toggle 1-for-1 swap preferences, or unlist books you
              have shared outside the platform.
            </p>
            <Link
              href="/catalog/new"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-[13px] font-bold transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> New Listing
            </Link>
          </div>

          {myListings.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#1D1D1F]/[0.07] shadow-[0_6px_28px_rgba(29,29,31,0.04)]">
              <BookOpen className="w-11 h-11 text-[#86868b]/40 mx-auto mb-3.5" />
              <p className="font-black text-xl text-[#1D1D1F]">
                You haven&apos;t listed any books yet
              </p>
              <p className="text-sm text-[#6e6e73] mt-1.5 mb-6 max-w-md mx-auto leading-relaxed">
                Share textbooks, novels, or semester packs for sale, 1-for-1
                swap, or free community donation.
              </p>
              <Link
                href="/catalog/new"
                className="inline-flex px-6 py-3 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white text-sm font-bold transition shadow-sm"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            myListings.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.04)] flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-20 rounded-xl bg-[#FAF6F0] overflow-hidden shrink-0 border border-[#1D1D1F]/[0.07] shadow-xs">
                    <OrderThumb book={book} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`font-mono text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          book.status === "AVAILABLE"
                            ? "bg-[#0A7D4F]/10 text-[#0A7D4F]"
                            : "bg-[#FAF6F0] text-[#6e6e73]"
                        }`}
                      >
                        {book.status}
                      </span>
                      <span className="font-mono text-xs font-black text-[#C84200]">
                        {book.price === 0
                          ? book.acceptsExchange
                            ? "1-for-1 Swap"
                            : "Free Vidya Daan"
                          : `₹${book.price}`}
                      </span>
                      {book.isBundle && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70">
                          Pack ({book.booksInBundle})
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/catalog/${book.id}`}
                      className="text-lg font-black text-[#1D1D1F] hover:text-[#C84200] transition-colors tracking-tight"
                    >
                      {book.title}
                    </Link>
                    <p className="text-[13px] text-[#6e6e73]">
                      {book.author} · {book.condition.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditBook({ ...book })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-[13px] font-bold transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    disabled={busyId === book.id}
                    onClick={() => handleDeleteListing(book.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[13px] font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Unlist
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Listing Modal */}
      <AnimatePresence>
        {editBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditBook(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1D1D1F]/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setEditBook(null)}
                aria-label="Close edit listing modal"
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#1D1D1F]" />
              </button>

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C84200] mb-1">
                Listing Manager
              </p>
              <h2 className="text-xl font-black text-[#1D1D1F] mb-5 pr-10 tracking-tight">
                Edit &ldquo;{editBook.title}&rdquo;
              </h2>

              <form onSubmit={handleSaveListing} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editBook.title}
                    onChange={(e) =>
                      setEditBook({ ...editBook, title: e.target.value })
                    }
                    className="w-full h-11 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 text-sm font-medium outline-none focus:bg-white focus:border-[#C84200]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                      Price (₹, 0 = Free)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editBook.price}
                      onChange={(e) =>
                        setEditBook({ ...editBook, price: e.target.value })
                      }
                      className="w-full h-11 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 font-mono text-sm font-bold outline-none focus:bg-white focus:border-[#C84200]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                      Status
                    </label>
                    <select
                      value={editBook.status}
                      onChange={(e) =>
                        setEditBook({ ...editBook, status: e.target.value })
                      }
                      className="w-full h-11 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-3.5 text-sm font-semibold outline-none focus:bg-white focus:border-[#C84200]"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="SOLD">SOLD</option>
                      <option value="UNLISTED">UNLISTED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                      Condition
                    </label>
                    <select
                      value={editBook.condition}
                      onChange={(e) =>
                        setEditBook({ ...editBook, condition: e.target.value })
                      }
                      className="w-full h-11 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-3.5 text-sm font-semibold outline-none focus:bg-white focus:border-[#C84200]"
                    >
                      <option value="NEW">NEW</option>
                      <option value="LIKE_NEW">LIKE NEW</option>
                      <option value="GOOD">GOOD</option>
                      <option value="FAIR">FAIR</option>
                      <option value="POOR">POOR</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2.5">
                    <label className="flex items-center gap-2 text-[13px] font-bold text-[#1D1D1F] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editBook.acceptsExchange)}
                        onChange={(e) =>
                          setEditBook({
                            ...editBook,
                            acceptsExchange: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-[#C84200]"
                      />
                      Accept 1-for-1 Swap
                    </label>
                  </div>
                </div>

                {editBook.acceptsExchange && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                      Swap Preferences
                    </label>
                    <input
                      type="text"
                      value={editBook.exchangePreferences || ""}
                      onChange={(e) =>
                        setEditBook({
                          ...editBook,
                          exchangePreferences: e.target.value,
                        })
                      }
                      placeholder="Books or genres you'd trade for..."
                      className="w-full h-11 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] px-4 text-sm outline-none focus:bg-white focus:border-[#C84200]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editBook.description || ""}
                    onChange={(e) =>
                      setEditBook({ ...editBook, description: e.target.value })
                    }
                    className="w-full rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] p-3.5 text-sm outline-none resize-none focus:bg-white focus:border-[#C84200]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingListing}
                  className="w-full py-3.5 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  {savingListing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verified Seller Review Modal */}
      <AnimatePresence>
        {reviewTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1D1D1F]/[0.08] max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                aria-label="Close review modal"
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-[#EFE7DC] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#1D1D1F]" />
              </button>

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066cc] mb-1">
                Verified Trust Rating
              </p>
              <h2 className="text-xl font-black text-[#1D1D1F] mb-1 pr-10 tracking-tight">
                Rate {reviewTarget.sellerName}
              </h2>
              <p className="text-sm text-[#6e6e73] mb-6 leading-relaxed">
                For &ldquo;{reviewTarget.bookTitle}&rdquo; — directly updates
                their community trust score.
              </p>

              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-2">
                    Overall Experience
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 transition transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] p-4 rounded-2xl">
                  <label className="flex items-center justify-between gap-3 text-[13px] font-semibold text-[#1D1D1F] cursor-pointer">
                    <span>Book condition matched listing description?</span>
                    <input
                      type="checkbox"
                      checked={conditionAccurate}
                      onChange={(e) => setConditionAccurate(e.target.checked)}
                      className="w-4 h-4 accent-[#0066cc] shrink-0"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-[13px] font-semibold text-[#1D1D1F] cursor-pointer">
                    <span>Smooth shipping / punctual meetup handoff?</span>
                    <input
                      type="checkbox"
                      checked={meetupReliable}
                      onChange={(e) => setMeetupReliable(e.target.checked)}
                      className="w-4 h-4 accent-[#0066cc] shrink-0"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-1.5">
                    Review Comment (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Fast dispatch and crisp pages as promised!"
                    className="w-full rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#0066cc] focus:bg-white p-3.5 text-sm text-[#1D1D1F] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                >
                  {submittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Verified Review"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
