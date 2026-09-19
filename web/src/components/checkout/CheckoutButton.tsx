"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

export function CheckoutButton({ bookId }: { bookId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleCheckout = async () => {
    setLoading(true)
    setError("")

    try {
      // 1. Create the Order and reserve the book
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId })
      })

      const checkoutData = await checkoutRes.json()

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Checkout failed")
      }

      // Simulated Payment Gateway step
      // In a real app, this would redirect to Stripe/Razorpay
      // For now, we simulate a successful payment by hitting our webhook directly

      const webhookRes = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId: checkoutData.id, 
          status: "SUCCESS" 
        })
      })

      if (!webhookRes.ok) {
        throw new Error("Payment simulation failed")
      }

      // Redirect to success page
      router.push(`/checkout/success`)

    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-4 px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Confirm & Pay
          </>
        )}
      </motion.button>
      
      {error && (
        <p className="text-red-500 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
          {error}
        </p>
      )}
    </div>
  )
}
