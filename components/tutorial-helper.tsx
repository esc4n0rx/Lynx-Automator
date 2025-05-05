// components/tutorial-helper.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Monitor, Laptop } from "lucide-react"
import Image from "next/image"

interface TutorialStep {
  title: string
  description: string
  image?: string
  alt?: string
  platform: "windows" | "mac" | "both"
}

interface TutorialHelperProps {
  title: string
  steps: TutorialStep[]
}

export function TutorialHelper({ title, steps }: TutorialHelperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [platform, setPlatform] = useState<"windows" | "mac">("windows")
  
  const filteredSteps = steps.filter(step => 
    step.platform === "both" || step.platform === platform
  )
  
  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const renderPlatformToggle = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      <Button
        variant={platform === "windows" ? "default" : "outline"}
        size="sm"
        onClick={() => setPlatform("windows")}
        className="flex items-center gap-2"
      >
        <Monitor className="h-4 w-4" />
        Windows
      </Button>
      <Button
        variant={platform === "mac" ? "default" : "outline"}
        size="sm"
        onClick={() => setPlatform("mac")}
        className="flex items-center gap-2"
      >
        <Laptop className="h-4 w-4" />
        Mac
      </Button>
    </div>
  )
  
  const step = filteredSteps[currentStep]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="tutorial-helper bg-card border border-border rounded-lg p-6"
    >
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      
      {renderPlatformToggle()}
      
      <div className="step-indicator flex items-center justify-center gap-1 mb-4">
        {filteredSteps.map((_, index) => (
          <div 
            key={index}
            className={`h-2 w-2 rounded-full ${
              index === currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      
      <div className="step-content mb-6">
        <h4 className="text-md font-medium mb-2">
          Passo {currentStep + 1}: {step.title}
        </h4>
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
        
        {step.image && (
          <div className="tutorial-image-container bg-muted rounded-lg p-2 flex justify-center mb-4">
            <Image
              src={step.image}
              alt={step.alt || step.title}
              width={500}
              height={300}
              className="object-contain max-h-[300px] rounded shadow-sm"
            />
          </div>
        )}
      </div>
      
      <div className="navigation-buttons flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        
        <div className="step-counter text-sm text-muted-foreground">
          {currentStep + 1} / {filteredSteps.length}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentStep === filteredSteps.length - 1}
          className="flex items-center gap-1"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}