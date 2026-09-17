"use client"

import React, { useRef, useMemo, Suspense, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { EffectComposer, DepthOfField } from "@react-three/postprocessing"
import * as THREE from "three"

import { PlaceholderBook } from "./PlaceholderBook"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

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

const Word = React.forwardRef(({ word, pos, color, scale, speed }: any, ref: any) => {
  const innerGroupRef = useRef<THREE.Group>(null)

  // Create organic drifting offsets
  const timeOffset = useMemo(() => Math.random() * 100, [])
  const offset = useRef(new THREE.Vector3(0, 0, 0))

  // Pop-in animation on load
  useEffect(() => {
    if (!innerGroupRef.current) return

    // Scale from 0 to 1 with a random delay and a slight bounce
    innerGroupRef.current.scale.set(0, 0, 0)
    gsap.to(innerGroupRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1 + Math.random() * 1.5,
      delay: Math.random() * 0.5,
      ease: "back.out(1.5)"
    })
  }, [])

  useFrame((state) => {
    if (!innerGroupRef.current) return
    // Since scroll controls the parent group, we can let them keep floating slowly
    // or just tone it down. We'll leave the floating active to keep it organic.
    const t = state.clock.elapsedTime + timeOffset

    // Orbital movement around a deep background center
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

    innerGroupRef.current.rotation.z = Math.sin(t * speed.x) * 0.06

    const mouseX = state.pointer.x * 3
    const mouseY = state.pointer.y * 3
    const depthFactor = Math.max(0.2, (pos.z + 50) / 60)

    const targetX = -mouseX * depthFactor
    const targetY = -mouseY * depthFactor

    offset.current.x = THREE.MathUtils.lerp(offset.current.x, targetX, 0.05)
    offset.current.y = THREE.MathUtils.lerp(offset.current.y, targetY, 0.05)

    const finalX = baseX + offset.current.x
    const finalY = baseY + offset.current.y
    const finalZ = baseZ

    if (!isNaN(finalX) && !isNaN(finalY) && !isNaN(finalZ)) {
      innerGroupRef.current.position.set(finalX, finalY, finalZ)
    }
  })

  return (
    <group ref={ref} position={[pos.x, pos.y, pos.z]}>
      <group ref={innerGroupRef}>
        <Text
          color={color}
          fontSize={scale * 2.5}
          fontWeight={900}
          fillOpacity={pos.z < -15 ? 0.2 : pos.z < -8 ? 0.5 : 0.9}
          outlineWidth={0.05}
          outlineColor={color}
          anchorX="center"
          anchorY="middle"
          material-depthTest={false}
          material-depthWrite={false}
          renderOrder={999}
        >
          {word}
        </Text>
      </group>
    </group>
  )
})

Word.displayName = 'Word'

function WordCloud() {
  const wordRefs = useRef<(THREE.Group | null)[]>([])

  const words = useMemo(() => {
    // ... same logic ...
    const count = 75
    const temp = []
    for (let i = 0; i < count; i++) {
      let x = 0, y = 0, z = 0
      let isCenter = true
      while (isCenter) {
        const gridX = 6
        const gridY = 5
        const gridZ = 3
        const ix = i % gridX
        const iy = Math.floor((i / gridX)) % gridY
        const iz = Math.floor(i / (gridX * gridY)) % gridZ

        const cellWidth = 50 / gridX
        const cellHeight = 35 / gridY
        const cellDepth = 40 / gridZ

        const baseX = (ix * cellWidth) - 25 + (cellWidth / 2)
        const baseY = (iy * cellHeight) - 17.5 + (cellHeight / 2)
        const baseZ = (iz * cellDepth) - 25 + (cellDepth / 2)

        const jitterX = (Math.random() - 0.5) * (cellWidth * 0.8)
        const jitterY = (Math.random() - 0.5) * (cellHeight * 0.8)
        const jitterZ = (Math.random() - 0.5) * (cellDepth * 0.8)

        x = baseX + jitterX
        y = baseY + jitterY
        z = baseZ + jitterZ

        if (Math.abs(x) < 12 && Math.abs(y) < 9 && z > -15) {
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
        scale: 0.5 + Math.random() * 0.8,
        speed: new THREE.Vector3(
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.2,
          0.1 + Math.random() * 0.2
        )
      })
    }
    return temp
  }, [])

  useEffect(() => {
    const validRefs = wordRefs.current.filter(Boolean) as THREE.Group[]

    // Wait for the text to fade out before starting the collapse
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero-scroll-container",
        start: "6% top", // Starts right after "Unlimited Gyaan" fades out
        end: "40% top",  // Increased from 16% so the animation is much slower and takes more scrolling!
        scrub: 1, // Smooth scrubbing
      }
    })

    const STAGGER = 0.015
    const DURATION = 0.4

    // 1. Stagger position (Fly to the right page where the magical circle is)
    tl.to(validRefs.map(r => r.position), {
      x: 2.0,
      y: -0.5,
      z: 1.0,
      duration: DURATION,
      stagger: STAGGER,
      ease: "power3.in" // Zips into the book rapidly at the end
    }, 0)

    // Entrance animation on load (delayed to prevent lag)
    gsap.fromTo(validRefs.map(r => r.scale),
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 1.5, ease: "back.out(1.7)", stagger: 0.02, delay: 1.0 }
    )

    // 2. Stagger scale on scroll (collapse into book)
    tl.to(validRefs.map(r => r.scale), {
      x: 0,
      y: 0,
      z: 0,
      duration: DURATION,
      stagger: STAGGER,
      ease: "expo.in" // Stays large until the very end, then snaps to 0 just as it hits the circle!
    }, 0)

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill()
      tl.kill()
    }
  }, [])

  return (
    <>
      {words.map((w, i) => (
        <Word key={w.id} ref={(el: any) => wordRefs.current[i] = el} {...w} />
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

function PostProcessingEffects() {
  const dofRef = useRef<any>(null)

  useFrame(() => {
    if (!dofRef.current) return

    // We want the blur to fade out over the first 10% of the 400vh scroll container.
    // 10% of 400vh = 0.4 * window.innerHeight
    const maxScroll = window.innerHeight * 0.4
    const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)

    // Fade from 3 to 0 for a more subtle cinematic effect
    const currentBlur = 3 * (1 - progress)

    try {
      // Set bokeh scale
      dofRef.current.bokehScale = currentBlur

      // As a fallback, fade out the effect's opacity entirely
      if (dofRef.current.blendMode && dofRef.current.blendMode.opacity) {
        dofRef.current.blendMode.opacity.value = 1 - progress
      }
    } catch (e) { }
  })

  return (
    <EffectComposer disableNormalPass>
      <DepthOfField
        ref={dofRef}
        target={[0, 0, 0]}
        focalLength={0.05}
        bokehScale={3}
        height={480}
      />
    </EffectComposer>
  )
}

export function WordUniverse() {
  return (
    <div className="absolute inset-0 z-0 w-full h-full bg-[#F5F5DC] pointer-events-none">
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
            <PlaceholderBook />
            <WordCloud />
            <PostProcessingEffects />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
