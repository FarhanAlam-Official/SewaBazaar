import { useState, useEffect, useCallback } from 'react'
import { providerApi } from '@/services/provider.api'
import type { ProviderEarningsAnalytics } from '@/types/provider'

interface EarningsSummary {
  totalEarnings: number
  thisMonth: number
  pending: number
  lastPayout: string | null
  nextPayoutDate: string | null
}

interface MonthlyTrend {
  month: string
  grossEarnings: number
  platformFee: number
  netEarnings: number
  bookingsCount: number
}

interface RecentTransaction {
  id: number
  service_name: string
  customer_name: string
  amount: number
  status: string
  date: string
  booking_id: string
}

interface PayoutHistory {
  id: number
  amount: number
  date: string
  status: string
  method: string
}

interface ProviderEarningsData {
  summary: EarningsSummary
  monthlyTrends: MonthlyTrend[]
  recentTransactions: RecentTransaction[]
  payoutHistory: PayoutHistory[]
}

interface UseProviderEarningsReturn {
  earningsData: ProviderEarningsData | null
  earningsAnalytics: ProviderEarningsAnalytics | null
  loading: boolean
  error: string | null
  refreshEarnings: () => Promise<void>
  refreshAnalytics: (period?: 'week' | 'month' | 'year') => Promise<void>
  exportEarnings: (format: 'csv' | 'pdf', period?: string) => Promise<void>
}

export const useProviderEarnings = (): UseProviderEarningsReturn => {
  const [earningsData, setEarningsData] = useState<ProviderEarningsData | null>(null)
  const [earningsAnalytics, setEarningsAnalytics] = useState<ProviderEarningsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch earnings data from provider dashboard
  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await providerApi.getProviderEarnings()
      setEarningsData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch earnings data')
      console.error('Error fetching earnings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch earnings analytics
  const fetchAnalytics = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      const data = await providerApi.getEarningsAnalytics(period)
      setEarningsAnalytics(data)
    } catch (err: any) {
      console.error('Error fetching earnings analytics:', err)
    }
  }, [])

  // Export earnings data
  const exportEarnings = useCallback(async (format: 'csv' | 'pdf', period?: string) => {
    try {
      // This would call a backend endpoint to generate and download the report
      const params = new URLSearchParams()
      params.append('format', format)
      if (period) params.append('period', period)
      
      // For now, we'll create a simple CSV export on the frontend
      if (format === 'csv' && earningsData) {
        const csvContent = generateCSVContent(earningsData)
        downloadCSV(csvContent, `earnings-report-${new Date().toISOString().split('T')[0]}.csv`)
      }
    } catch (err: any) {
      console.error('Error exporting earnings:', err)
      throw err
    }
  }, [earningsData])

  // Generate CSV content from earnings data
  const generateCSVContent = (data: ProviderEarningsData): string => {
    const headers = ['Date', 'Service', 'Customer', 'Amount', 'Status']
    const rows = data.recentTransactions.map(transaction => [
      transaction.date,
      transaction.service_name,
      transaction.customer_name,
      transaction.amount.toString(),
      transaction.status
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    return csvContent
  }

  // Download CSV file
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
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

  // Refresh functions
  const refreshEarnings = useCallback(async () => {
    await fetchEarnings()
  }, [fetchEarnings])

  const refreshAnalytics = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    await fetchAnalytics(period)
  }, [fetchAnalytics])

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchEarnings(),
        fetchAnalytics('month')
      ])
    }

    loadInitialData()
  }, [fetchEarnings, fetchAnalytics])

  return {
    earningsData,
    earningsAnalytics,
    loading,
    error,
    refreshEarnings,
    refreshAnalytics,
    exportEarnings
  }
}

export default useProviderEarnings