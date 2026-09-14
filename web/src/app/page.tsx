"use client"

import Link from "next/link"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { MapPin, Heart, BookCopy, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6]">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden pt-24 pb-32 md:pt-32 md:pb-48">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col space-y-8"
            >
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm w-max">
                <span className="flex h-2 w-2 rounded-full bg-[#f97316] mr-2"></span>
                Join the growing community
              </div>
              
              <h1 className="text-5xl font-extrabold tracking-tight text-[#0b1b3d] sm:text-6xl lg:text-7xl">
                Bridge the Gap Between <span className="relative inline-block text-[#f97316]">
                  Books
                  {/* Decorative underline */}
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#fcd34d] opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                  </svg>
                </span> and Readers.
              </h1>
              
              <p className="max-w-xl text-lg text-gray-600 leading-relaxed">
                The smartest way to buy, sell, and donate used books in your community. Give your old books a new life and discover your next great read.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="rounded-full font-bold px-8">
                  Browse Books <span className="ml-2">→</span>
                </Button>
                <Button variant="secondary" size="lg" className="rounded-full font-bold px-8 gap-2">
                  <HeartHandshake className="h-5 w-5 text-[#f97316]" />
                  Donate Now
                </Button>
              </div>
            </motion.div>

            {/* Right Content - 3D Tilt Element */}
            <div className="flex justify-center lg:justify-end">
               <TiltCard />
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section with Scroll Animations */}
      <section className="w-full py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#0b1b3d] mb-4">Why choose AksharSetu?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">More than just a marketplace, we're building a sustainable ecosystem for readers across the country.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="flex flex-col items-center space-y-4 text-center p-8 rounded-2xl bg-[#faf9f6] border border-gray-100 hover:shadow-xl transition-shadow duration-300 group"
              >
                <div className={`p-4 rounded-2xl mb-2 transition-transform duration-300 group-hover:scale-110 ${feature.color}`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-[#0b1b3d]">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// Data
const features = [
  {
    icon: MapPin,
    title: "Hyperlocal Discovery",
    desc: "Find books in your own city or neighborhood. Meet up locally and save entirely on shipping costs.",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: Heart,
    title: "Vidya Daan",
    desc: "Donate your old books to students or NGOs directly. Earn digital badges and build community goodwill.",
    color: "bg-orange-100 text-[#f97316]"
  },
  {
    icon: BookCopy,
    title: "Bundle Listings",
    desc: "Sell or donate an entire semester's worth of textbooks or a complete fiction series in one go.",
    color: "bg-indigo-100 text-indigo-600"
  }
]

// 3D Tilt Component
function TiltCard() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useTransform(x, [-0.5, 0.5], [15, -15])
  const mouseYSpring = useTransform(y, [-0.5, 0.5], [-15, 15])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full max-w-[500px] aspect-square flex items-center justify-center cursor-pointer"
    >
      <motion.div
        style={{
          rotateX: mouseYSpring,
          rotateY: mouseXSpring,
          transformStyle: "preserve-3d",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full h-full bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center p-12 overflow-hidden border border-gray-100"
      >
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" style={{ transform: "translateZ(-20px)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" style={{ transform: "translateZ(-30px)" }} />

        {/* Floating elements inside the 3D card mimicking the screenshot placeholder */}
        <motion.div 
          className="relative w-full h-full flex flex-col items-center justify-center"
          style={{ transform: "translateZ(50px)" }}
        >
           {/* Abstract illustration of people exchanging books */}
           <div className="relative w-full max-w-[280px] h-[200px] flex items-end justify-between">
              
              {/* Person 1 (Navy) */}
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#f97316] mb-2 border-4 border-white shadow-sm z-10" />
                <div className="w-24 h-24 rounded-t-3xl bg-[#0b1b3d] relative" />
              </div>

              {/* Books being exchanged */}
              <motion.div 
                animate={{ y: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute left-1/2 -translate-x-1/2 bottom-12 flex flex-col gap-1.5 z-20"
                style={{ transform: "translateZ(80px)" }}
              >
                <div className="w-24 h-4 bg-[#f97316] rounded shadow-md transform -rotate-6" />
                <div className="w-26 h-4 bg-[#0b1b3d] rounded shadow-md transform rotate-2" />
                <div className="w-24 h-4 bg-gray-300 rounded shadow-md transform -rotate-2" />
                <div className="w-28 h-4 bg-[#f97316] rounded shadow-md transform rotate-3" />
              </motion.div>

              {/* Person 2 (Gray/Blue) */}
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#0b1b3d] mb-2 border-4 border-white shadow-sm z-10" />
                <div className="w-20 h-20 rounded-t-3xl bg-[#64748b] relative" />
              </div>
           </div>

           <div className="mt-12 inline-block rounded-full bg-gray-100 px-6 py-2 text-sm font-medium text-gray-500" style={{ transform: "translateZ(30px)" }}>
              Placeholder: Students exchanging books
           </div>
        </motion.div>

      </motion.div>
    </motion.div>
  )
}
