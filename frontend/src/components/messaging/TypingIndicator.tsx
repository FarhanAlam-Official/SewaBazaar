"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface TypingIndicatorProps {
  userName: string
  userAvatar?: string
  isProvider?: boolean
}

interface MultipleTypingIndicatorProps {
  typingUsers: Array<{
    user_id: number
    user_name: string
    timestamp: Date
  }>
  className?: string
}

export function TypingIndicator({ userName, userAvatar, isProvider }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex gap-3 items-end mb-6"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Avatar className="w-10 h-10 ring-2 ring-background shadow-md">
          <AvatarImage src={userAvatar} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
            {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <motion.div 
        className="bg-gradient-to-r from-muted/80 to-muted/60 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-border/50"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {userName} is typing
          </span>
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Enhanced typing indicator for multiple users
export function MultipleTypingIndicator({ typingUsers, className = "" }: MultipleTypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].user_name} is typing...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].user_name} and ${typingUsers[1].user_name} are typing...`
    } else {
      return `${typingUsers[0].user_name} and ${typingUsers.length - 1} others are typing...`
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, height: "auto", scale: 1 }}
        exit={{ opacity: 0, y: -10, height: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`flex items-center gap-4 px-6 py-3 text-sm text-muted-foreground bg-gradient-to-r from-muted/50 to-muted/30 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg ${className}`}
      >
        {/* Animated dots */}
        <div className="flex space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={`w-2.5 h-2.5 rounded-full ${
                typingUsers.length > 1 
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                  : 'bg-gradient-to-r from-primary to-accent'
              }`}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Typing text */}
        <span className="font-semibold text-foreground">{getTypingText()}</span>

        {/* Multiple users indicator */}
        {typingUsers.length > 1 && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full shadow-sm"
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}