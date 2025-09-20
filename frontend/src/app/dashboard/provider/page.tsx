"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"

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
  ShoppingBag
} from "lucide-react"

import { getStatusInfo, requiresProviderAction } from "@/utils/statusUtils"
import ServiceDeliveryForm from "@/components/bookings/ServiceDeliveryForm"
import ServiceDeliveryStatus from "@/components/bookings/ServiceDeliveryStatus"
import CashPaymentForm from "@/components/bookings/CashPaymentForm"
import { useProviderDashboard } from "@/hooks/useProviderDashboard"
import { useProviderBookings } from "@/hooks/useProviderBookings"
import type { ProviderDashboardStats, LegacyProviderStats } from "@/types/provider"

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

export default function ProviderDashboard() {
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

  // Fallback data in case API fails
  const fallbackStats = {
    bookings: { total: 0, this_month: 0, this_week: 0, pending: 0 },
    earnings: { total: 0, this_month: 0, this_week: 0 },
    ratings: { average_rating: 0, total_reviews: 0 },
    services: { active: 0, total: 0 },
    trends: { monthly: [] }
  }

  // Get current stats with fallback
  const currentStats = stats || fallbackStats
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

  // Get services from API data with fallback
  const services = servicePerformance?.services.slice(0, 3) || [
    {
      id: 1,
      title: "Professional House Cleaning",
      price: 1200,
      average_rating: 4.9,
      status: "active",
      category: "Cleaning",
      inquiry_count: 78
    },
    {
      id: 2,
      title: "Deep Cleaning Service", 
      price: 2200,
      average_rating: 4.7,
      status: "active",
      category: "Cleaning",
      inquiry_count: 32
    }
  ]

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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Here's an overview of your services and bookings.</p>
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
        <AnimatedStatCard
          title="Total Bookings"
          value={currentStats.bookings.total}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="All time"
          loading={dashboardLoading}
          growth={currentStats.bookings.this_month}
          tone="primary"
        />
        <AnimatedStatCard
          title="This Month"
          value={currentStats.bookings.this_month}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Bookings this month"
          loading={dashboardLoading}
          growth={currentStats.bookings.this_week}
          tone="success"
        />
        <AnimatedStatCard
          title="Total Earnings"
          value={`NPR ${currentStats.earnings.this_month.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="This month"
          loading={dashboardLoading}
          growth={Math.round((currentStats.earnings.this_month / (currentStats.earnings.total || 1)) * 100)}
          tone="success"
        />
        <AnimatedStatCard
          title="Rating"
          value={currentStats.ratings.average_rating.toFixed(1)}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
          description={`${currentStats.ratings.total_reviews} reviews`}
          loading={dashboardLoading}
          growth={2}
          tone="warning"
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
                recentBookings.recent_bookings.slice(0, 3).map((booking) => (
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
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              ) : currentStats.ratings.total_reviews > 0 ? (
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

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        variants={containerVariants}
      >
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
              services.map((service, index) => (
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
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2" />
                              {booking.date}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2" />
                              {booking.time}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2" />
                              {booking.location}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              NPR {(booking.total_amount || booking.price)?.toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                              {/* Service delivery action button */}
                              {booking.status === "confirmed" && (
                                <Button 
                                  size="sm" 
                                  className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                  onClick={() => openDeliveryDialog(booking)}
                                >
                                  <Truck className="h-4 w-4 mr-2" /> Mark Delivered
                                </Button>
                              )}
                              
                              {/* Cash payment action button */}
                              {booking.status === "service_delivered" && booking.payment_type === "cash" && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                  onClick={() => openCashPaymentDialog(booking)}
                                >
                                  <DollarSign className="h-4 w-4 mr-2" /> Process Cash Payment
                                </Button>
                              )}
                              
                              {/* View delivery status button */}
                              {(booking.status === "service_delivered" || booking.status === "awaiting_confirmation" || booking.status === "completed") && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openDeliveryStatus(booking)}
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" /> View Status
                                </Button>
                              )}
                              
                              {/* Traditional action buttons for other statuses */}
                              {booking.status === "pending" && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground mb-4">You don't have any pending booking requests at the moment.</p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Link href="/dashboard/provider/bookings">
                    View All Bookings
                    <BarChart2 className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </motion.div>
      </motion.div>

      <div>
        <h2 className="text-xl font-bold mb-4">Upcoming Bookings</h2>
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {bookings.upcoming.length > 0 ? (
              <div className="space-y-4">
                {bookings.upcoming.slice(0, 5).map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className="w-10 h-10 mr-4">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{booking.service.title}</h3>
                              <p className="text-sm text-gray-500">by {booking.customer.name}</p>
                            </div>
                            {getStatusBadge(booking)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-2" />
                              {booking.date}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              {booking.time}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-2" />
                              {booking.location}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sky-600">NPR {booking.total_amount || booking.price}</p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Contact Customer
                              </Button>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="text-center mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/provider/bookings">View All Upcoming Bookings</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">You don't have any upcoming bookings.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {bookings.completed.length > 0 ? (
              <div className="space-y-4">
                {bookings.completed.slice(0, 5).map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className="w-10 h-10 mr-4">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{booking.service.title}</h3>
                              <p className="text-sm text-gray-500">by {booking.customer.name}</p>
                            </div>
                            {getStatusBadge(booking)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-2" />
                              {booking.date}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              {booking.time}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-2" />
                              {booking.location}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <p className="font-bold text-sky-600 mr-4">NPR {booking.total_amount || booking.price}</p>
                              <div className="flex items-center">
                                <p className="text-sm mr-2">Customer rating:</p>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < (booking.rating || 0)
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="text-center mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/provider/bookings">View All Completed Bookings</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">You don't have any completed bookings yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">New Booking Request</p>
                <p className="text-sm text-muted-foreground">House Cleaning Service - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">New Review</p>
                <p className="text-sm text-muted-foreground">5-star rating received - 3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Payment Received</p>
                <p className="text-sm text-muted-foreground">NPR 2,500 - 4 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {/* Services Management */}
        <Link href="/dashboard/provider/services">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Services</h3>
                <p className="text-sm text-muted-foreground">Manage your service offerings</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Schedule</span>
              <span className="bg-muted px-2 py-1 rounded">Pricing</span>
              <span className="bg-muted px-2 py-1 rounded">Areas</span>
            </div>
          </Card>
        </Link>

        {/* Bookings Management */}
        <Link href="/dashboard/provider/bookings">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Bookings</h3>
                <p className="text-sm text-muted-foreground">Manage appointments & schedule</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Calendar</span>
              <span className="bg-muted px-2 py-1 rounded">Requests</span>
              <span className="bg-muted px-2 py-1 rounded">History</span>
            </div>
          </Card>
        </Link>

        {/* Portfolio */}
        <Link href="/dashboard/provider/portfolio">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Portfolio</h3>
                <p className="text-sm text-muted-foreground">Showcase your work</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Projects</span>
              <span className="bg-muted px-2 py-1 rounded">Reviews</span>
              <span className="bg-muted px-2 py-1 rounded">Photos</span>
            </div>
          </Card>
        </Link>

        {/* Analytics */}
        <Link href="/dashboard/provider/analytics">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">Track performance metrics</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Reports</span>
              <span className="bg-muted px-2 py-1 rounded">Insights</span>
              <span className="bg-muted px-2 py-1 rounded">Trends</span>
            </div>
          </Card>
        </Link>

        {/* Earnings */}
        <Link href="/dashboard/provider/earnings">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Earnings</h3>
                <p className="text-sm text-muted-foreground">Track your income</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Payments</span>
              <span className="bg-muted px-2 py-1 rounded">History</span>
              <span className="bg-muted px-2 py-1 rounded">Reports</span>
            </div>
          </Card>
        </Link>

        {/* Business Tools */}
        <Link href="/dashboard/provider/marketing">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Business Tools</h3>
                <p className="text-sm text-muted-foreground">Grow your business</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Marketing</span>
              <span className="bg-muted px-2 py-1 rounded">Customers</span>
              <span className="bg-muted px-2 py-1 rounded">Documents</span>
            </div>
          </Card>
        </Link>
      </div>

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