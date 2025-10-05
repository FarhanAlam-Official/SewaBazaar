"use client"

import { motion } from "framer-motion"
import { Circle, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnlineStatusProps {
  isOnline: boolean
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  lastSeen?: Date
}

export function OnlineStatus({ 
  isOnline, 
  size = 'sm',
  showText = false,
  className = "",
  lastSeen
}: OnlineStatusProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  }

  const getLastSeenText = () => {
    if (!lastSeen) return 'Last seen recently'
    
    const now = new Date()
    const diff = now.getTime() - lastSeen.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Last seen just now'
    if (minutes < 60) return `Last seen ${minutes}m ago`
    if (hours < 24) return `Last seen ${hours}h ago`
    if (days < 7) return `Last seen ${days}d ago`
    return 'Last seen a while ago'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Status Indicator */}
      <div className="relative">
        <motion.div
          animate={isOnline ? {
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8]
          } : {}}
          transition={{
            duration: 2,
            repeat: isOnline ? Infinity : 0,
            ease: "easeInOut"
          }}
          className={cn(
            "rounded-full border-2 border-background",
            sizeClasses[size],
            isOnline 
              ? "bg-green-500 shadow-green-500/50 shadow-sm" 
              : "bg-gray-400"
          )}
        />
        
        {/* Pulse effect for online status */}
        {isOnline && (
          <motion.div
            animate={{
              scale: [1, 2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={cn(
              "absolute inset-0 rounded-full bg-green-500",
              sizeClasses[size]
            )}
          />
        )}
      </div>

      {/* Status Text */}
      {showText && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : getLastSeenText()}
        </span>
      )}
    </div>
  )
}

// Connection status indicator for the current user
export function ConnectionStatusIndicator({ 
  isConnected, 
  isConnecting, 
  className = "" 
}: {
  isConnected: boolean
  isConnecting: boolean
  className?: string
}) {
  if (isConnecting) {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}
      >
        <Wifi className="w-4 h-4" />
        <span>Connecting...</span>
      </motion.div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      {isConnected ? (
        <>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Wifi className="w-4 h-4 text-green-500" />
          </motion.div>
          <span className="text-green-600">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-red-600">Offline</span>
        </>
      )}
    </div>
  )
}

// Bulk online status for multiple users
export function BulkOnlineStatus({ 
  userStatuses, 
  className = "" 
}: {
  userStatuses: Array<{
    userId: number
    isOnline: boolean
    lastSeen?: Date
  }>
  className?: string
}) {
  const onlineCount = userStatuses.filter(u => u.isOnline).length
  const totalCount = userStatuses.length

  if (totalCount === 0) return null

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className="flex -space-x-1">
        {userStatuses.slice(0, 3).map((status, index) => (
          <OnlineStatus
            key={status.userId}
            isOnline={status.isOnline}
            size="sm"
            className="ring-2 ring-background"
            lastSeen={status.lastSeen}
          />
        ))}
        {totalCount > 3 && (
          <div className="w-2 h-2 rounded-full bg-muted border-2 border-background flex items-center justify-center">
            <span className="text-xs">+</span>
          </div>
        )}
      </div>
      <span>
        {onlineCount} of {totalCount} online
      </span>
    </div>
  )
}