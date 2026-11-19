"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (session?.user?.email && !email) {
      setEmail(session.user.email)
    }
  }, [session?.user?.email, email])

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
    <div className="min-h-[calc(100vh-4rem)] bg-[#F2EBE1] flex items-center justify-center p-4 sm:p-8 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_24px_60px_-20px_rgba(29,29,31,0.14)] border border-[#1D1D1F]/[0.07] p-6 sm:p-10 space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5E5E63] hover:text-[#1D1D1F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0B0B0D] text-[#FF7F45] flex items-center justify-center shadow-xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
            Update or recover your{" "}
            <span className="font-serif italic font-medium text-[#C84200]">
              Passkey
            </span>
            .
          </h1>
          <p className="text-sm sm:text-[15px] text-[#5E5E63] leading-relaxed">
            Verify your current credentials to set a new password, or reach out
            to our Account Access desk if you are locked out.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-2xl bg-red-50/90 border border-red-200/80 text-sm font-medium text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center space-y-2">
            <CheckCircle2 className="w-9 h-9 text-[#0A7D4F] mx-auto" />
            <p className="text-base font-bold text-[#1D1D1F]">
              Password Updated Securely
            </p>
            <p className="text-sm text-[#5E5E63]">
              Redirecting you to the sign-in page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="fp-email"
                className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/80"
              >
                Registered Email
              </label>
              <input
                id="fp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@university.edu"
                className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3.5 text-sm sm:text-base font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/15 border border-[#1D1D1F]/10 focus:border-[#C84200] transition-all placeholder:text-[#86868B]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="fp-current"
                className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/80"
              >
                Current Password
              </label>
              <input
                id="fp-current"
                type={showPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3.5 text-sm sm:text-base font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/15 border border-[#1D1D1F]/10 focus:border-[#C84200] transition-all placeholder:text-[#86868B]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="fp-new"
                className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]/80"
              >
                New Password (min. 8 characters)
              </label>
              <div className="relative">
                <input
                  id="fp-new"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a new password"
                  className="w-full rounded-2xl bg-[#FAF6F0] px-4 py-3.5 pr-12 text-sm sm:text-base font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/15 border border-[#1D1D1F]/10 focus:border-[#C84200] transition-all placeholder:text-[#86868B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
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
              className="w-full mt-2 rounded-full bg-[#C84200] hover:bg-[#A33500] text-white py-6 font-bold text-sm sm:text-[15px] cursor-pointer shadow-sm"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </Button>

            <div className="pt-4 border-t border-[#1D1D1F]/[0.07] text-center">
              <Link
                href="/support?category=ACCOUNT_ACCESS"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066cc] hover:underline"
              >
                <LifeBuoy className="w-4 h-4" /> Forgot current password?
                Request Account Recovery
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
