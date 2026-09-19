"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Runner {
  id: string;
  direction: 1 | -1; // 1 = Left to Right, -1 = Right to Left
  duration: number; // random speed
}

export function CatalogRunners() {
  const [runners, setRunners] = useState<Runner[]>([])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const spawnRunner = () => {
      const duration = 12 + Math.random() * 15 // Random speed between 12s and 27s
      const newRunner: Runner = {
        id: Math.random().toString(36).substring(7),
        direction: Math.random() > 0.5 ? 1 : -1,
        duration: duration,
      }
      
      setRunners(prev => [...prev, newRunner])

      // Despawn after animation completes (+ a little buffer)
      setTimeout(() => {
        setRunners(prev => prev.filter(r => r.id !== newRunner.id))
      }, (duration + 2) * 1000)

      // Schedule next spawn randomly between 3s and 12s
      timeoutId = setTimeout(spawnRunner, 3000 + Math.random() * 9000)
    }

    // Start first spawn after a short delay
    timeoutId = setTimeout(spawnRunner, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="absolute left-0 right-0 bottom-[26px] h-[40px] overflow-hidden pointer-events-none z-10 opacity-80 mix-blend-screen">
      <AnimatePresence>
        {runners.map(runner => (
          <motion.div
            key={runner.id}
            initial={{ x: runner.direction === 1 ? "-20vw" : "120vw" }}
            animate={{ x: runner.direction === 1 ? "120vw" : "-20vw" }}
            transition={{ duration: runner.duration, ease: "linear" }}
            className="absolute top-0 flex items-center gap-6"
          >
            {runner.direction === 1 ? (
              // Running Left to Right (Image needs to be flipped to face right)
              <img 
                src="/runner.jpg" 
                alt="Runner" 
                className="h-10 w-10 object-cover scale-x-[-1] rounded-full mix-blend-color-burn" 
                style={{ imageRendering: "pixelated", filter: "contrast(1.5)" }}
              />
            ) : (
              // Running Right to Left (Image faces left naturally)
              <img 
                src="/runner.jpg" 
                alt="Runner" 
                className="h-10 w-10 object-cover rounded-full mix-blend-color-burn" 
                style={{ imageRendering: "pixelated", filter: "contrast(1.5)" }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
