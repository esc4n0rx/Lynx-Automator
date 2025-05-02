"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

export function LynxTitle() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!titleRef.current) return

    const title = titleRef.current
    let position = 0

    const animateGlow = () => {
      position = (position + 1) % 200
      const gradientPosition = position / 2

      title.style.backgroundImage = `linear-gradient(
        90deg, 
        #0a0a0a 0%, 
        #0a0a0a ${gradientPosition - 20}%, 
        #00FFF0 ${gradientPosition}%, 
        #00B3A6 ${gradientPosition + 5}%, 
        #0a0a0a ${gradientPosition + 20}%, 
        #0a0a0a 100%
      )`

      requestAnimationFrame(animateGlow)
    }

    const animation = requestAnimationFrame(animateGlow)

    return () => cancelAnimationFrame(animation)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-8 flex items-center justify-center gap-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <Image 
          src="/mascote.png" 
          alt="Lynx Mascote" 
          width={80} 
          height={80} 
          className="object-contain"
        />
      </motion.div>
      
      <h1
        ref={titleRef}
        className="font-sora text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0a0a0a] via-[#00FFF0] to-[#0a0a0a] py-2"
        style={{
          WebkitBackgroundClip: "text",
          backgroundSize: "200% 100%",
          textShadow: "0 0 20px rgba(0, 255, 240, 0.7), 0 0 40px rgba(0, 179, 166, 0.4)",
        }}
      >
        Lynx
      </h1>
    </motion.div>
  )
}