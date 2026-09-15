"use client"

import React, { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text, Html } from "@react-three/drei"
import * as THREE from "three"

// Using pure Latin to guarantee WebGL font glyph support without loading a 20MB font file
const DICTIONARY = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
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
        fontSize={scale * 2.5} // Scale for WebGL Text
        font="https://fonts.gstatic.com/s/silkscreen/v2/m8JXjfWVPX5-jS5Q-S218i2rA2iBAXg.woff"
        fillOpacity={pos.z < -15 ? 0.15 : pos.z < -8 ? 0.4 : 0.8}
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
    const count = 45 // Increased back to 45 since WebGL Text is insanely fast
    const temp = []

    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0

      // Rejection sampling to keep the center clean for hero text readability
      let isCenter = true
      while (isCenter) {
        x = (Math.random() - 0.5) * 50
        y = (Math.random() - 0.5) * 35
        z = (Math.random() - 0.5) * 40 - 5 // Range: -25 to +15

        // If the word is near the center (X/Y), reject it
        if (Math.abs(x) < 10 && Math.abs(y) < 8) {
          isCenter = true
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
          
          <WordCloud />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
