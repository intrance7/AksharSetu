"use client"

import React from "react"

const PIXEL_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'k': '#1D1B26', // Black
  's': '#FFB899', // Skin
  'w': '#FFFFFF',
  'r': '#C4420C', // Runner Shirt
  'b': '#3B4CCA', // Pants
  'y': '#F4B22B', // Book Cover
}

const M_ARRANGE_1 = [
  "....kkkk....",
  "...kksssk...",
  "...kssksk...",
  "...kkssk....",
  "....krrkk...",
  "...krrrrk...",
  "...krrrkrss.",
  "...kbbbk.yy.",
  "...kbbbk.yy.",
  "...kb..bk...",
  "..kk....kk..",
  "............"
]

export function PixelMascot({ size = 4, className = "" }: { size?: number, className?: string }) {
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
      {M_ARRANGE_1.map((row, r) => 
        row.split('').map((char, c) => (
          <div key={`${r}-${c}`} style={{ backgroundColor: PIXEL_PALETTE[char] || 'transparent' }} />
        ))
      )}
    </div>
  )
}
