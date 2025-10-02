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
import type {
  PortfolioProject,
  PortfolioMedia,
  PortfolioStats,
  PortfolioReview,
  CreatePortfolioProjectData,
  UpdatePortfolioProjectData,
  PortfolioFilters,
  Achievement
} from '@/types/portfolio'

interface ActivityTimelineItem {
  id: string
  type: 'booking' | 'review' | 'payment' | 'service' | 'profile'
  title: string
  description: string
  timestamp: string
  status: string
  icon: string
  metadata?: {
    amount?: number
    service?: string
    rating?: number
    customer?: string
  }
}

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
      const response = await api.get('/bookings/provider_bookings/')
      
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
          booking_slot_details: booking.booking_slot_details || null,
          cancellation_reason: booking.cancellation_reason || '',
          rejection_reason: booking.rejection_reason || ''
        }
      }
      
      // The backend now returns grouped bookings directly
      const backendData = response.data;
      
      // If backend returns grouped format, use it directly
      if (backendData.pending && backendData.upcoming && backendData.completed) {
        // Transform each group
        const transformGroup = (bookings: any[]): ProviderBooking[] => {
          return bookings.map(booking => transformBooking(booking));
        };
        
        // Separate cancelled and rejected bookings
        let cancelledBookings: ProviderBooking[] = [];
        let rejectedBookings: ProviderBooking[] = [];
        
        // If backend provides separate cancelled and rejected, use them
        if (backendData.cancelled && backendData.rejected) {
          cancelledBookings = transformGroup(backendData.cancelled);
          rejectedBookings = transformGroup(backendData.rejected);
        } else {
          // Otherwise, separate them from the cancelled array
          const allCancelled = transformGroup(backendData.cancelled || []);
          cancelledBookings = allCancelled.filter(booking => booking.status === 'cancelled' || booking.status === 'canceled');
          rejectedBookings = allCancelled.filter(booking => booking.status === 'rejected');
        }
        
        return {
          upcoming: transformGroup(backendData.upcoming),
          pending: transformGroup(backendData.pending),
          completed: transformGroup(backendData.completed),
          cancelled: cancelledBookings,
          rejected: rejectedBookings,
          count: (backendData.total_counts?.pending || 0) + 
                 (backendData.total_counts?.upcoming || 0) + 
                 (backendData.total_counts?.completed || 0) +
                 (backendData.total_counts?.cancelled || 0),
          next: null,
          previous: null
        };
      }
      
      // Fallback to old format if needed
      const upcoming: ProviderBooking[] = []
      const pending: ProviderBooking[] = []
      const completed: ProviderBooking[] = []
      const cancelled: ProviderBooking[] = [] // Add cancelled bookings array
      const rejected: ProviderBooking[] = [] // Add rejected bookings array
      
      const allBookings = response.data.results || response.data || []
      
      // Check if allBookings is actually an array before using forEach
      if (Array.isArray(allBookings)) {
        allBookings.forEach((booking: any) => {
          const transformedBooking = transformBooking(booking)
          switch (transformedBooking.status) {
            case 'pending':
            case 'confirmed':
              pending.push(transformedBooking)
              break
            case 'service_delivered':
            case 'awaiting_confirmation':
              upcoming.push(transformedBooking)
              break
            case 'completed':
              completed.push(transformedBooking)
              break
            case 'cancelled':
            case 'canceled':
              cancelled.push(transformedBooking)
              break
            case 'rejected':
              rejected.push(transformedBooking)
              break
            default:
              pending.push(transformedBooking)
          }
        })
      }
      
      return {
        upcoming,
        pending,
        completed,
        cancelled, // Add cancelled bookings
        rejected, // Add rejected bookings
        count: Array.isArray(allBookings) ? allBookings.length : 0,
        next: null,
        previous: null
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
      const response = await api.get('/bookings/provider_dashboard/statistics/')
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
      const response = await api.get('/bookings/provider_dashboard/recent_bookings/', {
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
      const response = await api.get('/bookings/provider_dashboard/earnings_analytics/', {
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
      const response = await api.get('/bookings/provider_dashboard/service_performance/')
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
      const response = await api.get('/bookings/provider_analytics/cached_statistics/')
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
      const response = await api.post('/bookings/provider_analytics/refresh_cache/')
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
        image: service.image, // This is the virtual field from backend
        images: service.images || [], // Ensure this is always an array
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
      
      // Ensure the response has the expected structure
      const imageData = response.data
      return {
        id: imageData.id,
        image: imageData.image,
        caption: imageData.caption || '',
        alt_text: imageData.alt_text || '',
        is_featured: imageData.is_featured || false,
        order: imageData.order || 0
      }
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
      // Fetch all categories without pagination
      const response = await api.get('/services/categories/?page_size=100')
      // Handle paginated response - extract results array
      if (response.data && response.data.results) {
        return response.data.results
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : []
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
      // Handle paginated response - extract results array
      if (response.data && response.data.results) {
        return response.data.results
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : []
    } catch (error: any) {
      console.error('Error fetching cities:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch cities')
    }
  },

  /**
   * Create a new service category
   * @param categoryData - Category data
   * @returns Promise<ServiceCategory>
   */
  createServiceCategory: async (categoryData: {
    title: string
    description?: string
    icon?: string
  }): Promise<ServiceCategory> => {
    try {
      console.log('Creating category with data:', categoryData)
      const response = await api.post('/services/categories/', categoryData)
      console.log('Category creation response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error creating service category:', error)
      console.error('Error response:', error.response?.data)
      
      // Extract more specific error messages
      let errorMessage = 'Failed to create service category'
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.title) {
          errorMessage = `Title: ${error.response.data.title.join(', ')}`
        } else if (error.response.data.slug) {
          errorMessage = `Slug: ${error.response.data.slug.join(', ')}`
        } else {
          errorMessage = JSON.stringify(error.response.data)
        }
      }
      
      throw new Error(errorMessage)
    }
  },

  /**
   * Get provider reviews with optional pagination and filters
   * @param params Optional: page, page_size, rating, ordering
   */
  getProviderReviews: async (params?: {
    page?: number
    page_size?: number
    rating?: number
    ordering?: 'created_at' | '-created_at' | 'rating' | '-rating'
  }): Promise<any> => {
    try {
      const response = await api.get('/reviews/provider_reviews/', { params })
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
      const response = await api.get('/bookings/provider_dashboard/earnings/')
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
      // Map 'quarter' to 'month' since backend supports week|month|year
      const mappedPeriod: 'week' | 'month' | 'year' = period === 'quarter' ? 'month' : period
      const response = await api.get('/bookings/provider_dashboard/earnings_analytics/', {
        params: { period: mappedPeriod }
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
      const mapped = period === 'quarter' ? 'month' : (period || 'month')
      if (mapped) params.append('period', mapped)

      console.log(`[Export] Attempting to export ${format} for period ${mapped}`)

      // Try primary endpoint: provider_earnings/export/
      try {
        console.log(`[Export] Trying primary endpoint: /bookings/provider_earnings/export/`)
        const response = await api.get(`/bookings/provider_earnings/export/?${params.toString()}`, {
          responseType: 'blob'
        })
        console.log(`[Export] Primary endpoint success: ${response.status}`)
        return response.data
      } catch (primaryError: any) {
        const status = primaryError?.response?.status
        console.log(`[Export] Primary endpoint failed with status: ${status}`)
        console.log(`[Export] Primary error:`, primaryError.response?.data)
        
        const isNotFound = status === 404
        if (!isNotFound) throw primaryError
        
        // Fallback to provider_dashboard/export_earnings/
        console.log(`[Export] Trying fallback endpoint: /bookings/provider_dashboard/export_earnings/`)
        const fallbackResponse = await api.get(`/bookings/provider_dashboard/export_earnings/?${params.toString()}`, {
          responseType: 'blob'
        })
        console.log(`[Export] Fallback endpoint success: ${fallbackResponse.status}`)
        return fallbackResponse.data
      }
    } catch (error: any) {
      console.error('Error exporting earnings report:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      // LAST-RESORT FALLBACK: for CSV only, generate client-side CSV from analytics
      const status = error?.response?.status
      if (status === 404 && (format === 'csv' || format === 'pdf')) {
        try {
          console.log(`[Export] Server export not available (404). Generating ${format.toUpperCase()} client-side...`)
          // Re-use analytics endpoint directly to compose data (avoid self-reference)
          const analyticsPeriod: 'week' | 'month' | 'year' = period === 'quarter' ? 'month' : ((period as any) || 'month')
          const analyticsResp = await api.get('/bookings/provider_dashboard/earnings_analytics/', {
            params: { period: analyticsPeriod }
          })
          const analytics = analyticsResp.data
          const data = (analytics?.earnings_data || []) as Array<{ period: string; earnings: number; bookings_count: number }>

          if (format === 'csv') {
            const rows: string[] = []
            const header = ['Period', 'Earnings', 'Bookings Count']
            rows.push(header.join(','))
            for (const item of data) {
              const row = [
                JSON.stringify(item.period ?? ''),
                (item.earnings ?? 0).toString(),
                (item.bookings_count ?? 0).toString(),
              ]
              rows.push(row.join(','))
            }
            const csv = rows.join('\n')
            return new Blob([csv], { type: 'text/csv;charset=utf-8' })
          } else {
            // PDF fallback via jsPDF (added as an optional dependency). If unavailable, throw.
            try {
              // Dynamically import to avoid SSR issues
              const jsPdfModule: any = await import('jspdf')
              const jsPDF = jsPdfModule.jsPDF || jsPdfModule.default || jsPdfModule
              const doc = new jsPDF({ unit: 'pt', format: 'a4' })
              const left = 40
              let top = 50
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(16)
              doc.text(`Earnings Report (${analyticsPeriod})`, left, top)
              top += 20
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(10)
              // Table header
              doc.text('Period', left, top)
              doc.text('Earnings', left + 220, top)
              doc.text('Bookings', left + 320, top)
              top += 12
              doc.setLineWidth(0.5)
              doc.line(left, top, left + 380, top)
              top += 12
              // Rows
              for (const item of data) {
                if (top > 770) {
                  doc.addPage()
                  top = 50
                }
                doc.text(String(item.period ?? ''), left, top)
                doc.text(String(item.earnings ?? 0), left + 220, top)
                doc.text(String(item.bookings_count ?? 0), left + 320, top)
                top += 14
              }
              const blob = doc.output('blob') as Blob
              return blob
            } catch (pdfErr) {
              console.error('[Export] jsPDF not available or failed to generate PDF:', pdfErr)
              throw new Error('PDF export not available in this environment')
            }
          }
        } catch (fallbackErr) {
          console.error('[Export] Client-side CSV fallback failed:', fallbackErr)
          throw new Error('Failed to export earnings report')
        }
      }
      throw new Error(error?.response?.data?.message || 'Failed to export earnings report')
    }
  },

  /**
   * Get payout history
   * @returns Promise<any[]>
   */
  getPayoutHistory: async (): Promise<any[]> => {
    try {
      const response = await api.get('/bookings/provider_earnings/payout_summary/')
      // The backend returns recent_payouts in the response data
      return response.data.recent_payouts || []
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
   * Get enhanced provider earnings overview
   * @param period - Time period for analytics
   * @returns Promise<any>
   */
  getProviderEarningsOverview: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_earnings/earnings_overview/', {
        params: { period }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider earnings overview:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider earnings overview')
    }
  },

  /**
   * Get detailed earnings history
   * @param params - Pagination and filter parameters
   * @returns Promise<any>
   */
  getProviderEarningsHistory: async (params?: {
    page?: number
    page_size?: number
    date_from?: string
    date_to?: string
    service_id?: number
  }): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_earnings/earnings_history/', {
        params
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider earnings history:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider earnings history')
    }
  },

  /**
   * Get payout summary
   * @returns Promise<any>
   */
  getProviderPayoutSummary: async (): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_earnings/payout_summary/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider payout summary:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider payout summary')
    }
  },

  /**
   * Request a payout
   * @param amount - Amount to request
   * @param payout_method - Payment method for payout
   * @param account_details - Account details for payout
   * @returns Promise<any>
   */
  requestProviderPayout: async (amount: number, payout_method: string, account_details: any): Promise<any> => {
    try {
      const response = await api.post('/bookings/provider_earnings/request_payout/', {
        amount,
        payout_method,
        account_details
      })
      return response.data
    } catch (error: any) {
      console.error('Error requesting provider payout:', error)
      throw new Error(error.response?.data?.message || 'Failed to request provider payout')
    }
  },

  /**
   * Get financial analytics
   * @param params - Analytics parameters
   * @returns Promise<any>
   */
  getProviderFinancialAnalytics: async (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year'
    months_back?: number
  }): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_earnings/financial_analytics/', {
        params
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider financial analytics:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider financial analytics')
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
   * Upload delivery photos for a booking
   * @param bookingId - Booking ID
   * @param photos - Array of photo files
   * @returns Promise<any>
   */
  uploadDeliveryPhotos: async (bookingId: number, photos: File[]): Promise<any> => {
    try {
      const formData = new FormData()
      photos.forEach(photo => {
        formData.append('photos', photo)
      })
      
      const response = await api.post(`/bookings/provider_bookings/${bookingId}/upload_delivery_photos/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error uploading delivery photos:', error)
      throw new Error(error.response?.data?.message || 'Failed to upload delivery photos')
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
  },

  /**
   * Get provider activity timeline
   * @returns Promise<ActivityTimelineItem[]>
   */
  getActivityTimeline: async (): Promise<ActivityTimelineItem[]> => {
    try {
      const response = await api.get('/bookings/provider_dashboard/activity_timeline/')
      return response.data.timeline || []
    } catch (error: any) {
      console.error('Error fetching activity timeline:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch activity timeline')
    }
  },

  // ===== CUSTOMER MANAGEMENT API METHODS =====

  /**
   * Get provider's customer list and relationship data
   * @param params - Optional search and filter parameters
   * @returns Promise<any>
   */
  getProviderCustomers: async (params?: {
    search?: string
    status?: string
    ordering?: string
    page?: number
    page_size?: number
  }): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_dashboard/customers/', { params })
      return response.data
    } catch (error: any) {
      console.error('Error fetching provider customers:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch provider customers')
    }
  },

  /**
   * Get customer statistics for provider dashboard
   * @returns Promise<any>
   */
  getCustomerStats: async (): Promise<any> => {
    try {
      const response = await api.get('/bookings/provider_dashboard/customer_stats/')
      return response.data
    } catch (error: any) {
      console.error('Error fetching customer stats:', error)
      // Return fallback stats if API fails
      return {
        total_customers: 0,
        regular_customers: 0,
        new_customers_this_month: 0,
        active_chats: 0,
        average_rating: 0,
        retention_rate: 0
      }
    }
  },

  /**
   * Get recent customer activity
   * @param limit - Number of activities to fetch
   * @returns Promise<any[]>
   */
  getRecentCustomerActivity: async (limit: number = 10): Promise<any[]> => {
    try {
      const response = await api.get('/bookings/provider_dashboard/recent_customer_activity/', {
        params: { limit }
      })
      return response.data.activities || []
    } catch (error: any) {
      console.error('Error fetching recent customer activity:', error)
      // Return empty array if API fails
      return []
    }
  },

  /**
   * Update customer relationship data
   * @param relationId - Customer relation ID
   * @param data - Data to update
   * @returns Promise<any>
   */
  updateCustomerRelation: async (relationId: number, data: {
    is_favorite_customer?: boolean
    is_blocked?: boolean
    notes?: string
  }): Promise<any> => {
    try {
      const response = await api.patch(`/bookings/provider_dashboard/${relationId}/update_customer_relation/`, data)
      return response.data
    } catch (error: any) {
      console.error('Error updating customer relation:', error)
      throw new Error(error.response?.data?.message || 'Failed to update customer relation')
    }
  },

  /**
   * Export customer data
   * @param format - Export format (csv, pdf)
   * @returns Promise<Blob>
   */
  exportCustomerData: async (format: 'csv' | 'pdf' = 'csv'): Promise<Blob> => {
    try {
      const response = await api.get('/bookings/provider_dashboard/export_customers/', {
        params: { format },
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      console.error('Error exporting customer data:', error)
      throw new Error(error.response?.data?.message || 'Failed to export customer data')
    }
  },

  /**
   * Get customer analytics for provider
   * @param customerId - Optional specific customer ID
   * @returns Promise<any>
   */
  getCustomerAnalytics: async (customerId?: number): Promise<any> => {
    try {
      const params = customerId ? { customer_id: customerId } : {}
      const response = await api.get('/bookings/provider_analytics/customer_analytics/', { params })
      return response.data
    } catch (error: any) {
      console.error('Error fetching customer analytics:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch customer analytics')
    }
  },

  /**
   * Get customer booking history
   * @param customerId - Customer ID
   * @param params - Optional pagination and filter parameters
   * @returns Promise<any>
   */
  getCustomerBookingHistory: async (customerId: number, params?: {
    page?: number
    page_size?: number
    status?: string
    date_from?: string
    date_to?: string
  }): Promise<any> => {
    try {
      const response = await api.get(`/bookings/provider_dashboard/customers/${customerId}/bookings/`, { params })
      return response.data
    } catch (error: any) {
      console.error('Error fetching customer booking history:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch customer booking history')
    }
  },

  /**
   * Send message to customer
   * @param customerId - Customer ID
   * @param message - Message content
   * @param subject - Optional message subject
   * @returns Promise<any>
   */
  sendCustomerMessage: async (customerId: number, message: string, subject?: string): Promise<any> => {
    try {
      const response = await api.post(`/bookings/provider_dashboard/customers/${customerId}/send_message/`, {
        message,
        subject
      })
      return response.data
    } catch (error: any) {
      console.error('Error sending customer message:', error)
      throw new Error(error.response?.data?.message || 'Failed to send message to customer')
    }
  },

  /**
   * Get customer communication history
   * @param customerId - Customer ID
   * @returns Promise<any[]>
   */
  getCustomerCommunicationHistory: async (customerId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/bookings/provider_dashboard/customers/${customerId}/communications/`)
      return response.data.communications || []
    } catch (error: any) {
      console.error('Error fetching customer communication history:', error)
      return []
    }
  },

  /**
   * Block or unblock a customer
   * @param relationId - Customer relation ID (not customer ID)
   * @param blocked - Whether to block or unblock
   * @param reason - Optional reason for blocking
   * @returns Promise<any>
   */
  toggleCustomerBlock: async (relationId: number, blocked: boolean, reason?: string): Promise<any> => {
    try {
      const response = await api.patch(`/bookings/provider_dashboard/${relationId}/update_customer_relation/`, {
        is_blocked: blocked,
        notes: reason
      })
      return response.data
    } catch (error: any) {
      console.error('Error toggling customer block status:', error)
      throw new Error(error.response?.data?.message || 'Failed to update customer block status')
    }
  },

  /**
   * Add or remove customer from favorites
   * @param relationId - Customer relation ID (not customer ID)
   * @param favorite - Whether to add or remove from favorites
   * @returns Promise<any>
   */
  toggleCustomerFavorite: async (relationId: number, favorite: boolean): Promise<any> => {
    try {
      const response = await api.patch(`/bookings/provider_dashboard/${relationId}/update_customer_relation/`, {
        is_favorite_customer: favorite
      })
      return response.data
    } catch (error: any) {
      console.error('Error toggling customer favorite status:', error)
      throw new Error(error.response?.data?.message || 'Failed to update customer favorite status')
    }
  },

  // ===== PORTFOLIO MANAGEMENT API METHODS =====

  /**
   * Get portfolio projects for the current provider
   * @param filters - Optional filters for portfolio projects
   * @returns Promise<PortfolioProject[]>
   */
  getPortfolioProjects: async (filters?: PortfolioFilters): Promise<PortfolioProject[]> => {
    try {
      const response = await api.get('/auth/users/portfolio-projects/', { params: filters })
      return response.data
    } catch (error: any) {
      console.error('Error fetching portfolio projects:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch portfolio projects')
    }
  },

  /**
   * Create new portfolio project with multiple files
   * @param projectData - Portfolio project data including files
   * @returns Promise<PortfolioProject>
   */
  createPortfolioProject: async (projectData: CreatePortfolioProjectData): Promise<PortfolioProject> => {
    try {
      const formData = new FormData()
      
      // Add files
      projectData.files.forEach(file => {
        formData.append('files', file)
      })
      
      // Add project data
      formData.append('title', projectData.title)
      if (projectData.description) {
        formData.append('description', projectData.description)
      }

      const response = await api.post('/auth/users/portfolio-projects/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data.data
    } catch (error: any) {
      console.error('Error creating portfolio project:', error)
      throw new Error(error.response?.data?.message || 'Failed to create portfolio project')
    }
  },

  /**
   * Get specific portfolio project
   * @param projectId - Portfolio project ID
   * @returns Promise<PortfolioProject>
   */
  getPortfolioProject: async (projectId: number): Promise<PortfolioProject> => {
    try {
      const response = await api.get(`/auth/users/portfolio-projects/${projectId}/`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching portfolio project:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch portfolio project')
    }
  },

  /**
   * Update portfolio project
   * @param projectId - Portfolio project ID
   * @param updateData - Data to update
   * @returns Promise<PortfolioProject>
   */
  updatePortfolioProject: async (projectId: number, updateData: UpdatePortfolioProjectData): Promise<PortfolioProject> => {
    try {
      const formData = new FormData()
      
      // Add text fields
      if (updateData.title) {
        formData.append('title', updateData.title)
      }
      if (updateData.description) {
        formData.append('description', updateData.description)
      }
      if (updateData.order !== undefined) {
        formData.append('order', updateData.order.toString())
      }
      if (updateData.featured_media_id !== undefined) {
        formData.append('featured_media_id', updateData.featured_media_id.toString())
      }
      
      // Add new files if provided
      if (updateData.files && updateData.files.length > 0) {
        updateData.files.forEach(file => {
          formData.append('files', file)
        })
      }
      
      // Add media IDs to remove
      if (updateData.remove_media_ids && updateData.remove_media_ids.length > 0) {
        updateData.remove_media_ids.forEach(id => {
          formData.append('remove_media_ids', id.toString())
        })
      }
      
      // Add media order updates
      if (updateData.media_orders) {
        formData.append('media_orders', JSON.stringify(updateData.media_orders))
      }

      const response = await api.patch(`/auth/users/portfolio-projects/${projectId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error updating portfolio project:', error)
      throw new Error(error.response?.data?.message || 'Failed to update portfolio project')
    }
  },

  /**
   * Delete portfolio project
   * @param projectId - Portfolio project ID
   * @returns Promise<void>
   */
  deletePortfolioProject: async (projectId: number): Promise<void> => {
    try {
      await api.delete(`/auth/users/portfolio-projects/${projectId}/`)
    } catch (error: any) {
      console.error('Error deleting portfolio project:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete portfolio project')
    }
  },

  /**
   * Delete specific portfolio media file
   * @param mediaId - Portfolio media ID
   * @returns Promise<void>
   */
  deletePortfolioMedia: async (mediaId: number): Promise<void> => {
    try {
      await api.delete(`/auth/users/portfolio-media/${mediaId}/`)
    } catch (error: any) {
      console.error('Error deleting portfolio media:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete portfolio media')
    }
  },

  // Legacy methods for backward compatibility
  /**
   * @deprecated Use getPortfolioProjects instead
   */
  getPortfolioMedia: async (filters?: PortfolioFilters): Promise<PortfolioProject[]> => {
    return providerApi.getPortfolioProjects(filters)
  },

  /**
   * @deprecated Use createPortfolioProject instead
   */
  uploadPortfolioMedia: async (mediaData: any): Promise<PortfolioProject> => {
    return providerApi.createPortfolioProject({
      title: mediaData.title || 'New Project',
      description: mediaData.description,
      files: [mediaData.file]
    })
  },

  /**
   * @deprecated Use updatePortfolioProject instead
   */
  updatePortfolioMedia: async (mediaId: number, updateData: any): Promise<PortfolioProject> => {
    // This is a simplified mapping - in practice you'd need the project ID
    throw new Error('updatePortfolioMedia is deprecated. Use updatePortfolioProject instead.')
  },

  /**
   * Get portfolio statistics
   * @returns Promise<PortfolioStats>
   */
  getPortfolioStats: async (): Promise<PortfolioStats> => {
    try {
      // Combine data from multiple endpoints to build portfolio stats
      const [dashboardStats, portfolioMedia, services, reviews] = await Promise.allSettled([
        providerApi.getDashboardStats(),
        providerApi.getPortfolioMedia(),
        providerApi.getProviderServices(),
        providerApi.getProviderReviews({ page_size: 1 })
      ])

      const stats: PortfolioStats = {
        total_projects: 0,
        average_rating: 0,
        total_reviews: 0,
        achievements_count: 0,
        total_services: 0,
        featured_projects: 0
      }

      // Extract data from successful responses
      if (dashboardStats.status === 'fulfilled') {
        stats.average_rating = dashboardStats.value.ratings?.average_rating || 0
        stats.total_reviews = dashboardStats.value.ratings?.total_reviews || 0
        stats.total_services = dashboardStats.value.services?.total || 0
      }

      if (portfolioMedia.status === 'fulfilled') {
        stats.total_projects = portfolioMedia.value.length
        stats.featured_projects = portfolioMedia.value.filter((project: PortfolioProject) => 
          project.title?.toLowerCase().includes('featured') || 
          project.description?.toLowerCase().includes('featured')
        ).length
      }

      if (services.status === 'fulfilled') {
        stats.total_services = services.value.length
      }

      if (reviews.status === 'fulfilled') {
        stats.total_reviews = reviews.value.count || 0
      }

      // Calculate achievements based on stats
      let achievementsCount = 0
      if (stats.average_rating >= 4.5) achievementsCount++
      if (stats.total_reviews >= 50) achievementsCount++
      if (stats.total_services >= 5) achievementsCount++
      if (stats.total_projects >= 10) achievementsCount++
      
      stats.achievements_count = achievementsCount

      return stats
    } catch (error: any) {
      console.error('Error fetching portfolio stats:', error)
      // Return default stats if there's an error
      return {
        total_projects: 0,
        average_rating: 0,
        total_reviews: 0,
        achievements_count: 0,
        total_services: 0,
        featured_projects: 0
      }
    }
  },

  /**
   * Get provider achievements
   * @returns Promise<Achievement[]>
   */
  getProviderAchievements: async (): Promise<Achievement[]> => {
    try {
      const [stats, services, reviews] = await Promise.allSettled([
        providerApi.getDashboardStats(),
        providerApi.getProviderServices(),
        providerApi.getProviderReviews({ page_size: 1 })
      ])

      const achievements: Achievement[] = []

      // Extract data from successful responses
      let avgRating = 0
      let totalReviews = 0
      let totalServices = 0
      let totalBookings = 0

      if (stats.status === 'fulfilled') {
        avgRating = stats.value.ratings?.average_rating || 0
        totalReviews = stats.value.ratings?.total_reviews || 0
        totalBookings = stats.value.bookings?.total || 0
      }

      if (services.status === 'fulfilled') {
        totalServices = services.value.length
      }

      if (reviews.status === 'fulfilled') {
        totalReviews = reviews.value.count || totalReviews
      }

      // Generate achievements based on performance
      if (avgRating >= 4.8) {
        achievements.push({
          id: 'top_rated',
          title: 'Top Rated Provider',
          description: `Maintained ${avgRating.toFixed(1)}+ rating`,
          icon: 'Star',
          earned_date: new Date().toISOString(),
          category: 'rating'
        })
      }

      if (totalReviews >= 100) {
        achievements.push({
          id: 'review_milestone',
          title: '100+ Happy Customers',
          description: 'Received over 100 customer reviews',
          icon: 'ThumbsUp',
          earned_date: new Date().toISOString(),
          category: 'volume'
        })
      }

      if (totalServices >= 5) {
        achievements.push({
          id: 'service_variety',
          title: 'Service Specialist',
          description: `Offering ${totalServices} different services`,
          icon: 'Award',
          earned_date: new Date().toISOString(),
          category: 'milestone'
        })
      }

      if (totalBookings >= 50) {
        achievements.push({
          id: 'booking_milestone',
          title: 'Experienced Provider',
          description: `Completed ${totalBookings}+ bookings`,
          icon: 'Calendar',
          earned_date: new Date().toISOString(),
          category: 'volume'
        })
      }

      return achievements
    } catch (error: any) {
      console.error('Error fetching provider achievements:', error)
      return []
    }
  },

  /**
   * Get portfolio reviews (formatted for portfolio display)
   * @param params - Optional pagination and filter parameters
   * @returns Promise<PortfolioReview[]>
   */
  getPortfolioReviews: async (params?: {
    page?: number
    page_size?: number
    rating?: number
    ordering?: 'created_at' | '-created_at' | 'rating' | '-rating'
  }): Promise<{ results: PortfolioReview[], count: number, next?: string, previous?: string }> => {
    try {
      const response = await api.get('/reviews/provider_reviews/', { params })
      
      // Transform reviews for portfolio display
      const portfolioReviews: PortfolioReview[] = response.data.results?.map((review: any) => ({
        id: review.id,
        customer: {
          id: review.customer?.id || 0,
          first_name: review.customer?.first_name || 'Anonymous',
          last_name: review.customer?.last_name || 'Customer',
          profile_picture: review.customer?.profile_picture
        },
        service_title: review.service_title || review.booking?.service?.title || 'Service',
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        provider_response: review.provider_response,
        provider_response_created_at: review.provider_response_created_at,
        images: review.images || []
      })) || []

      return {
        results: portfolioReviews,
        count: response.data.count || 0,
        next: response.data.next,
        previous: response.data.previous
      }
    } catch (error: any) {
      console.error('Error fetching portfolio reviews:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch portfolio reviews')
    }
  },

  /**
   * Reorder portfolio media
   * @param mediaIds - Array of media IDs in desired order
   * @returns Promise<PortfolioMedia[]>
   */
  reorderPortfolioMedia: async (mediaIds: number[]): Promise<PortfolioMedia[]> => {
    try {
      // Since updatePortfolioMedia is deprecated, we'll need to implement a different approach
      // For now, we'll return an empty array to avoid type errors
      console.warn('reorderPortfolioMedia is not implemented due to deprecated updatePortfolioMedia')
      return []
    } catch (error: any) {
      console.error('Error reordering portfolio media:', error)
      throw new Error(error.response?.data?.message || 'Failed to reorder portfolio media')
    }
  }
}

export default providerApi