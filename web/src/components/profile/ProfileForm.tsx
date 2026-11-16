"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Check,
  MapPin,
  Quote,
  Sparkles,
  Upload,
  Lock,
  Eye,
  Award,
} from "lucide-react"
import {
  PRESET_QUOTES,
  COSMETIC_CATALOG,
  calculateLevelFromXP,
} from "@/lib/gamification"
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
    username?: string | null
    image?: string | null
    coverImage?: string | null
    profileFrame?: string | null
    selectedTitle?: string | null
    totalXP?: number
    aksharPoints?: number
    readingGoalBooks?: number
    unlockedCosmetics?: string[]
    bio?: string | null
    favoriteQuote?: string | null
    quoteAuthor?: string | null
    location?: string | null
    latitude?: number | null
    longitude?: number | null
    liveStatus?: string | null
    isPublicProfile?: boolean
    showOnlineStatus?: boolean
    showReadingActivity?: boolean
    showContributionGraph?: boolean
    leaderboardOptOut?: boolean
  }
  onSuccess?: () => void
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)

  const levelInfo = calculateLevelFromXP(user.totalXP || 0)

  const [formData, setFormData] = useState({
    name: user.name || "",
    username:
      user.username ||
      (user.name || "reader").toLowerCase().replace(/[^a-z0-9]/g, ""),
    image: user.image || "",
    coverImage: user.coverImage || "obsidian",
    profileFrame: user.profileFrame || "classic",
    selectedTitle: user.selectedTitle || levelInfo.rankTitle,
    readingGoalBooks: user.readingGoalBooks || 12,
    bio: user.bio || "",
    favoriteQuote: user.favoriteQuote || "",
    quoteAuthor: user.quoteAuthor || "",
    liveStatus: user.liveStatus || "",
    location: user.location || "",
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    isPublicProfile: user.isPublicProfile ?? true,
    showOnlineStatus: user.showOnlineStatus ?? true,
    showReadingActivity: user.showReadingActivity ?? true,
    showContributionGraph: user.showContributionGraph ?? true,
    leaderboardOptOut: user.leaderboardOptOut ?? false,
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setSuccess(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Upload failed")
      }

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!putRes.ok) {
        throw new Error("Could not store uploaded image")
      }
      const putData = await putRes.json().catch(() => null)

      setFormData((prev) => ({
        ...prev,
        image: putData?.publicUrl || presignData.publicUrl,
      }))
      setSuccess(false)
      toast.success("Avatar uploaded! Click Save to update your profile.")
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        let locationName = formData.location
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await res.json()
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state_district ||
            ""
          const state = data.address?.state || ""
          if (city || state) {
            locationName = [city, state].filter(Boolean).join(", ")
          }
        } catch {}

        setFormData((prev) => ({
          ...prev,
          location: locationName,
          latitude,
          longitude,
        }))
        setDetectingLocation(false)
        setSuccess(false)
      },
      () => setDetectingLocation(false)
    )
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
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update profile")

      setSuccess(true)
      toast.success("Identity, cosmetics & privacy settings saved!")
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message || "Could not save profile changes.")
    } finally {
      setLoading(false)
    }
  }

  const frames = COSMETIC_CATALOG.filter((c) => c.type === "frame")
  const banners = COSMETIC_CATALOG.filter((c) => c.type === "banner")

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Avatar & Presets */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f]">
          Avatar & Presets
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {AVATAR_PRESETS.map((presetUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, image: presetUrl }))
                setSuccess(false)
              }}
              className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                formData.image === presetUrl
                  ? "border-[#0066cc] scale-110 shadow-md"
                  : "border-black/10 opacity-75 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={presetUrl}
                alt={`Avatar ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1d1d1f] hover:bg-[#0066cc] text-white text-xs font-bold cursor-pointer transition-colors">
            {uploadingAvatar ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploadingAvatar ? "Uploading..." : "Upload Photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Display Name & Unique @Username */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-[#1d1d1f] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5">
            Unique @Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#86868b]">
              @
            </span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white rounded-xl pl-8 pr-4 py-2.5 text-sm font-medium text-[#1d1d1f] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Equipped Title & Annual Reading Goal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#0066cc]" /> Equipped Rank Title
          </label>
          <select
            name="selectedTitle"
            value={formData.selectedTitle}
            onChange={handleChange}
            className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-[#1d1d1f] outline-none"
          >
            {levelInfo.unlockedTitles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5">
            Annual Reading Goal (Books)
          </label>
          <input
            type="number"
            name="readingGoalBooks"
            min={1}
            max={200}
            value={formData.readingGoalBooks}
            onChange={handleChange}
            className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white rounded-xl px-4 py-2.5 text-sm font-bold text-[#1d1d1f] outline-none"
          />
        </div>
      </div>

      {/* Cosmetic Frame & Banner Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#f5f5f7]">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f] mb-2">
            Avatar Frame Style
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {frames.map((f) => {
              const isUnlocked =
                levelInfo.level >= f.minLevel ||
                (user.unlockedCosmetics || []).includes(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, profileFrame: f.key }))
                  }
                  className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer disabled:opacity-45 ${
                    formData.profileFrame === f.key
                      ? "bg-[#0066cc] text-white border-[#0066cc]"
                      : "bg-white text-[#1d1d1f] border-black/10"
                  }`}
                >
                  <span className="block truncate">{f.name}</span>
                  {!isUnlocked && (
                    <span className="text-[9px] flex items-center gap-0.5 opacity-80">
                      <Lock className="w-2.5 h-2.5" /> Lvl {f.minLevel}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f] mb-2">
            Cover Banner Design
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {banners.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, coverImage: b.key }))
                }
                className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                  formData.coverImage === b.key
                    ? "bg-[#0066cc] text-white border-[#0066cc]"
                    : "bg-white text-[#1d1d1f] border-black/10"
                }`}
              >
                <span className="block truncate">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location & Live Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5">
            City / Campus Location
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., New Delhi, India"
              className="flex-1 bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-[#1d1d1f] outline-none"
            />
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="px-3 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-bold shrink-0 cursor-pointer"
              title="Auto-detect GPS location"
            >
              {detectingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-[#0066cc]" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C84200]" /> Live Reading
            Status
          </label>
          <input
            type="text"
            name="liveStatus"
            value={formData.liveStatus}
            onChange={handleChange}
            placeholder="e.g., Reading Gitanjali · Chapter 4"
            className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-[#1d1d1f] outline-none"
          />
        </div>
      </div>

      {/* Biography */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1d1d1f] mb-1.5">
          Reader Biography
        </label>
        <textarea
          name="bio"
          rows={3}
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell the community what you love reading, studying, or collecting..."
          className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0066cc] focus:bg-white rounded-xl p-3.5 text-sm font-medium text-[#1d1d1f] outline-none resize-none"
        />
      </div>

      {/* Signature Literary Quote */}
      <div className="p-4 rounded-2xl bg-[#f5f5f7] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5 text-[#0066cc]" /> Signature Literary
            Quote
          </span>
        </div>
        <textarea
          name="favoriteQuote"
          rows={2}
          value={formData.favoriteQuote}
          onChange={handleChange}
          placeholder="A favorite passage from a book..."
          className="w-full bg-white rounded-xl p-3 text-sm italic font-medium text-[#1d1d1f] outline-none border border-black/5"
        />
        <input
          type="text"
          name="quoteAuthor"
          value={formData.quoteAuthor}
          onChange={handleChange}
          placeholder="Author / Book source"
          className="w-full bg-white rounded-xl px-3.5 py-2 text-xs font-bold text-[#1d1d1f] outline-none border border-black/5"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_QUOTES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  favoriteQuote: q.quote,
                  quoteAuthor: q.author,
                }))
              }
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white hover:bg-[#0066cc] hover:text-white text-[#1d1d1f] border border-black/5 transition-colors cursor-pointer"
            >
              {q.author}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy & Showcase Visibility Controls */}
      <div className="p-4 rounded-2xl bg-[#f5f5f7] space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-[#0066cc]" /> Privacy & Showcase
          Visibility
        </span>

        {[
          {
            key: "showOnlineStatus",
            label: "Show my online status & live reading activity",
          },
          {
            key: "showReadingActivity",
            label: "Display my reading showcase & activity timeline publicly",
          },
          {
            key: "showContributionGraph",
            label: "Display my 365-day contribution heatmap publicly",
          },
          {
            key: "leaderboardOptOut",
            label: "Opt out of public community leaderboards",
          },
        ].map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between gap-3 py-1 text-xs font-semibold text-[#1d1d1f] cursor-pointer"
          >
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={Boolean((formData as any)[item.key])}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [item.key]: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-[#0066cc] rounded cursor-pointer"
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving Profile...
          </>
        ) : success ? (
          <>
            <Check className="w-4 h-4" /> Saved Successfully!
          </>
        ) : (
          "Save Identity & Preferences"
        )}
      </button>
    </form>
  )
}
