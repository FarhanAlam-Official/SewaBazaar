"use client"

import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const handleStart = () => setIsTransitioning(true)
    const handleComplete = () => setIsTransitioning(false)

    router.events.on("routeChangeStart", handleStart)
    router.events.on("routeChangeComplete", handleComplete)
    router.events.on("routeChangeError", handleComplete)

    return () => {
      router.events.off("routeChangeStart", handleStart)
      router.events.off("routeChangeComplete", handleComplete)
      router.events.off("routeChangeError", handleComplete)
    }
  }, [router])

  return (
    <div
      className={cn(
        "min-h-screen transition-opacity duration-300",
        isTransitioning ? "opacity-50" : "opacity-100"
      )}
    >
      {children}
    </div>
  )
} 