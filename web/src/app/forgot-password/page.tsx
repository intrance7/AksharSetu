"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LifeBuoy,
} from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
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
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Could not update password")
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
    <div className="min-h-screen bg-[#F2EBE1] flex items-center justify-center p-4 pt-24 pb-16">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#1D1D1F]/10 p-8 md:p-10 space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#86868b] hover:text-[#1D1D1F] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div className="space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-[#C84200]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1D1D1F]">
            Change or Recover Password
          </h1>
          <p className="text-xs font-medium text-[#86868b] leading-relaxed">
            Verify your current credentials to set a new password, or contact
            our Account Access desk if you are locked out.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-[#1D1D1F]">
              Password Updated Securely!
            </p>
            <p className="text-xs text-[#86868b]">
              Redirecting you to the sign-in page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@university.edu"
                className="w-full rounded-xl bg-[#FAF6F0] px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/20 border border-black/10 focus:border-[#C84200]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                Current Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl bg-[#FAF6F0] px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/20 border border-black/10 focus:border-[#C84200]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                New Password (min. 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-[#FAF6F0] px-4 py-3 pr-10 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/20 border border-black/10 focus:border-[#C84200]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1D1D1F]"
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
              className="w-full rounded-full bg-[#C84200] hover:bg-[#A33500] text-white py-5 font-bold text-sm cursor-pointer"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </Button>

            <div className="pt-3 border-t border-black/5 text-center">
              <Link
                href="/support?category=ACCOUNT_ACCESS"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066cc] hover:underline"
              >
                <LifeBuoy className="w-3.5 h-3.5" /> Forgot current password?
                Request Account Recovery
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
