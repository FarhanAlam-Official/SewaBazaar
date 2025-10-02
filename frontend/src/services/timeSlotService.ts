import api from './api'

export interface TimeSlot {
  id: string
  service_id: number
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  max_bookings: number
  current_bookings: number
  price_modifier?: number // Optional price adjustment for specific slots
  created_at: string
  updated_at: string
}

export interface TimeSlotAvailability {
  date: string
  slots: TimeSlot[]
  total_slots: number
  available_slots: number
}

export interface CreateTimeSlotData {
  service_id: number
  date: string
  start_time: string
  end_time: string
  max_bookings?: number
  price_modifier?: number
}

export interface UpdateTimeSlotData {
  is_available?: boolean
  max_bookings?: number
  price_modifier?: number
}

/**
 * Time Slot Service API
 * Handles all time slot related operations including availability checking,
 * slot creation, updates, and booking management
 */
export const timeSlotService = {
  /**
   * Get available time slots for a service on a specific date
   * @param serviceId - Service ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Promise<TimeSlotAvailability>
   */
  getAvailableSlots: async (serviceId: number, date: string): Promise<TimeSlotAvailability> => {
    try {
      const response = await api.get(`/bookings/booking_slots/available_slots/`, {
        params: { 
          service_id: serviceId, 
          date
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching time slots:', error)
      throw new Error(error.response?.data?.detail || 'Failed to fetch time slots')
    }
  },

  /**
   * Get available time slots for a service across multiple dates
   * @param serviceId - Service ID
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Promise<TimeSlotAvailability[]>
   */
  getAvailableSlotsRange: async (
    serviceId: number, 
    startDate: string, 
    endDate: string
  ): Promise<TimeSlotAvailability[]> => {
    try {
      const response = await api.get(`/bookings/booking_slots/available_slots/`, {
        params: { 
          service_id: serviceId, 
          start_date: startDate, 
          end_date: endDate
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching time slots range:', error)
      throw new Error(error.response?.data?.detail || 'Failed to fetch time slots')
    }
  },

  /**
   * Create a new time slot for a service
   * @param data - Time slot creation data
   * @returns Promise<TimeSlot>
   */
  createTimeSlot: async (data: CreateTimeSlotData): Promise<TimeSlot> => {
    try {
      const response = await api.post('/bookings/booking-slots/', data)
      return response.data
    } catch (error: any) {
      console.error('Error creating time slot:', error)
      throw new Error(error.response?.data?.detail || 'Failed to create time slot')
    }
  },

  /**
   * Update an existing time slot
   * @param slotId - Time slot ID
   * @param data - Update data
   * @returns Promise<TimeSlot>
   */
  updateTimeSlot: async (slotId: string, data: UpdateTimeSlotData): Promise<TimeSlot> => {
    try {
      const response = await api.patch(`/time-slots/${slotId}/`, data)
      return response.data
    } catch (error: any) {
      console.error('Error updating time slot:', error)
      throw new Error(error.response?.data?.detail || 'Failed to update time slot')
    }
  },

  /**
   * Delete a time slot
   * @param slotId - Time slot ID
   * @returns Promise<void>
   */
  deleteTimeSlot: async (slotId: string): Promise<void> => {
    try {
      await api.delete(`/time-slots/${slotId}/`)
    } catch (error: any) {
      console.error('Error deleting time slot:', error)
      throw new Error(error.response?.data?.detail || 'Failed to delete time slot')
    }
  },

  /**
   * Check if a specific time slot is available for booking
   * @param slotId - Time slot ID
   * @returns Promise<boolean>
   */
  checkSlotAvailability: async (slotId: string): Promise<boolean> => {
    try {
      const response = await api.get(`/time-slots/${slotId}/availability/`)
      return response.data.is_available
    } catch (error: any) {
      console.error('Error checking slot availability:', error)
      throw new Error(error.response?.data?.detail || 'Failed to check slot availability')
    }
  },

  /**
   * Reserve a time slot temporarily (for booking process)
   * @param slotId - Time slot ID
   * @param reservationMinutes - How long to hold the reservation (default: 15 minutes)
   * @returns Promise<{ reservation_id: string, expires_at: string }>
   */
  reserveTimeSlot: async (
    slotId: string, 
    reservationMinutes: number = 15
  ): Promise<{ reservation_id: string; expires_at: string }> => {
    try {
      const response = await api.post(`/time-slots/${slotId}/reserve/`, {
        reservation_minutes: reservationMinutes
      })
      return response.data
    } catch (error: any) {
      console.error('Error reserving time slot:', error)
      throw new Error(error.response?.data?.detail || 'Failed to reserve time slot')
    }
  },

  /**
   * Release a time slot reservation
   * @param reservationId - Reservation ID
   * @returns Promise<void>
   */
  releaseReservation: async (reservationId: string): Promise<void> => {
    try {
      await api.delete(`/time-slot-reservations/${reservationId}/`)
    } catch (error: any) {
      console.error('Error releasing reservation:', error)
      throw new Error(error.response?.data?.detail || 'Failed to release reservation')
    }
  },

  /**
   * Generate default time slots for a service based on availability settings
   * @param serviceId - Service ID
   * @param startDate - Start date for generation
   * @param endDate - End date for generation
   * @returns Promise<TimeSlot[]>
   */
  generateDefaultSlots: async (
    serviceId: number,
    startDate: string,
    endDate: string
  ): Promise<TimeSlot[]> => {
    try {
      const response = await api.post(`/services/${serviceId}/generate-slots/`, {
        start_date: startDate,
        end_date: endDate
      })
      return response.data
    } catch (error: any) {
      console.error('Error generating time slots:', error)
      throw new Error(error.response?.data?.detail || 'Failed to generate time slots')
    }
  },

  /**
   * Get provider's time slot statistics
   * @param providerId - Provider ID
   * @param startDate - Start date for stats
   * @param endDate - End date for stats
   * @returns Promise<TimeSlotStats>
   */
  getProviderSlotStats: async (
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    total_slots: number
    booked_slots: number
    available_slots: number
    booking_rate: number
    revenue_potential: number
    peak_hours: Array<{ hour: number; bookings: number }>
  }> => {
    try {
      const response = await api.get(`/providers/${providerId}/slot-stats/`, {
        params: { start_date: startDate, end_date: endDate }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching slot stats:', error)
      throw new Error(error.response?.data?.detail || 'Failed to fetch slot statistics')
    }
  }
}

export default timeSlotService