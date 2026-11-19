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
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
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

      setTimeout(() => {
        setStatus("idle")
      }, 3000)
    }
  }

  if (isOwner) {
    return (
      <div className="w-full py-4 px-6 bg-[#FAF6F0] text-[#6e6e73] border border-[#1D1D1F]/[0.08] rounded-full text-sm font-bold flex items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5" />
        This is your listing
      </div>
    )
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full py-4 px-6 bg-[#0A7D4F]/10 text-[#0A7D4F] border border-[#0A7D4F]/25 rounded-full text-[15px] font-bold flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-5 h-5" />
        Vidya Daan Request Sent
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <motion.button
        whileHover={{ scale: status === "loading" ? 1 : 1.01 }}
        whileTap={{ scale: status === "loading" ? 1 : 0.99 }}
        onClick={handleRequest}
        disabled={status === "loading"}
        className="w-full py-4 px-6 bg-[#0A7D4F] hover:bg-[#08633F] text-white rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Request Free Vidya Daan Book
          </>
        )}
      </motion.button>

      {status === "error" && (
        <p className="text-red-600 text-sm font-medium text-center">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
