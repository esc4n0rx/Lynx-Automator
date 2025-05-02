"use client"

import { useState, useCallback } from "react"
import type { Message } from "@/types/chat"

export function useGroqChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  // Função para definir a tarefa selecionada
  const setTask = useCallback((task: string | null) => {
    setSelectedTask(task)
  }, [])

  // Função para enviar uma mensagem
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      // Adicionar mensagem do usuário
      const userMessage: Message = { role: "user", content }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        // Preparar histórico de conversação para a API
        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        // Adicionar a mensagem do usuário atual
        conversationHistory.push({
          role: "user" as const,
          content,
        })

        // Criar uma mensagem vazia do assistente como placeholder
        const assistantMessage: Message = { role: "assistant", content: "" }
        setMessages((prev) => [...prev, assistantMessage])

        // Enviar para a API do Next.js
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

        // Atualizar a mensagem do assistente com a resposta
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
        // Adicionar mensagem de erro
        setMessages((prev) => [
          ...prev.slice(0, -1), // Remover a mensagem vazia do assistente
          {
            role: "assistant",
            content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, selectedTask]
  )

  // Função para processar arquivos carregados
  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return null

      const fileContents: { name: string; content: string }[] = []

      // Ler o conteúdo dos arquivos
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

  // Função para enviar mensagem com arquivos
  const sendMessageWithFiles = useCallback(
    async (content: string, files: File[]) => {
      const fileContents = await processFiles(files)
      
      if (!fileContents || fileContents.length === 0) {
        // Se não houver arquivos ou houver erro no processamento, enviar apenas a mensagem
        return sendMessage(content)
      }

      // Preparar o conteúdo da mensagem com os arquivos
      let fullContent = content || "Analise os arquivos anexados."
      
      fullContent += "\n\nArquivos anexados:\n" + 
        fileContents.map((file) => `\n--- ${file.name} ---\n\`\`\`vba\n${file.content}\n\`\`\``).join("\n")

      // Enviar a mensagem completa
      return sendMessage(fullContent)
    },
    [sendMessage, processFiles]
  )

  // Limpar o histórico de mensagens
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