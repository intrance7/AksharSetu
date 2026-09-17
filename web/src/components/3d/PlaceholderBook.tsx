import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Center } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function PlaceholderBook() {
  const meshRef = useRef<THREE.Group>(null)
  const shadowGroupRef = useRef<THREE.Group>(null)
  
  // References for dual-layer levitating shadow
  const shadowMeshRef = useRef<THREE.Mesh>(null)
  const shadowMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  
  // Separate ref for auto-rotation to avoid conflicting with GSAP's scroll rotation
  const autoRotateRef = useRef<THREE.Group>(null)
  // Control the speed of auto-rotation with a ref we can animate!
  const autoRotateSpeed = useRef({ value: 0 })
  // Track the direction of the scroll (1 = forward, -1 = backward)
  const scrollDirection = useRef(1)

  // Load the downloaded Sketchfab model
  const { scene } = useGLTF('/models/book.glb')

  useEffect(() => {
    if (!meshRef.current || !shadowGroupRef.current) return

    // Initial hidden state - set Y to 0 so it aligns with the words perfectly
    meshRef.current.position.set(0, 0, 0)
    meshRef.current.scale.set(0, 0, 0)
    
    // Initial shadow state (starts at 0 so it doesn't show up before the book)
    shadowGroupRef.current.scale.set(0, 0, 0)
    shadowGroupRef.current.position.set(0, -3.35, 0)

    // Rotate to show the front cover nicely
    meshRef.current.rotation.set(0, -Math.PI / 4, 0)
    shadowGroupRef.current.rotation.set(0, -Math.PI / 4, 0)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero-scroll-container",
        start: "top top", // Start immediately so it's visible while text is fading
        end: "51% top", // Scaled down from 70% so the absolute scroll distance is exactly the same!
        scrub: 1,
        onUpdate: (self) => {
          // Update the scroll direction so we know if the user is scrolling back
          scrollDirection.current = self.direction
        }
      }
    })

    // Phase 2: Fade in and scale up the book VERY quickly
    tl.to(meshRef.current.position, {
      z: 0,
      duration: 0.2, // Extremely fast so it's visible almost immediately
      ease: 'power2.out'
    }, 0)

    // Sketchfab models often have tiny scales. Scale to 20 to bring it to hero size.
    tl.to(meshRef.current.scale, {
      x: 20,
      y: 20,
      z: 20,
      duration: 0.2, // Scale up instantly!
      ease: 'power2.out'
    }, 0)
    
    // Scale up the shadow in perfect sync with the book (scale 1 corresponds to full natural footprint)
    tl.to(shadowGroupRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.2,
      ease: 'power2.out'
    }, 0)

    // The magical spin
    tl.to(meshRef.current.rotation, {
      y: Math.PI * 2 - Math.PI / 8, // Spin and end up slightly angled
      duration: 1.5,
      ease: 'power1.inOut'
    }, 0)

    // Phase 4: Move left
    tl.to(meshRef.current.position, {
      x: -4.5, // Move left just enough to make room, but not off screen
      duration: 1.5,
      ease: 'power2.inOut',
    }, 1.5) // Starts EXACTLY when the spin finishes, which is exactly halfway through the scroll (40%)
    
    // Move the shadow left with the book in lockstep!
    tl.to(shadowGroupRef.current.position, {
      x: -4.5,
      duration: 1.5,
      ease: 'power2.inOut',
    }, 1.5)
    
    // Smoothly increase the continuous auto-rotation speed from 0 to 0.005 
    // when the book moves left (after the words have finished absorbing).
    // When the user scrolls back up, GSAP will smoothly scrub this back to 0!
    tl.to(autoRotateSpeed.current, {
      value: 0.005,
      duration: 1.5,
      ease: 'power2.inOut'
    }, 1.5)

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill()
      tl.kill()
    }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    
    // Gentle floating around y = 0
    const floatY = Math.sin(t) * 0.25
    meshRef.current.position.y = floatY
    
    if (autoRotateRef.current) {
      if (scrollDirection.current === 1) {
        // Scrolling Forward / Stopped: Apply continuous auto-rotation
        autoRotateRef.current.rotation.y += autoRotateSpeed.current.value
      } else {
        // Scrolling Backward: Smoothly realign the book to its exact original orientation!
        const currentY = autoRotateRef.current.rotation.y
        const targetY = Math.round(currentY / (Math.PI * 2)) * (Math.PI * 2)
        autoRotateRef.current.rotation.y = THREE.MathUtils.lerp(currentY, targetY, 0.05)
      }
    }

    if (shadowGroupRef.current && meshRef.current) {
      // 1. Orient the shadow with the book's total Y rotation
      const totalRotY = meshRef.current.rotation.y + (autoRotateRef.current?.rotation.y || 0)
      shadowGroupRef.current.rotation.y = totalRotY

      // 2. Levitation: The shadow levitates smoothly with the book in Y
      const baseShadowY = -3.5
      const shadowFloatY = Math.sin(t) * (0.25 * 0.8)
      shadowGroupRef.current.position.y = baseShadowY + shadowFloatY

      // 3. Dynamic breathing:
      const floatNorm = floatY / 0.25 // [-1, 1]
      if (shadowMeshRef.current) {
        // Gently expands when floating higher
        const breathScale = 1 + floatNorm * 0.07
        shadowMeshRef.current.scale.set(breathScale, breathScale, 1)
      }
      if (shadowMaterialRef.current) {
        // Rich, visible presence (breathes between 0.57 and 0.73)
        shadowMaterialRef.current.opacity = THREE.MathUtils.clamp(0.65 - floatNorm * 0.08, 0.48, 0.78)
      }
    }
  })

  // Ultra-soft, rich Gaussian ambient occlusion shadow texture
  const shadowTexture = React.useMemo(() => {
    if (typeof document === 'undefined') return null
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const imgData = ctx.createImageData(size, size)
    const data = imgData.data
    const half = size / 2

    for (let y = 0; y < size; y++) {
      const ny = ((y - half) / half) * 1.45 // Compress vertically to match book footprint
      for (let x = 0; x < size; x++) {
        const nx = (x - half) / half

        // Soft rounded squircle distance metric (p = 2.2)
        const p = 2.2
        const r = Math.pow(Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p), 1 / p)

        let alpha = 0
        if (r < 1.0) {
          // Gaussian ambient falloff: exp(-2.2 * r^2)
          const g = Math.exp(-2.2 * r * r)
          const gEdge = Math.exp(-2.2)
          const normG = (g - gEdge) / (1 - gEdge)

          // Smooth inner occlusion core: provides rich grounded depth without sharp edges
          const core = Math.max(0, 1.0 - r / 0.55)
          const coreAlpha = Math.pow(core, 1.8) * 0.45
          const diffuseAlpha = normG * 0.50

          // Cubic smoothstep for zero derivative at boundary
          const h = 1.0 - r
          const smooth = h * h * (3.0 - 2.0 * h)

          alpha = Math.min(0.92, (coreAlpha + diffuseAlpha) * smooth)
        }

        const idx = (y * size + x) * 4
        // Deep warm charcoal: produces a rich, natural ambient shadow over #F5F5DC
        data[idx + 0] = 20 // R
        data[idx + 1] = 15 // G
        data[idx + 2] = 12 // B
        data[idx + 3] = Math.round(alpha * 255)
      }
    }

    ctx.putImageData(imgData, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return texture
  }, [])

  return (
    <>
      <group ref={meshRef}>
        <group ref={autoRotateRef}>
          <Center>
            <primitive object={scene} />
          </Center>
        </group>
      </group>
      
      {/* Rich, ultra-soft levitating ambient shadow */}
      <group ref={shadowGroupRef} position={[0, -3.35, 0]}>
        <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[11.5, 11.5]} />
          {shadowTexture && (
            <meshBasicMaterial
              ref={shadowMaterialRef}
              map={shadowTexture}
              transparent
              opacity={0.65}
              depthWrite={false}
              toneMapped={false}
            />
          )}
        </mesh>
      </group>
    </>
  )
}

// Preload the model so it doesn't pop in
useGLTF.preload('/models/book.glb')
