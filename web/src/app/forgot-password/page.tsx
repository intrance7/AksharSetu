"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Could not reset password")
      }
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 1800)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4 pt-24">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/5 p-8 md:p-10 space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div className="space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-[#000000] text-white flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Reset Your Password
          </h1>
          <p className="text-xs font-medium text-[#86868b]">
            Verify your registered email and account name to set a new password.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-[#1d1d1f]">
              Password Updated Successfully!
            </p>
            <p className="text-xs text-[#86868b]">
              Redirecting you to the sign-in page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm font-medium text-[#1d1d1f] outline-none focus:bg-white focus:ring-2 focus:ring-[#0066cc]/20 border border-transparent focus:border-[#0066cc]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                Full Name on Account
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alice Donor"
                className="w-full rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm font-medium text-[#1d1d1f] outline-none focus:bg-white focus:ring-2 focus:ring-[#0066cc]/20 border border-transparent focus:border-[#0066cc]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
                New Password (min. 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-[#f5f5f7] px-4 py-3 pr-10 text-sm font-medium text-[#1d1d1f] outline-none focus:bg-white focus:ring-2 focus:ring-[#0066cc]/20 border border-transparent focus:border-[#0066cc]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white py-5 font-bold text-sm cursor-pointer"
            >
              {loading ? "Updating Password..." : "Set New Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
