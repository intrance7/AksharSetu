"use client"

import React, { useEffect, useRef } from "react"
import { useScroll } from "framer-motion"

interface BookChaseProps {
  chaseDistance?: number;
  speed?: number;
}

// ---------------------------------------------------------
// PIXEL ART ENGINE
// ---------------------------------------------------------
const PIXEL_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'k': '#1D1B26',
  's': '#FFB899',
  'w': '#FFFFFF',
  'r': '#C4420C', // Runner
  'b': '#3B4CCA', // Pants
  'y': '#F4B22B', // Book Cover
  'g': '#0B8577', // Chaser
  'q': '#F4B22B', // Question/Alert
}

// Runner Frames (With Book)
const R_IDLE = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....krrk....",
  "...krrkyywk.",
  "...krrkyywk.",
  "....kbbk....",
  "....kkkk....",
  "....k..k....",
  "...kk..kk...",
  "............"
]
const R_RUN_1 = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "...kkrrk....",
  "..k.krrkyywk",
  "..k.krrkyywk",
  "....kbbk....",
  "...kk..k....",
  "...k...kk...",
  "..kk....k...",
  "............"
]
const R_RUN_2 = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "...kkrrk....",
  "..k.krrkyywk",
  "..k.krrkyywk",
  "....kbbkk...",
  ".....kk..k..",
  "....kk...k..",
  "....k.......",
  "............"
]
const R_SNEAK = [
  "............",
  "............",
  "....kkkk....",
  "...kksssk...",
  "...ksskks...",
  "...kksssk...",
  "...k.krrk...",
  "....krrkyywk",
  "...kkrrkyywk",
  "...kbbbbk...",
  "..kk.kk.kk..",
  "............"
]
const R_PANIC = [
  "....kkkk....",
  "...kssskk...",
  ".k.kskssk.k.",
  ".k..ksskk..k",
  "kk..krrk..kk",
  "k..kyywkk.k.",
  "..k.rrrr.k..",
  "....kbbk....",
  "....kkkk....",
  "....k..k....",
  "...kk..kk...",
  "............"
]
const R_HIDE = [
  "............",
  "............",
  "............",
  "............",
  "....kkkk....",
  "...kyyywk...",
  "...kyyywk...",
  "...kyyywk...",
  "....krrk....",
  "....kbbk....",
  "...kk..kk...",
  "............"
]
const R_TRIP = [
  "............",
  "............",
  "............",
  "............",
  "............",
  "............",
  ".....kkkk...",
  "....ksssskk.",
  "...kkrrs.s.k",
  "..kkyywkrrkk",
  ".kbbbbbbbkk.",
  "............"
]
const R_READ = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....krrk....",
  "...kyw.wk...",
  "...kywwwk...",
  "....kbbk....",
  "....kkkk....",
  "....k..k....",
  "...kk..kk...",
  "............"
]

// Runner Frames (Without Book)
const R_N_IDLE = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....krrk....",
  "...kkrrkk...",
  "...k.rr.k...",
  "....kbbk....",
  "....kkkk....",
  "....k..k....",
  "...kk..kk...",
  "............"
]
const R_N_RUN_1 = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "...kkrrk....",
  "..kk.rr.kk..",
  "..k.krrk.k..",
  "....kbbk....",
  "...kk..k....",
  "...k...kk...",
  "..kk....k...",
  "............"
]
const R_N_RUN_2 = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "...kkrrk....",
  "..kk.rr.kk..",
  "..k.krrk.k..",
  "....kbbkk...",
  ".....kk..k..",
  "....kk...k..",
  "....k.......",
  "............"
]

// Chaser Frames
const C_IDLE = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....kggk....",
  "...kkggkk...",
  "...k.gg.k...",
  "....kbbk....",
  "....kkkk....",
  "....k..k....",
  "...kk..kk...",
  "............"
]
const C_RUN_1 = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....kggk....",
  "...k.gg.k...",
  "...k.gg.k...",
  "....kbbk....",
  "...kk..k....",
  "...k...kk...",
  "..kk....k...",
  "............"
]
const C_RUN_2 = [
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....kggk....",
  "...kkggkk...",
  "...k.gg.k...",
  "....kbbkk...",
  ".....kk..k..",
  "....kk...k..",
  "....k.......",
  "............"
]
const C_CONFUSED = [
  ".....qq.....",
  "....q..q....",
  "......q.....",
  ".....q......",
  "............",
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....kggk....",
  "...kkggkk...",
  "............"
]
const C_SURPRISE = [
  ".....qq.....",
  ".....qq.....",
  ".....qq.....",
  "............",
  ".....qq.....",
  "....kkkk....",
  "...kssskk...",
  "...kskssk...",
  "....ksskk...",
  "....kggk....",
  "...kkggkk...",
  "............"
]
const C_TRIP = [
  "............",
  "............",
  "............",
  "............",
  "............",
  "............",
  ".....kkkk...",
  "....ksssskk.",
  "...kkggs.s.k",
  "..kk.ggkggkk",
  ".kbbbbbbbkk.",
  "............"
]

const BOOK_PROP = [
  "............",
  "............",
  "............",
  "............",
  "............",
  "............",
  "............",
  "............",
  ".....kk.....",
  "....kyyk....",
  "....kwwk....",
  ".....kk....."
]

// ---------------------------------------------------------
// STATE MACHINE
// ---------------------------------------------------------

type SequenceType = 'NONE' | 'SNEAK_POINT' | 'STARE_DOWN' | 'FUMBLE' | 'TRIP_R' | 'TRIP_C' | 'HIDE' | 'READ' | 'SPRINT' | 'DRAGGED';

class Entity {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  isFacingLeft: boolean = false;
  hasBook: boolean = true;
  frameTime: number = 0;
  
  // Logical state for rendering
  animState: 'IDLE' | 'RUN' | 'SNEAK' | 'PANIC' | 'HIDE' | 'TRIP' | 'READ' | 'CONFUSED' | 'SURPRISE' = 'IDLE';
}

export function BookChaseAnimation({ chaseDistance = 120, speed = 2.5 }: BookChaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pixelSize = 6;
    const padding = 100;
    
    const resize = () => {
      if (!canvas.parentElement) return
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = 160 
      ctx.imageSmoothingEnabled = false
    }
    window.addEventListener('resize', resize)
    resize()

    const runner = new Entity()
    const chaser = new Entity()
    runner.x = -200;
    chaser.x = -400;
    runner.y = 78;
    chaser.y = 78;
    
    type MasterState = 'OFF_SCREEN' | 'PEEKING' | 'ROAMING' | 'EXITING';
    let masterState: MasterState = 'OFF_SCREEN';
    let masterTimer = 5; // initial 2 second wait before first spawn
    let spawnFromLeft = true;
    let globalTargetX = 0;

    // Sequence State
    let activeSeq: SequenceType = 'NONE';
    let seqPhase = 0;
    let seqTimer = 0;
    let nextRandomEventTimer = 2 + Math.random() * 5;
    
    // Props
    const bookProp = { x: 0, y: 78, active: false };
    
    // Mouse Tracking
    const mouseState = { x: -1, y: -1, clickR: false, clickC: false };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // scale coordinates to internal canvas resolution
      const scaleY = canvas.height / rect.height;
      mouseState.x = e.clientX - rect.left; 
      mouseState.y = (e.clientY - rect.top) * scaleY;
    }
    const handleMouseDown = (e: MouseEvent) => {
      // 72px is character width/height
      if (mouseState.x > runner.x && mouseState.x < runner.x + 72 && mouseState.y > runner.y && mouseState.y < runner.y + 72) mouseState.clickR = true;
      if (mouseState.x > chaser.x && mouseState.x < chaser.x + 72 && mouseState.y > chaser.y && mouseState.y < chaser.y + 72) mouseState.clickC = true;
    }
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    let lastTime = performance.now();
    let animationId: number;

    const drawSprite = (sprite: string[], x: number, y: number, flip: boolean) => {
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const char = sprite[r][c]
          if (char !== '.') {
            ctx.fillStyle = PIXEL_PALETTE[char] || '#000'
            const drawX = flip ? (x + (11 - c) * pixelSize) : (x + c * pixelSize)
            ctx.fillRect(drawX, y + r * pixelSize, pixelSize, pixelSize)
          }
        }
      }
    }

      const startRandomEvent = () => {
      if (activeSeq !== 'NONE') return;
      const r = Math.random();
      if (r < 0.15) activeSeq = 'FUMBLE';
      else if (r < 0.3) activeSeq = 'STARE_DOWN';
      else if (r < 0.45) activeSeq = 'HIDE';
      else if (r < 0.55) activeSeq = 'READ';
      else if (r < 0.65) activeSeq = 'TRIP_R';
      else if (r < 0.75) activeSeq = 'TRIP_C';
      else if (r < 0.85) activeSeq = 'SPRINT';
      else activeSeq = 'DRAGGED';
      
      seqPhase = 0;
      seqTimer = 0;
    }

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // cap dt
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // =========================================================
      // MASTER STATE CONTROLLER
      // =========================================================
      
      if (masterState === 'OFF_SCREEN') {
         masterTimer -= dt;
         if (masterTimer <= 0) {
            spawnFromLeft = Math.random() > 0.5;
            runner.x = spawnFromLeft ? -100 : canvas.width + 100;
            chaser.x = spawnFromLeft ? -300 : canvas.width + 300;
            
            if (Math.random() < 0.4) {
               // 40% chance to do the choreographed peeking sequence
               masterState = 'PEEKING';
               seqPhase = 0;
               seqTimer = 0;
            } else {
               // 60% chance to just run directly onto the screen without stopping
               masterState = 'ROAMING';
               masterTimer = 5 + Math.random() * 25; // Roam for 5-30 seconds
               activeSeq = 'NONE';
               nextRandomEventTimer = 2 + Math.random() * 5;
               globalTargetX = padding + Math.random() * (canvas.width - padding * 2);
            }
         }
      } else if (masterState === 'PEEKING') {
         const peekX = spawnFromLeft ? 0 : canvas.width - 72; // Character is 72px wide
         
         if (seqPhase === 0) {
            // Runner runs to edge
            globalTargetX = peekX;
            if (Math.abs(runner.x - peekX) < 5) {
               seqPhase = 1;
               seqTimer = 0;
            }
         } else if (seqPhase === 1) {
            // Runner sneaks and looks around
            globalTargetX = runner.x; // stop
            runner.animState = 'SNEAK';
            runner.isFacingLeft = seqTimer % 1.0 > 0.5; // toggle looking left/right
            seqTimer += dt;
            if (seqTimer > 2.0) {
               if (Math.random() < 0.3) {
                  seqPhase = 5; // 30% chance to chicken out!
               } else {
                  seqPhase = 2;
               }
            }
         } else if (seqPhase === 5) {
            // Runner chickens out and sneaks back off screen
            globalTargetX = spawnFromLeft ? -100 : canvas.width + 100;
            runner.animState = 'SNEAK';
            runner.isFacingLeft = !spawnFromLeft; 
            if (Math.abs(runner.x - globalTargetX) < 5) {
               masterState = 'OFF_SCREEN';
               masterTimer = 2 + Math.random() * 18; // wait 2-20s
            }
         } else if (seqPhase === 2) {
            // Runner enters fully
            globalTargetX = spawnFromLeft ? 200 : canvas.width - 200;
            if (Math.abs(runner.x - globalTargetX) < 5) {
               seqPhase = 3;
            }
         } else if (seqPhase === 3) {
            // Chaser runs to edge
            globalTargetX = runner.x; // Runner waits
            runner.animState = 'IDLE';
            runner.isFacingLeft = !spawnFromLeft; // Look back at edge
            
            // Override chaser target explicitly
            const cPeekX = spawnFromLeft ? 0 : canvas.width - 72;
            if (Math.abs(chaser.x - cPeekX) > 5) {
               const dx = cPeekX - chaser.x;
               chaser.x += Math.min(Math.abs(dx), speed * 60 * dt) * Math.sign(dx);
               chaser.animState = 'RUN';
               chaser.isFacingLeft = dx < 0;
            } else {
               seqPhase = 4;
               seqTimer = 0;
            }
         } else if (seqPhase === 4) {
            // Chaser sees runner, is surprised
            chaser.animState = 'SURPRISE';
            runner.animState = 'PANIC';
            seqTimer += dt;
            if (seqTimer > 1.0) {
               masterState = 'ROAMING';
               masterTimer = 5 + Math.random() * 25; // Roam for 5-30 seconds
               activeSeq = 'NONE';
               nextRandomEventTimer = 3;
               // Pick a random target to start roaming
               globalTargetX = padding + Math.random() * (canvas.width - padding * 2);
            }
         }
      } else if (masterState === 'ROAMING') {
         masterTimer -= dt;
         if (masterTimer <= 0 && activeSeq === 'NONE') {
            masterState = 'EXITING';
            globalTargetX = Math.random() > 0.5 ? canvas.width + 500 : -500;
         } else if (activeSeq === 'NONE') {
            // Randomly change roaming target occasionally
            if (Math.abs(runner.x - globalTargetX) < 10) {
               if (Math.random() > 0.98) { // 2% chance per frame to pick new target if idle
                  globalTargetX = padding + Math.random() * (canvas.width - padding * 2);
               }
            }
         }
      } else if (masterState === 'EXITING') {
         // Target is far off screen. Once both are off screen, reset to OFF_SCREEN
         const isOff = (x: number) => x < -100 || x > canvas.width + 100;
         if (isOff(runner.x) && isOff(chaser.x)) {
            masterState = 'OFF_SCREEN';
            masterTimer = 2 + Math.random() * 18; // wait 2-20 seconds
         }
      }

      // Calculate base targets
      const targetX = globalTargetX;

      // Update Random Event Timer only if ROAMING
      if (masterState === 'ROAMING' && activeSeq === 'NONE') {
        nextRandomEventTimer -= dt;
        if (nextRandomEventTimer <= 0) {
           startRandomEvent();
        }
      }

      // =========================================================
      // BEHAVIOR CONTROLLER (Only applies to active sequences)
      // =========================================================
      
      // Default Autopilot overrides
      let rTargetX = targetX;
      let cTargetX = runner.x - (runner.isFacingLeft ? -chaseDistance : chaseDistance);
      let rSpeedMultiplier = 1;
      let cSpeedMultiplier = 1;

      if (masterState === 'OFF_SCREEN') {
         rTargetX = runner.x;
         cTargetX = chaser.x;
      }

      // Reset animation overrides
      if (masterState !== 'PEEKING') {
        runner.animState = 'RUN';
        chaser.animState = 'RUN';
      }

      // We only run sequence overrides if ROAMING
      if (masterState === 'ROAMING' || masterState === 'EXITING') {
         switch (activeSeq) {
        
        case 'NONE':
          // Standard chase behavior
          if (Math.abs(targetX - runner.x) < 2) {
            runner.animState = 'IDLE';
          }
          if (Math.abs(cTargetX - chaser.x) < 2) {
            chaser.animState = 'IDLE';
          }
          // Dynamic tension: if chaser is very close, runner panics and speeds up
          if (runner.x - chaser.x < chaseDistance * 0.5 && Math.abs(targetX - runner.x) > 5) {
            runner.animState = 'PANIC';
            rSpeedMultiplier = 1.3;
          }
          break;



        case 'FUMBLE':
          if (seqPhase === 0) {
             // Drop book
             bookProp.active = true;
             bookProp.x = runner.x - 20;
             runner.hasBook = false;
             runner.animState = 'SURPRISE'; // Reusing surprise logic via IDLE override later
             rTargetX = runner.x + 40; // Run a bit forward empty handed
             cTargetX = chaser.x; // Chaser stops
             chaser.animState = 'SURPRISE';
             seqPhase = 1;
             seqTimer = 0;
          } else if (seqPhase === 1) {
             rTargetX = runner.x; // stop
             runner.animState = 'PANIC';
             runner.isFacingLeft = true;
             cTargetX = bookProp.x - 30; // Chaser approaches book
             seqTimer += dt;
             if (seqTimer > 1.0) {
                seqPhase = 2; // Runner rushes back
             }
          } else if (seqPhase === 2) {
             rTargetX = bookProp.x;
             rSpeedMultiplier = 2.0;
             runner.isFacingLeft = true;
             cTargetX = bookProp.x - 30; 
             chaser.animState = 'CONFUSED';
             if (Math.abs(runner.x - bookProp.x) < 5) {
                // Grabbed it
                runner.hasBook = true;
                bookProp.active = false;
                seqPhase = 3;
                seqTimer = 0;
             }
          } else if (seqPhase === 3) {
             rTargetX = runner.x;
             runner.animState = 'SNEAK';
             runner.isFacingLeft = false;
             cTargetX = chaser.x;
             chaser.animState = 'IDLE';
             seqTimer += dt;
             if (seqTimer > 0.5) {
                activeSeq = 'NONE';
                nextRandomEventTimer = 5 + Math.random() * 5;
             }
          }
          break;

        case 'STARE_DOWN':
          rTargetX = runner.x;
          cTargetX = runner.x - 60; // Get close
          runner.isFacingLeft = true;
          
          if (Math.abs(cTargetX - chaser.x) > 2) {
             runner.animState = 'SNEAK';
          } else {
             runner.animState = 'IDLE';
             chaser.animState = 'IDLE';
             seqTimer += dt;
             if (seqTimer > 2.0) {
                activeSeq = 'NONE';
                nextRandomEventTimer = 5 + Math.random() * 5;
                runner.isFacingLeft = false;
             }
          }
          break;

        case 'HIDE':
          rTargetX = runner.x;
          runner.animState = 'HIDE';
          cTargetX = runner.x - 30; // Chaser walks right up to hiding spot
          if (Math.abs(cTargetX - chaser.x) < 2) {
             chaser.animState = 'CONFUSED';
             seqTimer += dt;
             if (seqTimer > 2.5) {
                activeSeq = 'NONE';
                nextRandomEventTimer = 5 + Math.random() * 5;
             }
          }
          break;

        case 'READ':
          rTargetX = runner.x;
          runner.animState = 'READ';
          cTargetX = chaser.x; // Chaser halts
          chaser.animState = 'CONFUSED';
          seqTimer += dt;
          if (seqTimer > 2.0) {
             activeSeq = 'NONE';
             nextRandomEventTimer = 5 + Math.random() * 5;
          }
          break;

        case 'TRIP_R':
          rTargetX = runner.x;
          runner.animState = 'TRIP';
          cTargetX = runner.x - 40; // Chaser catches up
          if (Math.abs(cTargetX - chaser.x) < 2) chaser.animState = 'SURPRISE';
          seqTimer += dt;
          if (seqTimer > 1.5) {
             activeSeq = 'NONE';
             nextRandomEventTimer = 5 + Math.random() * 5;
          }
          break;
          
        case 'TRIP_C':
          const tripDir = runner.isFacingLeft ? -1 : 1;
          rTargetX = runner.x + tripDir * 100; // Runner keeps going a bit
          cTargetX = chaser.x;
          chaser.animState = 'TRIP';
          
          seqTimer += dt;
          if (seqTimer > 0.8) {
             runner.animState = 'SNEAK';
             runner.isFacingLeft = tripDir > 0; // Look back at the chaser
          }
          if (seqTimer > 2.0) {
             activeSeq = 'NONE';
             nextRandomEventTimer = 5 + Math.random() * 5;
          }
          break;

        case 'SPRINT':
          // Runner runs extremely fast forward. Chaser tries to catch up.
          const sprintDir = runner.isFacingLeft ? -1 : 1;
          rTargetX = runner.x + sprintDir * 300;
          cTargetX = runner.x - sprintDir * chaseDistance;
          rSpeedMultiplier = 3.0; // zoom!
          cSpeedMultiplier = 1.5; // chaser struggles to keep up
          runner.animState = 'PANIC'; // look funny while sprinting
          seqTimer += dt;
          if (seqTimer > 1.5) {
             activeSeq = 'NONE';
             nextRandomEventTimer = 5 + Math.random() * 5;
          }
          break;

        case 'DRAGGED':
          // Chaser ropes Runner and drags him back.
          if (seqPhase === 0) {
             // Runner trips
             rTargetX = runner.x;
             runner.animState = 'TRIP';
             cTargetX = runner.x - (runner.isFacingLeft ? -chaseDistance : chaseDistance); // Chaser stays back
             chaser.animState = 'IDLE';
             seqTimer += dt;
             if (seqTimer > 1.0) {
                seqPhase = 1;
                seqTimer = 0;
             }
          } else if (seqPhase === 1) {
             // Drag backward
             const dragDir = runner.isFacingLeft ? -1 : 1;
             cTargetX = chaser.x - dragDir * 150; // Chaser walks backwards
             rTargetX = chaser.x + dragDir * 40; // Runner pulled towards Chaser
             cSpeedMultiplier = 1.5; // Drag speed
             rSpeedMultiplier = 1.5;
             chaser.animState = 'RUN';
             chaser.isFacingLeft = dragDir > 0; // walking backwards
             runner.animState = 'TRIP'; // being dragged on face
             runner.isFacingLeft = dragDir < 0; // face down, pulled from behind
             
             seqTimer += dt;
             if (seqTimer > 1.5) {
                seqTimer = 0;
                seqPhase = 2;
             }
          } else if (seqPhase === 2) {
             // Let go, runner gets up and sprints away
             runner.animState = 'PANIC';
             const runDir = chaser.isFacingLeft ? 1 : -1;
             rTargetX = runner.x + runDir * 200;
             cTargetX = chaser.x;
             rSpeedMultiplier = 2.0;
             seqTimer += dt;
             if (seqTimer > 1.5) {
                activeSeq = 'NONE';
                nextRandomEventTimer = 5 + Math.random() * 5;
             }
          }
          break;
      }
      } // end masterState block

      // =========================================================
      // PHYSICS & MOVEMENT
      // =========================================================
      const moveEntity = (ent: Entity, target: number, maxSpeed: number) => {
        if (masterState === 'PEEKING' && ent === chaser && seqPhase < 5) return; // handled manually

        const dx = target - ent.x;
        if (Math.abs(dx) > 1) {
          const s = maxSpeed * 60 * dt;
          const v = Math.min(Math.abs(dx), s) * Math.sign(dx);
          ent.x += v;
          ent.vx = v;
          if (ent.animState === 'RUN' || ent.animState === 'PANIC') {
             ent.isFacingLeft = dx < 0;
          }
        } else {
          ent.vx = 0;
          if (ent.animState === 'RUN' || ent.animState === 'PANIC') ent.animState = 'IDLE';
        }
      };

      const applyGravity = (ent: Entity) => {
         ent.vy += 1200 * dt; // gravity
         ent.y += ent.vy * dt;
         if (ent.y > 78) {
            ent.y = 78;
            ent.vy = 0;
         }
      }

      moveEntity(runner, rTargetX, speed * rSpeedMultiplier);
      moveEntity(chaser, cTargetX, (speed * 0.95) * cSpeedMultiplier);

      applyGravity(runner);
      applyGravity(chaser);

      runner.frameTime += dt * (runner.animState === 'PANIC' ? 12 : 8);
      chaser.frameTime += dt * 8;

      // =========================================================
      // MOUSE INTERACTIONS
      // =========================================================
      let rHover = mouseState.x > runner.x && mouseState.x < runner.x + 72 && mouseState.y > runner.y && mouseState.y < runner.y + 72;
      let cHover = mouseState.x > chaser.x && mouseState.x < chaser.x + 72 && mouseState.y > chaser.y && mouseState.y < chaser.y + 72;
      
      if (rHover || cHover) canvas.style.cursor = 'pointer';
      else canvas.style.cursor = 'default';

      // Hover overrides (visual only)
      if (rHover) runner.animState = 'PANIC';
      if (cHover) chaser.animState = 'SURPRISE';

      // Click Jump
      if (mouseState.clickR && runner.y >= 78) {
         runner.vy = -350;
         runner.animState = 'PANIC';
      }
      if (mouseState.clickC && chaser.y >= 78) {
         chaser.vy = -350;
         chaser.animState = 'SURPRISE';
      }
      mouseState.clickR = false;
      mouseState.clickC = false;

      // =========================================================
      // RENDERING
      // =========================================================
      
      // Ground
      ctx.fillStyle = '#E4DAC0'; 
      ctx.fillRect(0, 150, canvas.width, 2);

      // Book Prop
      if (bookProp.active) {
        drawSprite(BOOK_PROP, bookProp.x, bookProp.y, false);
      }

      // Rope for DRAGGED state
      if (activeSeq === 'DRAGGED' && seqPhase === 1) {
         ctx.strokeStyle = '#F4B22B'; // Marigold color rope
         ctx.lineWidth = 2;
         ctx.beginPath();
         // Chaser hands
         ctx.moveTo(chaser.x + 36, chaser.y + 42);
         // Runner legs
         ctx.lineTo(runner.x + 12, runner.y + 60);
         ctx.stroke();
      }

      // Runner Rendering
      let rSprite = runner.hasBook ? R_IDLE : R_N_IDLE;
      let rBob = 0;
      
      if (runner.animState === 'RUN' || runner.animState === 'PANIC') {
        const isFrame2 = Math.floor(runner.frameTime) % 2 === 0;
        rSprite = runner.hasBook ? (isFrame2 ? R_RUN_1 : R_RUN_2) : (isFrame2 ? R_N_RUN_1 : R_N_RUN_2);
        rBob = isFrame2 ? 0 : -2;
        if (runner.animState === 'PANIC') rSprite = R_PANIC; // override
      } else if (runner.animState === 'SNEAK') rSprite = R_SNEAK;
      else if (runner.animState === 'HIDE') rSprite = R_HIDE;
      else if (runner.animState === 'TRIP') rSprite = R_TRIP;
      else if (runner.animState === 'READ') rSprite = R_READ;
      else if (runner.animState === 'SURPRISE') rSprite = R_PANIC; // Quick shock

      drawSprite(rSprite, runner.x, runner.y + rBob, runner.isFacingLeft);

      // Chaser Rendering
      let cSprite = C_IDLE;
      let cBob = 0;
      if (chaser.animState === 'RUN') {
        const isFrame2 = Math.floor(chaser.frameTime + 0.5) % 2 === 0;
        cSprite = isFrame2 ? C_RUN_1 : C_RUN_2;
        cBob = isFrame2 ? 0 : -2;
      } else if (chaser.animState === 'CONFUSED') cSprite = C_CONFUSED;
      else if (chaser.animState === 'SURPRISE') cSprite = C_SURPRISE;
      else if (chaser.animState === 'TRIP') cSprite = C_TRIP;
      
      drawSprite(cSprite, chaser.x, chaser.y + cBob, chaser.isFacingLeft);

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      cancelAnimationFrame(animationId)
    }
  }, [chaseDistance, speed])

  return (
    <div ref={containerRef} className="w-full relative py-4">
      <canvas 
        ref={canvasRef} 
        className="w-full block" 
        style={{ height: '160px', imageRendering: 'pixelated' }}
      />
    </div>
  )
}
