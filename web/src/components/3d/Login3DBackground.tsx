"use client"

import React, { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { EffectComposer, DepthOfField } from "@react-three/postprocessing"
import * as THREE from "three"

// Brand colors for the books
const COLORS = [
  "#C84200", // Brand Orange
  "#3B4CCA", // Engineering Blue
  "#0B8577", // Medical Teal
  "#C93A64", // Fiction Pink
  "#F4B22B", // Non-fiction Yellow
]

function FloatingBook({ position, color, speed, rotationOffset }: any) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    // Constant speed traveling forward along the path
    const linearSpeed = 8
    
    let wrappedX = ((position[0] + t * linearSpeed) % 100)
    if (wrappedX < -50) wrappedX += 100
    if (wrappedX > 50) wrappedX -= 100
    
    // Books move forward along the X axis
    meshRef.current.position.x = wrappedX
    
    // The Y axis strictly follows the zigzag pattern based on their X position
    const zigzagFreq = 0.15
    const zigzagAmp = 12
    
    let val = (wrappedX * zigzagFreq) % 2
    if (val < 0) val += 2
    const tri = Math.abs(val - 1) * 2 - 1 // Oscillates between -1 and 1
    
    // Y position strictly follows the linear zigzag axis path
    meshRef.current.position.y = tri * zigzagAmp
    
    // Continuous rotation in ONE direction (no back and forth swinging)
    meshRef.current.rotation.x = t * 0.5 * speed.y + rotationOffset
    meshRef.current.rotation.y = t * 0.3 * speed.x
    meshRef.current.rotation.z = t * 0.2 + rotationOffset
  })

  return (
    <group ref={meshRef} position={position}>
      {/* Book Cover */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2.8, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Pages (slightly smaller, white, sticking out from one side) */}
      <mesh position={[0.1, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 2.7, 0.35]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
    </group>
  )
}

function BookCloud() {
  const books = useMemo(() => {
    const count = 35
    const temp = []
    for (let i = 0; i < count; i++) {
      // Spread them around, mostly in the background
      const x = (Math.random() - 0.5) * 40
      const y = (Math.random() - 0.5) * 30
      const z = -10 - Math.random() * 30
      
      temp.push({
        id: i,
        position: [x, y, z],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: {
          x: 0.1 + Math.random() * 0.2,
          y: 0.1 + Math.random() * 0.2
        },
        rotationOffset: Math.random() * Math.PI * 2
      })
    }
    return temp
  }, [])

  return (
    <>
      {books.map((book) => (
        <FloatingBook key={book.id} {...book} />
      ))}
    </>
  )
}

export function Login3DBackground() {
  return (
    <div className="absolute inset-0 z-0 w-full h-full bg-[#F2EBE1] pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]} // Optimize pixel ratio
      >
        <color attach="background" args={["#F2EBE1"]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#F4B22B" />
        
        <Suspense fallback={null}>
          <BookCloud />
          <EffectComposer>
            <DepthOfField 
              focusDistance={0.01} 
              focalLength={0.2} 
              bokehScale={4} 
              height={480} 
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* Vignette/Gradient overlay to blend the edges into the page */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#F2EBE1_100%)] opacity-80" />
    </div>
  )
}
