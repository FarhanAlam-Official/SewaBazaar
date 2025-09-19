"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Users2,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock4,
  Filter,
  CalendarDays,
  Truck,
  UserCheck,
  DollarSign,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { providerApi } from "@/services/provider.api"
import type { ProviderBooking } from "@/types/provider"
import { bookingsApi } from "@/services/api"
import { showToast } from "@/components/ui/enhanced-toast"
import { getStatusInfo, requiresProviderAction } from "@/utils/statusUtils"
import ServiceDeliveryForm from "@/components/bookings/ServiceDeliveryForm"
import ServiceDeliveryStatus from "@/components/bookings/ServiceDeliveryStatus"
import CashPaymentForm from "@/components/bookings/CashPaymentForm"

// Define the Booking interface
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
  payment_type?: string
  service_delivery?: any
  booking_date?: string
  booking_time?: string
  address?: string
  city?: string
  phone?: string
  special_instructions?: string
  provider_name?: string
  provider_id?: number
  service_category?: string
  booking_slot_details?: {
    id: number
    start_time: string
    end_time: string
    slot_type: string
  }
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<{
    upcoming: Booking[]
    pending: Booking[]
    completed: Booking[]
  }>({
    upcoming: [],
    pending: [],
    completed: []
  })
  
  const [totalCounts, setTotalCounts] = useState({
    pending: 0,
    upcoming: 0,
    completed: 0
  })
  
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    customer_search: '',
    service_search: '',
    status_filter: '',
    limit: 20
  })
  
  const [availableFilters, setAvailableFilters] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Service delivery modal states
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [bookingToDeliver, setBookingToDeliver] = useState<Booking | null>(null)
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false)
  const [bookingForCashPayment, setBookingForCashPayment] = useState<Booking | null>(null)
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false)
  const [bookingForStatus, setBookingForStatus] = useState<Booking | null>(null)

  // Load bookings and filters
  useEffect(() => {
    loadBookings()
    loadFilters()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+R or F5 - Refresh bookings
      if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
        event.preventDefault()
        loadBookings()
      }
      // Ctrl+F - Focus search
      else if (event.ctrlKey && event.key === 'f') {
        event.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Quick search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
      // Escape - Clear search
      else if (event.key === 'Escape') {
        const searchInput = document.querySelector('input[placeholder*="Quick search"]') as HTMLInputElement
        if (searchInput && searchInput === document.activeElement) {
          setFilters(prev => ({ ...prev, customer_search: '', service_search: '' }))
          loadBookings({ ...filters, customer_search: '', service_search: '' })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filters])

  const loadBookings = async (customFilters?: any, retryCount = 0) => {
    try {
      setLoading(true)
      const filterParams = customFilters || filters
      
      // Use the new grouped bookings API
      const data = await providerApi.getGroupedBookings(filterParams)
      
      setBookings({
        upcoming: data.upcoming || [],
        pending: data.pending || [],
        completed: data.completed || []
      })
      
      setTotalCounts(data.total_counts || {
        pending: 0,
        upcoming: 0,
        completed: 0
      })
      
    } catch (error: any) {
      console.error("Error loading bookings:", error)
      
      // Retry logic for network errors
      if (retryCount < 2 && (error.code === 'NETWORK_ERROR' || error.response?.status >= 500)) {
        setTimeout(() => {
          loadBookings(customFilters, retryCount + 1)
        }, 1000 * (retryCount + 1)) // Exponential backoff
        return
      }
      
      showToast.error({
        title: "Error",
        description: `Failed to load bookings. ${retryCount > 0 ? 'Please check your connection and try again.' : 'Please try again.'}`,
        duration: 5000,
        action: retryCount === 0 ? {
          label: "Retry",
          onClick: () => loadBookings(customFilters)
        } : undefined
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFilters = async () => {
    try {
      const data = await providerApi.getBookingFilters()
      setAvailableFilters(data)
    } catch (error: any) {
      console.error("Error loading filters:", error)
    }
  }

  // Service delivery action handlers
  const openDeliveryDialog = (booking: Booking) => {
    setBookingToDeliver(booking)
    setDeliveryDialogOpen(true)
  }

  const closeDeliveryDialog = () => {
    setDeliveryDialogOpen(false)
    setBookingToDeliver(null)
  }

  const handleDeliverySuccess = () => {
    closeDeliveryDialog()
    loadBookings()
    showToast.success({
      title: "Service Marked as Delivered",
      description: "Customer has been notified to confirm service completion",
      duration: 3000
    })
  }

  const openCashPaymentDialog = (booking: Booking) => {
    setBookingForCashPayment(booking)
    setCashPaymentDialogOpen(true)
  }

  const closeCashPaymentDialog = () => {
    setCashPaymentDialogOpen(false)
    setBookingForCashPayment(null)
  }

  const handleCashPaymentSuccess = () => {
    closeCashPaymentDialog()
    loadBookings()
    showToast.success({
      title: "Cash Payment Processed",
      description: "Payment has been recorded successfully",
      duration: 3000
    })
  }

  const openDeliveryStatus = (booking: Booking) => {
    setBookingForStatus(booking)
    setDeliveryStatusOpen(true)
  }

  const closeDeliveryStatus = () => {
    setDeliveryStatusOpen(false)
    setBookingForStatus(null)
  }

  // Booking status update handlers
  const handleAcceptBooking = async (booking: Booking) => {
    try {
      await providerApi.updateBookingStatus(
        booking.id,
        'confirmed',
        'Booking accepted by provider'
      )
      
      showToast.success({
        title: "Booking Accepted",
        description: "The booking has been confirmed successfully",
        duration: 3000
      })
      
      loadBookings()
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error.message || "Failed to accept booking",
        duration: 5000
      })
    }
  }

  const handleRejectBooking = async (booking: Booking, reason: string) => {
    try {
      await providerApi.updateBookingStatus(
        booking.id,
        'rejected',
        'Booking rejected by provider',
        reason
      )
      
      showToast.success({
        title: "Booking Rejected",
        description: "The booking has been rejected",
        duration: 3000
      })
      
      loadBookings()
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error.message || "Failed to reject booking",
        duration: 5000
      })
    }
  }

  const handleMarkDelivered = async (booking: Booking, notes?: string) => {
    try {
      await providerApi.markServiceDelivered(booking.id, notes)
      
      showToast.success({
        title: "Service Marked as Delivered",
        description: "Customer has been notified to confirm completion",
        duration: 3000
      })
      
      loadBookings()
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error.message || "Failed to mark service as delivered",
        duration: 5000
      })
    }
  }

  // Filter handlers
  const applyFilters = async () => {
    setFilterLoading(true)
    await loadBookings(filters)
    setFilterLoading(false)
  }

  const clearFilters = async () => {
    const clearedFilters = {
      date_from: '',
      date_to: '',
      customer_search: '',
      service_search: '',
      status_filter: '',
      limit: 20
    }
    setFilters(clearedFilters)
    setFilterLoading(true)
    await loadBookings(clearedFilters)
    setFilterLoading(false)
  }

  // Enhanced status badge with new status system
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

  // Render booking card with enhanced actions
  const renderBookingCard = (booking: Booking) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{booking.service.title}</h3>
              {getStatusBadge(booking)}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              📅 {booking.date} at {booking.time}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{booking.customer.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.customer.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">NPR {booking.total_amount}</span>
              </div>
              {booking.location && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{booking.location}</span>
                </div>
              )}
            </div>
            {booking.special_instructions && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <strong>Special Instructions:</strong> {booking.special_instructions}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Message
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Service delivery actions */}
            {booking.status === "confirmed" && (
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700 text-xs"
                onClick={() => openDeliveryDialog(booking)}
              >
                <Truck className="h-3 w-3 mr-1" /> Mark Delivered
              </Button>
            )}
            
            {booking.status === "service_delivered" && booking.payment_type === "cash" && (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-xs"
                onClick={() => openCashPaymentDialog(booking)}
              >
                <DollarSign className="h-3 w-3 mr-1" /> Process Cash
              </Button>
            )}
            
            {(booking.status === "service_delivered" || 
              booking.status === "awaiting_confirmation" || 
              booking.status === "completed" || 
              booking.status === "disputed") && (
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs"
                onClick={() => openDeliveryStatus(booking)}
              >
                <UserCheck className="h-3 w-3 mr-1" /> View Status
              </Button>
            )}
            
            {/* Traditional actions for other statuses */}
            {booking.status === "pending" && (
              <>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-xs"
                  onClick={() => handleAcceptBooking(booking)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs"
                  onClick={() => handleRejectBooking(booking, 'Provider declined the booking')}
                >
                  <XCircle className="h-3 w-3 mr-1" /> Decline
                </Button>
              </>
            )}
            
            {booking.status === "cancelled" && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs"
                disabled
              >
                <XCircle className="h-3 w-3 mr-1" /> Cancelled
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Loading your appointments and schedule...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">
            Manage your appointments and schedule
            {!loading && (
              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {(totalCounts.pending || 0) + (totalCounts.upcoming || 0) + (totalCounts.completed || 0)} total
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <input
              type="text"
              placeholder="Quick search customers or services..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filters.customer_search}
              onChange={(e) => {
                const value = e.target.value
                setFilters(prev => ({ ...prev, customer_search: value, service_search: value }))
                // Auto-apply search after a short delay
                setTimeout(() => {
                  if (value === filters.customer_search) {
                    loadBookings({ ...filters, customer_search: value, service_search: value })
                  }
                }, 500)
              }}
            />
            <Users2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/provider/schedule">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </Link>
            <Button size="sm">
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              title="Keyboard shortcuts: Ctrl+F (search), Ctrl+R (refresh), Esc (clear search)"
              className="text-muted-foreground hover:text-foreground"
            >
              ?
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock4 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Bookings</p>
              <h3 className="text-2xl font-bold">
                {bookings.upcoming.filter(b => new Date(b.date).toDateString() === new Date().toDateString()).length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <h3 className="text-2xl font-bold">
                {bookings.completed.filter(b => new Date(b.date).toDateString() === new Date().toDateString()).length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <h3 className="text-2xl font-bold">{bookings.pending.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Filter Panel */}
      {showFilters && (
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer Search</label>
              <input
                type="text"
                placeholder="Search by customer name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.customer_search}
                onChange={(e) => setFilters(prev => ({ ...prev, customer_search: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Service Search</label>
              <input
                type="text"
                placeholder="Search by service name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.service_search}
                onChange={(e) => setFilters(prev => ({ ...prev, service_search: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status Filter</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={filters.status_filter}
                onChange={(e) => setFilters(prev => ({ ...prev, status_filter: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="service_delivered">Service Delivered</option>
                <option value="awaiting_confirmation">Awaiting Confirmation</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={applyFilters} 
              disabled={filterLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {filterLoading ? 'Applying...' : 'Apply Filters'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearFilters}
              disabled={filterLoading}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="upcoming" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({totalCounts.upcoming || bookings.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({totalCounts.pending || bookings.pending.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({totalCounts.completed || bookings.completed.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadBookings()}
              disabled={loading}
              title="Refresh bookings (Ctrl+R)"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : bookings.upcoming.length > 0 ? (
            bookings.upcoming.map((booking) => (
              <div key={booking.id}>
                {renderBookingCard(booking)}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Bookings</h3>
              <p className="text-muted-foreground mb-4">
                {filters.customer_search || filters.service_search || filters.date_from || filters.date_to
                  ? "No bookings match your current filters."
                  : "You don't have any upcoming bookings at the moment."
                }
              </p>
              {!(filters.customer_search || filters.service_search || filters.date_from || filters.date_to) && (
                <Button asChild>
                  <Link href="/dashboard/provider/schedule">Manage Schedule</Link>
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : bookings.pending.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    {bookings.pending.length} booking{bookings.pending.length > 1 ? 's' : ''} require{bookings.pending.length === 1 ? 's' : ''} your attention
                  </span>
                </div>
              </div>
              {bookings.pending.map((booking) => (
                <div key={booking.id}>
                  {renderBookingCard(booking)}
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground mb-4">
                {filters.customer_search || filters.service_search || filters.date_from || filters.date_to
                  ? "No pending bookings match your current filters."
                  : "You don't have any pending booking requests."
                }
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : bookings.completed.length > 0 ? (
            bookings.completed.map((booking) => (
              <div key={booking.id}>
                {renderBookingCard(booking)}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Completed Bookings</h3>
              <p className="text-muted-foreground mb-4">
                {filters.customer_search || filters.service_search || filters.date_from || filters.date_to
                  ? "No completed bookings match your current filters."
                  : "You don't have any completed bookings yet."
                }
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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