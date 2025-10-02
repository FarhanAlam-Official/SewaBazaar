import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'

interface AnalyticsOverview {
  totalRevenue: number
  totalCustomers: number
  totalBookings: number
  averageRating: number
  revenueGrowth: number
  customerGrowth: number
  bookingGrowth: number
  ratingChange: number
}

interface RevenueAnalytics {
  period: string
  totalRevenue: number
  totalBookings: number
  averageBookingValue: number
  revenueTimeline: Array<{
    date: string
    revenue: number
    bookings: number
  }>
  revenueByService: Array<{
    serviceName: string
    revenue: number
    bookings: number
    percentage: number
  }>
  paymentMethods: Array<{
    method: string
    revenue: number
    bookings: number
    percentage: number
  }>
}

interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customerRetentionRate: number
  averageBookingsPerCustomer: number
  topCustomers: Array<{
    id: number
    name: string
    email: string
    totalBookings: number
    totalSpent: number
    lastBooking: string
  }>
  customerAcquisition: Array<{
    month: string
    newCustomers: number
    returningCustomers: number
  }>
  customerSegments: Array<{
    segment: string
    count: number
    percentage: number
    averageValue: number
  }>
}

interface ServiceAnalytics {
  totalServices: number
  activeServices: number
  topPerformingServices: Array<{
    id: number
    name: string
    category: string
    bookings: number
    revenue: number
    rating: number
    completionRate: number
    conversionRate: number
  }>
  serviceCategories: Array<{
    category: string
    services: number
    bookings: number
    revenue: number
  }>
  performanceMetrics: {
    averageCompletionRate: number
    averageResponseTime: string
    customerSatisfactionRate: number
  }
}

interface BookingPatterns {
  peakHours: Array<{
    hour: number
    bookings: number
  }>
  peakDays: Array<{
    day: string
    bookings: number
  }>
  seasonalTrends: Array<{
    month: string
    bookings: number
    revenue: number
  }>
  bookingLeadTime: {
    sameDay: number
    nextDay: number
    withinWeek: number
    moreThanWeek: number
  }
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel'
  period: string
  includeCharts: boolean
  sections: string[]
}

interface UseProviderAnalyticsReturn {
  overview: AnalyticsOverview | null
  revenueAnalytics: RevenueAnalytics | null
  customerAnalytics: CustomerAnalytics | null
  serviceAnalytics: ServiceAnalytics | null
  bookingPatterns: BookingPatterns | null
  loading: boolean
  error: string | null
  refreshAnalytics: (period?: string) => Promise<void>
  exportReport: (options: ExportOptions) => Promise<void>
  getDetailedReport: (type: 'revenue' | 'customers' | 'services', period?: string) => Promise<any>
}

export const useProviderAnalytics = (initialPeriod: string = 'month'): UseProviderAnalyticsReturn => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null)
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)
  const [serviceAnalytics, setServiceAnalytics] = useState<ServiceAnalytics | null>(null)
  const [bookingPatterns, setBookingPatterns] = useState<BookingPatterns | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch overview analytics
  const fetchOverview = useCallback(async (period: string = 'month') => {
    try {
      const dashboardStats = await providerApi.getDashboardStats()
      const earningsAnalytics = await providerApi.getEarningsAnalytics(period as 'week' | 'month' | 'year')
      
      // Transform data to overview format
      const overview: AnalyticsOverview = {
        totalRevenue: dashboardStats.earnings?.total || 0,
        totalCustomers: dashboardStats.customers?.unique || 0,
        totalBookings: dashboardStats.bookings?.total || 0,
        averageRating: dashboardStats.ratings?.average_rating || 0,
        revenueGrowth: 12.5, // This would be calculated from trends
        customerGrowth: 8.2,
        bookingGrowth: 15.3,
        ratingChange: 0.2
      }
      
      setOverview(overview)
    } catch (err: any) {
      console.error('Error fetching overview:', err)
    }
  }, [])

  // Fetch revenue analytics
  const fetchRevenueAnalytics = useCallback(async (period: string = 'month') => {
    try {
      const earningsData = await providerApi.getEarningsAnalytics(period as 'week' | 'month' | 'year')
      
      const revenueAnalytics: RevenueAnalytics = {
        period,
        totalRevenue: earningsData.total_earnings,
        totalBookings: earningsData.total_bookings,
        averageBookingValue: earningsData.average_per_booking,
        revenueTimeline: earningsData.earnings_data.map(item => ({
          date: item.period,
          revenue: item.earnings,
          bookings: item.bookings_count
        })),
        revenueByService: [], // Would be populated from service performance data
        paymentMethods: [] // Would be populated from payment method breakdown
      }
      
      setRevenueAnalytics(revenueAnalytics)
    } catch (err: any) {
      console.error('Error fetching revenue analytics:', err)
    }
  }, [])

  // Fetch customer analytics
  const fetchCustomerAnalytics = useCallback(async () => {
    try {
      // This would use a dedicated customer analytics endpoint
      const customerData = await providerApi.getDashboardStats()
      
      const customerAnalytics: CustomerAnalytics = {
        totalCustomers: customerData.customers?.unique || 0,
        newCustomers: 0, // Would be calculated from customer acquisition data
        returningCustomers: customerData.customers?.repeat || 0,
        customerRetentionRate: 0, // Would be calculated
        averageBookingsPerCustomer: 0, // Would be calculated
        topCustomers: [], // Would be fetched from customer endpoint
        customerAcquisition: [], // Would be fetched from trends
        customerSegments: [] // Would be calculated from customer data
      }
      
      setCustomerAnalytics(customerAnalytics)
    } catch (err: any) {
      console.error('Error fetching customer analytics:', err)
    }
  }, [])

  // Fetch service analytics
  const fetchServiceAnalytics = useCallback(async () => {
    try {
      const servicePerformance = await providerApi.getServicePerformance()
      
      const serviceAnalytics: ServiceAnalytics = {
        totalServices: servicePerformance.services?.length || 0,
        activeServices: servicePerformance.services?.filter(s => s.is_active).length || 0,
        topPerformingServices: servicePerformance.services?.map(service => ({
          id: service.id,
          name: service.title,
          category: service.category || 'Unknown',
          bookings: service.bookings_count,
          revenue: service.total_revenue,
          rating: service.average_rating,
          completionRate: service.conversion_rate,
          conversionRate: service.conversion_rate
        })) || [],
        serviceCategories: [], // Would be calculated from service data
        performanceMetrics: {
          averageCompletionRate: 0, // Would be calculated
          averageResponseTime: '2 hours', // Would be fetched from provider profile
          customerSatisfactionRate: 0 // Would be calculated from ratings
        }
      }
      
      setServiceAnalytics(serviceAnalytics)
    } catch (err: any) {
      console.error('Error fetching service analytics:', err)
    }
  }, [])

  // Fetch booking patterns
  const fetchBookingPatterns = useCallback(async () => {
    try {
      // This would use a dedicated booking patterns endpoint
      const patterns: BookingPatterns = {
        peakHours: [], // Would be calculated from booking data
        peakDays: [], // Would be calculated from booking data
        seasonalTrends: [], // Would be calculated from historical data
        bookingLeadTime: {
          sameDay: 0,
          nextDay: 0,
          withinWeek: 0,
          moreThanWeek: 0
        }
      }
      
      setBookingPatterns(patterns)
    } catch (err: any) {
      console.error('Error fetching booking patterns:', err)
    }
  }, [])

  // Refresh all analytics
  const refreshAnalytics = useCallback(async (period: string = 'month') => {
    try {
      setLoading(true)
      setError(null)
      
      await Promise.all([
        fetchOverview(period),
        fetchRevenueAnalytics(period),
        fetchCustomerAnalytics(),
        fetchServiceAnalytics(),
        fetchBookingPatterns()
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics data')
      console.error('Error refreshing analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchOverview, fetchRevenueAnalytics, fetchCustomerAnalytics, fetchServiceAnalytics, fetchBookingPatterns])

  // Export report
  const exportReport = useCallback(async (options: ExportOptions) => {
    try {
      // This would call a backend endpoint to generate and download the report
      const params = new URLSearchParams()
      params.append('format', options.format)
      params.append('period', options.period)
      params.append('include_charts', options.includeCharts.toString())
      params.append('sections', options.sections.join(','))
      
      // For now, we'll create a simple CSV export on the frontend
      if (options.format === 'csv' && revenueAnalytics) {
        const csvContent = generateCSVReport(options)
        downloadFile(csvContent, `analytics-report-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      }
    } catch (err: any) {
      console.error('Error exporting report:', err)
      throw err
    }
  }, [revenueAnalytics])

  // Get detailed report for specific type
  const getDetailedReport = useCallback(async (type: 'revenue' | 'customers' | 'services', period: string = 'month') => {
    try {
      switch (type) {
        case 'revenue':
          return await providerApi.getEarningsAnalytics(period as 'week' | 'month' | 'year')
        case 'customers':
          return await providerApi.getDashboardStats() // Would be a dedicated customer analytics endpoint
        case 'services':
          return await providerApi.getServicePerformance()
        default:
          throw new Error('Invalid report type')
      }
    } catch (err: any) {
      console.error(`Error fetching ${type} report:`, err)
      throw err
    }
  }, [])

  // Generate CSV content
  const generateCSVReport = (options: ExportOptions): string => {
    const sections = []
    
    if (options.sections.includes('overview') && overview) {
      sections.push('Overview')
      sections.push('Total Revenue,Total Customers,Total Bookings,Average Rating')
      sections.push(`${overview.totalRevenue},${overview.totalCustomers},${overview.totalBookings},${overview.averageRating}`)
      sections.push('')
    }
    
    if (options.sections.includes('revenue') && revenueAnalytics) {
      sections.push('Revenue Timeline')
      sections.push('Date,Revenue,Bookings')
      revenueAnalytics.revenueTimeline.forEach(item => {
        sections.push(`${item.date},${item.revenue},${item.bookings}`)
      })
      sections.push('')
    }
    
    return sections.join('\n')
  }

  // Download file helper
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Initial data loading
  useEffect(() => {
    refreshAnalytics(initialPeriod)
  }, [refreshAnalytics, initialPeriod])

  return {
    overview,
    revenueAnalytics,
    customerAnalytics,
    serviceAnalytics,
    bookingPatterns,
    loading,
    error,
    refreshAnalytics,
    exportReport,
    getDetailedReport
  }
}

export default useProviderAnalytics