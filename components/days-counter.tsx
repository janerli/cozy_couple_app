"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DaysCounterProps {
  startDate: string
  className?: string
}

export function DaysCounter({ startDate, className }: DaysCounterProps) {
  const [days, setDays] = useState(0)

  useEffect(() => {
    const start = new Date(startDate)
    const today = new Date()
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    setDays(diff)
  }, [startDate])

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/30 rounded-full border border-pink-200 dark:border-pink-800/30 shadow-sm",
        className
      )}
    >
      <span className="text-lg mr-0.5">💕</span>
      <motion.span 
        className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {days}
      </motion.span>
      <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
        {days % 10 === 1 && days % 100 !== 11 ? "день" :
         days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20) ? "дня" : "дней"}
      </span>
      <span className="text-pink-500 dark:text-pink-400 text-sm">любви</span>
      <span className="text-lg ml-0.5">🐱</span>
    </motion.div>
  )
}