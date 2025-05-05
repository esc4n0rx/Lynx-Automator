// components/chat.tsx 
"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import type { Message } from "@/types/chat"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check, BookOpen, X } from "lucide-react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import type { CSSProperties } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TutorialHelper } from "@/components/tutorial-helper"

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => mod.Prism),
  { ssr: false }
)

import { vscDarkPlus as CodeStyle } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface ChatProps {
  messages: Message[]
  isLoading: boolean
}

export function Chat({ messages, isLoading }: ChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [currentTutorial, setCurrentTutorial] = useState<"basic" | "save">("basic")

  // Tutoriais disponíveis
  const vbaTutorials = {
    basic: {
      title: "Como acessar e usar o Editor VBA",
      steps: [
        {
          title: "Habilitar a guia Desenvolvedor",
          description: "Clique em Arquivo > Opções > Personalizar Faixa de Opções > Marque 'Desenvolvedor'",
          image: "/tutorials/developer-tab.png",
          alt: "Habilitando a guia Desenvolvedor no Excel",
          platform: "windows" as const
        },
        {
          title: "Habilitar a guia Desenvolvedor (Mac)",
          description: "Clique em Excel > Preferências > Faixa de Opções e Barra de Ferramentas > Marque 'Desenvolvedor'",
          image: "/tutorials/developer-tab-mac.png",
          alt: "Habilitando a guia Desenvolvedor no Excel para Mac",
          platform: "mac" as const
        },
        {
          title: "Acessar o Editor VBA",
          description: "Na guia Desenvolvedor, clique em 'Visual Basic' ou pressione Alt+F11",
          image: "/tutorials/open-vbe.png",
          alt: "Acessando o Editor VBA",
          platform: "windows" as const
        },
        {
          title: "Acessar o Editor VBA (Mac)",
          description: "Na guia Desenvolvedor, clique em 'Visual Basic' ou pressione Option+F11",
          image: "/tutorials/open-vbe-mac.png",
          alt: "Acessando o Editor VBA no Mac",
          platform: "mac" as const
        },
        {
          title: "Inserir um novo módulo",
          description: "No explorador de projetos, clique com o botão direito em VBAProject > Inserir > Módulo",
          image: "/tutorials/insert-module.png",
          alt: "Inserindo um novo módulo",
          platform: "both" as const
        },
        {
          title: "Colar e executar código",
          description: "Cole o código no módulo e volte ao Excel. Use Alt+F8 para abrir o diálogo de macros e execute-a.",
          image: "/tutorials/run-macro.png",
          alt: "Executando uma macro",
          platform: "both" as const
        }
      ]
    },
    save: {
      title: "Como salvar seu arquivo com macros",
      steps: [
        {
          title: "Salvar como .xlsm",
          description: "Vá em Arquivo > Salvar Como > Escolha 'Pasta de Trabalho Habilitada para Macro do Excel (.xlsm)'",
          image: "/tutorials/save-xlsm.png",
          alt: "Salvando como .xlsm",
          platform: "windows" as const
        },
        {
          title: "Salvar como .xlsm (Mac)",
          description: "Vá em Arquivo > Salvar Como > Escolha 'Pasta de Trabalho Habilitada para Macro do Excel (.xlsm)'",
          image: "/tutorials/save-xlsm-mac.png",
          alt: "Salvando como .xlsm no Mac",
          platform: "mac" as const
        },
        {
          title: "Aviso de segurança",
          description: "Se aparecer um aviso de segurança, clique em 'Habilitar conteúdo' para permitir que as macros sejam executadas",
          image: "/tutorials/security-warning.png",
          alt: "Aviso de segurança de macros",
          platform: "both" as const
        }
      ]
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Se não houver mensagens e não estiver carregando, não mostrar nada
  if (messages.length === 0 && !isLoading) {
    return null
  }

  // Extrair código e explicações da última mensagem do assistente
  const lastMessage = messages[messages.length - 1]
  const isLastMessageFromAssistant = lastMessage && lastMessage.role === "assistant"

  // Extrair blocos de código da última mensagem do assistente
  const codeBlockRegex = /```([\w-]*)([\s\S]*?)```/g
  const hasCodeBlocks = isLastMessageFromAssistant && codeBlockRegex.test(lastMessage.content)

  // Reset regex lastIndex
  codeBlockRegex.lastIndex = 0

  // Extrair blocos de código e suas explicações
  const codeBlocks: { language: string; code: string; explanation?: string }[] = []
  let lastIndex = 0
  let match

  if (isLastMessageFromAssistant) {
    let contentWithoutCode = lastMessage.content

    while ((match = codeBlockRegex.exec(lastMessage.content)) !== null) {
      const fullMatch = match[0]
      const language = match[1].trim() || "vba"
      const code = match[2].trim()

      // Texto antes deste bloco de código (potencial explicação)
      const precedingText = lastMessage.content.substring(lastIndex, match.index).trim()

      if (precedingText) {
        codeBlocks.push({
          language,
          code,
          explanation: precedingText,
        })
      } else {
        codeBlocks.push({
          language,
          code,
        })
      }

      // Remover este bloco de código do conteúdo
      contentWithoutCode = contentWithoutCode.replace(fullMatch, "")
      lastIndex = match.index + fullMatch.length
    }

    // Texto após o último bloco de código
    const trailingText = lastMessage.content.substring(lastIndex).trim()
    if (trailingText && codeBlocks.length > 0) {
      // Adicionar explicação ao último bloco de código se ele não tiver uma
      if (!codeBlocks[codeBlocks.length - 1].explanation) {
        codeBlocks[codeBlocks.length - 1].explanation = trailingText
      }
    }
  }

  // Determinar se usamos visualização dividida (apenas se houver blocos de código)
  const useSplitView = hasCodeBlocks && codeBlocks.length > 0

  return (
    <>
      {/* Tutorial Dialog */}
      <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
        <DialogContent className="tutorial-dialog max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tutorial VBA</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button 
              variant={currentTutorial === "basic" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setCurrentTutorial("basic")}
            >
              Usar VBA
            </Button>
            <Button 
              variant={currentTutorial === "save" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setCurrentTutorial("save")}
            >
              Salvar Macros
            </Button>
          </div>
          
          <TutorialHelper 
            title={vbaTutorials[currentTutorial].title} 
            steps={vbaTutorials[currentTutorial].steps} 
          />
        </DialogContent>
      </Dialog>

      <motion.div
        className={cn(
          "w-full rounded-lg overflow-hidden", 
          useSplitView ? "grid grid-cols-1 md:grid-cols-2 gap-4 chat-grid" : "flex flex-col space-y-4"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {useSplitView ? (
          <>
            {/* Coluna da Esquerda - Explicação */}
            <motion.div
              className="chat-column bg-card rounded-lg p-4 overflow-y-auto max-h-[70vh]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-lg font-semibold mb-3 text-primary">Explicação</div>
              {codeBlocks.map((block, i) => (
                <div key={i} className="mb-6">
                  {block.explanation && (
                    <div className="text-foreground markdown mb-2">
                      <ReactMarkdown>{block.explanation}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Coluna da Direita - Código */}
            <motion.div
              className="code-column bg-card rounded-lg p-4 overflow-y-auto max-h-[70vh] relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Tutorial Button - posicionado apenas na coluna de código */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTutorialOpen(true)} 
                className="tutorial-button flex items-center gap-1 text-sm absolute top-2 right-2 z-10"
              >
                <BookOpen className="h-4 w-4" /> Tutorial VBA
              </Button>
              
              <div className="text-lg font-semibold mb-3 text-primary">Código</div>
              {codeBlocks.map((block, i) => (
                <div key={i} className="relative code-block mb-4">
                  <div className="code-header">
                    <div className="text-sm font-mono text-muted-foreground">{block.language.toUpperCase()}</div>
                    <button
                      onClick={() => copyToClipboard(block.code, i)}
                      className="text-muted-foreground hover:text-accent focus:outline-none"
                      aria-label="Copy code"
                    >
                      {copiedIndex === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={block.language || "vba"}
                    style={CodeStyle}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "var(--code-bg)",
                      borderRadius: "0 0 0.375rem 0.375rem",
                      fontFamily: "var(--font-jetbrains)",
                    }}
                  >
                    {block.code}
                  </SyntaxHighlighter>
                </div>
              ))}
            </motion.div>
          </>
        ) : (
          // Visualização normal de chat (sem divisão)
          <div className="bg-card rounded-lg p-4 overflow-y-auto max-h-[70vh] relative">
            {/* Tutorial Button - posicionado no canto superior direito */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsTutorialOpen(true)}
              className="tutorial-button flex items-center gap-1 text-sm absolute top-2 right-2 z-10"
            >
              <BookOpen className="h-4 w-4" /> Tutorial VBA
            </Button>
            
            {/* Lista de mensagens */}
            <div className="mt-10"> {/* Adiciona um espaço acima para o botão de tutorial */}
              {messages.map((message, index) => (
                <div key={index} className={cn("message", message.role === "user" ? "user" : "assistant")}>
                  <div className="message-role">{message.role === "user" ? "Você" : "Lynx"}</div>
                  <div className="message-content">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: { node?: any, inline?: boolean, className?: string, children?: React.ReactNode } & React.ComponentPropsWithoutRef<'code'>) {
                          const match = /language-(\w+)/.exec(className || "")
                          const language = match ? match[1] : "vba"
                          const codeIndex = index * 1000 + (match ? match.index : 0)

                          return !inline ? (
                            <div className="relative code-block my-4">
                              <div className="code-header">
                                <div className="text-sm font-mono text-muted-foreground">{language.toUpperCase()}</div>
                                <button
                                  onClick={() => copyToClipboard(String(children).replace(/\n$/, ""), codeIndex)}
                                  className="text-muted-foreground hover:text-accent focus:outline-none"
                                  aria-label="Copy code"
                                >
                                  {copiedIndex === codeIndex ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                              <SyntaxHighlighter
                                language={language}
                                style={CodeStyle as unknown as { [key: string]: CSSProperties }}
                                customStyle={{
                                  margin: 0,
                                  padding: "1rem",
                                  background: "var(--code-bg)",
                                  borderRadius: "0 0 0.375rem 0.375rem",
                                  fontFamily: "var(--font-jetbrains)",
                                }}
                              >
                                {String(children)}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code
                              className="bg-[var(--code-bg)] text-[var(--code-text)] px-1.5 py-0.5 rounded font-jetbrains text-sm"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message assistant">
                  <div className="message-content">
                    <div className="thinking-animation">
                      <span className="thinking-dot">Pensando</span>
                      <span className="thinking-dot">.</span>
                      <span className="thinking-dot">.</span>
                      <span className="thinking-dot">.</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}