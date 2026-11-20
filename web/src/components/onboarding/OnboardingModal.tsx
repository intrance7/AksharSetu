"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  MapPin,
  BookOpen,
  Quote,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  COOKIE_KEYS,
  getClientCookie,
  setClientCookie,
  setJsonCookie,
} from "@/lib/cookies"

const GENRE_OPTIONS = [
  "Literary Fiction",
  "Sci-Fi & Fantasy",
  "Philosophy & Classics",
  "Academic & Textbooks",
  "Competitive Exams",
  "Self-Help & Mindset",
  "Mystery & Thriller",
  "History & Biography",
  "Poetry & Essays",
  "Business & Tech",
]

const INTENT_OPTIONS = [
  { id: "discover", label: "Buy & Discover Books" },
  { id: "swap", label: "1-for-1 Book Swaps" },
  { id: "donate", label: "Vidya Daan Donations" },
  { id: "elibrary", label: "Free E-Library & Shanti Mode" },
]

export function OnboardingModal() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)

  // Step 1: Identity & Location
  const [city, setCity] = useState("")
  const [bio, setBio] = useState("")

  // Step 2: Genres & Primary Intent
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [intent, setIntent] = useState("discover")

  // Step 3: Annual Reading Goal & Signature Quote
  const [readingGoal, setReadingGoal] = useState(12)
  const [favoriteQuote, setFavoriteQuote] = useState("")
  const [quoteAuthor, setQuoteAuthor] = useState("")

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return
    const uid = session.user.id

    // Fast path: already onboarded cookie for this user
    if (getClientCookie(COOKIE_KEYS.ONBOARDED) === uid) return

    let cancelled = false
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        if (cancelled || !profile) return
        // If returning user already filled both bio & location, mark cookie silently
        if (profile.bio?.trim() && profile.location?.trim()) {
          setClientCookie(COOKIE_KEYS.ONBOARDED, uid, 365)
          return
        }
        if (profile.location) setCity(profile.location)
        if (profile.bio) setBio(profile.bio)
        if (profile.readingGoalBooks) setReadingGoal(profile.readingGoalBooks)
        if (profile.favoriteQuote) setFavoriteQuote(profile.favoriteQuote)
        if (profile.quoteAuthor) setQuoteAuthor(profile.quoteAuthor)
        setOpen(true)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [status, session?.user?.id])

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : prev.length < 5
          ? [...prev, genre]
          : prev
    )
  }

  const handleSkip = () => {
    if (session?.user?.id) {
      setClientCookie(COOKIE_KEYS.ONBOARDED, session.user.id, 365)
    }
    setOpen(false)
  }

  const handleComplete = async () => {
    if (!session?.user?.id || saving) return
    setSaving(true)
    try {
      const composedBio =
        bio.trim() ||
        (selectedGenres.length > 0
          ? `Reader into ${selectedGenres.slice(0, 3).join(", ")}.`
          : "Avid reader on AksharSetu.")

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: city.trim() || undefined,
          bio: composedBio,
          readingGoalBooks: readingGoal,
          favoriteQuote: favoriteQuote.trim() || undefined,
          quoteAuthor: quoteAuthor.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Could not save preferences")
      }

      setClientCookie(COOKIE_KEYS.ONBOARDED, session.user.id, 365)
      setJsonCookie(
        COOKIE_KEYS.USER_PREFS,
        {
          genres: selectedGenres,
          city: city.trim() || undefined,
          intent,
          readingGoal,
        },
        365
      )

      toast.success("Your AksharSetu reading profile is personalized!")
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || "Could not save personalization")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl rounded-3xl overflow-hidden bg-[#FAF6F0] text-[#1D1D1F] shadow-2xl border border-black/10"
          >
            {/* Top Obsidian Editorial Banner */}
            <div className="bg-[#0B0B0D] text-[#F5F5F7] px-6 py-5 flex items-start justify-between gap-4 border-b border-white/10">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF8A4C]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Welcome to AksharSetu · Step {step} of 3
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                  {step === 1 && "Tell us a little about you"}
                  {step === 2 && "What do you love to read?"}
                  {step === 3 && "Set your reading goal"}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/75 transition cursor-pointer shrink-0"
                title="Skip personalization"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-black/5">
              <div
                className="h-full bg-[#C84200] transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <div className="p-6 space-y-5">
              {step === 1 && (
                <>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2">
                      <MapPin className="w-3.5 h-3.5 text-[#C84200]" />
                      City or Campus
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Delhi University, Bengaluru, Pune..."
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-sm focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#C84200]" />
                      Short Reader Bio
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Engineering student hunting classic sci-fi & GATE textbooks..."
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 text-sm focus:outline-none focus:border-[#0066cc] resize-none"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2.5">
                      Pick up to 5 favorite genres
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {GENRE_OPTIONS.map((g) => {
                        const active = selectedGenres.includes(g)
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGenre(g)}
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
                              active
                                ? "bg-[#0B0B0D] text-white border-[#0B0B0D]"
                                : "bg-white text-[#1D1D1F] border-black/10 hover:border-black/30"
                            }`}
                          >
                            {active && <Check className="w-3 h-3 inline mr-1" />}
                            {g}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2.5">
                      What brings you here most?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {INTENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setIntent(opt.id)}
                          className={`px-4 py-2.5 rounded-2xl text-left text-xs font-semibold border transition cursor-pointer ${
                            intent === opt.id
                              ? "bg-[#C84200]/10 text-[#C84200] border-[#C84200]"
                              : "bg-white text-[#1D1D1F] border-black/10 hover:border-black/25"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="rounded-2xl bg-white border border-black/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                        Annual Reading Goal
                      </span>
                      <span className="text-lg font-black text-[#C84200]">
                        {readingGoal} books / year
                      </span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={60}
                      step={2}
                      value={readingGoal}
                      onChange={(e) => setReadingGoal(Number(e.target.value))}
                      className="w-full accent-[#C84200] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2">
                      <Quote className="w-3.5 h-3.5 text-[#C84200]" />
                      Favorite Literary Quote (Optional)
                    </label>
                    <input
                      type="text"
                      value={favoriteQuote}
                      onChange={(e) => setFavoriteQuote(e.target.value)}
                      placeholder="A reader lives a thousand lives before he dies..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-black/10 text-sm focus:outline-none focus:border-[#0066cc] mb-2"
                    />
                    <input
                      type="text"
                      value={quoteAuthor}
                      onChange={(e) => setQuoteAuthor(e.target.value)}
                      placeholder="Author (e.g., George R.R. Martin)"
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-black/10 text-sm focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                </>
              )}

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-black/5 hover:bg-black/10 text-xs font-semibold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs font-semibold text-[#6e6e73] hover:text-[#1D1D1F] cursor-pointer"
                  >
                    Skip for now
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0B0B0D] hover:bg-[#1D1D1F] text-white text-xs font-bold transition cursor-pointer"
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold transition cursor-pointer disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save & Personalize"}
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
