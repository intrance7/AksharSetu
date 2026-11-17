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
  LIKE_NEW: {
    label: "Like New",
    dot: "#0A7D4F",
    badgeBg: "bg-emerald-50 border-emerald-200/70",
    badgeText: "text-emerald-800",
  },
  GOOD: {
    label: "Good",
    dot: "#1D4ED8",
    badgeBg: "bg-blue-50 border-blue-200/70",
    badgeText: "text-blue-800",
  },
  FAIR: {
    label: "Fair",
    dot: "#B45309",
    badgeBg: "bg-amber-50 border-amber-200/70",
    badgeText: "text-amber-800",
  },
  POOR: {
    label: "Readable",
    dot: "#C84200",
    badgeBg: "bg-orange-50 border-orange-200/70",
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
    ((book.owner?.booksSold ?? 0) + (book.owner?.successfulExchanges ?? 0) >= 1)
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

  if (variant === "list") {
    return (
      <article className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-[#1D1D1F]/10 shadow-[0_2px_12px_rgba(29,29,31,0.04)] hover:shadow-[0_12px_28px_rgba(29,29,31,0.09)] hover:border-[#C84200]/35 transition-all duration-200 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {/* Book Cover Thumbnail */}
        <Link
          href={`/catalog/${book.id}`}
          onClick={() => recordRecentlyViewedBook(book)}
          className="relative w-24 sm:w-28 aspect-[5/7] rounded-lg overflow-hidden shrink-0 shadow-md bg-[#FAF6F0] border border-black/5"
        >
          {hasCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.images[0]}
              alt={`${book.title} by ${book.author}`}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <GeneratedCover
              title={book.title}
              author={book.author}
              category={book.category}
            />
          )}
        </Link>

        {/* Middle Editorial Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#C84200] bg-[#C84200]/10 px-2.5 py-0.5 rounded-full">
              {book.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cond.badgeBg} ${cond.badgeText}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cond.dot }}
              />
              {cond.label} · {avgConditionScore}★
            </span>
            {isRecent && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#F2EBE1] text-[#1D1D1F] px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5 text-[#C84200]" /> New
              </span>
            )}
            {book.isBundle && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                <Package className="w-3 h-3" /> Bundle ({book.booksInBundle}{" "}
                Books)
              </span>
            )}
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#1D1D1F] tracking-tight leading-snug group-hover:text-[#C84200] transition-colors">
              <Link
                href={`/catalog/${book.id}`}
                onClick={() => recordRecentlyViewedBook(book)}
              >
                {book.title}
              </Link>
            </h3>
            <p className="text-sm font-semibold text-[#86868B]">
              by {book.author}
              {book.isbn ? (
                <span className="ml-2 text-xs font-mono text-[#86868B]/80">
                  · ISBN {book.isbn}
                </span>
              ) : null}
            </p>
          </div>

          {(book.university || book.course || book.semester) && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]/75">
              {book.university && (
                <span className="bg-[#FAF6F0] border border-black/10 px-2.5 py-0.5 rounded-md">
                  {book.university}
                </span>
              )}
              {book.course && (
                <span className="bg-[#FAF6F0] border border-black/10 px-2.5 py-0.5 rounded-md">
                  {book.course}
                </span>
              )}
              {book.semester && (
                <span className="bg-[#FAF6F0] border border-black/10 px-2.5 py-0.5 rounded-md">
                  Sem {book.semester}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#86868B] pt-1">
            <span className="inline-flex items-center gap-1 text-[#1D1D1F]/80 font-semibold">
              Seller: {book.owner?.name || "Community Reader"}
              {isVerifiedSeller && (
                <ShieldCheck
                  className="w-3.5 h-3.5 text-emerald-600"
                  aria-label="Verified Trusted Seller"
                />
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C84200]" /> {locationText}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#86868B]" />{" "}
              {formatDistanceToNow(new Date(book.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Right Price & Actions */}
        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-black/5 shrink-0">
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">
              {isDonation
                ? "Vidya Daan"
                : book.acceptsExchange && book.price === 0
                ? "Book Swap"
                : "Listing Price"}
            </div>
            <div
              className={`text-2xl font-black tracking-tight ${
                isDonation
                  ? "text-emerald-700"
                  : book.acceptsExchange && book.price === 0
                  ? "text-[#0066cc]"
                  : "text-[#1D1D1F]"
              }`}
            >
              {isDonation
                ? "Free"
                : book.acceptsExchange && book.price === 0
                ? "1-for-1 Swap"
                : `₹${book.price}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={savingWishlist}
              aria-label="Save to wishlist"
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                wishlisted
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-[#FAF6F0] border-black/10 text-[#1D1D1F] hover:border-[#C84200] hover:text-[#C84200]"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${wishlisted ? "fill-rose-600" : ""}`}
              />
            </button>
            <Link
              href={`/catalog/${book.id}`}
              onClick={() => recordRecentlyViewedBook(book)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] hover:bg-[#C84200] text-white text-xs font-bold transition-colors"
            >
              View Book <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="flex flex-col min-w-0 group relative h-full bg-white rounded-3xl p-5 border border-[#1D1D1F]/10 shadow-[0_4px_20px_rgba(29,29,31,0.05)] hover:shadow-[0_14px_34px_rgba(29,29,31,0.10)] hover:border-[#C84200]/30 transition-all duration-300">
      {/* Top Row: Condition Badge + Optional Status Pill + Working Wishlist Button */}
      <div className="flex items-center justify-between gap-2 mb-3 z-20">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cond.badgeBg} ${cond.badgeText}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: cond.dot }}
            />
            {cond.label} · {avgConditionScore}★
          </span>

          {isPopular ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              Popular
            </span>
          ) : isRecent ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F2EBE1] text-[#1D1D1F]">
              New
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={savingWishlist}
          aria-label="Save to wishlist"
          title="Save to Wishlist Radar"
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer z-30 ${
            wishlisted
              ? "bg-rose-50 border-rose-200 text-rose-600 scale-105"
              : "bg-[#FAF6F0] border-black/10 text-[#1D1D1F]/70 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-rose-600" : ""}`} />
        </button>
      </div>

      {/* Editorial Cover Stage */}
      <Link
        href={`/catalog/${book.id}`}
        onClick={() => recordRecentlyViewedBook(book)}
        className="relative grid place-items-center w-full aspect-[4/3.8] rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.06] mb-4 overflow-hidden"
      >
        <div className="relative z-10 w-[48%] aspect-[5/7] rounded-md overflow-hidden shadow-[12px_14px_28px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
          <div
            className="absolute inset-y-0 left-0 w-[10%] z-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.18) 85%, transparent)",
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

        {/* Bottom-left overlay pill for Bundle or Swap */}
        {book.isBundle && (
          <span className="absolute bottom-2.5 left-2.5 z-20 inline-flex items-center gap-1 bg-[#1D1D1F]/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
            <Package className="w-3 h-3 text-[#F4B22B]" /> Bundle:{" "}
            {book.booksInBundle} Books
          </span>
        )}
      </Link>

      {/* Book Metadata */}
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#C84200]">
            {book.category}
          </span>
          <div className="flex items-center gap-1.5">
            {(book.deliveryType === "MEETUP" ||
              book.deliveryType === "BOTH") && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60"
                title="Available for Campus/City Meetup"
              >
                <Handshake className="w-2.5 h-2.5" /> Meetup
              </span>
            )}
            {(book.deliveryType === "SHIPPING" ||
              book.deliveryType === "BOTH") && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1D1D1F]/70 bg-[#F2EBE1] px-2 py-0.5 rounded-md"
                title="Available for Courier Delivery"
              >
                <Truck className="w-2.5 h-2.5" /> Courier
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

        <p className="text-xs sm:text-sm font-semibold text-[#86868B] mt-0.5 line-clamp-1">
          {book.author}
        </p>

        {/* Academic Tag Row if present */}
        {(book.university || book.course || book.semester) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {book.university && (
              <span className="text-[11px] font-semibold bg-[#FAF6F0] text-[#1D1D1F]/80 px-2 py-0.5 rounded-md border border-black/5 truncate max-w-[160px]">
                {book.university}
              </span>
            )}
            {book.semester && (
              <span className="text-[11px] font-bold bg-[#FAF6F0] text-[#C84200] px-2 py-0.5 rounded-md border border-[#C84200]/15">
                Sem {book.semester}
              </span>
            )}
          </div>
        )}

        {/* Seller & Location Row */}
        <div className="mt-3 pt-3 border-t border-[#1D1D1F]/[0.06] space-y-1.5 text-xs text-[#86868B]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-[#1D1D1F]/80 truncate">
              {book.owner?.name || "Community Reader"}
              {isVerifiedSeller && (
                <ShieldCheck
                  className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                  aria-label="Verified Seller"
                />
              )}
            </span>
            {book.owner?.sellerRating ? (
              <span className="text-[11px] font-bold text-[#1D1D1F]/70 shrink-0">
                {book.owner.sellerRating.toFixed(1)}★
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-[#C84200] shrink-0" />{" "}
              {locationText}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-[#86868B]" />{" "}
              {formatDistanceToNow(new Date(book.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {/* Footer Row: Price + View Details Action */}
        <div className="mt-4 pt-3 border-t border-[#1D1D1F]/10 flex items-center justify-between gap-2">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
              {isDonation
                ? "Vidya Daan"
                : book.acceptsExchange && book.price === 0
                ? "Exchange"
                : book.acceptsExchange
                ? "Buy or Swap"
                : "Price"}
            </span>
            <span
              className={`text-xl font-black tracking-tight ${
                isDonation
                  ? "text-emerald-700"
                  : book.acceptsExchange && book.price === 0
                  ? "text-[#0066cc]"
                  : "text-[#1D1D1F]"
              }`}
            >
              {isDonation
                ? "Free"
                : book.acceptsExchange && book.price === 0
                ? "1-for-1 Swap"
                : `₹${book.price}`}
            </span>
          </div>

          <Link
            href={`/catalog/${book.id}`}
            onClick={() => recordRecentlyViewedBook(book)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] group-hover:bg-[#C84200] text-white text-xs font-bold transition-colors"
          >
            View Details <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
