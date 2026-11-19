"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getProviders } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, AlertCircle, BookOpen } from "lucide-react"
import { LoginCarousel } from "@/components/auth/LoginCarousel"
import Link from "next/link"

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password. Please try again.",
  OAuthSignin:
    "Google sign-in is not configured on this server. Please sign in with email and password.",
  OAuthCallback:
    "Could not complete Google sign-in. Please try email and password instead.",
  OAuthAccountNotLinked:
    "An account with this email already exists using another sign-in method.",
  Configuration:
    "Authentication provider is temporarily unavailable. Please use email and password.",
  AccessDenied: "Access denied. Please check your account permissions.",
}

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/catalog"
  const urlError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [error, setError] = useState(
    urlError
      ? AUTH_ERROR_MESSAGES[urlError] ||
          "Sign-in could not be completed. Please try again."
      : ""
  )

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

  useEffect(() => {
    if (urlError) {
      setError(
        AUTH_ERROR_MESSAGES[urlError] ||
          "Sign-in could not be completed. Please try again."
      )
    }
  }, [urlError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Invalid email or password. Please check your credentials.")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setOauthLoading(true)
    setError("")
    try {
      await signIn("google", { callbackUrl })
    } catch {
      setError(
        "Google sign-in is unavailable right now. Please sign in with email and password."
      )
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-4 sm:p-8 bg-[#F2EBE1]">
      <div className="w-full max-w-[1120px] min-h-[600px] bg-white rounded-[32px] shadow-[0_12px_40px_-12px_rgba(29,29,31,0.12)] border border-[#1D1D1F]/10 flex overflow-hidden relative z-10">
        {/* Left Column - Editorial Carousel */}
        <div className="hidden lg:block lg:w-[50%] p-3 relative">
          <div className="w-full h-full rounded-[24px] overflow-hidden relative bg-[#000000]">
            <LoginCarousel />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-[50%] flex flex-col p-6 sm:p-10 md:p-14 relative justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#1D1D1F] mb-8 self-start"
          >
            <BookOpen className="w-6 h-6 text-[#C84200]" />
            <span className="font-black text-2xl tracking-tight">
              Aksharसेतु
            </span>
          </Link>

          <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tight">
                Welcome Back
              </h1>
              <p className="text-[#86868B] text-sm mt-1">
                Sign in to access your reading room, messages, and listings.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-700 bg-red-50 p-3.5 rounded-xl text-xs font-bold border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/10 text-[#1D1D1F] rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#C84200] transition-all placeholder:text-[#86868B]"
                  placeholder="reader@university.edu"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap justify-between items-center gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-[#C84200] hover:underline"
                  >
                    Forgot / Change password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/10 text-[#1D1D1F] rounded-xl px-4 py-3 pr-11 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#C84200] transition-all placeholder:text-[#86868B]"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
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
                className="w-full mt-2 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full py-5 font-bold text-sm transition-colors shadow-sm cursor-pointer"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {googleEnabled && (
              <div className="flex flex-col gap-3">
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-[#1D1D1F]/10" />
                  <span className="flex-shrink-0 mx-3 text-[#86868B] text-xs font-semibold">
                    Or continue with
                  </span>
                  <div className="flex-grow border-t border-[#1D1D1F]/10" />
                </div>

                <button
                  type="button"
                  disabled={oauthLoading || isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#FAF6F0] hover:bg-[#F2EBE1] border border-[#1D1D1F]/10 py-3 px-4 rounded-full transition-colors text-xs sm:text-sm font-bold text-[#1D1D1F] cursor-pointer disabled:opacity-50"
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
                  {oauthLoading ? "Connecting to Google..." : "Continue with Google"}
                </button>
              </div>
            )}

            <p className="text-xs font-medium text-[#86868B] text-center pt-2">
              Don&apos;t have an account?{" "}
              <Link
                href={
                  callbackUrl !== "/catalog"
                    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
                    : "/register"
                }
                className="text-[#C84200] font-bold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] bg-[#F2EBE1] flex items-center justify-center text-sm font-bold text-[#1D1D1F]/60">
          Loading sign-in...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
