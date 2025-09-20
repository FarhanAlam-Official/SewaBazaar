"use client"

import { useEffect, useState, useCallback } from "react"
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

// Recharts imports for analytics visualization
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
  AreaChart
} from 'recharts'

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Eye,
  Filter
} from "lucide-react"

import { useProviderEarnings } from "@/hooks/useProviderEarnings"

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
  purple: '#8b5cf6'
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: NPR {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
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

export default function ProviderEarningsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedBreakdown, setSelectedBreakdown] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const {
    earnings,
    earningsAnalytics,
    detailedAnalytics,
    payoutHistory,
    loading,
    analyticsLoading,
    exportLoading,
    error,
    refreshEarnings,
    refreshEarningsAnalytics,
    refreshDetailedAnalytics,
    exportEarningsReport,
    requestPayout,
    getTotalEarnings,
    getPendingEarnings,
    getThisMonthEarnings,
    getEarningsGrowth,
    getAveragePerBooking
  } = useProviderEarnings({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    defaultPeriod: selectedPeriod
  })

  // Handle period change
  const handlePeriodChange = useCallback((period: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(period)
    refreshDetailedAnalytics(period, selectedBreakdown)
  }, [selectedBreakdown, refreshDetailedAnalytics])

  // Handle breakdown change
  const handleBreakdownChange = useCallback((breakdown: 'daily' | 'weekly' | 'monthly') => {
    setSelectedBreakdown(breakdown)
    refreshDetailedAnalytics(selectedPeriod, breakdown)
  }, [selectedPeriod, refreshDetailedAnalytics])

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      const blob = await exportEarningsReport({ format, period: selectedPeriod })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `earnings-report-${selectedPeriod}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [exportEarningsReport, selectedPeriod])

  // Generate chart data
  const chartData = detailedAnalytics?.earnings_data?.map((item: any) => ({
    period: item.period,
    earnings: item.earnings,
    bookings: item.bookings_count
  })) || []

  // Calculate growth metrics
  const totalEarnings = getTotalEarnings()
  const pendingEarnings = getPendingEarnings()
  const thisMonthEarnings = getThisMonthEarnings()
  const earningsGrowth = getEarningsGrowth()
  const averagePerBooking = getAveragePerBooking()

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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Earnings Analytics</h1>
          <p className="text-muted-foreground">Track your income and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={refreshEarnings}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button 
            onClick={() => handleExport('pdf')}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
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
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshEarnings}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
      >
        <AnimatedStatCard
          title="Total Earnings"
          value={`NPR ${totalEarnings.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="All time earnings"
          loading={loading}
          tone="success"
        />
        <AnimatedStatCard
          title="This Month"
          value={`NPR ${thisMonthEarnings.toLocaleString()}`}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="Current month earnings"
          loading={loading}
          growth={earningsGrowth}
          tone="primary"
        />
        <AnimatedStatCard
          title="Pending Earnings"
          value={`NPR ${pendingEarnings.toLocaleString()}`}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
          description="Awaiting payout"
          loading={loading}
          tone="warning"
        />
        <AnimatedStatCard
          title="Average per Booking"
          value={`NPR ${averagePerBooking.toLocaleString()}`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Average earnings"
          loading={loading}
          tone="primary"
        />
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        variants={containerVariants}
      >
        {/* Earnings Trend Chart */}
        <motion.div variants={cardVariants}>
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Earnings Trend</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="quarter">Quarter</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="h-80">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="period" 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `NPR ${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke={CHART_COLORS.primary}
                      fillOpacity={1}
                      fill="url(#earningsGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No earnings data available</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Bookings vs Earnings Chart */}
        <motion.div variants={cardVariants}>
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Bookings vs Earnings</CardTitle>
              <Select value={selectedBreakdown} onValueChange={handleBreakdownChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="h-80">
              {analyticsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="period" 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="earnings"
                      orientation="left"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `NPR ${value.toLocaleString()}`}
                    />
                    <YAxis 
                      yAxisId="bookings"
                      orientation="right"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      yAxisId="earnings"
                      dataKey="earnings" 
                      fill={CHART_COLORS.primary} 
                      name="Earnings"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="bookings"
                      dataKey="bookings" 
                      fill={CHART_COLORS.success} 
                      name="Bookings"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No comparison data available</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Payout History */}
      <motion.div variants={cardVariants}>
        <Card className="p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Payout History</CardTitle>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // TODO: Implement payout request modal
                showToast.info({
                  title: "Payout Request",
                  description: "Payout request feature coming soon",
                  duration: 3000
                })
              }}
            >
              <CreditCard className="h-4 w-4" />
              Request Payout
            </Button>
          </div>
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton for payout history
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : payoutHistory.length > 0 ? (
              payoutHistory.slice(0, 5).map((payout: any, index: number) => (
                <motion.div
                  key={payout.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Payout #{payout.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">NPR {payout.amount?.toLocaleString()}</p>
                    <Badge 
                      variant={payout.status === 'completed' ? 'default' : 'secondary'}
                      className={
                        payout.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }
                    >
                      {payout.status}
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payouts Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your payout history will appear here once you request payouts
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Request Your First Payout
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}