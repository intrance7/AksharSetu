"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import Link from "next/link"
import Image from "next/image"

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

export default function Map({ books, userLocation }: { books: any[], userLocation?: { latitude: number | null, longitude: number | null } | null }) {
  // Center roughly around Mumbai or the user's location if available
  const center: [number, number] = userLocation?.latitude && userLocation?.longitude 
    ? [userLocation.latitude, userLocation.longitude] 
    : [19.0760, 72.8777]

  return (
    <div className="w-full h-[600px] md:h-[750px] rounded-3xl overflow-hidden shadow-sm border border-black/[0.04] relative z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {books.map((book) => {
          if (!book.owner?.latitude || !book.owner?.longitude) return null
          
          return (
            <Marker 
              key={book.id} 
              position={[book.owner.latitude, book.owner.longitude]}
            >
              <Popup className="custom-popup border-0 p-0 shadow-lg rounded-2xl overflow-hidden">
                <div className="flex flex-col gap-3 w-[220px]">
                   <div className="relative w-full h-36 bg-gray-100">
                     <Image 
                       src={book.images[0] || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"} 
                       alt={book.title}
                       fill
                       className="object-cover"
                     />
                   </div>
                   <div className="px-3 pb-3">
                     <h3 className="font-bold text-[#1d1d1f] text-base leading-tight mb-1">{book.title}</h3>
                     <p className="text-xs text-[#86868b] line-clamp-1">{book.author}</p>
                     
                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5">
                       <span className="font-bold text-[#0066cc]">
                         {book.price === 0 ? "Free" : `₹${book.price}`}
                       </span>
                       <Link 
                         href={`/checkout?bookId=${book.id}`}
                         className="px-3 py-1.5 bg-[#C84200] text-white text-[11px] font-black tracking-widest uppercase rounded-full hover:bg-[#A33500] transition-colors"
                       >
                         Request
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
