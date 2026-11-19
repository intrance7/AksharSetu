"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Square,
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  BookOpen,
  Maximize2,
  Minimize2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type SoundMode = "off" | "rain" | "warm" | "zen"

const SOUNDS: { id: SoundMode; label: string }[] = [
  { id: "off", label: "Silent" },
  { id: "rain", label: "Gentle Rain" },
  { id: "warm", label: "Warm Study" },
  { id: "zen", label: "Zen Drone" },
]

export function ShantiTimer({
  bookId,
  title,
  author,
  compact = false,
  initialPage = 1,
  initialTotalPages = 250,
}: {
  bookId: string
  title: string
  author: string
  compact?: boolean
  initialPage?: number
  initialTotalPages?: number
}) {
  const router = useRouter()
  const [durationMinutes, setDurationMinutes] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [soundMode, setSoundMode] = useState<SoundMode>("off")
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const cleanupSoundRef = useRef<(() => void) | null>(null)

  const enterFullscreen = useCallback(() => {
    if (typeof document === "undefined") return
    if (document.fullscreenElement) return
    const target = compact
      ? document.documentElement
      : containerRef.current || document.documentElement
    const req =
      target.requestFullscreen ||
      (target as any).webkitRequestFullscreen ||
      (target as any).msRequestFullscreen
    if (typeof req === "function") {
      Promise.resolve(req.call(target)).catch(() => {})
    }
  }, [compact])

  const exitFullscreen = useCallback(() => {
    if (typeof document === "undefined") return
    const activeEl =
      document.fullscreenElement || (document as any).webkitFullscreenElement
    if (!activeEl) return
    const exit =
      document.exitFullscreen ||
      (document as any).webkitExitFullscreen ||
      (document as any).msExitFullscreen
    if (typeof exit === "function") {
      Promise.resolve(exit.call(document)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    const onFsChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement || (document as any).webkitFullscreenElement
        )
      )
    }
    document.addEventListener("fullscreenchange", onFsChange)
    document.addEventListener("webkitfullscreenchange", onFsChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange)
      document.removeEventListener("webkitfullscreenchange", onFsChange)
    }
  }, [])

  useEffect(() => {
    return () => {
      exitFullscreen()
    }
  }, [exitFullscreen])

  const stopAmbientAudio = useCallback(() => {
    if (cleanupSoundRef.current) {
      cleanupSoundRef.current()
      cleanupSoundRef.current = null
    }
  }, [])

  const startAmbientAudio = useCallback(
    (mode: SoundMode) => {
      stopAmbientAudio()
      if (mode === "off" || typeof window === "undefined") return

      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        if (!Ctx) return
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new Ctx()
        }
        const ctx = audioCtxRef.current
        if (ctx.state === "suspended") ctx.resume()

        const masterGain = ctx.createGain()
        masterGain.gain.value = 0.08
        masterGain.connect(ctx.destination)

        if (mode === "zen") {
          const osc1 = ctx.createOscillator()
          const osc2 = ctx.createOscillator()
          osc1.type = "sine"
          osc2.type = "sine"
          osc1.frequency.value = 174
          osc2.frequency.value = 261
          osc1.connect(masterGain)
          osc2.connect(masterGain)
          osc1.start()
          osc2.start()
          cleanupSoundRef.current = () => {
            try {
              osc1.stop()
              osc2.stop()
              masterGain.disconnect()
            } catch {}
          }
        } else {
          const bufferSize = ctx.sampleRate * 2
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
          const data = buffer.getChannelData(0)
          let lastOut = 0
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1
            if (mode === "warm") {
              data[i] = (lastOut + 0.02 * white) / 1.02
              lastOut = data[i]
              data[i] *= 3.2
            } else {
              data[i] = white * 0.45
            }
          }
          const noise = ctx.createBufferSource()
          noise.buffer = buffer
          noise.loop = true

          const filter = ctx.createBiquadFilter()
          filter.type = mode === "rain" ? "bandpass" : "lowpass"
          filter.frequency.value = mode === "rain" ? 1100 : 380

          noise.connect(filter)
          filter.connect(masterGain)
          noise.start()

          cleanupSoundRef.current = () => {
            try {
              noise.stop()
              filter.disconnect()
              masterGain.disconnect()
            } catch {}
          }
        }
      } catch {}
    },
    [stopAmbientAudio]
  )

  useEffect(() => {
    if (isActive) {
      startAmbientAudio(soundMode)
    } else {
      stopAmbientAudio()
    }
    return () => stopAmbientAudio()
  }, [isActive, soundMode, startAmbientAudio, stopAmbientAudio])

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(durationMinutes * 60)
    }
  }, [durationMinutes, isActive])

  const savePageProgress = async (nextPage: number, nextTotal = totalPages) => {
    const clampedPage = Math.max(1, Math.min(nextTotal, nextPage))
    setCurrentPage(clampedPage)
    setTotalPages(nextTotal)
    try {
      await fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryBookId: bookId,
          currentPage: clampedPage,
          totalPages: nextTotal,
        }),
      })
    } catch {}
  }

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true)
    setIsActive(false)
    stopAmbientAudio()
    exitFullscreen()
    try {
      await fetch("/api/shanti/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShantiModeActive: false }),
      })
      const res = await fetch("/api/shanti/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryBookId: bookId, durationMinutes }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Logged ${durationMinutes} mins of Shanti focus!`)
        if (Array.isArray(data?.unlockedBadges) && data.unlockedBadges.length > 0) {
          toast.success(`Badge Unlocked: ${data.unlockedBadges[0].name}!`)
        }
      }
      if (!compact) {
        router.push("/library")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }, [bookId, compact, durationMinutes, exitFullscreen, router, stopAmbientAudio])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      handleComplete()
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft, handleComplete])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleStart = async () => {
    // Must invoke Fullscreen API synchronously inside the user click gesture before any await
    enterFullscreen()
    setIsSubmitting(true)
    try {
      await fetch("/api/shanti/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isShantiModeActive: true,
          liveStatus: `Reading "${title}" in Shanti Focus`,
        }),
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
    stopAmbientAudio()
    exitFullscreen()
    try {
      await fetch("/api/shanti/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShantiModeActive: false }),
      })
      const elapsedMinutes = Math.floor((durationMinutes * 60 - timeLeft) / 60)
      if (elapsedMinutes >= 1) {
        await fetch("/api/shanti/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ libraryBookId: bookId, durationMinutes: elapsedMinutes }),
        })
        toast.success(`Saved ${elapsedMinutes} min focus session!`)
      }
      setIsActive(false)
      setTimeLeft(durationMinutes * 60)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cycleSound = () => {
    const idx = SOUNDS.findIndex((s) => s.id === soundMode)
    const next = SOUNDS[(idx + 1) % SOUNDS.length].id
    setSoundMode(next)
  }

  // Compact variant: embedded inside EReader top bar
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] p-1 pl-2.5 border border-white/10 text-white">
        {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        {!isActive && (
          <button
            type="button"
            aria-label="Less time"
            onClick={() => setDurationMinutes(Math.max(5, durationMinutes - 5))}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
        )}
        <span className="text-xs font-bold tabular-nums w-11 text-center">
          {formatTime(timeLeft)}
        </span>
        {!isActive && (
          <button
            type="button"
            aria-label="More time"
            onClick={() => setDurationMinutes(Math.min(120, durationMinutes + 5))}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
        <button
          type="button"
          onClick={cycleSound}
          title={`Ambient Sound: ${SOUNDS.find((s) => s.id === soundMode)?.label}`}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
            soundMode !== "off" ? "bg-[#0066cc] text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          {soundMode === "off" ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={isActive ? handleStop : handleStart}
          disabled={isSubmitting}
          className={`h-7 rounded-full px-3 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            isActive
              ? "bg-white/15 hover:bg-white/25 text-white"
              : "bg-[#0066cc] hover:bg-[#0071e3] text-white"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isActive ? (
            <Square className="w-3 h-3 fill-current" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          {isActive ? "End" : "Focus"}
        </button>
      </div>
    )
  }

  const pct = Math.min(100, Math.round((currentPage / Math.max(1, totalPages)) * 100))

  return (
    <div
      ref={containerRef}
      className={`w-full bg-black flex flex-col items-center justify-center text-white px-4 sm:px-6 py-10 transition-colors ${
        isActive
          ? "fixed inset-0 z-[100] min-h-screen overflow-y-auto"
          : "relative min-h-[calc(100vh-4rem)]"
      }`}
    >
      {isActive && (
        <button
          type="button"
          onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          className="fixed top-5 right-5 z-20 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/75 hover:text-white text-xs font-semibold transition cursor-pointer"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" /> Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
            </>
          )}
        </button>
      )}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-xl mb-6 flex justify-start"
          >
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Shanti Mode
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-xl w-full">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-blue-400 font-bold uppercase tracking-[0.28em] text-xs mb-3"
        >
          {isActive ? "Deep Reading Focus Active" : "Shanti Reading Sanctuary"}
        </motion.p>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">{title}</h2>
        <p className="text-[#86868b] font-medium mb-8">by {author}</p>

        {/* Ambient Soundscape Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl sm:rounded-full bg-white/5 border border-white/10 mb-10 max-w-full">
          {SOUNDS.map((snd) => (
            <button
              key={snd.id}
              type="button"
              onClick={() => setSoundMode(snd.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                soundMode === snd.id
                  ? "bg-[#0066cc] text-white shadow-sm"
                  : "text-[#86868b] hover:text-white"
              }`}
            >
              {snd.label}
            </button>
          ))}
        </div>

        {/* Clock */}
        <div className="relative mb-10">
          {isActive && (
            <motion.div
              className="absolute -inset-6 rounded-full border border-[#0066cc]/40 pointer-events-none"
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <h1 className="text-7xl sm:text-8xl md:text-[8.5rem] font-bold tracking-tighter tabular-nums leading-none text-white">
            {formatTime(timeLeft)}
          </h1>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-5 mb-12">
          {!isActive ? (
            <>
              <button
                type="button"
                onClick={() => setDurationMinutes(Math.max(5, durationMinutes - 5))}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleStart}
                disabled={isSubmitting}
                className="bg-[#0066cc] text-white hover:bg-[#0071e3] rounded-full px-10 h-14 font-bold tracking-wide text-base flex items-center gap-2.5 transition shadow-xl cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                Start Focus
              </button>

              <button
                type="button"
                onClick={() => setDurationMinutes(Math.min(120, durationMinutes + 5))}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              disabled={isSubmitting}
              className="bg-white/10 border border-white/15 hover:bg-white/20 text-white rounded-full px-8 h-12 font-semibold text-sm flex items-center gap-2.5 transition cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-white" />
              )}
              End & Log Minutes
            </button>
          )}
        </div>

        {/* Physical Book Page Bookmark Sync */}
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white/90">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Bookmark Progress
            </span>
            <span className="text-[#86868b] font-mono">
              Page {currentPage} / {totalPages} ({pct}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-3">
            <div
              className="h-full bg-[#0066cc] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => savePageProgress(currentPage + 5)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
              >
                +5 Pages
              </button>
              <button
                type="button"
                onClick={() => savePageProgress(currentPage + 15)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
              >
                +15 Pages
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (!Number.isNaN(val)) savePageProgress(val)
                }}
                className="w-16 px-2.5 py-1 rounded-full bg-black/40 border border-white/15 text-center text-white text-xs"
              />
              <span className="text-[#86868b]">of</span>
              <input
                type="number"
                min={10}
                max={5000}
                value={totalPages}
                onChange={(e) => {
                  const val = Math.max(10, Number(e.target.value) || 250)
                  savePageProgress(currentPage, val)
                }}
                className="w-16 px-2.5 py-1 rounded-full bg-black/40 border border-white/15 text-center text-white text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
