"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  
  const animationConfig = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.15 }
  }), [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        {...animationConfig}
        className={cn("min-h-screen")}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
} 