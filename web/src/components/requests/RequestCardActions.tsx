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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
          title="Mark this request as fulfilled"
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          Fulfilled
        </button>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#e8e8ed] hover:bg-red-100 hover:text-red-600 text-[#1d1d1f] transition cursor-pointer disabled:opacity-50"
        title="Delete request"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
