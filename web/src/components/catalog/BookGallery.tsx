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
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] bg-gradient-to-b from-[#FAF6F0] via-[#F6EFE5] to-[#ECE2D4]/80 p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#1D1D1F]/[0.07] overflow-hidden">
      {/* Subtle Editorial Dot-Grid Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(#1D1D1F 1.25px, transparent 1.25px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Top Row: Photo Counter + Wishlist Button */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between gap-2 z-20">
        {validImages.length > 1 ? (
          <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#1D1D1F]/[0.08] font-mono text-xs font-bold text-[#1D1D1F]/80 shadow-xs">
            {activeIdx + 1} / {validImages.length}
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-[#1D1D1F]/[0.07] font-mono text-xs font-bold uppercase tracking-wider text-[#86868b]">
            Archival Plate
          </span>
        )}

        {showWishlist && (
          <button
            type="button"
            onClick={handleWishlist}
            disabled={savingWishlist}
            aria-label="Save to Wishlist Radar"
            title="Save to Wishlist Radar"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-bold transition-all cursor-pointer shadow-xs ${
              wishlisted
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-white/95 border-[#1D1D1F]/[0.08] text-[#1D1D1F] hover:border-rose-300 hover:text-rose-600"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${wishlisted ? "fill-rose-600" : ""}`}
            />
            <span>{wishlisted ? "Saved" : "Save"}</span>
          </button>
        )}
      </div>

      {/* Main 3D Editorial Book Pedestal */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full my-8">
        {/* Ambient Ground Shadow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 w-[62%] max-w-[240px] h-7 rounded-full bg-[#1D1D1F]/25 blur-lg"
        />

        <div className="relative w-[74%] max-w-[300px] aspect-[5/7] rounded-r-xl rounded-l-[4px] overflow-hidden shadow-[22px_28px_52px_rgba(29,29,31,0.28),4px_8px_18px_rgba(29,29,31,0.16)] border-r-[3px] border-white/75">
          {/* Realistic Spine Highlight & Crease */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[12%] z-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.08) 54%, rgba(255,255,255,0.26) 76%, rgba(0,0,0,0.08) 90%, transparent 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-black/15 via-transparent to-white/15"
          />

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
                  setActiveIdx(
                    (i) => (i - 1 + validImages.length) % validImages.length
                  )
                }
                aria-label="Previous photo"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#0B0B0D]/70 hover:bg-[#0B0B0D] text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIdx((i) => (i + 1) % validImages.length)
                }
                aria-label="Next photo"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#0B0B0D]/70 hover:bg-[#0B0B0D] text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Multi-photo Thumbnails */}
      {validImages.length > 1 && (
        <div className="relative z-10 flex items-center justify-center gap-2.5 mt-2 flex-wrap">
          {validImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`w-14 h-[74px] rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-xs ${
                idx === activeIdx
                  ? "border-[#C84200] shadow-md scale-105"
                  : "border-white/80 opacity-65 hover:opacity-100"
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
