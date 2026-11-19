"use client"

import { useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import Link from "next/link"
import { resolveBookCoordinates } from "@/lib/geo"
import { GeneratedCover } from "./GeneratedCover"

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

function PopupCover({ book }: { book: any }) {
  const [err, setErr] = useState(false)
  const src = book.images?.[0]
  if (src && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
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

export default function Map({
  books,
  userLocation,
}: {
  books: any[]
  userLocation?: { latitude: number | null; longitude: number | null } | null
}) {
  const firstWithCoords = books
    .map((b, i) => resolveBookCoordinates(b, i))
    .find(Boolean)

  const center: [number, number] =
    userLocation?.latitude && userLocation?.longitude
      ? [userLocation.latitude, userLocation.longitude]
      : firstWithCoords || [20.5937, 78.9629]

  const defaultZoom =
    userLocation?.latitude && userLocation?.longitude
      ? 12
      : firstWithCoords
      ? 11
      : 5

  return (
    <div className="w-full h-[380px] sm:h-[500px] md:h-[640px] rounded-3xl overflow-hidden shadow-sm border border-black/[0.06] relative z-0">
      <MapContainer
        key={`${center[0].toFixed(3)}-${center[1].toFixed(3)}`}
        center={center}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {books.map((book, idx) => {
          const coords = resolveBookCoordinates(book, idx)
          if (!coords) return null

          return (
            <Marker key={book.id} position={coords}>
              <Popup className="custom-popup border-0 p-0 shadow-lg rounded-2xl overflow-hidden">
                <div className="flex flex-col gap-2.5 w-[210px] sm:w-[220px]">
                  <div className="relative w-full h-32 bg-[#FAF6F0] rounded-lg overflow-hidden">
                    <PopupCover book={book} />
                  </div>
                  <div className="px-1 pb-1">
                    <h3 className="font-bold text-[#1d1d1f] text-sm leading-tight mb-0.5 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#86868b] line-clamp-1">
                      {book.author}
                    </p>
                    {book.owner?.location && (
                      <p className="text-[11px] font-semibold text-[#86868b] mt-1 truncate">
                        📍 {book.owner.location}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-black/5">
                      <span className="font-black text-xs text-[#0066cc]">
                        {book.price === 0
                          ? book.acceptsExchange
                            ? "1-for-1 Swap"
                            : "Free"
                          : `₹${book.price}`}
                      </span>
                      <Link
                        href={`/catalog/${book.id}`}
                        className="px-3 py-1.5 bg-[#C84200] !text-white text-[10px] font-black tracking-wider uppercase rounded-full hover:bg-[#A33500] transition-colors"
                      >
                        View Book
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
