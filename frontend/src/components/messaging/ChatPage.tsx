/**
 * ChatPage Component - Real-time messaging interface for SewaBazaar platform
 * 
 * This component provides a comprehensive chat interface with the following features:
 * - Real-time messaging via WebSocket connection
 * - File uploads (images, documents, voice messages)
 * - Voice message recording and playback
 * - Camera integration for photo capture
 * - Emoji picker integration
 * - Typing indicators
 * - Message status indicators (sent, delivered, read)
 * - Auto-scroll to latest messages
 * - Message deduplication for WebSocket/HTTP sync
 * 
 * Architecture:
 * - Uses React hooks for state management
 * - Integrates with Django backend via REST API and WebSocket
 * - Implements optimistic UI updates for better UX
 * - Handles offline/online status gracefully
 * 
 * @example
 * ```tsx
 * <ChatPage 
 *   conversationId={123} 
 *   currentUser={{ id: 1, name: "John Doe", avatar: "..." }} 
 * />
 * ```
 */
"use client"

// React Core Imports
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"

// Animation and UI Libraries
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { showToast } from "@/components/ui/enhanced-toast"

// Lucide Icons for UI elements
import { 
  ArrowLeft,      // Back navigation
  Send,           // Send message button
  Paperclip,      // File attachment
  MoreVertical,   // Options menu
  Info,           // Information icon

  Mic,            // Voice recording
  Camera,         // Photo capture
  Smile,          // Emoji picker
  MicOff,         // Mute microphone
  Square,         // Stop recording
  Play,           // Play voice message
  Pause,          // Pause voice message
  X               // Close/cancel actions
} from "lucide-react"

// Dropdown Menu Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Custom Messaging Components
import { MessageBubble } from "./MessageBubble"                    // Individual message display component
import { TypingIndicator, MultipleTypingIndicator } from "./TypingIndicator"  // Shows when users are typing
import { FileUpload } from "./FileUpload"                          // File attachment handler
import { EmojiPicker } from "./EmojiPicker"                        // Emoji selection interface
import { VoiceMessageRecorder } from "./VoiceMessageRecorder"      // Voice recording functionality
import { CameraModal } from "./CameraModal"                        // Camera photo capture
import { ChatInfoModal } from "./ChatInfoModal"                    // Chat information modal

// WebSocket Hooks for Real-time Features
import { useRealtimeMessaging, useTypingIndicator } from "@/hooks/useWebSocket"

// Loading and UI Components
import { EnhancedLoading, MessageSkeleton } from "@/components/ui/enhanced-loading"
import { Skeleton } from "@/components/ui/skeleton"
import { format, isToday, isYesterday, differenceInCalendarDays, parseISO } from "date-fns"

// Authentication and HTTP client
import Cookies from 'js-cookie'

/**
 * Production-ready file validation configuration
 * Only allows images and videos with specific size and format restrictions
 */
const FILE_VALIDATION = {
  // Maximum file size limits (in bytes)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,  // 10MB for images
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB for videos
  MAX_FILES: 10, // Maximum number of files per message
  
  // Allowed file types
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif'
  ],
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/avi',
    'video/quicktime'
  ],
  
  // File extensions for additional validation
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  ALLOWED_VIDEO_EXTENSIONS: ['.mp4', '.webm', '.mov', '.avi']
} as const

/**
 * Props interface for the ChatPage component
 * 
 * @interface ChatPageProps
 * @property {number} conversationId - Unique identifier for the conversation
 * @property {object} currentUser - Current authenticated user information
 * @property {number} currentUser.id - User's unique ID
 * @property {string} currentUser.name - User's display name
 * @property {string} [currentUser.avatar] - Optional avatar URL
 */
interface ChatPageProps {
  conversationId: number
  currentUser: {
    id: number
    name: string
    avatar?: string
  }
}

/**
 * Message interface matching Django backend model structure
 * 
 * @interface Message
 * @property {number} id - Unique message identifier
 * @property {string} text - Message content (maps to Django 'text' field)
 * @property {string} timestamp - ISO timestamp of message creation
 * @property {object} sender - Message sender information
 * @property {boolean} is_read - Read status of the message
 * @property {string} [attachment] - Single attachment URL (Django model)
 * @property {string} [attachment_url] - Alternative attachment URL field
 * @property {Array} [attachments] - Legacy multiple attachments support
 * 
 * @example
 * ```typescript
 * const message: Message = {
 *   id: 123,
 *   text: "Hello there!",
 *   timestamp: "2024-01-15T10:30:00Z",
 *   sender: { id: 1, name: "John", is_provider: false },
 *   is_read: true,
 *   attachment: "https://example.com/image.jpg"
 * }
 * ```
 */
interface Message {
  id: number
  text: string  // Changed to match Django API field name
  timestamp: string
  sender: {
    id: number
    name: string
    avatar?: string
    is_provider?: boolean
  }
  is_read: boolean
  attachment?: string  // Single attachment URL as per Django model
  attachment_url?: string
  attachments?: Array<{
    id: number
    file_name: string
    file_url: string
    file_type: string
    file_size: number
  }>
  deletion_type?: 'self' | 'everyone'
}

/**
 * Conversation interface representing a chat session
 * 
 * @interface Conversation
 * @property {number} id - Unique conversation identifier
 * @property {object} service - Associated service information
 * @property {object} other_participant - The other person in the conversation
 * @property {Message[]} messages - Array of messages in chronological order
 * 
 * @example
 * ```typescript
 * const conversation: Conversation = {
 *   id: 456,
 *   service: { id: 1, title: "Plumbing Service", category: "Home" },
 *   other_participant: { id: 2, name: "Jane", is_provider: true },
 *   messages: [...]
 * }
 * ```
 */
interface Conversation {
  id: number
  service: {
    id: number
    title: string
    category: string
  }
  other_participant: {
    id: number
    name: string
    avatar?: string
    is_provider: boolean
  }
  messages: Message[]
}

/**
 * Main ChatPage component implementation
 * 
 * This component manages the entire chat interface lifecycle including:
 * - State management for messages, UI elements, and real-time features
 * - WebSocket integration for live messaging
 * - File upload and multimedia message handling
 * - Auto-scroll behavior and message deduplication
 * 
 * @param conversationId - The ID of the conversation to display
 * @param currentUser - The current authenticated user's information
 */
export function ChatPage({ conversationId, currentUser }: ChatPageProps) {
  // ==================== CORE HOOKS AND NAVIGATION ====================
  
  /**
   * Next.js router for navigation (back button, redirects)
   * Used for: Going back to conversations list, handling navigation errors
   */
  const router = useRouter()

  // ==================== MAIN STATE MANAGEMENT ====================
  
  /**
   * Primary conversation state containing messages and participant info
   * Structure matches the Conversation interface defined above
   * 
   * @example
   * ```typescript
   * // When loaded:
   * {
   *   id: 123,
   *   service: { id: 1, title: "Plumbing Service" },
   *   other_participant: { id: 2, name: "John Provider" },
   *   messages: [{ id: 1, text: "Hello!", sender: {...}, ... }]
   * }
   * ```
   */
  const [conversation, setConversation] = useState<Conversation | null>(null)
  
  /**
   * Current message input value
   * Controlled input for the message text field at the bottom
   */
  const [newMessage, setNewMessage] = useState("")
  
  /**
   * Loading state for initial conversation fetch
   * Shows loading spinner while fetching conversation data from API
   */
  const [isLoading, setIsLoading] = useState(true)
  
  /**
   * Pagination state for loading more messages
   * Tracks current page and loading state for pagination
   */
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isRestoringScrollPosition, setIsRestoringScrollPosition] = useState(false)
  
  /**
   * Sending state to prevent duplicate message sends
   * Disables send button and shows loading indicator during message transmission
   */
  const [isSending, setIsSending] = useState(false)

  // ==================== FILE AND MEDIA UPLOAD STATES ====================
  
  /**
   * File upload panel visibility state
   * Controls whether the file upload interface is shown above the input
   */
  const [showFileUpload, setShowFileUpload] = useState(false)
  
  /**
   * Selected files for upload - Production Ready Configuration
   * Array of File objects selected by the user for sending
   * Restricted to images and videos only with size limits
   */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileValidationErrors, setFileValidationErrors] = useState<string[]>([])
  
  /**
   * Comprehensive file validation function for production use
   * Validates file type, size, and other security constraints
   */
  const validateFiles = useCallback((files: File[]): { valid: File[], errors: string[] } => {
    const validFiles: File[] = []
    const errors: string[] = []
    
    // Check total number of files
    if (files.length > FILE_VALIDATION.MAX_FILES) {
      errors.push(`Maximum ${FILE_VALIDATION.MAX_FILES} files allowed per message`)
      return { valid: [], errors }
    }
    
    files.forEach((file, index) => {
      const fileName = file.name.toLowerCase()
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
      
      // Check if file is an image or video
      const isImage = (FILE_VALIDATION.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type) ||
                      (FILE_VALIDATION.ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(fileExtension)
      const isVideo = (FILE_VALIDATION.ALLOWED_VIDEO_TYPES as readonly string[]).includes(file.type) ||
                      (FILE_VALIDATION.ALLOWED_VIDEO_EXTENSIONS as readonly string[]).includes(fileExtension)
      
      if (!isImage && !isVideo) {
        errors.push(`${file.name}: Only images and videos are allowed`)
        return
      }
      
      // Validate file size based on type
      if (isImage && file.size > FILE_VALIDATION.MAX_IMAGE_SIZE) {
        const maxMB = FILE_VALIDATION.MAX_IMAGE_SIZE / (1024 * 1024)
        errors.push(`${file.name}: Image size exceeds ${maxMB}MB limit`)
        return
      }
      
      if (isVideo && file.size > FILE_VALIDATION.MAX_VIDEO_SIZE) {
        const maxMB = FILE_VALIDATION.MAX_VIDEO_SIZE / (1024 * 1024)
        errors.push(`${file.name}: Video size exceeds ${maxMB}MB limit`)
        return
      }
      
      // Additional security checks
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty`)
        return
      }
      
      // Check for suspicious file names
      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        errors.push(`${file.name}: Invalid file name`)
        return
      }
      
      validFiles.push(file)
    })
    
    return { valid: validFiles, errors }
  }, [])

  /**
   * Enhanced file selection handler with validation
   */
  const handleFileSelection = useCallback((files: File[]) => {
    const { valid, errors } = validateFiles(files)
    
    setFileValidationErrors(errors)
    setSelectedFiles(valid)
    
    // Show validation errors to user
    if (errors.length > 0) {
      showToast.error({
        title: "File Validation Error",
        description: `${errors.length} file(s) failed validation. Check the restrictions below.`,
        duration: 5000
      })
    }
    
    // Show success message for valid files
    if (valid.length > 0) {
      const imageCount = valid.filter(f => f.type.startsWith('image/')).length
      const videoCount = valid.filter(f => f.type.startsWith('video/')).length
      
      let message = `${valid.length} file(s) selected`
      if (imageCount > 0 && videoCount > 0) {
        message += ` (${imageCount} images, ${videoCount} videos)`
      } else if (imageCount > 0) {
        message += ` (${imageCount} images)`
      } else if (videoCount > 0) {
        message += ` (${videoCount} videos)`
      }
      
      showToast.success({
        title: "Files Selected",
        description: message,
        duration: 3000
      })
    }
  }, [validateFiles])
  
  /**
   * Voice recorder visibility state
   * Controls the voice message recording modal/overlay
   */
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  
  /**
   * Emoji picker visibility state
   * Controls the emoji selection popup
   */
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  /**
   * Camera modal visibility state
   * Controls the camera capture interface for taking photos
   */
  const [showCameraModal, setShowCameraModal] = useState(false)

  /**
   * Chat info modal visibility state
   * Controls the chat information and participant details modal
   */
  const [showChatInfo, setShowChatInfo] = useState(false)
  
  /**
   * Captured image URL state
   * Stores the blob URL of a photo taken with the camera for preview/sending
   */
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  // ==================== REFS FOR DOM MANIPULATION ====================
  
  /**
   * Reference to the bottom of messages container
   * Used for auto-scrolling to latest messages
   * 
   * @example
   * ```typescript
   * // Scroll to bottom programmatically:
   * messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
   * ```
   */
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  /**
   * Reference to the scroll container for preserving scroll position during pagination
   */
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  /**
   * Reference to the message input field
   * Used for focus management and keyboard interactions
   */
  const inputRef = useRef<HTMLInputElement>(null)
  
  /**
   * Timeout reference for typing indicator
   * Manages the debounced typing status updates to prevent spam
   */
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  
  /**
   * Set of message IDs that we've sent locally
   * Used to prevent duplicate message display when WebSocket echoes back our own messages
   * 
   * @example
   * ```typescript
   * // When sending a message:
   * sentMessageIds.current.add(newMessage.id)
   * 
   * // When receiving via WebSocket:
   * if (sentMessageIds.current.has(message.id)) {
   *   return // Skip this message, we sent it
   * }
   * ```
   */
  const sentMessageIds = useRef<Set<number>>(new Set())

  // ==================== WEBSOCKET REAL-TIME FEATURES ====================
  
  /**
   * Handle real-time message deletion updates
   */
  const handleRealtimeMessageDeletion = useCallback((messageId: number, conversationId: number) => {
    if (conversationId === conversation?.id) {
      setConversation(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, deletion_type: 'everyone', text: 'Message was deleted' }
              : msg
          )
        }
      })
    }
  }, [conversation?.id])

  /**
   * Real-time messaging hook providing WebSocket functionality
   * 
   * Features:
   * - realtimeMessages: Array of incoming messages via WebSocket
   * - sendChatMessage: Function to send messages via WebSocket (faster than HTTP)
   * - isConnected: Current WebSocket connection status
   * - isConnecting: Whether currently attempting to connect
   * - connectionStatus: Detailed connection state information
   * 
   * @example
   * ```typescript
   * // Send message via WebSocket for instant delivery:
   * sendChatMessage(conversationId, "Hello there!")
   * 
   * // Check if real-time features are available:
   * if (isConnected) {
   *   // Show online indicator
   * }
   * ```
   */
  const {
    messages: realtimeMessages, 
    sendChatMessage, 
    isConnected,
    isConnecting,
    connectionStatus,
    onMessage
  } = useRealtimeMessaging(handleRealtimeMessageDeletion)
  

  
  /**
   * Typing indicator hook for showing when users are typing
   * 
   * Features:
   * - typingUsers: Array of users currently typing in this conversation
   * - sendTypingStatus: Function to broadcast typing status
   * - isUserTyping: Function to check if a specific user is typing
   * 
   * @example
   * ```typescript
   * // Start typing indicator:
   * sendTypingStatus(conversationId, true)
   * 
   * // Stop typing indicator:
   * sendTypingStatus(conversationId, false)
   * 
   * // Check if user is typing:
   * if (isUserTyping(userId)) {
   *   // Show typing animation
   * }
   * ```
   */
  const {
    typingUsers,
    sendTypingStatus,
    isUserTyping
  } = useTypingIndicator()

  // ==================== SCROLL BEHAVIOR MANAGEMENT ====================
  
  /**
   * Optimized scroll-to-bottom function with smooth performance
   * 
   * Uses requestAnimationFrame to ensure smooth scrolling without blocking the UI thread.
   * Provides configurable scroll behavior for different scenarios.
   * 
   * @param behavior - "smooth" for animated scroll, "instant" for immediate jump
   * 
   * @example
   * ```typescript
   * // Smooth scroll when new message arrives:
   * scrollToBottom("smooth")
   * 
   * // Instant scroll on initial load:
   * scrollToBottom("instant")
   * ```
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        // Use scrollIntoView with optimized configuration
        messagesEndRef.current.scrollIntoView({ 
          behavior,
          block: "end",      // Scroll to the very bottom
          inline: "nearest"  // Don't affect horizontal scroll
        })
      }
    })
  }, [])

  /**
   * Auto-scroll effect when new messages are added
   * 
   * Triggers smooth scrolling whenever the messages array changes,
   * ensuring users always see the latest messages without manual scrolling.
   * Only activates when messages exist to avoid unnecessary scroll operations.
   * 
   * IMPORTANT: Does NOT trigger when loading more messages (pagination) or when
   * restoring scroll position to preserve user's scroll position when viewing older messages.
   */
  useEffect(() => {
    // Don't auto-scroll if we're currently loading more messages or restoring scroll position after loading
    if (isLoadingMore || isRestoringScrollPosition) return
    
    if (conversation?.messages && conversation.messages.length > 0) {
      // Use smooth scrolling for better user experience
      scrollToBottom("smooth")
    }
  }, [conversation?.messages, scrollToBottom, isLoadingMore, isRestoringScrollPosition])

  /**
   * Initial scroll effect when conversation loads
   * 
   * Instantly scrolls to bottom when the component first loads and conversation data
   * is available. Uses instant scroll to avoid animation delay on page load.
   */
  useEffect(() => {
    if (conversation && !isLoading) {
      // Use instant scroll on initial load for immediate positioning
      scrollToBottom("instant")
    }
  }, [conversation, isLoading, scrollToBottom])

  // ==================== CONVERSATION DATA LOADING ====================
  

  /**
   * Initial conversation loading effect
   * 
   * Fetches conversation data from Django backend on component mount
   * and when conversationId changes. Handles loading states, error scenarios,
   * and data sanitization for robust UI rendering.
   * 
   * API Endpoint: GET /api/messaging/conversations/{id}/
   * 
   * Data Flow:
   * 1. Fetch from Django REST API using JWT token
   * 2. Validate and clean response data (handle missing fields)
   * 3. Transform message data to match frontend interface
   * 4. Sort messages chronologically (oldest first)
   * 5. Update conversation state and stop loading
   * 
   * @dependencies [conversationId, router] - Re-runs if conversation ID changes
   */
  useEffect(() => {
    const loadConversationData = async () => {
      try {
        // Reset pagination state
        setCurrentPage(1)
        setHasMoreMessages(true)
        
        // Construct API URL with pagination parameters
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
        const token = Cookies.get('access_token')
        
        // Make authenticated request to Django backend with pagination
        const response = await fetch(`${apiUrl}/messaging/conversations/${conversationId}/?page=1&page_size=50`, {
          headers: {
            'Authorization': `Bearer ${token}`,  // JWT authentication
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to load conversation')
        }

        const data = await response.json()
        
        /**
         * Data sanitization and validation
         * 
         * Ensures all required fields have fallback values to prevent
         * undefined errors in the UI. Maps Django field names to frontend
         * interface requirements.
         */
        
        // Find the other participant from message senders (not the current user)
        const otherParticipantFromMessages = data.messages?.find((msg: any) => 
          msg.sender && msg.sender.id !== currentUser.id
        )?.sender;

        const cleanedData = {
          ...data,
          // Create other participant data from message senders since API doesn't provide it directly
          other_participant: otherParticipantFromMessages ? {
            id: otherParticipantFromMessages.id,
            name: otherParticipantFromMessages.full_name || 
                  (otherParticipantFromMessages.first_name && otherParticipantFromMessages.last_name 
                    ? `${otherParticipantFromMessages.first_name} ${otherParticipantFromMessages.last_name}`.trim()
                    : otherParticipantFromMessages.username || 'Unknown User'),
            username: otherParticipantFromMessages.username || 'unknown',
            first_name: otherParticipantFromMessages.first_name || '',
            last_name: otherParticipantFromMessages.last_name || '',
            email: otherParticipantFromMessages.email || '',
            phone: otherParticipantFromMessages.phone || '',
            location: otherParticipantFromMessages.location || '',
            avatar: otherParticipantFromMessages.avatar || null,
            user_type: otherParticipantFromMessages.user_type || 'customer',
            status: otherParticipantFromMessages.status || 'offline',
            is_provider: otherParticipantFromMessages.user_type === 'provider'
          } : {
            id: 0,
            name: 'Unknown User',
            username: 'unknown',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            location: '',
            avatar: null,
            user_type: 'customer',
            status: 'offline',
            is_provider: false
          },
          // Ensure messages array exists and is properly formatted
          // Backend now returns messages in chronological order (oldest first)
          messages: (data.messages || []).map((msg: any) => ({
            id: msg.id || 0,
            text: msg.text || '',
            timestamp: msg.timestamp || new Date().toISOString(),
            sender: {
              id: msg.sender?.id || 0,
              name: msg.sender?.full_name || 
                    (msg.sender?.first_name && msg.sender?.last_name 
                      ? `${msg.sender.first_name} ${msg.sender.last_name}`.trim()
                      : msg.sender?.username || 'Unknown'),
              username: msg.sender?.username || 'unknown',
              first_name: msg.sender?.first_name || '',
              last_name: msg.sender?.last_name || '',
              email: msg.sender?.email || '',
              phone: msg.sender?.phone || '',
              location: msg.sender?.location || '',
              avatar: msg.sender?.avatar || null,
              user_type: msg.sender?.user_type || 'customer',
              status: msg.sender?.status || 'offline'
            },
            is_read: msg.is_read || false,
            attachment: msg.attachment || null,
            attachment_url: msg.attachment_url || null,
            deletion_type: msg.deletion_type || undefined
          }))
          // Messages from backend are already sorted chronologically, no need to re-sort
        }

        // Update conversation state with cleaned data
        setConversation(cleanedData)
        
        // Check if there are more messages to load
        const messageCount = cleanedData.messages.length
        setHasMoreMessages(messageCount >= 50)
        
      } catch (error) {
        console.error('Error loading conversation:', error)
        showToast.error({
          title: "Failed to Load Chat",
          description: "Could not load conversation. Please try again."
        })
        // Navigate back if conversation can't be loaded
        router.back()
      } finally {
        // Always stop loading state
        setIsLoading(false)
      }
    }

    loadConversationData()
  }, [conversationId, router, currentUser.id])

  // ==================== AUTO-REFRESH FOR MESSAGE SYNCHRONIZATION ====================
  
  /**
   * Periodic refresh effect to ensure message synchronization
   * 
   * This effect provides a backup mechanism for message delivery when WebSocket
   * connections are unreliable or unavailable. It periodically polls the conversation
   * endpoint to check for new messages.
   * 
   * Rationale:
   * - WebSocket connections can drop without notice
   * - Network issues may cause message delivery failures
   * - Ensures users always see the latest messages
   * 
   * Optimization:
   * - Only refreshes when conversation is loaded
   * - Compares message counts to avoid unnecessary updates
   * - Graceful error handling doesn't disrupt user experience
   * - Only checks the first page to avoid pagination conflicts
   * 
   * @interval 3000ms (3 seconds) - Balances freshness with server load
   * @dependencies [conversationId, conversation] - Restarts when conversation changes
   */
  useEffect(() => {
    // Don't start polling until conversation is loaded
    if (!conversation) return

    /**
     * Polling function to check for new messages
     * 
     * Makes a lightweight request to the same conversation endpoint
     * and compares message counts to detect updates efficiently.
     * Only checks the first page to avoid pagination conflicts.
     */
    const refreshInterval = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
        const token = Cookies.get('access_token')
        
        // Make the same API call as initial load (first page only)
        const response = await fetch(`${apiUrl}/messaging/conversations/${conversationId}/?page=1&page_size=50`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Transform new messages with same logic as initial load
          // Backend now returns messages in chronological order (oldest first)
          const newMessages = (data.messages || [])
            .map((msg: any) => ({
              id: msg.id,
              text: msg.text || msg.content || '',
              timestamp: msg.timestamp || msg.created_at,
              is_read: msg.is_read,
              attachment: msg.attachment,
              attachment_url: msg.attachment_url,
              attachments: msg.attachments,
              sender: {
                id: msg.sender?.id || 0,
                name: msg.sender?.full_name || 
                      (msg.sender?.first_name && msg.sender?.last_name 
                        ? `${msg.sender.first_name} ${msg.sender.last_name}`.trim()
                        : msg.sender?.name || 'User'),
                avatar: msg.sender?.avatar || null,
                is_provider: msg.sender?.is_provider || msg.sender?.role === 'provider' || false,
              }
            }))
            // Messages from backend are already sorted chronologically, no need to re-sort

          // Update conversation state only if there are actually new messages
          setConversation(prev => {
            if (!prev) return prev
            
            // Check if we have new messages by comparing the latest message IDs
            const currentLatestId = prev.messages[prev.messages.length - 1]?.id
            const newLatestId = newMessages[newMessages.length - 1]?.id
            
            if (newLatestId && newLatestId !== currentLatestId) {
              // Merge new messages with existing ones, avoiding duplicates
              const existingIds = new Set(prev.messages.map((msg: Message) => msg.id))
              const uniqueNewMessages = newMessages.filter((msg: Message) => !existingIds.has(msg.id))
              
              if (uniqueNewMessages.length > 0) {
                const allMessages = [...prev.messages, ...uniqueNewMessages]
                // Messages are already sorted chronologically from backend
                return { ...prev, messages: allMessages }
              }
            }
            return prev
          })
        }
      } catch (error) {
        // Silent error handling - don't disrupt user experience
        console.error('Error refreshing conversation:', error)
      }
    }, 3000) // Poll every 3 seconds

    // Cleanup interval on unmount or dependency change
    return () => clearInterval(refreshInterval)
  }, [conversationId, conversation])

  // ==================== REAL-TIME WEBSOCKET MESSAGE HANDLING ====================
  
  /**
   * Real-time message processing effect for WebSocket integration
   * 
   * This critical effect handles incoming messages from the WebSocket connection,
   * implementing sophisticated deduplication logic to prevent message conflicts
   * between WebSocket and HTTP API responses.
   * 
   * Key Features:
   * - Message deduplication (prevents showing same message twice)
   * - Conversation filtering (only process messages for current chat)
   * - Echo prevention (don't show messages we sent via WebSocket)
   * - Content and timestamp-based duplicate detection
   * - Seamless integration with existing conversation state
   * 
   * Message Flow:
   * 1. User A sends message → HTTP API + WebSocket broadcast
   * 2. User B receives via WebSocket → Instant display
   * 3. User B receives via HTTP polling → Duplicate prevention
   * 4. Result: Single message display with real-time speed
   * 
   * @dependencies [realtimeMessages, conversationId, conversation]
   */
  useEffect(() => {
    // Only process if we have real-time messages and a loaded conversation
    if (realtimeMessages.length > 0 && conversation) {
      // Get the most recent WebSocket message
      const latestMessage = realtimeMessages[realtimeMessages.length - 1]
      
      // Filter: Only process messages for the current conversation
      if (latestMessage.conversation_id === conversationId) {
        
        // Update conversation state with sophisticated deduplication
        setConversation(prev => {
          if (!prev) return prev
          
          /**
           * Echo Prevention: Skip messages we sent locally
           * 
           * When we send a message, we:
           * 1. Add it to sentMessageIds.current
           * 2. Send via HTTP API
           * 3. WebSocket echoes it back
           * 4. This check prevents duplicate display
           */
          if (sentMessageIds.current.has(latestMessage.id)) {
            return prev
          }

          /**
           * Multi-layered Duplicate Detection
           * 
           * Checks for existing messages using multiple strategies:
           * 1. Primary: ID-based matching (most reliable)
           * 2. Secondary: Content + sender + timestamp matching
           * 3. Tertiary: Fuzzy timestamp matching (within 5 seconds)
           */
          const messageExists = prev.messages.some(msg => {
            // Strategy 1: Direct ID match (most reliable)
            if (msg.id === latestMessage.id) {
              return true
            }
            
            // Strategy 2: Content and sender match
            const msgContent = msg.text
            const latestContent = latestMessage.text || latestMessage.content
            
            if (msgContent === latestContent && 
                msg.sender.id === latestMessage.sender.id) {
              
              // Strategy 3: Timestamp validation and fuzzy matching
              const msgTime = new Date(msg.timestamp).getTime()
              const latestTime = new Date(latestMessage.timestamp).getTime()
              
              // Skip invalid timestamps
              if (isNaN(msgTime) || isNaN(latestTime)) return false
              
              // Allow 5-second window for timestamp differences
              const timeDiff = Math.abs(msgTime - latestTime)
              if (timeDiff < 5000) {
                return true
              }
            }
            
            return false
          })
          
          // Add new message if it doesn't already exist
          if (!messageExists) {
            /**
             * Transform WebSocket message to frontend Message interface
             * 
             * Maps WebSocket message format to the Message interface used
             * throughout the frontend, ensuring consistent data structure.
             */
            const transformedMessage: Message = {
              id: latestMessage.id,
              text: latestMessage.text || latestMessage.content || '', // Handle both field names
              timestamp: latestMessage.timestamp,
              sender: {
                id: latestMessage.sender.id,
                name: latestMessage.sender.name,
                avatar: latestMessage.sender.avatar,
                is_provider: latestMessage.sender.is_provider
              },
              is_read: false, // New messages start as unread
              attachment: latestMessage.attachment,
              attachment_url: latestMessage.attachment_url,
              attachments: latestMessage.attachments || [],
              deletion_type: latestMessage.deletion_type || undefined
            }
            
            // Add to existing messages and maintain chronological order
            const updatedMessages = [...prev.messages, transformedMessage]
            updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            
            return {
              ...prev,
              messages: updatedMessages
            }
          }
          return prev
        })
      }
    }
  }, [realtimeMessages, conversationId, conversation])

  // ==================== MESSAGE SENDING FUNCTIONALITY ====================
  
  /**
   * Comprehensive message sending function with optimistic UI updates
   * 
   * This function implements a dual-channel message sending approach:
   * 1. WebSocket for instant delivery (if available)
   * 2. HTTP API for guaranteed delivery and file attachments
   * 
   * Features:
   * - Optimistic UI updates (instant message display)
   * - File upload support via FormData
   * - Duplicate prevention through message ID tracking
   * - Graceful WebSocket fallback to HTTP-only
   * - Comprehensive error handling
   * - Auto-scroll to new messages
   * 
   * Message Flow:
   * 1. Validate input (text or files)
   * 2. Send via WebSocket for speed (optional)
   * 3. Send via HTTP API for persistence
   * 4. Add to local state immediately (optimistic update)
   * 5. Track message ID to prevent duplicates
   * 6. Update UI and provide user feedback
   * 
   * @example
   * ```typescript
   * // Triggered by send button or Enter key
   * handleSendMessage()
   * ```
   */
  const handleSendMessage = async () => {
    // Early validation: require either text or files, and prevent double-sending
    if ((!newMessage.trim() && selectedFiles.length === 0) || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    
    try {
      /**
       * WebSocket Instant Delivery (Optional)
       * 
       * Attempts to send text messages via WebSocket for instant delivery.
       * Falls back gracefully if WebSocket is unavailable.
       * File attachments always use HTTP API.
       */
      if (messageContent) {
        try {
          sendChatMessage(conversationId, messageContent)
        } catch (wsError) {
          // WebSocket not available, fallback to HTTP only
        }
      }

      /**
       * HTTP API Guaranteed Delivery
       * 
       * Constructs FormData for file upload support and sends to Django backend.
       * Uses 'text' field name to match Django Message model.
       */
      const formData = new FormData()
      formData.append('text', messageContent)  // Django model field name
      formData.append('conversation', conversationId.toString())
      
      // Add all selected files to form data
      selectedFiles.forEach((file, index) => {
        formData.append('attachment', file)  // Django expects 'attachment' field
      })

      // Construct authenticated API request
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
      const token = Cookies.get('access_token')
      
      const response = await fetch(`${apiUrl}/messaging/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`  // JWT authentication
          // Note: Don't set Content-Type for FormData, browser sets it automatically
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const newMessageData = await response.json()
      
      /**
       * Optimistic UI Update
       * 
       * Immediately add the message to local state for instant user feedback.
       * Uses API response data when available, falls back to local data.
       */
      const newMessage: Message = {
        id: newMessageData.id || Date.now(), // Prefer API ID, fallback to timestamp
        text: messageContent,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          is_provider: false // Backend will set correct value
        },
        is_read: false,
        attachment: newMessageData.attachment,
        attachment_url: newMessageData.attachment_url,
        attachments: newMessageData.attachments || []
      }

      /**
       * Duplicate Prevention Tracking
       * 
       * Track this message ID so when it comes back via WebSocket,
       * we can ignore it to prevent duplicate display.
       */
      if (newMessage.id) {
        sentMessageIds.current.add(newMessage.id)
      }

      /**
       * Conversation State Update
       * 
       * Add the new message to the conversation with duplicate checking
       * and chronological sorting.
       */
      setConversation(prev => {
        if (!prev) {
          return prev
        }
        
        // Duplicate prevention check
        const messageExists = prev.messages.some(msg => 
          msg.id === newMessage.id || 
          (msg.text === newMessage.text && 
           msg.sender.id === newMessage.sender.id && 
           Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
        )
        
        if (messageExists) {
          return prev
        }
        
        // Add new message and maintain chronological order
        const updatedMessages = [...prev.messages, newMessage]
        updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        return { ...prev, messages: updatedMessages }
      })
      
      /**
       * Success Feedback and UI Reset
       */
      
      // Show success toast notification
      showToast.success({
        title: "Message Sent ✓",
        description: "Message sent successfully",
        duration: 2000
      })
      
      // Clear all input states
      setNewMessage("")
      setSelectedFiles([])
      setShowFileUpload(false)
      inputRef.current?.focus() // Return focus to input
      
      // Auto-scroll to show new message
      setTimeout(() => scrollToBottom(), 100)

    } catch (error) {
      /**
       * Error Handling
       * 
       * Provides user-friendly error feedback and logs detailed error info.
       */
      console.error('Message send error:', error)
      showToast.error({
        title: "Failed to Send",
        description: "Please check your connection and try again."
      })
    } finally {
      // Always reset sending state
      setIsSending(false)
    }
  }

  // ==================== MESSAGE DELETE FUNCTIONALITY ====================
  
  /**
   * Delete Message Handler
   * 
   * Implements soft delete functionality for messages. Messages are marked
   * as deleted for the current user without affecting other participants.
   * Uses optimistic UI updates and provides instant feedback.
   * 
   * @param messageId - ID of the message to delete
   * 
   * @example
   * ```tsx
   * handleDeleteMessage(123)
   * ```
   */
  const handleDeleteMessage = async (messageId: number, deletionType: 'self' | 'everyone' = 'self') => {
    try {
      // Show loading toast
      showToast.info({
        title: "Deleting message...",
        description: "Please wait while we delete your message.",
        duration: 2000
      })

      // Optimistic UI update based on deletion type
      setConversation(prev => {
        if (!prev) return prev
        
        if (deletionType === 'everyone') {
          // For "Delete for Everyone", update the message to show placeholder
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, deletion_type: 'everyone', text: '' }
                : msg
            )
          }
        } else {
          // For "Delete for Me", remove the message completely
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== messageId)
          }
        }
      })

      // API call to soft delete message on backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
      const token = Cookies.get('access_token')
      
      const response = await fetch(`${apiUrl}/messaging/messages/${messageId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deletion_type: deletionType
        })
      })

      if (!response.ok) {
        let errorData = {}
        let errorText = ''
        
        try {
          // Try to get JSON error response first
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            errorText = await response.text()
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
          errorText = await response.text().catch(() => 'Unable to read error response')
        }
        
        console.error('Delete message error response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorData || errorText,
          hasToken: !!token
        })
        
        // Handle specific error types
        if (response.status === 400 && errorData && typeof errorData === 'object' && 'error' in errorData) {
          const errorMessage = (errorData as { error: string }).error
          // Handle time limit error
          if (errorMessage.includes('Cannot delete for everyone after 15 minutes')) {
            throw new Error('TIME_LIMIT_EXCEEDED')
          }
          throw new Error(errorMessage)
        } else if (response.status === 403) {
          throw new Error('PERMISSION_DENIED')
        }
        
        // Generic error message
        const errorMessage = `Failed to delete message: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Show success toast
      showToast.success({
        title: "Message Deleted ✓",
        description: "Message deleted successfully",
        duration: 2000
      })

    } catch (error) {
      console.error('Message delete error:', error)
      
      // Revert optimistic update on error
      // Refresh conversation to restore the message
      refreshChat()
      
      // Show specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage === 'TIME_LIMIT_EXCEEDED') {
        showToast.error({
          title: "⏰ Time Limit Exceeded",
          description: "You can only delete messages for everyone within 15 minutes of sending them."
        })
      } else if (errorMessage === 'PERMISSION_DENIED') {
        showToast.error({
          title: "🚫 Permission Denied",
          description: "Only the message sender can delete for everyone."
        })
      } else if (errorMessage.includes('Cannot delete for everyone after 15 minutes')) {
        showToast.error({
          title: "⏰ Time Limit Exceeded",
          description: "You can only delete messages for everyone within 15 minutes of sending them."
        })
      } else {
        showToast.error({
          title: "Failed to Delete",
          description: "Please check your connection and try again."
        })
      }
    }
  }

  // ==================== TYPING INDICATOR MANAGEMENT ====================
  
  /**
   * Optimized input handler for better performance
   * 
   * This function only handles the input value update to prevent lag.
   * Typing indicator logic is separated and debounced for better performance.
   * 
   * @param value - Current input field value
   */
  const handleInputChange = useCallback((value: string) => {
    setNewMessage(value)
  }, [])

  /**
   * Debounced typing indicator handler
   * 
   * This function manages the typing indicator feature with optimized debouncing
   * to prevent performance issues and excessive WebSocket messages.
   * 
   * Features:
   * - Debounced typing status (prevents spam)
   * - Automatic timeout after 2 seconds of inactivity
   * - Smart start/stop logic based on input content
   * - Real-time WebSocket broadcasting
   * - Duplicate prevention (don't send if already typing)
   * 
   * Typing Logic:
   * 1. User types → Send "typing: true" after 300ms delay
   * 2. User continues typing → Reset timeout, don't send again
   * 3. User stops typing for 2s → Send "typing: false"
   * 4. User clears input → Send "typing: false" immediately
   */
  const debouncedTypingIndicator = useMemo(
    () => {
      let debounceTimer: NodeJS.Timeout | null = null
      
      return (value: string) => {
        // Clear existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }
        
        // If input is empty, immediately stop typing
        if (!value.trim()) {
          if (isUserTyping(currentUser.id)) {
            sendTypingStatus(conversationId, false)
          }
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          return
        }
        
        // Debounce the typing indicator to prevent excessive calls
        debounceTimer = setTimeout(() => {
          if (value.trim() && !isUserTyping(currentUser.id)) {
            sendTypingStatus(conversationId, true)
          }
          
          // Clear any existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          
          // Set timeout to stop typing indicator after 2 seconds of inactivity
          typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(conversationId, false)
          }, 2000)
        }, 300) // 300ms debounce delay
      }
    },
    [conversationId, currentUser.id, sendTypingStatus, isUserTyping]
  )

  /**
   * Combined handler that manages both input and typing indicator
   */
  const handleTyping = useCallback((value: string) => {
    handleInputChange(value)
    debouncedTypingIndicator(value)
  }, [handleInputChange, debouncedTypingIndicator])

  // ==================== KEYBOARD INTERACTION HANDLING ====================
  
  /**
   * Enhanced keyboard event handler for message input
   * 
   * Provides intuitive keyboard shortcuts for message sending while
   * properly managing typing indicators and preventing default behaviors.
   * 
   * Keyboard Shortcuts:
   * - Enter: Send message (if not shift-held)
   * - Shift + Enter: New line in message (default textarea behavior)
   * 
   * Side Effects:
   * - Stops typing indicator when sending
   * - Clears typing timeout
   * - Prevents form submission on Enter
   * 
   * @param e - React keyboard event from the input field
   * 
   * @example
   * ```typescript
   * <Input 
   *   onKeyPress={handleKeyPress}
   *   placeholder="Type a message..."
   * />
   * ```
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Enter key without Shift = Send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // Prevent form submission or default behavior
      
      /**
       * Clean up typing indicator before sending
       * 
       * When user sends a message, immediately stop the typing indicator
       * and clear any pending timeout to prevent race conditions.
       */
      sendTypingStatus(conversationId, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Send the message
      handleSendMessage()
    }
    // Note: Shift + Enter allows multi-line input (default behavior)
  }

  // ==================== LOAD MORE MESSAGES FUNCTIONALITY ====================
  
  /**
   * Load more messages function for pagination
   * 
   * Fetches additional messages from the backend and prepends them to the
   * existing message list to maintain chronological order.
   * 
   * Features:
   * - Loads older messages (previous pages)
   * - Maintains message order (oldest first)
   * - Prevents duplicate loading
   * - Handles loading states and errors
   * - Updates pagination state
   * - Preserves user's scroll position (no auto-scroll to bottom)
   * 
   * Scroll Behavior:
   * - Captures current scroll position and height before loading
   * - Restores scroll position after new messages are added by adjusting for height difference
   * - Prevents auto-scroll effect from triggering during pagination
   * 
   * @example
   * ```typescript
   * // Triggered by "Load More" button:
   * <Button onClick={loadMoreMessages}>Load More Messages</Button>
   * ```
   */
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || !conversation) return

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    // Save current scroll position and height BEFORE loading
    const oldScrollHeight = scrollContainer.scrollHeight
    const oldScrollTop = scrollContainer.scrollTop

    setIsLoadingMore(true)
    
    try {
      const nextPage = currentPage + 1
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
      const token = Cookies.get('access_token')
      
      // Fetch next page of messages
      const response = await fetch(`${apiUrl}/messaging/conversations/${conversationId}/?page=${nextPage}&page_size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load more messages')
      }

      const data = await response.json()
      
      // Transform new messages with same logic as initial load
      // Backend now returns messages in chronological order (oldest first)
      const newMessages = (data.messages || [])
        .map((msg: any) => ({
          id: msg.id,
          text: msg.text || msg.content || '',
          timestamp: msg.timestamp || msg.created_at,
          is_read: msg.is_read,
          attachment: msg.attachment,
          attachment_url: msg.attachment_url,
          attachments: msg.attachments,
          sender: {
            id: msg.sender?.id || 0,
            name: msg.sender?.full_name || 
                  (msg.sender?.first_name && msg.sender?.last_name 
                    ? `${msg.sender.first_name} ${msg.sender.last_name}`.trim()
                    : msg.sender?.name || 'User'),
            avatar: msg.sender?.avatar || null,
            is_provider: msg.sender?.is_provider || msg.sender?.role === 'provider' || false,
          }
        }))
        // Messages from backend are already sorted chronologically (oldest first), no need to re-sort

      // Check if there are more messages to load
      const messageCount = newMessages.length
      setHasMoreMessages(messageCount >= 50)
      
      // Prepend new messages to existing ones (maintain chronological order)
      setConversation(prev => {
        if (!prev) return prev
        
        // Create a map to track existing message IDs for deduplication
        const existingIds = new Set(prev.messages.map((msg: Message) => msg.id))
        
        // Filter out any duplicate messages from new messages
        const uniqueNewMessages = newMessages.filter((msg: Message) => !existingIds.has(msg.id))
        
        if (uniqueNewMessages.length === 0) {
          return prev
        }
        
        // Prepend older messages to existing ones (they are already sorted chronologically)
        // Since backend returns older messages for pagination, we prepend them
        const allMessages = [...uniqueNewMessages, ...prev.messages]
        
        return {
          ...prev,
          messages: allMessages
        }
      })
      
      // Update pagination state
      setCurrentPage(nextPage)
      
      // Set flag to prevent auto-scroll during position restoration
      setIsRestoringScrollPosition(true)
      
      // Restore scroll position after new messages are added
      // Use requestAnimationFrame to ensure DOM has updated after state change
      requestAnimationFrame(() => {
        setTimeout(() => {
          const newScrollHeight = scrollContainer.scrollHeight
          const heightDifference = newScrollHeight - oldScrollHeight
          
          // Set the new scroll position to maintain user's viewing position
          scrollContainer.scrollTop = oldScrollTop + heightDifference
          
          // Clear the restoration flag after position is restored
          setIsRestoringScrollPosition(false)
        }, 10)
      })
      
      showToast.success({
        title: "Messages Loaded",
        description: `Loaded ${newMessages.length} more messages`,
        duration: 2000
      })
      
    } catch (error) {
      console.error('Error loading more messages:', error)
      showToast.error({
        title: "Failed to Load Messages",
        description: "Please try again later"
      })
    } finally {
      setIsLoadingMore(false)
      // Ensure restoration flag is cleared in case of any errors
      setIsRestoringScrollPosition(false)
    }
  }

  // ==================== CLEANUP EFFECTS ====================
  
  /**
   * Cleanup effect for timeouts and memory management
   * 
   * Handles cleanup when component unmounts to prevent:
   * - Memory leaks from uncleaned timeouts
   * - Memory leaks from accumulated message IDs
   * - Potential race conditions with async operations
   */
  useEffect(() => {
    // Store ref value at effect creation time
    const messageIdsRef = sentMessageIds.current
    
    return () => {
      // Clear any pending typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Clean up sent message IDs to prevent memory leaks
      messageIdsRef.clear()
    }
  }, [])

  /**
   * Periodic cleanup effect for message ID tracking
   * 
   * Prevents memory leaks by periodically cleaning up the sentMessageIds Set.
   * This is crucial for long-running chat sessions where users send many messages.
   * 
   * Cleanup Strategy:
   * - Monitors Set size every minute
   * - Triggers cleanup when size exceeds 50 IDs
   * - Keeps only the most recent 25 IDs
   * - Maintains effectiveness while preventing memory bloat
   * 
   * Memory Management:
   * - Without this cleanup, Set would grow indefinitely
   * - Each message ID is ~8 bytes, so 1000 messages = ~8KB
   * - Cleanup ensures maximum memory usage stays under 1KB
   * 
   * @interval 60000ms (1 minute) - Balances cleanup frequency with performance
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Only clean up if we have accumulated many message IDs
      if (sentMessageIds.current.size > 50) {
        // Convert Set to Array for slicing
        const idsArray = Array.from(sentMessageIds.current)
        sentMessageIds.current.clear()
        
        // Keep only the most recent 25 IDs (recent messages most likely to have conflicts)
        idsArray.slice(-25).forEach(id => sentMessageIds.current.add(id))
      }
    }, 60000) // Clean up every minute

    // Cleanup the interval when component unmounts
    return () => clearInterval(cleanupInterval)
  }, [])



  // ==================== VOICE MESSAGE FUNCTIONALITY ====================
  
  /**
   * Advanced voice message sending with audio format detection and optimization
   * 
   * This function handles the complete voice message workflow from audio blob
   * processing to server upload and UI feedback. It supports multiple audio
   * formats and provides detailed user feedback including recording duration.
   * 
   * Features:
   * - Multi-format audio support (WebM, MP4, WAV, OGG)
   * - Automatic file extension detection
   * - Optimistic UI updates with duplicate prevention
   * - Detailed progress feedback and error handling
   * - Duration display in MM:SS format
   * - Automatic voice recorder cleanup
   * 
   * Audio Processing:
   * 1. Validate audio blob existence and size
   * 2. Detect MIME type and set appropriate file extension
   * 3. Package as FormData with conversation metadata
   * 4. Upload via HTTP API (voice always requires file upload)
   * 5. Add to local state for instant feedback
   * 
   * @param audioBlob - Recorded audio data as Blob
   * @param duration - Recording duration in seconds
   * 
   * @example
   * ```typescript
   * // Called from VoiceMessageRecorder component:
   * <VoiceMessageRecorder 
   *   onSend={(blob, duration) => sendVoiceMessage(blob, duration)}
   * />
   * ```
   */
  const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    // Early validation: ensure we have audio data
    if (!audioBlob) {
      return
    }

    // Authentication validation
    if (!currentUser) {
      showToast.error({
        title: "Authentication Required",
        description: "Please log in to send voice messages.",
        duration: 3000
      })
      return
    }
    setIsSending(true)
    
    try {
      /**
       * Audio Format Detection and File Extension Mapping
       * 
       * Different browsers and recording methods produce different audio formats.
       * We detect the MIME type and set appropriate file extensions for the backend.
       */
      let fileExtension = 'webm' // Default to WebM (most common for web recording)
      if (audioBlob.type.includes('mp4')) {
        fileExtension = 'mp4'
      } else if (audioBlob.type.includes('wav')) {
        fileExtension = 'wav'
      } else if (audioBlob.type.includes('ogg')) {
        fileExtension = 'ogg'
      }
      
      /**
       * FormData Construction for Audio Upload
       * 
       * Voice messages always require file upload, so we use FormData
       * with the audio blob as an attachment and descriptive text.
       */
      const formData = new FormData()
      formData.append('text', '') // Empty text for voice messages
      formData.append('conversation', conversationId.toString())
      formData.append('attachment', audioBlob, `voice-message.${fileExtension}`)
      formData.append('message_type', 'voice') // Add message type to help backend identify

      // API request setup
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
      const token = Cookies.get('access_token')
      
      // Check if we have a valid token
      if (!token || !token.trim()) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      /**
       * HTTP Upload Request with Enhanced Authentication Handling
       * 
       * Send the voice message via HTTP API. Voice messages cannot use
       * WebSocket due to file upload requirements.
       */
      let response = await fetch(`${apiUrl}/messaging/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type, let browser handle it for FormData
        },
        body: formData
      })

      // Handle 401 authentication errors with token refresh
      if (response.status === 401) {
        
        const refreshToken = Cookies.get('refresh_token')
        if (!refreshToken) {
          throw new Error('Authentication failed (401). Please log in again.')
        }
        
        try {
          // Attempt to refresh the token
          const refreshResponse = await fetch(`${apiUrl}/auth/refresh/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              refresh: refreshToken
            })
          })
          
          if (!refreshResponse.ok) {
            throw new Error('Token refresh failed')
          }
          
          const refreshData = await refreshResponse.json()
          const newToken = refreshData.access
          
          // Update the token in cookies
          const cookieOptions = Cookies.get('remember_me') === 'true' ? { expires: 30 } : {}
          Cookies.set('access_token', newToken, cookieOptions)
          
          // Retry the original request with the new token
          response = await fetch(`${apiUrl}/messaging/messages/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`
            },
            body: formData
          })
          
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Clear invalid tokens
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          Cookies.remove('user_role')
          Cookies.remove('remember_me')
          
          throw new Error('Authentication failed (401). Please log in again.')
        }
      }
      
      if (!response.ok) {
        // Enhanced error handling for voice message uploads
        let errorMessage = `Failed to send voice message: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.error || errorMessage
        } catch {
          // If we can't parse error response, use status code
        }
        throw new Error(errorMessage)
      }

      const responseData = await response.json()

      /**
       * Optimistic UI Update for Voice Messages
       * 
       * Immediately add the voice message to local state with
       * the same duplicate prevention logic as text messages.
       */
      const newMessage: Message = {
        id: responseData.id || Date.now(),
        text: 'Voice message', // Descriptive text for the voice message
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          is_provider: false
        },
        is_read: false,
        attachment: responseData.attachment,
        attachment_url: responseData.attachment_url,
        attachments: responseData.attachments || []
      }

      // Track message ID for duplicate prevention
      if (newMessage.id) {
        sentMessageIds.current.add(newMessage.id)
      }

      // Add to conversation with duplicate checking
      setConversation(prev => {
        if (!prev) return prev
        
        // Same duplicate prevention logic as text messages
        const messageExists = prev.messages.some(msg => 
          msg.id === newMessage.id || 
          (msg.text === newMessage.text && 
           msg.sender.id === newMessage.sender.id && 
           Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
        )
        
        if (!messageExists) {
          const updatedMessages = [...prev.messages, newMessage]
          updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          return { ...prev, messages: updatedMessages }
        }
        return prev
      })

      /**
       * Success Feedback and UI Cleanup
       */
      
      // Close the voice recorder interface
      setShowVoiceRecorder(false)
      
      // Show success message with duration information
      showToast.success({
        title: "Voice Message Sent ✓",
        description: `Voice message sent successfully (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`
      })

      // Auto-scroll to show new message
      setTimeout(() => scrollToBottom(), 100)

    } catch (error: any) {
      /**
       * Comprehensive Error Handling for Voice Messages
       */
      console.error('Voice message send error:', error)
      
      // Enhanced error feedback based on error type
      let userTitle = "Failed to Send Voice Message"
      let userMessage = 'Please try again or contact support if the problem persists.'
      
      if (error.message?.includes('Authentication failed') || error.message?.includes('401')) {
        userTitle = "Authentication Error"
        userMessage = 'Your session has expired. Please refresh the page and log in again.'
        // Clear potentially invalid tokens
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        userTitle = "Network Error"
        userMessage = 'Please check your internet connection and try again.'
      } else if (error.message?.includes('413') || error.message?.includes('too large')) {
        userTitle = "File Too Large"
        userMessage = 'Voice message is too large. Please record a shorter message.'
      } else if (error.message?.includes('403')) {
        userTitle = "Permission Denied"
        userMessage = 'You do not have permission to send messages in this conversation.'
      } else if (error.message?.includes('429')) {
        userTitle = "Rate Limited"
        userMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (error.message) {
        // Use the actual error message if it's meaningful
        userMessage = error.message
      }
      
      showToast.error({
        title: userTitle,
        description: userMessage,
        duration: 5000
      })
    } finally {
      // Always reset sending state
      setIsSending(false)
    }
  }

  // ==================== CAMERA AND PHOTO CAPTURE FUNCTIONALITY ====================
  
  /**
   * Camera capture success handler
   * 
   * Processes successful photo captures from the camera interface by creating
   * a temporary blob URL for preview and closing the camera modal.
   * 
   * Image Processing:
   * 1. Convert image Blob to temporary URL for preview
   * 2. Store URL in state for preview display
   * 3. Close camera modal to return to chat interface
   * 4. User can then choose to send or cancel the photo
   * 
   * @param imageBlob - Captured image as Blob from camera
   * 
   * @example
   * ```typescript
   * // Called from CameraModal component:
   * <CameraModal onCapture={handleCameraCapture} />
   * ```
   */
  const handleCameraCapture = (imageBlob: Blob) => {
    // Create temporary URL for image preview
    const url = URL.createObjectURL(imageBlob)
    setCapturedImage(url)
    
    // Close camera modal and show preview
    setShowCameraModal(false)
  }

  /**
   * Camera modal close handler
   * 
   * Handles user cancellation or closing of the camera interface
   * without capturing a photo.
   */
  const handleCameraClose = () => {
    setShowCameraModal(false)
  }

  /**
   * Handle image selection from gallery
   * 
   * Processes images selected from the gallery (file picker) and sends them
   * as messages. This is used by both the camera modal gallery button and
   * the image modal gallery button.
   * 
   * @param file - Selected image file from gallery
   */
  const handleImageSelection = async (file: File) => {
    setIsSending(true)
    try {
      /**
       * FormData Construction for Gallery Image Upload
       * 
       * Package the selected image file with conversation metadata for server upload.
       */
      const formData = new FormData()
      formData.append('text', 'Photo from gallery') // Descriptive text for gallery image
      formData.append('conversation', conversationId.toString())
      formData.append('attachment', file) // Use the selected file directly

      // API request setup
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
      const token = Cookies.get('access_token')
      
      /**
       * HTTP Upload Request for Gallery Image
       * 
       * Send the gallery image via HTTP API with proper authentication.
       */
      const response = await fetch(`${apiUrl}/messaging/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type for FormData uploads
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to send gallery image')
      }

      const newMessageData = await response.json()
      
      /**
       * Optimistic UI Update for Gallery Image
       * 
       * Immediately add the gallery image message to local state with
       * the same duplicate prevention as other message types.
       */
      const newMessage: Message = {
        id: newMessageData.id || Date.now(),
        text: 'Photo from gallery', // Descriptive text for gallery image message
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          is_provider: false
        },
        is_read: false,
        attachment: newMessageData.attachment,
        attachment_url: newMessageData.attachment_url,
        attachments: newMessageData.attachments || []
      }

      // Track message ID for duplicate prevention
      if (newMessage.id) {
        sentMessageIds.current.add(newMessage.id)
      }

      // Add to conversation with duplicate checking
      setConversation(prev => {
        if (!prev) return prev
        
        // Same duplicate prevention logic as other message types
        const messageExists = prev.messages.some(msg => 
          msg.id === newMessage.id || 
          (msg.text === newMessage.text && 
           msg.sender.id === newMessage.sender.id && 
           Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
        )
        
        if (!messageExists) {
          const updatedMessages = [...prev.messages, newMessage]
          updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          return { ...prev, messages: updatedMessages }
        }
        return prev
      })

      /**
       * Success Feedback
       */
      
      // Show success message
      showToast.success({
        title: "Gallery Image Sent ✓",
        description: "Image from gallery sent successfully"
      })

      // Auto-scroll to show new message
      setTimeout(() => scrollToBottom(), 100)

    } catch (error) {
      /**
       * Error Handling for Gallery Image Upload
       */
      console.error('Gallery image send error:', error)
      showToast.error({
        title: "Failed to Send Gallery Image",
        description: "Please try again later."
      })
    } finally {
      // Always reset sending state
      setIsSending(false)
    }
  }

  /**
   * Photo sending function with blob URL conversion and upload
   * 
   * Handles the complete workflow of sending a captured photo from the camera
   * interface to the backend server with proper error handling and user feedback.
   * 
   * Features:
   * - Blob URL to Blob conversion for upload
   * - Optimistic UI updates with instant preview
   * - Duplicate prevention and state management
   * - Comprehensive error handling
   * - Automatic UI cleanup after successful send
   * 
   * Photo Processing Flow:
   * 1. Convert blob URL (from camera) to actual Blob
   * 2. Package as FormData with conversation metadata
   * 3. Upload via HTTP API with proper file naming
   * 4. Add to local state for instant feedback
   * 5. Clean up temporary URLs and reset UI
   * 
   * @example
   * ```typescript
   * // Triggered by send button in photo preview:
   * <Button onClick={sendPhoto}>Send Photo</Button>
   * ```
   */
  const sendPhoto = async () => {
    // Early validation: ensure we have a captured image
    if (!capturedImage) return

    setIsSending(true)
    try {
      /**
       * Blob URL to Blob Conversion
       * 
       * The capturedImage is a blob URL (blob:...) created by URL.createObjectURL.
       * We need to convert it back to a Blob for upload to the server.
       */
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      
      /**
       * FormData Construction for Photo Upload
       * 
       * Package the image blob with conversation metadata for server upload.
       * Uses generic 'photo.jpg' filename - server may rename based on actual format.
       */
      const formData = new FormData()
      formData.append('text', 'Photo') // Descriptive text for photo message
      formData.append('conversation', conversationId.toString())
      formData.append('attachment', blob, 'photo.jpg') // Generic photo filename

      // API request setup
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
      const token = Cookies.get('access_token')
      
      /**
       * HTTP Upload Request
       * 
       * Send the photo via HTTP API with proper authentication.
       * Photos require file upload so cannot use WebSocket.
       */
      const response2 = await fetch(`${apiUrl}/messaging/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type for FormData uploads
        },
        body: formData
      })

      if (!response2.ok) {
        // Enhanced error handling for photo uploads
        const errorData = await response2.json()
        throw new Error('Failed to send photo')
      }

      const newMessageData = await response2.json()
      
      /**
       * Optimistic UI Update for Photos
       * 
       * Immediately add the photo message to local state with
       * the same duplicate prevention as other message types.
       */
      const newMessage: Message = {
        id: newMessageData.id || Date.now(),
        text: 'Photo', // Descriptive text for photo message
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          is_provider: false
        },
        is_read: false,
        attachment: newMessageData.attachment,
        attachment_url: newMessageData.attachment_url,
        attachments: newMessageData.attachments || []
      }

      // Track message ID for duplicate prevention
      if (newMessage.id) {
        sentMessageIds.current.add(newMessage.id)
      }

      // Add to conversation with duplicate checking
      setConversation(prev => {
        if (!prev) return prev
        
        // Same duplicate prevention logic as other message types
        const messageExists = prev.messages.some(msg => 
          msg.id === newMessage.id || 
          (msg.text === newMessage.text && 
           msg.sender.id === newMessage.sender.id && 
           Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
        )
        
        if (!messageExists) {
          const updatedMessages = [...prev.messages, newMessage]
          updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          return { ...prev, messages: updatedMessages }
        }
        return prev
      })

      /**
       * Success Cleanup and Feedback
       */
      
      // Clear the captured image and blob URL to prevent memory leaks
      setCapturedImage(null)
      
      // Show success message
      showToast.success({
        title: "Photo Sent ✓",
        description: "Photo sent successfully"
      })

      // Auto-scroll to show new message
      setTimeout(() => scrollToBottom(), 100)

    } catch (error) {
      /**
       * Error Handling for Photo Upload
       */
      console.error('Photo send error:', error)
      showToast.error({
        title: "Failed to Send Photo",
        description: "Please try again later."
      })
    } finally {
      // Always reset sending state
      setIsSending(false)
    }
  }

  // ==================== CHAT REFRESH FUNCTIONALITY ====================
  
  /**
   * Refresh chat data without reloading the entire page
   * Reloads conversation data and resets pagination
   */
  const refreshChat = async () => {
    try {
      setIsLoading(true)
      setCurrentPage(1)
      setHasMoreMessages(true)
      
      // Construct API URL with pagination parameters
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
      const token = Cookies.get('access_token')
      
      // Make authenticated request to Django backend with pagination
      const response = await fetch(`${apiUrl}/messaging/conversations/${conversationId}/?page=1&page_size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,  // JWT authentication
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load conversation')
      }

      const data = await response.json()
      
      // Find the other participant from message senders (not the current user)
      const otherParticipantFromMessages = data.messages?.find((msg: any) => 
        msg.sender && msg.sender.id !== currentUser.id
      )?.sender;

      const cleanedData = {
        ...data,
        // Create other participant data from message senders since API doesn't provide it directly
        other_participant: otherParticipantFromMessages ? {
          id: otherParticipantFromMessages.id,
          name: otherParticipantFromMessages.full_name || 
                (otherParticipantFromMessages.first_name && otherParticipantFromMessages.last_name 
                  ? `${otherParticipantFromMessages.first_name} ${otherParticipantFromMessages.last_name}`.trim()
                  : otherParticipantFromMessages.username || 'Unknown User'),
          username: otherParticipantFromMessages.username || 'unknown',
          first_name: otherParticipantFromMessages.first_name || '',
          last_name: otherParticipantFromMessages.last_name || '',
          email: otherParticipantFromMessages.email || '',
          phone: otherParticipantFromMessages.phone || '',
          location: otherParticipantFromMessages.location || '',
          avatar: otherParticipantFromMessages.avatar || null,
          user_type: otherParticipantFromMessages.user_type || 'customer',
          status: otherParticipantFromMessages.status || 'offline',
          is_provider: otherParticipantFromMessages.user_type === 'provider'
        } : {
          id: 0,
          name: 'Unknown User',
          username: 'unknown',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          location: '',
          avatar: null,
          user_type: 'customer',
          status: 'offline',
          is_provider: false
        },
        // Ensure messages array exists and is properly formatted
        messages: (data.messages || []).map((msg: any) => ({
          id: msg.id || 0,
          text: msg.text || '',
          timestamp: msg.timestamp || new Date().toISOString(),
          sender: {
            id: msg.sender?.id || 0,
            name: msg.sender?.full_name || 
                  (msg.sender?.first_name && msg.sender?.last_name 
                    ? `${msg.sender.first_name} ${msg.sender.last_name}`.trim()
                    : msg.sender?.username || 'Unknown'),
            username: msg.sender?.username || 'unknown',
            first_name: msg.sender?.first_name || '',
            last_name: msg.sender?.last_name || '',
            email: msg.sender?.email || '',
            phone: msg.sender?.phone || '',
            location: msg.sender?.location || '',
            avatar: msg.sender?.avatar || null,
            user_type: msg.sender?.user_type || 'customer',
            status: msg.sender?.status || 'offline'
          },
          is_read: msg.is_read || false,
          attachment: msg.attachment || null,
          attachment_url: msg.attachment_url || null,
          deletion_type: msg.deletion_type || null
        })).sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      }

      // Update conversation state with cleaned data
      setConversation(cleanedData)
      
      // Check if there are more messages to load
      const messageCount = cleanedData.messages.length
      setHasMoreMessages(messageCount >= 50)
      
      showToast.success({
        title: "Chat Refreshed ✓",
        description: "Conversation data has been updated"
      })
    } catch (error) {
      console.error('Failed to refresh chat:', error)
      showToast.error({
        title: "Refresh Failed",
        description: "Could not refresh chat data. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== EMOJI PICKER FUNCTIONALITY ====================
  
  /**
   * Emoji selection handler for message input enhancement
   * 
   * Adds selected emoji to the current message input and closes the picker.
   * Maintains cursor position and input focus for smooth user experience.
   * 
   * @param emoji - Selected emoji string (e.g., "😀", "👍", "❤️")
   * 
   * @example
   * ```typescript
   * // Called from EmojiPicker component:
   * <EmojiPicker onEmojiSelect={addEmoji} />
   * ```
   */
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)  // Append emoji to current message
    setShowEmojiPicker(false)           // Close picker after selection
  }

  // ==================== LOADING AND ERROR STATES ====================

  /**
   * Loading State Render
   * 
   * Displays a full-screen loading interface while the conversation
   * data is being fetched from the backend. Uses the EnhancedLoading
   * component for consistent loading UX across the application.
   * 
   * Shown when:
   * - Component first mounts
   * - Conversation data is being fetched
   * - Before any conversation content is available
   */
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-background">
        {/* Header skeleton */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages skeleton list */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
          <div className="h-full px-6 py-4 space-y-4">
            {[...Array(4)].map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-end gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  /**
   * Error State Render
   * 
   * Displays when conversation fails to load or is not found.
   * Provides user with option to navigate back to previous page.
   * 
   * Triggers when:
   * - API returns 404 (conversation not found)
   * - Network errors during conversation fetch
   * - Invalid conversation ID
   * - Insufficient permissions to access conversation
   */
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p>Conversation not found</p>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header - Full Width Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </motion.div>

            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Avatar className="w-12 h-12 ring-2 ring-gray-200 dark:ring-gray-700 shadow-lg">
                  <AvatarImage src={conversation.other_participant?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
                    {(conversation.other_participant?.name || 'User')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              {/* Online status indicator */}
              {isConnected && (
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {conversation?.other_participant?.name || 'Unknown User'}
                </h3>
                {isConnected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
                {conversation.other_participant?.is_provider && (
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-500 dark:bg-blue-600 text-white dark:text-white border-blue-600 dark:border-blue-500 font-medium px-2 py-1 text-xs shadow-sm"
                  >
                    Provider
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {conversation.service?.title || 'Unknown Service'}
              </p>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 rounded-full transition-all duration-200 shadow-sm hover:shadow-md">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={refreshChat} className="cursor-pointer">
                    <Info className="w-4 h-4 mr-3" />
                    Refresh Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowChatInfo(true)} className="cursor-pointer">
                    <Info className="w-4 h-4 mr-3" />
                    Chat Information
                  </DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem className="text-destructive cursor-pointer">
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Connection Status Banner */}
      <AnimatePresence>
        {connectionStatus.error && (
          <motion.div 
            className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center">
              <div className="flex">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Connection Issue:</strong> {connectionStatus.error}
                  {connectionStatus.error.includes('Authentication') && (
                    <span className="ml-2">
                      <button 
                        onClick={() => window.location.reload()}
                        className="underline hover:text-red-800 dark:hover:text-red-200"
                      >
                        Refresh page
                      </button>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!isConnected && !isConnecting && !connectionStatus.error && (
          <motion.div 
            className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Offline:</strong> Real-time messaging is temporarily unavailable. Messages will be sent when reconnected.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages - Full Viewport Design */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500">
          <div className="px-6 py-4 space-y-6 min-h-full flex flex-col">
            {/* Load More Messages Button */}
            {hasMoreMessages && conversation?.messages?.length > 0 && (
              <motion.div
                className="flex justify-center py-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                  variant="outline"
                  className="px-6 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="text-sm font-medium">Loading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="text-sm font-medium">Load More Messages</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Messages container */}
            <div className="flex-1 space-y-6">
              {conversation?.messages?.length === 0 ? (
                <motion.div 
                  className="flex-1 flex flex-col items-center justify-center text-center py-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-8 shadow-lg"
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
                    <Send className="w-12 h-12 text-blue-500" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    No messages yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md">
                    Start your conversation by sending a message below. 
                    Your provider will be notified instantly!
                  </p>
                </motion.div>
              ) : (
                conversation?.messages?.map((message, index) => {
                  const parseDateSafe = (value?: unknown) => {
                    if (!value) return new Date(NaN)
                    if (value instanceof Date) return value
                    if (typeof value === 'number') {
                      return value < 1e12 ? new Date(value * 1000) : new Date(value)
                    }
                    if (typeof value === 'string') {
                      // Try ISO first
                      let d = parseISO(value)
                      if (!isNaN(d.getTime())) return d
                      // Fallback to native Date parser
                      d = new Date(value)
                      if (!isNaN(d.getTime())) return d
                      // Try replacing space with 'T' for common "YYYY-MM-DD HH:mm:ss"
                      d = parseISO(value.replace(' ', 'T'))
                      if (!isNaN(d.getTime())) return d
                    }
                    return new Date(NaN)
                  }

                  const datesEqualByCalendarDay = (a: Date, b: Date) => {
                    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false
                    return differenceInCalendarDays(a, b) === 0
                  }

                  const getDateLabel = (date: Date) => {
                    if (isNaN(date.getTime())) return ''
                    if (isToday(date)) return 'Today'
                    if (isYesterday(date)) return 'Yesterday'
                    const now = new Date()
                    const fmt = date.getFullYear() === now.getFullYear() ? 'd MMM' : 'd MMM yyyy'
                    return format(date, fmt)
                  }

                  const currentDate = parseDateSafe(message.timestamp)
                  const prevMessage = index > 0 ? conversation.messages[index - 1] : null
                  const prevDate = prevMessage ? parseDateSafe(prevMessage.timestamp) : null

                  const needsSeparator = !prevDate || !datesEqualByCalendarDay(currentDate, prevDate)
                  const label = getDateLabel(currentDate)

                  return (
                    <div key={message.id}>
                      {needsSeparator && label && (
                        <div className="my-4 flex items-center">
                          <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                          <span className="mx-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {label}
                          </span>
                          <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.4, 
                          delay: index > 5 ? 0 : index * 0.08,
                          ease: "easeOut"
                        }}
                      >
                        <MessageBubble
                          message={message}
                          currentUserId={currentUser.id}
                          onImageSelect={handleImageSelection}
                          onDelete={handleDeleteMessage}
                        />
                      </motion.div>
                    </div>
                  )
                })
              )}
            </div>
            
            {/* Real-time typing indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <MultipleTypingIndicator 
                    typingUsers={typingUsers}
                    className="mb-4"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* File upload area */}
      {showFileUpload && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t p-4"
        >
          <FileUpload
            onFileSelect={handleFileSelection}
            maxFiles={FILE_VALIDATION.MAX_FILES}
            maxSizePerFile={FILE_VALIDATION.MAX_IMAGE_SIZE / (1024 * 1024)} // Convert to MB
            acceptedTypes={[
              ...FILE_VALIDATION.ALLOWED_IMAGE_TYPES,
              ...FILE_VALIDATION.ALLOWED_VIDEO_TYPES
            ]}
          />
          
          {/* File Validation Errors Display */}
          {fileValidationErrors.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                File Validation Errors:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {fileValidationErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    {error}
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                <p className="text-xs text-red-600 dark:text-red-400">
                  <strong>Allowed:</strong> Images (max {FILE_VALIDATION.MAX_IMAGE_SIZE / (1024 * 1024)}MB) and Videos (max {FILE_VALIDATION.MAX_VIDEO_SIZE / (1024 * 1024)}MB)
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  <strong>Formats:</strong> JPG, PNG, WebP, GIF, MP4, WebM, MOV, AVI
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setShowFileUpload(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setFileValidationErrors([])
                setShowFileUpload(false)
              }}
              disabled={selectedFiles.length === 0}
            >
              Done ({selectedFiles.length} files)
            </Button>
          </div>
        </motion.div>
      )}



      {/* Voice Message Recorder */}
      <VoiceMessageRecorder
        isVisible={showVoiceRecorder}
        onSend={sendVoiceMessage}
        onCancel={() => setShowVoiceRecorder(false)}
        maxDuration={120}
      />

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCameraModal}
        onClose={handleCameraClose}
        onCapture={handleCameraCapture}
        onImageSelect={handleImageSelection}
      />

      {/* Chat Info Modal */}
      <ChatInfoModal
        isOpen={showChatInfo}
        onClose={() => setShowChatInfo(false)}
        conversation={conversation}
        currentUser={currentUser}
        onRefresh={refreshChat}
      />

      {/* Captured Photo Preview */}
      {capturedImage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src={capturedImage}
                  alt="Captured"
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Photo Captured
                  </p>
                  <p className="text-xs text-gray-500">Ready to send</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={sendPhoto}
                  disabled={isSending}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setCapturedImage(null)}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700 rounded-full p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Emoji Picker */}
      <div className="relative">
        <EmojiPicker
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={addEmoji}
        />
      </div>

      {/* Input area - Full Viewport Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="px-6 py-4">
          <div className="flex items-end gap-3">
            {/* Microphone button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                className={`p-2 rounded-full transition-all duration-200 relative shadow-sm hover:shadow-md ${
                  showVoiceRecorder 
                    ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400"
                }`}
                disabled={!currentUser}
                title={
                  !currentUser 
                    ? "Please log in to send voice messages"
                    : !isConnected 
                    ? "Offline - Voice messages will be sent when reconnected" 
                    : "Record voice message"
                }
              >
                <Mic className={`w-5 h-5 ${!isConnected ? "text-orange-500 dark:text-orange-400" : ""}`} />
                {!isConnected && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 dark:bg-orange-500 rounded-full animate-pulse" />
                )}
              </Button>
            </motion.div>

            {/* Message input */}
            <div className="flex-1">
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Write Something"
                  className="pr-16 min-h-[48px] rounded-full border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-base font-medium shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md focus:shadow-lg"
                  disabled={isSending}
                />
                {isSending && (
                  <motion.div 
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className={`p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${
                    showFileUpload 
                      ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                  title="Attach images (max 10MB) or videos (max 100MB). Supported: JPG, PNG, WebP, GIF, MP4, WebM, MOV, AVI"
                >
                  <Paperclip className="w-5 h-5" />
                  {selectedFiles.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 dark:bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      {selectedFiles.length}
                    </div>
                  )}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCameraModal(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-400 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Camera className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${
                    showEmojiPicker 
                      ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 hover:text-yellow-600 dark:hover:text-yellow-400"
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && selectedFiles.length === 0 && !capturedImage) || isSending}
                  size="sm"
                  className={`p-3 rounded-full transition-all duration-200 relative shadow-lg hover:shadow-xl ${
                    newMessage.trim() || selectedFiles.length > 0 || capturedImage
                      ? isConnected 
                        ? "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white hover:scale-105"
                        : "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white hover:scale-105"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed hover:scale-100"
                  }`}
                  title={!isConnected ? "Offline - Message will be sent when reconnected" : "Send message"}
                >
                  {!isConnected && (newMessage.trim() || selectedFiles.length > 0 || capturedImage) ? (
                    <div className="relative">
                      <Send className="w-5 h-5" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 dark:bg-yellow-500 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 mb-2">
                <Paperclip className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{selectedFiles.length} file(s) selected</span>
                <div className="flex-1" />
                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  Ready to send
                </span>
              </div>
              
              {/* File Details */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => {
                  const isImage = file.type.startsWith('image/')
                  const isVideo = file.type.startsWith('video/')
                  const sizeInMB = (file.size / (1024 * 1024)).toFixed(1)
                  
                  return (
                    <div key={index} className="flex items-center gap-2 text-xs bg-white dark:bg-gray-700 rounded p-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isImage ? 'bg-green-500' : isVideo ? 'bg-purple-500' : 'bg-gray-500'
                      }`} />
                      <span className="flex-1 truncate font-medium">{file.name}</span>
                      <span className="text-gray-500">{sizeInMB}MB</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        isImage 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                      }`}>
                        {isImage ? 'IMG' : 'VID'}
                      </span>
                      <button
                        onClick={() => {
                          const updatedFiles = selectedFiles.filter((_, i) => i !== index)
                          setSelectedFiles(updatedFiles)
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
              
              {/* Total size indicator */}
              {selectedFiles.length > 1 && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700 text-xs text-gray-500">
                  Total size: {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(1)}MB
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}