import api from './api'

export interface ProviderBooking {
  id: number
  service: {
    title: string
    image_url?: string
  }
  customer: {
    name: string
    phone?: string
    email?: string
  }
  date: string
  time: string
  location: string
  status: string
  price: number
  total_amount: number
  payment_type?: string
  service_delivery?: any
  booking_date?: string
  booking_time?: string
  address?: string
  city?: string
  phone?: string
  special_instructions?: string
  provider_name?: string
  provider_id?: number
  service_category?: string
  booking_slot_details?: {
    id: number
    start_time: string
    end_time: string
    slot_type: string
  }
}

export interface ProviderBookingGroups {
  upcoming: ProviderBooking[]
  pending: ProviderBooking[]
  completed: ProviderBooking[]
  count: number
  next: string | null
  previous: string | null
}

export interface ProviderDashboardStats {
  totalBookings: number
  upcomingBookings: number
  memberSince: string
  totalEarnings: number
  servicesCount: number
  lastBooking: string
  rating: number
  earnings: {
    total: number
    thisMonth: number
    pending: number
  }
}

/**
 * Provider Service API
 * Handles all provider dashboard related operations
 */
export const providerApi = {
  /**
   * Get provider bookings grouped by status
   * @returns Promise<ProviderBookingGroups>
   */
  getProviderBookings: async (): Promise<ProviderBookingGroups> => {
    try {
      const response = await api.get('/bookings/bookings/provider_bookings/', {
        params: { format: 'grouped' }
      })
      
      // Transform the response to match our interface
      const transformBooking = (booking: any): ProviderBooking => {
        return {
          id: booking.id,
          service: {
            title: booking.service?.title || booking.service_name || 'Unknown Service',
            image_url: booking.service?.image_url || booking.service_image || ''
          },
          customer: {
            name: booking.customer?.name || booking.customer_name || 'Unknown Customer',
            phone: booking.customer?.phone || booking.phone || '',
            email: booking.customer?.email || booking.email || ''
          },
          date: booking.date || booking.booking_date || '',
          time: booking.time || booking.booking_time || '',
          location: booking.location || booking.address || '',
          status: booking.status || 'pending',
          price: booking.price || booking.total_amount || 0,
          total_amount: booking.total_amount || booking.price || 0,
          payment_type: booking.payment_type || '',
          service_delivery: booking.service_delivery || null,
          booking_date: booking.booking_date || booking.date || '',
          booking_time: booking.booking_time || booking.time || '',
          address: booking.address || booking.location || '',
          city: booking.city || '',
          phone: booking.phone || '',
          special_instructions: booking.special_instructions || '',
          provider_name: booking.provider_name || '',
          provider_id: booking.provider_id || null,
          service_category: booking.service_category || '',
          booking_slot_details: booking.booking_slot_details || null
        }
      }
      
      return {
        upcoming: response.data.upcoming?.map(transformBooking) || [],
        pending: response.data.pending?.map(transformBooking) || [],
        completed: response.data.completed?.map(transformBooking) || [],
        count: response.data.count || 0,
        next: response.data.next || null,
        previous: response.data.previous || null
      }
    } catch (error: any) {
      console.error('Error fetching provider bookings:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider bookings')
    }
  },

  /**
   * Get dashboard statistics for the current provider
   * @returns Promise<ProviderDashboardStats>
   */
  getDashboardStats: async (): Promise<ProviderDashboardStats> => {
    try {
      const response = await api.get('/auth/users/provider_dashboard_stats/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider dashboard stats:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics')
    }
  },

  /**
   * Get provider services
   * @returns Promise<any[]>
   */
  getProviderServices: async (): Promise<any[]> => {
    try {
      const response = await api.get('/services/provider_services/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider services:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider services')
    }
  },

  /**
   * Get provider reviews
   * @returns Promise<any[]>
   */
  getProviderReviews: async (): Promise<any[]> => {
    try {
      const response = await api.get('/reviews/provider_reviews/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider reviews:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider reviews')
    }
  },

  /**
   * Get provider earnings
   * @returns Promise<any>
   */
  getProviderEarnings: async (): Promise<any> => {
    try {
      const response = await api.get('/payments/provider_earnings/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider earnings:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider earnings')
    }
  }
}

export default providerApi