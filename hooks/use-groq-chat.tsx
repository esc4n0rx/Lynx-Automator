"use client"

import { useState, useCallback } from "react"
import type { Message } from "@/types/chat"
import { useApiUsage } from "@/hooks/use-api-usage"
import { useToast } from "@/components/ui/use-toast"

export function useGroqChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const { apiUsage, recordApiCall, isRequestLimitReached, isTokenLimitReached } = useApiUsage()
  const { toast } = useToast()

  const setTask = useCallback((task: string | null) => {
    setSelectedTask(task)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return
  
      if (isRequestLimitReached) {
        toast({
          title: "Limite de requisições atingido",
          description: "Aguarde um momento antes de fazer uma nova requisição.",
          variant: "destructive"
        })
        return
      }
  
      if (isTokenLimitReached) {
        toast({
          title: "Limite diário de tokens atingido",
          description: "Você atingiu seu limite diário de tokens. Tente novamente amanhã.",
          variant: "destructive"
        })
        return
      }

      setMessages([]); // Limpar mensagens anteriores, por enquanto nao terá histórico

      const userMessage: Message = { role: "user", content }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        conversationHistory.push({
          role: "user" as const,
          content,
        })

        const assistantMessage: Message = { role: "assistant", content: "" }
        setMessages((prev) => [...prev, assistantMessage])

        recordApiCall()

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: conversationHistory,
            task: selectedTask
          }),
        })

        if (!response.ok) {
          throw new Error('Erro na requisição da API')
        }

        const result = await response.json()

        const estimatedTokens = Math.ceil(result.usage?.total_tokens || result.choices?.[0]?.message?.content.length / 4 || 0)
        
        recordApiCall(estimatedTokens)

        if (result.choices && result.choices[0]?.message?.content) {
          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            lastMessage.content = result.choices[0].message.content
            return newMessages
          })
        }
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error)
        setMessages((prev) => [
          ...prev.slice(0, -1), 
          {
            role: "assistant",
            content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, selectedTask, isRequestLimitReached, isTokenLimitReached, recordApiCall, toast]
  )

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return null

      const fileContents: { name: string; content: string }[] = []

      for (const file of files) {
        try {
          const content = await file.text()
          fileContents.push({ name: file.name, content })
        } catch (error) {
          console.error(`Erro ao ler o arquivo ${file.name}:`, error)
        }
      }

      return fileContents
    },
    []
  )

  const sendMessageWithFiles = useCallback(
    async (content: string, files: File[]) => {
      const fileContents = await processFiles(files)
      
      if (!fileContents || fileContents.length === 0) {
        return sendMessage(content)
      }


      let fullContent = content || "Analise os arquivos anexados."
      
      fullContent += "\n\nArquivos anexados:\n" + 
        fileContents.map((file) => `\n--- ${file.name} ---\n\`\`\`vba\n${file.content}\n\`\`\``).join("\n")

      return sendMessage(fullContent)
    },
    [sendMessage, processFiles]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    selectedTask,
    setTask,
    sendMessage,
    sendMessageWithFiles,
    clearMessages,
  }
}