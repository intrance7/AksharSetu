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
  
  // Load the downloaded Sketchfab model
  const { scene } = useGLTF('/models/book.glb')
  
  useEffect(() => {
    if (!meshRef.current) return
    
    // Initial hidden state - set Y to 0 so it aligns with the words perfectly
    meshRef.current.position.set(0, 0, 0)
    meshRef.current.scale.set(0, 0, 0)
    // Rotate to show the front cover nicely
    meshRef.current.rotation.set(0, -Math.PI / 4, 0)
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero-scroll-container",
        start: "top top", // Start immediately so it's visible while text is fading
        end: "55% top",
        scrub: 1
      }
    })
    
    // Phase 2: Fade in and scale up the book VERY quickly
    tl.to(meshRef.current.position, {
      z: 0,
      duration: 0.2, // Extremely fast so it's visible almost immediately
      ease: 'power2.out'
    }, 0)
    
    // Sketchfab models often have tiny scales. Let's scale it to 20 to bring it much closer. 
    // The Center component will normalize its bounding box, but we still scale it up.
    tl.to(meshRef.current.scale, {
      x: 20,
      y: 20,
      z: 20,
      duration: 0.2, // Scale up instantly!
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
      duration: 1,
      ease: 'power2.inOut',
    }, 0.8) // Start moving left earlier in the timeline
    
    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill()
      tl.kill()
    }
  }, [])
  
  useFrame((state) => {
    if (!meshRef.current) return
    // Gentle floating around y = 0
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2
    meshRef.current.rotation.y += 0.002
  })

  return (
    <group ref={meshRef}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

// Preload the model so it doesn't pop in
useGLTF.preload('/models/book.glb')
