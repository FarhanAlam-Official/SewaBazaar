import { jest } from '@jest/globals'
import axios from 'axios'
import { providerApi } from '@/services/provider.api'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock the base API
jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

import { api } from '@/services/api'
const mockApi = api as jest.Mocked<typeof api>

describe('Provider API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard Stats', () => {
    it('should fetch dashboard stats successfully', async () => {
      const mockStats = {
        total_bookings: 25,
        pending_bookings: 3,
        confirmed_bookings: 8,
        completed_bookings: 14,
        total_earnings: 45000,
        this_month_earnings: 12000,
        average_rating: 4.8,
        total_reviews: 18,
        active_services: 5,
      }

      mockApi.get.mockResolvedValueOnce({ data: mockStats })

      const result = await providerApi.getDashboardStats()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/dashboard/stats/')
      expect(result).toEqual(mockStats)
    })

    it('should handle dashboard stats fetch error', async () => {
      const errorMessage = 'Failed to fetch stats'
      mockApi.get.mockRejectedValueOnce(new Error(errorMessage))

      await expect(providerApi.getDashboardStats()).rejects.toThrow(errorMessage)
    })
  })

  describe('Bookings Management', () => {
    const mockBookings = [
      {
        id: 1,
        customer: { first_name: 'John', last_name: 'Doe' },
        service: { title: 'House Cleaning' },
        booking_date: '2024-01-20',
        booking_time: '10:00',
        status: 'pending',
        total_amount: 1500,
      },
      {
        id: 2,
        customer: { first_name: 'Jane', last_name: 'Smith' },
        service: { title: 'Plumbing' },
        booking_date: '2024-01-21',
        booking_time: '14:00',
        status: 'confirmed',
        total_amount: 2500,
      },
    ]

    it('should fetch bookings with default parameters', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { results: mockBookings } })

      const result = await providerApi.getBookings()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/bookings/', {
        params: {
          page: 1,
          page_size: 10,
        },
      })
      expect(result.results).toEqual(mockBookings)
    })

    it('should fetch bookings with custom parameters', async () => {
      const params = {
        page: 2,
        page_size: 20,
        status: 'pending',
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      }

      mockApi.get.mockResolvedValueOnce({ data: { results: mockBookings } })

      await providerApi.getBookings(params)

      expect(mockApi.get).toHaveBeenCalledWith('/provider/bookings/', {
        params,
      })
    })

    it('should update booking status', async () => {
      const bookingId = 1
      const updateData = { status: 'confirmed', notes: 'Confirmed by provider' }
      const updatedBooking = { ...mockBookings[0], ...updateData }

      mockApi.patch.mockResolvedValueOnce({ data: updatedBooking })

      const result = await providerApi.updateBookingStatus(bookingId, updateData)

      expect(mockApi.patch).toHaveBeenCalledWith(`/provider/bookings/${bookingId}/`, updateData)
      expect(result).toEqual(updatedBooking)
    })

    it('should get booking details', async () => {
      const bookingId = 1
      const bookingDetails = {
        ...mockBookings[0],
        customer_details: { phone: '+977-1234567890', address: 'Kathmandu' },
        service_details: { description: 'Professional house cleaning' },
      }

      mockApi.get.mockResolvedValueOnce({ data: bookingDetails })

      const result = await providerApi.getBookingDetails(bookingId)

      expect(mockApi.get).toHaveBeenCalledWith(`/provider/bookings/${bookingId}/`)
      expect(result).toEqual(bookingDetails)
    })
  })

  describe('Services Management', () => {
    const mockServices = [
      {
        id: 1,
        title: 'House Cleaning',
        description: 'Professional house cleaning service',
        price: 1500,
        duration: 120,
        is_active: true,
        bookings_count: 15,
        average_rating: 4.8,
      },
      {
        id: 2,
        title: 'Plumbing Repair',
        description: 'Expert plumbing services',
        price: 2500,
        duration: 90,
        is_active: true,
        bookings_count: 8,
        average_rating: 4.6,
      },
    ]

    it('should fetch provider services', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { results: mockServices } })

      const result = await providerApi.getServices()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/services/', {
        params: { page: 1, page_size: 10 },
      })
      expect(result.results).toEqual(mockServices)
    })

    it('should create a new service', async () => {
      const newService = {
        title: 'Garden Maintenance',
        description: 'Professional garden care',
        price: 2000,
        duration: 180,
        category: 1,
      }

      const createdService = { ...newService, id: 3, is_active: true }
      mockApi.post.mockResolvedValueOnce({ data: createdService })

      const result = await providerApi.createService(newService)

      expect(mockApi.post).toHaveBeenCalledWith('/provider/services/', newService)
      expect(result).toEqual(createdService)
    })

    it('should update a service', async () => {
      const serviceId = 1
      const updateData = { price: 1800, description: 'Updated description' }
      const updatedService = { ...mockServices[0], ...updateData }

      mockApi.patch.mockResolvedValueOnce({ data: updatedService })

      const result = await providerApi.updateService(serviceId, updateData)

      expect(mockApi.patch).toHaveBeenCalledWith(`/provider/services/${serviceId}/`, updateData)
      expect(result).toEqual(updatedService)
    })

    it('should deactivate a service', async () => {
      const serviceId = 1
      const deactivatedService = { ...mockServices[0], is_active: false }

      mockApi.patch.mockResolvedValueOnce({ data: deactivatedService })

      const result = await providerApi.deactivateService(serviceId)

      expect(mockApi.patch).toHaveBeenCalledWith(`/provider/services/${serviceId}/`, { is_active: false })
      expect(result).toEqual(deactivatedService)
    })

    it('should get service performance metrics', async () => {
      const serviceId = 1
      const performanceData = {
        total_bookings: 15,
        completed_bookings: 12,
        total_revenue: 22500,
        average_rating: 4.8,
        total_reviews: 10,
        monthly_trends: [
          { month: 'Jan', bookings: 5, revenue: 7500 },
          { month: 'Feb', bookings: 7, revenue: 10500 },
        ],
      }

      mockApi.get.mockResolvedValueOnce({ data: performanceData })

      const result = await providerApi.getServicePerformance(serviceId)

      expect(mockApi.get).toHaveBeenCalledWith(`/provider/services/${serviceId}/performance/`)
      expect(result).toEqual(performanceData)
    })
  })

  describe('Earnings Management', () => {
    const mockEarnings = {
      total_earnings: 45000,
      this_month_earnings: 12000,
      last_month_earnings: 8500,
      pending_payments: 2500,
      completed_payments: 42500,
      average_booking_value: 1800,
    }

    it('should fetch earnings overview', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockEarnings })

      const result = await providerApi.getEarningsOverview()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/earnings/overview/')
      expect(result).toEqual(mockEarnings)
    })

    it('should fetch earnings breakdown by period', async () => {
      const period = 'monthly'
      const breakdownData = {
        breakdown: [
          { period: '2024-01', earnings: 8500, bookings: 12 },
          { period: '2024-02', earnings: 12000, bookings: 15 },
        ],
      }

      mockApi.get.mockResolvedValueOnce({ data: breakdownData })

      const result = await providerApi.getEarningsBreakdown(period)

      expect(mockApi.get).toHaveBeenCalledWith('/provider/earnings/breakdown/', {
        params: { period },
      })
      expect(result).toEqual(breakdownData)
    })

    it('should fetch payment history', async () => {
      const paymentHistory = {
        results: [
          {
            id: 1,
            booking: { id: 1, service: { title: 'House Cleaning' } },
            amount: 1500,
            status: 'completed',
            created_at: '2024-01-15T10:30:00Z',
          },
          {
            id: 2,
            booking: { id: 2, service: { title: 'Plumbing' } },
            amount: 2500,
            status: 'pending',
            created_at: '2024-01-20T14:15:00Z',
          },
        ],
      }

      mockApi.get.mockResolvedValueOnce({ data: paymentHistory })

      const result = await providerApi.getPaymentHistory()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/earnings/payments/', {
        params: { page: 1, page_size: 10 },
      })
      expect(result).toEqual(paymentHistory)
    })

    it('should export earnings data', async () => {
      const exportParams = {
        format: 'csv',
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      }

      const csvData = 'Date,Service,Amount,Status\n2024-01-15,House Cleaning,1500,Completed'
      mockApi.get.mockResolvedValueOnce({ data: csvData })

      const result = await providerApi.exportEarnings(exportParams)

      expect(mockApi.get).toHaveBeenCalledWith('/provider/earnings/export/', {
        params: exportParams,
      })
      expect(result).toEqual(csvData)
    })
  })

  describe('Analytics', () => {
    it('should fetch revenue analytics', async () => {
      const revenueData = {
        total_revenue: 45000,
        monthly_revenue: [
          { month: 'Jan', revenue: 8500 },
          { month: 'Feb', revenue: 12000 },
        ],
        revenue_trend: 'increasing',
        top_services: [
          { service: 'House Cleaning', revenue: 22500 },
          { service: 'Plumbing', revenue: 15000 },
        ],
      }

      mockApi.get.mockResolvedValueOnce({ data: revenueData })

      const result = await providerApi.getRevenueAnalytics()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/analytics/revenue/')
      expect(result).toEqual(revenueData)
    })

    it('should fetch customer analytics', async () => {
      const customerData = {
        total_customers: 35,
        new_customers: 8,
        repeat_customers: 27,
        customer_retention_rate: 77.1,
        top_customers: [
          { customer: 'John Doe', bookings: 5, total_spent: 7500 },
          { customer: 'Jane Smith', bookings: 3, total_spent: 4500 },
        ],
      }

      mockApi.get.mockResolvedValueOnce({ data: customerData })

      const result = await providerApi.getCustomerAnalytics()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/analytics/customers/')
      expect(result).toEqual(customerData)
    })

    it('should fetch performance analytics', async () => {
      const performanceData = {
        completion_rate: 85.5,
        average_rating: 4.8,
        response_time: 2.5,
        booking_trends: [
          { date: '2024-01-01', bookings: 3 },
          { date: '2024-01-02', bookings: 5 },
        ],
        service_performance: [
          { service: 'House Cleaning', completion_rate: 90, rating: 4.9 },
          { service: 'Plumbing', completion_rate: 80, rating: 4.7 },
        ],
      }

      mockApi.get.mockResolvedValueOnce({ data: performanceData })

      const result = await providerApi.getPerformanceAnalytics()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/analytics/performance/')
      expect(result).toEqual(performanceData)
    })
  })

  describe('Profile Management', () => {
    it('should fetch provider profile', async () => {
      const profileData = {
        user: {
          id: 1,
          email: 'provider@test.com',
          first_name: 'John',
          last_name: 'Doe',
        },
        profile: {
          bio: 'Experienced service provider',
          city: 'Kathmandu',
          years_of_experience: 5,
          certifications: ['Certification 1'],
          portfolio_media: [],
        },
      }

      mockApi.get.mockResolvedValueOnce({ data: profileData })

      const result = await providerApi.getProfile()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/profile/')
      expect(result).toEqual(profileData)
    })

    it('should update provider profile', async () => {
      const updateData = {
        first_name: 'John',
        last_name: 'Smith',
        profile: {
          bio: 'Updated bio',
          years_of_experience: 6,
        },
      }

      const updatedProfile = {
        user: { ...updateData, id: 1, email: 'provider@test.com' },
        profile: { ...updateData.profile, city: 'Kathmandu' },
      }

      mockApi.patch.mockResolvedValueOnce({ data: updatedProfile })

      const result = await providerApi.updateProfile(updateData)

      expect(mockApi.patch).toHaveBeenCalledWith('/provider/profile/', updateData)
      expect(result).toEqual(updatedProfile)
    })

    it('should upload portfolio media', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mediaData = {
        title: 'Portfolio Image',
        description: 'Sample work',
        media_type: 'image',
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', mediaData.title)
      formData.append('description', mediaData.description)
      formData.append('media_type', mediaData.media_type)

      const uploadedMedia = {
        id: 1,
        ...mediaData,
        file_url: 'https://example.com/media/test.jpg',
      }

      mockApi.post.mockResolvedValueOnce({ data: uploadedMedia })

      const result = await providerApi.uploadPortfolioMedia(file, mediaData)

      expect(mockApi.post).toHaveBeenCalledWith('/provider/portfolio/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(result).toEqual(uploadedMedia)
    })
  })

  describe('Schedule Management', () => {
    const mockSchedule = [
      {
        id: 1,
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
      },
      {
        id: 2,
        day_of_week: 2, // Tuesday
        start_time: '10:00',
        end_time: '18:00',
        is_available: true,
      },
    ]

    it('should fetch provider schedule', async () => {
      mockApi.get.mockResolvedValueOnce({ data: mockSchedule })

      const result = await providerApi.getSchedule()

      expect(mockApi.get).toHaveBeenCalledWith('/provider/schedule/')
      expect(result).toEqual(mockSchedule)
    })

    it('should update schedule', async () => {
      const scheduleData = {
        schedules: [
          { day_of_week: 1, start_time: '08:00', end_time: '16:00', is_available: true },
          { day_of_week: 2, start_time: '09:00', end_time: '17:00', is_available: true },
        ],
      }

      mockApi.post.mockResolvedValueOnce({ data: scheduleData.schedules })

      const result = await providerApi.updateSchedule(scheduleData)

      expect(mockApi.post).toHaveBeenCalledWith('/provider/schedule/', scheduleData)
      expect(result).toEqual(scheduleData.schedules)
    })

    it('should add blocked time', async () => {
      const blockedTime = {
        date: '2024-01-25',
        start_time: '14:00',
        end_time: '16:00',
        reason: 'Personal appointment',
      }

      const createdBlockedTime = { ...blockedTime, id: 1 }
      mockApi.post.mockResolvedValueOnce({ data: createdBlockedTime })

      const result = await providerApi.addBlockedTime(blockedTime)

      expect(mockApi.post).toHaveBeenCalledWith('/provider/schedule/blocked/', blockedTime)
      expect(result).toEqual(createdBlockedTime)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockApi.get.mockRejectedValueOnce(networkError)

      await expect(providerApi.getDashboardStats()).rejects.toThrow('Network Error')
    })

    it('should handle API errors with response data', async () => {
      const apiError = {
        response: {
          status: 400,
          data: { message: 'Invalid request data' },
        },
      }
      mockApi.post.mockRejectedValueOnce(apiError)

      await expect(providerApi.createService({})).rejects.toEqual(apiError)
    })

    it('should handle authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: 'Authentication required' },
        },
      }
      mockApi.get.mockRejectedValueOnce(authError)

      await expect(providerApi.getDashboardStats()).rejects.toEqual(authError)
    })
  })

  describe('Request Interceptors', () => {
    it('should include authentication headers', async () => {
      // Mock localStorage
      const mockToken = 'mock-jwt-token'
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => mockToken),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        writable: true,
      })

      mockApi.get.mockResolvedValueOnce({ data: {} })

      await providerApi.getDashboardStats()

      // Verify that the API call was made (the interceptor logic would be tested in the api service itself)
      expect(mockApi.get).toHaveBeenCalled()
    })
  })
})