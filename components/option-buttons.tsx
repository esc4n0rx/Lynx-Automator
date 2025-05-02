"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Code, Wrench, ArrowUpDown } from "lucide-react"
import { CustomFlowModal } from "@/components/custom-flow-modal"

interface OptionButtonsProps {
  onSelect: (option: string) => void
  onCustomFlowComplete: (option: string, inputs: string[]) => void
}

export function OptionButtons({ onSelect, onCustomFlowComplete }: OptionButtonsProps) {
  const [activeFlow, setActiveFlow] = useState<"manutenção" | "sap" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMacroClick = () => {
    setActiveFlow("manutenção")
  }

  const handleSapClick = () => {
    setActiveFlow("sap")
  }

  const handleFlowComplete = async (inputs: string[]) => {
    setIsSubmitting(true)
    try {
      if (activeFlow === "manutenção") {
        // Enviar para processamento de manutenção de macro
        onCustomFlowComplete("Manutenção de Macro", inputs)
      } else if (activeFlow === "sap") {
        // Enviar para processamento de SAP ↔ Excel
        onCustomFlowComplete("SAP ↔ Excel", inputs)
      }
    } finally {
      setIsSubmitting(false)
      setActiveFlow(null)
    }
  }

  // Configuração para o fluxo de manutenção de macro
  const macroFlowSteps = [
    {
      title: "Código VBA para manutenção",
      description: "Cole o código VBA que precisa ser revisado, otimizado ou corrigido.",
      placeholder: "Sub MinhaMacro()\n    ' Cole seu código VBA aqui\nEnd Sub",
      inputType: "code" as const,
      required: true,
    },
  ]

  // Configuração para o fluxo SAP ↔ Excel
  const sapFlowSteps = [
    {
      title: "Contexto do script",
      description: "Descreva o que o script precisa fazer no SAP.",
      placeholder: "Exemplo: Gerar um script de criação de pedidos em massa via transação ME21N",
      inputType: "text" as const,
      required: true,
    },
    {
      title: "Como gravar scripts no SAP",
      inputType: "info" as const,
      infoType: "info" as const,
      infoContent: (
        <div className="space-y-2">
          <p>Para gravar um script no SAP, siga estas etapas:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Abra o SAP GUI e vá para a transação que deseja automatizar</li>
            <li>No menu, vá para "Sistemas" &gt; "Gravar"</li>
            <li>Selecione "Gravar" e siga os passos normalmente no SAP</li>
            <li>Ao terminar, selecione "Parar" na janela do gravador</li>
            <li>Salve o script como VBS</li>
          </ol>
          <p className="mt-2 font-medium">Importante:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Durante a gravação, mova o mouse lentamente</li>
            <li>Use o teclado quando possível (Tab, Enter) para navegar</li>
            <li>Não use recursos que não são suportados pelo SAP Scripting</li>
            <li>Certifique-se de que o SAP Scripting está habilitado no seu sistema</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Script VBS gravado",
      description: "Cole aqui o script VBS gravado do SAP",
      placeholder: "If Not IsObject(application) Then\n   Set SapGuiAuto  = GetObject(\"SAPGUI\")\n   Set application = SapGuiAuto.GetScriptingEngine\nEnd If\n...",
      inputType: "code" as const,
      required: true,
    },
  ]

  const options = [
    { id: "vba", label: "Gerar Código VBA", icon: Code, onClick: () => onSelect("Gerar Código VBA") },
    { id: "maintenance", label: "Manutenção de Macro", icon: Wrench, onClick: handleMacroClick },
    { id: "sap-excel", label: "SAP ↔ Excel", icon: ArrowUpDown, onClick: handleSapClick },
  ]

  return (
    <>
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
              onClick={option.onClick}
            >
              <option.icon className="mr-2 h-5 w-5" />
              {option.label}
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Modal para Manutenção de Macro */}
      <CustomFlowModal
        isOpen={activeFlow === "manutenção"}
        onClose={() => setActiveFlow(null)}
        title="Manutenção de Macro VBA"
        description="Forneça o código VBA que precisa ser revisado, otimizado ou corrigido"
        steps={macroFlowSteps}
        onSubmit={handleFlowComplete}
        isSubmitting={isSubmitting}
      />

      {/* Modal para SAP ↔ Excel */}
      <CustomFlowModal
        isOpen={activeFlow === "sap"}
        onClose={() => setActiveFlow(null)}
        title="Integração SAP ↔ Excel"
        description="Vamos ajudar a criar um script VBA para integrar SAP e Excel"
        steps={sapFlowSteps}
        onSubmit={handleFlowComplete}
        isSubmitting={isSubmitting}
      />
    </>
  )
}