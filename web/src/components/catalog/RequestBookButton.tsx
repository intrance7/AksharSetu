"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface RequestBookButtonProps {
  bookId: string
  isOwner: boolean
}

export function RequestBookButton({ bookId, isOwner }: RequestBookButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  const handleRequest = async () => {
    if (isOwner) return
    
    setStatus("loading")
    setErrorMessage("")

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to request book")
      }

      setStatus("success")
      router.refresh()
    } catch (error: any) {
      console.error(error)
      setStatus("error")
      setErrorMessage(error.message)
      
      // Reset back to idle after a few seconds on error
      setTimeout(() => {
        setStatus("idle")
      }, 3000)
    }
  }

  if (isOwner) {
    return (
      <div className="w-full py-4 px-6 bg-[#1D1D1F]/5 text-[#1D1D1F]/60 rounded-full font-bold flex items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5" />
        This is your listing
      </div>
    )
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full py-4 px-6 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-bold flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        Request Sent Successfully
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <motion.button
        whileHover={{ scale: status === "loading" ? 1 : 1.02 }}
        whileTap={{ scale: status === "loading" ? 1 : 0.98 }}
        onClick={handleRequest}
        disabled={status === "loading"}
        className="w-full py-4 px-6 bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Request Book
          </>
        )}
      </motion.button>
      
      {status === "error" && (
        <p className="text-red-500 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
