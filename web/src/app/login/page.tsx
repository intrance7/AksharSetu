"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/Button"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle, BookOpen } from "lucide-react"
import { Login3DBackground } from "@/components/3d/Login3DBackground"
import { LoginCarousel } from "@/components/auth/LoginCarousel"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const res = await signIn("credentials", { 
        email, 
        password, 
        redirect: false 
      })

      if (res?.error) {
        setError("Invalid email or password.")
      } else {
        router.push("/catalog")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-[#F2EBE1]">
      <Login3DBackground />
      
      {/* Main Container */}
      <div className="w-full max-w-[1200px] h-[90vh] min-h-[600px] max-h-[800px] bg-white/60 backdrop-blur-3xl rounded-[40px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-white/40 flex overflow-hidden relative z-10">
        
        {/* Left Column - Photos Section */}
        <div className="hidden lg:block lg:w-[50%] p-3 h-full relative">
          <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-inner bg-black">
            <LoginCarousel />
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full lg:w-[50%] flex flex-col p-8 sm:p-12 md:p-16 relative overflow-y-auto">
          
          {/* Logo at top */}
          <div className="flex items-center justify-start gap-2 text-[#1D1D1F] mb-12">
            <BookOpen className="w-7 h-7 text-[#C84200]" />
            <span className="font-bold text-2xl tracking-tight font-['Bricolage_Grotesque']">Aksharसेतु</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center"
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2 mb-2">
                <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight font-['Bricolage_Grotesque']">Welcome Back</h1>
                <p className="text-[#86868B] text-sm">
                  Enter your email and password to access your account
                </p>
              </div>

              {error && (
                <div className="flex items-center justify-start gap-2 text-red-600 bg-red-50/80 p-3 rounded-xl text-sm font-medium -mt-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#1D1D1F] ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F2EBE1]/30 border border-[#1D1D1F]/10 text-[#1D1D1F] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84200]/30 transition-all placeholder:text-[#86868B]"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center ml-1 mr-1">
                    <label className="text-sm font-semibold text-[#1D1D1F]">Password</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F2EBE1]/30 border border-[#1D1D1F]/10 text-[#1D1D1F] rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84200]/30 transition-all placeholder:text-[#86868B]"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-[#C84200] hover:bg-[#A33500] text-white rounded-full py-6 font-bold tracking-wide text-base transition-colors shadow-md shadow-[#C84200]/20 border-0 cursor-pointer"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              {/* Social Login */}
              <div className="flex flex-col gap-3 mt-1">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[#1D1D1F]/10"></div>
                  <span className="flex-shrink-0 mx-4 text-[#86868B] text-xs font-medium">Or continue with</span>
                  <div className="flex-grow border-t border-[#1D1D1F]/10"></div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#F2EBE1] shadow-sm border border-[#1D1D1F]/10 py-3.5 px-4 rounded-xl transition-colors text-sm font-semibold text-[#1D1D1F] cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    Github
                  </button>
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/catalog" })}
                    className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#F2EBE1] shadow-sm border border-[#1D1D1F]/10 py-3.5 px-4 rounded-xl transition-colors text-sm font-semibold text-[#1D1D1F] cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 text-sm font-medium text-[#86868B]">
                <p>Don't have an account? <Link href="/register" className="text-[#C84200] font-bold hover:underline underline-offset-4">Sign up</Link></p>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
