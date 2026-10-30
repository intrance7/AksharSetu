"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Square, ArrowLeft, Loader2, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function ShantiTimer({ bookId, title, author, compact = false }: { bookId: string, title: string, author: string, compact?: boolean }) {
  const router = useRouter()
  const [durationMinutes, setDurationMinutes] = useState(25) // Default Pomodoro
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Update timeLeft when duration changes (only if not active)
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(durationMinutes * 60)
    }
  }, [durationMinutes, isActive])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      handleComplete()
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleStart = async () => {
    setIsSubmitting(true)
    try {
      // Set Live Status
      await fetch("/api/shanti/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isShantiModeActive: true,
          liveStatus: `Currently reading ${title} in Shanti Mode 🧘‍♂️`
        })
      })
      setIsActive(true)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStop = async () => {
    setIsSubmitting(true)
    try {
      // Clear Live Status
      await fetch("/api/shanti/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShantiModeActive: false })
      })
      setIsActive(false)
      setTimeLeft(durationMinutes * 60) // Reset
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setIsActive(false)
    try {
      // Clear status
      await fetch("/api/shanti/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShantiModeActive: false })
      })
      // Save session
      await fetch("/api/shanti/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryBookId: bookId, durationMinutes })
      })
      
      // Could show a celebration animation here
      router.push("/library")
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Compact variant: lives in the e-reader's top bar
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-[#1d1d1f] p-1 pl-2">
        {isActive && <span className="w-2 h-2 ml-1 rounded-full bg-[#0066cc] animate-pulse" />}
        {!isActive && (
          <button id="shanti-minus" aria-label="Less time" onClick={() => setDurationMinutes(Math.max(5, durationMinutes - 5))} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#f5f5f7] flex items-center justify-center transition-colors">
            <Minus className="w-3 h-3" />
          </button>
        )}
        <span className="text-sm font-semibold tabular-nums text-[#f5f5f7] w-12 text-center">{formatTime(timeLeft)}</span>
        {!isActive && (
          <button id="shanti-plus" aria-label="More time" onClick={() => setDurationMinutes(Math.min(120, durationMinutes + 5))} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#f5f5f7] flex items-center justify-center transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        )}
        <button
          id="shanti-toggle"
          onClick={isActive ? handleStop : handleStart}
          disabled={isSubmitting}
          className={`h-8 rounded-full px-4 text-xs font-semibold flex items-center gap-1.5 transition-colors ${isActive ? "bg-white/10 hover:bg-white/20 text-[#f5f5f7]" : "bg-[#0066cc] hover:bg-[#0071e3] text-white"}`}
        >
          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isActive ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          {isActive ? "End" : "Start focus"}
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
      
      {/* Back button (only shown when not active) */}
      <AnimatePresence>
        {!isActive && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-8 left-8"
          >
            <Link href="/library" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold tracking-wide text-sm">Exit Shanti Mode</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Timer Display */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/40 font-bold uppercase tracking-[0.3em] text-sm mb-4"
        >
          {isActive ? "Deep Focus" : "Prepare to Focus"}
        </motion.p>
        
        <h2 className="text-3xl md:text-4xl font-black text-white/90 mb-1">{title}</h2>
        <p className="text-white/50 font-medium mb-12">by {author}</p>

        {/* The Clock */}
        <div className="relative mb-12">
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full border border-[#0066cc]/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <h1 className="text-8xl md:text-[9rem] font-black tracking-tighter tabular-nums leading-none drop-shadow-2xl text-white">
            {formatTime(timeLeft)}
          </h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 h-16">
          {!isActive ? (
            <>
              {/* Duration Selectors */}
              <button 
                onClick={() => setDurationMinutes(Math.max(5, durationMinutes - 5))}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleStart}
                disabled={isSubmitting}
                className="bg-white text-black hover:bg-white/90 rounded-full px-10 h-14 font-black tracking-wide text-lg flex items-center gap-3 transition-all transform hover:scale-105"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-black" />}
                START
              </button>
              
              <button 
                onClick={() => setDurationMinutes(Math.min(120, durationMinutes + 5))}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button 
              onClick={handleStop}
              disabled={isSubmitting}
              className="bg-[#1D1D1F] border border-white/10 hover:border-white/30 hover:bg-white/10 text-white rounded-full px-8 h-14 font-bold tracking-wide text-sm flex items-center gap-3 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-4 h-4 fill-white" />}
              END EARLY
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
