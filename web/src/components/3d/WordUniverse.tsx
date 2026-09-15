"use client"

import { useRef, useMemo, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing"
import * as THREE from "three"

const DICTIONARY = [
  "BOOKS", "READ", "KNOWLEDGE", "STORIES", "NOVEL", "POETRY", "DREAM", "LEARN", "DISCOVER", 
  "SHARE", "DONATE", "LIBRARY", "WISDOM", "IDEAS", "WORDS", "CHAPTER", "PAGE", "AUTHOR", 
  "JOURNEY", "IMAGINATION", "empathy", "explore", "world", "imagine",
  "ज्ञान", "किताब", "कहानी", "पुस्तक", "पढ़ना", 
  "كتاب", "اقرأ", // Arabic
  "本", "物語", // Japanese
  "사랑", "지혜", // Korean
  "AMOR", "LIBERTÉ", "PAZ", "ESPERANZA"
]

const PALETTE = [
  "#00f0ff", // cyan
  "#0055ff", // electric blue
  "#8a2be2", // violet
  "#ff00ff", // magenta
  "#ff7f50", // coral
  "#ffaa00", // orange
  "#ffff00", // yellow
  "#00ffa6", // mint
  "#ff66b2", // pink
  "#ffffff", // white
  "#e2e8f0", // slate
]

function Word({ word, pos, color, scale, speed, rot }: any) {
  const ref = useRef<THREE.Mesh>(null)
  
  // Create organic drifting offsets
  const timeOffset = useMemo(() => Math.random() * 100, [])
  const [hovered, setHovered] = useState(false)

  // Target values for smooth interpolation
  const targetScale = hovered ? scale * 1.2 : scale
  const targetColor = hovered ? "#ffffff" : color
  const currentScale = useRef(scale)
  
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime + timeOffset

    // Organic floating movement
    ref.current.position.y = pos.y + Math.sin(t * speed.y) * 1.5
    ref.current.position.x = pos.x + Math.cos(t * speed.x) * 1.5
    ref.current.position.z = pos.z + Math.sin(t * speed.z) * 1.5

    // Gentle rotation
    ref.current.rotation.x = rot.x + Math.sin(t * 0.2) * 0.1
    ref.current.rotation.y = rot.y + Math.cos(t * 0.2) * 0.1
    ref.current.rotation.z = rot.z + Math.sin(t * 0.1) * 0.05

    // Mouse repulsion logic
    const pointer = state.pointer
    const viewport = state.viewport
    // Map normalized pointer coordinates to 3D space roughly at z=0
    const mouseX = (pointer.x * viewport.width) / 2
    const mouseY = (pointer.y * viewport.height) / 2
    
    // Calculate distance between word and mouse in XY plane
    const dx = ref.current.position.x - mouseX
    const dy = ref.current.position.y - mouseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    // If mouse is close (and word is not too far back), push it away slightly
    if (dist < 4 && ref.current.position.z > -15) {
      const force = (4 - dist) * 0.5
      ref.current.position.x += (dx / dist) * force
      ref.current.position.y += (dy / dist) * force
      if (!hovered) setHovered(true)
    } else {
      if (hovered) setHovered(false)
    }

    // Smooth scale interpolation
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.1)
    ref.current.scale.setScalar(currentScale.current)
  })

  return (
    <Text
      ref={ref}
      font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
      characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=_+[]{}|;:',.<>/?`~ ज्ञानकिताबकहानीपुस्तकपढ़ناكتاباقرأ本物語사랑지혜AMORLIBERTÉPAZESPERANZA"
      position={[pos.x, pos.y, pos.z]}
      color={targetColor}
      fontSize={1.5}
      anchorX="center"
      anchorY="middle"
      material-toneMapped={false} // Prevents tone mapping from dulling the emissive glow
    >
      {word}
      <meshBasicMaterial 
        color={targetColor} 
        toneMapped={false} 
        transparent 
        opacity={pos.z < -20 ? 0.4 : pos.z < -10 ? 0.7 : 1}
      />
    </Text>
  )
}

function WordCloud() {
  const words = useMemo(() => {
    const temp = []
    const count = 90 // Adjust based on performance

    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0
      
      // Rejection sampling to keep the center clean for hero text readability
      let isCenter = true
      while (isCenter) {
        x = (Math.random() - 0.5) * 50
        y = (Math.random() - 0.5) * 35
        z = (Math.random() - 0.5) * 40 - 5 // Range: -25 to +15

        // If the word is near the center (X/Y) AND not deep in the background, reject it
        if (Math.abs(x) < 10 && Math.abs(y) < 8 && z > -15) {
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
        rot: new THREE.Euler(
          (Math.random() - 0.5) * 0.2, // Slight tilt
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.1
        ),
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

function ParallaxCamera() {
  useFrame((state) => {
    // Smooth camera parallax based on mouse position
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 2, 0.05)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 2, 0.05)
    state.camera.lookAt(0, 0, -10)
  })
  return null
}

export function WordUniverse() {
  return (
    <div className="fixed inset-0 -z-10 w-full h-full bg-[#050505]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
      
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <fog attach="fog" args={["#050505", 10, 40]} />
        <ambientLight intensity={0.5} />
        
        <ParallaxCamera />
        <WordCloud />

        <EffectComposer disableNormalPass>
          {/* Subtle cinematic Depth of Field */}
          <DepthOfField 
            focusDistance={0.05} 
            focalLength={0.15} 
            bokehScale={4} 
            height={480} 
          />
          {/* Magical Bloom for the glowing words */}
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={1.5} 
          />
          {/* Subtle vignette and noise for premium cinematic feel */}
          <Noise opacity={0.03} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
