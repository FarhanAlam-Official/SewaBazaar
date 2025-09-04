import api from './api'

export interface ActivityTimelineItem {
  id: string
  type: 'booking' | 'review' | 'profile'
  title: string
  description: string
  timestamp: string
  status: string
  icon: string
  metadata: any
}

export interface SpendingTrend {
  month: string
  month_name: string
  total_spent: number
  booking_count: number
  average_per_booking: number
}

export interface CategorySpending {
  category: string
  total_spent: number
  booking_count: number
}

export interface SpendingAnalytics {
  monthly_trends: SpendingTrend[]
  category_breakdown: CategorySpending[]
  year_comparison: {
    this_year: number
    last_year: number
    change_percentage: number
  }
  summary: {
    total_lifetime_spent: number
    average_monthly_spending: number
    most_expensive_booking: number
  }
}

export interface DashboardStats {
  totalBookings: number
  upcomingBookings: number
  memberSince: string
  totalSpent: number
  savedServices: number
  lastBooking: string
}

export interface CustomerBooking {
  id: number
  service: string
  provider: string
  image: string
  date: string
  time: string
  location: string
  price: number
  status: string
  rating?: number
}

export interface BookingGroups {
  upcoming: CustomerBooking[]
  completed: CustomerBooking[]
  cancelled: CustomerBooking[]
}

export interface RecommendedService {
  id: number
  title: string
  provider_name: string
  image: string
  average_rating: number
  price: number
  discount_price?: number
  category?: string
}

export interface FamilyMember {
  id: string
  name: string
  email: string
  relationship: string
  permissions: {
    bookServices: boolean
    useWallet: boolean
    viewHistory: boolean
    manageBookings: boolean
  }
  addedOn: string
}

/**
 * Customer Service API
 * Handles all customer dashboard related operations
 */
export const customerService = {
  /**
   * Get dashboard statistics for the current customer
   * Enhanced with better error handling and fallback data
   * @returns Promise<DashboardStats>
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/auth/users/dashboard_stats/')
      
      // Cache the response for offline fallback
      localStorage.setItem('dashboard_stats', JSON.stringify(response.data))
      
      return response.data
    } catch (error: any) {
      console.warn('Failed to fetch dashboard stats, using fallback data')
      
      // First try cached data
      const cachedData = localStorage.getItem('dashboard_stats')
      if (cachedData) {
        try {
          return JSON.parse(cachedData)
        } catch (e) {
          console.error('Failed to parse cached dashboard stats:', e)
        }
      }
      
      // If no cached data or API endpoint not implemented, return fallback data
      const fallbackStats: DashboardStats = {
        totalBookings: 0,
        upcomingBookings: 0,
        memberSince: 'New Member',
        totalSpent: 0,
        savedServices: 0,
        lastBooking: ''
      }
      
      // Save fallback data to cache
      localStorage.setItem('dashboard_stats', JSON.stringify(fallbackStats))
      return fallbackStats
    }
  },

  /**
   * Get customer bookings grouped by status
   * Enhanced with better error handling and fallback data
   * @returns Promise<BookingGroups>
   */
  getBookings: async (): Promise<BookingGroups> => {
    try {
      // Use the enhanced customer_bookings endpoint with grouped format
      const response = await api.get('/bookings/bookings/customer_bookings/', {
        params: { format: 'grouped' }
      })
      
      // Cache the response for offline fallback
      localStorage.setItem('customer_bookings', JSON.stringify(response.data))
      
      return response.data
    } catch (error: any) {
      console.warn('Failed to fetch bookings, using fallback data')
      
      // First try cached data
      const cachedData = localStorage.getItem('customer_bookings')
      if (cachedData) {
        try {
          return JSON.parse(cachedData)
        } catch (e) {
          console.error('Failed to parse cached bookings:', e)
        }
      }
      
      // If no cached data, return empty bookings structure
      const fallbackBookings: BookingGroups = {
        upcoming: [],
        completed: [],
        cancelled: []
      }
      
      // Save fallback data to cache
      localStorage.setItem('customer_bookings', JSON.stringify(fallbackBookings))
      return fallbackBookings
    }
  },

  /**
   * Get recommended services for the customer
   * Enhanced with better error handling and fallback
   * @returns Promise<RecommendedService[]>
   */
  getRecommendedServices: async (): Promise<RecommendedService[]> => {
    try {
      // Create mutable parameters object to avoid read-only property errors
      const params = {
        is_featured: true, 
        limit: 6,
        ordering: '-average_rating,-created_at'
      }
      
      // Use direct API call with proper params structure
      const response = await api.get('/services/', { params })
      
      return response.data.results || response.data || []
    } catch (error: any) {
      console.warn('Failed to fetch recommended services, trying fallback')
      
      // If API fails, try to get all services without featured filter
      try {
        const fallbackParams = {
          limit: 6,
          ordering: '-average_rating,-created_at'
        }
        
        const fallbackResponse = await api.get('/services/', { params: fallbackParams })
        
        return fallbackResponse.data.results || fallbackResponse.data || []
      } catch (fallbackError) {
        console.warn('All services API failed, returning empty array')
        return []
      }
    }
  },

  /**
   * Get family members for the customer
   * Note: This endpoint may not be implemented yet (returns mock data)
   * @returns Promise<FamilyMember[]>
   */
  getFamilyMembers: async (): Promise<FamilyMember[]> => {
    try {
      const response = await api.get('/auth/users/family_members/')
      return response.data
    } catch (error: any) {
      console.warn('Family members endpoint not available:', error)
      // Return empty array as this feature may not be implemented yet
      return []
    }
  },

  /**
   * Add a family member
   * Note: This endpoint may not be implemented yet
   * @param data - Family member data
   * @returns Promise<FamilyMember>
   */
  addFamilyMember: async (data: Omit<FamilyMember, 'id' | 'addedOn'>): Promise<FamilyMember> => {
    try {
      const response = await api.post('/auth/users/family_members/', data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add family member')
    }
  },

  /**
   * Update a family member
   * Note: This endpoint may not be implemented yet
   * @param id - Family member ID
   * @param data - Updated family member data
   * @returns Promise<FamilyMember>
   */
  updateFamilyMember: async (id: string, data: Partial<FamilyMember>): Promise<FamilyMember> => {
    try {
      const response = await api.patch(`/auth/users/family_members/${id}/`, data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update family member')
    }
  },

  /**
   * Delete a family member
   * Note: This endpoint may not be implemented yet
   * @param id - Family member ID
   * @returns Promise<void>
   */
  deleteFamilyMember: async (id: string): Promise<void> => {
    try {
      await api.delete(`/auth/users/family_members/${id}/`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete family member')
    }
  },
  
  /**
   * Cancel booking
   * @param id - Booking ID
   * @returns Promise<void>
   */
  cancelBooking: async (id: number): Promise<void> => {
    try {
      await api.patch(`/bookings/${id}/cancel/`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel booking')
    }
  },

  /**
   * Reschedule booking
   * @param id - Booking ID
   * @param date - New date
   * @param time - New time
   * @returns Promise<void>
   */
  rescheduleBooking: async (id: number, date: string, time: string): Promise<void> => {
    try {
      await api.patch(`/bookings/${id}/reschedule/`, { date, time })
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reschedule booking')
    }
  },
  
  /**
   * Submit a review for a completed service
   * @param bookingId - Booking ID
   * @param rating - Rating (1-5)
   * @param comment - Review comment
   * @returns Promise<void>
   */
  submitReview: async (bookingId: number, rating: number, comment: string): Promise<void> => {
    try {
      await api.post(`/reviews/`, {
        booking: bookingId,
        rating,
        comment
      })
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to submit review')
    }
  },
  
  /**
   * Get activity timeline for the customer
   * Now uses real API endpoint with enhanced data
   * @returns Promise<ActivityTimelineItem[]>
   */
  getActivityTimeline: async (): Promise<ActivityTimelineItem[]> => {
    try {
      const response = await api.get('/auth/users/activity_timeline/')
      return response.data.timeline || []
    } catch (error: any) {
      console.warn('Activity timeline endpoint not available:', error)
      // Return empty array as this feature may not be implemented yet
      return []
    }
  },
  
  /**
   * Get spending trends for the customer
   * Now uses real API endpoint with comprehensive analytics
   * @returns Promise<SpendingAnalytics>
   */
  getSpendingTrends: async (): Promise<SpendingAnalytics> => {
    try {
      const response = await api.get('/auth/users/spending_trends/')
      return response.data
    } catch (error: any) {
      console.warn('Spending trends endpoint not available:', error)
      // Return empty analytics structure
      return {
        monthly_trends: [],
        category_breakdown: [],
        year_comparison: {
          this_year: 0,
          last_year: 0,
          change_percentage: 0
        },
        summary: {
          total_lifetime_spent: 0,
          average_monthly_spending: 0,
          most_expensive_booking: 0
        }
      }
    }
  },
  
  /**
   * Get notifications for the customer
   * @returns Promise<any[]>
   */
  getNotifications: async (): Promise<any[]> => {
    try {
      const response = await api.get('/notifications/')
      return response.data.results || response.data || []
    } catch (error: any) {
      console.warn('Notifications endpoint not available:', error)
      return []
    }
  },
  
  /**
   * Get unread notifications count
   * @returns Promise<number>
   */
  getUnreadNotificationsCount: async (): Promise<number> => {
    try {
      const response = await api.get('/notifications/unread_count/')
      return response.data.unread_count || 0
    } catch (error: any) {
      console.warn('Unread notifications count endpoint not available:', error)
      return 0
    }
  },
  
  /**
   * Mark notification as read
   * @param notificationId - Notification ID
   * @returns Promise<void>
   */
  markNotificationAsRead: async (notificationId: number): Promise<void> => {
    try {
      await api.patch(`/notifications/${notificationId}/mark_as_read/`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read')
    }
  },
  
  /**
   * Mark all notifications as read
   * @returns Promise<void>
   */
  markAllNotificationsAsRead: async (): Promise<void> => {
    try {
      await api.patch('/notifications/mark_all_as_read/')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read')
    }
  },
  
  /**
   * Delete a notification
   * @param notificationId - Notification ID
   * @returns Promise<void>
   */
  deleteNotification: async (notificationId: number): Promise<void> => {
    try {
      await api.delete(`/notifications/${notificationId}/`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete notification')
    }
  },
  
  /**
   * Clear all read notifications
   * @returns Promise<void>
   */
  clearReadNotifications: async (): Promise<void> => {
    try {
      await api.delete('/notifications/clear_read/')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to clear read notifications')
    }
  },
}

export default customerService