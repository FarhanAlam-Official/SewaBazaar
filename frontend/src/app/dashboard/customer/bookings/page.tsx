"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { showToast } from "@/components/ui/enhanced-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Tag,  
  CheckCircle, 
  XCircle,
  BookOpen,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ClockIcon,
  CheckCircle2,
  Ban
} from "lucide-react"
import { customerApi } from "@/services/customer.api"
import { format } from "date-fns"
import { formatTime12Hr, formatBookingTime, extractTimeFromSlot,formatTimeRange } from "@/utils/timeUtils"
import { Skeleton } from "@/components/ui/skeleton"
import CancellationDialog from "./CancellationDialog"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

// Interface for booking data structure
interface Booking {
  id: number
  service: {
    title: string
    image_url: string
  }
  booking_date: string
  booking_time: string
  address: string
  city: string
  phone: string
  status: string
  price: number
  total_amount: number
  updated_at: string
  provider_name?: string
  provider_id?: number  // Added provider ID for linking
  service_category?: string
  booking_slot?: string
  special_instructions?: string
  booking_slot_details?: {
    id: number
    start_time: string
    end_time: string
    slot_type: string
  }
  reschedule_reason?: string
  reschedule_history?: Array<{
    reason: string
    timestamp: string
    old_date: string
    old_time: string
    new_date: string
    new_time: string
    price_change: number
  }>
  cancellation_reason?: string
}

// Transform CustomerBooking to Booking interface with better error handling
// This function ensures that service names and provider names are properly extracted
// from various possible data structures returned by different API endpoints
// It handles both string and object formats for service and provider information
const transformCustomerBooking = (customerBooking: any): Booking => {
  // Add validation and default values to prevent undefined/null issues
  
  const date = customerBooking.date || customerBooking.booking_date || new Date().toISOString().split('T')[0];
  const time = customerBooking.time || customerBooking.booking_time || '00:00';
  
  // Extract service information - handle both string and object formats
  let serviceTitle = 'Unknown Service';
  if (typeof customerBooking.service === 'string') {
    // If service is a string, it might be the title or ID
    serviceTitle = customerBooking.service;
  } else if (typeof customerBooking.service === 'object' && customerBooking.service !== null) {
    // If service is an object, extract the title
    serviceTitle = customerBooking.service.title || customerBooking.service.name || 'Unknown Service';
  } else if (customerBooking.service_title) {
    serviceTitle = customerBooking.service_title;
  } else if (customerBooking.service_name) {
    serviceTitle = customerBooking.service_name;
  } else if (customerBooking.service_details?.title) {
    serviceTitle = customerBooking.service_details.title;
  }
  
  // Extract provider information - handle both string and object formats
  let providerName = 'Unknown Provider';
  let providerId: number | undefined = undefined;
  if (typeof customerBooking.provider === 'string') {
    // If provider is a string, it might be the name or ID
    providerName = customerBooking.provider;
  } else if (typeof customerBooking.provider === 'object' && customerBooking.provider !== null) {
    // If provider is an object, extract the name
    providerName = customerBooking.provider.name || customerBooking.provider.full_name || 'Unknown Provider';
    providerId = customerBooking.provider.id || customerBooking.provider_id;
  } else if (customerBooking.provider_name) {
    providerName = customerBooking.provider_name;
    providerId = customerBooking.provider_id;
  } else if (customerBooking.service_details?.provider) {
    // Handle nested provider in service_details
    if (typeof customerBooking.service_details.provider === 'string') {
      providerName = customerBooking.service_details.provider;
    } else {
      providerName = customerBooking.service_details.provider.name || 
                    customerBooking.service_details.provider.full_name ||
                    (customerBooking.service_details.provider.first_name && customerBooking.service_details.provider.last_name ? 
                      `${customerBooking.service_details.provider.first_name} ${customerBooking.service_details.provider.last_name}` : 
                      customerBooking.service_details.provider.first_name) || 
                    'Unknown Provider';
      providerId = customerBooking.service_details.provider.id;
    }
  }
  
  // If provider_id is explicitly provided, use it
  if (customerBooking.provider_id) {
    providerId = customerBooking.provider_id;
  }
  

  return {
    id: customerBooking.id || 0,
    service: {
      title: serviceTitle,
      image_url: customerBooking.image || customerBooking.service_image || customerBooking.service_details?.image || ''
    },
    booking_date: date,
    booking_time: time,
    address: customerBooking.location || customerBooking.address || '',
    city: customerBooking.city || '',
    phone: customerBooking.phone || '',
    status: customerBooking.status || 'pending',
    price: customerBooking.price || customerBooking.total_amount || 0,
    total_amount: customerBooking.total_amount || customerBooking.price || 0,
    updated_at: customerBooking.updated_at || new Date().toISOString(),
    provider_name: providerName,
    provider_id: providerId,  // Include provider ID for linking
    service_category: customerBooking.service_category || customerBooking.category || customerBooking.service_details?.category?.title || '',
    booking_slot: customerBooking.booking_slot || '',
    special_instructions: customerBooking.special_instructions || '',
    booking_slot_details: customerBooking.booking_slot_details || null,
    reschedule_reason: customerBooking.reschedule_reason && customerBooking.reschedule_reason.trim() !== '' ? customerBooking.reschedule_reason : null,
    reschedule_history: customerBooking.reschedule_history || [],
    cancellation_reason: customerBooking.cancellation_reason && customerBooking.cancellation_reason.trim() !== '' ? customerBooking.cancellation_reason : null
  }
}

export default function CustomerBookingsPage() {
  const router = useRouter()
  
  // State for loading status and bookings data
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<{
    upcoming: Booking[]
    completed: Booking[]
    cancelled: Booking[]
  }>({
    upcoming: [],
    completed: [],
    cancelled: []
  })
  
  // Pagination state
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 10
  })
  
  // State for rescheduling functionality - using new reschedule page
  // No modal state needed - we navigate to the reschedule page instead
  
  // State for cancellation functionality - simplified
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null)

  // Load bookings when component mounts
  useEffect(() => {
    loadBookings()
  }, [])

  // Fetch bookings from API with pagination
  const loadBookings = async (page: number = 1) => {
    try {
      setLoading(true)
      // Get all bookings in one call with grouped format and pagination
      const allBookings = await customerApi.getBookings({
        page: page,
        page_size: pagination.pageSize
      })
      
      // Transform the data to match the expected interface
      const transformedUpcoming = allBookings.upcoming.map(transformCustomerBooking);
      const transformedCompleted = allBookings.completed.map(transformCustomerBooking);
      const transformedCancelled = allBookings.cancelled.map(transformCustomerBooking);
      
      setBookings({
        upcoming: transformedUpcoming,
        completed: transformedCompleted,
        cancelled: transformedCancelled
      })
      
      // Update pagination state
      setPagination({
        count: allBookings.count,
        next: allBookings.next,
        previous: allBookings.previous,
        currentPage: page,
        pageSize: pagination.pageSize
      })
      
      // Show success message only if there are bookings
      const totalBookings = transformedUpcoming.length + transformedCompleted.length + transformedCancelled.length;
      if (totalBookings > 0) {
        showToast.success({
          title: "📋 Bookings Loaded!",
          description: `Successfully loaded ${totalBookings} booking${totalBookings !== 1 ? 's' : ''}! Ready to manage your services 🎯`,
          duration: 3000
        })
      }
    } catch (error: any) {
      console.error("Error in loadBookings:", error);
      showToast.error({
        title: "🚫 Loading Failed!",
        description: error.message || "Couldn't load your bookings. Please check your connection and try again! 🔌",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    loadBookings(newPage)
  }

  // Handle booking rescheduling
  // Navigate to reschedule page instead of opening modal
  const navigateToReschedule = useCallback((bookingId: number) => {
    router.push(`/dashboard/customer/bookings/reschedule/${bookingId}`)
  }, [router])

  // Simple cancellation handlers
  const openCancelDialog = useCallback((bookingId: number) => {
    setBookingToCancel(bookingId)
    setCancelDialogOpen(true)
  }, [])

  const closeCancelDialog = useCallback(() => {
    setCancelDialogOpen(false)
    setBookingToCancel(null)
  }, [])

  const handleCancelSuccess = useCallback(() => {
    loadBookings(pagination.currentPage)
  }, [pagination.currentPage])


  // Get status badge with enhanced styling, icons, and animations
  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border shadow-sm hover:shadow-md active:scale-95"
    
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50 dark:hover:bg-amber-800/40 dark:hover:border-amber-600/60 dark:hover:shadow-amber-500/20`}>
            <ClockIcon className="w-3 h-3" />
            Pending
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-blue-200/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 dark:hover:bg-blue-800/40 dark:hover:border-blue-600/60 dark:hover:shadow-blue-500/20`}>
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </Badge>
        )
      case 'completed':
        return (
          <Badge className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50 dark:hover:bg-emerald-800/40 dark:hover:border-emerald-600/60 dark:hover:shadow-emerald-500/20`}>
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className={`${baseClasses} bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-red-200/50 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50 dark:hover:bg-red-800/50 dark:hover:border-red-600/70 dark:hover:shadow-red-500/25`}>
            <Ban className="w-3 h-3" />
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className={`${baseClasses} border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30 dark:border-muted/50 dark:text-muted-foreground dark:hover:border-muted/70 dark:hover:bg-muted/20`}>
            <AlertCircle className="w-3 h-3" />
            {status}
          </Badge>
        )
    }
  }

  // Component for displaying individual booking cards with enhanced UI
  const BookingCard = ({ booking }: { booking: Booking }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="transition-all duration-300"
    >
      <Card className="mb-4 hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/30 rounded-xl overflow-hidden dark:border-border dark:hover:border-primary/50">
        <CardHeader className="pb-3 bg-muted/30 dark:bg-muted/10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            {/* Service information section */}
            <div className="flex-1">
              <div className="flex items-start gap-3">
                {/* Service image or placeholder */}
                {booking.service.image_url ? (
                  <img 
                    src={booking.service.image_url} 
                    alt={booking.service.title} 
                    className="w-16 h-16 rounded-lg object-cover border shadow-sm dark:border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border shadow-sm dark:border-border dark:bg-muted/20">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  {/* Service title and booking ID */}
                  <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground">{booking.service.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-muted-foreground text-sm dark:text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Booking #{booking.id}
                    </span>
                    {/* Provider information as a link */}
                    {booking.provider_name && (
                      booking.provider_id ? (
                        <Link 
                          href={`/providers/${booking.provider_id}`} 
                          className="flex items-center gap-1 text-muted-foreground text-sm dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors duration-200"
                        >
                          <UserCheck className="h-3 w-3" />
                          {booking.provider_name}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground text-sm dark:text-muted-foreground">
                          <UserCheck className="h-3 w-3" />
                          {booking.provider_name}
                        </span>
                      )
                    )}
                    {/* Service category */}
                    {booking.service_category && (
                      <Badge variant="secondary" className="text-xs bg-secondary/50 px-2 py-1 dark:bg-secondary/30 dark:text-foreground">
                        {booking.service_category}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </div>
            
            {/* Price and status section */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg text-foreground dark:text-foreground">Rs. {booking.total_amount}</span>
              </div>
              {getStatusBadge(booking.status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Booking details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Booking date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground dark:text-foreground">
                  {booking.booking_date ? format(new Date(booking.booking_date), "PPP") : 'Date not set'}
                </span>
              </div>
              
              {/* Booking time and slot */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground dark:text-foreground">
                  {booking.booking_slot_details?.start_time && booking.booking_slot_details?.end_time
                    ? formatTimeRange(booking.booking_slot_details.start_time, booking.booking_slot_details.end_time)
                    : (() => {
                        // If no slot details, try to show time range by calculating end time (assume 1 hour duration)
                        const startTime = booking.booking_time;
                        if (startTime) {
                          const [hours, minutes] = startTime.split(':').map(Number);
                          const endHours = hours + 1;
                          const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                          return formatTimeRange(startTime, endTime);
                        }
                        return formatTime12Hr(booking.booking_time);
                      })()
                  }
                </span>
                {/* Always show badge - use slot type if available, otherwise default to 'normal' */}
                <Badge className={cn(
                  "text-xs font-medium transition-all duration-300 hover:scale-105 transform cursor-pointer",
                  (booking.booking_slot_details?.slot_type || 'normal') === 'normal' && "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100 hover:shadow-md",
                  (booking.booking_slot_details?.slot_type || 'normal') === 'express' && "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 hover:bg-purple-200 hover:text-purple-900 dark:hover:bg-purple-800 dark:hover:text-purple-100 hover:shadow-md",
                  (booking.booking_slot_details?.slot_type || 'normal') === 'urgent' && "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 hover:bg-orange-200 hover:text-orange-900 dark:hover:bg-orange-800 dark:hover:text-orange-100 hover:shadow-md",
                  (booking.booking_slot_details?.slot_type || 'normal') === 'emergency' && "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 hover:bg-red-200 hover:text-red-900 dark:hover:bg-red-800 dark:hover:text-red-100 hover:shadow-md"
                )}>
                  {(booking.booking_slot_details?.slot_type || 'normal').charAt(0).toUpperCase() + (booking.booking_slot_details?.slot_type || 'normal').slice(1)}
                </Badge>
              </div>
              
              {/* Location information */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground dark:text-foreground">{booking.address || 'Address not set'}{booking.city ? `, ${booking.city}` : ''}</span>
              </div>
              
              {/* Contact information */}
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground dark:text-foreground">{booking.phone || 'Phone not provided'}</span>
              </div>
            </div>
            
            {/* Parse and display reschedule history and special instructions separately */}
            {(() => {
              // Get reschedule history (new format) or create from legacy data
              const rescheduleHistory = booking.reschedule_history && booking.reschedule_history.length > 0 
                ? booking.reschedule_history 
                : (booking.reschedule_reason && booking.reschedule_reason.trim() !== '') 
                  ? [{
                      reason: booking.reschedule_reason,
                      timestamp: booking.updated_at || new Date().toISOString(),
                      old_date: '',
                      old_time: '',
                      new_date: booking.booking_date,
                      new_time: booking.booking_time,
                      price_change: 0
                    }]
                  : []
              
              // No legacy note field to clean
              
              return (
                <>
                  {/* Reschedule history */}
                  {rescheduleHistory.length > 0 && (
                    <div className="pt-3 border-t border-border dark:border-border">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
                            {rescheduleHistory.length === 1 ? 'Reschedule Reason' : `Reschedule History (${rescheduleHistory.length}/3)`}
                          </p>
                          
                          {/* Show latest reason prominently */}
                          <div className="bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800 mb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                                  {rescheduleHistory[rescheduleHistory.length - 1].reason}
                                </p>
                                {rescheduleHistory[rescheduleHistory.length - 1].old_date && rescheduleHistory[rescheduleHistory.length - 1].new_date && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    {format(new Date(rescheduleHistory[rescheduleHistory.length - 1].old_date), 'MMM d')} at {formatTime12Hr(rescheduleHistory[rescheduleHistory.length - 1].old_time)} → {format(new Date(rescheduleHistory[rescheduleHistory.length - 1].new_date), 'MMM d')} at {formatTime12Hr(rescheduleHistory[rescheduleHistory.length - 1].new_time)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-orange-500 dark:text-orange-400">
                                  {format(new Date(rescheduleHistory[rescheduleHistory.length - 1].timestamp), 'MMM d, h:mm a')}
                                </p>
                                {rescheduleHistory[rescheduleHistory.length - 1].price_change !== 0 && (
                                  <p className={`text-xs font-medium ${rescheduleHistory[rescheduleHistory.length - 1].price_change > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {rescheduleHistory[rescheduleHistory.length - 1].price_change > 0 ? '+' : ''}Rs. {Math.abs(rescheduleHistory[rescheduleHistory.length - 1].price_change).toFixed(0)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Show previous reasons in collapsible section if more than 1 */}
                          {rescheduleHistory.length > 1 && (
                            <details className="group">
                              <summary className="cursor-pointer text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium">
                                View Previous Reasons ({rescheduleHistory.length - 1})
                              </summary>
                              <div className="mt-2 space-y-2">
                                {rescheduleHistory.slice(0, -1).reverse().map((entry, index) => (
                                  <div key={index} className="bg-orange-25 dark:bg-orange-900/10 px-3 py-2 rounded-lg border border-orange-100 dark:border-orange-800/50">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                          {entry.reason}
                                        </p>
                                        {entry.old_date && entry.new_date && (
                                          <p className="text-xs text-orange-500 dark:text-orange-500 mt-1">
                                            {format(new Date(entry.old_date), 'MMM d')} at {formatTime12Hr(entry.old_time)} → {format(new Date(entry.new_date), 'MMM d')} at {formatTime12Hr(entry.new_time)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-orange-400 dark:text-orange-500">
                                          {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                                        </p>
                                        {entry.price_change !== 0 && (
                                          <p className={`text-xs font-medium ${entry.price_change > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                                            {entry.price_change > 0 ? '+' : ''}Rs. {Math.abs(entry.price_change).toFixed(0)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancellation reason */}
                  {booking.status === 'cancelled' && booking.cancellation_reason && booking.cancellation_reason.trim() !== '' && (
                    <div className="pt-3 border-t border-border dark:border-border">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
                            Cancellation Reason
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                            {booking.cancellation_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special instructions */}
                  {booking.special_instructions && (
                    <div className="pt-3 border-t border-border dark:border-border">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                            Special Instructions
                          </p>
                <p className="text-sm text-foreground dark:text-foreground">
                            {booking.special_instructions}
                </p>
                        </div>
                      </div>
              </div>
            )}
                  
                </>
              )
            })()}

            {/* Action buttons for active bookings */}
            <div className="flex flex-wrap gap-2 pt-4">
              {booking.status === "pending" || booking.status === "confirmed" ? (
                <>
                  {/* Navigate to reschedule page */}
                      <Button 
                        variant="outline" 
                        size="sm"
                    onClick={() => navigateToReschedule(booking.id)}
                        className="hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200 dark:hover:bg-primary/20 dark:hover:border-primary/70 dark:text-foreground hover:shadow-md hover:shadow-primary/20 dark:hover:shadow-primary/15 active:scale-95"
                      >
                        Reschedule
                      </Button>

                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => openCancelDialog(booking.id)}
                    className="hover:bg-destructive/90 hover:text-destructive-foreground hover:scale-105 transition-all duration-200 dark:bg-red-600 dark:hover:bg-red-500 dark:text-white hover:shadow-lg hover:shadow-destructive/25 dark:hover:shadow-red-500/30 active:scale-95"
                  >
                    Cancel Booking
                  </Button>

                </>
              ) : null}
            </div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // Loading skeleton component with animations
  const LoadingBookingCard = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 dark:bg-background/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-16 h-16 rounded-md dark:bg-muted/30" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 dark:bg-muted/30" />
                <Skeleton className="h-4 w-32 dark:bg-muted/30" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-5 w-24 dark:bg-muted/30" />
              <Skeleton className="h-6 w-20 rounded-full dark:bg-muted/30" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full dark:bg-muted/30" />
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-8 w-24 dark:bg-muted/30" />
              <Skeleton className="h-8 w-24 dark:bg-muted/30" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // Pagination component
  const PaginationComponent = () => {
    if (pagination.count <= pagination.pageSize) return null;
    
    const totalPages = Math.ceil(pagination.count / pagination.pageSize);
    const currentPage = pagination.currentPage;
    
    return (
      <div className="flex items-center justify-between border-t border-border px-2 py-4 dark:border-border">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
          Showing {(currentPage - 1) * pagination.pageSize + 1} to {Math.min(currentPage * pagination.pageSize, pagination.count)} of {pagination.count} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="dark:border-border dark:text-foreground dark:hover:bg-muted/50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate start page for pagination window
              let startPage = Math.max(1, currentPage - 2);
              if (startPage > totalPages - 4) {
                startPage = Math.max(1, totalPages - 4);
              }
              
              const page = startPage + i;
              if (page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={page === currentPage 
                    ? "dark:bg-primary dark:text-primary-foreground" 
                    : "dark:border-border dark:text-foreground dark:hover:bg-muted/50"
                  }
                >
                  {page}
                </Button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-2 text-muted-foreground dark:text-muted-foreground">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className="dark:border-border dark:text-foreground dark:hover:bg-muted/50"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="dark:border-border dark:text-foreground dark:hover:bg-muted/50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      {/* Separate cancellation dialog component - completely isolated */}
      <CancellationDialog
        isOpen={cancelDialogOpen}
        bookingId={bookingToCancel}
        onClose={closeCancelDialog}
        onSuccess={handleCancelSuccess}
      />

      {/* Reschedule functionality now uses dedicated page instead of modal */}
      
      {/* Page header with better styling */}
      <div className="mb-8 pb-4 border-b border-border dark:border-border">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent dark:from-primary dark:to-secondary">
          My Bookings
        </h1>
        <p className="text-muted-foreground mt-2 dark:text-muted-foreground">Manage your service bookings</p>
      </div>

      {/* Booking tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 dark:bg-muted/20 p-1 rounded-lg">
          <TabsTrigger 
            value="upcoming" 
            className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground rounded-md transition-all duration-200"
          >
            Upcoming ({bookings.upcoming.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground rounded-md transition-all duration-200"
          >
            Completed ({bookings.completed.length})
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled" 
            className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground rounded-md transition-all duration-200"
          >
            Cancelled ({bookings.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Upcoming bookings tab */}
          <TabsContent value="upcoming">
            {loading ? (
              Array(3).fill(0).map((_, i) => <LoadingBookingCard key={i} />)
            ) : bookings.upcoming.length > 0 ? (
              <>
                {bookings.upcoming.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
                <PaginationComponent />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="text-center py-12 border-dashed border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/10 dark:border-border dark:hover:border-primary/50 dark:hover:shadow-primary/20 rounded-xl">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl dark:text-foreground">No Upcoming Bookings</CardTitle>
                    <CardDescription className="mt-2 dark:text-muted-foreground">
                      You don't have any upcoming bookings at the moment. Ready to schedule a service? 🛠️
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="mt-4 hover:scale-105 transition-transform">
                      <a href="/services">Book a Service</a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Completed bookings tab */}
          <TabsContent value="completed">
            {loading ? (
              Array(3).fill(0).map((_, i) => <LoadingBookingCard key={i} />)
            ) : bookings.completed.length > 0 ? (
              <>
                {bookings.completed.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
                <PaginationComponent />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="text-center py-12 border-dashed border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/10 dark:border-border dark:hover:border-primary/50 dark:hover:shadow-primary/20 rounded-xl">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <CheckCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl dark:text-foreground">No Completed Bookings</CardTitle>
                    <CardDescription className="mt-2 dark:text-muted-foreground">
                      You don't have any completed bookings yet. Your completed services will appear here once finished ✅
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Cancelled bookings tab */}
          <TabsContent value="cancelled">
            {loading ? (
              Array(3).fill(0).map((_, i) => <LoadingBookingCard key={i} />)
            ) : bookings.cancelled.length > 0 ? (
              <>
                {bookings.cancelled.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
                <PaginationComponent />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="text-center py-12 border-dashed border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/10 dark:border-border dark:hover:border-primary/50 dark:hover:shadow-primary/20 rounded-xl">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <XCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl dark:text-foreground">No Cancelled Bookings</CardTitle>
                    <CardDescription className="mt-2 dark:text-muted-foreground">
                      You don't have any cancelled bookings. All your cancelled services will be listed here if needed 🗑️
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}