"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"

export function ApiUsageCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="bg-card border-primary shadow-lg shadow-primary/5 glow-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-accent" />
            <span>30 requests/minuto | 14.400 tokens/dia</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
