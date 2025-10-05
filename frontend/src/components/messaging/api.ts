// Messaging API service
import Cookies from 'js-cookie'
import { 
  Conversation, 
  Message, 
  CreateConversationData, 
  CreateMessageData,
  MessagingApiResponse
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

class MessagingApiService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Get token from cookies (used by AuthContext)
    const token = Cookies.get('access_token')
    
    const response = await fetch(`${BASE_URL}/messaging${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        token: token ? 'Present' : 'Missing',
        error: errorText
      })
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // Conversations
  async getConversations(page = 1): Promise<MessagingApiResponse<Conversation>> {
    return this.makeRequest<MessagingApiResponse<Conversation>>(`/conversations/?page=${page}`)
  }

  async getConversation(id: number): Promise<Conversation> {
    return this.makeRequest<Conversation>(`/conversations/${id}/`)
  }

  async createConversation(data: CreateConversationData): Promise<Conversation> {
    return this.makeRequest<Conversation>('/conversations/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async markAsRead(conversationId: number): Promise<void> {
    await this.makeRequest(`/conversations/${conversationId}/mark_as_read/`, {
      method: 'POST',
    })
  }

  async archiveConversation(conversationId: number): Promise<void> {
    await this.makeRequest(`/conversations/${conversationId}/archive/`, {
      method: 'POST',
    })
  }

  async pinConversation(conversationId: number): Promise<void> {
    // Temporary frontend-only implementation until backend supports pinning
    // TODO: Replace with actual API call when backend implements pin functionality
    const pinnedConversations = this.getPinnedConversations()
    const isPinned = pinnedConversations.includes(conversationId)
    
    if (isPinned) {
      // Unpin - remove from localStorage
      const newPinned = pinnedConversations.filter(id => id !== conversationId)
      localStorage.setItem('pinnedConversations', JSON.stringify(newPinned))
    } else {
      // Pin - add to localStorage
      const newPinned = [...pinnedConversations, conversationId]
      localStorage.setItem('pinnedConversations', JSON.stringify(newPinned))
    }
  }

  private getPinnedConversations(): number[] {
    try {
      const pinned = localStorage.getItem('pinnedConversations')
      return pinned ? JSON.parse(pinned) : []
    } catch {
      return []
    }
  }

  // Helper method to check if conversation is pinned (for use in components)
  isConversationPinned(conversationId: number): boolean {
    return this.getPinnedConversations().includes(conversationId)
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.makeRequest(`/conversations/${conversationId}/`, {
      method: 'DELETE',
    })
  }

  // Messages
  async getMessages(conversationId: number, page = 1): Promise<MessagingApiResponse<Message>> {
    return this.makeRequest<MessagingApiResponse<Message>>(
      `/messages/?conversation=${conversationId}&page=${page}`
    )
  }

  async createMessage(data: CreateMessageData): Promise<Message> {
    const formData = new FormData()
    formData.append('text', data.content)  // Using 'text' field as per Django model
    formData.append('conversation', data.conversation_id.toString())
    
    // Add single attachment if provided
    if (data.attachments && data.attachments.length > 0) {
      formData.append('attachment', data.attachments[0])  // Single attachment as per model
    }

    const token = Cookies.get('access_token')
    
    const response = await fetch(`${BASE_URL}/messaging/messages/`, {  // Direct messages endpoint
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async deleteMessage(conversationId: number, messageId: number): Promise<void> {
    await this.makeRequest(`/conversations/${conversationId}/messages/${messageId}/`, {
      method: 'DELETE',
    })
  }

  // Real-time helpers
  getWebSocketUrl(conversationId: number): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = BASE_URL.replace(/^https?:/, '')
    return `${wsProtocol}${wsHost}/ws/chat/${conversationId}/`
  }
}

export const messagingApi = new MessagingApiService()
export default messagingApi