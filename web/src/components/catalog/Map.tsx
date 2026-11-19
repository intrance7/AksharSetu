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
    <div className="w-full h-[380px] sm:h-[500px] md:h-[640px] rounded-2xl overflow-hidden shadow-xs border border-[#1D1D1F]/[0.06] relative z-0">
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

          const isDonation = book.price === 0 && !book.acceptsExchange
          const isSwap = book.price === 0 && book.acceptsExchange

          return (
            <Marker key={book.id} position={coords}>
              <Popup className="custom-popup border-0 p-0 shadow-lg rounded-2xl overflow-hidden">
                <div className="flex flex-col gap-2.5 w-[216px] sm:w-[230px]">
                  <div className="relative w-full h-32 bg-[#FAF6F0] rounded-xl overflow-hidden">
                    <PopupCover book={book} />
                  </div>
                  <div className="px-1 pb-1">
                    <h3 className="font-bold text-[#1D1D1F] text-sm leading-snug mb-0.5 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#6e6e73] line-clamp-1">
                      {book.author}
                    </p>
                    {book.owner?.location && (
                      <p className="text-xs font-medium text-[#6e6e73] mt-1 truncate">
                        {book.owner.location}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-[#1D1D1F]/[0.08]">
                      <span
                        className={`font-mono font-black text-sm ${
                          isDonation
                            ? "text-[#0A7D4F]"
                            : isSwap
                            ? "text-[#0066cc]"
                            : "text-[#C84200]"
                        }`}
                      >
                        {isDonation
                          ? "Free"
                          : isSwap
                          ? "1-for-1 Swap"
                          : `₹${book.price}`}
                      </span>
                      <Link
                        href={`/catalog/${book.id}`}
                        className="px-3.5 py-1.5 bg-[#1D1D1F] !text-white text-xs font-bold rounded-full hover:bg-[#C84200] transition-colors"
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
