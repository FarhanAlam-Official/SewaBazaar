import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import ProviderNotifications from '@/app/dashboard/provider/notifications/page'
import { useProviderNotifications } from '@/hooks/useProviderNotifications'

// Mock the useProviderNotifications hook
jest.mock('@/hooks/useProviderNotifications')
const mockUseProviderNotifications = useProviderNotifications as jest.MockedFunction<typeof useProviderNotifications>

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}))

describe('ProviderNotifications', () => {
  const mockNotifications = [
    {
      id: 1,
      title: 'New Booking Request',
      message: 'You have received a new booking request for House Cleaning.',
      type: 'booking_request',
      is_read: false,
      priority: 'high',
      action_required: true,
      action_url: '/dashboard/provider/bookings',
      data: { booking_id: 123 },
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'You received ₹1500 payment for House Cleaning service.',
      type: 'payment',
      is_read: true,
      priority: 'medium',
      action_required: false,
      action_url: '/dashboard/provider/earnings',
      data: { payment_id: 456 },
      created_at: '2024-01-14T15:45:00Z',
    },
    {
      id: 3,
      title: 'New Review Received',
      message: 'Customer left a 5-star review for your service.',
      type: 'review',
      is_read: false,
      priority: 'low',
      action_required: false,
      action_url: '/dashboard/provider/reviews',
      data: { review_id: 789 },
      created_at: '2024-01-13T09:15:00Z',
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
    email_enabled: true,
    push_enabled: true,
    topics: [],
  }

  const defaultMockReturn = {
    notifications: mockNotifications,
    unreadCount: 2,
    preferences: mockPreferences,
    loading: false,
    error: null,
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    updatePreferences: jest.fn(),
    refreshNotifications: jest.fn(),
    subscribeToRealTime: jest.fn(),
    unsubscribeFromRealTime: jest.fn(),
  }

  beforeEach(() => {
    mockUseProviderNotifications.mockReturnValue(defaultMockReturn)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the notifications page with correct title', () => {
      render(<ProviderNotifications />)
      
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('2 unread notifications')).toBeInTheDocument()
    })

    it('displays all notifications correctly', () => {
      render(<ProviderNotifications />)
      
      expect(screen.getByText('New Booking Request')).toBeInTheDocument()
      expect(screen.getByText('Payment Received')).toBeInTheDocument()
      expect(screen.getByText('New Review Received')).toBeInTheDocument()
    })

    it('shows correct notification counts in tabs', () => {
      render(<ProviderNotifications />)
      
      expect(screen.getByText('All (3)')).toBeInTheDocument()
      expect(screen.getByText('Unread (2)')).toBeInTheDocument()
    })

    it('displays notification icons based on type', () => {
      render(<ProviderNotifications />)
      
      // Check that icons are rendered (we can't easily test specific icons, but we can check they exist)
      const notificationCards = screen.getAllByRole('generic').filter(el => 
        el.className?.includes('cursor-pointer')
      )
      expect(notificationCards.length).toBeGreaterThan(0)
    })

    it('shows priority indicators correctly', () => {
      render(<ProviderNotifications />)
      
      // High priority notification should have red border
      const highPriorityCard = screen.getByText('New Booking Request').closest('div')
      expect(highPriorityCard).toHaveClass('border-l-red-500')
    })

    it('displays unread notifications with special styling', () => {
      render(<ProviderNotifications />)
      
      const unreadCard = screen.getByText('New Booking Request').closest('div')
      expect(unreadCard).toHaveClass('bg-blue-50/50')
      
      const readCard = screen.getByText('Payment Received').closest('div')
      expect(readCard).not.toHaveClass('bg-blue-50/50')
    })
  })

  describe('Loading and Error States', () => {
    it('shows loading state', () => {
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      })

      render(<ProviderNotifications />)
      
      expect(screen.getByText('Loading notifications...')).toBeInTheDocument()
    })

    it('shows error state with retry button', () => {
      const mockRefresh = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        loading: false,
        error: 'Failed to load notifications',
        refreshNotifications: mockRefresh,
      })

      render(<ProviderNotifications />)
      
      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument()
      
      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('shows empty state when no notifications', () => {
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        notifications: [],
        unreadCount: 0,
      })

      render(<ProviderNotifications />)
      
      expect(screen.getByText('No notifications yet')).toBeInTheDocument()
      expect(screen.getByText('All caught up!')).toBeInTheDocument()
    })
  })

  describe('Notification Interactions', () => {
    it('marks notification as read when clicked', async () => {
      const mockMarkAsRead = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        markAsRead: mockMarkAsRead,
      })

      render(<ProviderNotifications />)
      
      const unreadNotification = screen.getByText('New Booking Request')
      fireEvent.click(unreadNotification.closest('div')!)
      
      expect(mockMarkAsRead).toHaveBeenCalledWith(1)
    })

    it('does not call markAsRead for already read notifications', async () => {
      const mockMarkAsRead = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        markAsRead: mockMarkAsRead,
      })

      render(<ProviderNotifications />)
      
      const readNotification = screen.getByText('Payment Received')
      fireEvent.click(readNotification.closest('div')!)
      
      expect(mockMarkAsRead).not.toHaveBeenCalled()
    })

    it('calls markAllAsRead when mark all as read button is clicked', async () => {
      const mockMarkAllAsRead = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        markAllAsRead: mockMarkAllAsRead,
      })

      render(<ProviderNotifications />)
      
      const markAllButton = screen.getByText('Mark all as read')
      fireEvent.click(markAllButton)
      
      expect(mockMarkAllAsRead).toHaveBeenCalled()
    })

    it('refreshes notifications when refresh button is clicked', async () => {
      const mockRefresh = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        refreshNotifications: mockRefresh,
      })

      render(<ProviderNotifications />)
      
      const refreshButton = screen.getByText('Refresh')
      fireEvent.click(refreshButton)
      
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('deletes notification when delete button is clicked', async () => {
      const user = userEvent.setup()
      const mockDelete = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        deleteNotification: mockDelete,
      })

      render(<ProviderNotifications />)
      
      // Find and click the delete button (trash icon)
      const deleteButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')
      )
      
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0])
        
        // Confirm deletion in the alert dialog
        const confirmButton = screen.getByText('Delete')
        await user.click(confirmButton)
        
        expect(mockDelete).toHaveBeenCalled()
      }
    })
  })

  describe('Filtering and Tabs', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup()
      render(<ProviderNotifications />)
      
      // Click on Unread tab
      const unreadTab = screen.getByText('Unread (2)')
      await user.click(unreadTab)
      
      // Should only show unread notifications
      expect(screen.getByText('New Booking Request')).toBeInTheDocument()
      expect(screen.getByText('New Review Received')).toBeInTheDocument()
      expect(screen.queryByText('Payment Received')).not.toBeInTheDocument()
    })

    it('filters notifications by type in booking tab', async () => {
      const user = userEvent.setup()
      render(<ProviderNotifications />)
      
      // Click on Bookings tab
      const bookingTab = screen.getByText('Bookings')
      await user.click(bookingTab)
      
      // Should only show booking-related notifications
      expect(screen.getByText('New Booking Request')).toBeInTheDocument()
      expect(screen.queryByText('Payment Received')).not.toBeInTheDocument()
      expect(screen.queryByText('New Review Received')).not.toBeInTheDocument()
    })

    it('shows empty state for unread when all are read', async () => {
      const user = userEvent.setup()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        notifications: mockNotifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      })

      render(<ProviderNotifications />)
      
      const unreadTab = screen.getByText('Unread (0)')
      await user.click(unreadTab)
      
      expect(screen.getByText('All caught up!')).toBeInTheDocument()
      expect(screen.getByText('No unread notifications')).toBeInTheDocument()
    })
  })

  describe('Notification Preferences', () => {
    it('opens preferences dialog when settings button is clicked', async () => {
      const user = userEvent.setup()
      render(<ProviderNotifications />)
      
      const settingsButton = screen.getByText('Settings')
      await user.click(settingsButton)
      
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
      expect(screen.getByText('Configure how you want to receive notifications')).toBeInTheDocument()
    })

    it('displays current preference values correctly', async () => {
      const user = userEvent.setup()
      render(<ProviderNotifications />)
      
      const settingsButton = screen.getByText('Settings')
      await user.click(settingsButton)
      
      // Check that switches reflect current preferences
      const emailSwitch = screen.getByLabelText('Email Notifications')
      expect(emailSwitch).toBeChecked()
      
      const smsSwitch = screen.getByLabelText('SMS Notifications')
      expect(smsSwitch).not.toBeChecked()
    })

    it('updates preferences when switches are toggled', async () => {
      const user = userEvent.setup()
      const mockUpdatePreferences = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        updatePreferences: mockUpdatePreferences,
      })

      render(<ProviderNotifications />)
      
      const settingsButton = screen.getByText('Settings')
      await user.click(settingsButton)
      
      const emailSwitch = screen.getByLabelText('Email Notifications')
      await user.click(emailSwitch)
      
      expect(mockUpdatePreferences).toHaveBeenCalledWith('email_notifications', false)
    })

    it('closes preferences dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ProviderNotifications />)
      
      const settingsButton = screen.getByText('Settings')
      await user.click(settingsButton)
      
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
      
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Notification Preferences')).not.toBeInTheDocument()
      })
    })
  })

  describe('Action Required Notifications', () => {
    it('shows action buttons for booking requests', () => {
      render(<ProviderNotifications />)
      
      // The booking request notification should have Accept/Decline buttons
      const bookingCard = screen.getByText('New Booking Request').closest('div')
      expect(bookingCard).toBeInTheDocument()
      
      // Check for action buttons (they should be rendered for action_required notifications)
      const acceptButton = screen.getByText('Accept')
      const declineButton = screen.getByText('Decline')
      
      expect(acceptButton).toBeInTheDocument()
      expect(declineButton).toBeInTheDocument()
    })

    it('does not show action buttons for non-action-required notifications', () => {
      render(<ProviderNotifications />)
      
      // Payment notification should not have action buttons
      const paymentCard = screen.getByText('Payment Received').closest('div')
      expect(paymentCard).toBeInTheDocument()
      
      // Should not have Accept/Decline buttons in the payment card
      const paymentCardButtons = paymentCard?.querySelectorAll('button')
      const hasAcceptButton = Array.from(paymentCardButtons || []).some(
        button => button.textContent?.includes('Accept')
      )
      expect(hasAcceptButton).toBeFalsy()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ProviderNotifications />)
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
      
      // Check for proper button roles
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ProviderNotifications />)
      
      // Tab through interactive elements
      await user.tab()
      expect(screen.getByText('Refresh')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('Mark all as read')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('Settings')).toHaveFocus()
    })
  })

  describe('Real-time Updates', () => {
    it('subscribes to real-time notifications on mount', () => {
      const mockSubscribe = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        subscribeToRealTime: mockSubscribe,
      })

      render(<ProviderNotifications />)
      
      // The hook should handle subscription, we just verify it's called
      expect(mockSubscribe).toHaveBeenCalled()
    })

    it('unsubscribes from real-time notifications on unmount', () => {
      const mockUnsubscribe = jest.fn()
      mockUseProviderNotifications.mockReturnValue({
        ...defaultMockReturn,
        unsubscribeFromRealTime: mockUnsubscribe,
      })

      const { unmount } = render(<ProviderNotifications />)
      unmount()
      
      // The hook should handle unsubscription
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})