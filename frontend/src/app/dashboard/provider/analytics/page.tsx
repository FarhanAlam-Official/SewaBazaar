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
  ComposedChart
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

  // Generate analytics data
  const generateServicePerformanceData = useCallback(() => {
    if (!services || services.length === 0) return []
    
    return services.slice(0, 8).map((service: any) => ({
      name: service.title.length > 15 ? service.title.substring(0, 15) + '...' : service.title,
      bookings: service.bookings_count || (service as any).inquiry_count || 0,
      revenue: (service.bookings_count || 0) * service.price,
      rating: service.average_rating || 0,
      views: service.view_count || 0
    }))
  }, [services])

  const generateBookingTrendsData = useCallback(() => {
    // Generate mock trend data based on current bookings
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      const baseBookings = getTotalBookingsCount() / 6
      const variation = Math.random() * 0.4 + 0.8 // 80% to 120% variation
      
      return {
        month,
        bookings: Math.round(baseBookings * variation),
        completed: Math.round(baseBookings * variation * 0.85),
        cancelled: Math.round(baseBookings * variation * 0.15)
      }
    })
  }, [getTotalBookingsCount])

  const generateCustomerSatisfactionData = useCallback(() => {
    const avgRating = getAverageRating()
    
    return [
      { name: '5 Stars', value: Math.round(avgRating >= 4.5 ? 60 : 40), fill: CHART_COLORS.success },
      { name: '4 Stars', value: Math.round(avgRating >= 4 ? 25 : 30), fill: CHART_COLORS.primary },
      { name: '3 Stars', value: Math.round(avgRating >= 3 ? 10 : 20), fill: CHART_COLORS.warning },
      { name: '2 Stars', value: Math.round(avgRating >= 2 ? 3 : 7), fill: CHART_COLORS.danger },
      { name: '1 Star', value: Math.round(avgRating >= 2 ? 2 : 3), fill: '#6b7280' }
    ]
  }, [getAverageRating])

  const generateConversionFunnelData = useCallback(() => {
    const totalViews = services.reduce((sum: number, service: any) => sum + (service.view_count || 0), 0)
    const totalInquiries = services.reduce((sum: number, service: any) => sum + (service.inquiry_count || 0), 0)
    const totalBookings = getTotalBookingsCount()
    
    return [
      { name: 'Profile Views', value: totalViews || 1000, fill: CHART_COLORS.info },
      { name: 'Service Inquiries', value: totalInquiries || 300, fill: CHART_COLORS.primary },
      { name: 'Bookings', value: totalBookings || 150, fill: CHART_COLORS.success },
      { name: 'Completed', value: Math.round(totalBookings * 0.85) || 120, fill: CHART_COLORS.warning }
    ]
  }, [services, getTotalBookingsCount])

  // Calculate key metrics
  const totalBookings = getTotalBookingsCount()
  const activeServices = getActiveServicesCount()
  const totalRevenue = getTotalRevenue()
  const averageRating = getAverageRating()
  const completionRate = bookings.completed.length / (totalBookings || 1) * 100
  const responseTime = '2.5 hours' // This would come from actual data

  const servicePerformanceData = generateServicePerformanceData()
  const bookingTrendsData = generateBookingTrendsData()
  const customerSatisfactionData = generateCustomerSatisfactionData()
  const conversionFunnelData = generateConversionFunnelData()

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
        <AnimatedStatCard
          title="Total Bookings"
          value={totalBookings}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="All time bookings"
          loading={isLoading}
          growth={15}
          tone="primary"
        />
        <AnimatedStatCard
          title="Active Services"
          value={activeServices}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          description="Currently active"
          loading={isLoading}
          tone="success"
        />
        <AnimatedStatCard
          title="Average Rating"
          value={averageRating.toFixed(1)}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
          description="Customer satisfaction"
          loading={isLoading}
          growth={5}
          tone="warning"
        />
        <AnimatedStatCard
          title="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description="Service completion"
          loading={isLoading}
          growth={8}
          tone="success"
        />
      </motion.div>

      {/* Analytics Tabs */}
      <motion.div variants={cardVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <XAxis dataKey="month" className="text-xs" />
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
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Performance */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <CardTitle className="mb-4">Service Performance</CardTitle>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : servicePerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={servicePerformanceData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="bookings" fill={CHART_COLORS.primary} name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No service data available</p>
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
                value="68%"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                description="Customer retention"
                loading={isLoading}
                growth={12}
                tone="success"
              />
              <AnimatedStatCard
                title="Referral Rate"
                value="24%"
                icon={<ThumbsUp className="h-4 w-4 text-muted-foreground" />}
                description="Customer referrals"
                loading={isLoading}
                growth={8}
                tone="warning"
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
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}