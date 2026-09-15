"use client"

import React, { useRef, useMemo, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing"
import * as THREE from "three"

const DICTIONARY = [
  // Latin (English)
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  // Devanagari (Hindi - "Akshar")
  ..."अआइईउऊकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह".split(""),
  // Greek
  ..."αβγδεζηθλμξπρστφψω".split(""),
  // Cyrillic (Russian)
  ..."АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩ".split(""),
  // Japanese (Katakana)
  ..."アイウエオカキクケコサシスセソタチツテト".split(""),
  // Korean (Hangul Jamo)
  ..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ".split("")
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
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  // Create organic drifting offsets
  const timeOffset = useMemo(() => Math.random() * 100, [])
  const hovered = useRef(false)
  const currentScale = useRef(scale)
  
  const baseColor = useMemo(() => new THREE.Color(color), [color])
  const hoverColor = useMemo(() => new THREE.Color("#ffffff"), [])
  
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime + timeOffset

    // Revolve math (Orbit around Y axis)
    const orbitSpeed = 0.05
    const radius = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
    const initialAngle = Math.atan2(pos.z, pos.x)
    // Positive angle goes counter-clockwise (right to left in the front)
    const currentAngle = initialAngle + (t * orbitSpeed)
    
    const orbitX = Math.cos(currentAngle) * radius
    const orbitZ = Math.sin(currentAngle) * radius

    // Organic floating movement added to orbit
    ref.current.position.y = pos.y + Math.sin(t * speed.y) * 1.5
    ref.current.position.x = orbitX + Math.cos(t * speed.x) * 1.5
    ref.current.position.z = orbitZ + Math.sin(t * speed.z) * 1.5

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
    const isClose = dist < 4 && ref.current.position.z > -15
    hovered.current = isClose
    
    if (isClose) {
      const safeDist = Math.max(dist, 0.001)
      const force = (4 - safeDist) * 0.5
      ref.current.position.x += (dx / safeDist) * force
      ref.current.position.y += (dy / safeDist) * force
    }

    // Smooth color interpolation
    if (materialRef.current) {
      materialRef.current.color.lerp(hovered.current ? hoverColor : baseColor, 0.1)
    }
  })

  return (
    <Text
      ref={ref}
      position={[pos.x, pos.y, pos.z]}
      fontSize={1.5}
      anchorX="center"
      anchorY="middle"
    >
      {word}
      <meshBasicMaterial
        ref={materialRef}
        color={baseColor}
        toneMapped={false}
        transparent
        opacity={pos.z < -20 ? 0.4 : pos.z < -10 ? 0.7 : 1}
      />
    </Text>
  )
}

function WordCloud() {

  const words = useMemo(() => {
    const count = 90 // Adjust based on performance
    const temp = []

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
    <div className="fixed inset-0 z-0 w-full h-full bg-[#050505]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />

      <ErrorBoundary>
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <ambientLight intensity={0.5} />
          
          <ParallaxCamera />
          <WordCloud />

          <EffectComposer disableNormalPass>
            <DepthOfField
              focusDistance={0.05}
              focalLength={0.15}
              bokehScale={4}
              height={480}
            />
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              intensity={1.5}
            />
            <Noise opacity={0.03} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
