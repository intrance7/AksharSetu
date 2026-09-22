"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { CheckCircle, Home, ShoppingBag } from "lucide-react"

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F2EBE1] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#1D1D1F]/5 max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </motion.div>

        <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-[#1D1D1F]/60 text-lg font-medium mb-10">
          Your order has been placed successfully. The seller has been notified to prepare your book for shipping.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/catalog"
            className="py-4 px-6 bg-[#1D1D1F] hover:bg-[#2d2d2f] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors flex-1"
          >
            <ShoppingBag className="w-5 h-5" />
            Keep Shopping
          </Link>
          <Link 
            href="/"
            className="py-4 px-6 bg-white hover:bg-gray-50 text-[#1D1D1F] border border-[#1D1D1F]/10 rounded-full font-bold flex items-center justify-center gap-2 transition-colors flex-1"
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
