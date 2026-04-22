"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Sparkles, Cat } from "lucide-react"
import { cn } from "@/lib/utils"

interface TogetherWidgetProps {
  startDate: string // "2024-02-14"
  className?: string
}

export function TogetherWidget({ startDate, className }: TogetherWidgetProps) {
  const [days, setDays] = useState(0)
  const [showSparkle, setShowSparkle] = useState(false)

  useEffect(() => {
    const start = new Date(startDate)
    const today = new Date()
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    setDays(diff)
    
    // 🔥 Анимация при загрузке
    setShowSparkle(true)
    setTimeout(() => setShowSparkle(false), 2000)
  }, [startDate])

  // Каждые 10 секунд показываем искорки
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSparkle(true)
      setTimeout(() => setShowSparkle(false), 1500)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative inline-flex items-center gap-2 px-5 py-2 rounded-full",
        "bg-gradient-to-r from-pink-100/90 to-rose-100/90 dark:from-pink-950/50 dark:to-rose-950/50",
        "border border-pink-200/60 dark:border-pink-800/40",
        "shadow-sm backdrop-blur-sm",
        className
      )}
    >
      {/* Искорки */}
      <AnimatePresence>
        {showSparkle && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: -25, y: -25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute text-amber-400"
            >
              <Sparkles className="w-3 h-3" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: 25, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute text-pink-300"
            >
              <Sparkles className="w-2.5 h-2.5" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: -5, y: -35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="absolute text-amber-300"
            >
              <Sparkles className="w-2 h-2" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🔥 Котик слева */}
      <motion.div
        animate={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cat className="w-5 h-5 text-pink-500 dark:text-pink-400" />
      </motion.div>

      {/* Текст */}
      <span className="text-sm text-muted-foreground">мы вместе уже</span>

      {/* Число с анимацией */}
      <motion.span
        key={days}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-lg font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent"
      >
        {days}
      </motion.span>

      {/* Склонение слова "дней" */}
      <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
        {days % 10 === 1 && days % 100 !== 11 ? "день" :
         days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20) ? "дня" : "дней"}
      </span>

      {/* 🔥 Бьющееся сердечко справа */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="w-4 h-4 text-pink-500 fill-pink-500 dark:text-pink-400 dark:fill-pink-400" />
      </motion.div>
    </motion.div>
  )
}