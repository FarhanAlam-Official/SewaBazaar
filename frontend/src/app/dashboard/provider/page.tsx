"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Star, Plus, CheckCircle, XCircle, Truck, UserCheck, DollarSign as DollarSignIcon, AlertTriangle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { StatCard } from "@/components/ui/stat-card"
import { DollarSign } from "lucide-react"
import {
  ShoppingBag,
  Briefcase,
  Image as ImageIcon,
  BarChart2,
  TrendingUp,
  Bell,
  Target,
  FileText,
  Settings,
  Users2
} from "lucide-react"
import { getStatusInfo, requiresProviderAction } from "@/utils/statusUtils"
import ServiceDeliveryForm from "@/components/bookings/ServiceDeliveryForm"
import ServiceDeliveryStatus from "@/components/bookings/ServiceDeliveryStatus"
import CashPaymentForm from "@/components/bookings/CashPaymentForm"
import { bookingsApi } from "@/services/api"
import { showToast } from "@/components/ui/enhanced-toast"
import { useState, useCallback, useEffect } from "react"
import { providerApi } from "@/services/provider.api"
import { useProviderDashboard } from "@/hooks/useProviderDashboard"
import type { ProviderDashboardStats, LegacyProviderStats } from "@/types/provider"

interface Booking {
  id: number
  service: {
    title: string
    image_url?: string
  }
  customer: {
    name: string
    phone?: string
    email?: string
  }
  date: string
  time: string
  location: string
  status: string
  price: number
  total_amount: number
  rating?: number
  payment_type?: string
  service_delivery?: any
  // Enhanced fields for service delivery
  booking_date?: string
  booking_time?: string
  address?: string
  city?: string
  phone?: string
  special_instructions?: string
}

interface BookingGroups {
  pending: Booking[]
  upcoming: Booking[]
  completed: Booking[]
}

// Remove the local interface as we're using the imported types

export default function ProviderDashboard() {
  // Service delivery modal states
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [bookingToDeliver, setBookingToDeliver] = useState<Booking | null>(null)
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false)
  const [bookingForCashPayment, setBookingForCashPayment] = useState<Booking | null>(null)
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false)
  const [bookingForStatus, setBookingForStatus] = useState<Booking | null>(null)
  
  const [bookings, setBookings] = useState<BookingGroups>({
    pending: [],
    upcoming: [],
    completed: []
  })
  
  // Use the new provider dashboard hook with error handling
  const {
    stats,
    legacyStats,
    recentBookings,
    servicePerformance,
    loading,
    error,
    refreshAll
  } = useProviderDashboard({
    useCachedStats: false, // Disable cache for now to avoid issues
    autoRefresh: false, // Disable auto-refresh for now
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  })

  // Fallback data in case API fails
  const fallbackStats = {
    bookings: { total: 0, this_month: 0, this_week: 0, pending: 0 },
    earnings: { total: 0, this_month: 0, this_week: 0 },
    ratings: { average_rating: 0, total_reviews: 0 },
    services: { active: 0, total: 0 },
    trends: { monthly: [] }
  }

  const loadBookingsData = useCallback(async () => {
    try {
      const bookingsData = await providerApi.getProviderBookings()
      setBookings({
        pending: bookingsData.pending,
        upcoming: bookingsData.upcoming,
        completed: bookingsData.completed
      })
    } catch (error: any) {
      console.error("Error loading bookings data:", error)
      showToast.error({
        title: "Error",
        description: "Failed to load bookings data. Please try again.",
        duration: 5000
      })
    }
  }, [])

  // Load bookings separately for now (until we integrate booking management)
  useEffect(() => {
    loadBookingsData()
  }, [loadBookingsData])

  // Service delivery action handlers
  const openDeliveryDialog = useCallback((booking: Booking) => {
    setBookingToDeliver(booking)
    setDeliveryDialogOpen(true)
  }, [])

  const closeDeliveryDialog = useCallback(() => {
    setDeliveryDialogOpen(false)
    setBookingToDeliver(null)
  }, [])

  const handleDeliverySuccess = useCallback(() => {
    loadBookingsData()
    refreshAll()
    closeDeliveryDialog()
    showToast.success({
      title: "Service Marked as Delivered",
      description: "Customer has been notified to confirm service completion",
      duration: 3000
    })
  }, [closeDeliveryDialog, refreshAll])

  const openCashPaymentDialog = useCallback((booking: Booking) => {
    setBookingForCashPayment(booking)
    setCashPaymentDialogOpen(true)
  }, [])

  const closeCashPaymentDialog = useCallback(() => {
    setCashPaymentDialogOpen(false)
    setBookingForCashPayment(null)
  }, [])

  const handleCashPaymentSuccess = useCallback(() => {
    loadBookingsData()
    refreshAll()
    closeCashPaymentDialog()
    showToast.success({
      title: "Cash Payment Processed",
      description: "Payment has been recorded successfully",
      duration: 3000
    })
  }, [closeCashPaymentDialog, refreshAll])

  const openDeliveryStatus = useCallback((booking: Booking) => {
    setBookingForStatus(booking)
    setDeliveryStatusOpen(true)
  }, [])

  const closeDeliveryStatus = useCallback(() => {
    setDeliveryStatusOpen(false)
    setBookingForStatus(null)
  }, [])

  // ENHANCED STATUS DISPLAY - Uses new status system
  const getStatusBadge = (booking: Booking) => {
    const statusInfo = getStatusInfo(booking.status)
    const needsAction = requiresProviderAction(booking)
    const actionClass = needsAction ? "ring-2 ring-orange-400 ring-opacity-50 animate-pulse" : ""
    
    return (
      <Badge className={`${statusInfo.color} ${actionClass}`}>
        <statusInfo.icon className="w-3 h-3 mr-1" />
        {statusInfo.label}
        {needsAction && <span className="ml-1">⚠️</span>}
      </Badge>
    )
  }

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

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Show error as a banner instead of blocking the entire page
  const showErrorBanner = error && !loading

  return (
    <div className="p-8">
      {showErrorBanner && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm text-red-700">Failed to load some dashboard data: {error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={refreshAll}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-500">Here's an overview of your services and bookings.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <BarChart2 className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Bookings"
          value={(stats || fallbackStats).bookings.total}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="All time"
          growth={(stats || fallbackStats).bookings.this_month}
        />
        <StatCard
          title="This Month"
          value={(stats || fallbackStats).bookings.this_month}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Bookings this month"
          growth={(stats || fallbackStats).bookings.this_week}
        />
        <StatCard
          title="Total Earnings"
          value={`NPR ${((stats || fallbackStats).earnings.this_month).toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="This month"
          growth={Math.round((((stats || fallbackStats).earnings.this_month) / ((stats || fallbackStats).earnings.total || 1)) * 100)}
        />
        <StatCard
          title="Rating"
          value={(stats || fallbackStats).ratings.average_rating}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
          description={`${(stats || fallbackStats).ratings.total_reviews} reviews`}
          growth={2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            {recentBookings?.recent_bookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div>
                  <h3 className="font-medium">{booking.service_title}</h3>
                  <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">NPR {booking.total_amount}</p>
                  <p className="text-xs text-muted-foreground">{booking.booking_date || new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )) || (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recent bookings</p>
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/provider/bookings">View All Bookings</Link>
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Excellent service!</p>
                <p className="text-xs text-muted-foreground">by Sarah Johnson</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <Star className="h-4 w-4 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium">Very professional</p>
                <p className="text-xs text-muted-foreground">by Mike Wilson</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/provider/reviews">View All Reviews</Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Services</h2>
            <Button className="bg-fresh-aqua hover:bg-fresh-aqua/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add New Service
            </Button>
          </div>
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex">
                    <div className="w-16 mr-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-fresh-aqua to-saffron-glow rounded-md flex items-center justify-center">
                        <Briefcase className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{service.title || (service as any).title}</h3>
                        <Badge className={(service.status === 'active' || (service as any).is_active === true) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} variant="outline">
                          {(service.status === 'active' || (service as any).is_active === true) ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-fresh-aqua">NPR {service.price || (service as any).price}</p>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-saffron-glow fill-saffron-glow mr-1" />
                          <span className="text-sm">{(service.average_rating !== undefined ? service.average_rating : (service as any).average_rating).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{service.inquiry_count !== undefined ? service.inquiry_count : (service as any).bookings_count} bookings</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
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
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Booking Requests</h2>
            <Link href="/dashboard/provider/bookings">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {bookings.pending.length > 0 ? (
              bookings.pending.map((booking) => (
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
                            {/* Service delivery action button */}
                            {booking.status === "confirmed" && (
                              <Button 
                                size="sm" 
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => openDeliveryDialog(booking)}
                              >
                                <Truck className="h-4 w-4 mr-2" /> Mark Delivered
                              </Button>
                            )}
                            
                            {/* Cash payment action button */}
                            {booking.status === "service_delivered" && booking.payment_type === "cash" && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openCashPaymentDialog(booking)}
                              >
                                <DollarSignIcon className="h-4 w-4 mr-2" /> Process Cash Payment
                              </Button>
                            )}
                            
                            {/* View delivery status button */}
                            {(booking.status === "service_delivered" || booking.status === "awaiting_confirmation" || booking.status === "completed") && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openDeliveryStatus(booking)}
                              >
                                <UserCheck className="h-4 w-4 mr-2" /> View Status
                              </Button>
                            )}
                            
                            {/* Traditional action buttons for other statuses */}
                            {booking.status === "pending" && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
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
              ))
            ) : (
              <Card className="p-8 text-center">
                <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground mb-4">You don't have any pending booking requests at the moment.</p>
                <Button asChild>
                  <Link href="/dashboard/provider/bookings">View All Bookings</Link>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

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

      {/* Service Delivery Modals */}
      {deliveryDialogOpen && bookingToDeliver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ServiceDeliveryForm
            booking={bookingToDeliver}
            onSuccess={handleDeliverySuccess}
            onCancel={closeDeliveryDialog}
          />
        </div>
      )}

      {cashPaymentDialogOpen && bookingForCashPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <CashPaymentForm
            booking={bookingForCashPayment}
            onSuccess={handleCashPaymentSuccess}
            onCancel={closeCashPaymentDialog}
          />
        </div>
      )}

      {deliveryStatusOpen && bookingForStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
          </div>
        </div>
      )}
    </div>
  )
}