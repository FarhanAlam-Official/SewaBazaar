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
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    initialLoad = true
  } = options

  // State
  const [bookings, setBookings] = useState<ProviderBookingGroups>({
    upcoming: [],
    pending: [],
    completed: [],
    cancelled: [], // Add cancelled bookings array
    rejected: [], // Add rejected bookings array
    count: 0,
    next: null,
    previous: null
  })
  const [loading, setLoading] = useState(initialLoad)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refresh bookings
  const refreshBookings = useCallback(async (showErrorToast: boolean = true) => {
    try {
      setError(null)
      if (!updating) {
        setLoading(true)
      }
      
      const data = await providerApi.getProviderBookings()
      // Ensure cancelled and rejected arrays exist
      const bookingsData = {
        ...data,
        cancelled: data.cancelled || [],
        rejected: data.rejected || []
      }
      setBookings(bookingsData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch bookings'
      setError(errorMessage)
      console.error('Error refreshing bookings:', err)
      
      if (showErrorToast) {
        showToast.error({
          title: 'Error Loading Bookings',
          description: errorMessage,
          duration: 5000
        })
      }
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
      
      // Show success message immediately
      showToast.success({
        title: 'Booking Updated',
        description: `Booking status updated to ${status}`,
        duration: 3000
      })
      
      // Optimistically update local state and re-group item
      setBookings((prev) => {
        const removeFromAll = (arr: ProviderBooking[]) => arr.filter(b => b.id !== bookingId)
        const updated: ProviderBooking | undefined = [...prev.upcoming, ...prev.pending, ...prev.completed, ...(prev.cancelled || []), ...(prev.rejected || [])].find(b => b.id === bookingId)
        const updatedBooking: ProviderBooking | undefined = updated ? { ...updated, status } : undefined
        const next = {
          ...prev,
          upcoming: removeFromAll(prev.upcoming || []),
          pending: removeFromAll(prev.pending || []),
          completed: removeFromAll(prev.completed || []),
          cancelled: removeFromAll(prev.cancelled || []), // Remove from cancelled if exists
          rejected: removeFromAll(prev.rejected || []), // Remove from rejected if exists
        }
        if (updatedBooking) {
          const s = (status || '').toLowerCase()
          if (s === 'pending' || s === 'confirmed') {
            next.pending = [updatedBooking, ...next.pending]
          } else if (s === 'completed') {
            next.completed = [updatedBooking, ...next.completed]
          } else if (s === 'cancelled' || s === 'canceled') {
            next.cancelled = [updatedBooking, ...next.cancelled]
          } else if (s === 'rejected') {
            next.rejected = [updatedBooking, ...next.rejected]
          } else {
            next.upcoming = [updatedBooking, ...next.upcoming]
          }
        }
        return next
      })

      // Try to refresh bookings, but don't show error toast if it fails
      try {
        await refreshBookings(false) // Don't show error toast
      } catch (refreshErr: any) {
        console.warn('Failed to refresh bookings after status update:', refreshErr)
        // Don't show error toast for refresh failure, just log it
        // The main operation was successful
      }
      
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
      
      // Show success message immediately
      showToast.success({
        title: 'Service Marked as Delivered',
        description: 'Customer has been notified to confirm service completion',
        duration: 3000
      })
      
      // Try to refresh bookings, but don't show error toast if it fails
      try {
        await refreshBookings(false) // Don't show error toast
      } catch (refreshErr: any) {
        console.warn('Failed to refresh bookings after marking as delivered:', refreshErr)
        // Don't show error toast for refresh failure, just log it
        // The main operation was successful
      }
      
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
      
      // Show success message immediately
      showToast.success({
        title: 'Cash Payment Processed',
        description: 'Payment has been recorded successfully',
        duration: 3000
      })
      
      // Try to refresh bookings, but don't show error toast if it fails
      try {
        await refreshBookings(false) // Don't show error toast
      } catch (refreshErr: any) {
        console.warn('Failed to refresh bookings after cash payment:', refreshErr)
        // Don't show error toast for refresh failure, just log it
        // The main operation was successful
      }
      
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
      ...bookings.completed,
      ...(bookings.cancelled || []),
      ...(bookings.rejected || [])
    ]
    return allBookings.find(booking => booking.id === bookingId)
  }, [bookings])

  const getBookingsByStatus = useCallback((status: string): ProviderBooking[] => {
    const allBookings = [
      ...bookings.upcoming,
      ...bookings.pending,
      ...bookings.completed,
      ...(bookings.cancelled || []),
      ...(bookings.rejected || [])
    ]
    return allBookings.filter(booking => booking.status === status)
  }, [bookings])

  const getTotalBookingsCount = useCallback((): number => {
    return bookings.upcoming.length + bookings.pending.length + bookings.completed.length + (bookings.cancelled || []).length + (bookings.rejected || []).length
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