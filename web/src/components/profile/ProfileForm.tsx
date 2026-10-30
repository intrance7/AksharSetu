"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, MapPin, Quote, Sparkles, Image as ImageIcon } from "lucide-react"
import { PRESET_QUOTES } from "@/lib/gamification"
import { toast } from "sonner"

const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=Felix&backgroundColor=f2ebe1",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Aneka&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Kabir&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Meera&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Aarav&backgroundColor=b6e3f4",
]

interface ProfileFormProps {
  user: {
    id?: string
    name?: string | null
    image?: string | null
    bio?: string | null
    favoriteQuote?: string | null
    quoteAuthor?: string | null
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    liveStatus?: string | null
  }
  onSuccess?: () => void
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || "",
    image: user.image || "",
    bio: user.bio || "",
    favoriteQuote: user.favoriteQuote || "",
    quoteAuthor: user.quoteAuthor || "",
    liveStatus: user.liveStatus || "",
    location: user.location || "",
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
  })
  const [detectingLocation, setDetectingLocation] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  const handleSelectPresetQuote = (q: { quote: string; author: string }) => {
    setFormData((prev) => ({
      ...prev,
      favoriteQuote: q.quote,
      quoteAuthor: q.author,
    }))
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to update profile")

      setSuccess(true)
      toast.success("Profile & literary quote updated!")
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      toast.error("Could not save profile changes.")
    } finally {
      setLoading(false)
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude

        let locationName = formData.location
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          )
          const data = await res.json()
          if (data.city || data.locality) {
            locationName = `${data.city || data.locality}, ${
              data.countryName || data.countryCode
            }`
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e)
        }

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          location: locationName,
        }))
        setDetectingLocation(false)
        setSuccess(false)
      },
      (error) => {
        console.error("Error detecting location", error)
        toast.error("Failed to detect location. Please allow location permissions.")
        setDetectingLocation(false)
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Display Name & Avatar Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider">
            Display Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your reader name"
            className="h-12 w-full rounded-xl border border-black/10 bg-[#F5F5F7] px-4 text-sm font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider">
            Live Status / Currently Reading
          </label>
          <input
            type="text"
            name="liveStatus"
            value={formData.liveStatus}
            onChange={handleChange}
            placeholder="e.g. Reading Gitanjali on page 42..."
            className="h-12 w-full rounded-xl border border-black/10 bg-[#F5F5F7] px-4 text-sm font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
          />
        </div>
      </div>

      {/* Avatar URL & Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#0066cc]" /> Avatar Image URL or Quick Pick
        </label>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1D1D1F] overflow-hidden shrink-0 flex items-center justify-center border border-black/10">
            {formData.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={formData.image} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-lg">
                {(formData.name || "R").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://... or choose a preset avatar below"
            className="h-12 flex-1 rounded-xl border border-black/10 bg-[#F5F5F7] px-4 text-sm font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
          />
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[11px] font-bold text-[#86868b] mr-1">Presets:</span>
          {AVATAR_PRESETS.map((presetUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, image: presetUrl }))
                setSuccess(false)
              }}
              className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                formData.image === presetUrl ? "border-[#0066cc] ring-2 ring-[#0066cc]/20" : "border-black/10"
              }`}
              title={`Select preset avatar ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={presetUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider">
          Location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Mumbai, India"
            className="h-12 flex-1 rounded-xl border border-black/10 bg-[#F5F5F7] px-4 text-sm font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
          />
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingLocation}
            className="h-12 px-5 rounded-full border border-black/10 bg-[#e8e8ed] hover:bg-[#d2d2d7] text-[#1D1D1F] text-xs font-bold flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
          >
            {detectingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 text-[#0066cc]" />
            )}
            <span className="hidden sm:inline">Detect GPS</span>
          </button>
        </div>
        {formData.latitude && formData.longitude && (
          <p className="text-xs font-bold text-[#0066cc]">
            📍 Coordinates saved: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider">
          Reader Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell the community about the genres, authors, and ideas you love..."
          className="min-h-[96px] w-full rounded-xl border border-black/10 bg-[#F5F5F7] px-4 py-3 text-sm font-medium text-[#1D1D1F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
        />
      </div>

      {/* Favorite Quote & Quote Author Section */}
      <div className="rounded-2xl bg-[#F5F5F7] p-5 border border-black/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider flex items-center gap-2">
            <Quote className="w-4 h-4 text-[#0066cc]" /> Signature Literary Quote
          </label>
          <span className="text-[11px] font-bold text-[#86868b]">Displayed on your profile & leaderboard</span>
        </div>

        <textarea
          name="favoriteQuote"
          value={formData.favoriteQuote}
          onChange={handleChange}
          placeholder="Write your favorite book quote or personal reading philosophy..."
          className="min-h-[80px] w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-black text-[#86868b] uppercase tracking-wider">
            Quote Author / Book Source
          </label>
          <input
            type="text"
            name="quoteAuthor"
            value={formData.quoteAuthor}
            onChange={handleChange}
            placeholder="e.g. Rabindranath Tagore / George R.R. Martin"
            className="h-10 w-full rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
          />
        </div>

        {/* Curated Quote Inspiration Chips */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-[11px] font-bold text-[#86868b] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#0066cc]" /> Or pick a classic literary quote:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUOTES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPresetQuote(item)}
                className="text-left text-xs font-semibold px-3 py-1.5 rounded-full bg-white hover:bg-[#0066cc] hover:text-white text-[#1D1D1F] border border-black/10 transition-colors truncate max-w-[240px]"
                title={`"${item.quote}" — ${item.author}`}
              >
                “{item.quote.slice(0, 28)}…” — {item.author.split(" ").pop()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : success ? (
          <>
            <Check className="w-5 h-5" /> Profile Updated
          </>
        ) : (
          "Save Profile & Quote"
        )}
      </button>
    </form>
  )
}
