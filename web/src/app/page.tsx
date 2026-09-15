"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Heart, BookCopy } from "lucide-react"
import dynamic from "next/dynamic"

const WordUniverse = dynamic(() => import("@/components/3d/WordUniverse").then(mod => mod.WordUniverse), { ssr: false })

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent text-white">
      {/* Hero Section */}
      <section className="relative w-full h-screen min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
        <WordUniverse />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 flex flex-col items-center text-center px-4"
        >
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#f5f5f7] mb-2">AksharSetu.</h2>
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[120px] font-bold tracking-tighter leading-none mb-6">
            Pro knowledge.<br />Zero distance.
          </h1>
          <p className="text-lg md:text-2xl text-[#86868b] max-w-2xl font-medium tracking-tight mb-10">
            The smartest way to buy, sell, and donate used books.
          </p>
          <div className="flex flex-row items-center gap-6">
            <Link 
              href="/catalog" 
              className="bg-white text-black px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-200 transition-colors"
            >
              Browse Books
            </Link>
            <Link 
              href="/donate" 
              className="text-white text-lg hover:underline underline-offset-4 flex items-center group"
            >
              Learn more about donating <span className="ml-1 group-hover:translate-x-1 transition-transform">›</span>
            </Link>
          </div>
        </motion.div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white opacity-5 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* Features Section - Bento Box Style */}
      <section className="w-full bg-[#f5f5f7] text-[#1d1d1f] py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 md:mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Built for the community.</h2>
            <p className="text-xl md:text-2xl text-[#86868b] max-w-3xl mx-auto font-medium tracking-tight">
              A sustainable ecosystem for readers, students, and lifelong learners.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                className={`flex flex-col p-8 md:p-12 rounded-2xl bg-white shadow-sm overflow-hidden relative group ${feature.span}`}
              >
                <div className="mb-6 z-10">
                  <feature.icon className={`h-10 w-10 ${feature.iconColor}`} />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 z-10">{feature.title}</h3>
                <p className="text-lg text-[#86868b] font-medium leading-relaxed max-w-md z-10">
                  {feature.desc}
                </p>
                {/* Decorative background element for bento boxes */}
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-gray-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
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
    title: "Hyperlocal Discovery.",
    desc: "Find books in your own city or neighborhood. Meet up locally and save entirely on shipping costs.",
    iconColor: "text-blue-500",
    span: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: Heart,
    title: "Vidya Daan.",
    desc: "Donate your old books directly to students or NGOs. Earn digital badges and build community goodwill.",
    iconColor: "text-pink-500",
    span: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: BookCopy,
    title: "Bundle Listings.",
    desc: "Sell or donate an entire semester's worth of textbooks or a complete fiction series in one go.",
    iconColor: "text-purple-500",
    span: "md:col-span-1 md:col-start-1 lg:col-span-3",
  }
]
