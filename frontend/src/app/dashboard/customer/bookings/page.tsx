"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { showToast } from "@/components/ui/enhanced-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  AlertCircle, 
  User, 
  Package, 
  Tag,  
  CheckCircle, 
  XCircle,
  BookOpen,
  UserCheck,
  Building,
  Star,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"
import { customerApi } from "@/services/customer.api"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  note: string
  status: string
  price: number
  total_amount: number
  provider_name?: string
  provider_id?: number  // Added provider ID for linking
  service_category?: string
  booking_slot?: string
  special_instructions?: string
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
    note: customerBooking.note || customerBooking.special_instructions || '',
    status: customerBooking.status || 'pending',
    price: customerBooking.price || customerBooking.total_amount || 0,
    total_amount: customerBooking.total_amount || customerBooking.price || 0,
    provider_name: providerName,
    provider_id: providerId,  // Include provider ID for linking
    service_category: customerBooking.service_category || customerBooking.category || customerBooking.service_details?.category?.title || '',
    booking_slot: customerBooking.booking_slot || '',
    special_instructions: customerBooking.special_instructions || ''
  }
}

export default function CustomerBookingsPage() {
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
  
  // State for rescheduling functionality
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null)

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

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: number) => {
    try {
      await customerApi.cancelBooking(bookingId)
      showToast.success({
        title: "✅ Booking Cancelled!",
        description: "Your booking has been successfully cancelled! We've updated your records 📝",
        duration: 3000
      })
      loadBookings(pagination.currentPage)
    } catch (error: any) {
      showToast.error({
        title: "🚫 Cancellation Failed!",
        description: error.message || "Couldn't cancel your booking. Please try again or contact support! 🆘",
        duration: 5000
      })
    }
  }

  // Handle booking rescheduling
  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return

    try {
      // Pass separate date and time parameters instead of combined datetime string
      await customerApi.rescheduleBooking(selectedBooking, rescheduleDate, rescheduleTime)
      showToast.success({
        title: "📅 Booking Rescheduled!",
        description: "Your booking has been successfully rescheduled! Check your updated details 🕒",
        duration: 3000
      })
      setSelectedBooking(null)
      setRescheduleDate("")
      setRescheduleTime("")
      loadBookings(pagination.currentPage)
    } catch (error: any) {
      showToast.error({
        title: "🚫 Rescheduling Failed!",
        description: error.message || "Couldn't reschedule your booking. Please try again or contact support! 🆘",
        duration: 5000
      })
    }
  }

  // Get status badge with appropriate color based on booking status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50">Pending</Badge>
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/50">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground dark:border-muted dark:text-muted">Default</Badge>
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
                <span className="text-sm text-foreground dark:text-foreground">{booking.booking_time || 'Time not set'}</span>
                {booking.booking_slot && (
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">({booking.booking_slot})</span>
                )}
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
            
            {/* Special instructions or notes */}
            {(booking.note || booking.special_instructions) && (
              <div className="flex items-start gap-2 pt-2 border-t border-border dark:border-border">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-1" />
                <p className="text-sm text-foreground dark:text-foreground">
                  {booking.note || booking.special_instructions}
                </p>
              </div>
            )}

            {/* Action buttons for active bookings */}
            <div className="flex flex-wrap gap-2 pt-4">
              {booking.status === "pending" || booking.status === "confirmed" ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedBooking(booking.id)}
                        className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 dark:hover:bg-primary/20 dark:hover:border-primary/70 dark:text-foreground"
                      >
                        Reschedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-background dark:border-border">
                      <DialogHeader>
                        <DialogTitle className="dark:text-foreground">Reschedule Booking</DialogTitle>
                        <DialogDescription className="dark:text-muted-foreground">
                          Select a new date and time for your booking #{booking.id}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="date" className="dark:text-foreground">New Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="dark:bg-background dark:border-border dark:text-foreground"
                          />
                        </div>
                        <div>
                          <Label htmlFor="time" className="dark:text-foreground">New Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="dark:bg-background dark:border-border dark:text-foreground"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleRescheduleBooking}
                          className="hover:scale-105 transition-transform duration-200"
                        >
                          Confirm Reschedule
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    className="hover:bg-destructive/90 hover:scale-105 transition-all duration-200"
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
                <Card className="text-center py-12 border-dashed border-2 hover:border-primary/50 transition-colors dark:border-border dark:hover:border-primary/50">
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
                <Card className="text-center py-12 border-dashed border-2 hover:border-primary/50 transition-colors dark:border-border dark:hover:border-primary/50">
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
                <Card className="text-center py-12 border-dashed border-2 hover:border-primary/50 transition-colors dark:border-border dark:hover:border-primary/50">
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