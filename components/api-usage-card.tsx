"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useApiUsage } from "@/hooks/use-api-usage"
import { useState, useEffect } from "react"

export function ApiUsageCard() {
  const { apiUsage } = useApiUsage();
  const [isWarning, setIsWarning] = useState(false);
  
  // Verificar se está próximo do limite
  useEffect(() => {
    const requestPercentage = (apiUsage.requestsUsed / apiUsage.requestsLimit) * 100;
    const tokenPercentage = (apiUsage.tokensUsed / apiUsage.tokensLimit) * 100;
    
    // Definir aviso se qualquer um dos usos estiver acima de 80%
    setIsWarning(requestPercentage > 80 || tokenPercentage > 80);
  }, [apiUsage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={isWarning ? "pulse-animation" : ""}
    >
      <Card className={`bg-card border-primary shadow-lg shadow-primary/5 glow-border ${isWarning ? 'border-amber-500' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className={`h-3.5 w-3.5 ${isWarning ? 'text-amber-500' : 'text-accent'}`} />
            <span>
              {apiUsage.requestsUsed}/{apiUsage.requestsLimit} req/min | {apiUsage.tokensUsed.toLocaleString()}/{apiUsage.tokensLimit.toLocaleString()} tokens/dia
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}