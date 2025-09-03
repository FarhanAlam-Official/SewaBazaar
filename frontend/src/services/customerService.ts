import api from './api'

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
   * @returns Promise<DashboardStats>
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get('/customers/dashboard-stats/')
      return response.data
    } catch (error: any) {
      // Fallback to cached data if available
      const cachedData = localStorage.getItem('dashboard_stats')
      if (cachedData) {
        return JSON.parse(cachedData)
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics')
    }
  },

  /**
   * Get customer bookings grouped by status
   * @returns Promise<BookingGroups>
   */
  getBookings: async (): Promise<BookingGroups> => {
    try {
      const response = await api.get('/bookings/customer/')
      
      // Cache the response for offline fallback
      localStorage.setItem('customer_bookings', JSON.stringify(response.data))
      
      return response.data
    } catch (error: any) {
      // Fallback to cached data if available
      const cachedData = localStorage.getItem('customer_bookings')
      if (cachedData) {
        return JSON.parse(cachedData)
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch bookings')
    }
  },

  /**
   * Get recommended services for the customer
   * @returns Promise<RecommendedService[]>
   */
  getRecommendedServices: async (): Promise<RecommendedService[]> => {
    try {
      const response = await api.get('/services/recommended/')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recommended services')
    }
  },

  /**
   * Get family members for the customer
   * @returns Promise<FamilyMember[]>
   */
  getFamilyMembers: async (): Promise<FamilyMember[]> => {
    try {
      const response = await api.get('/customers/family-members/')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch family members')
    }
  },

  /**
   * Add a family member
   * @param data - Family member data
   * @returns Promise<FamilyMember>
   */
  addFamilyMember: async (data: Omit<FamilyMember, 'id' | 'addedOn'>): Promise<FamilyMember> => {
    try {
      const response = await api.post('/customers/family-members/', data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add family member')
    }
  },

  /**
   * Update a family member
   * @param id - Family member ID
   * @param data - Updated family member data
   * @returns Promise<FamilyMember>
   */
  updateFamilyMember: async (id: string, data: Partial<FamilyMember>): Promise<FamilyMember> => {
    try {
      const response = await api.patch(`/customers/family-members/${id}/`, data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update family member')
    }
  },

  /**
   * Delete a family member
   * @param id - Family member ID
   * @returns Promise<void>
   */
  deleteFamilyMember: async (id: string): Promise<void> => {
    try {
      await api.delete(`/customers/family-members/${id}/`)
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
   * @returns Promise<any>
   */
  getActivityTimeline: async (): Promise<any> => {
    try {
      const response = await api.get('/customers/activity-timeline/')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch activity timeline')
    }
  },
  
  /**
   * Get spending trends for the customer
   * @returns Promise<any>
   */
  getSpendingTrends: async (): Promise<any> => {
    try {
      const response = await api.get('/customers/spending-trends/')
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch spending trends')
    }
  }
}

export default customerService