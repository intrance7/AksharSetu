"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

import Image from "next/image";

export function SmokeBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const springConfig = { damping: 30, stiffness: 100 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-black">
      <motion.div
        className="absolute inset-[-5%]"
        style={{
          x: useTransform(smoothX, [0, 2000], [-30, 30]),
          y: useTransform(smoothY, [0, 1000], [-30, 30]),
        }}
      >
        <Image
          src="/beige_smoke_4k.png"
          alt="Abstract Smoke Background"
          fill
          className="object-cover opacity-80"
          priority
        />
      </motion.div>
    </div>
  );
}
