"use client"

import { useState, useEffect } from "react"

const DEFAULT_REQUEST_LIMIT = 30; 
const DEFAULT_TOKEN_LIMIT = 14400; 


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

  useEffect(() => {
    try {
      const storedUsage = localStorage.getItem('api-usage');
      if (storedUsage) {
        const parsedUsage = JSON.parse(storedUsage);
        const lastResetDate = localStorage.getItem('api-usage-last-reset');
        const today = new Date().toDateString();
        
        if (lastResetDate !== today) {
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
    
    const minuteInterval = setInterval(() => {
      setApiUsage(prev => ({
        ...prev,
        requestsUsed: 0
      }));
    }, 60000); 
    
    return () => clearInterval(minuteInterval);
  }, []);

  useEffect(() => {
    localStorage.setItem('api-usage', JSON.stringify(apiUsage));
  }, [apiUsage]);


  const recordApiCall = (tokenCount: number = 0) => {
    setApiUsage(prev => ({
      ...prev,
      requestsUsed: prev.requestsUsed + 1,
      tokensUsed: prev.tokensUsed + tokenCount
    }));
  };


  const isRequestLimitReached = apiUsage.requestsUsed >= apiUsage.requestsLimit;
  const isTokenLimitReached = apiUsage.tokensUsed >= apiUsage.tokensLimit;
  
  return {
    apiUsage,
    recordApiCall,
    isRequestLimitReached,
    isTokenLimitReached
  };
}