"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { ConversationList, messagingApi, type Conversation } from "@/components/messaging"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { MessageSquare } from "lucide-react"

export default function CustomerMessagesPage() {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const loadConversations = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Use real API to get conversations
        const response = await messagingApi.getConversations()
        
        // Debug: Log the actual API response structure
        console.log('API Response:', response)
        console.log('First conversation:', response.results?.[0])
        if (response.results?.[0]) {
          const firstConv = response.results[0] as any;
          console.log('Provider data:', firstConv.provider)
          console.log('Customer data:', firstConv.customer)
          console.log('Service data:', firstConv.service)
          console.log('Latest messages:', firstConv.latest_messages)
          console.log('Other participant (should be undefined):', firstConv.other_participant)
        }
        
        const conversationsWithPinStatus = (response.results || []).map((conv: any) => {
          // Determine the other participant based on current user's role
          // For customer dashboard, the other participant is always the provider
          const otherParticipant = conv.provider;
          
          // Get the last message if available
          const lastMessage = conv.latest_messages?.[0] || null;

          return {
            ...conv,
            id: conv.id || 0,
            other_participant: {
              id: otherParticipant?.id || 0,
              name: otherParticipant?.full_name || 
                    (otherParticipant?.first_name && otherParticipant?.last_name 
                      ? `${otherParticipant.first_name} ${otherParticipant.last_name}`.trim()
                      : otherParticipant?.email?.split('@')[0] || 'Provider'),
              avatar: otherParticipant?.avatar || null,
              is_provider: true, // Since this is customer dashboard, other participant is always provider
            },
            service: {
              id: conv.service?.id || 0,
              title: conv.service?.title || 'Unknown Service',
              category: conv.service?.category || 'General',
            },
            last_message: lastMessage ? {
              id: lastMessage.id,
              text: lastMessage.text,
              timestamp: lastMessage.timestamp || lastMessage.created_at,
              sender: {
                id: lastMessage.sender?.id || 0,
                name: lastMessage.sender?.full_name || 
                      (lastMessage.sender?.first_name && lastMessage.sender?.last_name 
                        ? `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`.trim()
                        : lastMessage.sender?.email?.split('@')[0] || 'User'),
                avatar: lastMessage.sender?.avatar || null,
                is_provider: lastMessage.sender?.role === 'provider' || false,
              }
            } : null,
            is_pinned: messagingApi.isConversationPinned(conv.id || 0)
          }
        })
        setConversations(conversationsWithPinStatus)
      } catch (err: any) {
        console.error('Failed to load conversations:', err)
        setError(err.message || 'Failed to load conversations')
        showToast.error({
          title: "Failed to Load Messages",
          description: "Please refresh the page to try again"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()

    // Auto-refresh conversations every 5 seconds
    const refreshInterval = setInterval(async () => {
      try {
        const response = await messagingApi.getConversations()
        const conversationsWithPinStatus = (response.results || []).map((conv: any) => {
          // Determine the other participant - for customer dashboard, it's always the provider
          const otherParticipant = conv.provider;
          const lastMessage = conv.latest_messages?.[0] || null;
          
          return {
            ...conv,
            id: conv.id || 0,
            other_participant: {
              id: otherParticipant?.id || 0,
              name: otherParticipant?.full_name || 
                    (otherParticipant?.first_name && otherParticipant?.last_name 
                      ? `${otherParticipant.first_name} ${otherParticipant.last_name}`.trim()
                      : otherParticipant?.email?.split('@')[0] || 'Provider'),
              avatar: otherParticipant?.avatar || null,
              is_provider: true,
            },
            service: {
              id: conv.service?.id || 0,
              title: conv.service?.title || 'Unknown Service',
              category: conv.service?.category || 'General',
            },
            last_message: lastMessage ? {
              id: lastMessage.id,
              text: lastMessage.text,
              timestamp: lastMessage.timestamp || lastMessage.created_at,
              sender: {
                id: lastMessage.sender?.id || 0,
                name: lastMessage.sender?.full_name || 
                      (lastMessage.sender?.first_name && lastMessage.sender?.last_name 
                        ? `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`.trim()
                        : lastMessage.sender?.email?.split('@')[0] || 'User'),
                avatar: lastMessage.sender?.avatar || null,
                is_provider: lastMessage.sender?.role === 'provider' || false,
              }
            } : null,
            is_pinned: messagingApi.isConversationPinned(conv.id || 0)
          }
        })
        setConversations(conversationsWithPinStatus)
      } catch (err) {
        console.error('Failed to refresh conversations:', err)
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, user])

  const handleRefresh = async () => {
    // Reload conversations
    const loadConversations = async () => {
      try {
        setIsLoading(true)
        const response = await messagingApi.getConversations()
        const conversationsWithPinStatus = (response.results || []).map((conv: any) => {
          // Determine the other participant - for customer dashboard, it's always the provider
          const otherParticipant = conv.provider;
          const lastMessage = conv.latest_messages?.[0] || null;
          
          return {
            ...conv,
            id: conv.id || 0,
            other_participant: {
              id: otherParticipant?.id || 0,
              name: otherParticipant?.full_name || 
                    (otherParticipant?.first_name && otherParticipant?.last_name 
                      ? `${otherParticipant.first_name} ${otherParticipant.last_name}`.trim()
                      : otherParticipant?.email?.split('@')[0] || 'Provider'),
              avatar: otherParticipant?.avatar || null,
              is_provider: true,
            },
            service: {
              id: conv.service?.id || 0,
              title: conv.service?.title || 'Unknown Service',
              category: conv.service?.category || 'General',
            },
            last_message: lastMessage ? {
              id: lastMessage.id,
              text: lastMessage.text,
              timestamp: lastMessage.timestamp || lastMessage.created_at,
              sender: {
                id: lastMessage.sender?.id || 0,
                name: lastMessage.sender?.full_name || 
                      (lastMessage.sender?.first_name && lastMessage.sender?.last_name 
                        ? `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`.trim()
                        : lastMessage.sender?.email?.split('@')[0] || 'User'),
                avatar: lastMessage.sender?.avatar || null,
                is_provider: lastMessage.sender?.role === 'provider' || false,
              }
            } : null,
            is_pinned: messagingApi.isConversationPinned(conv.id)
          }
        })
        setConversations(conversationsWithPinStatus)
        showToast.success({
          title: "Messages Refreshed",
          description: "Your conversations have been updated"
        })
      } catch (err: any) {
        showToast.error({
          title: "Refresh Failed",
          description: "Could not refresh messages"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    await loadConversations()
  }

  const handleArchive = async (conversationId: number) => {
    try {
      await messagingApi.archiveConversation(conversationId)
      
      setConversations(prev => 
        prev.filter(conv => conv.id !== conversationId)
      )
      
      showToast.success({
        title: "Conversation Archived",
        description: "The conversation has been archived"
      })
    } catch (err: any) {
      showToast.error({
        title: "Archive Failed",
        description: "Could not archive conversation"
      })
    }
  }

  const handlePin = async (conversationId: number) => {
    try {
      await messagingApi.pinConversation(conversationId)
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, is_pinned: !conv.is_pinned }
            : conv
        )
      )
      
      const conversation = conversations.find(conv => conv.id === conversationId)
      const isPinned = conversation?.is_pinned
      
      showToast.success({
        title: isPinned ? "Conversation Unpinned" : "Conversation Pinned",
        description: isPinned ? "Conversation removed from top" : "Conversation moved to top"
      })
    } catch (err: any) {
      showToast.error({
        title: "Pin Failed",
        description: "Could not update conversation"
      })
    }
  }

  const handleDelete = async (conversationId: number) => {
    if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      return
    }
    
    try {
      await messagingApi.deleteConversation(conversationId)
      
      setConversations(prev => 
        prev.filter(conv => conv.id !== conversationId)
      )
      
      showToast.success({
        title: "Conversation Deleted",
        description: "The conversation has been permanently deleted"
      })
    } catch (err: any) {
      showToast.error({
        title: "Delete Failed",
        description: "Could not delete conversation"
      })
    }
  }

  if (error) {
    return (
      <div className="w-full px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full py-8 px-4 lg:px-6 xl:px-8">
      {isLoading && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 rounded-xl border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-80" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl"
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Messages</h1>
            <p className="text-lg text-muted-foreground font-medium">
              Stay connected with your service providers
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <motion.div
            className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{conversations.length}</p>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="p-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl border border-green-500/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <div className="w-5 h-5 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {conversations.filter(conv => conv.unread_count > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="p-4 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-xl border border-blue-500/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {conversations.filter(conv => conv.is_pinned).length}
                </p>
                <p className="text-sm text-muted-foreground">Pinned Chats</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-2xl border-2 border-border/50 bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <ConversationList
              conversations={conversations}
              currentUserId={user?.id || 0}
              userType="customer"
              isLoading={isLoading}
              onRefresh={handleRefresh}
              onArchive={handleArchive}
              onPin={handlePin}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}