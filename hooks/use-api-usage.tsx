"use client"

import { useState, useEffect } from "react"

// Limites configuráveis
const DEFAULT_REQUEST_LIMIT = 30; // por minuto
const DEFAULT_TOKEN_LIMIT = 14400; // por dia

// Interface para o uso da API
export interface ApiUsage {
  requestsUsed: number;
  requestsLimit: number;
  tokensUsed: number;
  tokensLimit: number;
}

export function useApiUsage() {
  const [apiUsage, setApiUsage] = useState<ApiUsage>({
    requestsUsed: 0,
    requestsLimit: DEFAULT_REQUEST_LIMIT,
    tokensUsed: 0,
    tokensLimit: DEFAULT_TOKEN_LIMIT
  });

  // Carregar dados de uso do localStorage ao iniciar
  useEffect(() => {
    try {
      const storedUsage = localStorage.getItem('api-usage');
      if (storedUsage) {
        const parsedUsage = JSON.parse(storedUsage);
        // Verificar se o último reset foi hoje
        const lastResetDate = localStorage.getItem('api-usage-last-reset');
        const today = new Date().toDateString();
        
        if (lastResetDate !== today) {
          // Reset diário para tokens
          setApiUsage(prev => ({
            ...prev,
            tokensUsed: 0
          }));
          localStorage.setItem('api-usage-last-reset', today);
        } else {
          setApiUsage(parsedUsage);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados de uso da API:", error);
    }
    
    // Configurar timer para reset da contagem de requisições por minuto
    const minuteInterval = setInterval(() => {
      setApiUsage(prev => ({
        ...prev,
        requestsUsed: 0
      }));
    }, 60000); // 1 minuto
    
    return () => clearInterval(minuteInterval);
  }, []);

  // Salvar dados de uso no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('api-usage', JSON.stringify(apiUsage));
  }, [apiUsage]);

  // Função para registrar uma nova requisição da API
  const recordApiCall = (tokenCount: number = 0) => {
    setApiUsage(prev => ({
      ...prev,
      requestsUsed: prev.requestsUsed + 1,
      tokensUsed: prev.tokensUsed + tokenCount
    }));
  };

  // Verificar se os limites foram atingidos
  const isRequestLimitReached = apiUsage.requestsUsed >= apiUsage.requestsLimit;
  const isTokenLimitReached = apiUsage.tokensUsed >= apiUsage.tokensLimit;
  
  return {
    apiUsage,
    recordApiCall,
    isRequestLimitReached,
    isTokenLimitReached
  };
}