"use client"

import { useState } from "react"
import { Heart, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { GeneratedCover } from "./GeneratedCover"

interface BookGalleryProps {
  images: string[]
  title: string
  author: string
  category: string
  isbn?: string | null
  showWishlist?: boolean
}

export function BookGallery({
  images,
  title,
  author,
  category,
  isbn,
  showWishlist = true,
}: BookGalleryProps) {
  const validImages = (images || []).filter((src) => Boolean(src && src.trim()))
  const [activeIdx, setActiveIdx] = useState(0)
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({})
  const [wishlisted, setWishlisted] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)

  const currentSrc = validImages[activeIdx]
  const hasWorkingImage = Boolean(currentSrc && !failedUrls[currentSrc])

  const handleWishlist = async () => {
    if (savingWishlist) return
    setSavingWishlist(true)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          isbn: isbn || undefined,
        }),
      })
      if (res.ok) {
        setWishlisted(true)
        toast.success(`Saved "${title}" to your Wishlist Radar`)
      } else if (res.status === 401) {
        toast.error("Please sign in to save books to your Wishlist Radar")
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === "Already in wishlist") {
          setWishlisted(true)
          toast.info(`"${title}" is already in your Wishlist Radar`)
        } else {
          toast.error(data.error || "Could not add to wishlist")
        }
      }
    } catch {
      toast.error("Network error while saving to wishlist")
    } finally {
      setSavingWishlist(false)
    }
  }

  return (
    <div className="relative w-full h-full bg-[#FAF6F0] p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#1D1D1F]/[0.08]">
      {showWishlist && (
        <button
          type="button"
          onClick={handleWishlist}
          disabled={savingWishlist}
          aria-label="Save to Wishlist Radar"
          title="Save to Wishlist Radar"
          className={`absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer z-20 ${
            wishlisted
              ? "bg-rose-50 border-rose-200 text-rose-600"
              : "bg-white/95 border-black/10 text-[#1D1D1F] hover:border-rose-200 hover:text-rose-600 shadow-xs"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${wishlisted ? "fill-rose-600" : ""}`} />
          <span>{wishlisted ? "Saved" : "Save"}</span>
        </button>
      )}

      {/* Main Cover Frame */}
      <div className="relative w-[72%] max-w-[280px] aspect-[5/7] rounded-lg overflow-hidden shadow-[18px_22px_44px_rgba(0,0,0,0.22)] my-4">
        {hasWorkingImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentSrc}
            alt={`${title} by ${author}`}
            onError={() =>
              setFailedUrls((prev) => ({ ...prev, [currentSrc]: true }))
            }
            className="w-full h-full object-cover"
          />
        ) : (
          <GeneratedCover title={title} author={author} category={category} />
        )}

        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setActiveIdx((i) => (i - 1 + validImages.length) % validImages.length)
              }
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((i) => (i + 1) % validImages.length)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Multi-photo Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {validImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`w-12 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                idx === activeIdx
                  ? "border-[#C84200] shadow-sm scale-105"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${title} view ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
