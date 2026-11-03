"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { Book } from "@prisma/client"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface RazorpayButtonProps {
  book: Book
  user: any
  amount: number
  deliveryPincode?: string
}

export function RazorpayButton({ book, user, amount, deliveryPincode }: RazorpayButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, deliveryPincode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate checkout")
      }

      // Sandbox Escrow Instant Completion
      if (data.sandboxPaid) {
        toast.success(`Order Confirmed! Shipment AWB #${data.awbCode} generated.`)
        router.push(`/checkout/success?orderId=${data.orderId}&awb=${data.awbCode}`)
        router.refresh()
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "AksharSetu",
        description: `Purchase: ${book.title}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
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
              toast.success("Payment verified!")
              router.push(`/checkout/success?orderId=${data.orderId}`)
              router.refresh()
            } else {
              setError(verifyData.error || "Payment verification failed")
            }
          } catch {
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
      <div className="flex flex-col gap-3 mt-6">
        <button
          type="button"
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-full font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            loading
              ? "bg-[#1d1d1f]/20 text-[#1d1d1f]/60 cursor-not-allowed"
              : "bg-[#0066cc] hover:bg-[#0071e3] text-white shadow-sm"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing Escrow...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" /> Pay ₹{amount} Securely
            </>
          )}
        </button>
        {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}
      </div>
    </>
  )
}
