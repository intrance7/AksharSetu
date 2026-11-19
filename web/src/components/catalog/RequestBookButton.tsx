"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MessageCircle, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface RequestBookButtonProps {
  bookId: string
  isOwner: boolean
  ownerId?: string
}

export function RequestBookButton({
  bookId,
  isOwner,
  ownerId,
}: RequestBookButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
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

      const data = await res.json().catch(() => ({}))
      const targetOwnerId = data?.ownerId || ownerId

      if (!res.ok && !targetOwnerId) {
        throw new Error(data.error || "Failed to request book")
      }

      if (targetOwnerId) {
        toast.success("Opening chat with your book request prompt...")
        router.push(
          `/messages/${targetOwnerId}?action=request_book&book=${bookId}`
        )
        return
      }

      router.refresh()
    } catch (error: any) {
      console.error(error)
      setStatus("error")
      setErrorMessage(error.message || "Could not open request chat")

      setTimeout(() => {
        setStatus("idle")
      }, 3000)
    }
  }

  if (isOwner) {
    return (
      <div className="w-full py-3.5 px-6 bg-[#FAF6F0] text-[#6e6e73] border border-[#1D1D1F]/[0.08] rounded-full text-sm font-bold flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        This is your listing
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <motion.button
        whileHover={{ scale: status === "loading" ? 1 : 1.01 }}
        whileTap={{ scale: status === "loading" ? 1 : 0.99 }}
        onClick={handleRequest}
        disabled={status === "loading"}
        className="w-full py-3.5 px-6 bg-[#0A7D4F] hover:bg-[#08633F] text-white rounded-full text-sm sm:text-[15px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening Request Chat...
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4" />
            Request Book via Chat
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
