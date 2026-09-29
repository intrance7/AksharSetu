"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Loader2, BookOpen, AlertCircle, Image as ImageIcon, ScanBarcode, Check, Heart, Tag, Link as LinkIcon, Lock, Sparkles } from "lucide-react"
import Image from "next/image"
import { createBook } from "@/app/actions/book"
import { Html5QrcodeScanner } from "html5-qrcode"
import { GeneratedCover } from "./GeneratedCover"
import { PixelMascot } from "./PixelMascot"

export function ListBookForm() {
  const [isbn, setIsbn] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false)
  
  const [showScanner, setShowScanner] = useState(false)
  const [invertCamera, setInvertCamera] = useState(true)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    imageUrl: "",
    category: "fiction",
    condition: "LIKE_NEW",
    listingType: "DONATE", // DONATE, SELL, EXCHANGE
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
    deliveryType: "SHIPPING",
    isBundle: false,
    booksInBundle: 1,
    bundleDescription: "",
  })

  // Scanner Hook
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
        scanner.clear().then(() => {
          setShowScanner(false)
          const cleanIsbn = decodedText.replace(/[- ]/g, "")
          setIsbn(cleanIsbn)
          fetchBookData(cleanIsbn)
        }).catch(console.error)
      },
      (errorMessage) => { }
    )

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [showScanner])

  const fetchBookData = async (isbnToFetch?: string) => {
    const targetIsbn = isbnToFetch || isbn
    if (!targetIsbn.trim()) {
      setError("Please enter an ISBN")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const cleanIsbn = targetIsbn.replace(/[- ]/g, "")
      let vol = null;

      try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`)
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          const volumeInfo = data.items[0].volumeInfo
          let coverUrl = ""
          if (volumeInfo.imageLinks) {
              coverUrl = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail || ""
              coverUrl = coverUrl.replace("zoom=1", "zoom=0").replace("&edge=curl", "")
              coverUrl = coverUrl.replace("http://", "https://")
          }
          vol = {
            title: volumeInfo.title || "",
            author: volumeInfo.authors ? volumeInfo.authors.join(", ") : "",
            description: volumeInfo.description || "",
            imageUrl: coverUrl,
            category: volumeInfo.categories && volumeInfo.categories[0].toLowerCase().includes("science") ? "engineering" : "fiction" 
          }
        }
      } catch (err) { }

      if (!vol) {
        try {
          const olRes = await fetch(`https://openlibrary.org/search.json?isbn=${cleanIsbn}`)
          const olData = await olRes.json()
          if (olData.docs && olData.docs.length > 0) {
             const bookData = olData.docs[0];
             let description = ""
             if (bookData.key) {
                try {
                  const detailRes = await fetch(`https://openlibrary.org${bookData.key}.json`)
                  const detailData = await detailRes.json()
                  if (detailData.description) {
                    description = typeof detailData.description === 'string' 
                      ? detailData.description 
                      : (detailData.description.value || "")
                  }
                } catch(e) {}
             }
             vol = {
               title: bookData.title,
               author: bookData.author_name ? bookData.author_name.join(", ") : "",
               description: description,
               imageUrl: bookData.cover_i ? `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg` : "",
               category: "other"
             }
          }
        } catch (err) {}
      }

      if (vol) {
        setFormData(prev => ({
          ...prev,
          title: vol.title || prev.title,
          author: vol.author || prev.author,
          description: vol.description || prev.description,
          imageUrl: vol.imageUrl || prev.imageUrl,
          category: vol.category || prev.category
        }))
      } else {
        setError("No book found for this ISBN. You can fill the details manually.")
      }
    } catch (err) {
      setError("Failed to fetch book data. Please fill details manually.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      // 1. Get presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)

      if (data.uploadUrl === "mock") {
        // Fallback mock logic if AWS isn't configured
        setTimeout(() => {
          setFormData(prev => ({ ...prev, imageUrl: data.publicUrl }))
          setIsUploadingImage(false)
        }, 1000)
        return
      }

      // 2. Upload file directly to S3
      await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      // 3. Update form data
      setFormData(prev => ({ ...prev, imageUrl: data.publicUrl }))
    } catch (e) {
      console.error("Upload failed", e)
      setError("Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const generateDescription = async () => {
    if (!formData.title) {
      setError("Please enter a title first to generate a description.")
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
          condition: formData.condition
        })
      })
      const data = await res.json()
      if (data.description) {
        setFormData(prev => ({...prev, description: data.description}))
      } else if (data.error) {
        setError(data.error)
      }
    } catch (e) {
      setError("Failed to generate description.")
    } finally {
      setIsGeneratingDesc(false)
    }
  }

  // Consistent Randomization for Doodles based on title or isbn
  const seedString = formData.title || isbn || "new-book";
  const hash = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(hash + seed) * 10000;
    return x - Math.floor(x);
  };

  const doodles = [
    'doodle-star.png', 'doodle-smile.png', 'doodle-heart.png', 'doodle-bulb.png',
    'doodle-flower.png', 'doodle-lightning.png', 'doodle-cloud.png', 'doodle-leaf.png'
  ];
  
  // Doodles for Top Container (ISBN)
  const doodleTop1 = doodles[hash % doodles.length];
  const doodleTop2 = doodles[(hash + 1) % doodles.length];
  const top1Top = (5 + pseudoRandom(1) * 20).toFixed(2); // 5% to 25%
  const top1Right = (-2 + pseudoRandom(2) * 5).toFixed(2); // -2% to 3%
  const top2Top = (50 + pseudoRandom(3) * 20).toFixed(2); // 50% to 70%
  const top2Left = (5 + pseudoRandom(4) * 15).toFixed(2); // 5% to 20%

  // Doodles for Preview Card
  const doodleCard1 = doodles[(hash + 2) % doodles.length];
  const doodleCard2 = doodles[(hash + 3) % doodles.length];
  
  const card1Top = (10 + pseudoRandom(5) * 30).toFixed(2);
  const card1Left = (-6 + pseudoRandom(6) * 10).toFixed(2);
  const card1Rot = (-30 + pseudoRandom(7) * 60).toFixed(2);
  const card1Size = (14 + pseudoRandom(8) * 8).toFixed(2);
  
  const card2Top = (40 + pseudoRandom(9) * 40).toFixed(2);
  const card2Right = (-6 + pseudoRandom(10) * 10).toFixed(2);
  const card2Rot = (-30 + pseudoRandom(11) * 60).toFixed(2);
  const card2Size = (16 + pseudoRandom(12) * 10).toFixed(2);

  return (
    <div className="w-full">
      
      {/* ISBN Auto-fill Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#1d1d1f]/5 mb-6 relative overflow-hidden isolate"
      >
        {/* Playful Textures */}
        <img 
          src={`/${doodleTop1}`} 
          className="absolute opacity-30 pointer-events-none mix-blend-multiply z-0" 
          style={{ top: `${top1Top}%`, right: `${top1Right}%`, transform: `rotate(12deg)`, width: '9rem', height: '9rem' }} 
          alt="" 
        />
        <img 
          src={`/${doodleTop2}`} 
          className="absolute opacity-40 pointer-events-none mix-blend-multiply z-0" 
          style={{ top: `${top2Top}%`, left: `${top2Left}%`, transform: `rotate(-12deg)`, width: '4rem', height: '4rem' }} 
          alt="" 
        />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl text-[#C84200] shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">Auto-fill with ISBN</h2>
              <p className="text-[#86868b] text-sm font-medium mt-1">Enter the barcode number on the back of your book to instantly fetch its details.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-[#1D1D1F] bg-white border border-[#1d1d1f]/10 shadow-sm hover:scale-105 transition-all whitespace-nowrap"
          >
            <ScanBarcode className="w-4 h-4" />
            {showScanner ? "CLOSE SCANNER" : "SCAN BARCODE"}
          </button>
        </div>
        
        {/* Scanner Container */}
        <AnimatePresence>
          {showScanner && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6 relative z-10"
            >
              <div className="bg-white rounded-xl p-4 border border-black/[0.04]">
                <div id="reader" className="w-full text-[#1d1d1f]"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <input 
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 9780131103627"
              className="w-full bg-white border border-[#1d1d1f]/10 focus:border-[#C84200]/30 focus:ring-4 focus:ring-[#C84200]/10 rounded-xl pl-12 pr-4 py-3.5 text-[#1d1d1f] font-medium outline-none transition-all placeholder:text-[#86868b]/60"
              onKeyDown={(e) => e.key === 'Enter' && fetchBookData()}
            />
          </div>
          <button 
            type="button"
            onClick={() => fetchBookData()}
            disabled={isLoading}
            className="bg-[#C84200] text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-[#A33500] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "FETCH DETAILS →"}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-500 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </motion.div>

      {/* Manual Form */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        action={async (form) => {
           setIsSubmitting(true)
           form.set("isDonation", (formData.listingType === "DONATE").toString())
           form.set("acceptsExchange", (formData.listingType === "EXCHANGE").toString())
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

           try {
             await createBook(form)
           } catch(e) {
             setError("Failed to list the book. Please check all fields and try again.")
             setIsSubmitting(false)
           }
        }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        <input type="hidden" name="isbn" value={isbn} />
        
        {/* Left Column (Form) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#1d1d1f]/5">
           
           <div className="flex items-center gap-3 mb-8">
             <div className="p-2.5 bg-[#FFF5E6] rounded-xl text-[#C84200]">
               <BookOpen className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">Book Details</h2>
               <p className="text-[#86868b] text-sm font-medium">Provide accurate information so it reaches the right reader.</p>
             </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
             <div>
               <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Title <span className="text-red-500">*</span></label>
               <input 
                  type="text" 
                  name="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                  placeholder="e.g. Atomic Habits"
                  className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Author <span className="text-red-500">*</span></label>
               <input 
                  type="text" 
                  name="author"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({...prev, author: e.target.value}))}
                  placeholder="e.g. James Clear"
                  className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
               />
             </div>
           </div>

           <div className="mb-5 relative">
             <div className="flex justify-between items-center mb-2">
               <label className="block text-xs font-bold text-[#1d1d1f]">Description</label>
               <button 
                 type="button" 
                 onClick={generateDescription}
                 disabled={isGeneratingDesc || !formData.title}
                 className="text-xs font-bold text-[#0066cc] hover:text-[#0071e3] flex items-center gap-1.5 disabled:opacity-50 transition-colors"
               >
                 {isGeneratingDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                 AI Generate
               </button>
             </div>
             <textarea 
                name="description"
                rows={3}
                value={formData.description}
                maxLength={500}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="Add a short description, highlights, or any notes for the reader..."
                className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all resize-none placeholder:text-[#86868b]/60"
             />
             <div className="absolute right-2 -bottom-5 text-[10px] font-bold text-[#86868b]">
               {formData.description.length}/500
             </div>
           </div>

           {/* Bundles Option */}
           <div className="mb-8 p-5 bg-[#F2EBE1] rounded-2xl border border-[#1d1d1f]/5">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-sm font-black text-[#1d1d1f] flex items-center gap-2">
                   <BookOpen className="w-4 h-4 text-[#C84200]" /> Sell as a Bundle?
                 </h3>
                 <p className="text-xs text-[#86868b] mt-1 font-medium">Group multiple books (like an entire semester) into one listing.</p>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input 
                   type="checkbox" 
                   className="sr-only peer" 
                   checked={formData.isBundle}
                   onChange={(e) => setFormData(prev => ({...prev, isBundle: e.target.checked}))}
                 />
                 <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C84200]"></div>
               </label>
             </div>
             
             <AnimatePresence>
               {formData.isBundle && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="mt-4 pt-4 border-t border-[#1d1d1f]/10 overflow-hidden"
                 >
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                     <div className="sm:col-span-1">
                       <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Number of Books</label>
                       <input 
                         type="number"
                         min="2"
                         value={formData.booksInBundle}
                         onChange={(e) => setFormData(prev => ({...prev, booksInBundle: parseInt(e.target.value)}))}
                         className="w-full bg-white border border-transparent focus:border-[#C84200]/30 focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-2.5 font-medium text-[#1d1d1f] outline-none transition-all"
                       />
                     </div>
                     <div className="sm:col-span-2">
                       <label className="block text-xs font-bold text-[#1d1d1f] mb-2">What books are included?</label>
                       <textarea 
                         rows={2}
                         value={formData.bundleDescription}
                         onChange={(e) => setFormData(prev => ({...prev, bundleDescription: e.target.value}))}
                         placeholder="List the books included in this bundle..."
                         className="w-full bg-white border border-transparent focus:border-[#C84200]/30 focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-2.5 font-medium text-[#1d1d1f] outline-none transition-all resize-none"
                       />
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           <div className="mt-8 mb-5">
             <h3 className="text-sm font-black text-[#1d1d1f] mb-4 uppercase tracking-wider">Academic Details (Optional)</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
               <div>
                 <label className="block text-xs font-bold text-[#1d1d1f] mb-2">University / College</label>
                 <input 
                    type="text" 
                    name="university"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({...prev, university: e.target.value}))}
                    placeholder="e.g. KR Mangalam University"
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Course / Degree</label>
                 <input 
                    type="text" 
                    name="course"
                    value={formData.course}
                    onChange={(e) => setFormData(prev => ({...prev, course: e.target.value}))}
                    placeholder="e.g. B.Tech CSE"
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Semester / Year</label>
                 <input 
                    type="number" 
                    name="semester"
                    min="1"
                    value={formData.semester}
                    onChange={(e) => setFormData(prev => ({...prev, semester: e.target.value}))}
                    placeholder="e.g. 3"
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Subject</label>
                 <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
                    placeholder="e.g. DSA"
                    className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all placeholder:text-[#86868b]/60"
                 />
               </div>
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 mt-6">
             <div>
               <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Category <span className="text-red-500">*</span></label>
               <select 
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                  className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all"
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
               <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Condition <span className="text-red-500">*</span></label>
               <select 
                  name="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({...prev, condition: e.target.value}))}
                  className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all"
               >
                 <option value="NEW">✨ Brand New</option>
                 <option value="LIKE_NEW">✨ Like New</option>
                 <option value="GOOD">👍 Good / Read Once</option>
                 <option value="FAIR">📖 Fair / Highlighted</option>
                 <option value="POOR">💔 Poor / Damaged</option>
               </select>
             </div>
           </div>

           <div className="mb-8">
             <label className="block text-xs font-bold text-[#1d1d1f] mb-3">Listing Type <span className="text-red-500">*</span></label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               <div 
                 onClick={() => setFormData(prev => ({...prev, listingType: "DONATE", price: "0"}))}
                 className={`cursor-pointer rounded-xl p-3 border-2 flex items-start gap-2 transition-colors ${formData.listingType === "DONATE" ? 'bg-[#FFF8F0] border-[#C84200] shadow-sm' : 'bg-white border-[#1d1d1f]/10 hover:border-[#C84200]/30'}`}
               >
                 <div className={`mt-0.5 rounded-full w-4 h-4 flex items-center justify-center border shrink-0 ${formData.listingType === "DONATE" ? 'border-[#C84200]' : 'border-[#1d1d1f]/20'}`}>
                   {formData.listingType === "DONATE" && <div className="w-2 h-2 rounded-full bg-[#C84200]" />}
                 </div>
                 <div>
                   <h4 className={`font-bold text-sm flex items-center gap-1.5 ${formData.listingType === "DONATE" ? 'text-[#C84200]' : 'text-[#1d1d1f]'}`}>
                     Donate
                   </h4>
                 </div>
               </div>

               <div 
                 onClick={() => setFormData(prev => ({...prev, listingType: "SELL"}))}
                 className={`cursor-pointer rounded-xl p-3 border-2 flex items-start gap-2 transition-colors ${formData.listingType === "SELL" ? 'bg-[#FFF8F0] border-[#C84200] shadow-sm' : 'bg-white border-[#1d1d1f]/10 hover:border-[#C84200]/30'}`}
               >
                 <div className={`mt-0.5 rounded-full w-4 h-4 flex items-center justify-center border shrink-0 ${formData.listingType === "SELL" ? 'border-[#C84200]' : 'border-[#1d1d1f]/20'}`}>
                   {formData.listingType === "SELL" && <div className="w-2 h-2 rounded-full bg-[#C84200]" />}
                 </div>
                 <div>
                   <h4 className={`font-bold text-sm flex items-center gap-1.5 ${formData.listingType === "SELL" ? 'text-[#C84200]' : 'text-[#1d1d1f]'}`}>
                     Sell
                   </h4>
                 </div>
               </div>

               <div 
                 onClick={() => setFormData(prev => ({...prev, listingType: "EXCHANGE", price: "0"}))}
                 className={`cursor-pointer rounded-xl p-3 border-2 flex items-start gap-2 transition-colors ${formData.listingType === "EXCHANGE" ? 'bg-[#FFF8F0] border-[#C84200] shadow-sm' : 'bg-white border-[#1d1d1f]/10 hover:border-[#C84200]/30'}`}
               >
                 <div className={`mt-0.5 rounded-full w-4 h-4 flex items-center justify-center border shrink-0 ${formData.listingType === "EXCHANGE" ? 'border-[#C84200]' : 'border-[#1d1d1f]/20'}`}>
                   {formData.listingType === "EXCHANGE" && <div className="w-2 h-2 rounded-full bg-[#C84200]" />}
                 </div>
                 <div>
                   <h4 className={`font-bold text-sm flex items-center gap-1.5 ${formData.listingType === "EXCHANGE" ? 'text-[#C84200]' : 'text-[#1d1d1f]'}`}>
                     Exchange
                   </h4>
                 </div>
               </div>
             </div>
           </div>
           
           {formData.listingType === "SELL" && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               className="mb-8"
             >
               <label className="block text-xs font-bold text-[#1d1d1f] mb-2">Price (₹) <span className="text-red-500">*</span></label>
               <input 
                  type="number" 
                  name="price"
                  min="1"
                  required={formData.listingType === "SELL"}
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                  className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-bold text-[#1d1d1f] outline-none transition-all"
               />
             </motion.div>
           )}

           {formData.listingType === "EXCHANGE" && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               className="mb-8"
             >
               <label className="block text-xs font-bold text-[#1d1d1f] mb-2">What are you looking for? <span className="text-red-500">*</span></label>
               <input 
                  type="text" 
                  name="exchangePreferences"
                  required={formData.listingType === "EXCHANGE"}
                  value={formData.exchangePreferences}
                  onChange={(e) => setFormData(prev => ({...prev, exchangePreferences: e.target.value}))}
                  placeholder="e.g. Computer Networks by Tanenbaum"
                  className="w-full bg-[#F2EBE1] border-transparent focus:border-[#C84200]/30 focus:bg-white focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 font-medium text-[#1d1d1f] outline-none transition-all"
               />
             </motion.div>
           )}

           <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C84200] text-white py-4 rounded-xl font-black text-sm tracking-widest uppercase hover:bg-[#A33500] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 mt-2"
           >
             {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
             {isSubmitting ? "LISTING BOOK..." : "LIST BOOK NOW"}
           </button>
           
           <p className="text-center text-xs text-[#86868b] mt-4 flex items-center justify-center gap-1.5 font-medium">
             <Lock className="w-3.5 h-3.5" /> Your listing will be reviewed to ensure a safe and trusted community.
           </p>
        </div>

        {/* Right Column (Preview) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="text-[15px] font-bold text-[#1d1d1f]/60 mb-1 px-2">Preview of your listing</h3>
          
          <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#1D1D1F]/5 flex flex-col relative overflow-hidden sticky top-6 transition-all duration-300">
            
            {/* Playful Textures (Absolute) */}
            <img 
              src={`/${doodleCard1}`} 
              className="absolute opacity-40 pointer-events-none mix-blend-multiply z-0" 
              style={{ 
                top: `${card1Top}%`, 
                left: `${card1Left}%`, 
                transform: `rotate(${card1Rot}deg)`,
                width: `${parseFloat(card1Size) * 4}px`, height: `${parseFloat(card1Size) * 4}px`
              }} 
              alt="" 
            />
            <img 
              src={`/${doodleCard2}`} 
              className="absolute opacity-30 pointer-events-none mix-blend-multiply z-0" 
              style={{ 
                top: `${card2Top}%`, 
                right: `${card2Right}%`, 
                transform: `rotate(${card2Rot}deg)`,
                width: `${parseFloat(card2Size) * 4}px`, height: `${parseFloat(card2Size) * 4}px`
              }} 
              alt="" 
            />
            <div className="absolute top-[25%] right-[8%] opacity-30 pointer-events-none z-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F4B22B" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 20L10 14" /><path d="M14 10L20 4" /><path d="M18 20L20 18" />
              </svg>
            </div>

            {/* Badges Row */}
            <div className="flex justify-between items-start z-30 mb-4 relative">
              <div className="inline-flex items-center gap-2 bg-white text-[#1D1D1F] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm pointer-events-none tracking-wide">
                <i className="w-2 h-2 rounded-full bg-[#0A7D4F]"></i>
                {formData.condition.replace('_', ' ')}
              </div>

              <div className="grid place-items-center w-10 h-10 rounded-full bg-white text-[#1D1D1F]/40 shadow-sm pointer-events-none z-40">
                <Heart className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </div>
            </div>
            
            {/* Tile Container for Cover */}
            <div className="relative grid place-items-center w-full aspect-[1/1.08] isolate mb-2 z-10">
              {/* Background gradient shadow */}
              <div className="absolute left-1/2 bottom-[5%] w-[60%] h-6 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(29,29,31,0.25),transparent)] z-0" />
              
              <div className="relative z-10 w-[58%] aspect-[5/7] rounded-md overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.15),_5px_5px_15px_rgba(0,0,0,0.08)]">
                {isLoading ? (
                  <div className="absolute inset-0 bg-[#F4EFE6] flex flex-col items-center justify-center z-30">
                    <div className="relative animate-bounce" style={{ animationDuration: '0.8s' }}>
                      <PixelMascot size={4} />
                    </div>
                    {/* Soft shadow that pulses with the bounce */}
                    <div className="w-10 h-1.5 bg-black/10 rounded-[100%] mt-1 animate-pulse" style={{ animationDuration: '0.8s' }}></div>
                    <p className="mt-6 text-[#C84200] font-black text-[10px] tracking-widest uppercase animate-pulse">
                      Fetching...
                    </p>
                  </div>
                ) : formData.imageUrl ? (
                  <>
                    <div className="absolute inset-y-0 left-0 w-[11%] z-20 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.3), rgba(0,0,0,.06) 68%, rgba(255,255,255,.2) 88%, rgba(0,0,0,.1))" }} />
                    <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "linear-gradient(115deg, rgba(255,255,255,.22), transparent 38%)" }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={formData.imageUrl} 
                      alt="Book Cover" 
                      className="w-full h-full object-fill relative z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
                      }}
                    />
                  </>
                ) : (
                  <GeneratedCover 
                    title={formData.title || "Book Title"} 
                    author={formData.author || "Author Name"} 
                    category={formData.category} 
                  />
                )}
              </div>
            </div>

            {/* Meta Data */}
            <div className="flex flex-col pt-4 relative z-20">
              <div className="inline-flex items-center gap-2 text-[15px] font-bold text-[#1D1D1F]/60 mb-2">
                <i className="w-2.5 h-2.5 rounded-[2px] rotate-45 bg-[#C93A64]"></i>
                {formData.category}
              </div>
              
              <h3 className="font-bold text-[1.45rem] leading-[1.1] tracking-[-0.02em] text-[#1D1D1F] line-clamp-2 mb-1">
                {isLoading ? "Fetching..." : (formData.title || "Book Title")}
              </h3>
              
              <p className="text-[#86868B] text-[16px] font-medium mb-4">
                {isLoading ? "Please wait" : (formData.author || "Author Name")}
              </p>

              {/* Location & Time Row */}
              <div className="flex items-center gap-3 text-[14px] font-medium text-[#86868B] mb-6">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-[18px] h-[18px] text-[#C84200]" /> Just now
                </span>
                <span className="text-[#D4CCC0]">|</span>
                <span className="inline-flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Preview
                </span>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#FDECE8] text-[#C84200] px-3.5 py-1.5 rounded-full text-[13px] font-semibold">
                    {formData.category}
                  </span>
                </div>
                
                <div className="relative z-30">
                  <svg className="absolute -top-4 -right-3 w-7 h-7 rotate-[15deg] opacity-70" viewBox="0 0 24 24" fill="none" stroke="#F4B22B" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  
                  <div className={`font-black text-[22px] leading-none px-6 py-2.5 shadow-md pointer-events-none transform transition-transform duration-300 group-hover:scale-110 ${
                    formData.listingType === "DONATE" 
                      ? "bg-[#287F56] text-white -rotate-3" 
                      : formData.listingType === "EXCHANGE" 
                        ? "bg-[#0066cc] text-white -rotate-3" 
                        : "bg-[#C84200] text-white rotate-3"
                  }`}
                  style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}>
                    {formData.listingType === "DONATE" ? "Free" : formData.listingType === "EXCHANGE" ? "Exchange" : `₹${formData.price || 0}`}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Custom Cover Tool */}
            <div className="mt-6 pt-5 border-t border-[#1d1d1f]/5 relative z-20">
              <label className="w-full bg-white/50 hover:bg-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#1d1d1f] transition-colors border border-white cursor-pointer relative overflow-hidden">
                {isUploadingImage ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><ImageIcon className="w-4 h-4" /> {formData.imageUrl ? "Change Cover Image" : "Upload Custom Cover"}</>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUploadingImage}
                />
              </label>
              
              <div className="text-center mt-3">
                <button 
                  type="button" 
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-[#86868b] hover:text-[#C84200] font-medium"
                >
                  Or enter image URL manually
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
                      onChange={(e) => setFormData(prev => ({...prev, imageUrl: e.target.value}))}
                      placeholder="https://..."
                      className="w-full mt-2 bg-white border border-[#1d1d1f]/10 focus:border-[#C84200]/30 focus:ring-4 focus:ring-[#C84200]/10 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all text-[#1d1d1f] shadow-inner"
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
