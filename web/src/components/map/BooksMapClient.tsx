"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  BookOpen,
  ArrowLeftRight,
  Gift,
} from "lucide-react"
import { calculateDistance } from "@/lib/utils"
import { resolveBookCoordinates } from "@/lib/geo"
import { toast } from "sonner"

const InteractiveMap = dynamic(() => import("@/components/catalog/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] md:h-[680px] rounded-3xl bg-black/5 animate-pulse flex items-center justify-center font-bold text-[#1D1D1F]/40">
      Loading Interactive Campus & City Map...
    </div>
  ),
})

type RadiusKm = 2 | 5 | 15 | 50 | 0 // 0 = All India
type TypeFilter = "all" | "free" | "swap" | "paid"

export function BooksMapClient({
  books,
  initialLocation,
  isLoggedIn,
}: {
  books: any[]
  initialLocation: { latitude: number | null; longitude: number | null } | null
  isLoggedIn: boolean
}) {
  const [coords, setCoords] = useState<{
    latitude: number | null
    longitude: number | null
  } | null>(initialLocation)
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(
    initialLocation?.latitude ? 15 : 0
  )
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [query, setQuery] = useState("")
  const [detecting, setDetecting] = useState(false)

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser")
      return
    }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ latitude: lat, longitude: lng })
        if (radiusKm === 0) setRadiusKm(15)

        if (isLoggedIn) {
          fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
          }).catch(() => {})
        }

        toast.success("GPS locked! Showing books nearest to you.")
        setDetecting(false)
      },
      () => {
        toast.error("Location permission denied.")
        setDetecting(false)
      }
    )
  }

  const filteredBooks = useMemo(() => {
    return books
      .map((book, idx) => {
        const resolved = resolveBookCoordinates(book, idx)
        const dist =
          coords?.latitude && coords?.longitude && resolved
            ? calculateDistance(
                coords.latitude,
                coords.longitude,
                resolved[0],
                resolved[1]
              )
            : null
        return { ...book, _resolvedCoords: resolved, _distanceKm: dist }
      })
      .filter((b) => {
        if (typeFilter === "free" && !(b.price === 0 && !b.acceptsExchange))
          return false
        if (typeFilter === "swap" && !b.acceptsExchange) return false
        if (typeFilter === "paid" && b.price <= 0) return false

        if (query.trim()) {
          const q = query.toLowerCase()
          const hit =
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.university || "").toLowerCase().includes(q) ||
            (b.owner?.location || "").toLowerCase().includes(q)
          if (!hit) return false
        }

        if (radiusKm > 0 && coords?.latitude && coords?.longitude) {
          if (b._distanceKm === null || b._distanceKm > radiusKm) return false
        }

        return true
      })
      .sort((a, b) => {
        if (a._distanceKm !== null && b._distanceKm !== null) {
          return a._distanceKm - b._distanceKm
        }
        if (a._distanceKm !== null) return -1
        if (b._distanceKm !== null) return 1
        return 0
      })
  }, [books, coords, radiusKm, typeFilter, query])

  const mappedPinCount = filteredBooks.filter((b) => b._resolvedCoords).length

  return (
    <div className="space-y-6">
      {/* Filter & GPS Control Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by book, author, campus, or city..."
            className="w-full h-11 rounded-full bg-[#FAF6F0] pl-11 pr-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:ring-2 focus:ring-[#C84200]/25"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Pills */}
          {(
            [
              { id: "all", label: "All" },
              { id: "free", label: "Free Donations" },
              { id: "swap", label: "1-for-1 Swaps" },
              { id: "paid", label: "Resale" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                typeFilter === t.id
                  ? "bg-[#1D1D1F] text-white"
                  : "bg-[#FAF6F0] text-[#1D1D1F] hover:bg-black/5"
              }`}
            >
              {t.label}
            </button>
          ))}

          <span className="h-5 w-px bg-black/10 mx-1 hidden sm:inline-block" />

          {/* Radius Selector */}
          <select
            value={radiusKm}
            onChange={(e) => {
              const next = Number(e.target.value) as RadiusKm
              if (next > 0 && (!coords?.latitude || !coords?.longitude)) {
                toast.info("Click 'Detect My GPS' first to filter by distance!")
                return
              }
              setRadiusKm(next)
            }}
            className="h-9 rounded-full bg-[#FAF6F0] px-3.5 text-xs font-bold text-[#1D1D1F] outline-none border border-black/10"
          >
            <option value={0}>Radius: All India</option>
            <option value={2}>Within 2 km (Campus)</option>
            <option value={5}>Within 5 km</option>
            <option value={15}>Within 15 km (City)</option>
            <option value={50}>Within 50 km</option>
          </select>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detecting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {detecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            {coords?.latitude ? "Refresh GPS" : "Detect My GPS"}
          </button>
        </div>
      </div>

      {/* Split Map + Nearby List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <InteractiveMap books={filteredBooks} userLocation={coords} />
          <p className="text-xs text-[#86868b] font-medium mt-2.5 px-2">
            Showing {mappedPinCount} mapped pins ({filteredBooks.length}{" "}
            matching listings). Exact coordinates are jittered ~150m to protect
            reader privacy.
          </p>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-black/5 max-h-[680px] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <h2 className="font-black text-base text-[#1D1D1F] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C84200]" /> Nearby Books (
              {filteredBooks.length})
            </h2>
            <Link
              href="/catalog/new"
              className="text-xs font-bold text-[#C84200] hover:underline"
            >
              + Pin Yours
            </Link>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="py-14 text-center text-[#86868b]">
              <BookOpen className="w-9 h-9 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold text-[#1D1D1F]">
                No books within this radius
              </p>
              <p className="text-xs mt-1">
                Try switching Radius to &ldquo;All India&rdquo; or broadening
                your search.
              </p>
            </div>
          ) : (
            filteredBooks.slice(0, 30).map((b) => (
              <Link
                key={b.id}
                href={`/catalog/${b.id}`}
                className="flex gap-3.5 p-3 rounded-2xl bg-[#FAF6F0]/70 hover:bg-[#FAF6F0] border border-black/5 transition-colors"
              >
                <div className="w-12 h-16 rounded-lg bg-white overflow-hidden shrink-0 flex items-center justify-center border border-black/5">
                  {b.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.images[0]}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-4 h-4 text-[#86868b]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-[#0066cc] inline-flex items-center gap-1">
                      {b.price === 0 ? (
                        b.acceptsExchange ? (
                          <>
                            <ArrowLeftRight className="w-3 h-3" /> Swap
                          </>
                        ) : (
                          <>
                            <Gift className="w-3 h-3 text-emerald-600" /> Free
                          </>
                        )
                      ) : (
                        `₹${b.price}`
                      )}
                    </span>
                    {b._distanceKm !== null && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {b._distanceKm < 1
                          ? `${Math.round(b._distanceKm * 1000)} m`
                          : `${b._distanceKm} km`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#1D1D1F] truncate mt-0.5">
                    {b.title}
                  </h3>
                  <p className="text-xs text-[#86868b] truncate">
                    {b.author}
                  </p>
                  <p className="text-[11px] text-[#86868b] truncate mt-0.5">
                    📍 {b.university || b.owner?.location || "India"}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
