import { renderHook, act, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { useProviderNotifications } from '@/hooks/useProviderNotifications'
import { api } from '@/services/api'

// Mock the API service
jest.mock('@/services/api')
const mockApi = api as jest.Mocked<typeof api>

// Mock EventSource
const mockEventSource = {
  onmessage: null as ((event: MessageEvent) => void) | null,
  onerror: null as ((event: Event) => void) | null,
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  readyState: 1,
  url: '',
  withCredentials: false,
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
}

global.EventSource = jest.fn(() => mockEventSource) as any

// Mock Notification API
const mockNotification = {
  permission: 'granted' as NotificationPermission,
  requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission),
}

Object.defineProperty(global, 'Notification', {
  value: jest.fn().mockImplementation((title: string, options?: NotificationOptions) => ({
    title,
    ...options,
    close: jest.fn(),
  })),
  configurable: true,
})

Object.defineProperty(global.Notification, 'permission', {
  value: 'granted',
  configurable: true,
})

Object.defineProperty(global.Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted'),
  configurable: true,
})

describe('useProviderNotifications', () => {
  const mockNotifications = [
    {
      id: 1,
      title: 'New Booking Request',
      message: 'You have a new booking request',
      type: 'booking_request',
      is_read: false,
      priority: 'high',
      action_required: true,
      action_url: '/bookings',
      data: { booking_id: 123 },
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment of ₹1500 received',
      type: 'payment',
      is_read: true,
      priority: 'medium',
      action_required: false,
      action_url: '/earnings',
      data: { payment_id: 456 },
      created_at: '2024-01-14T15:45:00Z',
    },
  ]

  const mockPreferences = {
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    booking_requests: true,
    booking_updates: true,
    payment_notifications: true,
    review_notifications: true,
    system_notifications: true,
    marketing_notifications: false,
    reminder_notifications: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockApi.get.mockClear()
    mockApi.patch.mockClear()
    mockApi.post.mockClear()
    mockApi.delete.mockClear()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useProviderNotifications())

      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
      expect(result.current.preferences).toBeNull()
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Fetching Notifications', () => {
    it('should fetch notifications on mount', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockApi.get).toHaveBeenCalledWith('/notifications/')
      expect(mockApi.get).toHaveBeenCalledWith('/notifications/preferences/')
      expect(result.current.notifications).toEqual(mockNotifications)
      expect(result.current.unreadCount).toBe(1) // Only one unread notification
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch notifications'
      mockApi.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.notifications).toEqual([])
    })

    it('should calculate unread count correctly', async () => {
      const notificationsWithMixedReadStatus = [
        { ...mockNotifications[0], is_read: false },
        { ...mockNotifications[1], is_read: false },
        { ...mockNotifications[0], id: 3, is_read: true },
      ]

      mockApi.get.mockResolvedValueOnce({ data: notificationsWithMixedReadStatus })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2)
      })
    })
  })

  describe('Mark as Read', () => {
    it('should mark single notification as read', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })
      mockApi.patch.mockResolvedValueOnce({ data: { ...mockNotifications[0], is_read: true } })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.markAsRead(1)
      })

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/1/', { is_read: true })
      expect(result.current.notifications[0].is_read).toBe(true)
    })

    it('should handle mark as read error', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })
      mockApi.patch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.markAsRead(1)).rejects.toThrow()
    })

    it('should mark all notifications as read', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })
      mockApi.post.mockResolvedValueOnce({ data: { message: 'All marked as read' } })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.markAllAsRead()
      })

      expect(mockApi.post).toHaveBeenCalledWith('/notifications/mark-all-read/')
      expect(result.current.notifications.every(n => n.is_read)).toBe(true)
    })
  })

  describe('Delete Notification', () => {
    it('should delete notification', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })
      mockApi.delete.mockResolvedValueOnce({ data: {} })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteNotification(1)
      })

      expect(mockApi.delete).toHaveBeenCalledWith('/notifications/1/')
      expect(result.current.notifications.find(n => n.id === 1)).toBeUndefined()
    })

    it('should handle delete error', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })
      mockApi.delete.mockRejectedValueOnce(new Error('Delete failed'))

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.deleteNotification(1)).rejects.toThrow()
    })
  })

  describe('Update Preferences', () => {
    it('should update notification preferences', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })
      
      const updatedPreferences = { ...mockPreferences, email_notifications: false }
      mockApi.patch.mockResolvedValueOnce({ data: updatedPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updatePreferences({ email_notifications: false })
      })

      expect(mockApi.patch).toHaveBeenCalledWith('/notifications/preferences/', { email_notifications: false })
      expect(result.current.preferences?.email_notifications).toBe(false)
    })

    it('should handle update preferences error', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })
      mockApi.patch.mockRejectedValueOnce(new Error('Update failed'))

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.updatePreferences({ email_notifications: false })).rejects.toThrow()
    })
  })

  describe('Refresh Notifications', () => {
    it('should refresh notifications', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear previous calls
      mockApi.get.mockClear()
      mockApi.get.mockResolvedValueOnce({ data: [...mockNotifications, { ...mockNotifications[0], id: 3 }] })

      await act(async () => {
        await result.current.refreshNotifications()
      })

      expect(mockApi.get).toHaveBeenCalledWith('/notifications/')
      expect(result.current.notifications).toHaveLength(3)
    })
  })

  describe('Real-time Notifications', () => {
    it('should subscribe to real-time notifications', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.subscribeToRealTime()
      })

      expect(global.EventSource).toHaveBeenCalledWith('/api/notifications/stream/')
    })

    it('should handle real-time notification messages', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.subscribeToRealTime()
      })

      const newNotification = {
        id: 3,
        title: 'New Real-time Notification',
        message: 'This came via real-time',
        type: 'system',
        is_read: false,
        priority: 'medium',
        action_required: false,
        data: {},
        created_at: new Date().toISOString(),
      }

      // Simulate receiving a real-time message
      act(() => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify(newNotification),
          } as MessageEvent)
        }
      })

      expect(result.current.notifications[0]).toEqual(newNotification)
    })

    it('should unsubscribe from real-time notifications', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.subscribeToRealTime()
      })

      act(() => {
        result.current.unsubscribeFromRealTime()
      })

      expect(mockEventSource.close).toHaveBeenCalled()
    })

    it('should show browser notification when supported', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.subscribeToRealTime()
      })

      const newNotification = {
        id: 3,
        title: 'Browser Notification Test',
        message: 'This should show as browser notification',
        type: 'system',
        is_read: false,
        priority: 'high',
        action_required: false,
        data: {},
        created_at: new Date().toISOString(),
      }

      act(() => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify(newNotification),
          } as MessageEvent)
        }
      })

      expect(global.Notification).toHaveBeenCalledWith('Browser Notification Test', {
        body: 'This should show as browser notification',
        icon: '/favicon.ico',
      })
    })
  })

  describe('Browser Notification Permission', () => {
    it('should request notification permission on mount', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue('granted')
      Object.defineProperty(global.Notification, 'requestPermission', {
        value: mockRequestPermission,
        configurable: true,
      })
      Object.defineProperty(global.Notification, 'permission', {
        value: 'default',
        configurable: true,
      })

      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled()
      })
    })

    it('should not request permission if already granted', async () => {
      const mockRequestPermission = jest.fn()
      Object.defineProperty(global.Notification, 'requestPermission', {
        value: mockRequestPermission,
        configurable: true,
      })
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        configurable: true,
      })

      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockRequestPermission).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup real-time subscription on unmount', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result, unmount } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.subscribeToRealTime()
      })

      unmount()

      expect(mockEventSource.close).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle EventSource errors gracefully', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.subscribeToRealTime()
      })

      // Simulate EventSource error
      act(() => {
        if (mockEventSource.onerror) {
          mockEventSource.onerror(new Event('error'))
        }
      })

      expect(mockEventSource.close).toHaveBeenCalled()
    })

    it('should handle malformed real-time messages', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockNotifications })
      mockApi.get.mockResolvedValueOnce({ data: mockPreferences })

      const { result } = renderHook(() => useProviderNotifications())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.subscribeToRealTime()
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      // Send malformed JSON
      act(() => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: 'invalid json',
          } as MessageEvent)
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error parsing notification:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})