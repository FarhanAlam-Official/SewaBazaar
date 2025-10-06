"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import Image from "next/image"
import { motion } from "framer-motion"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VoiceMessagePlayer } from "./VoiceMessagePlayer"
import { ImageMessageCard } from "./ImageMessageCard"
import { 
  Check, 
  CheckCheck, 
  Clock, 
  Download, 
  Image as ImageIcon,
  FileText,
  MoreHorizontal,
  Reply,
  Trash2,
  Play,
  Pause,
  Mic
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MessageBubbleProps {
  message: {
    id: number
    text: string  // Changed from 'content' to 'text' to match Django API
    timestamp: string
    sender: {
      id: number
      name: string
      avatar?: string
      is_provider?: boolean
    }
    is_read: boolean
    attachment?: string  // Changed to single attachment as per Django model
    attachment_url?: string
    deletion_type?: 'self' | 'everyone'
    attachments?: Array<{  // Keep for backward compatibility
      id: number
      file_name: string
      file_url: string
      file_type: string
      file_size: number
    }>
  }
  currentUserId: number
  onDelete?: (messageId: number, deletionType?: 'self' | 'everyone') => void
  onReply?: (messageId: number) => void
  onImageSelect?: (file: File) => void
}

export function MessageBubble({ 
  message, 
  currentUserId, 
  onDelete, 
  onReply,
  onImageSelect
}: MessageBubbleProps) {
  const [imageError, setImageError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isOwn = message.sender.id === currentUserId
  
  // Update current time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if ((fileType || '').startsWith('image/')) return ImageIcon
    return FileText
  }

  // Voice message functions
  const playVoiceMessage = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleAudioLoaded = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Check if attachment is an audio file (voice message)
  const isAudioAttachment = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return false
    
    // Check URL extension
    const audioExtensions = ['.webm', '.wav', '.mp3', '.m4a', '.ogg', '.aac']
    return audioExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  // Check if attachment is an image file
  const isImageAttachment = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string') return false
    
    // Check URL extension
    const lowerUrl = url.toLowerCase()
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    const isImage = imageExtensions.some(ext => lowerUrl.includes(ext))
    const hasMimePattern = lowerUrl.includes('image/') || (lowerUrl.includes('content-type') && lowerUrl.includes('image'))
    return isImage || hasMimePattern
  }

  // Check if "Delete for Everyone" is available (15-minute time limit)
  const canDeleteForEveryone = () => {
    if (!isOwn) return false // Only message sender can delete for everyone
    
    const messageTime = new Date(message.timestamp)
    const timeDifference = currentTime.getTime() - messageTime.getTime()
    const fifteenMinutesInMs = 15 * 60 * 1000 // 15 minutes in milliseconds
    
    return timeDifference <= fifteenMinutesInMs
  }

  // Get remaining time for deletion
  const getRemainingDeletionTime = () => {
    if (!isOwn) return null
    
    const messageTime = new Date(message.timestamp)
    const timeDifference = currentTime.getTime() - messageTime.getTime()
    const fifteenMinutesInMs = 15 * 60 * 1000
    const remainingMs = fifteenMinutesInMs - timeDifference
    
    if (remainingMs <= 0) return null
    
    const remainingMinutes = Math.floor(remainingMs / (60 * 1000))
    const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000)
    
    return { minutes: remainingMinutes, seconds: remainingSeconds }
  }

  // Handle delete confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = (deletionType: 'self' | 'everyone' = 'self') => {
    if (onDelete) {
      onDelete(message.id, deletionType)
    }
    setShowDeleteConfirm(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  // Check if message is a voice message
  const isVoiceMessage = (
    (message.text === 'Voice message' || message.text === '' || !message.text) && 
    (message.attachment_url || message.attachment) &&
    isAudioAttachment(message.attachment_url || message.attachment)
  )

  // Check if message is an image message
  const attachmentUrl = message.attachment_url || message.attachment
  const isImageMessage = attachmentUrl && isImageAttachment(attachmentUrl)
  


  return (
    <motion.div 
      className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} mb-6`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Avatar for other users */}
      {!isOwn && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <Avatar className="w-10 h-10 ring-2 ring-background shadow-md">
            <AvatarImage src={message.sender?.avatar || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
              {(message.sender?.name || 'User').split(' ').map(n => n[0] || 'U').join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Message content */}
      <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
        {/* Sender name and role */}
        {!isOwn && (
          <motion.div 
            className="flex items-center gap-2 mb-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-sm font-semibold text-foreground">{message.sender?.name || 'User'}</span>
            {message.sender?.is_provider && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20 font-medium"
              >
                Provider
              </Badge>
            )}
          </motion.div>
        )}

        {/* Message bubble - Clean Design */}
        <motion.div
          className={`group relative transition-all duration-200 ${
            isVoiceMessage || isImageMessage
              ? 'bg-transparent p-0' // No background for voice/image messages, let components handle styling
              : isOwn
                ? 'bg-blue-500 text-white ml-auto max-w-xs rounded-2xl px-4 py-3 inline-block'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white max-w-xs rounded-2xl px-4 py-3 inline-block'
          }`}
          whileHover={{ scale: (isVoiceMessage || isImageMessage) ? 1 : 1.01 }}
          whileTap={{ scale: (isVoiceMessage || isImageMessage) ? 1 : 0.99 }}
        >
          {/* Check if message was deleted for everyone */}
          {message.deletion_type === 'everyone' ? (
            <div className={`flex items-center gap-2 text-sm ${
              isOwn 
                ? 'text-white/70 bg-gray-600/50' 
                : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700'
            } px-4 py-3 rounded-lg`}>
              <Trash2 className="w-4 h-4" />
              <span className="italic">This message was deleted</span>
            </div>
          ) : (
            <>
              {/* Message content */}
              {isVoiceMessage ? (
                <VoiceMessagePlayer
                  audioUrl={message.attachment_url || message.attachment || ''}
                  duration={audioDuration}
                  isOwn={isOwn}
                  timestamp={message.timestamp}
                  onError={(error) => console.error('Voice message error:', error)}
                />
              ) : isImageMessage ? (
                <ImageMessageCard
                  imageUrl={attachmentUrl || ''}
                  fileName={message.text !== 'Photo' && message.text !== 'Image' ? message.text : undefined}
                  isOwn={isOwn}
                  timestamp={message.timestamp}
                  onError={(error) => console.error('Image message error:', error)}
                  onImageSelect={onImageSelect}
                />
              ) : (
            <>
              {message.text && message.text.trim() && (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed font-medium">
                  {message.text}
                </p>
              )}

              {/* Fallback for non-image/non-voice attachments */}
              {!isVoiceMessage && !isImageMessage && attachmentUrl && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Attachment</p>
                      <p className="text-xs text-gray-500">Click to download</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(attachmentUrl, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              </>
              )}
            </>
          )}


          {/* Multiple Attachments with Enhanced Image Display */}
          {message.attachments && message.attachments.length > 0 && !isVoiceMessage && !isImageMessage && (
            <div className="mt-3 space-y-3">
              {message.attachments
                .map((attachment) => {
                  const fileType = attachment.file_type || ''
                  const FileIcon = getFileIcon(fileType)
                  const isImage = fileType.startsWith('image/')
                  const isAudio = fileType.startsWith('audio/')

                  return (
                    <div key={attachment.id}>
                      {isImage ? (
                        <ImageMessageCard
                          imageUrl={attachment.file_url || ''}
                          fileName={attachment.file_name}
                          fileSize={attachment.file_size}
                          isOwn={isOwn}
                          onError={(error) => console.error('Attachment image error:', error)}
                          onImageSelect={onImageSelect}
                        />
                      ) : isAudio ? (
                        <VoiceMessagePlayer
                          audioUrl={attachment.file_url || ''}
                          duration={0} // Duration not available in attachment data
                          isOwn={isOwn}
                          timestamp={message.timestamp}
                          onError={(error) => console.error('Attachment audio error:', error)}
                        />
                      ) : (
                        <div
                          className={`rounded-lg border p-3 transition-all hover:shadow-md ${
                            isOwn 
                              ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                              : 'bg-muted/50 border-border hover:bg-muted/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isOwn ? 'bg-primary/10' : 'bg-muted'
                            }`}>
                              <FileIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.file_size)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(attachment.file_url || '', '_blank')}
                              className="h-8 w-8 p-0 hover:bg-primary/20"
                              title="Download attachment"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}

          {/* Message options menu (only for own messages) */}
          {isOwn && (onDelete || onReply) && message.deletion_type !== 'everyone' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-300/50 dark:border-gray-600/50 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-xl"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {onReply && (
                  <DropdownMenuItem 
                    onClick={() => onReply(message.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-500 dark:hover:text-white dark:hover:bg-red-600 cursor-pointer transition-all duration-200 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 data-[highlighted]:text-white data-[highlighted]:bg-red-500 dark:data-[highlighted]:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>

        {/* Message status and timestamp */}
        <motion.div 
          className={`flex items-center gap-2 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-xs text-muted-foreground font-medium">
            {message.timestamp && !isNaN(new Date(message.timestamp).getTime()) 
              ? format(new Date(message.timestamp), 'hh:mm a') 
              : 'Invalid time'
            }
          </span>
          
          {/* Read status for own messages */}
          {isOwn && (
            <motion.div 
              className="flex items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              {message.is_read ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3 text-muted-foreground" />
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Avatar for own messages */}
      {isOwn && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <Avatar className="w-10 h-10 ring-2 ring-background shadow-md">
            <AvatarImage src={message.sender?.avatar || ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold">
              {(message.sender?.name || 'User').split(' ').map(n => n[0] || 'U').join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto p-6">
          <DialogHeader className="mb-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Message
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-base">
              Choose how you want to delete this message:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Delete for Me Option */}
            <div
              onClick={() => handleDeleteConfirm('self')}
              className="w-full p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-100/50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 cursor-pointer transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100/50 dark:bg-red-900/20 rounded-lg flex items-center justify-center group-hover:bg-red-200/70 dark:group-hover:bg-red-800/30 transition-colors duration-300">
                  <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-red-700 dark:text-red-300 text-base mb-2">Delete for Me</p>
                  <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                    Remove this message only from your view. Others can still see it.
                  </p>
                </div>
              </div>
            </div>

            {/* Delete for Everyone Option */}
            {canDeleteForEveryone() ? (
              <div
                onClick={() => handleDeleteConfirm('everyone')}
                className="w-full p-4 rounded-xl bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 cursor-pointer transition-all duration-300 group shadow-lg hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500 dark:bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-400 dark:group-hover:bg-red-500 transition-colors duration-300">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-base mb-2">Delete for Everyone</p>
                    <p className="text-sm text-red-100 dark:text-red-200 leading-relaxed mb-3">
                      Remove this message from everyone's chat. It will show "Message was deleted" for others.
                    </p>
                    {(() => {
                      const remainingTime = getRemainingDeletionTime()
                      return remainingTime ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-md">
                          <span>⏰</span>
                          <span>Available for {remainingTime.minutes}m {remainingTime.seconds}s</span>
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-600 dark:text-gray-400 text-base mb-2">Delete for Everyone (Unavailable)</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
                      Can only delete for everyone within 15 minutes of sending.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              className="px-8 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}