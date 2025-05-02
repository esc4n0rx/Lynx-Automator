"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomFlowModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  steps: {
    title: string
    description?: string
    placeholder?: string
    inputType: "text" | "code" | "info"
    infoType?: "warning" | "info" | "success" | "error"
    infoContent?: React.ReactNode
    required?: boolean
  }[]
  onSubmit: (inputs: string[]) => void
  isSubmitting?: boolean
}

export function CustomFlowModal({
  isOpen,
  onClose,
  title,
  description,
  steps,
  onSubmit,
  isSubmitting = false,
}: CustomFlowModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [inputs, setInputs] = useState<string[]>(Array(steps.length).fill(""))
  const [errors, setErrors] = useState<string[]>(Array(steps.length).fill(""))

  const handleNextStep = () => {
    // Validar o passo atual
    if (steps[currentStep].required && !inputs[currentStep].trim()) {
      setErrors((prev) => {
        const newErrors = [...prev]
        newErrors[currentStep] = "Este campo é obrigatório"
        return newErrors
      })
      return
    }

    // Se esse é o último passo, enviar
    if (currentStep === steps.length - 1) {
      onSubmit(inputs)
      return
    }

    // Avançar para o próximo passo
    setCurrentStep((prev) => prev + 1)
  }

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleInputChange = (value: string) => {
    setInputs((prev) => {
      const newInputs = [...prev]
      newInputs[currentStep] = value
      return newInputs
    })

    // Limpar erro quando o usuário digita
    if (errors[currentStep]) {
      setErrors((prev) => {
        const newErrors = [...prev]
        newErrors[currentStep] = ""
        return newErrors
      })
    }
  }

  const renderStepContent = () => {
    const currentStepData = steps[currentStep]

    if (currentStepData.inputType === "info") {
      let icon = <Info className="size-5 text-primary" />
      let bgColor = "bg-primary/10"
      let borderColor = "border-primary/30"
      let textColor = "text-primary"

      if (currentStepData.infoType === "warning") {
        icon = <AlertTriangle className="size-5 text-amber-500" />
        bgColor = "bg-amber-500/10"
        borderColor = "border-amber-500/30"
        textColor = "text-amber-500"
      } else if (currentStepData.infoType === "error") {
        icon = <AlertCircle className="size-5 text-destructive" />
        bgColor = "bg-destructive/10"
        borderColor = "border-destructive/30"
        textColor = "text-destructive"
      } else if (currentStepData.infoType === "success") {
        icon = <CheckCircle2 className="size-5 text-emerald-500" />
        bgColor = "bg-emerald-500/10"
        borderColor = "border-emerald-500/30"
        textColor = "text-emerald-500"
      }

      return (
        <div className={cn("rounded-lg border p-4", bgColor, borderColor)}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div className={cn("text-sm", textColor)}>{currentStepData.infoContent}</div>
          </div>
        </div>
      )
    }

    return (
      <Textarea
        value={inputs[currentStep]}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={currentStepData.placeholder}
        className={cn(
          "min-h-32 font-jetbrains text-sm p-4",
          currentStepData.inputType === "code" && "bg-[var(--code-bg)] text-[var(--code-text)]"
        )}
        autoFocus
      />
    )
  }

  const isLastStep = currentStep === steps.length - 1

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <div className="text-accent text-lg font-medium">{steps[currentStep].title}</div>
          <div className="text-muted-foreground text-xs">
            Passo {currentStep + 1} de {steps.length}
          </div>
        </div>

        {steps[currentStep].description && (
          <p className="text-sm text-muted-foreground mb-4">{steps[currentStep].description}</p>
        )}

        {renderStepContent()}

        {errors[currentStep] && <p className="text-sm text-destructive mt-2">{errors[currentStep]}</p>}

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0 || isSubmitting}>
            Voltar
          </Button>
          <Button onClick={handleNextStep} disabled={isSubmitting}>
            {isSubmitting ? "Processando..." : isLastStep ? "Concluir" : "Avançar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}