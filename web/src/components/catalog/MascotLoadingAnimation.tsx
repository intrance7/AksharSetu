"use client"

import React, { useEffect, useRef } from "react"

interface MascotLoadingProps {
  radius?: number;
  speed?: number;
}

// ---------------------------------------------------------
// PIXEL ART ENGINE (Extracted from BookChaseAnimation)
// ---------------------------------------------------------
const PIXEL_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'k': '#1D1B26', // Black
  's': '#FFB899', // Skin
  'w': '#FFFFFF',
  'r': '#C4420C', // Runner Shirt
  'b': '#3B4CCA', // Pants
  'y': '#F4B22B', // Book Cover
}

// 12x12 Mascot Sprites facing RIGHT
const M_ARRANGE_1 = [
  "....kkkk....",
  "...kksssk...",
  "...kssksk...",
  "...kkssk....",
  "....krrkk...",
  "...krrrrk...",
  "...krrrkrss.", // reaching forward and down
  "...kbbbk.yy.",
  "...kbbbk.yy.",
  "...kb..bk...",
  "..kk....kk..",
  "............"
]

const M_ARRANGE_2 = [
  "....kkkk....",
  "...kksssk...",
  "...kssksk...",
  "...kkssk....",
  "....krrkk...",
  "...krrrrk...",
  "...krrrrssyy", // holding straight out
  "...kbbbbk.yy",
  "...kbbbbk...",
  "...kb..bk...",
  "..kk....kk..",
  "............"
]

const M_ARRANGE_3 = [
  "....kkkk....",
  "...kksssk...",
  "...kssksk...",
  "...kkssk....",
  "....krrkkyy.", // holding high
  "...krrrrksyy", 
  "...krrrrk...", 
  "...kbbbbk...",
  "...kbbbbk...",
  "...kb..bk...",
  "..kk....kk..",
  "............"
]

const M_ARRANGE_4 = [
  "....kkkk....",
  "...kksssk...",
  "...kssksk...",
  "...kkssk....",
  "....krrkk...",
  "...krrrrk...",
  "...krrrrss..", // empty hand resting
  "...kbbbbk...",
  "...kbbbbk...",
  "...kb..bk...",
  "..kk....kk..",
  "............"
]

export function MascotLoadingAnimation({ radius = 60, speed = 2 }: MascotLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pixelSize = 6;
    
    const resize = () => {
      if (!canvas.parentElement) return
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = 240 
      ctx.imageSmoothingEnabled = false
    }
    window.addEventListener('resize', resize)
    resize()

    let lastTime = performance.now();
    let animationId: number;
    let frameTime = 0; // tracking time in seconds

    const drawSprite = (sprite: string[], x: number, y: number, flip: boolean) => {
      const rows = sprite.length;
      const cols = sprite[0].length;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const char = sprite[r][c]
          if (char !== '.') {
            ctx.fillStyle = PIXEL_PALETTE[char] || '#000'
            const drawX = flip ? (x + (cols - 1 - c) * pixelSize) : (x + c * pixelSize)
            ctx.fillRect(drawX, y + r * pixelSize, pixelSize, pixelSize)
          }
        }
      }
    }

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); 
      lastTime = time;
      frameTime += dt * speed; // Speed up the animation based on prop
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const floorY = canvas.height - 40;
      const shelfX = Math.floor(canvas.width / 2 / pixelSize) * pixelSize; // Center aligned to pixel
      const shelfW = 240;
      const shelfH = 180;
      const shelfY = floorY - shelfH;
      const targetShelfY = shelfY + 120;

      const mascotX = shelfX - 50;
      const mascotY = targetShelfY - 48; // Position hand to line up with target shelf

      // 1. Draw Room (Background)
      ctx.fillStyle = '#2C3E50'; // Wall
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3E2723'; // Floor
      ctx.fillRect(0, floorY, canvas.width, 40);

      // 2. Draw Bookshelf
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(shelfX, shelfY, shelfW, shelfH);
      
      ctx.fillStyle = '#8D6E63';
      for (let y = shelfY + 60; y < floorY; y += 60) {
          ctx.fillRect(shelfX + 12, y, shelfW - 24, 6);
      }

      // Helper to draw books
      const drawBook = (x: number, y: number, color: string, height: number, width: number = 12, isHorizontal: boolean = false) => {
          ctx.fillStyle = color;
          ctx.fillRect(x, y - height, width, height);
          ctx.fillStyle = 'rgba(255,255,255,0.2)'; // book highlight
          if (isHorizontal) {
              ctx.fillRect(x, y - height, width, 2); // Highlight along top cover
          } else {
              ctx.fillRect(x, y - height, 4, height); // Highlight along spine
          }
      }
      
      // Draw static books on the top shelf
      let bx = shelfX + 24;
      let staticIndex = 100; // Start at arbitrary index for static books
      while (bx < shelfX + shelfW - 36) {
          // Exclude blue so the active loading shelf stands out!
          const colors = ['#E53935', '#43A047', '#FDD835', '#8E24AA', '#FF9800'];
          const colorHash = Math.sin(staticIndex * 137.54) * 1000;
          const color = colors[Math.floor(Math.abs(colorHash)) % colors.length];
          
          const lengthHash = Math.cos(staticIndex * 53.123) * 1000;
          const length = 24 + (Math.floor(Math.abs(lengthHash)) % 14);

          drawBook(bx, shelfY + 60, color, length, 10, false);
          bx += 12;
          staticIndex++;
      }

      // Calculate animation state
      const cycleTime = frameTime % 2; // 2 seconds per book
      const placed = Math.floor(frameTime / 2) % 12; // 12 books total to place before looping
      
      // Helper to generate a gradient color for the active books (Acts as a Loading Bar!)
      const getBookColor = (index: number) => {
         // Cobalt Blue (Hue 210), transitioning from light (85%) to dark (35%) across the 12 books
         const lightness = 85 - (index / 11) * 50;
         return `hsl(210, 90%, ${lightness}%)`;
      }

      // Helper to generate a consistent random length for books
      const getBookLength = (index: number) => {
         // Progressive length from 20px (lightest/first) to 36px (darkest/last)
         // This creates a physical "bar chart" loading effect!
         return 20 + Math.floor((index / 11) * 16);
      }

      // Dynamically update the mascot's book sprite color
      PIXEL_PALETTE['y'] = getBookColor(placed);

      // Draw placed books on the target shelf
      for (let i = 0; i < placed; i++) {
          const length = getBookLength(i);
          drawBook(shelfX + 24 + i * 12, targetShelfY, getBookColor(i), length, 10, false);
      }
      
      // Draw book pile on the floor (behind mascot)
      const pileX = mascotX - 30;
      const pileY = floorY;
      
      let currentRemaining = 12 - placed;
      if (cycleTime >= 0.5) currentRemaining -= 1; // He picked one up!

      for (let i = 0; i < currentRemaining; i++) {
          // Bottom of the pile is book index 11, top is 0
          const bookIndex = 11 - i; 
          const length = getBookLength(bookIndex);
          
          // Add a messy offset so it looks like a natural stack rather than a perfect pyramid
          const messyHash = Math.sin(bookIndex * 21.3) * 10;
          const messyOffset = Math.floor(messyHash % 6); // Offset between -5 and +5 pixels
          
          const offsetX = (36 - length) / 2 + messyOffset; 
          drawBook(pileX + offsetX, pileY - i * 8, getBookColor(bookIndex), 8, length, true);
      }

      // If he just placed a book, draw it manually on the shelf for the rest of the cycle
      if (cycleTime >= 1.5) {
          const length = getBookLength(placed);
          drawBook(shelfX + 24 + placed * 12, targetShelfY, getBookColor(placed), length, 10, false);
      }

      // 3. Draw Stool
      const stoolY = floorY - 24;
      ctx.fillStyle = '#A1887F';
      ctx.fillRect(mascotX + 12, stoolY, 48, 6); // top
      ctx.fillRect(mascotX + 18, stoolY + 6, 6, 18); // leg left
      ctx.fillRect(mascotX + 48, stoolY + 6, 6, 18); // leg right
      
      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(mascotX + 6, floorY - 6, 60, 6);

      // 4. Draw Mascot
      let sprite = M_ARRANGE_1;
      
      if (cycleTime < 0.5) {
          sprite = M_ARRANGE_1; // Reaching down to pick up
      } else if (cycleTime < 1.0) {
          sprite = M_ARRANGE_2; // Holding in front
      } else if (cycleTime < 1.5) {
          sprite = M_ARRANGE_3; // Placing high on shelf
      } else {
          sprite = M_ARRANGE_4; // Arm resting empty
      }

      drawSprite(sprite, mascotX, mascotY, false);

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [radius, speed])

  return (
    <div ref={containerRef} className="w-full relative py-4 flex justify-center items-center rounded-3xl overflow-hidden border border-[#1D1D1F]/5 bg-white shadow-sm">
      <canvas 
        ref={canvasRef} 
        className="block" 
        style={{ width: '100%', height: '240px', imageRendering: 'pixelated' }}
      />
    </div>
  )
}
