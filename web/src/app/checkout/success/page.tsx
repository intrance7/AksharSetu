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
      className="bg-white rounded-3xl p-7 sm:p-10 md:p-12 shadow-sm border border-[#1D1D1F]/10 max-w-lg w-full text-center"
    >
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        {isMeetup ? (
          <Handshake className="w-10 h-10 text-emerald-700" />
        ) : (
          <CheckCircle className="w-10 h-10 text-emerald-700" />
        )}
      </div>

      <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-3">
        {isMeetup ? "Meetup Reserved!" : "Order Confirmed!"}
      </h1>

      <p className="text-[#86868b] text-sm font-medium mb-6 leading-relaxed">
        {isMeetup
          ? "This book has been reserved for your campus or local meetup with ₹0 platform & shipping fees. Message the seller to coordinate a safe public spot and inspect before paying."
          : "Your payment is secured in escrow and the seller has been notified to dispatch your book."}
      </p>

      {awb && (
        <div className="mb-8 p-4 rounded-2xl bg-[#FAF6F0] border border-black/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#C84200] mb-1">
            {isMeetup
              ? "Meetup Reservation Reference"
              : "Express Shipment Tracking AWB"}
          </p>
          <p className="font-mono text-lg font-black text-[#1D1D1F] break-all">
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
              <Package className="w-4 h-4" /> Track Order & Shipment
            </>
          )}
        </Link>
        <Link
          href={isMeetup ? "/orders" : "/catalog"}
          className="py-3.5 px-6 bg-[#FAF6F0] hover:bg-[#E8E2D7] text-[#1D1D1F] border border-black/10 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors flex-1"
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
    <div className="min-h-screen bg-[#F2EBE1] flex items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
