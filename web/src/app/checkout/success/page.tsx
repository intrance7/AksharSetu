"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { CheckCircle, Package, ShoppingBag } from "lucide-react"

function SuccessContent() {
  const sp = useSearchParams()
  const awb = sp.get("awb")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-black/5 max-w-lg w-full text-center"
    >
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>

      <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight mb-3">
        Order Confirmed!
      </h1>

      <p className="text-[#86868b] text-sm font-medium mb-6 leading-relaxed">
        Your payment is secured in escrow and the seller has been notified to dispatch your book.
      </p>

      {awb && (
        <div className="mb-8 p-4 rounded-2xl bg-[#f5f5f7] border border-black/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0066cc] mb-1">
            Express Shipment Tracking AWB
          </p>
          <p className="font-mono text-lg font-bold text-[#1d1d1f]">{awb}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/orders"
          className="py-3.5 px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors flex-1"
        >
          <Package className="w-4 h-4" />
          Track Order & Shipment
        </Link>
        <Link
          href="/catalog"
          className="py-3.5 px-6 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors flex-1"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse More
        </Link>
      </div>
    </motion.div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}
