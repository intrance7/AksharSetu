import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface DOMTrackerProps {
  domId: string
  children: React.ReactNode
  zIndex?: number
}

/**
 * DOMTracker synchronizes a 3D group with a native DOM element.
 * It reads the DOM element's position on screen (handling native scroll perfectly),
 * unprojects it through the Three.js camera, and perfectly aligns the WebGL children.
 */
export function DOMTracker({ domId, children, zIndex = 0 }: DOMTrackerProps) {
  const group = useRef<THREE.Group>(null)
  const { size, camera } = useThree()
  
  // Reusable vectors to prevent garbage collection inside the render loop
  const vec = useRef(new THREE.Vector3())
  const pos = useRef(new THREE.Vector3())
  
  useFrame(() => {
    if (!group.current) return
    
    const el = document.getElementById(domId)
    if (!el) {
      // If the DOM element isn't found, we just hide or skip updating
      return
    }

    // getBoundingClientRect handles scroll automatically by giving viewport-relative coords
    const rect = el.getBoundingClientRect()

    // Calculate Normalized Device Coordinates (NDC) for the center of the element
    const ndcX = (rect.left + rect.width / 2) / size.width * 2 - 1
    const ndcY = -(rect.top + rect.height / 2) / size.height * 2 + 1
    
    // Prepare vector for unprojection
    vec.current.set(ndcX, ndcY, 0.5)
    vec.current.unproject(camera)
    
    // Calculate direction from camera to the unprojected point
    vec.current.sub(camera.position).normalize()
    
    // We want to intersect the Z plane specified by zIndex
    const distance = (zIndex - camera.position.z) / vec.current.z
    
    // Calculate final world position
    pos.current.copy(camera.position).add(vec.current.multiplyScalar(distance))

    // Direct assignment for 1:1 synchronization with zero lag
    group.current.position.copy(pos.current)
  })

  return <group ref={group}>{children}</group>
}
