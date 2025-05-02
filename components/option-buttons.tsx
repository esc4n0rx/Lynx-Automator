"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Code, Wrench, ArrowUpDown } from "lucide-react"

interface OptionButtonsProps {
  onSelect: (option: string) => void
}

export function OptionButtons({ onSelect }: OptionButtonsProps) {
  const options = [
    { id: "vba", label: "Gerar Código VBA", icon: Code },
    { id: "maintenance", label: "Manutenção de Macro", icon: Wrench },
    { id: "sap-excel", label: "SAP ↔ Excel", icon: ArrowUpDown },
  ]

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {options.map((option, index) => (
        <motion.div
          key={option.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
        >
          <Button
            variant="outline"
            className="bg-card border-primary hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-300 px-5 py-6"
            onClick={() => onSelect(option.label)}
          >
            <option.icon className="mr-2 h-5 w-5" />
            {option.label}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  )
}
