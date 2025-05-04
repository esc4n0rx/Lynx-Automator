"use client"
import React, { useRef, useEffect, useState } from 'react'
import { motion } from "framer-motion"
import Image from "next/image"

export function LynxTitle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return
    
    const ctx = canvas.getContext('2d', { alpha: false })  // Otimização com alpha: false
    if (!ctx) return

    const updateCanvasSize = () => {
      const container = containerRef.current
      if (!container) return
      
      const rect = container.getBoundingClientRect()
      // Uso de valores inteiros para evitar sub-pixel rendering
      canvas.width = Math.floor(rect.width)
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
    const mouseMoveThrottle = 16 // 60fps (aprox 16ms)

    function createTextImage() {
      if (!ctx || !canvas) return 0
      
      // Use offscreen canvas para melhorar performance
      const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height)
      const offscreenCtx = offscreenCanvas.getContext('2d')
      
      if (!offscreenCtx) return 0
      
      offscreenCtx.fillStyle = '#00FFF0'
      offscreenCtx.font = isMobile ? 'bold 80px Sora' : 'bold 120px Sora'
      offscreenCtx.textAlign = 'center'
      offscreenCtx.textBaseline = 'middle'
      
      // Centralizar o texto
      const text = 'Lynx'
      offscreenCtx.fillText(text, canvas.width / 2, canvas.height / 2)
      
      textImageData = offscreenCtx.getImageData(0, 0, canvas.width, canvas.height)
      
      return 1
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null
      
      const data = textImageData.data
      const sampleRate = 3; // Sample every 3 pixels instead of every pixel
      
      for (let attempt = 0; attempt < 50; attempt++) { // Reduzido número de tentativas
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)
        
        // Otimização: verifique limites antes de acessar dados
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const index = (y * canvas.width + x) * 4;
          
          // Verifique se o índice está dentro dos limites do array
          if (index >= 0 && index < data.length && data[index + 3] > 128) {
            return {
              x: x,
              y: y,
              baseX: x,
              baseY: y,
              size: Math.random() * 1.5 + 0.5,
              color: '#ffffff',
              scatteredColor: '#00FFF0',
              life: Math.random() * 200 + 100 // Aumentado para reduzir regeneração frequente
            }
          }
        }
      }
      
      return null
    }

    function createInitialParticles() {
      if (isInitializing) {
        // Ajusta a densidade de partículas baseada no tamanho do canvas
        const baseParticleCount = 4000 // Reduzido um pouco para melhor performance
        const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (500 * 200)))
        
        // Inicializa partículas em lotes para não bloquear a UI
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
            // Agenda o próximo lote
            setTimeout(createBatch, 0)
          } else {
            // Finaliza a inicialização
            isInitializing = false
          }
        }
        
        createBatch()
      }
    }

    let animationFrameId: number

    function animate() {
      if (!ctx || !canvas) return
      
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
      
      // Throttle mouse move events para melhorar performance
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
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="absolute left-8"
      >
        <Image 
          src="/mascote.png" 
          alt="Lynx Mascote" 
          width={100} 
          height={100} 
          className="object-contain"
        />
      </motion.div>
      
      <div className="relative w-96 h-40 mx-auto">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full touch-none"
          aria-label="Interactive particle effect with Lynx text"
        />

        {/* Hidden actual text for accessibility */}
        <span className="sr-only">Lynx</span>
      </div>
    </motion.div>
  )
}
