"use client"

import { useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

const floatingLetters = [
  { char: "अ", top: "15%", left: "15%", size: "text-5xl", delay: 0 },
  { char: "A", top: "25%", left: "80%", size: "text-4xl", delay: 0.2 },
  { char: "ज्ञान", top: "70%", left: "20%", size: "text-6xl", delay: 0.4 },
  { char: "Z", top: "65%", left: "75%", size: "text-5xl", delay: 0.1 },
  { char: "प", top: "40%", left: "10%", size: "text-3xl", delay: 0.5 },
  { char: "E", top: "35%", left: "85%", size: "text-4xl", delay: 0.3 },
  { char: "स", top: "85%", left: "15%", size: "text-4xl", delay: 0.6 },
  { char: "R", top: "80%", left: "85%", size: "text-3xl", delay: 0.2 },
  { char: "ख", top: "10%", left: "70%", size: "text-4xl", delay: 0.7 },
]

export function LoginHero3D() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smooth out the mouse values
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 })
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 })

  // Create parallax transforms
  const x1 = useTransform(smoothX, [-0.5, 0.5], [-20, 20])
  const y1 = useTransform(smoothY, [-0.5, 0.5], [-20, 20])
  
  const x2 = useTransform(smoothX, [-0.5, 0.5], [30, -30])
  const y2 = useTransform(smoothY, [-0.5, 0.5], [30, -30])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      mouseX.set(e.clientX / innerWidth - 0.5)
      mouseY.set(e.clientY / innerHeight - 0.5)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div className="relative w-full h-full bg-[#3e1700] overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video 
          src="/login-bg.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      </div>

      {/* Floating Letters Overlay (2.5D Parallax) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {floatingLetters.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute font-black text-[#FFD700] opacity-40 ${item.size}`}
            style={{ 
              top: item.top, 
              left: item.left,
              x: i % 2 === 0 ? x1 : x2,
              y: i % 2 === 0 ? y1 : y2,
            }}
            animate={{
              y: ["-10px", "10px", "-10px"],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: item.delay,
            }}
          >
            {item.char}
          </motion.div>
        ))}
      </div>

      {/* Main Typography Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 pointer-events-none">
        <motion.div
          style={{ x: x1, y: y1 }}
          className="text-center"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-6xl md:text-7xl lg:text-8xl font-black text-[#F2EBE1] tracking-tighter drop-shadow-2xl mb-4"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Unlimited <span className="text-[#FFD700]">ज्ञान.</span>
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#F2EBE1] tracking-tight drop-shadow-xl"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Zero distance.
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-12 w-24 h-1 bg-[#FFD700] mx-auto rounded-full shadow-lg"
          />
        </motion.div>
      </div>

      {/* Gradient Vignette overlay for depth */}
      <div className="absolute inset-0 z-30 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(62,23,0,0.3)_100%)]" />
    </div>
  )
}
