import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import ProviderDashboard from '@/app/dashboard/provider/page'

// Mock the hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'provider@test.com',
      role: 'provider',
      first_name: 'John',
      last_name: 'Doe',
    },
    loading: false,
  }),
}))

jest.mock('@/hooks/useProviderDashboard', () => ({
  useProviderDashboard: () => ({
    stats: {
      total_bookings: 25,
      pending_bookings: 3,
      confirmed_bookings: 8,
      completed_bookings: 14,
      total_earnings: 45000,
      this_month_earnings: 12000,
      average_rating: 4.8,
      total_reviews: 18,
      active_services: 5,
    },
    recentBookings: [
      {
        id: 1,
        customer: { first_name: 'Alice', last_name: 'Johnson' },
        service: { title: 'House Cleaning' },
        booking_date: '2024-01-20',
        booking_time: '10:00',
        status: 'pending',
        total_amount: 1500,
      },
      {
        id: 2,
        customer: { first_name: 'Bob', last_name: 'Smith' },
        service: { title: 'Plumbing Repair' },
        booking_date: '2024-01-19',
        booking_time: '14:00',
        status: 'confirmed',
        total_amount: 2500,
      },
    ],
    loading: false,
    error: null,
    refreshStats: jest.fn(),
  }),
}))

jest.mock('@/hooks/useProviderNotifications', () => ({
  useProviderNotifications: () => ({
    unreadCount: 5,
    notifications: [],
    loading: false,
  }),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock chart components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}))

describe('ProviderDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dashboard with welcome message', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument()
      expect(screen.getByText("Here's what's happening with your services today")).toBeInTheDocument()
    })

    it('displays all stat cards with correct values', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByText('Total Bookings')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      
      expect(screen.getByText('Pending Requests')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      
      expect(screen.getByText('This Month Earnings')).toBeInTheDocument()
      expect(screen.getByText('₹12,000')).toBeInTheDocument()
      
      expect(screen.getByText('Average Rating')).toBeInTheDocument()
      expect(screen.getByText('4.8')).toBeInTheDocument()
    })

    it('shows notification badge with unread count', () => {
      render(<ProviderDashboard />)
      
      const notificationBadge = screen.getByText('5')
      expect(notificationBadge).toBeInTheDocument()
      expect(notificationBadge.closest('div')).toHaveClass('bg-red-500')
    })

    it('displays recent bookings section', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByText('Recent Bookings')).toBeInTheDocument()
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('House Cleaning')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('Plumbing Repair')).toBeInTheDocument()
    })

    it('renders charts section', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByText('Earnings Overview')).toBeInTheDocument()
      expect(screen.getByText('Booking Trends')).toBeInTheDocument()
      expect(screen.getAllByTestId('chart-container')).toHaveLength(2)
    })
  })

  describe('Navigation', () => {
    it('navigates to bookings when view all bookings is clicked', async () => {
      const mockPush = jest.fn()
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }))

      const user = userEvent.setup()
      render(<ProviderDashboard />)
      
      const viewAllButton = screen.getByText('View All Bookings')
      await user.click(viewAllButton)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/provider/bookings')
    })

    it('navigates to notifications when notification bell is clicked', async () => {
      const mockPush = jest.fn()
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }))

      const user = userEvent.setup()
      render(<ProviderDashboard />)
      
      const notificationBell = screen.getByRole('button', { name: /notifications/i })
      await user.click(notificationBell)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/provider/notifications')
    })

    it('navigates to earnings when earnings card is clicked', async () => {
      const mockPush = jest.fn()
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }))

      const user = userEvent.setup()
      render(<ProviderDashboard />)
      
      const earningsCard = screen.getByText('This Month Earnings').closest('div')
      if (earningsCard) {
        await user.click(earningsCard)
        expect(mockPush).toHaveBeenCalledWith('/dashboard/provider/earnings')
      }
    })
  })

  describe('Booking Status Indicators', () => {
    it('shows correct status badges for bookings', () => {
      render(<ProviderDashboard />)
      
      const pendingBadge = screen.getByText('pending')
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
      
      const confirmedBadge = screen.getByText('confirmed')
      expect(confirmedBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('displays booking amounts correctly formatted', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByText('₹1,500')).toBeInTheDocument()
      expect(screen.getByText('₹2,500')).toBeInTheDocument()
    })

    it('shows booking dates and times', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument()
      expect(screen.getByText('10:00 AM')).toBeInTheDocument()
      expect(screen.getByText('Jan 19, 2024')).toBeInTheDocument()
      expect(screen.getByText('2:00 PM')).toBeInTheDocument()
    })
  })

  describe('Quick Actions', () => {
    it('displays quick action buttons', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByText('Add New Service')).toBeInTheDocument()
      expect(screen.getByText('Update Schedule')).toBeInTheDocument()
      expect(screen.getByText('View Analytics')).toBeInTheDocument()
    })

    it('navigates to correct pages when quick actions are clicked', async () => {
      const mockPush = jest.fn()
      jest.doMock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }))

      const user = userEvent.setup()
      render(<ProviderDashboard />)
      
      const addServiceButton = screen.getByText('Add New Service')
      await user.click(addServiceButton)
      expect(mockPush).toHaveBeenCalledWith('/dashboard/provider/services/new')
      
      const scheduleButton = screen.getByText('Update Schedule')
      await user.click(scheduleButton)
      expect(mockPush).toHaveBeenCalledWith('/dashboard/provider/schedule')
      
      const analyticsButton = screen.getByText('View Analytics')
      await user.click(analyticsButton)
      expect(mockPush).toHaveBeenCalledWith('/dashboard/provider/analytics')
    })
  })

  describe('Loading State', () => {
    it('shows loading state when data is being fetched', () => {
      jest.doMock('@/hooks/useProviderDashboard', () => ({
        useProviderDashboard: () => ({
          stats: null,
          recentBookings: [],
          loading: true,
          error: null,
          refreshStats: jest.fn(),
        }),
      }))

      render(<ProviderDashboard />)
      
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton')).toHaveLength(4) // 4 stat cards
    })
  })

  describe('Error State', () => {
    it('shows error message when data fetch fails', () => {
      jest.doMock('@/hooks/useProviderDashboard', () => ({
        useProviderDashboard: () => ({
          stats: null,
          recentBookings: [],
          loading: false,
          error: 'Failed to load dashboard data',
          refreshStats: jest.fn(),
        }),
      }))

      render(<ProviderDashboard />)
      
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('calls refresh when try again button is clicked', async () => {
      const mockRefresh = jest.fn()
      jest.doMock('@/hooks/useProviderDashboard', () => ({
        useProviderDashboard: () => ({
          stats: null,
          recentBookings: [],
          loading: false,
          error: 'Failed to load dashboard data',
          refreshStats: mockRefresh,
        }),
      }))

      const user = userEvent.setup()
      render(<ProviderDashboard />)
      
      const tryAgainButton = screen.getByText('Try Again')
      await user.click(tryAgainButton)
      
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<ProviderDashboard />)
      
      const statsGrid = screen.getByTestId('stats-grid')
      expect(statsGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4')
    })

    it('shows full layout on desktop screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      render(<ProviderDashboard />)
      
      const chartsSection = screen.getByTestId('charts-section')
      expect(chartsSection).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
    })
  })

  describe('Performance Metrics', () => {
    it('displays performance indicators correctly', () => {
      render(<ProviderDashboard />)
      
      // Check completion rate calculation
      const completionRate = (14 / 25) * 100 // completed / total
      expect(screen.getByText(`${completionRate.toFixed(1)}%`)).toBeInTheDocument()
      
      // Check average rating display
      expect(screen.getByText('4.8')).toBeInTheDocument()
      expect(screen.getByText('(18 reviews)')).toBeInTheDocument()
    })

    it('shows trend indicators for metrics', () => {
      render(<ProviderDashboard />)
      
      // Look for trend arrows or percentage changes
      const trendIndicators = screen.getAllByTestId('trend-indicator')
      expect(trendIndicators.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ProviderDashboard />)
      
      expect(screen.getByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /recent bookings/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /earnings overview/i })).toBeInTheDocument()
    })

    it('has proper ARIA labels for interactive elements', () => {
      render(<ProviderDashboard />)
      
      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      expect(notificationButton).toHaveAttribute('aria-label')
      
      const quickActionButtons = screen.getAllByRole('button')
      quickActionButtons.forEach(button => {
        expect(button).toBeVisible()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ProviderDashboard />)
      
      // Tab through interactive elements
      await user.tab()
      expect(screen.getByRole('button', { name: /notifications/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('Add New Service')).toHaveFocus()
    })
  })

  describe('Data Refresh', () => {
    it('refreshes data when refresh button is clicked', async () => {
      const mockRefresh = jest.fn()
      jest.doMock('@/hooks/useProviderDashboard', () => ({
        useProviderDashboard: () => ({
          stats: {
            total_bookings: 25,
            pending_bookings: 3,
            confirmed_bookings: 8,
            completed_bookings: 14,
            total_earnings: 45000,
            this_month_earnings: 12000,
            average_rating: 4.8,
            total_reviews: 18,
            active_services: 5,
          },
          recentBookings: [],
          loading: false,
          error: null,
          refreshStats: mockRefresh,
        }),
      }))

      const user = userEvent.setup()
      render(<ProviderDashboard />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)
      
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('shows loading indicator during refresh', async () => {
      const mockRefresh = jest.fn()
      jest.doMock('@/hooks/useProviderDashboard', () => ({
        useProviderDashboard: () => ({
          stats: null,
          recentBookings: [],
          loading: true,
          error: null,
          refreshStats: mockRefresh,
        }),
      }))

      render(<ProviderDashboard />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })
})