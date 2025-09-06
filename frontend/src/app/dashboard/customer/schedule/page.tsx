"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { showToast } from "@/components/ui/enhanced-toast"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, MapPin, Calendar as CalendarIcon, X, AlertCircle, RefreshCw, Search } from "lucide-react"
import { format, parseISO, startOfDay, isSameDay } from "date-fns"
import { customerApi } from "@/services/customer.api"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface BookingEvent {
  id: number
  service: {
    id: number
    title: string
    image?: string
  }
  provider?: {
    business_name?: string
    first_name?: string
    last_name?: string
  }
  booking_date: string
  booking_time: string
  address: string
  city: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
}

// Transform CustomerBooking to BookingEvent interface
const transformToBookingEvent = (customerBooking: any): BookingEvent => {
  // Handle different response formats
  console.log("Transforming booking:", customerBooking);
  
  return {
    id: customerBooking.id,
    service: {
      id: customerBooking.id, // Using booking ID as service ID since it's not provided in grouped format
      title: customerBooking.service || customerBooking.service_details?.title || 'Unknown Service',
      image: customerBooking.image || customerBooking.service_details?.image || "/placeholder.svg"
    },
    provider: {
      business_name: customerBooking.provider || customerBooking.provider_name || customerBooking.service_details?.provider?.business_name,
      first_name: customerBooking.service_details?.provider?.first_name,
      last_name: customerBooking.service_details?.provider?.last_name
    },
    booking_date: customerBooking.date || customerBooking.booking_date,
    booking_time: customerBooking.time || customerBooking.booking_time,
    address: customerBooking.location || customerBooking.address || '',
    city: customerBooking.city || '', // Not provided in CustomerBooking
    status: customerBooking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    total_amount: customerBooking.price || customerBooking.total_amount || 0
  }
}

export default function SchedulePage() {
  const router = useRouter()
  const { user } = useAuth()
  console.log("Current user:", user);

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // ENHANCED: Reschedule modal state
  // Reschedule functionality - using dedicated page instead of modal
  // No modal state needed - we navigate to the reschedule page instead
  const [allBookings, setAllBookings] = useState<BookingEvent[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<BookingEvent[]>([])
  const [todayBookings, setTodayBookings] = useState<BookingEvent[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    if (user) {
      console.log("User authenticated, loading bookings...");
      loadBookings()
    } else {
      console.log("User not authenticated, waiting...");
    }
  }, [user])

  useEffect(() => {
    if (date && allBookings.length > 0) {
      filterBookingsForDate(date)
    }
  }, [date, allBookings])

  const loadBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Clear cache for testing
      localStorage.removeItem('customer_bookings');
      
      // Get all bookings in one call with grouped format
      console.log("Fetching bookings from API...");
      const bookingsData = await customerApi.getBookings()
      console.log("Bookings data received:", bookingsData);
      
      // Transform the data to match the expected interface
      const allBookingData = [
        ...bookingsData.upcoming.map(transformToBookingEvent),
        ...bookingsData.completed.map(transformToBookingEvent)
      ]
      const upcomingBookingData = bookingsData.upcoming.map(transformToBookingEvent)
      
      console.log("Transformed all booking data:", allBookingData);
      console.log("Transformed upcoming booking data:", upcomingBookingData);
      
      setAllBookings(allBookingData)
      setUpcomingBookings(upcomingBookingData)
      
      // Filter today's bookings
      const today = new Date()
      const todaysBookings = allBookingData.filter(booking => 
        isSameDay(parseISO(booking.booking_date), today)
      )
      setTodayBookings(todaysBookings)
      
    } catch (error: any) {
      console.error("Error loading bookings:", error)
      setError(error.message || "Failed to load schedule")
      showToast.error({
        title: "Error",
        description: error.message || "Failed to load schedule",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const filterBookingsForDate = (selectedDate: Date) => {
    const bookingsForDate = allBookings.filter(booking => 
      isSameDay(parseISO(booking.booking_date), selectedDate)
    )
    setTodayBookings(bookingsForDate)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date)
    if (date) {
      filterBookingsForDate(date)
    }
  }

  // Filter bookings based on search term
  const filteredUpcomingBookings = upcomingBookings.filter(booking => {
    if (!searchTerm) return true
    const searchTermLower = searchTerm.toLowerCase()
    return (
      booking.service.title.toLowerCase().includes(searchTermLower) ||
      (booking.provider?.business_name && booking.provider.business_name.toLowerCase().includes(searchTermLower)) ||
      booking.booking_time.toLowerCase().includes(searchTermLower)
    )
  })

  // ENHANCED: New reschedule modal handlers
  // Navigate to reschedule page instead of opening modal
  const navigateToReschedule = (bookingId: number) => {
    router.push(`/dashboard/customer/bookings/reschedule/${bookingId}`)
  }

  // Navigate to reschedule page
  const handleReschedule = async (bookingId: number) => {
    navigateToReschedule(bookingId)
  }

  const handleCancel = async (bookingId: number) => {
    try {
      await customerApi.cancelBooking(bookingId)
      showToast.success({
        title: "Success",
        description: "Booking cancelled successfully",
        duration: 3000
      })
      loadBookings() // Reload to update the list
      setIsDialogOpen(false)
    } catch (error: any) {
      showToast.error({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        duration: 5000
      })
    }
  }

  const handleAddToCalendar = (booking: BookingEvent) => {
    // Create calendar event data
    const startDate = new Date(`${booking.booking_date}T${booking.booking_time}`)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Add 2 hours
    
    const calendarData = {
      title: booking.service.title,
      start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      description: `Service: ${booking.service.title}\nLocation: ${booking.address}, ${booking.city}`,
      location: `${booking.address}, ${booking.city}`
    }
    
    // Create Google Calendar URL
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.title)}&dates=${calendarData.start}/${calendarData.end}&details=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}`
    
    window.open(googleCalUrl, '_blank')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBookingDates = () => {
    return allBookings.map(booking => parseISO(booking.booking_date))
  }

  return (
    <div className="container py-6">
      {/* Error Message Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-medium text-red-800">Error Loading Bookings</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 text-red-700 border-red-200 hover:bg-red-100"
            onClick={loadBookings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border"
              modifiers={{
                hasBooking: getBookingDates()
              }}
              modifiersStyles={{
                hasBooking: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              Dates with bookings are highlighted
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs defaultValue="today" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="today">Today's Schedule</TabsTrigger>
                <TabsTrigger value="upcoming">All Upcoming</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-48"
                />
              </div>
            </div>
            
            <TabsContent value="today">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {date ? format(date, "PPPP") : "Today's Schedule"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[160px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : todayBookings.length > 0 ? (
                    <div className="space-y-4">
                      {todayBookings.map((booking) => {
                        const providerName = booking.provider?.business_name || 
                          `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim() || 'Unknown Provider'
                        
                        return (
                          <motion.div
                            key={booking.id}
                            whileHover={{ 
                              y: -4,
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                              transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="cursor-pointer"
                          >
                            <Card 
                              className="transition-all duration-300 hover:shadow-lg"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setIsDialogOpen(true)
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div className="flex items-start space-x-3">
                                    <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                      <Image
                                        src={booking.service.image || "/placeholder.svg"}
                                        alt={booking.service.title}
                                        fill
                                        className="object-cover transition-transform duration-300 hover:scale-110"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{booking.service.title}</h4>
                                      <p className="text-sm text-muted-foreground">{providerName}</p>
                                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          <span>{booking.booking_time}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4" />
                                          <span>{booking.city || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge className={`${getStatusColor(booking.status)} transition-all duration-300 hover:scale-105 self-start`}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No bookings for this date</h3>
                      <p className="text-muted-foreground">Select a different date or book a new service.</p>
                      <Button 
                        variant="default" 
                        className="mt-4"
                        onClick={() => window.location.href = '/services'}
                      >
                        Book a Service
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upcoming">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Upcoming Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[160px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredUpcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredUpcomingBookings.map((booking) => {
                        const providerName = booking.provider?.business_name || 
                          `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim() || 'Unknown Provider'
                        
                        return (
                          <motion.div
                            key={booking.id}
                            whileHover={{ 
                              y: -4,
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                              transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="cursor-pointer"
                          >
                            <Card 
                              className="transition-all duration-300 hover:shadow-lg"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setIsDialogOpen(true)
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div className="flex items-start space-x-3">
                                    <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                      <Image
                                        src={booking.service.image || "/placeholder.svg"}
                                        alt={booking.service.title}
                                        fill
                                        className="object-cover transition-transform duration-300 hover:scale-110"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{booking.service.title}</h4>
                                      <p className="text-sm text-muted-foreground">{providerName}</p>
                                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                                        <div className="flex items-center gap-1">
                                          <CalendarIcon className="h-4 w-4" />
                                          <span>{format(parseISO(booking.booking_date), "MMM dd, yyyy")}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          <span>{booking.booking_time}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4" />
                                          <span>{booking.city || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge className={`${getStatusColor(booking.status)} transition-all duration-300 hover:scale-105 self-start`}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">
                        {searchTerm ? 'No matching bookings found' : 'No upcoming bookings'}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? 'Try adjusting your search terms' 
                          : 'Book a service to see your schedule here.'}
                      </p>
                      {!searchTerm && (
                        <Button 
                          variant="default" 
                          className="mt-4"
                          onClick={() => window.location.href = '/services'}
                        >
                          Book a Service
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
        
          {selectedBooking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start space-x-0 sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                  <Image
                    src={selectedBooking.service.image || "/placeholder.svg"}
                    alt={selectedBooking.service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedBooking.service.title}</h3>
                  <p className="text-muted-foreground">
                    {selectedBooking.provider?.business_name || 
                      `${selectedBooking.provider?.first_name || ''} ${selectedBooking.provider?.last_name || ''}`.trim() || 'Provider'}
                  </p>
                  <Badge className={`${getStatusColor(selectedBooking.status)} mt-2`}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Badge>
                </div>
              </div>
            
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(parseISO(selectedBooking.booking_date), "PPP")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedBooking.booking_time}</span>
                  </div>
                </div>
              
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span className="text-sm">
                    {selectedBooking.address || 'N/A'}, {selectedBooking.city || 'N/A'}
                  </span>
                </div>
              
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg">Rs. {selectedBooking.total_amount}</span>
                  </div>
                </div>
              
                {selectedBooking.status === 'pending' && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      This booking is pending confirmation from the provider.
                    </span>
                  </div>
                )}
              </div>
            
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleAddToCalendar(selectedBooking)}
                >
                  Add to Calendar
                </Button>
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => handleReschedule(selectedBooking.id)}
                      className="w-full sm:w-auto"
                    >
                      Reschedule
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleCancel(selectedBooking.id)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* ENHANCED: New reschedule modal component with calendar and slot selection */}
      {/* Reschedule functionality now uses dedicated page instead of modal */}
    </div>
  )
} 