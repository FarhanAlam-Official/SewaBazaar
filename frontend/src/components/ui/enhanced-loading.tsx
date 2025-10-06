"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface EnhancedLoadingProps {
  variant?: "default" | "minimal" | "dots" | "pulse"
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

export function EnhancedLoading({ 
  variant = "default", 
  size = "md",
  text,
  className = "" 
}: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size]} border-2 border-primary/20 border-t-primary rounded-full`}
        />
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className={`${size === "sm" ? "w-2 h-2" : size === "lg" ? "w-4 h-4" : "w-3 h-3"} bg-primary rounded-full`}
          />
        ))}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7] 
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`${sizeClasses[size]} bg-primary rounded-full`}
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary mx-auto`} />
          {text && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-sm text-muted-foreground mt-2"
            >
              {text}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-10 h-10 bg-muted rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "justify-end"}`}>
          {i % 2 === 0 && <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />}
          <div className={`max-w-sm space-y-2 ${i % 2 === 0 ? "" : "text-right"}`}>
            <div className="h-12 bg-muted rounded-2xl animate-pulse" />
            <div className="h-3 bg-muted rounded w-16 animate-pulse" />
          </div>
          {i % 2 !== 0 && <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />}
        </div>
      ))}
    </div>
  )
}