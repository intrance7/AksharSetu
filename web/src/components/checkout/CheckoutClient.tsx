"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Book } from "@prisma/client"
import {
  ShieldCheck,
  Loader2,
  MapPin,
  Truck,
  Handshake,
  CheckCircle2,
} from "lucide-react"
import { RazorpayButton } from "./RazorpayButton"
import { GeneratedCover } from "@/components/catalog/GeneratedCover"
import { toast } from "sonner"

interface CheckoutClientProps {
  book: Book & { owner: { name: string | null } }
  user: any
  platformFee: number
}

export function CheckoutClient({
  book,
  user,
  platformFee,
}: CheckoutClientProps) {
  const router = useRouter()
  const [fulfillmentMode, setFulfillmentMode] = useState<"SHIPPING" | "MEETUP">(
    book.deliveryType === "MEETUP" ? "MEETUP" : "SHIPPING"
  )
  const [pincode, setPincode] = useState("")
  const [meetupSpot, setMeetupSpot] = useState("")
  const [shippingFee, setShippingFee] = useState<number | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [loadingRate, setLoadingRate] = useState(false)
  const [reservingMeetup, setReservingMeetup] = useState(false)
  const [imgError, setImgError] = useState(false)

  const isMeetup = fulfillmentMode === "MEETUP"
  const effectivePlatformFee = isMeetup ? 0 : platformFee
  const effectiveShipping = isMeetup ? 0 : shippingFee || 0
  const total = book.price + effectivePlatformFee + effectiveShipping

  const checkPincode = async () => {
    if (pincode.length !== 6) return
    setLoadingRate(true)

    try {
      const res = await fetch("/api/shiprocket/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_pincode: "110001",
          delivery_pincode: pincode,
          weight: 0.5,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setShippingFee(data.rate)
        setEta(data.eta)
      } else {
        setShippingFee(90)
      }
    } catch {
      setShippingFee(90)
    } finally {
      setLoadingRate(false)
    }
  }

  const handleReserveMeetup = async () => {
    if (reservingMeetup) return
    setReservingMeetup(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          fulfillmentMode: "MEETUP",
          meetupSpot: meetupSpot.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Could not reserve book for meetup")
      }
      toast.success(
        `Book reserved for local meetup (#${data.awbCode})! Seller notified.`
      )
      router.push(
        `/checkout/success?orderId=${data.orderId}&awb=${
          data.awbCode || ""
        }&mode=meetup`
      )
    } catch (err: any) {
      toast.error(err.message || "Reservation failed")
    } finally {
      setReservingMeetup(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left/Top Column */}
      <div className="md:col-span-2 space-y-6">
        {/* Fulfillment Mode Selector */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#1D1D1F]/5 space-y-5">
          <h2 className="text-xl font-black text-[#1D1D1F]">
            1. Choose Handoff Method
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setFulfillmentMode("SHIPPING")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                !isMeetup
                  ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm"
                  : "bg-[#F2EBE1]/50 text-[#1D1D1F] border-black/10 hover:bg-[#F2EBE1]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#C84200]" /> Doorstep Courier
                </span>
                {!isMeetup && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p
                className={`text-xs font-medium ${
                  !isMeetup ? "text-white/75" : "text-[#86868b]"
                }`}
              >
                Tracked shipping across India with escrow protection.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFulfillmentMode("MEETUP")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isMeetup
                  ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm"
                  : "bg-[#F2EBE1]/50 text-[#1D1D1F] border-black/10 hover:bg-[#F2EBE1]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-[#0066cc]" /> Campus / City
                  Meetup
                </span>
                {isMeetup && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p
                className={`text-xs font-medium ${
                  isMeetup ? "text-white/75" : "text-[#86868b]"
                }`}
              >
                ₹0 shipping & ₹0 platform fee · Inspect & pay on handoff.
              </p>
            </button>
          </div>

          {!isMeetup ? (
            <div className="pt-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1d1d1f] mb-2">
                  Delivery Pincode (6 digits)
                </label>
                <div className="flex gap-2">
                  <input
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="e.g. 400001"
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                  />
                  <button
                    type="button"
                    onClick={checkPincode}
                    disabled={pincode.length !== 6 || loadingRate}
                    className="px-6 bg-[#1D1D1F] text-white rounded-xl font-bold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {loadingRate ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Check"
                    )}
                  </button>
                </div>
              </div>

              {shippingFee !== null && (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-medium">
                  Delivery available! Estimated arrival:{" "}
                  <span className="font-bold">{eta}</span> (₹{shippingFee})
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-bold text-[#1d1d1f]">
                Preferred Campus / Metro Meetup Spot (Optional)
              </label>
              <input
                value={meetupSpot}
                onChange={(e) => setMeetupSpot(e.target.value)}
                placeholder="e.g. Central Library Gate, Rajiv Chowk Metro, Student Center..."
                className="w-full bg-[#F2EBE1] border-transparent focus:border-[#0066cc]/30 focus:bg-white rounded-xl px-4 py-3 text-sm font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/70"
              />
              <p className="text-xs text-[#86868b] font-medium">
                Reserving automatically opens a direct chat thread with{" "}
                <span className="font-bold text-[#1d1d1f]">
                  {book.owner.name || "the seller"}
                </span>{" "}
                to finalize timing.
              </p>
            </div>
          )}
        </div>

        {/* Item Summary */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#1D1D1F]/5">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6">
            2. Item Summary
          </h2>
          <div className="flex gap-4 sm:gap-6 items-start">
            <div className="w-20 sm:w-24 aspect-[5/7] bg-[#FAF6F0] rounded-xl overflow-hidden shrink-0 border border-black/5">
              {book.images?.[0] && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.images[0]}
                  alt={book.title}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <GeneratedCover
                  title={book.title}
                  author={book.author}
                  category={book.category}
                />
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <h3 className="font-bold text-base sm:text-lg text-[#1D1D1F] leading-snug mb-1 break-words">
                {book.title}
              </h3>
              <p className="text-[#1D1D1F]/60 text-sm font-medium mb-3 truncate">
                {book.author}
              </p>
              <p className="text-[#1D1D1F]/50 text-xs font-bold uppercase tracking-wider">
                Condition: {book.condition.replace("_", " ")}
              </p>
              <p className="text-[#1D1D1F]/50 text-xs font-bold uppercase tracking-wider mt-1 truncate">
                Seller: {book.owner.name || "Community Reader"}
              </p>
            </div>
          </div>
        </div>

        {/* Buyer Protection */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#1D1D1F]/5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-[#1D1D1F] mb-1">
              Buyer Protection Guarantee
            </h4>
            <p className="text-sm text-[#1D1D1F]/60 font-medium">
              {isMeetup
                ? "Inspect the book's condition in person during your campus/local meetup before completing payment."
                : "Your payment is held securely in escrow until you receive the book in the described condition."}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown (Right/Bottom) */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1D1D1F]/5 sticky top-28">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6">
            Payment Details
          </h2>

          <div className="space-y-4 mb-6 text-sm font-medium text-[#1D1D1F]/70">
            <div className="flex justify-between">
              <span>Book Price</span>
              <span className="font-bold text-[#1D1D1F]">₹{book.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="font-bold text-[#1D1D1F]">
                {isMeetup ? "₹0 (Free for Meetup)" : `₹${effectivePlatformFee}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              {isMeetup ? (
                <span className="font-bold text-emerald-600">₹0 (Meetup)</span>
              ) : shippingFee === null ? (
                <span className="text-[#C84200] text-xs font-bold uppercase tracking-wider">
                  Enter pincode
                </span>
              ) : (
                <span className="font-bold text-[#1D1D1F]">₹{shippingFee}</span>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-[#1D1D1F]/10 mb-6" />

          <div className="flex justify-between items-center mb-8">
            <span className="font-black text-[#1D1D1F] uppercase tracking-wider text-sm">
              Total
            </span>
            <span className="font-black text-2xl text-[#1D1D1F]">₹{total}</span>
          </div>

          {isMeetup ? (
            <button
              type="button"
              disabled={reservingMeetup}
              onClick={handleReserveMeetup}
              className="w-full py-4 px-6 rounded-full font-bold flex items-center justify-center gap-2 bg-[#0066cc] hover:bg-[#0071e3] text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {reservingMeetup ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Reserving...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" /> Reserve for Meetup (₹
                  {book.price})
                </>
              )}
            </button>
          ) : shippingFee === null ? (
            <div className="w-full py-4 px-6 rounded-full font-bold flex items-center justify-center gap-2 bg-[#1D1D1F]/10 text-[#1D1D1F]/50 text-sm">
              Enter Pincode to Continue
            </div>
          ) : (
            <RazorpayButton
              book={book as any}
              user={user}
              amount={total}
              deliveryPincode={pincode}
            />
          )}

          <p className="text-center text-xs text-[#1D1D1F]/50 font-medium mt-4">
            By confirming, you agree to our{" "}
            <Link href="/legal/terms" className="underline hover:text-[#C84200]">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
