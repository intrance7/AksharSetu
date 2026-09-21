"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, MapPin } from "lucide-react"

export function ProfileForm({ user }: { user: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    latitude: user.latitude || null,
    longitude: user.longitude || null
  })
  const [detectingLocation, setDetectingLocation] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Failed to update profile")
      
      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }
    
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        let locationName = formData.location;
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          const data = await res.json();
          if (data.city || data.locality) {
             locationName = `${data.city || data.locality}, ${data.countryName || data.countryCode}`;
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
        }

        setFormData({
          ...formData,
          latitude: lat,
          longitude: lon,
          location: locationName
        })
        setDetectingLocation(false)
        setSuccess(false) // Prompt user to save
      },
      (error) => {
        console.error("Error detecting location", error)
        alert("Failed to detect location. Please allow location permissions.")
        setDetectingLocation(false)
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">Display Name</label>
        <input 
          type="text" 
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]/20 focus-visible:border-[#0066cc]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">Location</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Mumbai, India"
            className="h-12 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]/20 focus-visible:border-[#0066cc]"
          />
          <button 
            type="button" 
            onClick={handleDetectLocation}
            disabled={detectingLocation}
            className="h-12 px-4 rounded-xl border border-gray-200 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] font-bold flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50"
          >
            {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            <span className="hidden sm:inline">Detect Location</span>
          </button>
        </div>
        {(formData.latitude && formData.longitude) && (
          <p className="text-xs font-bold text-[#0066cc]">
            📍 Coordinates saved: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">Bio</label>
        <textarea 
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell the community a bit about yourself..."
          className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]/20 focus-visible:border-[#0066cc]"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="h-12 w-full rounded-full bg-[#1D1D1F] hover:bg-[#2d2d2f] text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
         success ? <><Check className="w-5 h-5 text-emerald-400" /> Saved</> : 
         "Save Changes"}
      </button>
    </form>
  )
}
