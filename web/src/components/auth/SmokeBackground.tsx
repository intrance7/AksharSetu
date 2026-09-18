"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

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
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#EFEBE4]">
      {/* Smoke Blobs */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#DCD8CF] mix-blend-multiply filter blur-[100px] opacity-80"
        style={{
          x: useTransform(smoothX, [0, 2000], [0, -80]),
          y: useTransform(smoothY, [0, 1000], [0, -80]),
        }}
      />
      
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#E5E0D5] mix-blend-multiply filter blur-[120px] opacity-80"
        style={{
          x: useTransform(smoothX, [0, 2000], [0, 80]),
          y: useTransform(smoothY, [0, 1000], [0, 80]),
        }}
      />
      
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] left-[40%] w-[40vw] h-[40vw] rounded-full bg-[#F3F0EA] mix-blend-multiply filter blur-[90px] opacity-90"
        style={{
          x: useTransform(smoothX, [0, 2000], [0, -40]),
          y: useTransform(smoothY, [0, 1000], [0, 60]),
        }}
      />
      
      {/* Heavy Glass Overlay */}
      <div className="absolute inset-0 backdrop-blur-[60px] bg-white/20" />
    </div>
  );
}
