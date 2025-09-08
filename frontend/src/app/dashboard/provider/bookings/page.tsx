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
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { providerApi } from "@/services/provider.api"
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
  
  const [loading, setLoading] = useState(true)
  
  // Service delivery modal states
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [bookingToDeliver, setBookingToDeliver] = useState<Booking | null>(null)
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false)
  const [bookingForCashPayment, setBookingForCashPayment] = useState<Booking | null>(null)
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false)
  const [bookingForStatus, setBookingForStatus] = useState<Booking | null>(null)

  // Load bookings
  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const data = await providerApi.getProviderBookings()
      
      setBookings({
        upcoming: data.upcoming,
        pending: data.pending,
        completed: data.completed
      })
    } catch (error: any) {
      console.error("Error loading bookings:", error)
      showToast.error({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        duration: 5000
      })
    } finally {
      setLoading(false)
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
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{booking.service.title}</h3>
              {getStatusBadge(booking)}
            </div>
            <p className="text-sm text-muted-foreground">
              {booking.date} at {booking.time}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <Users2 className="h-4 w-4" />
                <span>{booking.customer.name}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-4 w-4" />
                <span>{booking.customer.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          
          {/* Service delivery actions */}
          {booking.status === "confirmed" && (
            <Button 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => openDeliveryDialog(booking)}
            >
              <Truck className="h-4 w-4 mr-2" /> Mark Delivered
            </Button>
          )}
          
          {booking.status === "service_delivered" && booking.payment_type === "cash" && (
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openCashPaymentDialog(booking)}
            >
              <DollarSign className="h-4 w-4 mr-2" /> Process Cash Payment
            </Button>
          )}
          
          {(booking.status === "service_delivered" || 
            booking.status === "awaiting_confirmation" || 
            booking.status === "completed" || 
            booking.status === "disputed") && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => openDeliveryStatus(booking)}
            >
              <UserCheck className="h-4 w-4 mr-2" /> View Status
            </Button>
          )}
          
          {/* Traditional actions for other statuses */}
          {booking.status === "pending" && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Accept
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
          
          {booking.status === "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <XCircle className="h-4 w-4 mr-2" /> Cancelled
            </Button>
          )}
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage your appointments and schedule</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/provider/schedule">
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Manage Schedule
            </Button>
          </Link>
          <Button>
            <CalendarDays className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
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

      <Tabs defaultValue="upcoming" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <TabsContent value="upcoming" className="space-y-4">
          {bookings.upcoming.length > 0 ? (
            bookings.upcoming.map((booking) => (
              <div key={booking.id}>
                {renderBookingCard(booking)}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Bookings</h3>
              <p className="text-muted-foreground mb-4">You don't have any upcoming bookings at the moment.</p>
              <Button asChild>
                <Link href="/dashboard/provider/schedule">Manage Schedule</Link>
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {bookings.pending.length > 0 ? (
            bookings.pending.map((booking) => (
              <div key={booking.id}>
                {renderBookingCard(booking)}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground mb-4">You don't have any pending booking requests.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {bookings.completed.length > 0 ? (
            bookings.completed.map((booking) => (
              <div key={booking.id}>
                {renderBookingCard(booking)}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Completed Bookings</h3>
              <p className="text-muted-foreground mb-4">You don't have any completed bookings yet.</p>
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