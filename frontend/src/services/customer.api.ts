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
  service: string  // This will now be the service name instead of ID
  provider: string  // This will now be the provider name instead of ID
  provider_id?: number  // Added provider ID for linking to provider profile
  image: string
  date: string
  time: string
  location: string
  price: number
  status: string
  rating?: number
  // Additional fields for better information
  phone?: string
  city?: string
  customer_name?: string
  provider_name?: string
  service_category?: string
  booking_slot?: string
  special_instructions?: string
  total_amount?: number
  // Reschedule and cancellation fields
  reschedule_reason?: string
  reschedule_history?: Array<{
    reason: string
    timestamp: string
    old_date: string
    old_time: string
    new_date: string
    new_time: string
    price_change: number
  }>
  cancellation_reason?: string
  updated_at?: string
  booking_slot_details?: {
    id: number
    start_time: string
    end_time: string
    slot_type: string
  }
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

export interface PaginatedBookingGroups {
  upcoming: CustomerBooking[]
  completed: CustomerBooking[]
  cancelled: CustomerBooking[]
  count: number
  next: string | null
  previous: string | null
}

export interface PaginationParams {
  page?: number
  page_size?: number
}

/**
 * Customer Service API
 * Handles all customer dashboard related operations
 */
export const customerApi = {
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
   * Get customer bookings grouped by status with pagination support
   * @param params - Pagination parameters
   * @returns Promise<PaginatedBookingGroups>
   */
  getBookings: async (params: PaginationParams = {}): Promise<PaginatedBookingGroups> => {
    try {
      // Set default page size to 10 if not specified
      const pageSize = params.page_size || 10
      const page = params.page || 1
      
      // First try the new customer_bookings endpoint
      try {
        const response = await api.get('/bookings/customer_bookings/', {
          params: { 
            format: 'grouped', 
            page: page,
            page_size: pageSize
          }
        });
        
        // Validate response data
        if (!response.data) {
          throw new Error("Empty response from customer_bookings endpoint");
        }
        
        // Handle paginated response
        if ('count' in response.data) {
          // This is a paginated response
          const validatedData = {
            upcoming: Array.isArray(response.data.results?.upcoming) ? response.data.results.upcoming : [],
            completed: Array.isArray(response.data.results?.completed) ? response.data.results.completed : [],
            cancelled: Array.isArray(response.data.results?.cancelled) ? response.data.results.cancelled : [],
            count: response.data.count || 0,
            next: response.data.next || null,
            previous: response.data.previous || null
          };
          
          // Transform bookings to ensure proper service and provider names
          const transformBooking = (booking: any): CustomerBooking => {
            // Extract service information
            let serviceTitle = 'Unknown Service';
            if (typeof booking.service === 'string') {
              serviceTitle = booking.service;
            } else if (booking.service?.title) {
              serviceTitle = booking.service.title;
            } else if (booking.service_details?.title) {
              serviceTitle = booking.service_details.title;
            } else if (booking.service_name) {
              serviceTitle = booking.service_name;
            } else if (booking.service_title) {
              serviceTitle = booking.service_title;
            }
            
            // Extract provider information
            let providerName = 'Unknown Provider';
            let providerId: number | undefined = undefined;
            if (typeof booking.provider === 'string') {
              providerName = booking.provider;
            } else if (booking.provider?.name || booking.provider?.full_name) {
              providerName = booking.provider.name || booking.provider.full_name;
              providerId = booking.provider.id;
            } else if (booking.provider_name) {
              providerName = booking.provider_name;
            } else if (booking.service_details?.provider) {
              if (typeof booking.service_details.provider === 'string') {
                providerName = booking.service_details.provider;
              } else {
                providerName = booking.service_details.provider.name || 
                              booking.service_details.provider.full_name ||
                              (booking.service_details.provider.first_name && booking.service_details.provider.last_name ? 
                                `${booking.service_details.provider.first_name} ${booking.service_details.provider.last_name}` : 
                                booking.service_details.provider.first_name) || 
                              'Unknown Provider';
                providerId = booking.service_details.provider.id;
              }
            }
            
            // If provider_id is explicitly provided, use it
            if (booking.provider_id) {
              providerId = booking.provider_id;
            }
            
            return {
              id: booking.id,
              service: serviceTitle,
              provider: providerName,
              provider_id: providerId,  // Include provider ID for linking
              image: booking.image || booking.service_image || booking.service_details?.image || '',
              date: booking.date || booking.booking_date || '',
              time: booking.time || booking.booking_time || '',
              location: booking.location || booking.address || '',
              price: booking.price || booking.total_amount || 0,
              total_amount: booking.total_amount || booking.price || 0,
              status: booking.status || 'pending',
              phone: booking.phone || '',
              city: booking.city || '',
              customer_name: booking.customer_name || 
                            booking.customer_details?.get_full_name || 
                            booking.customer_details?.first_name || 
                            '',
              provider_name: providerName,
              service_category: booking.service_category || 
                               booking.category || 
                               booking.service_details?.category?.title || '',
              booking_slot: booking.booking_slot || '',
              special_instructions: booking.special_instructions || '',

              rating: booking.rating || undefined,
              // Reschedule and cancellation fields
              reschedule_reason: booking.reschedule_reason && booking.reschedule_reason.trim() !== '' ? booking.reschedule_reason : null,
              reschedule_history: booking.reschedule_history || [],
              cancellation_reason: booking.cancellation_reason && booking.cancellation_reason.trim() !== '' ? booking.cancellation_reason : null,
              updated_at: booking.updated_at || null,
              booking_slot_details: booking.booking_slot_details || null
            }
          }
          
          // Transform all bookings
          const transformedData = {
            upcoming: validatedData.upcoming.map(transformBooking),
            completed: validatedData.completed.map(transformBooking),
            cancelled: validatedData.cancelled.map(transformBooking),
            count: validatedData.count,
            next: validatedData.next,
            previous: validatedData.previous
          };
          
          // Cache the response for offline fallback
          localStorage.setItem('customer_bookings', JSON.stringify(transformedData));
          
          return transformedData;
        } else {
          // This is a non-paginated response (backward compatibility)
          const validatedData = {
            upcoming: Array.isArray(response.data.upcoming) ? response.data.upcoming : [],
            completed: Array.isArray(response.data.completed) ? response.data.completed : [],
            cancelled: Array.isArray(response.data.cancelled) ? response.data.cancelled : [],
            count: (response.data.upcoming?.length || 0) + (response.data.completed?.length || 0) + (response.data.cancelled?.length || 0),
            next: null,
            previous: null
          };
          
          // Transform bookings to ensure proper service and provider names
          const transformBooking = (booking: any): CustomerBooking => {
            // Extract service information
            let serviceTitle = 'Unknown Service';
            if (typeof booking.service === 'string') {
              serviceTitle = booking.service;
            } else if (booking.service?.title) {
              serviceTitle = booking.service.title;
            } else if (booking.service_details?.title) {
              serviceTitle = booking.service_details.title;
            } else if (booking.service_name) {
              serviceTitle = booking.service_name;
            } else if (booking.service_title) {
              serviceTitle = booking.service_title;
            }
            
            // Extract provider information
            let providerName = 'Unknown Provider';
            let providerId: number | undefined = undefined;
            if (typeof booking.provider === 'string') {
              providerName = booking.provider;
            } else if (booking.provider?.name || booking.provider?.full_name) {
              providerName = booking.provider.name || booking.provider.full_name;
              providerId = booking.provider.id;
            } else if (booking.provider_name) {
              providerName = booking.provider_name;
            } else if (booking.service_details?.provider) {
              if (typeof booking.service_details.provider === 'string') {
                providerName = booking.service_details.provider;
              } else {
                providerName = booking.service_details.provider.name || 
                              booking.service_details.provider.full_name ||
                              (booking.service_details.provider.first_name && booking.service_details.provider.last_name ? 
                                `${booking.service_details.provider.first_name} ${booking.service_details.provider.last_name}` : 
                                booking.service_details.provider.first_name) || 
                              'Unknown Provider';
                providerId = booking.service_details.provider.id;
              }
            }
            
            // If provider_id is explicitly provided, use it
            if (booking.provider_id) {
              providerId = booking.provider_id;
            }
            
            return {
              id: booking.id,
              service: serviceTitle,
              provider: providerName,
              provider_id: providerId,  // Include provider ID for linking
              image: booking.image || booking.service_image || booking.service_details?.image || '',
              date: booking.date || booking.booking_date || '',
              time: booking.time || booking.booking_time || '',
              location: booking.location || booking.address || '',
              price: booking.price || booking.total_amount || 0,
              total_amount: booking.total_amount || booking.price || 0,
              status: booking.status || 'pending',
              phone: booking.phone || '',
              city: booking.city || '',
              customer_name: booking.customer_name || 
                            booking.customer_details?.get_full_name || 
                            booking.customer_details?.first_name || 
                            '',
              provider_name: providerName,
              service_category: booking.service_category || 
                               booking.category || 
                               booking.service_details?.category?.title || '',
              booking_slot: booking.booking_slot || '',
              special_instructions: booking.special_instructions || '',
              rating: booking.rating || undefined,
              // Reschedule and cancellation fields
              reschedule_reason: booking.reschedule_reason && booking.reschedule_reason.trim() !== '' ? booking.reschedule_reason : null,
              reschedule_history: booking.reschedule_history || [],
              cancellation_reason: booking.cancellation_reason && booking.cancellation_reason.trim() !== '' ? booking.cancellation_reason : null,
              updated_at: booking.updated_at || null,
              booking_slot_details: booking.booking_slot_details || null
            }
          }
          
          // Transform all bookings
          const transformedData = {
            upcoming: validatedData.upcoming.map(transformBooking),
            completed: validatedData.completed.map(transformBooking),
            cancelled: validatedData.cancelled.map(transformBooking),
            count: validatedData.count,
            next: null,
            previous: null
          };
          
          // Cache the response for offline fallback
          localStorage.setItem('customer_bookings', JSON.stringify(transformedData));
          
          return transformedData;
        }
      } catch (newEndpointError: any) {
        // Fallback to regular bookings endpoint with more detailed data
        // Fix: Use the correct endpoint path /bookings/bookings/ instead of /bookings/
        const response = await api.get('/bookings/bookings/', {
          params: { 
            page: page,
            page_size: pageSize
          }
        });
        
        // Handle both paginated and non-paginated responses
        let allBookings = [];
        let count = 0;
        let next = null;
        let previous = null;
        
        // Check if we received a redirect or URL object (the error case)
        if (response.data && typeof response.data === 'object' && response.data !== null) {
          // Check if it looks like a redirect URL object
          if ('url' in response.data && typeof response.data.url === 'string') {
            throw new Error("API returned redirect URL instead of booking data. Check backend configuration.");
          }
          
          // Check if we received the root API endpoints list (another error case)
          if ('bookings' in response.data && response.data.bookings && typeof response.data.bookings === 'string') {
            throw new Error("API returned root endpoints list instead of booking data. Check endpoint URL.");
          }
          
          // Handle normal data structures
          if (Array.isArray(response.data)) {
            // Direct array response
            allBookings = response.data;
            count = allBookings.length;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            // Paginated response
            allBookings = response.data.results;
            count = response.data.count || allBookings.length;
            next = response.data.next || null;
            previous = response.data.previous || null;
          } else {
            // Unexpected data format
            throw new Error("Invalid data format received from bookings endpoint");
          }
        } else {
          throw new Error("Invalid data format received from bookings endpoint");
        }
        
        // Validate that we have an array of bookings
        if (!Array.isArray(allBookings)) {
          throw new Error("Invalid data format received from bookings endpoint");
        }
        
        // Transform bookings to match CustomerBooking interface with proper service and provider names
        const transformBooking = (booking: any): CustomerBooking => {
          // Extract service information
          let serviceTitle = 'Unknown Service';
          if (typeof booking.service === 'string') {
            serviceTitle = booking.service;
          } else if (booking.service?.title) {
            serviceTitle = booking.service.title;
          } else if (booking.service_details?.title) {
            serviceTitle = booking.service_details.title;
          } else if (booking.service_name) {
            serviceTitle = booking.service_name;
          } else if (booking.service_title) {
            serviceTitle = booking.service_title;
          }
                              
          // Extract provider information - using the correct path from the backend response
          let providerName = 'Unknown Provider';
          let providerId: number | undefined = undefined;
          if (typeof booking.provider === 'string') {
            providerName = booking.provider;
          } else if (booking.provider?.name || booking.provider?.full_name) {
            providerName = booking.provider.name || booking.provider.full_name;
            providerId = booking.provider.id;
          } else if (booking.provider_name) {
            providerName = booking.provider_name;
          } else if (booking.service_details?.provider) {
            if (typeof booking.service_details.provider === 'string') {
              providerName = booking.service_details.provider;
            } else {
              providerName = booking.service_details.provider.name || 
                            booking.service_details.provider.full_name ||
                            (booking.service_details.provider.first_name && booking.service_details.provider.last_name ? 
                              `${booking.service_details.provider.first_name} ${booking.service_details.provider.last_name}` : 
                              booking.service_details.provider.first_name) || 
                            'Unknown Provider';
              providerId = booking.service_details.provider.id;
            }
          }
          
          // If provider_id is explicitly provided, use it
          if (booking.provider_id) {
            providerId = booking.provider_id;
          }
          
          return {
            id: booking.id,
            service: serviceTitle,
            provider: providerName,
            provider_id: providerId,  // Include provider ID for linking
            image: booking.image || booking.service_image || booking.service_details?.image || '',
            date: booking.booking_date || '',
            time: booking.booking_time || '',
            location: booking.address || '',
            price: booking.total_amount || booking.price || 0,
            total_amount: booking.total_amount || booking.price || 0,
            status: booking.status || 'pending',
            phone: booking.phone || '',
            city: booking.city || '',
            customer_name: booking.customer_details?.get_full_name || 
                          booking.customer_details?.first_name || 
                          '',
            provider_name: providerName,
            service_category: booking.service_details?.category?.title || '',
            booking_slot: booking.booking_slot_details ? 
              `${booking.booking_slot_details.start_time} - ${booking.booking_slot_details.end_time}` : '',
            special_instructions: booking.special_instructions || '',
            rating: booking.rating || undefined,
            // Reschedule and cancellation fields
            reschedule_reason: booking.reschedule_reason && booking.reschedule_reason.trim() !== '' ? booking.reschedule_reason : null,
            reschedule_history: booking.reschedule_history || [],
            cancellation_reason: booking.cancellation_reason && booking.cancellation_reason.trim() !== '' ? booking.cancellation_reason : null,
            updated_at: booking.updated_at || null,
            booking_slot_details: booking.booking_slot_details || null
          }
        }

        // Group bookings by status
        const upcoming = allBookings
          .filter((b: any) => ['pending', 'confirmed'].includes(b.status))
          .map(transformBooking)
        const completed = allBookings
          .filter((b: any) => b.status === 'completed')
          .map(transformBooking)
        const cancelled = allBookings
          .filter((b: any) => b.status === 'cancelled')
          .map(transformBooking)
        
        const groupedData = {
          upcoming,
          completed,
          cancelled,
          count,
          next,
          previous
        }
        
        // Cache the response for offline fallback
        localStorage.setItem('customer_bookings', JSON.stringify(groupedData))
        
        return groupedData
      }
    } catch (error: any) {
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
      const fallbackBookings: PaginatedBookingGroups = {
        upcoming: [],
        completed: [],
        cancelled: [],
        count: 0,
        next: null,
        previous: null
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
   * @param reason - Cancellation reason
   * @returns Promise<void>
   */
  cancelBooking: async (id: number, reason: string = 'No reason provided'): Promise<void> => {
    try {
      const response = await api.patch(`/bookings/bookings/${id}/cancel_booking/`, { cancellation_reason: reason });
      return response.data;
    } catch (error: any) {
      // Provide more detailed error messages based on status codes
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.detail || 'Invalid request. Please check your input.';
        throw new Error(errorMessage);
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to cancel this booking.');
      } else if (error.response?.status === 404) {
        throw new Error('Booking not found.');
      } else if (error.response?.status === 409) {
        throw new Error('Cannot cancel booking with current status.');
      } else {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to cancel booking. Please try again.';
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Get available reschedule options for a booking
   * @param id - Booking ID
   * @returns Promise<RescheduleOptions>
   */
  getRescheduleOptions: async (id: number): Promise<{
    current_booking: {
      id: number;
      date: string;
      time: string;
      slot_type: string;
      total_amount: number;
      express_fee: number;
    };
    available_slots: Array<{
      id: number;
      date: string;
      start_time: string;
      end_time: string;
      slot_type: string;
      is_rush: boolean;
      rush_fee_percentage: number;
      calculated_price: number;
      provider_note: string;
      current_bookings: number;
      max_bookings: number;
      is_fully_booked: boolean;
    }>;
    date_range: {
      start_date: string;
      end_date: string;
    };
  }> => {
    try {
      const response = await api.get(`/bookings/bookings/${id}/reschedule_options/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view reschedule options for this booking.');
      } else if (error.response?.status === 404) {
        throw new Error('Booking not found.');
      } else {
        const errorMessage = error.response?.data?.detail || 'Failed to fetch reschedule options. Please try again.';
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Calculate price difference for rescheduling to a new slot
   * @param id - Booking ID
   * @param newSlotId - New slot ID
   * @returns Promise<PriceCalculation>
   */
  calculateReschedulePrice: async (id: number, newSlotId: number): Promise<{
    current_price: number;
    new_price: number;
    price_difference: number;
    is_upgrade: boolean;
    is_downgrade: boolean;
    is_same_price: boolean;
    new_slot: {
      id: number;
      date: string;
      start_time: string;
      end_time: string;
      slot_type: string;
      is_rush: boolean;
      rush_fee_percentage: number;
    };
  }> => {
    try {
      const response = await api.post(`/bookings/bookings/${id}/calculate_reschedule_price/`, {
        new_slot_id: newSlotId
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.detail || 'Invalid slot selected.';
        throw new Error(errorMessage);
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to calculate reschedule price for this booking.');
      } else if (error.response?.status === 404) {
        throw new Error('Booking not found.');
      } else {
        const errorMessage = error.response?.data?.detail || 'Failed to calculate reschedule price. Please try again.';
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * ENHANCED: Reschedule booking to a new slot with price calculation
   * @param id - Booking ID
   * @param newSlotId - New slot ID
   * @param rescheduleReason - Optional reason for rescheduling
   * @param specialInstructions - Optional special instructions
   * @returns Promise<RescheduleResult>
   */
  rescheduleBooking: async (id: number, newSlotId: number, rescheduleReason?: string, specialInstructions?: string): Promise<{
    booking: any;
    reschedule_info: {
      old_date: string;
      old_time: string;
      new_date: string;
      new_time: string;
      old_total_amount: number;
      new_total_amount: number;
      price_difference: number;
      is_upgrade: boolean;
      is_downgrade: boolean;
      reschedule_reason: string;
    };
  }> => {
    try {
      const response = await api.patch(`/bookings/bookings/${id}/reschedule_booking/`, {
        new_slot_id: newSlotId,
        reschedule_reason: rescheduleReason || '',
        special_instructions: specialInstructions || ''
      });
      return response.data;
    } catch (error: any) {
      // Provide more detailed error messages based on status codes
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.detail || 'Invalid request. Please check your input.';
        if (errorMessage.includes('past')) {
          throw new Error('Cannot reschedule to a past date/time. Please select a future date and time.');
        } else if (errorMessage.includes('fully booked')) {
          throw new Error('The selected time slot is fully booked. Please choose another time.');
        } else if (errorMessage.includes('Invalid or unavailable')) {
          throw new Error('The selected slot is no longer available. Please choose another time.');
        }
        throw new Error(errorMessage);
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to reschedule this booking.');
      } else if (error.response?.status === 404) {
        throw new Error('Booking not found.');
      } else {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to reschedule booking. Please try again.';
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Update booking details
   * @param id - Booking ID
   * @param data - Partial booking data to update
   * @returns Promise<any>
   */
  updateBooking: async (id: number, data: any): Promise<any> => {
    try {
      const response = await api.patch(`/bookings/bookings/${id}/`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update booking error:', error);
      throw error;
    }
  },

  /**
   * LEGACY: Reschedule booking (kept for backward compatibility)
   * @param id - Booking ID
   * @param date - New date
   * @param time - New time
   * @returns Promise<void>
   * @deprecated Use rescheduleBooking with slot ID instead
   */
  rescheduleBookingLegacy: async (id: number, date: string, time: string): Promise<void> => {
    try {
      const response = await api.patch(`/bookings/bookings/${id}/reschedule_booking/`, { new_date: date, new_time: time });
      return response.data;
    } catch (error: any) {
      // Provide more detailed error messages based on status codes
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.detail || 'Invalid request. Please check your input.';
        if (errorMessage.includes('past')) {
          throw new Error('Cannot reschedule to a past date/time. Please select a future date and time.');
        }
        throw new Error(errorMessage);
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to reschedule this booking.');
      } else if (error.response?.status === 404) {
        throw new Error('Booking not found.');
      } else if (error.response?.status === 409) {
        throw new Error('The selected time slot is fully booked. Please choose another time.');
      } else {
        const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to reschedule booking. Please try again.';
        throw new Error(errorMessage);
      }
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
   * @returns Promise<any[] | { results: any[] }>
   */
  getNotifications: async (): Promise<any[] | { results: any[] }> => {
    try {
      // Request a large page size to get all notifications (max is 100)
      const response = await api.get('/notifications/', {
        params: { page_size: 100 }
      })
      return response.data
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
      console.log('Fetching unread notifications count')
      const response = await api.get('/notifications/unread_count/')
      console.log('Unread count response:', response.data)
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
      console.log(`Marking notification ${notificationId} as read`)
      const response = await api.post(`/notifications/${notificationId}/mark_read/`)
      console.log('Mark as read response:', response.data)
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read')
    }
  },
  
  /**
   * Mark all notifications as read
   * @returns Promise<void>
   */
  markAllNotificationsAsRead: async (): Promise<void> => {
    try {
      console.log('Marking all notifications as read')
      const response = await api.post('/notifications/mark_all_read/')
      console.log('Mark all as read response:', response.data)
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
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
      console.log(`Deleting notification ${notificationId}`)
      const response = await api.delete(`/notifications/${notificationId}/`)
      console.log('Delete notification response:', response.data)
    } catch (error: any) {
      console.error('Error deleting notification:', error)
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
  
  /**
   * Get payment history for the customer
   * @returns Promise<any>
   */
  getPaymentHistory: async () => {
    // TODO: Implement when backend endpoint is ready
    const response = await api.get("/payments/history/")
    return response.data
  }
}

export default customerApi