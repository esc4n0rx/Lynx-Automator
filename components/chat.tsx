"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import type { Message } from "@/types/chat"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, Check } from "lucide-react"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import type { CSSProperties } from "react";


const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => mod.Prism),
  { ssr: false }
);

import { vscDarkPlus as CodeStyle } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ChatProps {
  messages: Message[]
  isLoading: boolean
}

export function Chat({ messages, isLoading }: ChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (messages.length === 0 && !isLoading) {
    return null
  }

  // Find code blocks and explanations to separate them
  const lastMessage = messages[messages.length - 1]
  const isLastMessageFromAssistant = lastMessage && lastMessage.role === "assistant"

  // Extract code blocks from the last assistant message
  const codeBlockRegex = /```([\w-]*)([\s\S]*?)```/g
  const hasCodeBlocks = isLastMessageFromAssistant && codeBlockRegex.test(lastMessage.content)

  // Reset regex lastIndex
  codeBlockRegex.lastIndex = 0

  // Extract code blocks and their explanations
  const codeBlocks: { language: string; code: string; explanation?: string }[] = []
  let lastIndex = 0
  let match

  if (isLastMessageFromAssistant) {
    let contentWithoutCode = lastMessage.content

    while ((match = codeBlockRegex.exec(lastMessage.content)) !== null) {
      const fullMatch = match[0]
      const language = match[1].trim() || "vba"
      const code = match[2].trim()

      // Get the text before this code block (potential explanation)
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

      // Remove this code block from the content
      contentWithoutCode = contentWithoutCode.replace(fullMatch, "")

      lastIndex = match.index + fullMatch.length
    }

    // Get any text after the last code block
    const trailingText = lastMessage.content.substring(lastIndex).trim()
    if (trailingText && codeBlocks.length > 0) {
      // Add explanation to the last code block if it doesn't have one
      if (!codeBlocks[codeBlocks.length - 1].explanation) {
        codeBlocks[codeBlocks.length - 1].explanation = trailingText
      }
    }
  }

  // Determine if we should use split view (only if there are code blocks)
  const useSplitView = hasCodeBlocks && codeBlocks.length > 0

  return (
    <motion.div
      className={cn("w-full rounded-lg", useSplitView ? "split-view-container active" : "flex flex-col space-y-4")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {useSplitView ? (
        // Split view layout (text on left, code on right)
        <>
          <motion.div
            className="bg-card rounded-lg p-4 overflow-y-auto max-h-[70vh]"
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

          <motion.div
            className="bg-card rounded-lg p-4 overflow-y-auto max-h-[70vh]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
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
        // Standard chat view
        <div className="bg-card rounded-lg p-4 overflow-y-auto max-h-[70vh]">
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
              <div className="message-role">Lynx</div>
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
      )}
    </motion.div>
  )
}