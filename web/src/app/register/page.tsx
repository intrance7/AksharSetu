"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { BookOpen, AlertCircle, Eye, EyeOff } from "lucide-react"

function RegisterFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/catalog"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    getProviders()
      .then((providers) => {
        if (active && providers?.google) {
          setGoogleEnabled(true)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to register account.")
      }

      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        router.push("/login")
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Could not complete registration.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setOauthLoading(true)
    setError("")
    try {
      await signIn("google", { callbackUrl })
    } catch {
      setError("Google sign-up is unavailable right now. Please register with email.")
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F2EBE1] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#1D1D1F]/10 p-6 sm:p-8 md:p-10 space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#1D1D1F] mb-2"
          >
            <BookOpen className="w-6 h-6 text-[#C84200]" />
            <span className="font-black text-2xl tracking-tight">
              Aksharसेतु
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F]">
            Create Your Reader Account
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#86868b]">
            Buy, swap, or donate books and build your literary profile.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 p-3.5 rounded-xl text-xs font-bold border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {googleEnabled && (
          <>
            <button
              type="button"
              disabled={oauthLoading || isLoading}
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-2.5 bg-[#FAF6F0] hover:bg-[#F2EBE1] border border-[#1D1D1F]/10 text-[#1D1D1F] font-bold py-3 px-4 rounded-full transition-colors text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {oauthLoading ? "Connecting to Google..." : "Sign up with Google"}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#1D1D1F]/10" />
              <span className="flex-shrink-0 mx-4 text-[#86868b] text-xs font-semibold uppercase tracking-widest">
                Or with Email
              </span>
              <div className="flex-grow border-t border-[#1D1D1F]/10" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
              Full Name
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/10 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#C84200] transition-all"
              placeholder="Aarav Sharma"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/10 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#C84200] transition-all"
              placeholder="reader@university.edu"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/10 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#C84200] transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1D1D1F] cursor-pointer"
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
            disabled={isLoading || oauthLoading}
            className="w-full mt-2 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full py-5 font-bold text-sm transition-colors cursor-pointer"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-[#86868b] pt-2">
          Already have an account?{" "}
          <Link
            href={
              callbackUrl !== "/catalog"
                ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : "/login"
            }
            className="font-bold text-[#C84200] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] bg-[#F2EBE1] flex items-center justify-center text-sm font-bold text-[#1D1D1F]/60">
          Loading registration...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  )
}
