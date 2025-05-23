"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, Send, X } from "lucide-react"
import { Chat } from "@/components/chat"
import { OptionButtons } from "@/components/option-buttons"
import { useGroqChat } from "@/hooks/use-groq-chat"
import { cn } from "@/lib/utils"

export function InputSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isWorkSessionActive, setIsWorkSessionActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, isLoading, sendMessage, selectedTask, setTask } = useGroqChat()

  // Função para tratar o evento 'keydown' quando o Enter é pressionado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        e.preventDefault()
        handleSubmit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [inputValue, files]) // Depende do inputValue e files

  const handleInputFocus = () => {
    if (!isExpanded && (!messages || messages.length === 0)) {
      setIsExpanded(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
    setTask(option)
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleCustomFlowComplete = async (option: string, inputs: string[]) => {
    // Definir a opção selecionada
    setSelectedOption(option)
    setTask(option)
    
    // Construir a mensagem com base no fluxo
    let message = ""
    
    if (option === "Manutenção de Macro") {
      // Fluxo de manutenção de macro
      const vbaCode = inputs[0]
      message = `Preciso de ajuda para revisar, otimizar e corrigir o seguinte código VBA:\n\n\`\`\`vba\n${vbaCode}\n\`\`\``
    } else if (option === "SAP ↔ Excel") {
      // Fluxo SAP ↔ Excel
      const context = inputs[0]
      const vbsScript = inputs[2] // índice 2 porque o índice 1 é o componente informativo
      message = `Preciso criar uma integração entre SAP e Excel.\n\nContexto: ${context}\n\nScript VBS gravado do SAP:\n\n\`\`\`vbs\n${vbsScript}\n\`\`\`\n\nPor favor, converta este script VBS para VBA otimizado para integração SAP-Excel.`
    }
    
    // Ativar a sessão de trabalho
    setIsWorkSessionActive(true)
    setIsExpanded(true)
    
    // Enviar a mensagem
    await sendMessage(message)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!inputValue.trim() && files.length === 0) return

    const fileContents: { name: string; content: string }[] = []

    // Read file contents if any
    if (files.length > 0) {
      for (const file of files) {
        const content = await file.text()
        fileContents.push({ name: file.name, content })
      }
    }

    // Prepare message with file contents
    let messageContent = inputValue

    // Add context based on selected option
    if (selectedOption) {
      messageContent = `[Task: ${selectedOption}] ${messageContent}`
    }

    // Ativar a sessão de trabalho com animação
    setIsWorkSessionActive(true)
    
    // Always expand the UI when sending a message
    setIsExpanded(true)

    // Send the message
    await sendMessage(messageContent)

    // Reset input and files
    setInputValue("")
    setFiles([])
  }

  // If there are messages, ensure the UI is expanded
  if (messages.length > 0 && !isExpanded) {
    setIsExpanded(true)
  }

  return (
    <motion.div
      className="w-full flex flex-col items-center gap-6"
      animate={{ height: "auto" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.div 
        className={cn(
          "input-container w-full", 
          isExpanded && "expanded",
          isWorkSessionActive && "work-session-active"
        )} 
        layout 
        transition={{ duration: 0.3 }}
      >
        <div className="input-with-buttons glow-border">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Digite sua pergunta ou anexe um arquivo..."
            className="w-full bg-transparent border-none shadow-none focus:ring-0 py-6 px-4 input-animate"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
          <div className="flex items-center px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFileSelect}
              className="text-muted-foreground hover:text-accent hover:bg-transparent focus:ring-0"
              type="button"
            >
              <File className="h-5 w-5" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".xlsm,.txt,.vba,.bas,.cls,.frm"
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSubmit}
              disabled={isLoading || (!inputValue.trim() && files.length === 0)}
              className="text-muted-foreground hover:text-accent hover:bg-transparent focus:ring-0 ml-1"
              type="button"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex flex-wrap gap-2"
          >
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-card border border-border text-muted-foreground text-xs px-3 py-1.5 rounded-full flex items-center gap-2"
              >
                <span>{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-accent focus:outline-none"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {!isExpanded && !messages.length ? (
          <motion.div
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full mt-2"
          >
            <OptionButtons 
              onSelect={handleOptionSelect} 
              onCustomFlowComplete={handleCustomFlowComplete}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: "auto",
              transition: {
                duration: 0.5,
                type: "spring",
                stiffness: 100,
                damping: 15
              }
            }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "w-full", 
              isWorkSessionActive && "work-session"
            )}
          >
            <Chat messages={messages} isLoading={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}