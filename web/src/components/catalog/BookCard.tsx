"use client"

import { useState } from "react"
import { Book } from "@prisma/client"
import Link from "next/link"
import {
  Heart,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Package,
  Handshake,
  Truck,
  Sparkles,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { GeneratedCover } from "./GeneratedCover"
import { calculateDistance } from "@/lib/utils"
import { toast } from "sonner"

export type CatalogBookWithOwner = Book & {
  owner?: {
    id?: string
    name?: string | null
    username?: string | null
    image?: string | null
    sellerRating?: number
    booksSold?: number
    successfulExchanges?: number
    latitude: number | null
    longitude: number | null
    location: string | null
  }
  _count?: {
    requests?: number
  }
}

interface BookCardProps {
  book: CatalogBookWithOwner
  userLocation?: { latitude: number | null; longitude: number | null } | null
  variant?: "grid" | "list"
}

const CONDITION_META: Record<
  string,
  { label: string; dot: string; badgeBg: string; badgeText: string }
> = {
  NEW: {
    label: "Brand New",
    dot: "#0A7D4F",
    badgeBg: "bg-[#0A7D4F]/10 border-[#0A7D4F]/20",
    badgeText: "text-[#0A7D4F]",
  },
  LIKE_NEW: {
    label: "Like New",
    dot: "#0A7D4F",
    badgeBg: "bg-[#0A7D4F]/10 border-[#0A7D4F]/20",
    badgeText: "text-[#0A7D4F]",
  },
  GOOD: {
    label: "Good",
    dot: "#0066cc",
    badgeBg: "bg-[#0066cc]/10 border-[#0066cc]/20",
    badgeText: "text-[#0066cc]",
  },
  FAIR: {
    label: "Fair",
    dot: "#B45309",
    badgeBg: "bg-amber-50 border-amber-200/80",
    badgeText: "text-amber-800",
  },
  POOR: {
    label: "Readable",
    dot: "#C84200",
    badgeBg: "bg-[#C84200]/10 border-[#C84200]/20",
    badgeText: "text-[#C84200]",
  },
}

export function recordRecentlyViewedBook(book: CatalogBookWithOwner) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem("aksharsetu_recent_books_v1")
    const prev: Array<{
      id: string
      title: string
      author: string
      price: number
      condition: string
      category: string
      image: string | null
      acceptsExchange: boolean
    }> = raw ? JSON.parse(raw) : []

    const entry = {
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      condition: book.condition,
      category: book.category,
      image: book.images?.[0] || null,
      acceptsExchange: book.acceptsExchange,
    }

    const next = [entry, ...prev.filter((item) => item.id !== book.id)].slice(
      0,
      8
    )
    localStorage.setItem("aksharsetu_recent_books_v1", JSON.stringify(next))
  } catch {}
}

export function BookCard({
  book,
  userLocation,
  variant = "grid",
}: BookCardProps) {
  const [imgError, setImgError] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)

  const hasCover = Boolean(book.images && book.images.length > 0 && !imgError)
  const isDonation = book.price === 0 && !book.acceptsExchange
  const isSwapOnly = book.acceptsExchange && book.price === 0
  const cond = CONDITION_META[book.condition] || CONDITION_META.GOOD

  // Compute 5-point condition average from real listing grading
  const avgConditionScore = (
    ((book.condCover || 5) +
      (book.condPages || 5) +
      (book.condHighlighting || 5) +
      (book.condNotes || 5) +
      (book.condBinding || 5)) /
    5
  ).toFixed(1)

  // Distance / Location logic
  let locationText = book.owner?.location || "India"
  if (
    userLocation?.latitude &&
    userLocation?.longitude &&
    book.owner?.latitude &&
    book.owner?.longitude
  ) {
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      book.owner.latitude,
      book.owner.longitude
    )
    locationText = `${dist.toFixed(1)} km away`
  }

  const isRecent =
    Date.now() - new Date(book.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
  const isVerifiedSeller =
    (book.owner?.sellerRating ?? 5) >= 4.7 &&
    (book.owner?.booksSold ?? 0) + (book.owner?.successfulExchanges ?? 0) >= 1
  const isPopular = (book._count?.requests ?? 0) >= 2

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (savingWishlist) return

    setSavingWishlist(true)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.title,
          isbn: book.isbn || undefined,
        }),
      })
      if (res.ok) {
        setWishlisted(true)
        toast.success(`Saved "${book.title}" to your Wishlist Radar`)
      } else if (res.status === 401) {
        toast.error("Please sign in to save books to your Wishlist Radar")
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === "Already in wishlist") {
          setWishlisted(true)
          toast.info(`"${book.title}" is already in your Wishlist Radar`)
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

  const pricePillClass = isDonation
    ? "bg-[#0A7D4F]/10 text-[#0A7D4F] border-[#0A7D4F]/20"
    : isSwapOnly
    ? "bg-[#0066cc]/10 text-[#0066cc] border-[#0066cc]/20"
    : "bg-[#C84200]/10 text-[#C84200] border-[#C84200]/20"

  const priceDisplay = isDonation
    ? "Free"
    : isSwapOnly
    ? "1-for-1 Swap"
    : `₹${book.price}`

  if (variant === "list") {
    return (
      <article className="group relative bg-white rounded-3xl p-5 sm:p-6 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.04)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgba(29,29,31,0.12)] hover:border-[#C84200]/30 transition-all duration-300 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start sm:items-center">
        {/* Warm Parchment Book Cover Pedestal */}
        <Link
          href={`/catalog/${book.id}`}
          onClick={() => recordRecentlyViewedBook(book)}
          className="relative w-full sm:w-36 h-48 sm:h-44 rounded-2xl bg-gradient-to-b from-[#FAF6F0] to-[#EFE7DC]/75 border border-[#1D1D1F]/[0.05] grid place-items-center shrink-0 overflow-hidden"
        >
          <div className="relative w-24 sm:w-[92px] aspect-[5/7] rounded-r-md rounded-l-[2px] overflow-hidden shadow-[10px_14px_24px_rgba(29,29,31,0.22),2px_4px_10px_rgba(29,29,31,0.12)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] border-r border-white/60">
            <div
              className="absolute inset-y-0 left-0 w-[13%] z-20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.08) 55%, rgba(255,255,255,0.24) 78%, transparent 100%)",
              }}
            />
            {hasCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.images[0]}
                alt={`${book.title} by ${book.author}`}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <GeneratedCover
                title={book.title}
                author={book.author}
                category={book.category}
              />
            )}
          </div>
        </Link>

        {/* Middle Editorial Details */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C84200] bg-[#C84200]/[0.09] px-3 py-1 rounded-full">
              {book.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cond.badgeBg} ${cond.badgeText}`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cond.dot }}
              />
              <span>{cond.label}</span>
              <span className="font-mono opacity-85">· {avgConditionScore}★</span>
            </span>
            {isRecent && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#FAF6F0] border border-[#1D1D1F]/[0.08] text-[#1D1D1F] px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-[#C84200]" /> New
              </span>
            )}
            {book.isBundle && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#1D1D1F] text-white px-3 py-1 rounded-full">
                <Package className="w-3.5 h-3.5 text-[#FF7F45]" /> Pack ·{" "}
                <span className="font-mono">{book.booksInBundle}</span>
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-black text-[#1D1D1F] tracking-tight leading-snug group-hover:text-[#C84200] transition-colors">
              <Link
                href={`/catalog/${book.id}`}
                onClick={() => recordRecentlyViewedBook(book)}
              >
                {book.title}
              </Link>
            </h3>
            <p className="text-sm font-medium text-[#6e6e73] mt-0.5">
              by <span className="text-[#1D1D1F]/80 font-semibold">{book.author}</span>
              {book.isbn ? (
                <span className="ml-2 text-xs font-mono text-[#86868b]">
                  · ISBN {book.isbn}
                </span>
              ) : null}
            </p>
          </div>

          {(book.university || book.course || book.semester) && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1D1D1F]/80">
              {book.university && (
                <span className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] px-3 py-1 rounded-full">
                  {book.university}
                </span>
              )}
              {book.course && (
                <span className="bg-[#FAF6F0] border border-[#1D1D1F]/[0.07] px-3 py-1 rounded-full">
                  {book.course}
                </span>
              )}
              {book.semester && (
                <span className="bg-[#FAF6F0] border border-[#C84200]/20 text-[#C84200] font-mono px-3 py-1 rounded-full">
                  Sem {book.semester}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-[#86868b] pt-1">
            <span className="inline-flex items-center gap-1.5 text-[#1D1D1F]/85 font-semibold">
              {book.owner?.name || "Community Reader"}
              {isVerifiedSeller && (
                <ShieldCheck
                  className="w-4 h-4 text-[#0A7D4F]"
                  aria-label="Verified Trusted Seller"
                />
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C84200]" /> {locationText}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#86868b]" />{" "}
              {formatDistanceToNow(new Date(book.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Right Editorial Price Pill & Actions */}
        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#1D1D1F]/[0.07] shrink-0">
          <div className="text-left sm:text-right">
            <span className="block text-xs font-semibold text-[#86868b] mb-1">
              {isDonation
                ? "Vidya Daan"
                : isSwapOnly
                ? "Book Exchange"
                : book.acceptsExchange
                ? "Buy or Swap"
                : "Resale Price"}
            </span>
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-full border font-mono text-lg font-black tracking-tight ${pricePillClass}`}
            >
              {priceDisplay}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={savingWishlist}
              aria-label="Save to wishlist"
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                wishlisted
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-[#FAF6F0] border-[#1D1D1F]/[0.08] text-[#1D1D1F] hover:border-rose-300 hover:text-rose-600"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${wishlisted ? "fill-rose-600" : ""}`}
              />
            </button>
            <Link
              href={`/catalog/${book.id}`}
              onClick={() => recordRecentlyViewedBook(book)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-[#C84200] text-white text-[13px] font-bold transition-colors"
            >
              Inspect <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex flex-col min-w-0 group relative h-full bg-white rounded-3xl p-4 sm:p-5 border border-[#1D1D1F]/[0.07] shadow-[0_4px_20px_rgba(29,29,31,0.04)] hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-14px_rgba(29,29,31,0.14)] hover:border-[#C84200]/30 transition-all duration-300">
      {/* Warm Parchment Cover Pedestal */}
      <div className="relative w-full aspect-[4/3.65] rounded-2xl bg-gradient-to-b from-[#FAF6F0] to-[#EFE7DC]/75 border border-[#1D1D1F]/[0.05] mb-4 overflow-hidden">
        {/* Subtle Pedestal Ambient Floor Shadow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 w-[56%] h-5 rounded-full bg-[#1D1D1F]/20 blur-md transition-all duration-300 group-hover:w-[62%] group-hover:opacity-80"
        />

        {/* Floating Top-Left Condition Dot Pill */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 max-w-[calc(100%-56px)]">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs border shadow-[0_2px_8px_rgba(29,29,31,0.06)] ${cond.badgeText} border-[#1D1D1F]/[0.07] truncate`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cond.dot }}
            />
            <span className="truncate">{cond.label}</span>
            <span className="font-mono text-[#1D1D1F]/65 shrink-0">
              {avgConditionScore}★
            </span>
          </span>
        </div>

        {/* Floating Top-Right Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={savingWishlist}
          aria-label="Save to wishlist"
          title="Save to Wishlist Radar"
          className={`absolute top-3 right-3 z-30 w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-[0_2px_8px_rgba(29,29,31,0.06)] ${
            wishlisted
              ? "bg-rose-50 border-rose-200 text-rose-600 scale-105"
              : "bg-white/95 border-[#1D1D1F]/[0.08] text-[#1D1D1F]/70 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-rose-600" : ""}`} />
        </button>

        {/* Centered 3D Tactile Book Cover */}
        <Link
          href={`/catalog/${book.id}`}
          onClick={() => recordRecentlyViewedBook(book)}
          className="absolute inset-0 grid place-items-center pt-5 pb-3"
        >
          <div className="relative z-10 w-[47%] aspect-[5/7] rounded-r-lg rounded-l-[3px] overflow-hidden shadow-[14px_18px_32px_rgba(29,29,31,0.26),3px_6px_12px_rgba(29,29,31,0.14)] border-r-[2px] border-white/65 transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.03]">
            {/* Realistic Book Spine Crease & Specular Lighting */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[13%] z-20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.08) 54%, rgba(255,255,255,0.28) 76%, rgba(0,0,0,0.08) 90%, transparent 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-black/15 via-transparent to-white/15"
            />
            {hasCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.images[0]}
                alt={`${book.title} by ${book.author}`}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <GeneratedCover
                title={book.title}
                author={book.author}
                category={book.category}
              />
            )}
          </div>
        </Link>

        {/* Subtle Bottom-Left Status / Bundle Pill */}
        {book.isBundle ? (
          <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 bg-[#1D1D1F]/92 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Package className="w-3.5 h-3.5 text-[#FF7F45]" />
            <span>
              Pack · <span className="font-mono">{book.booksInBundle}</span>
            </span>
          </span>
        ) : isPopular ? (
          <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1 bg-white/95 border border-amber-300/70 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs">
            Popular
          </span>
        ) : isRecent ? (
          <span className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1 bg-white/95 border border-[#1D1D1F]/[0.08] text-[#1D1D1F] px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs">
            <Sparkles className="w-3 h-3 text-[#C84200]" /> Fresh
          </span>
        ) : null}
      </div>

      {/* Editorial Book Metadata */}
      <div className="flex flex-col flex-1 px-0.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C84200] truncate">
            {book.category}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {(book.deliveryType === "MEETUP" ||
              book.deliveryType === "BOTH") && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A7D4F] bg-[#0A7D4F]/[0.09] px-2 py-0.5 rounded-full"
                title="Available for Campus/City Meetup"
              >
                <Handshake className="w-3 h-3" /> Meetup
              </span>
            )}
            {(book.deliveryType === "SHIPPING" ||
              book.deliveryType === "BOTH") && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D1D1F]/70 bg-[#FAF6F0] px-2 py-0.5 rounded-full border border-[#1D1D1F]/[0.06]"
                title="Available for Courier Delivery"
              >
                <Truck className="w-3 h-3" /> Courier
              </span>
            )}
          </div>
        </div>

        <h3
          title={book.title}
          className="font-black text-lg leading-snug tracking-tight text-[#1D1D1F] line-clamp-2 group-hover:text-[#C84200] transition-colors"
        >
          <Link
            href={`/catalog/${book.id}`}
            onClick={() => recordRecentlyViewedBook(book)}
          >
            {book.title}
          </Link>
        </h3>

        <p className="text-sm font-medium text-[#6e6e73] mt-1 line-clamp-1">
          {book.author}
        </p>

        {/* Academic Tag Row if present */}
        {(book.university || book.semester) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {book.university && (
              <span className="text-xs font-semibold bg-[#FAF6F0] text-[#1D1D1F]/80 px-2.5 py-0.5 rounded-full border border-[#1D1D1F]/[0.07] truncate max-w-[170px]">
                {book.university}
              </span>
            )}
            {book.semester && (
              <span className="text-xs font-mono font-bold bg-[#FAF6F0] text-[#C84200] px-2.5 py-0.5 rounded-full border border-[#C84200]/20">
                Sem {book.semester}
              </span>
            )}
          </div>
        )}

        {/* Seller Trust & Location Row */}
        <div className="mt-3.5 pt-3 border-t border-[#1D1D1F]/[0.07] space-y-1.5 text-xs text-[#6e6e73]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1D1D1F]/85 truncate">
              <span className="truncate">
                {book.owner?.name || "Community Reader"}
              </span>
              {isVerifiedSeller && (
                <ShieldCheck
                  className="w-4 h-4 text-[#0A7D4F] shrink-0"
                  aria-label="Verified Seller"
                />
              )}
            </span>
            {book.owner?.sellerRating ? (
              <span className="font-mono text-xs font-bold text-[#1D1D1F]/75 shrink-0">
                {book.owner.sellerRating.toFixed(1)}★
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#C84200] shrink-0" />
              <span className="truncate">{locationText}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 text-[#86868b]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {formatDistanceToNow(new Date(book.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Footer Row: Prominent Editorial Price Pill + Action */}
        <div className="mt-auto pt-4">
          <div className="pt-3.5 border-t border-[#1D1D1F]/[0.08] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`inline-flex items-center px-3.5 py-1.5 rounded-full border font-mono text-sm sm:text-[15px] font-black tracking-tight whitespace-nowrap ${pricePillClass}`}
              >
                {priceDisplay}
              </span>
              {!isDonation && !isSwapOnly && book.acceptsExchange && (
                <span className="text-xs font-semibold text-[#0066cc] truncate hidden xl:inline">
                  + Swap
                </span>
              )}
            </div>

            <Link
              href={`/catalog/${book.id}`}
              onClick={() => recordRecentlyViewedBook(book)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#1D1D1F] group-hover:bg-[#C84200] text-white text-xs sm:text-[13px] font-bold transition-colors shrink-0"
            >
              View <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
