"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, MapPin, Calendar as CalendarIcon, X, AlertCircle } from "lucide-react"
import { format, parseISO, startOfDay, isSameDay } from "date-fns"
import { customerApi } from "@/services/api"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

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

export default function SchedulePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [allBookings, setAllBookings] = useState<BookingEvent[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<BookingEvent[]>([])
  const [todayBookings, setTodayBookings] = useState<BookingEvent[]>([])

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    if (date && allBookings.length > 0) {
      filterBookingsForDate(date)
    }
  }, [date, allBookings])

  const loadBookings = async () => {
    try {
      setLoading(true)
      
      // Get both upcoming and confirmed bookings
      const [upcoming, confirmed] = await Promise.all([
        customerApi.getBookings("upcoming"),
        customerApi.getBookings("confirmed")
      ])
      
      const allBookingData = [...upcoming, ...confirmed]
      setAllBookings(allBookingData)
      setUpcomingBookings(allBookingData)
      
      // Filter today's bookings
      const today = new Date()
      const todaysBookings = allBookingData.filter(booking => 
        isSameDay(parseISO(booking.booking_date), today)
      )
      setTodayBookings(todaysBookings)
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load schedule",
        variant: "destructive"
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

  const handleReschedule = async (bookingId: number) => {
    try {
      // TODO: Implement reschedule functionality
      toast({
        title: "Feature Coming Soon",
        description: "Rescheduling will be available in the next update",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to reschedule booking",
        variant: "destructive"
      })
    }
  }

  const handleCancel = async (bookingId: number) => {
    try {
      await customerApi.cancelBooking(bookingId)
      toast({
        title: "Success",
        description: "Booking cancelled successfully"
      })
      loadBookings() // Reload to update the list
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
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
            <TabsList>
              <TabsTrigger value="today">Today's Schedule</TabsTrigger>
              <TabsTrigger value="upcoming">All Upcoming</TabsTrigger>
            </TabsList>
            
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
                          <Card key={booking.id} className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setIsDialogOpen(true)
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                    <Image
                                      src={booking.service.image || "/placeholder.svg"}
                                      alt={booking.service.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{booking.service.title}</h4>
                                    <p className="text-sm text-muted-foreground">{providerName}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span>{booking.booking_time}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{booking.city}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No bookings for this date</h3>
                      <p className="text-muted-foreground">Select a different date or book a new service.</p>
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
                  ) : upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => {
                        const providerName = booking.provider?.business_name || 
                          `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim() || 'Unknown Provider'
                        
                        return (
                          <Card key={booking.id} className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => {
                              setSelectedBooking(booking)
                              setIsDialogOpen(true)
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                    <Image
                                      src={booking.service.image || "/placeholder.svg"}
                                      alt={booking.service.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{booking.service.title}</h4>
                                    <p className="text-sm text-muted-foreground">{providerName}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
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
                                        <span>{booking.city}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No upcoming bookings</h3>
                      <p className="text-muted-foreground">Book a service to see your schedule here.</p>
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
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
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
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    {selectedBooking.address}, {selectedBooking.city}
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
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleAddToCalendar(selectedBooking)}
                >
                  Add to Calendar
                </Button>
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReschedule(selectedBooking.id)}
                    >
                      Reschedule
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleCancel(selectedBooking.id)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 