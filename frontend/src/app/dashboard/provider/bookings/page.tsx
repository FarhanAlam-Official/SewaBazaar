"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Truck,
  UserCheck,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
  Eye,
  MoreHorizontal,
  AlertTriangle,
  User,
  FileText,
  Download
} from "lucide-react"

import { getStatusInfo, requiresProviderAction } from "@/utils/statusUtils"
import ServiceDeliveryForm from "@/components/bookings/ServiceDeliveryForm"
import ServiceDeliveryStatus from "@/components/bookings/ServiceDeliveryStatus"
import CashPaymentForm from "@/components/bookings/CashPaymentForm"
import RejectionModal from "@/components/bookings/RejectionModal"
import { useProviderBookings } from "@/hooks/useProviderBookings"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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
      duration: 0.3,
      type: "spring" as const,
      damping: 20,
      stiffness: 100
    }
  }
}

// Enhanced Booking Card Component
const BookingCard: React.FC<{
  booking: any
  onStatusUpdate: (id: number, status: string) => void
  onMarkDelivered: (booking: any) => void
  onProcessPayment: (booking: any) => void
  onViewStatus: (booking: any) => void
  onContactCustomer: (booking: any) => void
}> = ({ 
  booking, 
  onStatusUpdate, 
  onMarkDelivered, 
  onProcessPayment, 
  onViewStatus,
  onContactCustomer 
}) => {
  const statusInfo = getStatusInfo(booking.status)
  const needsAction = requiresProviderAction(booking)

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
        booking.status === 'pending' ? 'border-l-yellow-500' :
        booking.status === 'confirmed' ? 'border-l-blue-500' :
        booking.status === 'service_delivered' ? 'border-l-purple-500' :
        booking.status === 'completed' ? 'border-l-green-500' :
        booking.status === 'cancelled' ? 'border-l-red-500' :
        'border-l-blue-500'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{booking.service.title}</h3>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge className={`${statusInfo.color} ${needsAction ? 'ring-2 ring-orange-400 ring-opacity-50 animate-pulse' : ''}`}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                    {needsAction && <span className="ml-1">⚠️</span>}
                  </Badge>
                </motion.div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <User className="w-4 h-4" />
                <span className="font-medium">{booking.customer.name}</span>
                {booking.customer.phone && (
                  <>
                    <span>•</span>
                    <Phone className="w-4 h-4" />
                    <span>{booking.customer.phone}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                NPR {(booking.total_amount || booking.price)?.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Booking #{booking.id}
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{booking.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="font-medium">{booking.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="font-medium truncate">{booking.location}</span>
            </div>
          </div>

          {/* Special Instructions */}
          {booking.special_instructions && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Special Instructions:</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">{booking.special_instructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Contact Customer */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onContactCustomer(booking)}
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact
            </Button>

            {/* Status-specific actions */}
            {booking.status === "pending" && (
              <>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => onStatusUpdate(booking.id, "confirmed")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onStatusUpdate(booking.id, "rejected")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </>
            )}

            {booking.status === "confirmed" && (
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => onMarkDelivered(booking)}
              >
                <Truck className="h-4 w-4 mr-2" />
                Mark Delivered
              </Button>
            )}

            {booking.status === "service_delivered" && booking.payment_type === "cash" && (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => onProcessPayment(booking)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            )}

            {(booking.status === "service_delivered" || booking.status === "awaiting_confirmation" || booking.status === "completed") && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewStatus(booking)}
                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ProviderBookingsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  // Modal states
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [bookingToDeliver, setBookingToDeliver] = useState<any>(null)
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false)
  const [bookingForCashPayment, setBookingForCashPayment] = useState<any>(null)
  const [deliveryStatusOpen, setDeliveryStatusOpen] = useState(false)
  const [bookingForStatus, setBookingForStatus] = useState<any>(null)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [bookingForContact, setBookingForContact] = useState<any>(null)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [bookingToReject, setBookingToReject] = useState<any>(null)

  const {
    bookings,
    loading,
    updating,
    error,
    refreshBookings,
    updateBookingStatus,
    markServiceDelivered,
    processCashPayment,
    getServiceDeliveryStatus,
    getBookingsByStatus,
    getTotalBookingsCount
  } = useProviderBookings({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  })

  // Filter bookings based on search and filters
  const filteredBookings = useCallback(() => {
    let allBookings = [...bookings.pending, ...bookings.upcoming, ...bookings.completed]
    
    // Apply search filter
    if (searchQuery) {
      allBookings = allBookings.filter(booking => 
        booking.service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.id.toString().includes(searchQuery)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      allBookings = allBookings.filter(booking => booking.status === statusFilter)
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      
      switch (dateFilter) {
        case 'today':
          allBookings = allBookings.filter(booking => {
            const bookingDate = new Date(booking.date)
            return bookingDate.toDateString() === today.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          allBookings = allBookings.filter(booking => {
            const bookingDate = new Date(booking.date)
            return bookingDate >= weekAgo
          })
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          allBookings = allBookings.filter(booking => {
            const bookingDate = new Date(booking.date)
            return bookingDate >= monthAgo
          })
          break
      }
    }
    
    return allBookings
  }, [bookings, searchQuery, statusFilter, dateFilter])

  // Get bookings by tab
  const getBookingsByTab = useCallback((tab: string) => {
    switch (tab) {
      case 'pending':
        return bookings.pending
      case 'upcoming':
        return bookings.upcoming
      case 'completed':
        return bookings.completed
      default:
        return filteredBookings()
    }
  }, [bookings, filteredBookings])

  // Action handlers
  const handleStatusUpdate = useCallback(async (bookingId: number, status: string) => {
    try {
      if (status === 'rejected') {
        // Find the booking to show in rejection modal
        const allBookings = [...bookings.pending, ...bookings.upcoming, ...bookings.completed]
        const booking = allBookings.find(b => b.id === bookingId)
        if (booking) {
          setBookingToReject(booking)
          setRejectionDialogOpen(true)
        }
        return
      } else {
        await updateBookingStatus(bookingId, status)
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [updateBookingStatus, bookings])

  const handleRejectBooking = useCallback(async (rejectionReason: string) => {
    if (bookingToReject) {
      try {
        await updateBookingStatus(bookingToReject.id, 'rejected', '', rejectionReason)
        setRejectionDialogOpen(false)
        setBookingToReject(null)
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  }, [bookingToReject, updateBookingStatus])

  const handleMarkDelivered = useCallback((booking: any) => {
    setBookingToDeliver(booking)
    setDeliveryDialogOpen(true)
  }, [])

  const handleProcessPayment = useCallback((booking: any) => {
    setBookingForCashPayment(booking)
    setCashPaymentDialogOpen(true)
  }, [])

  const handleViewStatus = useCallback((booking: any) => {
    setBookingForStatus(booking)
    setDeliveryStatusOpen(true)
  }, [])

  const handleContactCustomer = useCallback((booking: any) => {
    setBookingForContact(booking)
    setContactDialogOpen(true)
  }, [])

  const handleDeliverySuccess = useCallback(() => {
    // Just close the dialog - the service has already been marked as delivered
    // by the ServiceDeliveryForm component
    setDeliveryDialogOpen(false)
    setBookingToDeliver(null)
  }, [])

  const handlePaymentSuccess = useCallback(async () => {
    if (bookingForCashPayment) {
      try {
        await processCashPayment(bookingForCashPayment.id, bookingForCashPayment.total_amount)
        setCashPaymentDialogOpen(false)
        setBookingForCashPayment(null)
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  }, [bookingForCashPayment, processCashPayment])

  const currentBookings = getBookingsByTab(activeTab)

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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Booking Management</h1>
          <p className="text-muted-foreground">Manage your bookings and customer interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={refreshBookings}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
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
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshBookings}
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

      {/* Filters */}
      <motion.div 
        className="mb-6 flex flex-col sm:flex-row gap-4"
        variants={cardVariants}
      >
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings, customers, or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="service_delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Booking Tabs */}
      <motion.div variants={cardVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:border-gray-300"
            >
              All ({getTotalBookingsCount()})
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-900 data-[state=active]:border-yellow-300"
            >
              Pending ({bookings.pending.length})
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:border-blue-300"
            >
              Upcoming ({bookings.upcoming.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 data-[state=active]:border-indigo-300"
            >
              Completed ({bookings.completed.length})
            </TabsTrigger>
          </TabsList>

          {/* Bookings List */}
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton
              [1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : currentBookings.length > 0 ? (
              <motion.div 
                className="space-y-4"
                variants={containerVariants}
              >
                {currentBookings.map((booking: any) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onStatusUpdate={handleStatusUpdate}
                    onMarkDelivered={handleMarkDelivered}
                    onProcessPayment={handleProcessPayment}
                    onViewStatus={handleViewStatus}
                    onContactCustomer={handleContactCustomer}
                  />
                ))}
              </motion.div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' 
                    ? "You don't have any bookings yet" 
                    : `No ${activeTab} bookings found`}
                </p>
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setDateFilter('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </Card>
            )}
          </div>
        </Tabs>
      </motion.div>

      {/* Service Delivery Dialogs */}
      <AnimatePresence>
        {deliveryDialogOpen && bookingToDeliver && (
          <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Mark Service as Delivered</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 pr-2">
                <ServiceDeliveryForm
                  booking={bookingToDeliver}
                  onCancel={() => {
                    setDeliveryDialogOpen(false)
                    setBookingToDeliver(null)
                  }}
                  onSuccess={handleDeliverySuccess}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {cashPaymentDialogOpen && bookingForCashPayment && (
          <CashPaymentForm
            booking={bookingForCashPayment}
            onCancel={() => {
              setCashPaymentDialogOpen(false)
              setBookingForCashPayment(null)
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}
        
        {deliveryStatusOpen && bookingForStatus && (
          <ServiceDeliveryStatus
            booking={bookingForStatus}
            userRole="provider"
          />
        )}

        {/* Contact Customer Dialog */}
        {contactDialogOpen && bookingForContact && (
          <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Contact Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">{bookingForContact.customer.name}</h4>
                  <div className="space-y-2 text-sm">
                    {bookingForContact.customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{bookingForContact.customer.phone}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`tel:${bookingForContact.customer.phone}`)}
                        >
                          Call
                        </Button>
                      </div>
                    )}
                    {bookingForContact.customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{bookingForContact.customer.email}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`mailto:${bookingForContact.customer.email}`)}
                        >
                          Email
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Send Message</label>
                  <Textarea 
                    placeholder="Type your message to the customer..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  showToast.success({
                    title: "Message Sent",
                    description: "Your message has been sent to the customer",
                    duration: 3000
                  })
                  setContactDialogOpen(false)
                }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Rejection Modal */}
        {rejectionDialogOpen && bookingToReject && (
          <RejectionModal
            isOpen={rejectionDialogOpen}
            onClose={() => {
              setRejectionDialogOpen(false)
              setBookingToReject(null)
            }}
            onConfirm={handleRejectBooking}
            bookingId={bookingToReject.id}
            serviceTitle={bookingToReject.service?.title || 'Unknown Service'}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}