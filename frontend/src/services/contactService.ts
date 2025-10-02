import api from './api';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  attachments?: File[];
}

export interface ContactMessageResponse {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  is_responded: boolean;
  admin_response?: string;
  responded_at?: string;
  responded_by_name?: string;
}

export interface ContactMessageStats {
  total_messages: number;
  pending_messages: number;
  in_progress_messages: number;
  resolved_messages: number;
  spam_messages: number;
  messages_today: number;
  messages_this_week: number;
  messages_this_month: number;
  average_response_time_hours: number;
  response_rate_percentage: number;
  priority_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
}

class ContactService {
  /**
   * Send a contact message
   */
  async sendMessage(messageData: ContactMessage): Promise<{ message: string; id: number; status: string }> {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('name', messageData.name);
    formData.append('email', messageData.email);
    formData.append('subject', messageData.subject);
    formData.append('message', messageData.message);
    
    // Add attachments if any
    if (messageData.attachments && messageData.attachments.length > 0) {
      messageData.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
    }
    
    const response = await api.post('/contact/messages/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  /**
   * Get contact messages (admin only)
   */
  async getMessages(params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: ContactMessageResponse[];
  }> {
    const response = await api.get('/contact/messages/', { params });
    return response.data;
  }

  /**
   * Get a specific contact message (admin only)
   */
  async getMessage(id: number): Promise<ContactMessageResponse> {
    const response = await api.get(`/contact/messages/${id}/`);
    return response.data;
  }

  /**
   * Respond to a contact message (admin only)
   */
  async respondToMessage(
    id: number, 
    responseData: {
      admin_response: string;
      status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }
  ): Promise<{ message: string; data: ContactMessageResponse }> {
    const response = await api.post(`/contact/messages/${id}/respond/`, responseData);
    return response.data;
  }

  /**
   * Update message status (admin only)
   */
  async updateStatus(
    id: number, 
    status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<{ message: string; status: string }> {
    const response = await api.patch(`/contact/messages/${id}/update_status/`, { status });
    return response.data;
  }

  /**
   * Update message priority (admin only)
   */
  async updatePriority(
    id: number, 
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<{ message: string; priority: string }> {
    const response = await api.patch(`/contact/messages/${id}/update_priority/`, { priority });
    return response.data;
  }

  /**
   * Mark message as spam (admin only)
   */
  async markAsSpam(id: number): Promise<{ message: string; is_spam: boolean; status: string }> {
    const response = await api.post(`/contact/messages/${id}/mark_spam/`);
    return response.data;
  }

  /**
   * Toggle important flag (admin only)
   */
  async toggleImportant(id: number): Promise<{ message: string; is_important: boolean }> {
    const response = await api.post(`/contact/messages/${id}/mark_important/`);
    return response.data;
  }

  /**
   * Get contact message statistics (admin only)
   */
  async getStatistics(): Promise<ContactMessageStats> {
    const response = await api.get('/contact/messages/statistics/');
    return response.data;
  }

  /**
   * Get recent contact messages (admin only)
   */
  async getRecentMessages(limit: number = 10): Promise<{
    count: number;
    messages: ContactMessageResponse[];
  }> {
    const response = await api.get('/contact/messages/recent/', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Get pending contact messages (admin only)
   */
  async getPendingMessages(): Promise<{
    count: number;
    messages: ContactMessageResponse[];
  }> {
    const response = await api.get('/contact/messages/pending/');
    return response.data;
  }

  /**
   * Bulk update status for multiple messages (admin only)
   */
  async bulkUpdateStatus(
    messageIds: number[], 
    status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<{ message: string; updated_count: number }> {
    const response = await api.post('/contact/messages/bulk_update_status/', {
      message_ids: messageIds,
      status
    });
    return response.data;
  }

  /**
   * Send a simple contact message (for public use)
   */
  async sendSimpleMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ message: string; id: number; status: string }> {
    const response = await api.post('/contact/messages/', data);
    return response.data;
  }
}

export const contactService = new ContactService();