// Common types for messaging components

export interface Participant {
  id: number
  name: string
  avatar?: string | null
  is_provider?: boolean
}

export interface Service {
  id: number
  title: string
  category: string
}

export interface Attachment {
  id: number
  file_name: string
  file_url: string
  file_type: string
  file_size: number
}

export interface Message {
  id: number
  text: string  // Changed from 'content' to match Django API
  timestamp: string
  sender: Participant
  is_read: boolean
  attachment?: string  // Single attachment field from Django
  attachment_url?: string
  attachments?: Attachment[]  // Keep for backward compatibility
}

export interface Conversation {
  id: number
  service: Service
  other_participant: Participant
  last_message?: Message | null
  unread_count: number
  created_at: string
  updated_at: string
  is_pinned?: boolean
  is_archived?: boolean
  messages?: Message[]
}

export interface CreateConversationData {
  service_id?: number
  provider_id?: number
  initial_message: string
}

export interface CreateMessageData {
  content: string
  conversation_id: number
  attachments?: File[]
}

export interface MessagingApiResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}