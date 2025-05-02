import { NextResponse } from 'next/server'
import { Groq } from "groq-sdk"
import { getSystemPrompt } from "@/lib/prompt-system"

// Inicializar o cliente Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Define o modelo a ser usado
const MODEL = "llama3-70b-8192"

export async function POST(request: Request) {
  try {
    const { messages, task } = await request.json()
    
    // Obter o prompt do sistema apropriado
    const systemPrompt = getSystemPrompt(task)
    
    // Adicionar o prompt do sistema como primeira mensagem
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ]
    
    // Enviar para o modelo
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: fullMessages,
      temperature: 0.5,
      max_tokens: 4096,
    })
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    )
  }
}