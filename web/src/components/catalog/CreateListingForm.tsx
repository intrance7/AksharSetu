"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { BookOpen, AlertCircle, ScanBarcode, Search, Loader2 } from "lucide-react"
import { Html5QrcodeScanner } from "html5-qrcode"

export function CreateListingForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [invertCamera, setInvertCamera] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    condition: "GOOD",
    category: "fiction",
    price: "",
    imageUrl: ""
  })

  useEffect(() => {
    if (!showScanner) return

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        videoConstraints: { facingMode: "environment" }
      },
      false
    )

    scanner.render(
      (decodedText) => {
        // Stop scanning on success
        scanner.clear().catch(console.error)
        setShowScanner(false)
        const cleanIsbn = decodedText.replace(/[- ]/g, "")
        setFormData(prev => ({ ...prev, isbn: cleanIsbn }))
        fetchBookDetails(cleanIsbn)
      },
      (errorMessage) => {
        // Just log or ignore continuous scan errors
        // console.log(errorMessage)
      }
    )

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [showScanner])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const fetchBookDetails = async (rawIsbn: string) => {
    const isbnStr = rawIsbn.replace(/[- ]/g, "")
    if (!isbnStr) {
      setError("Please enter an ISBN first.")
      return
    }
    setError("")
    setIsFetching(true)
    
    let vol = null;

    // 1. Try Google Books API
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnStr}`)
      if (res.ok) {
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          vol = {
            title: data.items[0].volumeInfo.title,
            author: data.items[0].volumeInfo.authors ? data.items[0].volumeInfo.authors.join(", ") : "",
            description: data.items[0].volumeInfo.description,
            imageUrl: data.items[0].volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:")
          }
        }
      }
    } catch (e) {
      console.warn("Google Books API failed", e)
    }

    // 2. Try OpenLibrary API if Google Books failed or returned nothing
    if (!vol) {
      try {
        const olRes = await fetch(`https://openlibrary.org/search.json?isbn=${isbnStr}`)
        if (olRes.ok) {
           const olData = await olRes.json()
           if (olData.docs && olData.docs.length > 0) {
              const bookData = olData.docs[0];
              vol = {
                title: bookData.title,
                author: bookData.author_name ? bookData.author_name.join(", ") : "",
                description: "",
                imageUrl: bookData.cover_i ? `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg` : ""
              }
           }
        }
      } catch (e) {
        console.warn("OpenLibrary API failed", e)
      }
    }

    if (vol) {
      setFormData(prev => ({
        ...prev,
        title: vol.title || prev.title,
        author: vol.author || prev.author,
        description: vol.description || prev.description,
        imageUrl: vol.imageUrl || prev.imageUrl
      }))
    } else {
      setError("No book details found for this ISBN. You can still enter details manually.")
    }
    
    setIsFetching(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const data = {
      ...formData,
      price: parseFloat(formData.price) || 0
    }

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result?.error || "Failed to create listing")
      }

      router.push("/catalog")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-[#0066cc]/10 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-[#0066cc]" />
        </div>
        <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Add a Book</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Auto-fill Section */}
      <div className="bg-[#F5F5F7] p-6 rounded-2xl flex flex-col gap-4 border border-[#1D1D1F]/5">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-2 flex-1 min-w-[200px] w-full">
            <label className="text-sm font-semibold text-[#1D1D1F] whitespace-nowrap">ISBN Auto-Fill</label>
            <Input 
              name="isbn" 
              value={formData.isbn}
              onChange={handleChange}
              placeholder="e.g. 9780743273565" 
              className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc] bg-white w-full" 
            />
          </div>
          <div className="flex gap-2 shrink-0 w-full md:w-auto">
            <Button 
              type="button" 
              onClick={() => fetchBookDetails(formData.isbn)}
              disabled={isFetching}
              className="h-12 px-6 rounded-xl font-bold bg-[#1D1D1F] hover:bg-[#2d2d2f] text-white flex-1 md:flex-none"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Fetch
            </Button>
            <Button 
              type="button" 
              onClick={() => setShowScanner(!showScanner)}
              className={`h-12 px-4 rounded-xl font-bold border transition-colors ${
                showScanner 
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                : "bg-white text-[#1D1D1F] border-gray-200 hover:bg-gray-50"
              }`}
            >
              <ScanBarcode className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scanner Container */}
        {showScanner && (
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#1D1D1F]">Scan ISBN Barcode</span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setInvertCamera(!invertCamera)}
                className="h-8 text-xs rounded-full border-gray-300"
              >
                Flip Camera View
              </Button>
            </div>
            <div className={`w-full h-full max-h-[400px] overflow-hidden rounded-lg ${invertCamera ? "scale-x-[-1]" : ""}`}>
              <div id="reader" className="w-full h-full"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1D1D1F]">Title *</label>
            <Input 
              name="title" 
              value={formData.title}
              onChange={handleChange}
              placeholder="The Great Gatsby" 
              required 
              className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc]" 
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1D1D1F]">Author *</label>
            <Input 
              name="author" 
              value={formData.author}
              onChange={handleChange}
              placeholder="F. Scott Fitzgerald" 
              required 
              className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc]" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1D1D1F]">Description</label>
          <textarea 
            name="description" 
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief summary or details about the book..." 
            className="min-h-[100px] w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066cc]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1D1D1F]">Condition *</label>
            <select 
              name="condition" 
              value={formData.condition}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066cc]"
            >
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1D1D1F]">Category *</label>
            <select 
              name="category" 
              value={formData.category}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066cc]"
            >
              <option value="fiction">Fiction</option>
              <option value="non-fiction">Non-Fiction</option>
              <option value="engineering">Engineering</option>
              <option value="medical">Medical</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1D1D1F]">Price (₹) *</label>
            <Input 
              name="price" 
              value={formData.price}
              onChange={handleChange}
              type="number"
              min="0"
              step="0.01"
              placeholder="0 for donation" 
              required 
              className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc]" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1D1D1F]">Cover Image URL</label>
            <div className="flex gap-4 items-start">
              <Input 
                name="imageUrl" 
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="Auto-filled or paste https://..." 
                className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc] flex-1" 
              />
              {formData.imageUrl && (
                <div className="w-12 h-16 shrink-0 rounded-md border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={formData.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 rounded-full text-base font-semibold bg-[#0066cc] hover:bg-[#0071e3] text-white transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "List Book"}
          </Button>
        </div>
      </form>
    </div>
  )
}
