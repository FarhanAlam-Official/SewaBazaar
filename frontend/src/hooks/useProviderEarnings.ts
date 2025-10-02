import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'
import { showToast } from '@/components/ui/enhanced-toast'
import type { 
  ProviderEarningsAnalytics, 
  ProviderEarningsOverview, 
  ProviderEarningsHistory, 
  ProviderPayoutSummary, 
  ProviderFinancialAnalytics 
} from '@/types/provider'

interface UseProviderEarningsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  initialLoad?: boolean
  defaultPeriod?: 'week' | 'month' | 'quarter' | 'year'
}

interface EarningsExportOptions {
  format: 'csv' | 'pdf'
  period?: string
}

interface PayoutRequest {
  amount: number
  method: string
  accountDetails?: any
}

interface UseProviderEarningsReturn {
  // Data
  earnings: any | null
  earningsAnalytics: ProviderEarningsAnalytics | null
  detailedAnalytics: any | null
  payoutHistory: any[]
  earningsOverview: ProviderEarningsOverview | null
  earningsHistory: ProviderEarningsHistory | null
  payoutSummary: ProviderPayoutSummary | null
  financialAnalytics: ProviderFinancialAnalytics | null
  
  // Loading states
  loading: boolean
  analyticsLoading: boolean
  exportLoading: boolean
  payoutLoading: boolean
  
  // Error states
  error: string | null
  
  // Actions
  refreshEarnings: () => Promise<void>
  refreshEarningsAnalytics: (period?: 'week' | 'month' | 'quarter' | 'year') => Promise<void>
  refreshDetailedAnalytics: (period?: 'week' | 'month' | 'quarter' | 'year', breakdown?: 'daily' | 'weekly' | 'monthly') => Promise<void>
  refreshPayoutHistory: () => Promise<void>
  refreshEarningsOverview: (period?: 'week' | 'month' | 'quarter' | 'year') => Promise<void>
  refreshEarningsHistory: (params?: any) => Promise<void>
  refreshPayoutSummary: () => Promise<void>
  refreshFinancialAnalytics: (params?: any) => Promise<void>
  exportEarningsReport: (options: EarningsExportOptions) => Promise<Blob>
  requestPayout: (request: PayoutRequest) => Promise<any>
  
  // Utility functions
  getTotalEarnings: () => number
  getPendingEarnings: () => number
  getThisMonthEarnings: () => number
  getEarningsGrowth: () => number
  getAveragePerBooking: () => number
}

// Helper function to map extended period types to basic period types for API calls
const mapPeriodForApi = (period: 'week' | 'month' | 'quarter' | 'year'): 'week' | 'month' | 'year' => {
  if (period === 'quarter') {
    return 'month' // Map quarter to month for API calls
  }
  return period as 'week' | 'month' | 'year'
}

export const useProviderEarnings = (
  options: UseProviderEarningsOptions = {}
): UseProviderEarningsReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    initialLoad = true,
    defaultPeriod = 'month'
  } = options

  // State
  const [earnings, setEarnings] = useState<any | null>(null)
  const [earningsAnalytics, setEarningsAnalytics] = useState<ProviderEarningsAnalytics | null>(null)
  const [detailedAnalytics, setDetailedAnalytics] = useState<any | null>(null)
  const [payoutHistory, setPayoutHistory] = useState<any[]>([])
  const [earningsOverview, setEarningsOverview] = useState<ProviderEarningsOverview | null>(null)
  const [earningsHistory, setEarningsHistory] = useState<ProviderEarningsHistory | null>(null)
  const [payoutSummary, setPayoutSummary] = useState<ProviderPayoutSummary | null>(null)
  const [financialAnalytics, setFinancialAnalytics] = useState<ProviderFinancialAnalytics | null>(null)
  const [loading, setLoading] = useState(initialLoad)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refresh earnings
  const refreshEarnings = useCallback(async () => {
    try {
      setError(null)
      if (!analyticsLoading && !exportLoading && !payoutLoading) {
        setLoading(true)
      }
      
      const data = await providerApi.getProviderEarnings()
      setEarnings(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch earnings'
      setError(errorMessage)
      console.error('Error refreshing earnings:', err)
      
      showToast.error({
        title: 'Error Loading Earnings',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }, [analyticsLoading, exportLoading, payoutLoading])

  // Refresh earnings analytics
  const refreshEarningsAnalytics = useCallback(async (period: 'week' | 'month' | 'quarter' | 'year' = defaultPeriod) => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      
      const mappedPeriod = mapPeriodForApi(period)
      const data = await providerApi.getEarningsAnalytics(mappedPeriod)
      setEarningsAnalytics(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch earnings analytics'
      setError(errorMessage)
      console.error('Error refreshing earnings analytics:', err)
      
      showToast.error({
        title: 'Error Loading Analytics',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [defaultPeriod])

  // Refresh detailed analytics
  const refreshDetailedAnalytics = useCallback(async (
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    breakdown: 'daily' | 'weekly' | 'monthly' = 'daily'
  ) => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      
      // For now, we'll use the earnings analytics endpoint which provides the data we need
      const mappedPeriod = mapPeriodForApi(period)
      const data = await providerApi.getEarningsAnalytics(mappedPeriod)
      setDetailedAnalytics(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch detailed analytics'
      setError(errorMessage)
      console.error('Error refreshing detailed analytics:', err)
      
      showToast.error({
        title: 'Error Loading Detailed Analytics',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Refresh payout history
  const refreshPayoutHistory = useCallback(async () => {
    try {
      setError(null)
      
      const data = await providerApi.getPayoutHistory()
      setPayoutHistory(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch payout history'
      console.error('Error refreshing payout history:', err)
      
      // Don't show toast for payout history as it's not critical
    }
  }, [])

  // Refresh earnings overview
  const refreshEarningsOverview = useCallback(async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      
      const data = await providerApi.getProviderEarningsOverview(period)
      setEarningsOverview(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch earnings overview'
      setError(errorMessage)
      console.error('Error refreshing earnings overview:', err)
      
      showToast.error({
        title: 'Error Loading Earnings Overview',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Refresh earnings history
  const refreshEarningsHistory = useCallback(async (params?: any) => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      
      const data = await providerApi.getProviderEarningsHistory(params)
      setEarningsHistory(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch earnings history'
      setError(errorMessage)
      console.error('Error refreshing earnings history:', err)
      
      showToast.error({
        title: 'Error Loading Earnings History',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Refresh payout summary
  const refreshPayoutSummary = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      
      const data = await providerApi.getProviderPayoutSummary()
      setPayoutSummary(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch payout summary'
      setError(errorMessage)
      console.error('Error refreshing payout summary:', err)
      
      showToast.error({
        title: 'Error Loading Payout Summary',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Refresh financial analytics
  const refreshFinancialAnalytics = useCallback(async (params?: any) => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      
      const data = await providerApi.getProviderFinancialAnalytics(params)
      setFinancialAnalytics(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch financial analytics'
      setError(errorMessage)
      console.error('Error refreshing financial analytics:', err)
      
      showToast.error({
        title: 'Error Loading Financial Analytics',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Export earnings report
  const exportEarningsReport = useCallback(async (options: EarningsExportOptions): Promise<Blob> => {
    try {
      setExportLoading(true)
      setError(null)
      
      const blob = await providerApi.exportEarningsReport(options.format, options.period)
      
      showToast.success({
        title: 'Report Exported',
        description: `Earnings report exported as ${options.format.toUpperCase()}`,
        duration: 3000
      })
      
      return blob
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to export earnings report'
      setError(errorMessage)
      console.error('Error exporting earnings report:', err)
      
      showToast.error({
        title: 'Export Failed',
        description: errorMessage,
        duration: 5000
      })
      throw err
    } finally {
      setExportLoading(false)
    }
  }, [])

  // Request payout
  const requestPayout = useCallback(async (request: PayoutRequest): Promise<any> => {
    try {
      setPayoutLoading(true)
      setError(null)
      
      const result = await providerApi.requestProviderPayout(
        request.amount, 
        request.method, 
        request.accountDetails
      )
      
      // Refresh payout summary and earnings
      await Promise.all([
        refreshPayoutSummary(),
        refreshEarnings()
      ])
      
      showToast.success({
        title: 'Payout Requested',
        description: `Payout request for Rs. ${request.amount} has been submitted`,
        duration: 3000
      })
      
      return result
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to request payout'
      setError(errorMessage)
      console.error('Error requesting payout:', err)
      
      showToast.error({
        title: 'Payout Request Failed',
        description: errorMessage,
        duration: 5000
      })
      throw err
    } finally {
      setPayoutLoading(false)
    }
  }, [refreshPayoutSummary, refreshEarnings])

  // Utility functions
  const getTotalEarnings = useCallback((): number => {
    return earnings?.total_earnings || earningsOverview?.all_time.net_earnings || earningsAnalytics?.total_earnings || 0
  }, [earnings, earningsOverview, earningsAnalytics])

  const getPendingEarnings = useCallback((): number => {
    return earnings?.pending_earnings || payoutSummary?.payout_summary.pending_payout || 0
  }, [earnings, payoutSummary])

  const getThisMonthEarnings = useCallback((): number => {
    return earnings?.this_month_earnings || earningsOverview?.current_period.net_earnings || 0
  }, [earnings, earningsOverview])

  const getEarningsGrowth = useCallback((): number => {
    if (earningsOverview) {
      return earningsOverview.growth.percentage
    }
    
    if (!detailedAnalytics?.earnings_data || detailedAnalytics.earnings_data.length < 2) {
      return 0
    }
    
    const currentPeriod = detailedAnalytics.earnings_data[detailedAnalytics.earnings_data.length - 1]
    const previousPeriod = detailedAnalytics.earnings_data[detailedAnalytics.earnings_data.length - 2]
    
    if (!previousPeriod.earnings || previousPeriod.earnings === 0) {
      return currentPeriod.earnings > 0 ? 100 : 0
    }
    
    return ((currentPeriod.earnings - previousPeriod.earnings) / previousPeriod.earnings) * 100
  }, [detailedAnalytics, earningsOverview])

  const getAveragePerBooking = useCallback((): number => {
    return earningsAnalytics?.average_per_booking || earningsOverview?.current_period.average_per_booking || 0
  }, [earningsAnalytics, earningsOverview])

  // Debounced refresh function to prevent multiple rapid API calls
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const debouncedRefresh = useCallback((refreshFn: () => Promise<void>, delay: number = 300) => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
    }
    
    const timeout = setTimeout(() => {
      refreshFn()
    }, delay)
    
    setRefreshTimeout(timeout)
  }, [refreshTimeout])

  // Optimized initial load - load critical data first, then additional data
  useEffect(() => {
    if (initialLoad) {
      const loadData = async () => {
        try {
          // Indicate overall page loading while essential data is fetched
          setLoading(true)

          // Load the most critical data first (earnings overview contains most stats)
          await refreshEarningsOverview()

          // Load secondary data in parallel for faster loading
          await Promise.all([
            refreshPayoutSummary(),
            refreshDetailedAnalytics()
          ])
        } catch (error) {
          console.error('Error loading earnings data:', error)
        } finally {
          // Ensure UI unblocks once initial batch completes
          setLoading(false)
        }
      }

      loadData()
    }
  }, [initialLoad, refreshEarningsOverview, refreshPayoutSummary, refreshDetailedAnalytics])

  // Optimized auto refresh - refresh essential data with reasonable frequency
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Refresh earnings overview (most important data)
      refreshEarningsOverview().catch(error => {
        console.error('Auto-refresh error:', error)
      })
    }, refreshInterval)

    return () => {
      clearInterval(interval)
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
    }
  }, [autoRefresh, refreshInterval, refreshEarningsOverview, refreshTimeout])

  return {
    // Data
    earnings,
    earningsAnalytics,
    detailedAnalytics,
    payoutHistory,
    earningsOverview,
    earningsHistory,
    payoutSummary,
    financialAnalytics,
    
    // Loading states
    loading,
    analyticsLoading,
    exportLoading,
    payoutLoading,
    
    // Error states
    error,
    
    // Actions
    refreshEarnings,
    refreshEarningsAnalytics,
    refreshDetailedAnalytics,
    refreshPayoutHistory,
    refreshEarningsOverview,
    refreshEarningsHistory,
    refreshPayoutSummary,
    refreshFinancialAnalytics,
    exportEarningsReport,
    requestPayout,
    
    // Utility functions
    getTotalEarnings,
    getPendingEarnings,
    getThisMonthEarnings,
    getEarningsGrowth,
    getAveragePerBooking
  }
}

export default useProviderEarnings