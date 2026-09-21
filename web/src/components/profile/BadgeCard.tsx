"use client"

import { motion } from "framer-motion"

interface Badge {
  id: string
  name: string
  description: string
  iconUrl: string
}

interface BadgeCardProps {
  badge: Badge
  earned?: boolean
  earnedAt?: Date
  size?: "small" | "large"
}

export function BadgeCard({ badge, earned = true, earnedAt, size = "small" }: BadgeCardProps) {
  const isLarge = size === "large"
  
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative rounded-[2rem] border overflow-hidden ${
        earned 
          ? "bg-[#1D1D1F] border-white/10 shadow-xl" 
          : "bg-white border-[#1D1D1F]/5 shadow-sm opacity-70 grayscale"
      } ${isLarge ? "p-8" : "p-4 flex items-center gap-4"}`}
    >
      {/* Background Glow (only if earned) */}
      {earned && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 flex items-center justify-center rounded-full bg-white shadow-inner ${
        isLarge ? "w-24 h-24 text-5xl mb-6 mx-auto" : "w-14 h-14 text-2xl"
      }`}>
        {badge.iconUrl}
      </div>

      {/* Content */}
      <div className={isLarge ? "text-center" : "flex-1"}>
        <h3 className={`font-black tracking-tight ${
          earned ? "text-white" : "text-[#1D1D1F]"
        } ${isLarge ? "text-2xl mb-2" : "text-base"}`}>
          {badge.name}
        </h3>
        
        <p className={`font-medium ${
          earned ? "text-white/60" : "text-[#1D1D1F]/60"
        } ${isLarge ? "text-sm" : "text-xs"}`}>
          {badge.description}
        </p>

        {earned && earnedAt && isLarge && (
          <div className="mt-6 inline-block bg-white/10 px-4 py-2 rounded-full border border-white/5">
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
              Earned on {new Date(earnedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
