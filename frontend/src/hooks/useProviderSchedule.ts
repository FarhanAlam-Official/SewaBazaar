import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'

interface WorkingHours {
  [key: string]: {
    start: string
    end: string
    enabled: boolean
  }
}

interface BreakTime {
  start: string
  end: string
}

interface TimeSlot {
  id: number
  startTime: string
  endTime: string
  status: 'available' | 'booked' | 'blocked'
  maxBookings: number
  currentBookings: number
  booking?: {
    id: number
    customer: string
    service: string
  }
}

interface DayAvailability {
  date: string
  slots: TimeSlot[]
}

interface BlockedTime {
  id: number
  title: string
  startDate: string
  endDate: string
  reason: string
}

interface ScheduleData {
  workingHours: WorkingHours
  breakTime: BreakTime
  availability: DayAvailability[]
  blockedTimes: BlockedTime[]
}

interface CreateBlockedTimeData {
  title: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
  scheduleType: 'blocked' | 'vacation' | 'maintenance'
  notes?: string
  isRecurring?: boolean
  recurringPattern?: string
  recurringUntil?: string
}

interface UseProviderScheduleReturn {
  scheduleData: ScheduleData | null
  loading: boolean
  error: string | null
  updateWorkingHours: (workingHours: WorkingHours, breakTime: BreakTime) => Promise<void>
  createBlockedTime: (data: CreateBlockedTimeData) => Promise<void>
  deleteBlockedTime: (id: number) => Promise<void>
  refreshSchedule: (dateFrom?: string, dateTo?: string) => Promise<void>
  generateTimeSlots: (serviceId: number, dateFrom: string, dateTo: string) => Promise<void>
}

export const useProviderSchedule = (
  initialDateFrom?: string,
  initialDateTo?: string
): UseProviderScheduleReturn => {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch schedule data
  const fetchSchedule = useCallback(async (dateFrom?: string, dateTo?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      params.append('include_blocked', 'true')
      
      const response = await api.get(`/bookings/provider-dashboard/schedule/?${params.toString()}`)
      setScheduleData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schedule data')
      console.error('Error fetching schedule:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update working hours and break time
  const updateWorkingHours = useCallback(async (workingHours: WorkingHours, breakTime: BreakTime) => {
    try {
      setError(null)
      await api.put('/bookings/provider-dashboard/schedule/', {
        workingHours,
        breakTime
      })
      
      // Refresh schedule data
      await fetchSchedule(initialDateFrom, initialDateTo)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update working hours')
      throw err
    }
  }, [fetchSchedule, initialDateFrom, initialDateTo])

  // Create blocked time
  const createBlockedTime = useCallback(async (data: CreateBlockedTimeData) => {
    try {
      setError(null)
      await api.post('/bookings/provider-schedule/', {
        title: data.title,
        date: data.startDate,
        end_date: data.endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        is_all_day: data.isAllDay,
        schedule_type: data.scheduleType,
        notes: data.notes,
        is_recurring: data.isRecurring || false,
        recurring_pattern: data.recurringPattern,
        recurring_until: data.recurringUntil
      })
      
      // Refresh schedule data
      await fetchSchedule(initialDateFrom, initialDateTo)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create blocked time')
      throw err
    }
  }, [fetchSchedule, initialDateFrom, initialDateTo])

  // Delete blocked time
  const deleteBlockedTime = useCallback(async (id: number) => {
    try {
      setError(null)
      await api.delete(`/bookings/provider-schedule/${id}/`)
      
      // Refresh schedule data
      await fetchSchedule(initialDateFrom, initialDateTo)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete blocked time')
      throw err
    }
  }, [fetchSchedule, initialDateFrom, initialDateTo])

  // Generate time slots for a service
  const generateTimeSlots = useCallback(async (serviceId: number, dateFrom: string, dateTo: string) => {
    try {
      setError(null)
      await api.post('/bookings/booking-slots/generate/', {
        service_id: serviceId,
        date_from: dateFrom,
        date_to: dateTo
      })
      
      // Refresh schedule data
      await fetchSchedule(dateFrom, dateTo)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate time slots')
      throw err
    }
  }, [fetchSchedule])

  // Refresh schedule data
  const refreshSchedule = useCallback(async (dateFrom?: string, dateTo?: string) => {
    await fetchSchedule(dateFrom || initialDateFrom, dateTo || initialDateTo)
  }, [fetchSchedule, initialDateFrom, initialDateTo])

  // Initial data loading
  useEffect(() => {
    fetchSchedule(initialDateFrom, initialDateTo)
  }, [fetchSchedule, initialDateFrom, initialDateTo])

  return {
    scheduleData,
    loading,
    error,
    updateWorkingHours,
    createBlockedTime,
    deleteBlockedTime,
    refreshSchedule,
    generateTimeSlots
  }
}

export default useProviderSchedule