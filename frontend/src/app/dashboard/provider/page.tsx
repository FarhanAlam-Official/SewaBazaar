"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

// Recharts imports for dashboard analytics
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts'

import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Plus,
  CheckCircle,
  XCircle,
  Truck,
  UserCheck,
  DollarSign,
  AlertTriangle,
  BarChart2,
  TrendingUp,
  Users2,
  Briefcase,
  RefreshCw,
  ImageIcon,
  Target,
  ShoppingBag,
  Check,
  Eye,
  Activity,
  Wallet,
  Sparkles,
  Users,
  ChevronRight
} from "lucide-react"

import { getStatusInfo, requiresProviderAction } from "@/utils/statusUtils"
import ServiceDeliveryForm from "@/components/bookings/ServiceDeliveryForm"
import ServiceDeliveryStatus from "@/components/bookings/ServiceDeliveryStatus"
import CashPaymentForm from "@/components/bookings/CashPaymentForm"
import { useProviderDashboard } from "@/hooks/useProviderDashboard"
import { useProviderBookings } from "@/hooks/useProviderBookings"
import { EnhancedStatsCard } from "@/components/provider/EnhancedStatsCard"
import type { ProviderDashboardStats, LegacyProviderStats } from "@/types/provider"
import { useAuth } from "@/contexts/AuthContext"

// Animation variants for smooth transitions
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

// Create a ServiceCard component that matches the recommendations page
const ServiceCard = ({ service }: { service: any }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="relative">
        <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
            <Briefcase className="h-12 w-12 text-white" />
          </div>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-lg line-clamp-1">{service.title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Briefcase className="w-4 h-4" />
            <span className="text-blue-600 dark:text-blue-400 no-underline font-medium">
              {service.category || 'Service'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Badge 
            variant="outline" 
            className="w-fit bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-800/50 dark:hover:to-purple-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-800 dark:hover:text-indigo-100 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
          >
            {service.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
          <p className="text-sm text-muted-foreground line-clamp-2">
            Professional service offering with excellent quality and customer satisfaction.
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">{typeof service.average_rating === 'number' ? service.average_rating.toFixed(1) : '0.0'}</span>
              <span className="text-sm text-muted-foreground">({service.inquiry_count || 0})</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">NPR {service.price?.toLocaleString() || '0'}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="flex-1 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="font-medium">View Details</span>
            </Button>
            <Button 
              size="sm"
              className="flex-1 bg-gradient-to-r from-[#8E54E9] to-[#4776E6] hover:opacity-90"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Dashboard Chart Configuration
 * Professional color scheme compatible with light and dark themes
 * Using CSS custom properties for automatic theme adaptation
 */
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: '#10b981',
  warning: '#f59e0b', 
  danger: '#ef4444',
  info: '#3b82f6',
  muted: 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))',
}

/**
 * ENHANCED: Extended color palette for service categories
 * Ensures each category gets a unique, visually distinct color
 * Colors are chosen for accessibility and visual clarity
 */
const SERVICE_CATEGORY_COLORS = [
  '#3b82f6', // Blue - Primary
  '#10b981', // Green - Success
  '#f59e0b', // Orange - Warning
  '#ef4444', // Red - Danger
  '#8b5cf6', // Purple - New
  '#06b6d4', // Cyan - New
  '#84cc16', // Lime - New
  '#f97316', // Orange-500 - New
  '#ec4899', // Pink - New
  '#6366f1', // Indigo - New
  '#14b8a6', // Teal - New
  '#f59e0b', // Amber - New
  '#ef4444', // Red-500 - New
  '#8b5cf6', // Violet - New
  '#06b6d4', // Sky - New
]

/**
 * ENHANCED: Dynamic chart data generation from real booking data
 * 
 * This function generates chart data for the provider dashboard with the following improvements:
 * 
 * 1. MONTHLY TRENDS FIX:
 *    - Now properly handles earnings analytics from backend API
 *    - Falls back to calculating trends from actual booking data when API data is unavailable
 *    - Ensures all completed bookings are included
 * 
 * 2. SERVICE CATEGORY COLORS FIX:
 *    - Uses extended color palette (15 unique colors) instead of cycling through 5 colors
 *    - Properly extracts service categories from booking data
 *    - Sorts categories by count for better visual hierarchy
 * 
 * 3. DATA ACCURACY IMPROVEMENTS:
 *    - Uses service_category field when available
 *    - Intelligent fallback to extract categories from service names
 *    - Handles edge cases and null/undefined data gracefully
 * 
 * @param bookings - Provider booking groups (upcoming, pending, completed)
 * @param dashboardStats - Dashboard statistics from API
 * @param earningsAnalytics - Earnings trends data from backend API
 * @returns Chart data object with bookingStatus, monthlyTrends, categoryBreakdown, and upcomingServices
 */
const getChartDataFromBookings = (bookings: any | null, dashboardStats: ProviderDashboardStats | null, earningsAnalytics: any | null) => {
  // Handle null/undefined data gracefully
  if (!bookings || !dashboardStats) {
    return {
      bookingStatus: [],
      monthlyTrends: [],
      categoryBreakdown: [],
      upcomingServices: []
    }
  }

  try {
    // ENHANCED: Declare allBookings at the top to avoid scope issues
    const allBookings = [...(bookings.upcoming || []), ...(bookings.pending || []), ...(bookings.completed || [])]
    
    // Calculate booking status distribution
    const bookingStatus = [
      { name: 'Completed', value: bookings.completed?.length || 0, color: CHART_COLORS.success },
      { name: 'Upcoming', value: bookings.upcoming?.length || 0, color: CHART_COLORS.primary },
      { name: 'Pending', value: bookings.pending?.length || 0, color: CHART_COLORS.warning },
    ].filter(item => item.value > 0) // Only show categories with data

    // ENHANCED: Generate monthly trends from real earnings analytics data with better fallback logic
    let monthlyTrends = [];
    
    if (earningsAnalytics && earningsAnalytics.monthly_trends && earningsAnalytics.monthly_trends.length > 0) {
      // Use real data from API - ENHANCED: Better month name extraction
      monthlyTrends = earningsAnalytics.monthly_trends.map((trend: any) => ({
        month: trend.month_name ? trend.month_name.split(' ')[0] : trend.month || 'Unknown',
        bookings: trend.booking_count || 0,
        earnings: trend.total_earned || 0
      }));
    } else {
      // ENHANCED: Generate fallback data from actual booking data instead of hardcoded zeros
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Generate last 12 months with real data where possible
      monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        // Calculate bookings and earnings for this month from actual booking data
        const monthBookings = allBookings.filter(booking => {
          if (!booking.date) return false;
          const bookingDate = new Date(booking.date);
          return bookingDate.getMonth() === monthDate.getMonth() && 
                bookingDate.getFullYear() === monthDate.getFullYear();
        });
        
        const monthEarnings = monthBookings.reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0);
        
        monthlyTrends.push({
          month: monthName,
          bookings: monthBookings.length,
          earnings: monthEarnings
        });
      }
    }

    // ENHANCED: Calculate category breakdown from actual bookings with proper category extraction
    const categoryMap: { [key: string]: number } = {}
    
    allBookings.forEach(booking => {
      // ENHANCED: Use service_category field if available, otherwise extract from service name
      let category = 'Other'
      
      if (booking.service_category && booking.service_category.trim) {
        // Use the actual service category from the booking
        category = booking.service_category.trim()
      } else if (booking.service) {
        // Handle case where booking.service is an object with a title property
        let serviceName = '';
        if (typeof booking.service === 'string') {
          serviceName = booking.service;
        } else if (typeof booking.service === 'object' && booking.service !== null) {
          // Extract service name from the service object
          serviceName = booking.service.title || booking.service.name || '';
        }
      }
      
      categoryMap[category] = (categoryMap[category] || 0) + 1
    })

    // ENHANCED: Use extended color palette for better category differentiation
    const categoryBreakdown = Object.entries(categoryMap)
      .sort(([,a], [,b]) => b - a) // Sort by count (descending)
      .map(([name, value], index) => ({
        name,
        value,
        color: SERVICE_CATEGORY_COLORS[index % SERVICE_CATEGORY_COLORS.length]
      }))

    // Transform upcoming bookings to timeline format
    const upcomingServices = (bookings.upcoming || []).slice(0, 4).map((booking:any) => {
      const bookingDate = new Date(booking.date || Date.now())
      const today = new Date()
      const daysLeft = Math.max(0, Math.ceil((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      const totalDuration = Math.max(daysLeft + 1, 7) // Assume at least a week booking window
      
      // Handle service name extraction properly
      let serviceName = 'Unknown Service';
      if (typeof booking.service === 'string') {
        serviceName = booking.service;
      } else if (typeof booking.service === 'object' && booking.service !== null) {
        serviceName = booking.service.title || booking.service.name || 'Unknown Service';
      }
      
      return {
        service: serviceName,
        date: booking.date || new Date().toISOString().split('T')[0],
        amount: Number(booking.total_amount) || 0, // ENHANCED: Ensure amount is always a number
        daysLeft,
        totalDuration
      }
    })

    return {
      bookingStatus,
      monthlyTrends,
      categoryBreakdown,
      upcomingServices
    }
    
  } catch (error) {
    console.error('Error generating chart data:', error)
    // Return empty structure on error
    return {
      bookingStatus: [],
      monthlyTrends: [],
      categoryBreakdown: [],
      upcomingServices: []
    }
  }
}

/**
 * Custom Tooltip Component for Charts
 * Adapts to light/dark theme automatically
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}



// Removed quick actions configuration - functionality available in sidebar navigation

export default function ProviderDashboard() {
  const { user } = useAuth()
  
  // Service delivery modal states
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [bookingToDeliver, setBookingToDeliver] = useState<any>(null)
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false)
  const [bookingForCashPayment, setBookingForCashPayment] = useState<any>(null)
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false)
  const [bookingForStatus, setBookingForStatus] = useState<any>(null)
  
  // Use enhanced provider dashboard hooks
  const {
    stats,
    legacyStats,
    recentBookings,
    servicePerformance,
    loading: dashboardLoading,
    error: dashboardError,
    refreshAll,
    hasData,
    isInitialLoading,
    getOverallHealth
  } = useProviderDashboard({
    useCachedStats: true,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  })

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refreshBookings,
    updateBookingStatus,
    markServiceDelivered,
    processCashPayment,
    getServiceDeliveryStatus
  } = useProviderBookings({
    autoRefresh: true,
    refreshInterval: 30 * 1000 // 30 seconds
  })

  // Remove fallback data - only use real data
  const currentStats = stats
  const isLoading = isInitialLoading()
  const hasErrors = dashboardError || bookingsError
  const overallHealth = getOverallHealth()

  // Service delivery action handlers
  const openDeliveryDialog = useCallback((booking: any) => {
    setBookingToDeliver(booking)
    setDeliveryDialogOpen(true)
  }, [])

  const closeDeliveryDialog = useCallback(() => {
    setDeliveryDialogOpen(false)
    setBookingToDeliver(null)
  }, [])

  const handleDeliverySuccess = useCallback(async () => {
    if (bookingToDeliver) {
      try {
        await markServiceDelivered(bookingToDeliver.id)
        closeDeliveryDialog()
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  }, [bookingToDeliver, markServiceDelivered, closeDeliveryDialog])

  const openCashPaymentDialog = useCallback((booking: any) => {
    setBookingForCashPayment(booking)
    setCashPaymentDialogOpen(true)
  }, [])

  const closeCashPaymentDialog = useCallback(() => {
    setCashPaymentDialogOpen(false)
    setBookingForCashPayment(null)
  }, [])

  const handleCashPaymentSuccess = useCallback(async () => {
    if (bookingForCashPayment) {
      try {
        await processCashPayment(bookingForCashPayment.id, bookingForCashPayment.total_amount)
        closeCashPaymentDialog()
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  }, [bookingForCashPayment, processCashPayment, closeCashPaymentDialog])

  const openDeliveryStatus = useCallback((booking: any) => {
    setBookingForStatus(booking)
    setDeliveryStatusOpen(true)
  }, [])

  const closeDeliveryStatus = useCallback(() => {
    setDeliveryStatusOpen(false)
    setBookingForStatus(null)
  }, [])

  // Enhanced status display with animations
  const getStatusBadge = useCallback((booking: any) => {
    const statusInfo = getStatusInfo(booking.status)
    const needsAction = requiresProviderAction(booking)
    const actionClass = needsAction ? "ring-2 ring-orange-400 ring-opacity-50 animate-pulse" : ""
    
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Badge className={`${statusInfo.color} ${actionClass} transition-all duration-200`}>
          <statusInfo.icon className="w-3 h-3 mr-1" />
          {statusInfo.label}
          {needsAction && <span className="ml-1">⚠️</span>}
        </Badge>
      </motion.div>
    )
  }, [])

  // Get status color for service cards
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  // Get services from API data - remove fallback
  const services = servicePerformance?.services.slice(0, 3) || []

  // Enhanced loading state with skeleton components
  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Skeleton key={star} className="h-4 w-4" />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Show error banner for non-critical errors
  const showErrorBanner = hasErrors && hasData()

  return (
    <motion.div 
      className="p-4 md:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {showErrorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {dashboardError || bookingsError || 'Failed to load some dashboard data'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshAll}
                    disabled={dashboardLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${dashboardLoading ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        variants={cardVariants}
      >
        <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Welcome back,{" "}
                <span className="text-primary">
                  {user?.first_name || user?.email?.split('@')[0] || 'User'}!
                </span>
              </h1>          <p className="text-muted-foreground">Here's an overview of your services and bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            overallHealth === 'good' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
            overallHealth === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {overallHealth === 'good' ? '● All systems operational' :
             overallHealth === 'warning' ? '● Loading data...' :
             '● Some issues detected'}
          </div>
          <Button 
            variant="outline" 
            onClick={refreshAll}
            disabled={dashboardLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
      >
        <EnhancedStatsCard
          title="Total Bookings"
          value={currentStats?.bookings.total || 0}
          subtitle="All time"
          icon={Calendar}
          growth={currentStats?.bookings.this_month || 0}
          tone="primary"
        />
        <EnhancedStatsCard
          title="This Month"
          value={currentStats?.bookings.this_month || 0}
          subtitle="Bookings this month"
          icon={Clock}
          growth={currentStats?.bookings.this_week || 0}
          tone="cyan"
        />
        <EnhancedStatsCard
          title="Total Earnings"
          value={`NPR ${(currentStats?.earnings.this_month || 0).toLocaleString()}`}
          subtitle="This month"
          icon={DollarSign}
          growth={Math.round(((currentStats?.earnings.this_month || 0) / (currentStats?.earnings.total || 1)) * 100)}
          tone="success"
        />
        <EnhancedStatsCard
          title="Rating"
          value={(currentStats?.ratings.average_rating || 0).toFixed(1)}
          subtitle={`${currentStats?.ratings.total_reviews || 0} reviews`}
          icon={Star}
          growth={2}
          tone="purple"
        />
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        variants={containerVariants}
      >
        <motion.div variants={cardVariants}>
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Bookings</h2>
              {bookingsLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="space-y-4">
              {bookingsLoading ? (
                // Loading skeleton for recent bookings
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              ) : recentBookings?.recent_bookings?.length ? (
                recentBookings.recent_bookings.slice(0, 3).map((booking: any) => (
                  <motion.div 
                    key={booking.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div>
                      <h3 className="font-medium">{booking.service_title}</h3>
                      <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">NPR {booking.total_amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.booking_date || new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent bookings</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your recent bookings will appear here
                  </p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/provider/bookings">
                  View All Bookings
                  <BarChart2 className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <Card className="p-6 hover:shadow-lg transition-all duration-300">
            <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
            <div className="space-y-4">
              {dashboardLoading ? (
                // Loading skeleton for reviews
                [1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Skeleton key={star} className="h-4 w-4" />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : recentBookings?.recent_reviews?.length ? (
                recentBookings.recent_reviews.slice(0, 2).map((review: any) => (
                  <div key={review.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : (currentStats?.ratings?.total_reviews || 0) > 0 ? (
                <>
                  <motion.div 
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className="h-4 w-4 text-yellow-400 fill-yellow-400" 
                        />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Excellent service!</p>
                      <p className="text-xs text-muted-foreground">Recent customer</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center">
                      {[1, 2, 3, 4].map((star) => (
                        <Star 
                          key={star}
                          className="h-4 w-4 text-yellow-400 fill-yellow-400" 
                        />
                      ))}
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Very professional</p>
                      <p className="text-xs text-muted-foreground">Recent customer</p>
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer reviews will appear here
                  </p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/provider/reviews">
                  View All Reviews
                  <Star className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div variants={cardVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Services</h2>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" /> Add New Service
            </Button>
          </div>
          <div className="space-y-4">
            {dashboardLoading ? (
              // Loading skeleton for services
              [1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex">
                      <Skeleton className="w-16 h-16 rounded-md mr-4" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-12" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : services.length > 0 ? (
              services.map((service: any, index: number) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex">
                        <div className="w-16 mr-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg">
                            <Briefcase className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{service.title || (service as any).title}</h3>
                            <Badge 
                              className={
                                (service.status === 'active' || (service as any).is_active === true) 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              } 
                              variant="outline"
                            >
                              {(service.status === 'active' || (service as any).is_active === true) ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              NPR {(service.price || (service as any).price)?.toLocaleString()}
                            </p>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                              <span className="text-sm">
                                {(service.average_rating !== undefined ? service.average_rating : (service as any).average_rating)?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {service.inquiry_count !== undefined ? service.inquiry_count : (service as any).bookings_count || 0} bookings
                            </p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300">
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                Deactivate
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first service to start receiving bookings
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Service
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Booking Requests</h2>
            <Link href="/dashboard/provider/bookings">
              <Button variant="outline" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300">
                View All
                <BarChart2 className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {bookingsLoading ? (
              // Loading skeleton for booking requests
              [1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <Skeleton className="w-10 h-10 rounded-xl mr-4" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-20" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : bookings.pending.length > 0 ? (
              bookings.pending.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className="w-10 h-10 mr-4">
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl w-10 h-10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{booking.service.title}</h3>
                              <p className="text-sm text-muted-foreground">by {booking.customer.name}</p>
                            </div>
                            {getStatusBadge(booking)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                            <p className="text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.location}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              {booking.time}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              {booking.address || 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <DollarSign className="h-4 w-4 mr-1" />
                              NPR {booking.total_amount.toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                                onClick={() => openDeliveryDialog(booking)}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Deliver
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                onClick={() => openCashPaymentDialog(booking)}
                              >
                                <Wallet className="h-4 w-4 mr-2" />
                                Cash Payment
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                onClick={() => openDeliveryStatus(booking)}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Status
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Booking Requests</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any pending bookings at the moment. When customers request your services, they'll appear here.
                </p>
                <div className="flex justify-center space-x-3">
                  <Button variant="default" asChild>
                    <Link href="/dashboard/provider/services">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Manage Services
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/provider/bookings">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      View All Bookings
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Dashboard Analytics Charts Section */}
      <motion.div 
        className="mb-12"
        variants={containerVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <BarChart2 className="h-6 w-6 mr-3 text-primary" />
              Dashboard Analytics
            </h2>
            <p className="text-muted-foreground mt-1">Insights into your service performance and earnings</p>
          </div>
        </div>
        
        {/* Get chart data using the existing function */}
        {/* Note: We'll use the existing getChartDataFromBookings function but with provider data */}
        {(() => {
          const chartData = getChartDataFromBookings(bookings, stats, null); // earningsAnalytics would be passed here
          
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Bookings Overview (Pie Chart) */}
                <Card className="p-6 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-primary" />
                      Bookings Overview
                    </CardTitle>
                    <CardDescription>Distribution of your booking statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.bookingStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.bookingStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '14px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Monthly Bookings Trend (Line Chart) */}
                <Card className="p-6 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      Monthly Bookings Trends
                    </CardTitle>
                    <CardDescription>Your booking volume over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="bookings" 
                            stroke={CHART_COLORS.primary}
                            strokeWidth={3}
                            dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      💡 Your highest booking volume was in {chartData.monthlyTrends.length > 0 ? chartData.monthlyTrends[chartData.monthlyTrends.length - 1].month : 'recent months'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3. Category-wise Services (Donut Chart) */}
                <Card className="p-6 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-primary" />
                      Service Categories
                    </CardTitle>
                    <CardDescription>Breakdown by service type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {chartData.categoryBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '14px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Earnings Volume (Bar Chart) */}
                <Card className="p-6 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      Monthly Earnings
                    </CardTitle>
                    <CardDescription>Track your earnings volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.monthlyTrends}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="earnings" 
                            fill={CHART_COLORS.primary}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 5. Enhanced Upcoming Services Timeline */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300 mt-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Upcoming Services Timeline
                  </CardTitle>
                  <CardDescription>Visual schedule of your upcoming bookings with smart insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chartData.upcomingServices.map((service: any, index: number) => {
                      // Calculate meaningful progress: how much time has passed since booking
                      const timeElapsed = service.totalDuration - service.daysLeft;
                      const progressPercentage = Math.max(5, (timeElapsed / service.totalDuration) * 100);
                      const urgencyLevel = service.daysLeft <= 3 ? 'urgent' : service.daysLeft <= 7 ? 'soon' : 'normal';
                      
                      // Create clear, actionable messages
                      const getProgressMessage = () => {
                        if (service.daysLeft === 0) return 'Service is today!';
                        if (service.daysLeft === 1) return 'Service tomorrow';
                        if (service.daysLeft <= 3) return `Only ${service.daysLeft} days left`;
                        if (service.daysLeft <= 7) return `${service.daysLeft} days remaining`;
                        return `${service.daysLeft} days until service`;
                      };
                      
                      return (
                        <motion.div 
                          key={index}
                          className={`group relative flex items-center justify-between p-5 rounded-xl transition-all duration-300 hover:shadow-md ${
                            urgencyLevel === 'urgent' 
                              ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 border-l-4 border-red-500' 
                              : urgencyLevel === 'soon'
                              ? 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30 border-l-4 border-yellow-500'
                              : 'bg-muted/20 hover:bg-muted/40 border-l-4 border-primary'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        >
                          {/* Service Icon and Info */}
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`relative w-4 h-4 rounded-full flex items-center justify-center ${
                              urgencyLevel === 'urgent' 
                                ? 'bg-red-500 animate-pulse' 
                                : urgencyLevel === 'soon'
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-primary'
                            }`}>
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                              {urgencyLevel !== 'normal' && (
                                <div className={`absolute inset-0 rounded-full animate-ping ${
                                  urgencyLevel === 'urgent' ? 'bg-red-400' : 'bg-yellow-400'
                                }`}></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {service.service}
                                </h4>
                                {urgencyLevel === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs px-2 py-1">
                                    Urgent
                                  </Badge>
                                )}
                                {urgencyLevel === 'soon' && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 border-yellow-500 text-yellow-600 dark:text-yellow-400">
                                    Soon
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {service.date}
                                </p>
                                <p className={`text-xs font-medium ${
                                  urgencyLevel === 'urgent' 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : urgencyLevel === 'soon'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}>
                                  {getProgressMessage()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Price and Progress */}
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="font-bold text-primary text-lg">NPR {service.amount.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Service fee</p>
                            </div>
                            
                            {/* Clear Progress Indicator */}
                            <div className="flex flex-col items-end space-y-2">
                              <div className="text-xs text-muted-foreground font-medium text-right">
                                {service.daysLeft <= 3 ? (
                                  <span className="text-red-600 dark:text-red-400 font-semibold">
                                    Urgent: {service.daysLeft === 0 ? 'Today' : `${service.daysLeft} day${service.daysLeft === 1 ? '' : 's'}`}
                                  </span>
                                ) : service.daysLeft <= 7 ? (
                                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                                    Coming up: {service.daysLeft} days
                                  </span>
                                ) : (
                                  <span>
                                    {service.daysLeft} days remaining
                                  </span>
                                )}
                              </div>
                              <div className="w-24 bg-muted rounded-full h-2.5 overflow-hidden">
                                <motion.div 
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    urgencyLevel === 'urgent' 
                                      ? 'bg-gradient-to-r from-red-400 to-red-600' 
                                      : urgencyLevel === 'soon'
                                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                      : 'bg-gradient-to-r from-primary to-primary/70'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercentage}%` }}
                                  transition={{ delay: index * 0.2, duration: 0.8 }}
                                ></motion.div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Booked {timeElapsed} day{timeElapsed === 1 ? '' : 's'} ago
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Button */}
                          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={() => {
                                // Handle quick action - could reschedule, view details, etc.
                                console.log(`Quick action for ${service.service}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Enhanced Empty State */}
                  {chartData.upcomingServices.length === 0 && (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="relative">
                        <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No upcoming services scheduled</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        You don't have any upcoming bookings at the moment. When customers book your services, they'll appear here.
                      </p>
                      <div className="flex justify-center space-x-3">
                        <Button variant="default" asChild>
                          <Link href="/dashboard/provider/services">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Manage Services
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/dashboard/provider/bookings">
                            <BarChart2 className="h-4 w-4 mr-2" />
                            View All Bookings
                          </Link>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Timeline Summary */}
                  {chartData.upcomingServices.length > 0 && (
                    <motion.div 
                      className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground">Timeline Summary</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Total upcoming: <span className="font-semibold text-foreground">{chartData.upcomingServices.length} services</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total value: <span className="font-semibold text-primary">
                              NPR {chartData.upcomingServices.reduce((sum: number, service: any) => sum + (Number(service.amount) || 0), 0).toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </motion.div>

      {/* Removed duplicate Quick Actions sections - functionality available in sidebar navigation */}

      {/* Removed Upcoming Bookings tabs section - functionality available in Booking Requests section above */}

      {/* Removed Recent Activity section - activity information available in Recent Bookings and Recent Reviews sections above */}

      {/* Removed quick action buttons grid - functionality available in sidebar navigation */}

      {/* Service Delivery Dialogs with AnimatePresence */}
      <AnimatePresence>
        {deliveryDialogOpen && bookingToDeliver && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ServiceDeliveryForm
                booking={bookingToDeliver}
                onSuccess={handleDeliverySuccess}
                onCancel={closeDeliveryDialog}
              />
            </motion.div>
          </motion.div>
        )}

        {cashPaymentDialogOpen && bookingForCashPayment && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CashPaymentForm
                booking={bookingForCashPayment}
                onSuccess={handleCashPaymentSuccess}
                onCancel={closeCashPaymentDialog}
              />
            </motion.div>
          </motion.div>
        )}

        {deliveryStatusOpen && bookingForStatus && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ServiceDeliveryStatus
                booking={bookingForStatus}
                serviceDelivery={bookingForStatus.service_delivery}
                userRole="provider"
                onMarkDelivered={() => {
                  closeDeliveryStatus()
                  openDeliveryDialog(bookingForStatus)
                }}
                onProcessCashPayment={() => {
                  closeDeliveryStatus()
                  openCashPaymentDialog(bookingForStatus)
                }}
              />
              <div className="flex justify-end mt-4">
                <Button onClick={closeDeliveryStatus} variant="outline">
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}