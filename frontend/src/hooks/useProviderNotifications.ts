import { useState, useEffect, useCallback } from 'react'
import api from '@/services/api'

interface ProviderNotification {
  id: number
  type: 'booking_request' | 'booking_update' | 'review' | 'payment' | 'system' | 'reminder'
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
  action_required: boolean
  action_url?: string
  priority: 'low' | 'medium' | 'high'
}

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  booking_requests: boolean
  booking_updates: boolean
  payment_notifications: boolean
  review_notifications: boolean
  system_notifications: boolean
  marketing_notifications: boolean
  reminder_notifications: boolean
}

interface UseProviderNotificationsReturn {
  notifications: ProviderNotification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  loading: boolean
  error: string | null
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: number) => Promise<void>
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>
  refreshNotifications: () => Promise<void>
  subscribeToRealTime: () => void
  unsubscribeFromRealTime: () => void
}

export const useProviderNotifications = (): UseProviderNotificationsReturn => {
  const [notifications, setNotifications] = useState<ProviderNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/notifications/')
      // Ensure we have an array of notifications
      const notificationsData = Array.isArray(response.data) ? response.data : []
      setNotifications(notificationsData)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch notifications'
      setError(errorMessage)
      console.error('Error fetching notifications:', err)
      // Set empty array on error to prevent UI issues
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await api.get('/notifications/preferences/')
      setPreferences(response.data || null)
    } catch (err: any) {
      console.error('Error fetching notification preferences:', err)
      // Not a critical error, so we don't set error state
      setPreferences(null)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/`, { is_read: true })
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read/')
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}/`)
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (err: any) {
      console.error('Error deleting notification:', err)
      throw err
    }
  }, [])

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const response = await api.patch('/notifications/preferences/', newPreferences)
      setPreferences(response.data || null)
    } catch (err: any) {
      console.error('Error updating notification preferences:', err)
      throw err
    }
  }, [])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Subscribe to real-time notifications
  const subscribeToRealTime = useCallback(() => {
    // Check if we're in a browser environment and if EventSource is supported
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('EventSource not supported in this environment')
      return
    }

    // Only subscribe if we don't already have an active connection
    if (eventSource) {
      console.log('Already subscribed to real-time notifications')
      return
    }

    try {
      // Use the API base URL from the axios instance
      const apiUrl = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const esUrl = `${apiUrl.replace('/api', '')}/api/notifications/stream/`
      
      console.log('Connecting to EventSource at:', esUrl)
      const es = new EventSource(esUrl)
      
      es.onopen = () => {
        console.log('EventSource connection opened')
      }
      
      es.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          setNotifications(prev => [notification, ...prev])
          
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            })
          }
        } catch (error) {
          console.error('Error parsing notification:', error)
        }
      }

      es.onerror = (error) => {
        console.error('EventSource error:', error)
        // Don't close the connection immediately, let it retry
      }

      setEventSource(es)
    } catch (error) {
      console.error('Error setting up real-time notifications:', error)
    }
  }, [eventSource])

  // Unsubscribe from real-time notifications
  const unsubscribeFromRealTime = useCallback(() => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
      console.log('Unsubscribed from real-time notifications')
    }
  }, [eventSource])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch (error) {
        console.error('Error requesting notification permission:', error)
      }
    }
  }, [])

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load notifications and preferences in parallel
        await Promise.allSettled([
          fetchNotifications(),
          fetchPreferences()
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
      
      // Request notification permission
      await requestNotificationPermission()
      
      // Subscribe to real-time notifications
      subscribeToRealTime()
    }

    loadInitialData()

    // Cleanup on unmount
    return () => {
      unsubscribeFromRealTime()
    }
  }, [fetchNotifications, fetchPreferences, requestNotificationPermission, subscribeToRealTime, unsubscribeFromRealTime])

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refreshNotifications,
    subscribeToRealTime,
    unsubscribeFromRealTime
  }
}

export default useProviderNotifications