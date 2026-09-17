"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { BookOpen, AlertCircle } from "lucide-react"

export function CreateListingForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title"),
      author: formData.get("author"),
      isbn: formData.get("isbn") || "",
      description: formData.get("description") || "",
      condition: formData.get("condition"),
      category: formData.get("category"),
      price: parseFloat(formData.get("price") as string) || 0,
      imageUrl: formData.get("imageUrl") || "",
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1D1D1F]">Title *</label>
          <Input 
            name="title" 
            placeholder="The Great Gatsby" 
            required 
            className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc]" 
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1D1D1F]">Author *</label>
          <Input 
            name="author" 
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
          placeholder="Brief summary or details about the book..." 
          className="min-h-[100px] w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066cc]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1D1D1F]">Condition *</label>
          <select 
            name="condition" 
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
            required
            className="h-12 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066cc]"
          >
            <option value="fiction">Fiction</option>
            <option value="non-fiction">Non-Fiction</option>
            <option value="textbook">Textbook</option>
            <option value="children">Children</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1D1D1F]">Price (₹) *</label>
          <Input 
            name="price" 
            type="number"
            min="0"
            step="0.01"
            placeholder="0 for donation" 
            required 
            className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc]" 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1D1D1F]">ISBN (Optional)</label>
          <Input 
            name="isbn" 
            placeholder="e.g. 9780743273565" 
            className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc]" 
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#1D1D1F]">Cover Image URL (Optional)</label>
        <Input 
          name="imageUrl" 
          placeholder="https://example.com/book-cover.jpg" 
          className="h-12 rounded-xl text-base px-4 border-gray-200 focus-visible:ring-[#0066cc]" 
        />
        <p className="text-xs text-[#86868b]">We currently support linking external images.</p>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full h-12 rounded-full text-base font-semibold bg-[#0066cc] hover:bg-[#0071e3] text-white transition-colors"
        >
          {isLoading ? "Creating Listing..." : "List Book"}
        </Button>
      </div>
    </form>
  )
}
