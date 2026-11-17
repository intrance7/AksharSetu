"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { KeyRound, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function JoinClubByCodeBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlCode = searchParams.get("code") || ""

  const [code, setCode] = useState(urlCode)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (urlCode) {
      setCode(urlCode.toUpperCase())
    }
  }, [urlCode])

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      toast.error("Please enter a Sabha Team code (e.g. SABHA-TAGORE)")
      return
    }

    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/clubs?code=${trimmed}`)}`)
      return
    }

    setJoining(true)
    try {
      const res = await fetch("/api/clubs/join-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Invalid team invite code")
      }

      if (data.alreadyMember) {
        toast.info(`Opening your Sabha Team: "${data.clubName}"`)
      } else {
        toast.success(`Joined Sabha Team: "${data.clubName}"!`)
      }
      router.push(`/clubs/${data.clubId}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Could not join team with code")
    } finally {
      setJoining(false)
    }
  }

  return (
    <form
      onSubmit={handleJoinByCode}
      className="flex items-center gap-2 bg-white/10 border border-white/15 focus-within:border-[#C84200] rounded-full p-1.5 pl-4 w-full sm:w-auto transition-colors"
    >
      <KeyRound className="w-4 h-4 text-[#C84200] shrink-0" />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter Team Code (e.g. SABHA-TAGORE)"
        className="bg-transparent text-xs sm:text-sm font-mono font-bold text-white placeholder:text-white/45 outline-none w-48 sm:w-56 uppercase tracking-wider"
      />
      <button
        type="submit"
        disabled={joining}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-[#1D1D1F] hover:bg-[#C84200] hover:text-white font-black text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
      >
        {joining ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            Join Team <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  )
}
