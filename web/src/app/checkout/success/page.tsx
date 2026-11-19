"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  CheckCircle,
  Package,
  ShoppingBag,
  MessageCircle,
  Handshake,
} from "lucide-react"

function SuccessContent() {
  const sp = useSearchParams()
  const awb = sp.get("awb")
  const mode = sp.get("mode")
  const isMeetup = mode === "meetup"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-3xl p-8 sm:p-10 md:p-12 shadow-[0_14px_48px_-16px_rgba(29,29,31,0.14)] border border-[#1D1D1F]/[0.07] max-w-xl w-full text-center relative overflow-hidden"
    >
      <div className="w-20 h-20 bg-[#0A7D4F]/10 border border-[#0A7D4F]/20 rounded-full flex items-center justify-center mx-auto mb-6">
        {isMeetup ? (
          <Handshake className="w-10 h-10 text-[#0A7D4F]" />
        ) : (
          <CheckCircle className="w-10 h-10 text-[#0A7D4F]" />
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tight mb-3">
        {isMeetup ? (
          <>
            Meetup{" "}
            <span className="font-serif italic font-normal text-[#0A7D4F]">
              Reserved.
            </span>
          </>
        ) : (
          <>
            Order{" "}
            <span className="font-serif italic font-normal text-[#0A7D4F]">
              Confirmed.
            </span>
          </>
        )}
      </h1>

      <p className="text-[#6e6e73] text-[15px] font-medium mb-7 leading-relaxed max-w-md mx-auto">
        {isMeetup
          ? "This book has been reserved for your campus or local meetup with ₹0 platform and shipping fees. Message the seller to coordinate a public spot and inspect before paying."
          : "Your payment is secured in escrow and the seller has been notified to dispatch your book."}
      </p>

      {awb && (
        <div className="mb-8 p-5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.07]">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#C84200] mb-1.5">
            {isMeetup
              ? "Meetup Reservation Reference"
              : "Express Shipment Tracking AWB"}
          </p>
          <p className="font-mono text-xl font-black text-[#1D1D1F] break-all">
            {awb}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={isMeetup ? "/messages" : "/orders"}
          className="py-3.5 px-6 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors flex-1 shadow-sm"
        >
          {isMeetup ? (
            <>
              <MessageCircle className="w-4 h-4" /> Open Seller Chat
            </>
          ) : (
            <>
              <Package className="w-4 h-4" /> Track Order &amp; Shipment
            </>
          )}
        </Link>
        <Link
          href={isMeetup ? "/orders" : "/catalog"}
          className="py-3.5 px-6 bg-[#FAF6F0] hover:bg-[#EFE7DC] text-[#1D1D1F] border border-[#1D1D1F]/[0.1] rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors flex-1"
        >
          {isMeetup ? (
            <>
              <Package className="w-4 h-4" /> View My Orders
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" /> Browse More
            </>
          )}
        </Link>
      </div>
    </motion.div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F2EBE1] flex flex-col">
      <div className="relative overflow-hidden bg-[#0B0B0D] h-28 sm:h-36 border-b border-white/10">
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
          className="pointer-events-none absolute -top-20 right-1/4 w-72 h-72 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF7F45 0%, #C84200 45%, transparent 72%)",
          }}
        />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 -mt-14 sm:-mt-20 pb-20 relative z-10">
        <Suspense fallback={null}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
