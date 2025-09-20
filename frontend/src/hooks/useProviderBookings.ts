import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'
import { showToast } from '@/components/ui/enhanced-toast'
import type { ProviderBookingGroups, ProviderBooking } from '@/types/provider'

interface UseProviderBookingsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  initialLoad?: boolean
}

interface UseProviderBookingsReturn {
  // Data
  bookings: ProviderBookingGroups
  
  // Loading states
  loading: boolean
  updating: boolean
  
  // Error states
  error: string | null
  
  // Actions
  refreshBookings: () => Promise<void>
  updateBookingStatus: (bookingId: number, status: string, notes?: string, rejectionReason?: string) => Promise<void>
  markServiceDelivered: (bookingId: number, deliveryNotes?: string, completionPhotos?: string[]) => Promise<void>
  processCashPayment: (bookingId: number, amountCollected: number, collectionNotes?: string) => Promise<void>
  getServiceDeliveryStatus: (bookingId: number) => Promise<any>
  
  // Utility functions
  getBookingById: (bookingId: number) => ProviderBooking | undefined
  getBookingsByStatus: (status: string) => ProviderBooking[]
  getTotalBookingsCount: () => number
}

export const useProviderBookings = (
  options: UseProviderBookingsOptions = {}
): UseProviderBookingsReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30 * 1000, // 30 seconds
    initialLoad = true
  } = options

  // State
  const [bookings, setBookings] = useState<ProviderBookingGroups>({
    upcoming: [],
    pending: [],
    completed: [],
    count: 0,
    next: null,
    previous: null
  })
  const [loading, setLoading] = useState(initialLoad)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refresh bookings
  const refreshBookings = useCallback(async () => {
    try {
      setError(null)
      if (!updating) {
        setLoading(true)
      }
      
      const data = await providerApi.getProviderBookings()
      setBookings(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch bookings'
      setError(errorMessage)
      console.error('Error refreshing bookings:', err)
      
      showToast.error({
        title: 'Error Loading Bookings',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [updating])

  // Update booking status
  const updateBookingStatus = useCallback(async (
    bookingId: number,
    status: string,
    notes?: string,
    rejectionReason?: string
  ) => {
    try {
      setUpdating(true)
      setError(null)
      
      await providerApi.updateBookingStatus(bookingId, status, notes, rejectionReason)
      
      // Refresh bookings to get updated data
      await refreshBookings()
      
      showToast.success({
        title: 'Booking Updated',
        description: `Booking status updated to ${status}`,
        duration: 3000
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update booking status'
      setError(errorMessage)
      console.error('Error updating booking status:', err)
      
      showToast.error({
        title: 'Update Failed',
        description: errorMessage,
        duration: 5000
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [refreshBookings])

  // Mark service as delivered
  const markServiceDelivered = useCallback(async (
    bookingId: number,
    deliveryNotes?: string,
    completionPhotos?: string[]
  ) => {
    try {
      setUpdating(true)
      setError(null)
      
      await providerApi.markServiceDelivered(bookingId, deliveryNotes, completionPhotos)
      
      // Refresh bookings to get updated data
      await refreshBookings()
      
      showToast.success({
        title: 'Service Marked as Delivered',
        description: 'Customer has been notified to confirm service completion',
        duration: 3000
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to mark service as delivered'
      setError(errorMessage)
      console.error('Error marking service as delivered:', err)
      
      showToast.error({
        title: 'Delivery Update Failed',
        description: errorMessage,
        duration: 5000
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [refreshBookings])

  // Process cash payment
  const processCashPayment = useCallback(async (
    bookingId: number,
    amountCollected: number,
    collectionNotes?: string
  ) => {
    try {
      setUpdating(true)
      setError(null)
      
      await providerApi.processCashPayment(bookingId, amountCollected, collectionNotes)
      
      // Refresh bookings to get updated data
      await refreshBookings()
      
      showToast.success({
        title: 'Cash Payment Processed',
        description: 'Payment has been recorded successfully',
        duration: 3000
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process cash payment'
      setError(errorMessage)
      console.error('Error processing cash payment:', err)
      
      showToast.error({
        title: 'Payment Processing Failed',
        description: errorMessage,
        duration: 5000
      })
      throw err
    } finally {
      setUpdating(false)
    }
  }, [refreshBookings])

  // Get service delivery status
  const getServiceDeliveryStatus = useCallback(async (bookingId: number) => {
    try {
      return await providerApi.getServiceDeliveryStatus(bookingId)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get service delivery status'
      console.error('Error getting service delivery status:', err)
      
      showToast.error({
        title: 'Status Check Failed',
        description: errorMessage,
        duration: 5000
      })
      throw err
    }
  }, [])

  // Utility functions
  const getBookingById = useCallback((bookingId: number): ProviderBooking | undefined => {
    const allBookings = [
      ...bookings.upcoming,
      ...bookings.pending,
      ...bookings.completed
    ]
    return allBookings.find(booking => booking.id === bookingId)
  }, [bookings])

  const getBookingsByStatus = useCallback((status: string): ProviderBooking[] => {
    const allBookings = [
      ...bookings.upcoming,
      ...bookings.pending,
      ...bookings.completed
    ]
    return allBookings.filter(booking => booking.status === status)
  }, [bookings])

  const getTotalBookingsCount = useCallback((): number => {
    return bookings.upcoming.length + bookings.pending.length + bookings.completed.length
  }, [bookings])

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      refreshBookings()
    }
  }, [initialLoad, refreshBookings])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshBookings()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshBookings])

  return {
    // Data
    bookings,
    
    // Loading states
    loading,
    updating,
    
    // Error states
    error,
    
    // Actions
    refreshBookings,
    updateBookingStatus,
    markServiceDelivered,
    processCashPayment,
    getServiceDeliveryStatus,
    
    // Utility functions
    getBookingById,
    getBookingsByStatus,
    getTotalBookingsCount
  }
}

export default useProviderBookings