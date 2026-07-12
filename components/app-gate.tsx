"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { Header } from "@/components/header"

export function AppGate({ children }: { children: ReactNode }) {
  const { isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="w-10 h-10 text-primary fill-primary" />
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </>
  )
}
