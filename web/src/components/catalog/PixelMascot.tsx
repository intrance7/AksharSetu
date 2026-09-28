"use client"

import React from "react"

const PIXEL_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'k': '#1D1B26', // Black
  's': '#FFB899', // Skin
  'w': '#FFFFFF',
  'r': '#C4420C', // Setu (Red/Orange)
  'g': '#0A7D4F', // Akshar (Green)
  'b': '#3B4CCA', // Pants
  'y': '#F4B22B', // Book Cover
  'o': '#0B8577', // Book Cover 2
}

// Akshar - Book Collector (Standing calmly, holding books)
const AKSHAR_SPRITE = [
  "....kkkk....",
  "...kssssk...",
  "...kswwsk...",
  "...kksskk...",
  "....kggk....",
  "...kggggk...",
  "..ksggggrk..",
  "...kbbbk.y..",
  "...kbbbk.o..",
  "...kb..bk...",
  "..kk....kk..",
  "............"
]

// Setu - The Book Stealer (Running/reaching pose)
const SETU_SPRITE = [
  ".....kkkk...",
  "....kksssk..",
  "....kssksk..",
  "....kkssk...",
  ".....krrkk..",
  "....krrrrk..",
  "...krrrkrss.",
  "...kbbbk....",
  "..kbbbk.....",
  "..kb..bk....",
  ".kk....kk...",
  "............"
]

export function PixelMascot({ 
  size = 4, 
  className = "", 
  type = "setu" 
}: { 
  size?: number, 
  className?: string,
  type?: "akshar" | "setu"
}) {
  const sprite = type === "akshar" ? AKSHAR_SPRITE : SETU_SPRITE

  return (
    <div 
      className={className}
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(12, 1fr)', 
        width: 12 * size, 
        height: 12 * size 
      }}
    >
      {sprite.map((row, r) => 
        row.split('').map((char, c) => (
          <div key={`${r}-${c}`} style={{ backgroundColor: PIXEL_PALETTE[char] || 'transparent' }} />
        ))
      )}
    </div>
  )
}
