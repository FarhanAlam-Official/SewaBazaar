import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'

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
      setNotifications(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await api.get('/notifications/preferences/')
      setPreferences(response.data)
    } catch (err: any) {
      console.error('Error fetching notification preferences:', err)
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
      setPreferences(response.data)
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
    if (eventSource) return // Already subscribed

    try {
      const es = new EventSource('/api/notifications/stream/')
      
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
        es.close()
        setEventSource(null)
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
    }
  }, [eventSource])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchNotifications(),
        fetchPreferences()
      ])
      
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