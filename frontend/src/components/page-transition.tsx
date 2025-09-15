"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { memo } from "react"

interface PageTransitionProps {
  children: React.ReactNode
}

const MotionDiv = memo(({ children, pathname }: { children: React.ReactNode; pathname: string }) => (
  <motion.div
    key={pathname}
    initial={{ opacity: 0.9, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0.9, y: -10 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className={cn("min-h-screen")}
  >
    {children}
  </motion.div>
))
MotionDiv.displayName = "MotionDiv"

export const PageTransition = memo(({ children }: PageTransitionProps) => {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <MotionDiv key={pathname} pathname={pathname}>
        {children}
      </MotionDiv>
    </AnimatePresence>
  )
})
PageTransition.displayName = "PageTransition"