"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { Book } from "@prisma/client"

interface RazorpayButtonProps {
  book: Book;
  user: any;
  amount: number;
}

export function RazorpayButton({ book, user, amount }: RazorpayButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      // 1. Create order on backend
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate checkout")
      }

      // 2. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use public key from env
        amount: data.amount,
        currency: data.currency,
        name: "Akshar Setu",
        description: `Purchase: ${book.title}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          // 3. Verify payment signature on backend
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyRes.json()

            if (verifyRes.ok) {
              // Redirect to success or back to catalog
              router.push(`/catalog?success=true&title=${encodeURIComponent(book.title)}`)
              router.refresh()
            } else {
              setError(verifyData.error || "Payment verification failed")
            }
          } catch (err) {
            setError("Something went wrong during verification")
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#0066cc",
        },
      }

      const paymentObject = new (window as any).Razorpay(options)
      paymentObject.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed")
      })
      paymentObject.open()
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="flex flex-col gap-3 mt-8">
        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-full font-bold flex items-center justify-center gap-2 transition-colors ${
            loading ? "bg-[#1D1D1F]/20 text-[#1D1D1F]/60 cursor-not-allowed" : "bg-[#0066cc] hover:bg-[#0071e3] text-white"
          }`}
        >
          {loading ? "Processing..." : `Pay ₹${amount} Securely`}
        </button>
        {error && (
          <p className="text-red-500 text-sm font-semibold text-center">{error}</p>
        )}
      </div>
    </>
  )
}
