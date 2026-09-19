"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2, PackageCheck } from "lucide-react"

export function RequestManager({ requestId, isCompleting = false }: { requestId: string, isCompleting?: boolean }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (status: string) => {
    setLoadingAction(status)
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })

      if (!res.ok) throw new Error("Failed to update status")
      
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAction(null)
    }
  }

  if (isCompleting) {
    return (
      <button 
        onClick={() => handleAction("COMPLETED")}
        disabled={!!loadingAction}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {loadingAction === "COMPLETED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
        Mark as Handed Over
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleAction("APPROVED")}
        disabled={!!loadingAction}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {loadingAction === "APPROVED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Approve
      </button>
      <button 
        onClick={() => handleAction("REJECTED")}
        disabled={!!loadingAction}
        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border border-red-500/30"
      >
        {loadingAction === "REJECTED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        Reject
      </button>
    </div>
  )
}
