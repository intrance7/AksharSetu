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
  ChevronDown,
} from "lucide-react"
import { calculateDistance } from "@/lib/utils"
import { resolveBookCoordinates } from "@/lib/geo"
import { GeneratedCover } from "@/components/catalog/GeneratedCover"
import { toast } from "sonner"

const InteractiveMap = dynamic(() => import("@/components/catalog/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[500px] md:h-[640px] rounded-3xl bg-white/75 border border-[#1D1D1F]/[0.07] animate-pulse flex items-center justify-center font-bold text-sm text-[#1D1D1F]/50">
      Loading Interactive Campus &amp; City Map...
    </div>
  ),
})

type RadiusKm = 2 | 5 | 15 | 50 | 0 // 0 = All India
type TypeFilter = "all" | "free" | "swap" | "paid"

function MapListThumb({ book }: { book: any }) {
  const [err, setErr] = useState(false)
  if (book.images?.[0] && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.images[0]}
        alt={book.title}
        onError={() => setErr(true)}
        className="w-full h-full object-cover"
      />
    )
  }
  return (
    <GeneratedCover
      title={book.title}
      author={book.author}
      category={book.category}
    />
  )
}

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
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="w-4 h-4 text-[#86868b] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by book, author, campus, or city..."
            className="w-full h-11 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] pl-11 pr-4 text-sm font-medium text-[#1D1D1F] outline-none focus:bg-white focus:border-[#C84200]/50 focus:ring-4 focus:ring-[#C84200]/10 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Pills */}
          {(
            [
              { id: "all", label: "All" },
              { id: "free", label: "Free Vidya Daan" },
              { id: "swap", label: "1-for-1 Swaps" },
              { id: "paid", label: "Resale" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                typeFilter === t.id
                  ? t.id === "free"
                    ? "bg-[#0A7D4F] text-white"
                    : t.id === "swap"
                    ? "bg-[#0066cc] text-white"
                    : "bg-[#1D1D1F] text-white"
                  : "bg-[#FAF6F0] text-[#1D1D1F] hover:bg-[#EFE7DC]"
              }`}
            >
              {t.label}
            </button>
          ))}

          <span className="h-5 w-px bg-[#1D1D1F]/10 mx-1 hidden sm:inline-block" />

          {/* Radius Selector */}
          <div className="relative inline-flex items-center">
            <select
              value={radiusKm}
              onChange={(e) => {
                const next = Number(e.target.value) as RadiusKm
                if (next > 0 && (!coords?.latitude || !coords?.longitude)) {
                  toast.info(
                    "Click 'Detect My GPS' first to filter by distance!"
                  )
                  return
                }
                setRadiusKm(next)
              }}
              aria-label="Filter radius"
              className="appearance-none h-10 rounded-full bg-[#FAF6F0] pl-4 pr-8 text-[13px] font-bold text-[#1D1D1F] outline-none border border-[#1D1D1F]/[0.08] cursor-pointer"
            >
              <option value={0}>Radius: All India</option>
              <option value={2}>Within 2 km (Campus)</option>
              <option value={5}>Within 5 km</option>
              <option value={15}>Within 15 km (City)</option>
              <option value={50}>Within 50 km</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#86868b] pointer-events-none absolute right-3" />
          </div>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detecting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-[13px] font-bold transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            {detecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            {coords?.latitude ? "Refresh GPS" : "Detect My GPS"}
          </button>
        </div>
      </div>

      {/* Split Map + Nearby List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 min-w-0">
          <div className="bg-white rounded-3xl p-2 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07]">
            <InteractiveMap books={filteredBooks} userLocation={coords} />
          </div>
          <p className="text-[13px] text-[#6e6e73] font-medium mt-3 px-2">
            Showing{" "}
            <span className="font-mono font-bold text-[#1D1D1F]">
              {mappedPinCount}
            </span>{" "}
            mapped pins (
            <span className="font-mono font-bold text-[#1D1D1F]">
              {filteredBooks.length}
            </span>{" "}
            matching listings). Coordinates are softly jittered ~150m to protect
            reader privacy.
          </p>
        </div>

        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 shadow-[0_6px_28px_rgba(29,29,31,0.04)] border border-[#1D1D1F]/[0.07] lg:max-h-[656px] lg:overflow-y-auto space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#1D1D1F]/[0.07]">
            <h2 className="font-black text-lg text-[#1D1D1F] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C84200] shrink-0" /> Nearby
              Books
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] text-[#1D1D1F]/75">
                {filteredBooks.length}
              </span>
            </h2>
            <Link
              href="/catalog/new"
              className="text-[13px] font-bold text-[#C84200] hover:underline shrink-0"
            >
              + Pin Yours
            </Link>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="py-12 text-center text-[#6e6e73]">
              <BookOpen className="w-10 h-10 mx-auto mb-2.5 opacity-30" />
              <p className="text-[15px] font-bold text-[#1D1D1F]">
                No books within this radius
              </p>
              <p className="text-sm mt-1">
                Try switching Radius to &ldquo;All India&rdquo; or broadening
                your search.
              </p>
            </div>
          ) : (
            filteredBooks.slice(0, 30).map((b) => (
              <Link
                key={b.id}
                href={`/catalog/${b.id}`}
                className="group flex gap-3.5 p-3.5 rounded-2xl bg-[#FAF6F0] hover:bg-white border border-[#1D1D1F]/[0.06] hover:border-[#C84200]/30 hover:shadow-sm transition-all"
              >
                <div className="w-13 h-[72px] rounded-lg bg-white overflow-hidden shrink-0 border border-[#1D1D1F]/[0.06] shadow-xs">
                  <MapListThumb book={b} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-xs font-black inline-flex items-center gap-1 ${
                        b.price === 0
                          ? b.acceptsExchange
                            ? "text-[#0066cc]"
                            : "text-[#0A7D4F]"
                          : "text-[#C84200]"
                      }`}
                    >
                      {b.price === 0 ? (
                        b.acceptsExchange ? (
                          <>
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
                          </>
                        ) : (
                          <>
                            <Gift className="w-3.5 h-3.5" /> Free
                          </>
                        )
                      ) : (
                        `₹${b.price}`
                      )}
                    </span>
                    {b._distanceKm !== null && (
                      <span className="font-mono text-xs font-bold text-[#0A7D4F] bg-[#0A7D4F]/10 px-2.5 py-0.5 rounded-full shrink-0">
                        {b._distanceKm < 1
                          ? `${Math.round(b._distanceKm * 1000)} m`
                          : `${b._distanceKm.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[15px] text-[#1D1D1F] group-hover:text-[#C84200] transition-colors truncate mt-0.5">
                    {b.title}
                  </h3>
                  <p className="text-xs text-[#6e6e73] truncate">{b.author}</p>
                  <p className="text-xs text-[#6e6e73] truncate mt-1 inline-flex items-center gap-1 max-w-full">
                    <MapPin className="w-3 h-3 text-[#C84200] shrink-0" />
                    <span className="truncate">
                      {b.university || b.owner?.location || "India"}
                    </span>
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
