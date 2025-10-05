"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, isToday, isYesterday } from "date-fns"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { type Conversation } from "./types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  MessageSquare, 
  Filter,
  MoreVertical,
  Pin,
  Archive,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ConversationListProps {
  conversations: Conversation[]
  currentUserId: number
  userType?: 'customer' | 'provider'
  isLoading?: boolean
  onRefresh?: () => void
  onArchive?: (conversationId: number) => void
  onPin?: (conversationId: number) => void
  onDelete?: (conversationId: number) => void
}

export function ConversationList({
  conversations,
  currentUserId,
  userType = 'customer',
  isLoading = false,
  onRefresh,
  onArchive,
  onPin,
  onDelete
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter(
        (conv) =>
          conv.other_participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.service?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (conv.last_message?.text?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredConversations(filtered)
    }
  }, [conversations, searchQuery])

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Invalid date'
    
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    if (isToday(date)) {
      return format(date, 'hh:mm a')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM dd, hh:mm a')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[300px]" />
                </div>
                <Skeleton className="h-3 w-[50px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Messages
          </h2>
        </div>
        <div className="flex-1" />
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            className="p-3 rounded-full hover:bg-muted/80 transition-all duration-200"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl border-2 border-muted/50 focus:border-primary/60 transition-all duration-300 bg-background/70 backdrop-blur-sm shadow-lg hover:shadow-xl focus:shadow-primary/10 text-base font-medium"
        />
      </motion.div>

      {/* Conversations */}
      <ScrollArea className="h-[60vh] md:h-[65vh] lg:h-[70vh]">
        <AnimatePresence>
          {filteredConversations.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <MessageSquare className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "No conversations found" : "No messages yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms" : "Start a conversation with a service provider"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <Link href={`/dashboard/${userType}/messages/${conversation.id}`}>
                    <motion.div
                      whileHover={{ 
                        scale: 1.02, 
                        y: -4,
                        rotateX: 5,
                        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 30,
                        mass: 0.8
                      }}
                    >
                      <Card className="transition-all duration-500 cursor-pointer group shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-2xl dark:hover:shadow-blue-500/10 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700/50 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-r dark:hover:from-blue-900/20 dark:hover:to-purple-900/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="relative">
                              <motion.div
                                whileHover={{ 
                                  scale: 1.1, 
                                  rotate: [0, -5, 5, 0],
                                  transition: { rotate: { duration: 0.4 } }
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                              >
                                <Avatar className="w-14 h-14 ring-2 ring-background shadow-md group-hover:ring-4 group-hover:ring-blue-200 dark:group-hover:ring-blue-700 transition-all duration-300">
                                  <AvatarImage src={conversation.other_participant?.avatar || ''} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-bold">
                                    {(conversation.other_participant?.name || 'User')
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </motion.div>
                              {conversation.is_pinned && (
                                <motion.div
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <Pin className="w-2.5 h-2.5 text-white" />
                                </motion.div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-foreground truncate text-lg">
                                  {conversation.other_participant?.name || 'User'}
                                </h3>
                                {conversation.other_participant?.is_provider && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs bg-blue-500 dark:bg-blue-600 text-white dark:text-white border-blue-600 dark:border-blue-500 font-semibold shadow-sm"
                                  >
                                    Provider
                                  </Badge>
                                )}
                                {/* Unread count badge removed per request */}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2 font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                  Service: <span className="font-semibold text-foreground">{conversation.service.title}</span>
                                </span>
                              </p>
                              
                              {conversation.last_message && (
                                <p className="text-sm text-muted-foreground truncate font-medium">
                                  {conversation.last_message.sender.id === currentUserId ? (
                                    <span className="text-primary font-semibold">You: </span>
                                  ) : ''}
                                  {conversation.last_message.text}
                                </p>
                              )}
                            </div>

                            {/* Right side */}
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs text-muted-foreground font-medium">
                                {conversation.last_message 
                                  ? formatTimestamp(conversation.last_message.timestamp)
                                  : formatTimestamp(conversation.created_at)
                                }
                              </span>

                              {/* Actions menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <motion.div
                                    className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </motion.div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {onPin && (
                                    <DropdownMenuItem 
                                      onClick={() => onPin(conversation.id)}
                                      className="cursor-pointer"
                                    >
                                      <Pin className="w-4 h-4 mr-3" />
                                      {conversation.is_pinned ? 'Unpin' : 'Pin'}
                                    </DropdownMenuItem>
                                  )}
                                  {onArchive && (
                                    <DropdownMenuItem 
                                      onClick={() => onArchive(conversation.id)}
                                      className="cursor-pointer"
                                    >
                                      <Archive className="w-4 h-4 mr-3" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                  {onDelete && (
                                    <DropdownMenuItem 
                                      onClick={() => onDelete(conversation.id)}
                                      className="text-destructive cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4 mr-3" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}