import api from './api'
import type {
  ProviderBooking,
  ProviderBookingGroups,
  ProviderDashboardStats,
  ProviderRecentBookings,
  ProviderEarningsAnalytics,
  ProviderServicePerformance,
  LegacyProviderStats,
  ProviderService,
  CreateServiceData,
  ServiceImage,
  ServiceCategory,
  City
} from '@/types/provider'

/**
 * Provider Service API
 * Handles all provider dashboard related operations with real backend integration
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
      const response = await api.get('/bookings/provider-dashboard/statistics/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider dashboard stats:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics')
    }
  },

  /**
   * Get recent bookings for provider dashboard
   * @param limit - Number of recent bookings to fetch (default: 10)
   * @returns Promise<ProviderRecentBookings>
   */
  getRecentBookings: async (limit: number = 10): Promise<ProviderRecentBookings> => {
    try {
      const response = await api.get('/bookings/provider-dashboard/recent_bookings/', {
        params: { limit }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching recent bookings:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch recent bookings')
    }
  },

  /**
   * Get earnings analytics for provider
   * @param period - Time period: 'week' | 'month' | 'year'
   * @returns Promise<ProviderEarningsAnalytics>
   */
  getEarningsAnalytics: async (period: 'week' | 'month' | 'year' = 'month'): Promise<ProviderEarningsAnalytics> => {
    try {
      const response = await api.get('/bookings/provider-dashboard/earnings_analytics/', {
        params: { period }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching earnings analytics:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch earnings analytics')
    }
  },

  /**
   * Get service performance analytics
   * @returns Promise<ProviderServicePerformance>
   */
  getServicePerformance: async (): Promise<ProviderServicePerformance> => {
    try {
      const response = await api.get('/bookings/provider-dashboard/service_performance/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching service performance:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch service performance')
    }
  },

  /**
   * Get cached dashboard statistics (faster response)
   * @returns Promise<ProviderDashboardStats>
   */
  getCachedDashboardStats: async (): Promise<ProviderDashboardStats> => {
    try {
      const response = await api.get('/bookings/provider-analytics/cached_statistics/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching cached dashboard stats:', error)
      // Fallback to regular stats if cached version fails
      return providerApi.getDashboardStats()
    }
  },

  /**
   * Refresh provider analytics cache
   * @returns Promise<{success: boolean, message: string}>
   */
  refreshAnalyticsCache: async (): Promise<{success: boolean, message: string}> => {
    try {
      const response = await api.post('/bookings/provider-analytics/refresh_cache/')
      return response.data
    } catch (error: any) {
      console.error('Error refreshing analytics cache:', error)
      throw new Error(error.response?.data?.message || 'Failed to refresh analytics cache')
    }
  },

  /**
   * Transform new API response to legacy format for backward compatibility
   * @param newStats - New API response format
   * @returns LegacyProviderStats
   */
  transformToLegacyStats: (newStats: ProviderDashboardStats): LegacyProviderStats => {
    return {
      totalBookings: newStats.bookings.total,
      upcomingBookings: newStats.bookings.pending,
      memberSince: "January 2020", // This would need to come from user profile
      totalEarnings: newStats.earnings.total,
      servicesCount: newStats.services.total,
      lastBooking: "", // This would need to be calculated from recent bookings
      rating: newStats.ratings.average_rating,
      earnings: {
        total: newStats.earnings.total,
        thisMonth: newStats.earnings.this_month,
        pending: 0 // This would need to be calculated separately
      }
    }
  },

  /**
   * Get dashboard statistics in legacy format for backward compatibility
   * @returns Promise<LegacyProviderStats>
   */
  getLegacyDashboardStats: async (): Promise<LegacyProviderStats> => {
    try {
      const newStats = await providerApi.getDashboardStats()
      return providerApi.transformToLegacyStats(newStats)
    } catch (error: any) {
      console.error('Error fetching legacy dashboard stats:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics')
    }
  },

  /**
   * Get provider services with enhanced details
   * @returns Promise<ProviderService[]>
   */
  getProviderServices: async (): Promise<ProviderService[]> => {
    try {
      const response = await api.get('/services/provider_services/')
      return response.data.map((service: any) => ({
        id: service.id,
        title: service.title,
        slug: service.slug,
        description: service.description,
        short_description: service.short_description,
        price: service.price,
        discount_price: service.discount_price,
        duration: service.duration,
        category: service.category_name,
        category_id: service.category,
        cities: service.cities,
        image: service.image,
        images: service.images,
        includes: service.includes,
        excludes: service.excludes,
        status: service.status,
        is_featured: service.is_featured,
        average_rating: service.average_rating,
        reviews_count: service.reviews_count,
        tags: service.tags || [],
        is_verified_provider: service.is_verified_provider,
        response_time: service.response_time,
        cancellation_policy: service.cancellation_policy,
        view_count: service.view_count,
        inquiry_count: service.inquiry_count,
        last_activity: service.last_activity,
        availability: service.availability,
        created_at: service.created_at,
        updated_at: service.updated_at
      }))
    } catch (error: any) {
      console.error('Error fetching provider services:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider services')
    }
  },

  /**
   * Create a new service
   * @param serviceData - Service creation data
   * @returns Promise<ProviderService>
   */
  createService: async (serviceData: CreateServiceData): Promise<ProviderService> => {
    try {
      const response = await api.post('/services/', serviceData)
      return response.data
    } catch (error: any) {
      console.error('Error creating service:', error)
      throw new Error(error.response?.data?.message || 'Failed to create service')
    }
  },

  /**
   * Update an existing service
   * @param serviceId - Service ID
   * @param serviceData - Service update data
   * @returns Promise<ProviderService>
   */
  updateService: async (serviceId: number, serviceData: Partial<CreateServiceData>): Promise<ProviderService> => {
    try {
      const response = await api.patch(`/services/${serviceId}/`, serviceData)
      return response.data
    } catch (error: any) {
      console.error('Error updating service:', error)
      throw new Error(error.response?.data?.message || 'Failed to update service')
    }
  },

  /**
   * Delete a service
   * @param serviceId - Service ID
   * @returns Promise<void>
   */
  deleteService: async (serviceId: number): Promise<void> => {
    try {
      await api.delete(`/services/${serviceId}/`)
    } catch (error: any) {
      console.error('Error deleting service:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete service')
    }
  },

  /**
   * Toggle service status (activate/deactivate)
   * @param serviceId - Service ID
   * @param status - New status ('active' | 'inactive')
   * @returns Promise<ProviderService>
   */
  toggleServiceStatus: async (serviceId: number, status: 'active' | 'inactive'): Promise<ProviderService> => {
    try {
      const response = await api.patch(`/services/${serviceId}/`, { status })
      return response.data
    } catch (error: any) {
      console.error('Error toggling service status:', error)
      throw new Error(error.response?.data?.message || 'Failed to update service status')
    }
  },

  /**
   * Upload service image
   * @param serviceId - Service ID
   * @param imageFile - Image file
   * @param isFeatured - Whether this is a featured image
   * @returns Promise<ServiceImage>
   */
  uploadServiceImage: async (serviceId: number, imageFile: File, isFeatured: boolean = false): Promise<ServiceImage> => {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('is_featured', isFeatured.toString())
      
      const response = await api.post(`/services/${serviceId}/add_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error uploading service image:', error)
      throw new Error(error.response?.data?.message || 'Failed to upload service image')
    }
  },

  /**
   * Get service categories for dropdown
   * @returns Promise<ServiceCategory[]>
   */
  getServiceCategories: async (): Promise<ServiceCategory[]> => {
    try {
      const response = await api.get('/services/categories/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching service categories:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch service categories')
    }
  },

  /**
   * Get available cities for service areas
   * @returns Promise<City[]>
   */
  getAvailableCities: async (): Promise<City[]> => {
    try {
      const response = await api.get('/services/cities/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching cities:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch cities')
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
      const response = await api.get('/bookings/provider-dashboard/earnings/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider earnings:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider earnings')
    }
  },

  /**
   * Get detailed earnings analytics with breakdown
   * @param period - Time period for analytics
   * @param breakdown - Breakdown type (daily, weekly, monthly)
   * @returns Promise<any>
   */
  getDetailedEarningsAnalytics: async (
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    breakdown: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_bookings/earnings_analytics/', {
        params: { period, breakdown }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching detailed earnings analytics:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch detailed earnings analytics')
    }
  },

  /**
   * Export earnings report
   * @param format - Export format (csv, pdf)
   * @param period - Time period for the report
   * @returns Promise<Blob>
   */
  exportEarningsReport: async (format: 'csv' | 'pdf', period?: string): Promise<Blob> => {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      if (period) params.append('period', period)

      const response = await api.get(`/bookings/provider-dashboard/export_earnings/?${params.toString()}`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      console.error('Error exporting earnings report:', error)
      throw new Error(error.response?.data?.message || 'Failed to export earnings report')
    }
  },

  /**
   * Get payout history
   * @returns Promise<any[]>
   */
  getPayoutHistory: async (): Promise<any[]> => {
    try {
      const response = await api.get('/payments/provider_payouts/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching payout history:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch payout history')
    }
  },

  /**
   * Request payout
   * @param amount - Amount to request for payout
   * @param method - Payout method (bank, mobile_wallet, etc.)
   * @returns Promise<any>
   */
  requestPayout: async (amount: number, method: string): Promise<any> => {
    try {
      const response = await api.post('/payments/request_payout/', {
        amount,
        method
      })
      return response.data
    } catch (error: any) {
      console.error('Error requesting payout:', error)
      throw new Error(error.response?.data?.message || 'Failed to request payout')
    }
  },

  /**
   * Get grouped bookings using the new provider bookings management API
   * @param filters - Optional filters for bookings
   * @returns Promise<any>
   **/
  getGroupedBookings: async (filters?: {
    limit?: number
    date_from?: string
    date_to?: string
    customer_search?: string
  }): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_bookings/grouped_bookings/', {
        params: filters
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching grouped bookings:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch grouped bookings')
    }
  },

  /**
   * Update booking status
   * @param bookingId - Booking ID
   * @param status - New status
   * @param notes - Optional provider notes
   * @param rejectionReason - Required if status is rejected
   * @returns Promise<any>
   */
  updateBookingStatus: async (
    bookingId: number,
    status: string,
    notes?: string,
    rejectionReason?: string
  ): Promise<any> => {
    try {
      const response = await api.post(`/bookings/provider_bookings/${bookingId}/update_status/`, {
        status,
        notes,
        rejection_reason: rejectionReason
      })
      return response.data
    } catch (error: any) {
      console.error('Error updating booking status:', error)
      throw new Error(error.response?.data?.message || 'Failed to update booking status')
    }
  },

  /**
   * Mark service as delivered
   * @param bookingId - Booking ID
   * @param deliveryNotes - Optional delivery notes
   * @param completionPhotos - Optional completion photos
   * @returns Promise<any>
   */
  markServiceDelivered: async (
    bookingId: number,
    deliveryNotes?: string,
    completionPhotos?: string[]
  ): Promise<any> => {
    try {
      const response = await api.post(`/bookings/provider_bookings/${bookingId}/mark_delivered/`, {
        delivery_notes: deliveryNotes,
        completion_photos: completionPhotos || []
      })
      return response.data
    } catch (error: any) {
      console.error('Error marking service as delivered:', error)
      throw new Error(error.response?.data?.message || 'Failed to mark service as delivered')
    }
  },

  /**
   * Get booking filters
   * @returns Promise<any>
   */
  getBookingFilters: async (): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_bookings/booking_filters/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching booking filters:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch booking filters')
    }
  },

  /**
   * Get service delivery status for a booking
   * @param bookingId - Booking ID
   * @returns Promise<any>
   */
  getServiceDeliveryStatus: async (bookingId: number): Promise<any> => {
    try {
      const response = await api.get(`/bookings/bookings/${bookingId}/service_delivery_status/`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching service delivery status:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch service delivery status')
    }
  },

  /**
   * Process cash payment for a booking
   * @param bookingId - Booking ID
   * @param amountCollected - Amount collected from customer
   * @param collectionNotes - Optional notes about the collection
   * @returns Promise<any>
   */
  processCashPayment: async (
    bookingId: number,
    amountCollected: number,
    collectionNotes?: string
  ): Promise<any> => {
    try {
      const response = await api.post(`/bookings/bookings/${bookingId}/process_cash_payment/`, {
        amount_collected: amountCollected,
        collection_notes: collectionNotes
      })
      return response.data
    } catch (error: any) {
      console.error('Error processing cash payment:', error)
      throw new Error(error.response?.data?.message || 'Failed to process cash payment')
    }
  }
}

export default providerApi