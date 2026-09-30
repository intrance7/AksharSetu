"use client"

import { useState } from "react"
import { Book } from "@prisma/client"
import { ShieldCheck, Loader2, MapPin } from "lucide-react"
import { RazorpayButton } from "./RazorpayButton"

interface CheckoutClientProps {
  book: Book & { owner: { name: string | null } }
  user: any
  platformFee: number
}

export function CheckoutClient({ book, user, platformFee }: CheckoutClientProps) {
  const [pincode, setPincode] = useState("")
  const [shippingFee, setShippingFee] = useState<number | null>(null)
  const [eta, setEta] = useState<string | null>(null)
  const [loadingRate, setLoadingRate] = useState(false)
  
  const total = book.price + platformFee + (shippingFee || 0)

  const checkPincode = async () => {
    if (pincode.length !== 6) return
    setLoadingRate(true)
    
    try {
      const res = await fetch("/api/shiprocket/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_pincode: "110001", // Mock seller pincode
          delivery_pincode: pincode,
          weight: 0.5 // Standard book weight
        })
      })
      const data = await res.json()
      if (res.ok) {
        setShippingFee(data.rate)
        setEta(data.eta)
      } else {
        setShippingFee(90) // Fallback
      }
    } catch {
      setShippingFee(90)
    } finally {
      setLoadingRate(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Order Summary & Delivery Details (Left/Top) */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Delivery Details */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#1D1D1F]/5">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#C84200]" /> Delivery Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Delivery Pincode</label>
              <div className="flex gap-2">
                <input 
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 400001"
                  className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                />
                <button 
                  onClick={checkPincode}
                  disabled={pincode.length !== 6 || loadingRate}
                  className="px-6 bg-[#1D1D1F] text-white rounded-xl font-bold disabled:opacity-50 transition-colors"
                >
                  {loadingRate ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Check"}
                </button>
              </div>
            </div>
            
            {shippingFee !== null && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-medium">
                Delivery available! Estimated arrival: <span className="font-bold">{eta}</span>
              </div>
            )}
          </div>
        </div>

        {/* Item Summary */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#1D1D1F]/5">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6">Item Summary</h2>
          <div className="flex gap-6">
            <div className="w-24 h-32 bg-[#E8E4DF] rounded-xl overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={book.images?.[0] || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"} 
                alt={book.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-lg text-[#1D1D1F] leading-tight mb-1">{book.title}</h3>
              <p className="text-[#1D1D1F]/60 text-sm font-medium mb-3">{book.author}</p>
              <p className="text-[#1D1D1F]/40 text-xs font-bold uppercase tracking-widest">
                Condition: {book.condition.replace("_", " ")}
              </p>
              <p className="text-[#1D1D1F]/40 text-xs font-bold uppercase tracking-widest mt-1">
                Seller: {book.owner.name}
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
            <h4 className="font-bold text-[#1D1D1F] mb-1">Buyer Protection Guarantee</h4>
            <p className="text-sm text-[#1D1D1F]/60 font-medium">Your payment is held securely until you receive the book in the described condition.</p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown (Right/Bottom) */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1D1D1F]/5 sticky top-28">
          <h2 className="text-xl font-black text-[#1D1D1F] mb-6">Payment Details</h2>
          
          <div className="space-y-4 mb-6 text-sm font-medium text-[#1D1D1F]/70">
            <div className="flex justify-between">
              <span>Book Price</span>
              <span className="font-bold text-[#1D1D1F]">₹{book.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="font-bold text-[#1D1D1F]">₹{platformFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              {shippingFee === null ? (
                <span className="text-[#C84200] text-xs font-bold uppercase tracking-wider">Calculate at checkout</span>
              ) : (
                <span className="font-bold text-[#1D1D1F]">₹{shippingFee}</span>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-[#1D1D1F]/10 mb-6" />

          <div className="flex justify-between items-center mb-8">
            <span className="font-black text-[#1D1D1F] uppercase tracking-wider text-sm">Total</span>
            <span className="font-black text-2xl text-[#1D1D1F]">₹{total}</span>
          </div>

          {shippingFee === null ? (
            <div className="w-full py-4 px-6 rounded-full font-bold flex items-center justify-center gap-2 bg-[#1D1D1F]/10 text-[#1D1D1F]/50">
              Enter Pincode to Continue
            </div>
          ) : (
            <RazorpayButton book={book as any} user={user} amount={total} deliveryPincode={pincode} />
          )}
          
          <p className="text-center text-xs text-[#1D1D1F]/40 font-medium mt-4">
            By confirming, you agree to our Terms of Service.
          </p>
        </div>
      </div>

    </div>
  )
}
