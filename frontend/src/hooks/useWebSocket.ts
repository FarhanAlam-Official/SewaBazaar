"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { showToast } from '@/components/ui/enhanced-toast'
import Cookies from 'js-cookie'

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'status' | 'notification' | 'heartbeat' | 'message_deleted'
  data: any
  timestamp?: string
  conversation_id?: number
  sender_id?: number
  message_id?: number
  deletion_type?: string
}

export interface ConnectionStatus {
  isConnected: boolean
  isConnecting: boolean
  error?: string
  lastConnected?: Date
}

export interface UseWebSocketOptions {
  url?: string
  reconnectAttempts?: number
  reconnectInterval?: number
  enableHeartbeat?: boolean
  heartbeatInterval?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/messaging/',
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    enableHeartbeat = true,
    heartbeatInterval: heartbeatIntervalMs = 30000
  } = options

  const { user, isAuthenticated } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false
  })
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectCount = useRef(0)
  const reconnectTimeout = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const messageHandlers = useRef<Map<string, (message: WebSocketMessage) => void>>(new Map())

  // Connection management
  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return

    setConnectionStatus(prev => ({ ...prev, isConnecting: true, error: undefined }))

    try {
      // Get the access token for WebSocket authentication
      const token = Cookies.get('access_token')
      
      if (!token || !token.trim()) {
        throw new Error('No authentication token available')
      }
      
      // Construct WebSocket URL with authentication
      const wsUrl = `${url}?user_id=${user.id}&token=${encodeURIComponent(token)}`
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        setConnectionStatus({
          isConnected: true,
          isConnecting: false,
          lastConnected: new Date()
        })
        reconnectCount.current = 0

        // Start heartbeat
        if (enableHeartbeat) {
          heartbeatIntervalRef.current = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              }))
            }
          }, heartbeatIntervalMs)
        }

      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          // Handle heartbeat responses
          if (message.type === 'heartbeat') return

          // Dispatch to registered handlers
          messageHandlers.current.forEach((handler) => {
            try {
              handler(message)
            } catch (error) {
              console.error('Error in message handler:', error)
            }
          })
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onerror = (error) => {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'Connection error occurred'
        }))
        
        // Only show error toast if we've been trying for a while
        if (reconnectCount.current > 2) {
          showToast.error({
            title: 'Connection Issue',
            description: 'Having trouble connecting to real-time messaging.',
            duration: 3000
          })
        }
      }

      ws.current.onclose = (event) => {
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }))

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }

        // Check if close was due to authentication error (code 4001 is custom for auth errors)
        if (event.code === 4001 || event.code === 1002) {
          // Try to refresh token before reconnecting
          const refreshToken = Cookies.get('refresh_token')
          if (refreshToken) {
            // Attempt token refresh
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/refresh/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ refresh: refreshToken })
            })
            .then(response => response.json())
            .then(data => {
              if (data.access) {
                const cookieOptions = Cookies.get('remember_me') === 'true' ? { expires: 30 } : {}
                Cookies.set('access_token', data.access, cookieOptions)
                showToast.success({
                  title: 'Connection Restored',
                  description: 'Successfully reconnected to messaging service.',
                  duration: 2000
                })
                // Reset reconnect count after successful token refresh
                reconnectCount.current = 0
                setTimeout(() => connect(), 1000)
              } else {
                throw new Error('No access token in refresh response')
              }
            })
            .catch(error => {
              console.error('Token refresh failed:', error)
              // Clear invalid tokens
              Cookies.remove('access_token')
              Cookies.remove('refresh_token')
              Cookies.remove('user_role')
              Cookies.remove('remember_me')
              
              setConnectionStatus(prev => ({
                ...prev,
                error: 'Authentication expired. Please log in again.'
              }))
            })
          } else {
            setConnectionStatus(prev => ({
              ...prev,
              error: 'Authentication required. Please log in again.'
            }))
          }
          return
        }

        // Attempt reconnection if not intentional close
        if (event.code !== 1000 && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++
          
          reconnectTimeout.current = setTimeout(() => {
            connect()
          }, reconnectInterval * reconnectCount.current) // Exponential backoff
        } else if (reconnectCount.current >= reconnectAttempts) {
          setConnectionStatus(prev => ({
            ...prev,
            error: 'Connection unavailable'
          }))
          showToast.error({
            title: 'Connection Lost',
            description: 'Unable to connect to messaging service. Please check your internet connection.',
            duration: 5000
          })
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setConnectionStatus(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to establish connection'
      }))
    }
  }, [url, isAuthenticated, user, reconnectAttempts, reconnectInterval, enableHeartbeat, heartbeatIntervalMs])

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    if (ws.current) {
      ws.current.close(1000, 'Intentional disconnect')
      ws.current = null
    }
    setConnectionStatus({
      isConnected: false,
      isConnecting: false
    })
  }, [])

  // Send message
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString()
      }
      ws.current.send(JSON.stringify(fullMessage))
      return true
    } else {
      showToast.warning({
        title: 'Connection Issue',
        description: 'Message not sent. Connection is offline.',
        duration: 3000
      })
      return false
    }
  }, [])

  // Register message handler
  const onMessage = useCallback((id: string, handler: (message: WebSocketMessage) => void) => {
    messageHandlers.current.set(id, handler)
    return () => {
      messageHandlers.current.delete(id)
    }
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, user, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connectionStatus,
    sendMessage,
    onMessage,
    connect,
    disconnect,
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
    error: connectionStatus.error
  }
}

// Specific hooks for different message types
export function useRealtimeMessaging(onMessageDeleted?: (messageId: number, conversationId: number) => void) {
  const webSocket = useWebSocket()
  const [messages, setMessages] = useState<any[]>([])

  const sendChatMessage = useCallback((conversationId: number, content: string, attachments?: any[]) => {
    return webSocket.sendMessage({
      type: 'message',
      data: {
        conversation_id: conversationId,
        text: content,  // Use 'text' field to match Django model
        attachments
      }
    })
  }, [webSocket])

  // Listen for new messages and message deletion events
  useEffect(() => {
    const unsubscribe = webSocket.onMessage('chat-messages', (message) => {
      if (message.type === 'message') {
        setMessages(prev => [...prev, message.data])
      } else if (message.type === 'message_deleted') {
        // Notify the callback if provided
        if (onMessageDeleted && message.message_id && message.conversation_id) {
          onMessageDeleted(message.message_id, message.conversation_id)
        }
        
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.id === message.message_id 
              ? { ...msg, deletion_type: message.deletion_type }
              : msg
          )
          return updatedMessages
        })
      }
    })
    return unsubscribe
  }, [webSocket, onMessageDeleted])

  return {
    ...webSocket,
    messages,
    sendChatMessage
  }
}

export function useTypingIndicator() {
  const webSocket = useWebSocket()
  const [typingUsers, setTypingUsers] = useState<Map<number, { user_id: number; user_name: string; timestamp: Date }>>(new Map())

  const sendTypingStatus = useCallback((conversationId: number, isTyping: boolean) => {
    return webSocket.sendMessage({
      type: 'typing',
      data: {
        conversation_id: conversationId,
        is_typing: isTyping
      }
    })
  }, [webSocket])

  // Listen for typing indicators
  useEffect(() => {
    const unsubscribe = webSocket.onMessage('typing-indicator', (message) => {
      if (message.type === 'typing') {
        const { conversation_id, user_id, user_name, is_typing } = message.data
        
        setTypingUsers(prev => {
          const newMap = new Map(prev)
          if (is_typing) {
            newMap.set(user_id, {
              user_id,
              user_name,
              timestamp: new Date()
            })
          } else {
            newMap.delete(user_id)
          }
          return newMap
        })

        // Auto-remove typing indicator after 3 seconds
        if (message.data.is_typing) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const newMap = new Map(prev)
              newMap.delete(message.data.user_id)
              return newMap
            })
          }, 3000)
        }
      }
    })
    return unsubscribe
  }, [webSocket])

  return {
    ...webSocket,
    typingUsers: Array.from(typingUsers.values()),
    sendTypingStatus,
    isUserTyping: (userId: number) => typingUsers.has(userId)
  }
}

export function useOnlineStatus() {
  const webSocket = useWebSocket()
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())

  // Listen for status updates
  useEffect(() => {
    const unsubscribe = webSocket.onMessage('user-status', (message) => {
      if (message.type === 'status') {
        const { user_id, is_online } = message.data
        
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          if (is_online) {
            newSet.add(user_id)
          } else {
            newSet.delete(user_id)
          }
          return newSet
        })
      }
    })
    return unsubscribe
  }, [webSocket])

  return {
    ...webSocket,
    onlineUsers: Array.from(onlineUsers),
    isUserOnline: (userId: number) => onlineUsers.has(userId)
  }
}