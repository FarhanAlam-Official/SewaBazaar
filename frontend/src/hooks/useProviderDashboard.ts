import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'
import { showToast } from '@/components/ui/enhanced-toast'
import type {
  ProviderDashboardStats,
  ProviderRecentBookings,
  ProviderEarningsAnalytics,
  ProviderServicePerformance,
  LegacyProviderStats
} from '@/types/provider'

interface UseProviderDashboardOptions {
  useCachedStats?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseProviderDashboardReturn {
  // Data
  stats: ProviderDashboardStats | null
  legacyStats: LegacyProviderStats | null
  recentBookings: ProviderRecentBookings | null
  earningsAnalytics: ProviderEarningsAnalytics | null
  servicePerformance: ProviderServicePerformance | null
  
  // Loading states
  loading: boolean
  statsLoading: boolean
  recentBookingsLoading: boolean
  earningsLoading: boolean
  servicesLoading: boolean
  
  // Error states
  error: string | null
  statsError: string | null
  recentBookingsError: string | null
  earningsError: string | null
  servicesError: string | null
  
  // Actions
  refreshStats: () => Promise<void>
  refreshRecentBookings: () => Promise<void>
  refreshEarningsAnalytics: (period?: 'week' | 'month' | 'year') => Promise<void>
  refreshServicePerformance: () => Promise<void>
  refreshAll: () => Promise<void>
  refreshCache: () => Promise<void>
  
  // Utility functions
  hasData: () => boolean
  isInitialLoading: () => boolean
  hasErrors: () => boolean
  getOverallHealth: () => 'good' | 'warning' | 'error'
}

export const useProviderDashboard = (
  options: UseProviderDashboardOptions = {}
): UseProviderDashboardReturn => {
  const {
    useCachedStats = true,
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options

  // Data states
  const [stats, setStats] = useState<ProviderDashboardStats | null>(null)
  const [legacyStats, setLegacyStats] = useState<LegacyProviderStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<ProviderRecentBookings | null>(null)
  const [earningsAnalytics, setEarningsAnalytics] = useState<ProviderEarningsAnalytics | null>(null)
  const [servicePerformance, setServicePerformance] = useState<ProviderServicePerformance | null>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [recentBookingsLoading, setRecentBookingsLoading] = useState(false)
  const [earningsLoading, setEarningsLoading] = useState(false)
  const [servicesLoading, setServicesLoading] = useState(false)

  // Error states
  const [error, setError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [recentBookingsError, setRecentBookingsError] = useState<string | null>(null)
  const [earningsError, setEarningsError] = useState<string | null>(null)
  const [servicesError, setServicesError] = useState<string | null>(null)

  // Refresh functions
  const refreshStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      setStatsError(null)
      
      const [newStats, newLegacyStats] = await Promise.all([
        useCachedStats ? providerApi.getCachedDashboardStats() : providerApi.getDashboardStats(),
        providerApi.getLegacyDashboardStats()
      ])
      
      setStats(newStats)
      setLegacyStats(newLegacyStats)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch dashboard statistics'
      setStatsError(errorMessage)
      console.error('Error refreshing stats:', err)
      
      showToast.error({
        title: 'Error Loading Dashboard Stats',
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setStatsLoading(false)
    }
  }, [useCachedStats])

  const refreshRecentBookings = useCallback(async () => {
    try {
      setRecentBookingsLoading(true)
      setRecentBookingsError(null)
      
      const data = await providerApi.getRecentBookings(10)
      setRecentBookings(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch recent bookings'
      setRecentBookingsError(errorMessage)
      console.error('Error refreshing recent bookings:', err)
    } finally {
      setRecentBookingsLoading(false)
    }
  }, [])

  const refreshEarningsAnalytics = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      setEarningsLoading(true)
      setEarningsError(null)
      
      const data = await providerApi.getEarningsAnalytics(period)
      setEarningsAnalytics(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch earnings analytics'
      setEarningsError(errorMessage)
      console.error('Error refreshing earnings analytics:', err)
    } finally {
      setEarningsLoading(false)
    }
  }, [])

  const refreshServicePerformance = useCallback(async () => {
    try {
      setServicesLoading(true)
      setServicesError(null)
      
      const data = await providerApi.getServicePerformance()
      setServicePerformance(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch service performance'
      setServicesError(errorMessage)
      console.error('Error refreshing service performance:', err)
    } finally {
      setServicesLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        refreshStats(),
        refreshRecentBookings(),
        refreshEarningsAnalytics(),
        refreshServicePerformance()
      ])
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to refresh dashboard data'
      setError(errorMessage)
      console.error('Error refreshing all data:', err)
    } finally {
      setLoading(false)
    }
  }, [refreshStats, refreshRecentBookings, refreshEarningsAnalytics, refreshServicePerformance])

  const refreshCache = useCallback(async () => {
    try {
      await providerApi.refreshAnalyticsCache()
      // Refresh stats after cache refresh
      await refreshStats()
    } catch (err: any) {
      console.error('Error refreshing cache:', err)
      throw err
    }
  }, [refreshStats])

  // Initial data load
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshAll()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshAll])

  // Utility functions
  const hasData = useCallback((): boolean => {
    return !!(stats || legacyStats || recentBookings || servicePerformance)
  }, [stats, legacyStats, recentBookings, servicePerformance])

  const isInitialLoading = useCallback((): boolean => {
    return loading && !hasData()
  }, [loading, hasData])

  const hasErrors = useCallback((): boolean => {
    return !!(error || statsError || recentBookingsError || earningsError || servicesError)
  }, [error, statsError, recentBookingsError, earningsError, servicesError])

  const getOverallHealth = useCallback((): 'good' | 'warning' | 'error' => {
    if (hasErrors()) return 'error'
    if (loading || !hasData()) return 'warning'
    return 'good'
  }, [hasErrors, loading, hasData])

  return {
    // Data
    stats,
    legacyStats,
    recentBookings,
    earningsAnalytics,
    servicePerformance,
    
    // Loading states
    loading,
    statsLoading,
    recentBookingsLoading,
    earningsLoading,
    servicesLoading,
    
    // Error states
    error,
    statsError,
    recentBookingsError,
    earningsError,
    servicesError,
    
    // Actions
    refreshStats,
    refreshRecentBookings,
    refreshEarningsAnalytics,
    refreshServicePerformance,
    refreshAll,
    refreshCache,
    
    // Utility functions
    hasData,
    isInitialLoading,
    hasErrors,
    getOverallHealth
  }
}

export default useProviderDashboard