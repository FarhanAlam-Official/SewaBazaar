"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedStatsCard } from "@/components/provider/EnhancedStatsCard"

// Recharts imports for comprehensive analytics
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Rectangle
} from 'recharts'

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  Calendar,
  Clock,
  Target,
  Eye,
  MessageSquare,
  RefreshCw,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Award,
  ThumbsUp
} from "lucide-react"

import { useProviderDashboard } from "@/hooks/useProviderDashboard"
import { useProviderServices } from "@/hooks/useProviderServices"
import { useProviderBookings } from "@/hooks/useProviderBookings"
import { providerApi } from "@/services/provider.api"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      duration: 0.4
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      type: "spring" as const,
      damping: 20,
      stiffness: 100
    }
  }
}

// Chart colors
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1'
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.info,
  CHART_COLORS.indigo,
  CHART_COLORS.danger
]

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.name.includes('Rate') || entry.name.includes('Rating') ? '' : 
             entry.name.includes('Revenue') || entry.name.includes('Earnings') ? ' NPR' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Create a tooltip specialized for single-series bookings bars with percentage and rank
const createBookingsTooltip = (total: number) => {
  const BookingsTooltip = (props: any) => {
  const payload = Array.isArray(props?.payload)
    ? props.payload.filter((p: any) => {
        const key = (p.dataKey || p.name || '').toString().toLowerCase()
        return key.includes('bookings')
      })
    : props?.payload
  if (props?.active && payload && payload.length) {
    const row = payload[0]?.payload || {}
    const name = row.name || props?.label
    const value = Number(row.bookings || payload[0]?.value || 0)
    const rank = row.rank
    const percent = total > 0 ? Math.round((value / total) * 100) : 0
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-foreground font-medium truncate" title={String(name)}>{name}</p>
          {rank ? <span className="text-xs text-muted-foreground">#{rank}</span> : null}
        </div>
        <div className="text-sm">
          <p>
            <span className="text-muted-foreground">Bookings:</span> {new Intl.NumberFormat('en-US').format(value)}
          </p>
          <p>
            <span className="text-muted-foreground">Share:</span> {percent}%
          </p>
        </div>
      </div>
    )
  }
  return null
  }
  BookingsTooltip.displayName = 'BookingsTooltip'
  return BookingsTooltip
}

// Backward-compatible bookings-only tooltip wrapper (used in other charts if referenced)
const BookingsOnlyTooltip = (props: any) => {
  const payload = Array.isArray(props?.payload)
    ? props.payload.filter((p: any) => {
        const key = (p.dataKey || p.name || '').toString().toLowerCase()
        return key.includes('bookings')
      })
    : props?.payload
  return <CustomTooltip {...props} payload={payload} />
}

// Enhanced StatCard with animations
const AnimatedStatCard: React.FC<{
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  loading?: boolean
  growth?: number
  tone?: 'primary' | 'success' | 'warning' | 'danger'
}> = ({ title, value, icon, description, loading, growth, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20',
    success: 'hover:shadow-green-100/50 dark:hover:shadow-green-900/20',
    warning: 'hover:shadow-yellow-100/50 dark:hover:shadow-yellow-900/20',
    danger: 'hover:shadow-red-100/50 dark:hover:shadow-red-900/20'
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ 
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className="group"
    >
      <StatCard
        title={title}
        value={value}
        icon={icon}
        description={description}
        loading={loading}
        growth={growth}
        className={`transition-all duration-300 ${toneClasses[tone]} group-hover:shadow-lg`}
      />
    </motion.div>
  )
}

export default function ProviderAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedBreakdown, setSelectedBreakdown] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [earningsLoading, setEarningsLoading] = useState(false)
  const [detailedEarnings, setDetailedEarnings] = useState<any | null>(null)

  // Use provider hooks for comprehensive data
  const {
    stats,
    recentBookings,
    servicePerformance,
    loading: dashboardLoading,
    error: dashboardError,
    refreshAll
  } = useProviderDashboard({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000
  })

  const {
    services,
    loading: servicesLoading,
    getActiveServicesCount,
    getTotalRevenue,
    getAverageRating
  } = useProviderServices({
    autoRefresh: true
  })

  const {
    bookings,
    loading: bookingsLoading,
    getTotalBookingsCount
  } = useProviderBookings({
    autoRefresh: true
  })

  // Fetch detailed earnings analytics based on selected period/breakdown
  useEffect(() => {
    const mappedPeriod = selectedPeriod === 'quarter' ? 'month' : selectedPeriod
    setEarningsLoading(true)
    providerApi.getDetailedEarningsAnalytics(mappedPeriod as any, selectedBreakdown)
      .then((data) => setDetailedEarnings(data))
      .catch((err: any) => {
        const msg = err.message || 'Failed to fetch detailed earnings analytics'
        console.error('Earnings analytics error:', err)
        showToast.error({
          title: 'Error Loading Earnings',
          description: msg
        })
      })
      .finally(() => setEarningsLoading(false))
  }, [selectedPeriod, selectedBreakdown])

  // Date helpers for filtering by selected period
  const getPeriodStartDate = useCallback((period: 'week' | 'month' | 'quarter' | 'year'): Date => {
    const now = new Date()
    const start = new Date(now)
    if (period === 'week') {
      start.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      // calendar month start
      start.setDate(1)
    } else if (period === 'quarter') {
      // start of current quarter
      const q = Math.floor(now.getMonth() / 3)
      start.setMonth(q * 3, 1)
    } else if (period === 'year') {
      // start of current year
      start.setMonth(0, 1)
    }
    return start
  }, [])

  const isDateInSelectedPeriod = useCallback((dateLike: string | Date, period: 'week' | 'month' | 'quarter' | 'year'): boolean => {
    const d = typeof dateLike === 'string' ? new Date(dateLike) : dateLike
    if (!(d instanceof Date) || isNaN(d.getTime())) return false
    const now = new Date()
    const start = getPeriodStartDate(period)
    return d >= start && d <= now
  }, [getPeriodStartDate])

  // Generate analytics data
  const generateServicePerformanceData = useCallback(() => {
    // Aggregate from real bookings within selected period
    const map: Record<string, { bookings: number, revenue: number }> = {}
    const all = [
      ...bookings.upcoming,
      ...bookings.pending,
      ...bookings.completed
    ] as any[]
    for (const b of all) {
      const ds: string = (b.booking_date || b.date || '')
      if (!isDateInSelectedPeriod(ds, selectedPeriod)) continue
      const raw = b.service?.title || b.service_title || b.service_name || 'Unknown'
      const key = String(raw)
      if (!map[key]) map[key] = { bookings: 0, revenue: 0 }
      map[key].bookings += 1
      map[key].revenue += Number(b.total_amount || 0)
    }
    const items = Object.entries(map).map(([name, vals]) => ({
      name: name.slice(0, 15) + (name.length > 15 ? '...' : ''),
      bookings: vals.bookings,
      revenue: vals.revenue,
      rating: 0,
      views: 0
    }))
    items.sort((a, b) => (b.bookings || 0) - (a.bookings || 0))
    return items.slice(0, 8)
  }, [bookings.upcoming, bookings.pending, bookings.completed, selectedPeriod, isDateInSelectedPeriod])

  const generateBookingTrendsData = useCallback(() => {
    const now = new Date()
    const start = getPeriodStartDate(selectedPeriod)
    const all = [
      ...bookings.upcoming,
      ...bookings.pending,
      ...bookings.completed
    ] as any[]

    const aggregateDaily = () => {
      const out: Array<{ label: string, bookings: number, completed: number, cancelled: number }> = []
      const cursor = new Date(start)
      while (cursor <= now) {
        const key = cursor.toISOString().slice(0, 10)
        const label = `${cursor.getMonth() + 1}/${cursor.getDate()}`
        const count = all.filter((b: any) => {
          const ds: string = (b.booking_date || b.date || '')
          return ds && ds.slice(0, 10) === key
        }).length
        const completed = Math.round(count * 0.85)
        const cancelled = Math.max(0, count - completed)
        out.push({ label, bookings: count, completed, cancelled })
        cursor.setDate(cursor.getDate() + 1)
      }
      return out
    }

    if (selectedPeriod === 'week' || selectedPeriod === 'month') {
      return aggregateDaily()
    }

    if (selectedPeriod === 'quarter') {
      const out: Array<{ label: string, bookings: number, completed: number, cancelled: number }> = []
      const cursor = new Date(start)
      while (cursor <= now) {
        const weekStart = new Date(cursor)
        const weekEnd = new Date(cursor)
        weekEnd.setDate(weekEnd.getDate() + 6)
        const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
        const count = all.filter((b: any) => {
          const ds: string = (b.booking_date || b.date || '')
          const d = ds ? new Date(ds) : null
          return d && d >= weekStart && d <= weekEnd
        }).length
        const completed = Math.round(count * 0.85)
        const cancelled = Math.max(0, count - completed)
        out.push({ label, bookings: count, completed, cancelled })
        cursor.setDate(cursor.getDate() + 7)
      }
      return out
    }

    // Year: aggregate current year months, include empty months
    const currentYear = now.getFullYear()
    const monthsAgg: number[] = Array(12).fill(0)
    for (const b of all) {
      const ds: string = (b.booking_date || b.date || '')
      if (!ds) continue
      const d = new Date(ds)
      if (d.getFullYear() !== currentYear) continue
      const m = d.getMonth()
      monthsAgg[m] += 1
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return monthNames.map((name, idx) => {
      const count = monthsAgg[idx]
      const completed = Math.round(count * 0.85)
      const cancelled = Math.max(0, count - completed)
      return { label: name, bookings: count, completed, cancelled }
    })
  }, [bookings.upcoming, bookings.pending, bookings.completed, selectedPeriod, getPeriodStartDate])

  const generateCustomerSatisfactionData = useCallback(() => {
    const avgRating = getAverageRating()
    
    // Adjust satisfaction data based on selected period
    // This is a simplified approach - in a real app, you'd fetch period-specific data
    let multiplier = 1
    if (selectedPeriod === 'week') {
      multiplier = 0.25
    } else if (selectedPeriod === 'month') {
      multiplier = 1
    } else if (selectedPeriod === 'quarter') {
      multiplier = 3
    } else if (selectedPeriod === 'year') {
      multiplier = 12
    }
    
    return [
      { name: '5 Stars', value: Math.round((avgRating >= 4.5 ? 60 : 40) * multiplier), fill: CHART_COLORS.success },
      { name: '4 Stars', value: Math.round((avgRating >= 4 ? 25 : 30) * multiplier), fill: CHART_COLORS.primary },
      { name: '3 Stars', value: Math.round((avgRating >= 3 ? 10 : 20) * multiplier), fill: CHART_COLORS.warning },
      { name: '2 Stars', value: Math.round((avgRating >= 2 ? 3 : 7) * multiplier), fill: CHART_COLORS.danger },
      { name: '1 Star', value: Math.round((avgRating >= 2 ? 2 : 3) * multiplier), fill: '#6b7280' }
    ]
  }, [getAverageRating, selectedPeriod])

  const generateConversionFunnelData = useCallback(() => {
    const totalViews = services.reduce((sum: number, service: any) => sum + (service.view_count || 0), 0)
    const totalInquiries = services.reduce((sum: number, service: any) => sum + (service.inquiry_count || 0), 0)
    const totalBookings = getTotalBookingsCount()
    
    // Adjust funnel data based on selected period
    let periodMultiplier = 1
    if (selectedPeriod === 'week') {
      periodMultiplier = 0.25
    } else if (selectedPeriod === 'month') {
      periodMultiplier = 1
    } else if (selectedPeriod === 'quarter') {
      periodMultiplier = 3
    } else if (selectedPeriod === 'year') {
      periodMultiplier = 12
    }
    
    return [
      { name: 'Profile Views', value: Math.round((totalViews || 1000) * periodMultiplier), fill: CHART_COLORS.info },
      { name: 'Service Inquiries', value: Math.round((totalInquiries || 300) * periodMultiplier), fill: CHART_COLORS.primary },
      { name: 'Bookings', value: Math.round((totalBookings || 150) * periodMultiplier), fill: CHART_COLORS.success },
      { name: 'Completed', value: Math.round((Math.round(totalBookings * 0.85) || 120) * periodMultiplier), fill: CHART_COLORS.warning }
    ]
  }, [services, getTotalBookingsCount, selectedPeriod])

  // Calculate key metrics (prefer backend stats with fallbacks) - filtered by selected period
  const totalBookings = useMemo(() => {
    // Filter bookings by selected period
    const filteredBookings = [
      ...bookings.upcoming.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod)),
      ...bookings.pending.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod)),
      ...bookings.completed.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod))
    ]
    return filteredBookings.length
  }, [bookings, selectedPeriod, isDateInSelectedPeriod])
  
  const activeServices = useMemo(() => {
    // For active services, we might want to consider services that had bookings in the selected period
    // This is a simplified approach - in a real app, you might fetch period-specific service data
    return getActiveServicesCount()
  }, [getActiveServicesCount])
  
  const totalRevenue = useMemo(() => {
    // Filter bookings by selected period and calculate revenue
    const filteredBookings = [
      ...bookings.upcoming.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod)),
      ...bookings.pending.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod)),
      ...bookings.completed.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod))
    ]
    return filteredBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0)
  }, [bookings, selectedPeriod, isDateInSelectedPeriod])
  
  const averageRating = useMemo(() => {
    // For average rating, we might want to calculate based on reviews in the selected period
    // This is a simplified approach - in a real app, you might fetch period-specific rating data
    return (stats as any)?.ratings?.average_rating ?? getAverageRating()
  }, [stats, getAverageRating])
  
  const completionRate = useMemo(() => {
    // Filter completed bookings by selected period
    const filteredCompleted = bookings.completed.filter((b: any) => 
      isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod))
    return filteredCompleted.length / (totalBookings || 1) * 100
  }, [bookings.completed, totalBookings, selectedPeriod, isDateInSelectedPeriod])
  
  const responseTime = useMemo(() => {
    // Response time might not be period-specific, so we keep the original logic
    return (services?.map((s: any) => s.response_time).find(Boolean) as string) || 'N/A'
  }, [services])
  
  // Customer metrics derived from real bookings
  const allBookingsList = useMemo(() => ([
    ...bookings.upcoming,
    ...bookings.pending,
    ...bookings.completed
  ]) as any[], [bookings.upcoming, bookings.pending, bookings.completed])
  
  // Helper function to check if a booking date is within the selected period
  const isBookingInSelectedPeriod = useCallback((bookingDate: Date, period: 'week' | 'month' | 'quarter' | 'year'): boolean => {
    // Improved date validation
    if (!(bookingDate instanceof Date) || isNaN(bookingDate.getTime())) {
      return false
    }
    
    const now = new Date()
    
    switch (period) {
      case 'week':
        const oneWeekAgo = new Date(now)
        oneWeekAgo.setDate(now.getDate() - 7)
        return bookingDate >= oneWeekAgo && bookingDate <= now
        
      case 'month':
        const oneMonthAgo = new Date(now)
        oneMonthAgo.setMonth(now.getMonth() - 1)
        return bookingDate >= oneMonthAgo && bookingDate <= now
        
      case 'quarter':
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(now.getMonth() - 3)
        return bookingDate >= threeMonthsAgo && bookingDate <= now
        
      case 'year':
        const oneYearAgo = new Date(now)
        oneYearAgo.setFullYear(now.getFullYear() - 1)
        return bookingDate >= oneYearAgo && bookingDate <= now
        
      default:
        return true
    }
  }, [])
  
  const customerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allBookingsList.forEach((b: any) => {
      const name = (b.customer && (b.customer.name || b.customer.email)) || b.customer_name || b.phone || (b.customer_id ? `Customer #${b.customer_id}` : 'Unknown')
      // Filter bookings based on selected period
      const bookingDate = new Date(b.booking_date || b.date || '')
      if (isDateInSelectedPeriod(bookingDate, selectedPeriod)) {
        counts[name] = (counts[name] || 0) + 1
      }
    })
    return counts
  }, [allBookingsList, selectedPeriod, isDateInSelectedPeriod])
  
  const uniqueCustomers = useMemo(() => Object.keys(customerCounts).length, [customerCounts])
  const repeatCustomers = useMemo(() => Object.values(customerCounts).filter((c: any) => c > 1).length, [customerCounts])
  const repeatRate = useMemo(() => uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0, [uniqueCustomers, repeatCustomers])

  // Chart data from earnings analytics
  const earningsChartData = useMemo(() => {
    return (detailedEarnings?.earnings_data || []).map((item: any) => ({
      period: item.period,
      earnings: item.earnings,
      bookings: item.bookings_count ?? item.total_bookings ?? item.bookings ?? item.count ?? 0
    }))
  }, [detailedEarnings])

  // Booking status distribution from real grouped bookings - filtered by period
  const statusDistributionData = useMemo(() => [
    { name: 'Pending', value: bookings.pending.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod)).length, fill: CHART_COLORS.warning },
    { name: 'Upcoming', value: bookings.upcoming.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod)).length, fill: CHART_COLORS.info },
    { name: 'Completed/Cancelled', value: bookings.completed.filter((b: any) => isDateInSelectedPeriod(new Date(b.booking_date || b.date || ''), selectedPeriod)).length, fill: CHART_COLORS.success }
  ], [bookings.pending, bookings.upcoming, bookings.completed, selectedPeriod, isDateInSelectedPeriod])

  // Additional non-earnings datasets for charts - filtered by period
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const counts = Array(7).fill(0)
    allBookingsList.forEach((b: any) => {
      const ds: string = (b.booking_date || b.date || '')
      if (ds) {
        const d = new Date(ds + (ds.length === 10 ? 'T00:00:00' : ''))
        const idx = d instanceof Date && !isNaN(d.getTime()) ? d.getDay() : null
        // Filter by selected period
        if (idx !== null && isDateInSelectedPeriod(d, selectedPeriod)) {
          counts[idx] += 1
        }
      }
    })
    return days.map((day, i) => ({ day, bookings: counts[i] }))
  }, [allBookingsList, selectedPeriod, isDateInSelectedPeriod])

  const peakHoursData = useMemo(() => {
    const counts = Array(24).fill(0)
    allBookingsList.forEach((b: any) => {
      const ts: string = (b.booking_time || b.time || '')
      // Filter by selected period
      const bookingDate = new Date(b.booking_date || b.date || '')
      if (typeof ts === 'string' && ts.length >= 2 && isDateInSelectedPeriod(bookingDate, selectedPeriod)) {
        const hour = parseInt(ts.split(':')[0], 10)
        if (!isNaN(hour) && hour >= 0 && hour < 24) counts[hour] += 1
      }
    })
    return counts.map((value, h) => ({ hour: `${h.toString().padStart(2,'0')}:00`, bookings: value }))
  }, [allBookingsList, selectedPeriod, isDateInSelectedPeriod])

  const bookingsByCityData = useMemo(() => {
    const map: Record<string, number> = {}
    allBookingsList.forEach((b: any) => {
      const c = b.city || 'Unknown'
      // Filter by selected period
      const bookingDate = new Date(b.booking_date || b.date || '')
      if (isDateInSelectedPeriod(bookingDate, selectedPeriod)) {
        map[c] = (map[c] || 0) + 1
      }
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [allBookingsList, selectedPeriod, isDateInSelectedPeriod])

  const topCustomersData = useMemo(() => {
    const items = Object.entries(customerCounts)
      .map(([name, value]) => ({ name, bookings: value as number }))
      .filter((i) => i.bookings > 0)
    items.sort((a: any, b: any) => b.bookings - a.bookings)
    return items.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 }))
  }, [customerCounts])

  const generateTopServicesByBookingsData = useCallback(() => {
    // Primary: service performance from backend
    const fromPerformance = (servicePerformance?.services || []).map((s: any) => ({
      name: (s.title || s.name || s.service_title || 'Unknown').toString().slice(0, 15) + (((s.title || s.name || s.service_title || '').toString().length > 15) ? '...' : ''),
      bookings: s.bookings_count ?? s.total_bookings ?? s.completed_bookings ?? s.bookings ?? 0
    }))
    const nonZeroPerf = fromPerformance.filter((s) => s.bookings > 0)
    if (nonZeroPerf.length > 0) return nonZeroPerf.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 }))

    // Fallback: aggregate from actual bookings list - filtered by period
    const map: Record<string, number> = {}
    allBookingsList.forEach((b: any) => {
      // Filter by selected period
      const bookingDate = new Date(b.booking_date || b.date || '')
      if (isDateInSelectedPeriod(bookingDate, selectedPeriod)) {
        const raw = b.service?.title || b.service_title || b.service_name || 'Unknown'
        const name = raw.toString()
        map[name] = (map[name] || 0) + 1
      }
    })
    const aggregated = Object.entries(map)
      .map(([name, bookings]) => ({
        name: name.toString().slice(0, 15) + (name.toString().length > 15 ? '...' : ''),
        bookings: bookings as number
      }))
      .filter((x) => x.bookings > 0)
    aggregated.sort((a, b) => b.bookings - a.bookings)
    return aggregated.slice(0, 5).map((item, idx) => ({ ...item, rank: idx + 1 }))
  }, [servicePerformance, allBookingsList, selectedPeriod, isDateInSelectedPeriod])
  
  const topServicesData = useMemo(() => generateTopServicesByBookingsData(), [generateTopServicesByBookingsData])

  // Removed progress bar helpers as we're using horizontal bar charts

  const servicePerformanceData = useMemo(() => generateServicePerformanceData(), [generateServicePerformanceData])
  const bookingTrendsData = useMemo(() => generateBookingTrendsData(), [generateBookingTrendsData])
  const customerSatisfactionData = useMemo(() => generateCustomerSatisfactionData(), [generateCustomerSatisfactionData])
  const conversionFunnelData = useMemo(() => generateConversionFunnelData(), [generateConversionFunnelData])
  const totalTopServices = useMemo(() => topServicesData.reduce((sum: number, s: any) => sum + (s.bookings || 0), 0), [topServicesData])
  const totalTopCustomers = useMemo(() => topCustomersData.reduce((sum: number, s: any) => sum + (s.bookings || 0), 0), [topCustomersData])
  const totalServicePerformance = useMemo(() => servicePerformanceData.reduce((sum: number, s: any) => sum + (s.bookings || 0), 0), [servicePerformanceData])

  // For donut readability with many services: group small slices into "Other"
  const serviceDonutData = useMemo(() => {
    if (!Array.isArray(servicePerformanceData)) return [] as any[]
    const sorted = [...servicePerformanceData].sort((a: any, b: any) => (b.bookings || 0) - (a.bookings || 0))
    const maxSlices = 6 // show top 6, group the rest as "Other"
    const top = sorted.slice(0, maxSlices)
    const rest = sorted.slice(maxSlices)
    const restTotal = rest.reduce((sum: number, s: any) => sum + (s.bookings || 0), 0)
    const data = [...top]
    if (restTotal > 0) data.push({ name: 'Other', bookings: restTotal, revenue: 0, rating: 0, views: 0 })
    return data
  }, [servicePerformanceData])

  // Render percentage labels only for sufficiently large slices
  const renderServiceDonutLabel = useCallback((props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props
    if (!percent || percent < 0.06) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#fff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
        {Math.round(percent * 100)}%
      </text>
    )
  }, [])

  // Custom legend with truncation and percentages, scrollable when many items
  const ServiceDonutLegend = useCallback((legendProps: any) => {
    const total = totalServicePerformance || 0
    const items = (legendProps?.payload || []).map((p: any) => ({
      color: p.color,
      name: p.value,
      value: p.payload?.bookings || 0
    }))
    return (
      <div className="max-h-40 overflow-auto pr-2">
        {items.map((it: any, idx: number) => {
          const pct = total > 0 ? Math.round((it.value / total) * 100) : 0
          return (
            <div key={idx} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: it.color }} />
                <span className="truncate" title={it.name}>{it.name}</span>
              </div>
              <span className="text-muted-foreground whitespace-nowrap ml-2">{it.value} ({pct}%)</span>
            </div>
          )
        })}
      </div>
    )
  }, [totalServicePerformance])

  const isLoading = dashboardLoading || servicesLoading || bookingsLoading

  return (
    <motion.div 
      className="p-4 md:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        variants={cardVariants}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={refreshAll}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {dashboardError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 dark:text-red-300">{dashboardError}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshAll}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
      >
        <EnhancedStatsCard
          title="Total Bookings"
          value={totalBookings}
          subtitle="All time bookings"
          icon={Calendar}
          tone="primary"
        />
        <EnhancedStatsCard
          title="Active Services"
          value={activeServices}
          subtitle="Currently active"
          icon={Target}
          tone="purple"
        />
        <EnhancedStatsCard
          title="Average Rating"
          value={averageRating.toFixed(1)}
          subtitle="Customer satisfaction"
          icon={Star}
          tone="warning"
        />
        <EnhancedStatsCard
          title="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          subtitle="Service completion"
          icon={Activity}
          tone="success"
        />
      </motion.div>

      {/* Analytics Tabs */}
      <motion.div variants={cardVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 dark:bg-muted/20 p-1 rounded-lg h-12">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary/15 dark:data-[state=active]:text-foreground dark:data-[state=active]:border dark:data-[state=active]:border-primary/30 rounded-md transition-all duration-200 hover:bg-muted/80 dark:hover:bg-muted/30 font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary/15 dark:data-[state=active]:text-foreground dark:data-[state=active]:border dark:data-[state=active]:border-primary/30 rounded-md transition-all duration-200 hover:bg-muted/80 dark:hover:bg-muted/30 font-medium"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="customers" 
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary/15 dark:data-[state=active]:text-foreground dark:data-[state=active]:border dark:data-[state=active]:border-primary/30 rounded-md transition-all duration-200 hover:bg-muted/80 dark:hover:bg-muted/30 font-medium"
            >
              Customers
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary/15 dark:data-[state=active]:text-foreground dark:data-[state=active]:border dark:data-[state=active]:border-primary/30 rounded-md transition-all duration-200 hover:bg-muted/80 dark:hover:bg-muted/30 font-medium"
            >
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Booking Trends */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Booking Trends</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={bookingTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="label" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="completed" fill={CHART_COLORS.success} name="Completed" />
                        <Bar dataKey="cancelled" fill={CHART_COLORS.danger} name="Cancelled" />
                        <Line 
                          type="monotone" 
                          dataKey="bookings" 
                          stroke={CHART_COLORS.primary} 
                          strokeWidth={3}
                          name="Total Bookings"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Satisfaction */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Customer Satisfaction</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerSatisfactionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {customerSatisfactionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
              {/* Bookings by Day of Week */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Bookings by Day of Week</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayOfWeekData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="bookings" fill={CHART_COLORS.info} name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Services by Bookings - moved from Overview */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Service Performance</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : topServicesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topServicesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={120} />
                        <Tooltip content={createBookingsTooltip(totalTopServices)} />
                        <Bar dataKey="bookings" fill={CHART_COLORS.purple} name="Bookings" radius={[4,4,4,4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No data available yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Conversion Funnel */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Conversion Funnel</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={conversionFunnelData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Trend */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Earnings Trend</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={selectedBreakdown} onValueChange={(v: any) => setSelectedBreakdown(v)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="h-80">
                  {earningsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={earningsChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="period" className="text-xs" />
                        <YAxis yAxisId="left" className="text-xs" />
                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="earnings" name="Earnings" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.2} />
                        <Bar yAxisId="right" dataKey="bookings" name="Bookings" fill={CHART_COLORS.success} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Booking Status Distribution */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Booking Status Distribution</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDistributionData} cx="50%" cy="50%" outerRadius={120} dataKey="value">
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`status-${index}`} fill={entry.fill as string} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <AnimatedStatCard
                title="Response Time"
                value={responseTime}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                description="Average response"
                loading={isLoading}
                tone="primary"
              />
              <AnimatedStatCard
                title="Repeat Customers"
                value={`${repeatRate.toFixed(0)}%`}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                description="Customer retention"
                loading={isLoading}
                growth={12}
                tone="success"
              />
              <AnimatedStatCard
                title="Unique Customers"
                value={uniqueCustomers}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                description="Distinct customers served"
                loading={isLoading}
                tone="primary"
              />
            </div>

            <Card className="p-6">
              <CardTitle className="mb-4">Customer Insights</CardTitle>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Peak Booking Hours</h4>
                    <p className="text-sm text-muted-foreground mb-2">Most bookings occur between:</p>
                    <p className="font-medium">10:00 AM - 2:00 PM</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Popular Services</h4>
                    <p className="text-sm text-muted-foreground mb-2">Top performing service:</p>
                    <p className="font-medium">{services[0]?.title || 'House Cleaning'}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Customer Demographics</h4>
                    <p className="text-sm text-muted-foreground mb-2">Primary age group:</p>
                    <p className="font-medium">25-40 years</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Booking Patterns</h4>
                    <p className="text-sm text-muted-foreground mb-2">Most popular day:</p>
                    <p className="font-medium">Saturday</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bookings by City */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Bookings by City</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={bookingsByCityData} cx="50%" cy="50%" outerRadius={120} dataKey="value">
                          {bookingsByCityData.map((entry: any, index: number) => (
                            <Cell key={`city-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Top Customers - Horizontal Bar Chart */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Top Customers</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : topCustomersData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCustomersData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={140} />
                        <Tooltip content={createBookingsTooltip(totalTopCustomers)} />
                        <Bar dataKey="bookings" fill={CHART_COLORS.primary} name="Bookings" radius={[4,4,4,4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No data available yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Performance Insights
                </CardTitle>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">Strong Performance</p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Your completion rate is 15% above average
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300">Visibility Opportunity</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Consider adding more service photos to increase bookings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">Response Time</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Faster responses could improve your booking rate
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <CardTitle className="mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Growth Recommendations
                </CardTitle>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Expand Service Hours</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider offering evening slots to capture 23% more bookings
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Seasonal Services</h4>
                    <p className="text-sm text-muted-foreground">
                      Add holiday cleaning packages for increased winter revenue
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Customer Retention</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement a loyalty program to increase repeat bookings
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Peak Booking Hours */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Peak Booking Hours</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakHoursData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="hour" className="text-xs" interval={2} />
                        <YAxis className="text-xs" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="bookings" fill={CHART_COLORS.warning} name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}