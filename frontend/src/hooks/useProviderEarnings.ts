import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'
import { showToast } from '@/components/ui/enhanced-toast'
import type { ProviderEarningsAnalytics } from '@/types/provider'

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
}

interface UseProviderEarningsReturn {
  // Data
  earnings: any | null
  earningsAnalytics: ProviderEarningsAnalytics | null
  detailedAnalytics: any | null
  payoutHistory: any[]
  
  // Loading states
  loading: boolean
  analyticsLoading: boolean
  exportLoading: boolean
  payoutLoading: boolean
  
  // Error states
  error: string | null
  
  // Actions
  refreshEarnings: () => Promise<void>
  refreshEarningsAnalytics: (period?: 'week' | 'month' | 'year') => Promise<void>
  refreshDetailedAnalytics: (period?: 'week' | 'month' | 'quarter' | 'year', breakdown?: 'daily' | 'weekly' | 'monthly') => Promise<void>
  refreshPayoutHistory: () => Promise<void>
  exportEarningsReport: (options: EarningsExportOptions) => Promise<Blob>
  requestPayout: (request: PayoutRequest) => Promise<any>
  
  // Utility functions
  getTotalEarnings: () => number
  getPendingEarnings: () => number
  getThisMonthEarnings: () => number
  getEarningsGrowth: () => number
  getAveragePerBooking: () => number
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
  const refreshEarningsAnalytics = useCallback(async (period: 'week' | 'month' | 'year' = defaultPeriod) => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      
      const data = await providerApi.getEarningsAnalytics(period)
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
      
      const data = await providerApi.getDetailedEarningsAnalytics(period, breakdown)
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
      
      const result = await providerApi.requestPayout(request.amount, request.method)
      
      // Refresh payout history and earnings
      await Promise.all([
        refreshPayoutHistory(),
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
  }, [refreshPayoutHistory, refreshEarnings])

  // Utility functions
  const getTotalEarnings = useCallback((): number => {
    return earnings?.total_earnings || earningsAnalytics?.total_earnings || 0
  }, [earnings, earningsAnalytics])

  const getPendingEarnings = useCallback((): number => {
    return earnings?.pending_earnings || 0
  }, [earnings])

  const getThisMonthEarnings = useCallback((): number => {
    return earnings?.this_month_earnings || 0
  }, [earnings])

  const getEarningsGrowth = useCallback((): number => {
    if (!detailedAnalytics?.earnings_data || detailedAnalytics.earnings_data.length < 2) {
      return 0
    }
    
    const currentPeriod = detailedAnalytics.earnings_data[detailedAnalytics.earnings_data.length - 1]
    const previousPeriod = detailedAnalytics.earnings_data[detailedAnalytics.earnings_data.length - 2]
    
    if (!previousPeriod.earnings || previousPeriod.earnings === 0) {
      return currentPeriod.earnings > 0 ? 100 : 0
    }
    
    return ((currentPeriod.earnings - previousPeriod.earnings) / previousPeriod.earnings) * 100
  }, [detailedAnalytics])

  const getAveragePerBooking = useCallback((): number => {
    return earningsAnalytics?.average_per_booking || 0
  }, [earningsAnalytics])

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      Promise.all([
        refreshEarnings(),
        refreshEarningsAnalytics(),
        refreshDetailedAnalytics(),
        refreshPayoutHistory()
      ])
    }
  }, [initialLoad, refreshEarnings, refreshEarningsAnalytics, refreshDetailedAnalytics, refreshPayoutHistory])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      Promise.all([
        refreshEarnings(),
        refreshEarningsAnalytics()
      ])
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshEarnings, refreshEarningsAnalytics])

  return {
    // Data
    earnings,
    earningsAnalytics,
    detailedAnalytics,
    payoutHistory,
    
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