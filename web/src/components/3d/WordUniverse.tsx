"use client"

import React, { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { EffectComposer, DepthOfField } from "@react-three/postprocessing"
import * as THREE from "three"

// Multilingual dictionary
const DICTIONARY = [
  // Latin
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  // Devanagari (Hindi)
  ..."अआइईउऊकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह".split(""),
  // Greek
  ..."αβγδεζηθλμξπρστφψω".split(""),
  // Cyrillic
  ..."АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩ".split(""),
  // Japanese Katakana
  ..."アイウエオカキクケコサシスセソタチツテト".split(""),
  // Korean Hangul Jamo
  ..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ".split("")
]

const PALETTE = [
  "#FF5C00", // vibrant pop orange (Mars Orange)
  "#E85D04", // deep orange
  "#2D2D2D", // dark gray
  "#1A1A1A", // almost black
  "#404040", // medium dark gray
  "#8C8C8C", // neutral gray
  "#FF5C00", // more orange
]

function Word({ word, pos, color, scale, speed }: any) {
  const groupRef = useRef<THREE.Group>(null)

  // Create organic drifting offsets
  const timeOffset = useMemo(() => Math.random() * 100, [])
  const offset = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime + timeOffset

    // Orbital movement around a deep background center to prevent passing behind camera
    const orbitSpeed = 0.03
    const orbitCenterX = 0
    const orbitCenterZ = -15
    const relX = pos.x - orbitCenterX
    const relZ = pos.z - orbitCenterZ

    const radius = Math.sqrt(relX * relX + relZ * relZ)
    const initialAngle = Math.atan2(relZ, relX)
    const currentAngle = initialAngle + (t * orbitSpeed)

    const orbitX = orbitCenterX + Math.cos(currentAngle) * radius
    const orbitZ = orbitCenterZ + Math.sin(currentAngle) * radius

    // Controlled floating
    const floatX = Math.cos(t * speed.x) * 1.5
    const floatY = Math.sin(t * speed.y) * 1.5
    const floatZ = Math.sin(t * speed.z) * 1.5

    const baseX = orbitX + floatX
    const baseY = pos.y + floatY
    const baseZ = orbitZ + floatZ

    // Subtle rotation
    groupRef.current.rotation.z = Math.sin(t * speed.x) * 0.06

    // Professional Global Parallax Hover Effect
    // Instead of weird localized repulsion, characters gently sway based on mouse position and their Z-depth.
    const mouseX = state.pointer.x * 3
    const mouseY = state.pointer.y * 3

    // Calculate a depth multiplier (closer objects move more, deeper objects move less)
    // pos.z ranges from roughly -45 to +15.
    const depthFactor = Math.max(0.2, (pos.z + 50) / 60)
    
    // Target offset moves opposite to the mouse
    const targetX = -mouseX * depthFactor
    const targetY = -mouseY * depthFactor

    // Silky smooth interpolation
    offset.current.x = THREE.MathUtils.lerp(offset.current.x, targetX, 0.05)
    offset.current.y = THREE.MathUtils.lerp(offset.current.y, targetY, 0.05)

    // Apply final position with strict NaN protection to prevent silent Canvas crashes
    const finalX = baseX + offset.current.x
    const finalY = baseY + offset.current.y
    const finalZ = baseZ

    if (!isNaN(finalX) && !isNaN(finalY) && !isNaN(finalZ)) {
      groupRef.current.position.set(finalX, finalY, finalZ)
    }
  })

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      <Text
        color={color}
        fontSize={scale * 2.5}
        fontWeight={900}
        fillOpacity={pos.z < -15 ? 0.2 : pos.z < -8 ? 0.5 : 0.9}
        outlineWidth={0.05}
        outlineColor={color}
        anchorX="center"
        anchorY="middle"
      >
        {word}
      </Text>
    </group>
  )
}

function WordCloud() {
  const words = useMemo(() => {
    const count = 75 // Increased count for a bulkier, more populated scene
    const temp = []

    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0

      // We'll use a simple stratified sampling approach (jittered grid) to prevent clumping.
      // This gives an "equal but informal" distribution.
      let isCenter = true
      while (isCenter) {
        // Grid size: 6x5x3 = 90 cells (we need 75)
        const gridX = 6
        const gridY = 5
        const gridZ = 3
        
        const ix = i % gridX
        const iy = Math.floor((i / gridX)) % gridY
        const iz = Math.floor(i / (gridX * gridY)) % gridZ
        
        // Base cell position
        const cellWidth = 50 / gridX
        const cellHeight = 35 / gridY
        const cellDepth = 40 / gridZ
        
        const baseX = (ix * cellWidth) - 25 + (cellWidth / 2)
        const baseY = (iy * cellHeight) - 17.5 + (cellHeight / 2)
        const baseZ = (iz * cellDepth) - 25 + (cellDepth / 2)
        
        // Add random jitter within the cell to make it feel organic, not rigid
        const jitterX = (Math.random() - 0.5) * (cellWidth * 0.8)
        const jitterY = (Math.random() - 0.5) * (cellHeight * 0.8)
        const jitterZ = (Math.random() - 0.5) * (cellDepth * 0.8)

        x = baseX + jitterX
        y = baseY + jitterY
        z = baseZ + jitterZ

        // If the word is near the center (X/Y), try regenerating with fully random fallback
        if (Math.abs(x) < 12 && Math.abs(y) < 9 && z > -15) {
          isCenter = true
          // If we're stuck in the center cell, just randomize it entirely outside the center bounds
          // so we don't get stuck in an infinite loop
          x = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 10)
          y = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 8)
          z = (Math.random() - 0.5) * 40 - 5
          isCenter = false
        } else {
          isCenter = false
        }
      }

      temp.push({
        id: i,
        word: DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)],
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        pos: new THREE.Vector3(x, y, z),
        scale: 0.5 + Math.random() * 0.8, // 0.5x to 1.3x size
        speed: new THREE.Vector3(
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.2
        )
      })
    }
    return temp
  }, [])

  return (
    <>
      {words.map((w) => (
        <Word key={w.id} {...w} />
      ))}
    </>
  )
}

class ErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black">
          <div className="bg-red-900/50 text-red-200 border border-red-500 p-6 rounded-lg font-mono text-xs max-w-4xl overflow-auto max-h-[80vh]">
            <h2 className="text-xl font-bold mb-4">3D Canvas Crashed</h2>
            <p className="mb-2">Error: {this.state.error?.toString()}</p>
            <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function WordUniverse() {
  return (
    <div className="absolute inset-0 z-0 w-full h-full bg-[#F5F5DC]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-200/40 via-[#F5F5DC] to-[#F5F5DC]" />

      <ErrorBoundary>
        <Canvas 
          camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 100 }}
          eventSource={typeof document !== 'undefined' ? document.body : undefined}
          eventPrefix="client"
        >
          <color attach="background" args={["#F5F5DC"]} />
          <ambientLight intensity={0.5} />
          
          <Suspense fallback={null}>
            <WordCloud />
            <EffectComposer disableNormalPass>
              <DepthOfField 
                target={[0, 0, 0]} 
                focalLength={0.05} 
                bokehScale={3} 
                height={480} 
              />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
