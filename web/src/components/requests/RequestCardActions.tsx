"use client"

import { useTransition } from "react"
import { CheckCircle2, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  fulfillCommunityRequest,
  deleteCommunityRequest,
} from "@/app/actions/requests"

export function RequestCardActions({
  requestId,
  status,
}: {
  requestId: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleFulfill = () => {
    startTransition(async () => {
      try {
        await fulfillCommunityRequest(requestId)
        toast.success("Marked request as fulfilled!")
      } catch (err: any) {
        toast.error(err.message || "Failed to update request")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCommunityRequest(requestId)
        toast.success("Removed community request")
      } catch (err: any) {
        toast.error(err.message || "Failed to remove request")
      }
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {status !== "FULFILLED" && (
        <button
          type="button"
          onClick={handleFulfill}
          disabled={isPending}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0A7D4F] hover:bg-[#08633F] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
          title="Mark this request as fulfilled"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Fulfilled
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Delete request"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-[#1D1D1F] transition cursor-pointer disabled:opacity-50"
        title="Delete request"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
