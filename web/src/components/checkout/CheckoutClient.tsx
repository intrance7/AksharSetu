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
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] space-y-5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-full bg-[#FAF6F0] text-[#C84200] border border-[#C84200]/20">
              01
            </span>
            <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">
              Choose Handoff Method
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFulfillmentMode("SHIPPING")}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                !isMeetup
                  ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm"
                  : "bg-[#FAF6F0] text-[#1D1D1F] border-[#1D1D1F]/[0.08] hover:bg-[#EFE7DC]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[15px] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#FF7F45]" /> Doorstep Courier
                </span>
                {!isMeetup && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p
                className={`text-[13px] font-medium leading-relaxed ${
                  !isMeetup ? "text-white/75" : "text-[#6e6e73]"
                }`}
              >
                Tracked shipping across India with escrow protection.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFulfillmentMode("MEETUP")}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                isMeetup
                  ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm"
                  : "bg-[#FAF6F0] text-[#1D1D1F] border-[#1D1D1F]/[0.08] hover:bg-[#EFE7DC]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[15px] flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-[#0066cc]" /> Campus / City
                  Meetup
                </span>
                {isMeetup && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p
                className={`text-[13px] font-medium leading-relaxed ${
                  isMeetup ? "text-white/75" : "text-[#6e6e73]"
                }`}
              >
                ₹0 shipping &amp; ₹0 platform fee · Inspect &amp; pay on
                handoff.
              </p>
            </button>
          </div>

          {!isMeetup ? (
            <div className="pt-2 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F] mb-2">
                  Delivery Pincode (6 digits)
                </label>
                <div className="flex gap-2.5">
                  <input
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="e.g. 400001"
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#C84200]/50 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-2xl px-4 py-3 font-mono text-sm font-semibold text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
                  />
                  <button
                    type="button"
                    onClick={checkPincode}
                    disabled={pincode.length !== 6 || loadingRate}
                    className="px-6 bg-[#1D1D1F] hover:bg-[#C84200] text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors cursor-pointer shrink-0"
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
                <div className="p-4 bg-[#0A7D4F]/[0.08] text-[#0A7D4F] rounded-2xl border border-[#0A7D4F]/20 text-sm font-medium">
                  Delivery available! Estimated arrival:{" "}
                  <span className="font-bold">{eta}</span> (
                  <span className="font-mono font-bold">₹{shippingFee}</span>)
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                Preferred Campus / Metro Meetup Spot (Optional)
              </label>
              <input
                value={meetupSpot}
                onChange={(e) => setMeetupSpot(e.target.value)}
                placeholder="e.g. Central Library Gate, Rajiv Chowk Metro, Student Center..."
                className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] focus:border-[#0066cc]/50 focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10 rounded-2xl px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]"
              />
              <p className="text-[13px] text-[#6e6e73] font-medium leading-relaxed">
                Reserving automatically opens a direct chat thread with{" "}
                <span className="font-bold text-[#1D1D1F]">
                  {book.owner.name || "the seller"}
                </span>{" "}
                to finalize timing.
              </p>
            </div>
          )}
        </div>

        {/* Item Summary */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07]">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-full bg-[#FAF6F0] text-[#C84200] border border-[#C84200]/20">
              02
            </span>
            <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">
              Item Summary
            </h2>
          </div>

          <div className="flex gap-4 sm:gap-6 items-start">
            <div className="w-20 sm:w-24 aspect-[5/7] bg-[#FAF6F0] rounded-xl overflow-hidden shrink-0 border border-[#1D1D1F]/[0.07] shadow-sm">
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
              <h3 className="font-black text-lg text-[#1D1D1F] leading-snug mb-1 break-words tracking-tight">
                {book.title}
              </h3>
              <p className="text-[#6e6e73] text-sm font-serif italic mb-3 truncate">
                by {book.author}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#1D1D1F] text-xs font-bold px-3 py-1 rounded-full">
                  Condition: {book.condition.replace("_", " ")}
                </span>
                <span className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#6e6e73] text-xs font-bold px-3 py-1 rounded-full truncate max-w-full">
                  Seller: {book.owner.name || "Community Reader"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Protection */}
        <div className="bg-white rounded-3xl p-6 md:p-7 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#0A7D4F]/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#0A7D4F]" />
          </div>
          <div>
            <h4 className="font-black text-base text-[#1D1D1F] mb-1">
              Buyer Protection Guarantee
            </h4>
            <p className="text-sm text-[#6e6e73] leading-relaxed font-medium">
              {isMeetup
                ? "Inspect the book's condition in person during your campus or local meetup before completing payment."
                : "Your payment is held securely in escrow until you receive the book in the described condition."}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown (Right/Bottom) */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] sticky top-24">
          <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight mb-6">
            Payment Details
          </h2>

          <div className="space-y-4 mb-6 text-sm font-medium text-[#6e6e73]">
            <div className="flex justify-between items-center">
              <span>Book Price</span>
              <span className="font-mono font-bold text-[#1D1D1F]">
                ₹{book.price}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Platform Fee</span>
              <span className="font-mono font-bold text-[#1D1D1F]">
                {isMeetup ? "₹0" : `₹${effectivePlatformFee}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Shipping</span>
              {isMeetup ? (
                <span className="font-mono font-bold text-[#0A7D4F]">
                  ₹0 (Meetup)
                </span>
              ) : shippingFee === null ? (
                <span className="text-[#C84200] text-xs font-bold uppercase tracking-wider">
                  Enter pincode
                </span>
              ) : (
                <span className="font-mono font-bold text-[#1D1D1F]">
                  ₹{shippingFee}
                </span>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-[#1D1D1F]/[0.09] mb-6" />

          <div className="flex justify-between items-center mb-7">
            <span className="font-black text-[#1D1D1F] uppercase tracking-wider text-sm">
              Total
            </span>
            <span className="font-mono font-black text-3xl text-[#1D1D1F]">
              ₹{total}
            </span>
          </div>

          {isMeetup ? (
            <button
              type="button"
              disabled={reservingMeetup}
              onClick={handleReserveMeetup}
              className="w-full py-4 px-6 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 bg-[#0066cc] hover:bg-[#0071e3] text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {reservingMeetup ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Reserving...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" /> Reserve for Meetup (
                  <span className="font-mono">₹{book.price}</span>)
                </>
              )}
            </button>
          ) : shippingFee === null ? (
            <div className="w-full py-4 px-6 rounded-full font-bold flex items-center justify-center gap-2 bg-[#FAF6F0] text-[#86868b] border border-[#1D1D1F]/[0.08] text-sm">
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

          <p className="text-center text-xs text-[#6e6e73] font-medium mt-4 leading-relaxed">
            By confirming, you agree to our{" "}
            <Link
              href="/legal/terms"
              className="underline hover:text-[#C84200]"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
