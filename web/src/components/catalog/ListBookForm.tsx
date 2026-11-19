"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Loader2,
  BookOpen,
  AlertCircle,
  Image as ImageIcon,
  ScanBarcode,
  Heart,
  Lock,
  PenLine,
  Calculator,
  Check,
  MapPin,
  Navigation,
  CheckCircle2,
  HeartHandshake,
  Truck,
  Handshake,
  Layers,
  Tag,
  ArrowLeftRight,
  Gift,
} from "lucide-react"
import { createBook } from "@/app/actions/book"
import { IsbnCameraScanner } from "./IsbnCameraScanner"
import { GeneratedCover } from "./GeneratedCover"
import { PixelMascot } from "./PixelMascot"

const CONDITION_DIMENSIONS = [
  { key: "condCover", label: "Cover & Dust Jacket" },
  { key: "condPages", label: "Crispness of Pages" },
  { key: "condHighlighting", label: "Free of Highlighting" },
  { key: "condNotes", label: "Clean Margins" },
  { key: "condBinding", label: "Spine & Binding" },
] as const

type InitialLocation = {
  latitude: number | null
  longitude: number | null
  location?: string
}

type InitialCampaign = {
  id: string
  title: string
  ngoName: string
} | null

const INPUT_CLASS =
  "w-full bg-[#FAF6F0] border border-[#1D1D1F]/10 focus:border-[#C84200]/45 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder:text-[#86868b]/70"

export function ListBookForm({
  initialLocation,
  initialCampaign = null,
  initialType,
}: {
  initialLocation?: InitialLocation
  initialCampaign?: InitialCampaign
  initialType?: "DONATE" | "SELL" | "EXCHANGE"
}) {
  const [isbn, setIsbn] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false)
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false)
  const [previewImgError, setPreviewImgError] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(
    initialLocation?.latitude ?? null
  )
  const [longitude, setLongitude] = useState<number | null>(
    initialLocation?.longitude ?? null
  )
  const [locationName, setLocationName] = useState<string>(
    initialLocation?.location ?? ""
  )
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState("")
  const locationCardRef = useRef<HTMLDivElement>(null)
  const [priceEstimate, setPriceEstimate] = useState<{
    suggestedPrice: number
    minPrice: number
    maxPrice: number
    integrityPct: number
    gradeLabel: string
    insight: string
  } | null>(null)

  const [showScanner, setShowScanner] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    imageUrl: "",
    category: "fiction",
    condition: "LIKE_NEW",
    listingType: initialType || "DONATE", // DONATE, SELL, EXCHANGE
    price: "0",
    university: "",
    course: "",
    semester: "",
    subject: "",
    exchangePreferences: "",
    condCover: 5,
    condPages: 5,
    condHighlighting: 5,
    condNotes: 5,
    condBinding: 5,
    deliveryType: "BOTH",
    isBundle: false,
    booksInBundle: 1,
    bundleDescription: "",
  })

  // Pre-enable bundle mode if arriving from /campus?bundle=true
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("bundle") === "true") {
      setFormData((prev) => ({
        ...prev,
        isBundle: true,
        booksInBundle: 4,
        listingType: "SELL",
        category: "engineering",
      }))
    }
  }, [])

  const updateDimensionScore = (
    key: (typeof CONDITION_DIMENSIONS)[number]["key"],
    score: number
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: score }
      const avg =
        (next.condCover +
          next.condPages +
          next.condHighlighting +
          next.condNotes +
          next.condBinding) /
        5
      const derivedCondition =
        avg >= 4.8
          ? "NEW"
          : avg >= 4.1
            ? "LIKE_NEW"
            : avg >= 3.2
              ? "GOOD"
              : avg >= 2.2
                ? "FAIR"
                : "POOR"
      return { ...next, condition: derivedCondition }
    })
    setPriceEstimate(null)
  }

  const fetchBookData = async (isbnToFetch?: string) => {
    const targetIsbn = isbnToFetch || isbn
    if (!targetIsbn.trim()) {
      setError("Enter a 10- or 13-digit ISBN first.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const cleanIsbn = targetIsbn.replace(/[- ]/g, "")
      let vol = null

      try {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`
        )
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          const volumeInfo = data.items[0].volumeInfo
          let coverUrl = ""
          if (volumeInfo.imageLinks) {
            coverUrl =
              volumeInfo.imageLinks.thumbnail ||
              volumeInfo.imageLinks.smallThumbnail ||
              ""
            coverUrl = coverUrl
              .replace("zoom=1", "zoom=0")
              .replace("&edge=curl", "")
              .replace("http://", "https://")
          }
          vol = {
            title: volumeInfo.title || "",
            author: volumeInfo.authors ? volumeInfo.authors.join(", ") : "",
            description: volumeInfo.description || "",
            imageUrl: coverUrl,
            category:
              volumeInfo.categories &&
              volumeInfo.categories[0].toLowerCase().includes("science")
                ? "engineering"
                : "fiction",
          }
        }
      } catch {}

      if (!vol) {
        try {
          const olRes = await fetch(
            `https://openlibrary.org/search.json?isbn=${cleanIsbn}`
          )
          const olData = await olRes.json()
          if (olData.docs && olData.docs.length > 0) {
            const bookData = olData.docs[0]
            let description = ""
            if (bookData.key) {
              try {
                const detailRes = await fetch(
                  `https://openlibrary.org${bookData.key}.json`
                )
                const detailData = await detailRes.json()
                if (detailData.description) {
                  description =
                    typeof detailData.description === "string"
                      ? detailData.description
                      : detailData.description.value || ""
                }
              } catch {}
            }
            vol = {
              title: bookData.title,
              author: bookData.author_name
                ? bookData.author_name.join(", ")
                : "",
              description,
              imageUrl: bookData.cover_i
                ? `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg`
                : "",
              category: "other",
            }
          }
        } catch {}
      }

      if (vol) {
        setPreviewImgError(false)
        setFormData((prev) => ({
          ...prev,
          title: vol.title || prev.title,
          author: vol.author || prev.author,
          description: (vol.description || prev.description).slice(0, 500),
          imageUrl: vol.imageUrl || prev.imageUrl,
          category: vol.category || prev.category,
        }))
      } else {
        setError(
          "No edition matched that ISBN. Enter the title and author below."
        )
      }
    } catch {
      setError("Could not reach the ISBN lookup right now. Enter details below.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    setError("")
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload initialization failed")

      const putRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error("Failed to store uploaded cover")
      const putData = await putRes.json().catch(() => null)

      setPreviewImgError(false)
      setFormData((prev) => ({
        ...prev,
        imageUrl: putData?.publicUrl || data.publicUrl,
      }))
    } catch (err: any) {
      console.error("Upload failed", err)
      setError(err?.message || "Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const generateDescription = async () => {
    if (!formData.title) {
      setError("Add a book title first so we can draft reader notes.")
      return
    }
    setIsGeneratingDesc(true)
    setError("")
    try {
      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          category: formData.category,
          condition: formData.condition,
        }),
      })
      const data = await res.json()
      if (data.description) {
        setFormData((prev) => ({
          ...prev,
          description: data.description.slice(0, 500),
        }))
      } else if (data.error) {
        setError(data.error)
      }
    } catch {
      setError("Could not draft reader notes right now.")
    } finally {
      setIsGeneratingDesc(false)
    }
  }

  const runSmartPriceEstimate = async () => {
    setIsEstimatingPrice(true)
    setError("")
    try {
      const res = await fetch("/api/ai/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          category: formData.category,
          condition: formData.condition,
          isBundle: formData.isBundle,
          booksInBundle: formData.booksInBundle,
          condCover: formData.condCover,
          condPages: formData.condPages,
          condHighlighting: formData.condHighlighting,
          condNotes: formData.condNotes,
          condBinding: formData.condBinding,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not estimate price")
      setPriceEstimate(data)
      if (!formData.price || formData.price === "0") {
        setFormData((prev) => ({
          ...prev,
          price: String(data.suggestedPrice),
        }))
      }
    } catch (err: any) {
      setError(err?.message || "Could not estimate resale price")
    } finally {
      setIsEstimatingPrice(false)
    }
  }

  const requestLocationAccess = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.")
      return
    }
    setIsLocating(true)
    setLocationError("")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lng)
        setError("")

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
          if (res.ok) {
            const data = await res.json()
            const addr = data?.address || {}
            const label = [
              addr.suburb || addr.neighbourhood || addr.road,
              addr.city || addr.town || addr.village || addr.state_district,
              addr.state,
            ]
              .filter(Boolean)
              .slice(0, 2)
              .join(", ")
            if (label) setLocationName(label)
          }
        } catch {}

        setIsLocating(false)
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access in your browser to pin this book on the map."
            : "Could not detect your location. Please try again."
        )
        setIsLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Consistent Randomization for Doodles based on title or isbn
  const seedString = formData.title || isbn || "new-book"
  const hash = seedString
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(hash + seed) * 10000
    return x - Math.floor(x)
  }

  const doodles = [
    "doodle-star.png",
    "doodle-smile.png",
    "doodle-heart.png",
    "doodle-bulb.png",
    "doodle-flower.png",
    "doodle-lightning.png",
    "doodle-cloud.png",
    "doodle-leaf.png",
  ]

  const doodleTop1 = doodles[hash % doodles.length]
  const doodleTop2 = doodles[(hash + 1) % doodles.length]
  const top1Top = (5 + pseudoRandom(1) * 20).toFixed(2)
  const top1Right = (-2 + pseudoRandom(2) * 5).toFixed(2)
  const top2Top = (50 + pseudoRandom(3) * 20).toFixed(2)
  const top2Left = (5 + pseudoRandom(4) * 15).toFixed(2)

  const doodleCard1 = doodles[(hash + 2) % doodles.length]
  const doodleCard2 = doodles[(hash + 3) % doodles.length]

  const card1Top = (10 + pseudoRandom(5) * 30).toFixed(2)
  const card1Left = (-6 + pseudoRandom(6) * 10).toFixed(2)
  const card1Rot = (-30 + pseudoRandom(7) * 60).toFixed(2)
  const card1Size = (14 + pseudoRandom(8) * 8).toFixed(2)

  const card2Top = (40 + pseudoRandom(9) * 40).toFixed(2)
  const card2Right = (-6 + pseudoRandom(10) * 10).toFixed(2)
  const card2Rot = (-30 + pseudoRandom(11) * 60).toFixed(2)
  const card2Size = (16 + pseudoRandom(12) * 10).toFixed(2)

  const integrityPct = Math.round(
    ((formData.condCover +
      formData.condPages +
      formData.condHighlighting +
      formData.condNotes +
      formData.condBinding) /
      25) *
      100
  )

  return (
    <div className="w-full">
      {initialCampaign && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                Vidya Daan Classroom Pledge
              </p>
              <h2 className="text-base font-black text-[#1D1D1F] leading-snug">
                {initialCampaign.title}
              </h2>
              <p className="text-xs font-medium text-[#1D1D1F]/70">
                Partner NGO: <strong>{initialCampaign.ngoName}</strong> ·
                Includes a verifiable 6-stage chain-of-custody tracking ID.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 01: INSTANT ISBN SCAN */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-3xl p-6 md:p-7 shadow-[0_10px_34px_rgb(0,0,0,0.05)] border border-[#1D1D1F]/[0.07] mb-6 relative overflow-hidden isolate"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/${doodleTop1}`}
          className="absolute opacity-25 pointer-events-none mix-blend-multiply z-0"
          style={{
            top: `${top1Top}%`,
            right: `${top1Right}%`,
            transform: "rotate(12deg)",
            width: "9rem",
            height: "9rem",
          }}
          alt=""
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/${doodleTop2}`}
          className="absolute opacity-30 pointer-events-none mix-blend-multiply z-0"
          style={{
            top: `${top2Top}%`,
            left: `${top2Left}%`,
            transform: "rotate(-12deg)",
            width: "4rem",
            height: "4rem",
          }}
          alt=""
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF5E6] border border-[#C84200]/15 text-[#C84200] flex items-center justify-center shrink-0">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#C84200]/10 text-[#C84200] text-[10px] font-black uppercase tracking-[0.18em] mb-1.5">
                01 · INSTANT ISBN SCAN
              </span>
              <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight leading-snug">
                Pull edition metadata in one tap
              </h2>
              <p className="text-[#86868b] text-sm font-medium mt-0.5 max-w-xl">
                Scan the barcode or type the 13-digit ISBN — we&apos;ll pull the
                title, author, and cover automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider border transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              showScanner
                ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                : "bg-[#FAF6F0] text-[#1D1D1F] border-[#1D1D1F]/15 hover:bg-white hover:border-[#C84200]/40 hover:text-[#C84200]"
            }`}
          >
            <ScanBarcode className="w-4 h-4" />
            {showScanner ? "Close Camera" : "Scan Barcode"}
          </button>
        </div>

        <AnimatePresence>
          {showScanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-5 relative z-10"
            >
              <IsbnCameraScanner
                onScan={(cleanIsbn) => {
                  setShowScanner(false)
                  setIsbn(cleanIsbn)
                  fetchBookData(cleanIsbn)
                }}
                onClose={() => setShowScanner(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 9780131103627 (back cover barcode)"
              className="w-full bg-[#FAF6F0] border border-[#1D1D1F]/10 focus:border-[#C84200]/45 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-full pl-11 pr-4 py-3 text-sm text-[#1D1D1F] font-medium outline-none transition-all placeholder:text-[#86868b]/70"
              onKeyDown={(e) => e.key === "Enter" && fetchBookData()}
            />
          </div>
          <button
            type="button"
            onClick={() => fetchBookData()}
            disabled={isLoading}
            className="bg-[#C84200] text-white px-7 py-3 rounded-full font-black uppercase tracking-wider text-xs hover:bg-[#A33500] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Fetch Edition →"
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200/70 flex items-center gap-2 text-red-700 text-xs font-semibold relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </motion.div>

      {/* STAGE 02 & STAGE 03 FORM + STICKY PREVIEW */}
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        action={async (form) => {
          if (
            formData.listingType === "SELL" &&
            (latitude === null || longitude === null)
          ) {
            const msg =
              "Location access is required to post a book for sale and pin it on the campus map."
            setLocationError(msg)
            setError(msg)
            locationCardRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
            return
          }

          setIsSubmitting(true)
          setError("")
          form.set("isDonation", (formData.listingType === "DONATE").toString())
          if (initialCampaign?.id && formData.listingType === "DONATE") {
            form.set("campaignId", initialCampaign.id)
          }
          form.set(
            "acceptsExchange",
            (formData.listingType === "EXCHANGE").toString()
          )
          form.set("imageUrl", formData.imageUrl)

          form.set("condCover", formData.condCover.toString())
          form.set("condPages", formData.condPages.toString())
          form.set("condHighlighting", formData.condHighlighting.toString())
          form.set("condNotes", formData.condNotes.toString())
          form.set("condBinding", formData.condBinding.toString())
          form.set("deliveryType", formData.deliveryType)
          form.set("isBundle", formData.isBundle.toString())
          form.set("booksInBundle", formData.booksInBundle.toString())
          form.set("bundleDescription", formData.bundleDescription)
          if (latitude !== null && longitude !== null) {
            form.set("latitude", String(latitude))
            form.set("longitude", String(longitude))
          }
          if (locationName.trim()) {
            form.set("location", locationName.trim())
          }

          try {
            await createBook(form)
          } catch (err: any) {
            if (err?.digest?.startsWith("NEXT_REDIRECT")) {
              throw err
            }
            setError(
              err?.message ||
                "Failed to list the book. Please check all fields and try again."
            )
            setIsSubmitting(false)
          }
        }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        <input type="hidden" name="isbn" value={isbn} />

        {/* Left Column: Stage 02 + Stage 03 Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* STAGE 02: EDITION & CONDITION */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_10px_34px_rgb(0,0,0,0.05)] border border-[#1D1D1F]/[0.07]">
            <div className="flex items-start gap-3.5 pb-6 mb-7 border-b border-[#1D1D1F]/[0.07]">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF5E6] border border-[#C84200]/15 text-[#C84200] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#1D1D1F]/[0.06] text-[#1D1D1F] text-[10px] font-black uppercase tracking-[0.18em] mb-1.5">
                  02 · EDITION &amp; CONDITION
                </span>
                <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight leading-snug">
                  Book Details &amp; Condition Grade
                </h2>
                <p className="text-[#86868b] text-sm font-medium mt-0.5">
                  Honest details help fellow students pick the right edition.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Introduction to Algorithms (CLRS)"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-2">
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  required
                  value={formData.author}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, author: e.target.value }))
                  }
                  placeholder="e.g. Cormen, Leiserson, Rivest"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="mb-8 relative">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <label className="block text-xs font-bold text-[#1D1D1F]">
                  Reader Notes &amp; Edition Details
                </label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={isGeneratingDesc || !formData.title}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066cc]/8 hover:bg-[#0066cc]/15 text-xs font-bold text-[#0066cc] disabled:opacity-45 transition-colors cursor-pointer"
                >
                  {isGeneratingDesc ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PenLine className="w-3.5 h-3.5" />
                  )}
                  Draft Reader Notes
                </button>
              </div>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                maxLength={500}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Mention edition year, whether solved PYQs or margin notes are inside, or why you enjoyed this copy..."
                className={`${INPUT_CLASS} resize-none`}
              />
              <div className="flex justify-end mt-1.5 text-[11px] font-bold text-[#86868b]">
                {formData.description.length}/500
              </div>
            </div>

            {/* Semester Pack Toggle */}
            <div className="mb-7 p-5 bg-[#FAF6F0] rounded-2xl border border-[#1D1D1F]/[0.08]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-black/5 text-[#C84200] flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#1D1D1F]">
                      List as a Semester Bundle?
                    </h3>
                    <p className="text-xs text-[#86868b] mt-0.5 font-medium">
                      Combine multiple syllabus books into a single student pack
                      for faster campus pickup.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isBundle}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        isBundle: e.target.checked,
                        booksInBundle: e.target.checked
                          ? Math.max(2, prev.booksInBundle)
                          : 1,
                      }))
                      setPriceEstimate(null)
                    }}
                  />
                  <div className="w-11 h-6 bg-[#D6CEC2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-xs after:transition-all peer-checked:bg-[#C84200]" />
                </label>
              </div>

              <AnimatePresence>
                {formData.isBundle && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-[#1D1D1F]/10 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-[#1D1D1F] mb-2">
                          Books in Pack
                        </label>
                        <input
                          type="number"
                          min="2"
                          value={formData.booksInBundle}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              booksInBundle: parseInt(e.target.value, 10) || 2,
                            }))
                            setPriceEstimate(null)
                          }}
                          className="w-full bg-white border border-[#1D1D1F]/10 focus:border-[#C84200]/45 focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1D1D1F] outline-none transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#1D1D1F] mb-2">
                          Included Titles &amp; Subjects
                        </label>
                        <textarea
                          rows={2}
                          value={formData.bundleDescription}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              bundleDescription: e.target.value,
                            }))
                          }
                          placeholder="e.g. DSA (Cormen), Operating Systems (Galvin), Discrete Math (Rosen)..."
                          className="w-full bg-white border border-[#1D1D1F]/10 focus:border-[#C84200]/45 focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Academic Context */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-black text-[#1D1D1F] uppercase tracking-[0.14em]">
                  Campus &amp; Syllabus Tagging
                </h3>
                <span className="text-[11px] font-semibold text-[#86868b]">
                  Optional · surfaces on /campus
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    University / College
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        university: e.target.value,
                      }))
                    }
                    placeholder="e.g. Delhi University, IIT Bombay"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    Course / Degree
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        course: e.target.value,
                      }))
                    }
                    placeholder="e.g. B.Tech CSE, MBBS, B.A. Econ"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    Semester / Year
                  </label>
                  <input
                    type="number"
                    name="semester"
                    min="1"
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        semester: e.target.value,
                      }))
                    }
                    placeholder="e.g. 3"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="e.g. Data Structures, Organic Chemistry"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            {/* Category & Overall Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                  Shelf Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                    setPriceEstimate(null)
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="engineering">Engineering</option>
                  <option value="medical">Medical</option>
                  <option value="fiction">Fiction</option>
                  <option value="non-fiction">Non-Fiction</option>
                  <option value="school">School / Board</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1.5">
                  Overall Condition <span className="text-red-500">*</span>
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      condition: e.target.value,
                    }))
                    setPriceEstimate(null)
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="NEW">Brand New · Unopened</option>
                  <option value="LIKE_NEW">Like New · Crisp Spine</option>
                  <option value="GOOD">Good · Read Once</option>
                  <option value="FAIR">Fair · Light Highlighting</option>
                  <option value="POOR">Well-Worn · Intact Text</option>
                </select>
              </div>
            </div>

            {/* 5-Point Structured Condition Grader */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6F0] border border-[#1D1D1F]/[0.08]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#1D1D1F]">
                    5-Point Condition Integrity Grader
                  </h3>
                  <p className="text-xs text-[#86868b] font-medium mt-0.5">
                    Tap 1–5 on each check. Clear scores earn faster campus
                    replies.
                  </p>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-white text-xs font-black text-[#0A7D4F] border border-[#0A7D4F]/20 shadow-2xs shrink-0">
                  {integrityPct}% Integrity
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONDITION_DIMENSIONS.map((dim) => {
                  const val = formData[dim.key]
                  return (
                    <div
                      key={dim.key}
                      className="bg-white rounded-xl px-3.5 py-3 border border-[#1D1D1F]/[0.07] flex flex-wrap items-center justify-between gap-2"
                    >
                      <span className="text-xs font-bold text-[#1D1D1F]">
                        {dim.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => updateDimensionScore(dim.key, num)}
                            aria-label={`${dim.label}: ${num} out of 5`}
                            className={`w-7 h-7 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                              num <= val
                                ? "bg-[#C84200] text-white shadow-2xs"
                                : "bg-[#F2EBE1] text-[#86868b] hover:bg-[#E7DDD0] hover:text-[#1D1D1F]"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* STAGE 03: PASS-IT-ON MODE & MAP PIN */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_10px_34px_rgb(0,0,0,0.05)] border border-[#1D1D1F]/[0.07]">
            <div className="flex items-start gap-3.5 pb-6 mb-7 border-b border-[#1D1D1F]/[0.07]">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF5FF] border border-[#0066cc]/15 text-[#0066cc] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] text-[10px] font-black uppercase tracking-[0.18em] mb-1.5">
                  03 · PASS-IT-ON MODE &amp; MAP PIN
                </span>
                <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight leading-snug">
                  How this book moves next
                </h2>
                <p className="text-[#86868b] text-sm font-medium mt-0.5">
                  Choose free Vidya Daan donation, fair-price campus sale, or a
                  1-for-1 trade—then drop a map pin for nearby readers.
                </p>
              </div>
            </div>

            {/* Listing Type Pills */}
            <div className="mb-7">
              <label className="block text-xs font-bold text-[#1D1D1F] mb-3">
                Pass-It-On Mode <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: "DONATE",
                      label: "Donate (Free)",
                      sub: "Vidya Daan pledge",
                      icon: Gift,
                    },
                    {
                      id: "SELL",
                      label: "Sell Copy",
                      sub: "Fair campus price",
                      icon: Tag,
                    },
                    {
                      id: "EXCHANGE",
                      label: "1-for-1 Swap",
                      sub: "Trade with a reader",
                      icon: ArrowLeftRight,
                    },
                  ] as const
                ).map((lt) => {
                  const Icon = lt.icon
                  const active = formData.listingType === lt.id
                  return (
                    <button
                      key={lt.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          listingType: lt.id,
                          price: lt.id === "SELL" ? prev.price : "0",
                        }))
                      }
                      className={`cursor-pointer rounded-2xl p-4 border-2 text-left transition-all flex items-start gap-3 ${
                        active
                          ? "bg-[#FFF8F0] border-[#C84200] shadow-xs"
                          : "bg-[#FAF6F0]/60 border-[#1D1D1F]/10 hover:bg-white hover:border-[#C84200]/35"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          active
                            ? "bg-[#C84200] text-white"
                            : "bg-white text-[#86868b] border border-black/5"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`font-black text-sm leading-tight ${
                            active ? "text-[#C84200]" : "text-[#1D1D1F]"
                          }`}
                        >
                          {lt.label}
                        </h4>
                        <p className="text-[11px] font-medium text-[#86868b] mt-0.5">
                          {lt.sub}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {formData.listingType === "SELL" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-7 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-[#1D1D1F]">
                    Asking Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={runSmartPriceEstimate}
                    disabled={isEstimatingPrice}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0066cc]/10 hover:bg-[#0066cc]/15 text-xs font-bold text-[#0066cc] transition-colors cursor-pointer"
                  >
                    {isEstimatingPrice ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Calculator className="w-3.5 h-3.5" />
                    )}
                    Estimate Fair Campus Price
                  </button>
                </div>

                <input
                  type="number"
                  name="price"
                  min="1"
                  required={formData.listingType === "SELL"}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className={`${INPUT_CLASS} font-bold text-base`}
                />

                {priceEstimate && (
                  <div className="p-4 rounded-2xl bg-[#EBF5FF] border border-[#0066cc]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[#0066cc]">
                        Suggested Campus Price: ₹{priceEstimate.suggestedPrice}{" "}
                        <span className="font-semibold text-[#1D1D1F]/70">
                          (Typical range ₹{priceEstimate.minPrice} – ₹
                          {priceEstimate.maxPrice})
                        </span>
                      </p>
                      <p className="text-[11px] font-medium text-[#1D1D1F]/80 mt-0.5">
                        {priceEstimate.insight}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          price: String(priceEstimate.suggestedPrice),
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Apply ₹
                      {priceEstimate.suggestedPrice}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {formData.listingType === "EXCHANGE" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-7"
              >
                <label className="block text-xs font-bold text-[#1D1D1F] mb-2">
                  What book or subject would you like in return?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="exchangePreferences"
                  required={formData.listingType === "EXCHANGE"}
                  value={formData.exchangePreferences}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      exchangePreferences: e.target.value,
                    }))
                  }
                  placeholder="e.g. Computer Networks by Tanenbaum, or any literary fiction"
                  className={INPUT_CLASS}
                />
              </motion.div>
            )}

            {/* Handoff Method Selector */}
            <div className="mb-7">
              <label className="block text-xs font-bold text-[#1D1D1F] mb-3">
                Preferred Handoff Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: "BOTH",
                      label: "Meetup & Courier",
                      sub: "Best reach",
                      icon: CheckCircle2,
                    },
                    {
                      id: "MEETUP",
                      label: "Campus / City Meetup",
                      sub: "Zero shipping fee",
                      icon: Handshake,
                    },
                    {
                      id: "SHIPPING",
                      label: "Doorstep Courier",
                      sub: "Pan-India delivery",
                      icon: Truck,
                    },
                  ] as const
                ).map((mode) => {
                  const Icon = mode.icon
                  const active = formData.deliveryType === mode.id
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryType: mode.id,
                        }))
                      }
                      className={`cursor-pointer rounded-2xl p-3.5 border-2 text-left transition-all ${
                        active
                          ? "bg-[#FFF8F0] border-[#C84200] shadow-xs"
                          : "bg-[#FAF6F0]/60 border-[#1D1D1F]/10 hover:bg-white hover:border-[#C84200]/35"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? "text-[#C84200]" : "text-[#86868b]"
                          }`}
                        />
                        <span
                          className={`font-bold text-xs ${
                            active ? "text-[#C84200]" : "text-[#1D1D1F]"
                          }`}
                        >
                          {mode.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#86868b] font-medium pl-6">
                        {mode.sub}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Map Location Pin */}
            <div
              ref={locationCardRef}
              className={`mb-7 p-5 rounded-2xl border transition-colors ${
                locationError
                  ? "bg-red-50/70 border-red-300"
                  : latitude !== null && longitude !== null
                    ? "bg-[#F0FAF5] border-[#0A7D4F]/25"
                    : "bg-[#FAF6F0] border-[#1D1D1F]/10"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      latitude !== null && longitude !== null
                        ? "bg-[#0A7D4F]/15 text-[#0A7D4F]"
                        : "bg-[#C84200]/10 text-[#C84200]"
                    }`}
                  >
                    {latitude !== null && longitude !== null ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-[#1D1D1F]">
                        Campus &amp; City Map Pin
                      </h3>
                      {formData.listingType === "SELL" ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C84200]/10 text-[#C84200]">
                          Required for Sale
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/5 text-[#86868b]">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#86868b] font-medium mt-0.5">
                      {latitude !== null && longitude !== null
                        ? `Pinned on Neighborhood Book Map (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                        : "Drop your approximate campus or neighborhood pin so nearby readers can spot this copy."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={requestLocationAccess}
                  disabled={isLocating}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer disabled:opacity-60 ${
                    latitude !== null && longitude !== null
                      ? "bg-white text-[#1D1D1F] border border-black/10 hover:bg-black/5"
                      : "bg-[#C84200] text-white hover:bg-[#A33500] shadow-sm"
                  }`}
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Locating...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      {latitude !== null && longitude !== null
                        ? "Update Pin"
                        : "Pin Location"}
                    </>
                  )}
                </button>
              </div>

              {latitude !== null && longitude !== null && (
                <div className="mt-3.5 pt-3.5 border-t border-black/5">
                  <label className="block text-[11px] font-bold text-[#1D1D1F] mb-1.5">
                    Campus / Neighborhood Label (shown on map)
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. North Campus, Delhi or Koramangala, Bengaluru"
                    className="w-full bg-white border border-black/10 focus:border-[#C84200]/40 focus:ring-2 focus:ring-[#C84200]/10 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] outline-none"
                  />
                </div>
              )}

              {locationError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {locationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C84200] text-white py-4 rounded-full font-black text-sm tracking-widest uppercase hover:bg-[#A33500] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
              {isSubmitting
                ? "PUBLISHING LISTING..."
                : formData.listingType === "DONATE"
                  ? "PLEDGE BOOK TO VIDYA DAAN"
                  : formData.listingType === "EXCHANGE"
                    ? "POST FOR 1-FOR-1 SWAP"
                    : "PUBLISH BOOK LISTING"}
            </button>

            <p className="text-center text-xs text-[#86868b] mt-4 flex items-center justify-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" /> Readers watching this
              title or ISBN on their wishlist get pinged automatically.
            </p>
          </div>
        </div>

        {/* Right Column (Sticky Live Shelf Preview) */}
        <div className="lg:col-span-4 flex flex-col gap-3 lg:sticky lg:top-20">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1D1D1F]/65">
              Live Shelf Preview
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0A7D4F]">
              <span className="w-2 h-2 rounded-full bg-[#0A7D4F]" /> Updates
              live
            </span>
          </div>

          <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-[0_14px_40px_rgb(0,0,0,0.08)] border border-[#1D1D1F]/[0.07] flex flex-col relative overflow-hidden transition-all duration-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/${doodleCard1}`}
              className="absolute opacity-35 pointer-events-none mix-blend-multiply z-0"
              style={{
                top: `${card1Top}%`,
                left: `${card1Left}%`,
                transform: `rotate(${card1Rot}deg)`,
                width: `${parseFloat(card1Size) * 4}px`,
                height: `${parseFloat(card1Size) * 4}px`,
              }}
              alt=""
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/${doodleCard2}`}
              className="absolute opacity-25 pointer-events-none mix-blend-multiply z-0"
              style={{
                top: `${card2Top}%`,
                right: `${card2Right}%`,
                transform: `rotate(${card2Rot}deg)`,
                width: `${parseFloat(card2Size) * 4}px`,
                height: `${parseFloat(card2Size) * 4}px`,
              }}
              alt=""
            />
            <div className="absolute top-[25%] right-[8%] opacity-30 pointer-events-none z-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F4B22B"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M4 20L10 14" />
                <path d="M14 10L20 4" />
                <path d="M18 20L20 18" />
              </svg>
            </div>

            <div className="flex justify-between items-start z-30 mb-4 relative">
              <div className="inline-flex items-center gap-2 bg-[#FAF6F0] border border-black/5 text-[#1D1D1F] text-[11px] font-bold px-3 py-1.5 rounded-full pointer-events-none tracking-wide">
                <i className="w-2 h-2 rounded-full bg-[#0A7D4F]" />
                {formData.condition.replace("_", " ")} · {integrityPct}%
              </div>

              <div className="grid place-items-center w-9 h-9 rounded-full bg-[#FAF6F0] border border-black/5 text-[#1D1D1F]/40 pointer-events-none z-40">
                <Heart className="w-4 h-4" strokeWidth={2.5} />
              </div>
            </div>

            <div className="relative grid place-items-center w-full aspect-[1/1.06] isolate mb-2 z-10">
              <div className="absolute left-1/2 bottom-[5%] w-[60%] h-6 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(29,29,31,0.25),transparent)] z-0" />

              <div className="relative z-10 w-[58%] aspect-[5/7] rounded-md overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.15),_5px_5px_15px_rgba(0,0,0,0.08)]">
                {isLoading ? (
                  <div className="absolute inset-0 bg-[#F4EFE6] flex flex-col items-center justify-center z-30">
                    <div
                      className="relative animate-bounce"
                      style={{ animationDuration: "0.8s" }}
                    >
                      <PixelMascot size={4} />
                    </div>
                    <div
                      className="w-10 h-1.5 bg-black/10 rounded-[100%] mt-1 animate-pulse"
                      style={{ animationDuration: "0.8s" }}
                    />
                    <p className="mt-6 text-[#C84200] font-black text-[10px] tracking-widest uppercase animate-pulse">
                      Looking up ISBN...
                    </p>
                  </div>
                ) : formData.imageUrl && !previewImgError ? (
                  <>
                    <div
                      className="absolute inset-y-0 left-0 w-[11%] z-20 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(0,0,0,.3), rgba(0,0,0,.06) 68%, rgba(255,255,255,.2) 88%, rgba(0,0,0,.1))",
                      }}
                    />
                    <div
                      className="absolute inset-0 z-20 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(115deg, rgba(255,255,255,.22), transparent 38%)",
                      }}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Book Cover"
                      className="w-full h-full object-cover relative z-10"
                      onError={() => setPreviewImgError(true)}
                    />
                  </>
                ) : (
                  <GeneratedCover
                    title={formData.title || "Your Book Title"}
                    author={formData.author || "Author Name"}
                    category={formData.category}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col pt-3 relative z-20">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1D1D1F]/60 mb-1.5">
                <i className="w-2 h-2 rounded-[2px] rotate-45 bg-[#C84200]" />
                {formData.category}
                {formData.isBundle && ` · Pack of ${formData.booksInBundle}`}
              </div>

              <h3 className="font-black text-xl leading-[1.15] tracking-[-0.02em] text-[#1D1D1F] line-clamp-2 mb-1">
                {isLoading ? "Looking up ISBN..." : formData.title || "Your Book Title"}
              </h3>

              <p className="text-[#86868b] text-sm font-medium mb-4 truncate">
                {isLoading ? "Pulling edition details" : formData.author || "Author Name"}
              </p>

              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#86868b] mb-5">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#C84200] shrink-0" />
                  <span className="truncate">
                    {locationName || formData.university || "Ready to pin"}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-auto">
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#FDECE8] text-[#C84200] px-3 py-1 rounded-full text-xs font-bold capitalize">
                    {formData.category}
                  </span>
                  {formData.semester && (
                    <span className="bg-[#FAF6F0] text-[#1D1D1F] px-3 py-1 rounded-full text-xs font-bold border border-black/5">
                      Sem {formData.semester}
                    </span>
                  )}
                </div>

                <div className="relative z-30 shrink-0">
                  <div
                    className={`font-black text-xl leading-none px-5 py-2 shadow-md pointer-events-none transform transition-transform duration-300 ${
                      formData.listingType === "DONATE"
                        ? "bg-[#287F56] text-white -rotate-2"
                        : formData.listingType === "EXCHANGE"
                          ? "bg-[#0066cc] text-white -rotate-2"
                          : "bg-[#C84200] text-white rotate-2"
                    }`}
                    style={{
                      borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px",
                    }}
                  >
                    {formData.listingType === "DONATE"
                      ? "Free"
                      : formData.listingType === "EXCHANGE"
                        ? "Swap"
                        : `₹${formData.price || 0}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#1D1D1F]/[0.07] relative z-20">
              <label className="w-full bg-[#FAF6F0] hover:bg-[#F2EBE1] py-2.5 px-4 rounded-full flex items-center justify-center gap-2 text-xs font-bold text-[#1D1D1F] transition-colors border border-[#1D1D1F]/10 cursor-pointer relative overflow-hidden">
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading
                    cover...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-[#C84200]" />
                    {formData.imageUrl
                      ? "Replace Cover Photo"
                      : "Upload Cover Photo"}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUploadingImage}
                />
              </label>

              <div className="text-center mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-[#86868b] hover:text-[#C84200] font-semibold cursor-pointer transition-colors"
                >
                  {showUrlInput
                    ? "Hide image URL field"
                    : "Or paste a cover image URL"}
                </button>
              </div>

              <AnimatePresence>
                {showUrlInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => {
                        setPreviewImgError(false)
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                        }))
                      }}
                      placeholder="https://..."
                      className="w-full mt-2.5 bg-[#FAF6F0] border border-[#1D1D1F]/10 focus:border-[#C84200]/45 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-all text-[#1D1D1F]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.form>
    </div>
  )
}
