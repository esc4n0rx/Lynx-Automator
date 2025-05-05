"use client"
import React, { useRef, useEffect, useState } from 'react'
import { motion } from "framer-motion"

export function LynxTitle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return
    
    // Important: Set alpha to true to ensure transparency
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const updateCanvasSize = () => {
      const container = containerRef.current
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      // Make canvas slightly wider to ensure text fits completely
      canvas.width = Math.floor(rect.width) + 100 // Add extra width
      canvas.height = Math.floor(rect.height)
      setIsMobile(window.innerWidth < 768)
    }

    updateCanvasSize()

    let particles: {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      color: string
      scatteredColor: string
      life: number
    }[] = []

    let textImageData: ImageData | null = null
    let isInitializing = true
    let lastMouseMoveTime = 0
    const mouseMoveThrottle = 16

    function createTextImage() {
      if (!ctx || !canvas) return 0
      
      const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height)
      // Important: Set alpha to true here as well
      const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true })
      
      if (!offscreenCtx) return 0
      
      // Clear the canvas first to ensure transparency
      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
      
      offscreenCtx.fillStyle = '#00FFF0'
      
      // Adjust font size based on screen size
      const fontSize = isMobile ? '70px' : '110px'
      offscreenCtx.font = `bold ${fontSize} Sora`
      offscreenCtx.textAlign = 'center'
      offscreenCtx.textBaseline = 'middle'
      
      const text = 'Dolphin'
      
      // Calculate appropriate text position - center horizontally
      const textX = offscreenCanvas.width / 2
      const textY = offscreenCanvas.height / 2
      
      // Draw the text at the calculated position
      offscreenCtx.fillText(text, textX, textY)
      
      textImageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
      
      return 1
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null
      
      const data = textImageData.data
      const sampleRate = 3; 
      
      for (let attempt = 0; attempt < 50; attempt++) { 
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)
        
        // Check bounds before accessing data
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const index = (y * canvas.width + x) * 4;
          
          // Check if index is within bounds of the array and if alpha channel has value
          if (index >= 0 && index < data.length && data[index + 3] > 128) {
            return {
              x: x,
              y: y,
              baseX: x,
              baseY: y,
              size: Math.random() * 1.5 + 0.5,
              color: '#ffffff',
              scatteredColor: '#00FFF0',
              life: Math.random() * 200 + 100
            }
          }
        }
      }
      
      return null
    }

    function createInitialParticles() {
      if (!canvas || !isInitializing) return;

      if (isInitializing) {
        // Adjust particle density based on canvas size
        const baseParticleCount = 4000
        const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (500 * 200)))
        
        // Initialize particles in batches to avoid blocking UI
        let particlesCreated = 0
        const particlesPerBatch = 500
        
        const createBatch = () => {
          const batchSize = Math.min(particlesPerBatch, particleCount - particlesCreated)
          let created = 0
          
          for (let i = 0; i < batchSize; i++) {
            const particle = createParticle()
            if (particle) {
              particles.push(particle)
              created++
            }
            particlesCreated += created
          }
          
          if (particlesCreated < particleCount) {
            // Schedule next batch
            setTimeout(createBatch, 0)
          } else {
            // Finish initialization
            isInitializing = false
          }
        }
        
        createBatch()
      }
    }

    let animationFrameId: number

    function animate() {
      if (!ctx || !canvas) return
      
      // Clear the entire canvas including background to ensure transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = 150
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < maxDistance && (isTouchingRef.current || !('ontouchstart' in window))) {
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          const moveX = Math.cos(angle) * force * 40
          const moveY = Math.sin(angle) * force * 40
          
          p.x = p.baseX - moveX
          p.y = p.baseY - moveY
          
          ctx.fillStyle = p.scatteredColor
          // Add a subtle glow effect
          ctx.shadowColor = '#00FFF0'
          ctx.shadowBlur = 5
        } else {
          p.x += (p.baseX - p.x) * 0.1
          p.y += (p.baseY - p.y) * 0.1
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 0
        }
        
        ctx.fillRect(p.x, p.y, p.size, p.size)
        
        p.life--
        
        if (p.life <= 0) {
          const newParticle = createParticle()
          if (newParticle) {
            particles[i] = newParticle
          } else {
            particles.splice(i, 1)
            i--
          }
        }
      }
      
      // Maintain particle count
      const baseParticleCount = 3000
      const targetParticleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (500 * 200)))
      
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle()
        if (newParticle) particles.push(newParticle)
      }
      
      animationFrameId = requestAnimationFrame(animate)
    }

    createTextImage()
    createInitialParticles()
    animate()

    const handleResize = () => {
      updateCanvasSize()
      createTextImage()
      particles = []
      createInitialParticles()
    }

    const handleMove = (x: number, y: number) => {
      const now = Date.now()
      
      // Throttle mouse move events to improve performance
      if (now - lastMouseMoveTime < mouseMoveThrottle) return
      
      lastMouseMoveTime = now
      
      // Convert page coordinates to canvas coordinates
      const rect = canvas.getBoundingClientRect()
      mousePositionRef.current = { 
        x: x - rect.left, 
        y: y - rect.top 
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleTouchStart = () => {
      isTouchingRef.current = true
    }

    const handleTouchEnd = () => {
      isTouchingRef.current = false
      mousePositionRef.current = { x: -100, y: -100 } // Move far away
    }

    const handleMouseLeave = () => {
      if (!('ontouchstart' in window)) {
        mousePositionRef.current = { x: -100, y: -100 } // Move far away
      }
    }

    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', handleTouchEnd)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-8 flex items-center justify-center relative h-40"
    >
      <div className="relative w-full max-w-xl h-40 mx-auto">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full touch-none"
          aria-label="Interactive particle effect with Dolphin text"
          style={{ backgroundColor: 'transparent' }} // Explicitly set transparent background
        />

        {/* Hidden actual text for accessibility */}
        <span className="sr-only">Dolphin</span>
      </div>
    </motion.div>
  )
}