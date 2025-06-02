"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Phone, AlertCircle } from "lucide-react"
import { customerApi } from "@/services/api"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

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
}

export default function CustomerBookingsPage() {
  const { toast } = useToast()
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
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const [upcomingBookings, completedBookings, cancelledBookings] = await Promise.all([
        customerApi.getBookings("upcoming"),
        customerApi.getBookings("completed"),
        customerApi.getBookings("cancelled")
      ])

      setBookings({
        upcoming: upcomingBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load bookings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await customerApi.cancelBooking(bookingId)
      toast({
        title: "Success",
        description: "Booking cancelled successfully"
      })
      loadBookings()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive"
      })
    }
  }

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) return

    try {
      await customerApi.rescheduleBooking(selectedBooking, `${rescheduleDate}T${rescheduleTime}`)
      toast({
        title: "Success",
        description: "Booking rescheduled successfully"
      })
      setSelectedBooking(null)
      setRescheduleDate("")
      setRescheduleTime("")
      loadBookings()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule booking",
        variant: "destructive"
      })
    }
  }

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{booking.service.title}</CardTitle>
            <CardDescription>
              Booking #{booking.id} • {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-semibold">Rs. {booking.total_amount}</p>
            {booking.total_amount !== booking.price && (
              <p className="text-sm text-muted-foreground line-through">Rs. {booking.price}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(booking.booking_date), "PPP")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{booking.booking_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{booking.address}, {booking.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{booking.phone}</span>
            </div>
          </div>
          
          {booking.note && (
            <div className="flex items-start gap-2 pt-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-1" />
              <p className="text-sm text-muted-foreground">{booking.note}</p>
            </div>
          )}

          {booking.status === "pending" || booking.status === "confirmed" ? (
            <div className="flex gap-2 pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setSelectedBooking(booking.id)}>
                    Reschedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reschedule Booking</DialogTitle>
                    <DialogDescription>
                      Select a new date and time for your booking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="date">New Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">New Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleRescheduleBooking}>Confirm Reschedule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                variant="destructive" 
                onClick={() => handleCancelBooking(booking.id)}
              >
                Cancel Booking
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )

  const LoadingBookingCard = () => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">Manage your service bookings</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({bookings.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({bookings.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({bookings.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="upcoming">
            {loading ? (
              Array(3).fill(0).map((_, i) => <LoadingBookingCard key={i} />)
            ) : bookings.upcoming.length > 0 ? (
              bookings.upcoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardHeader>
                  <CardDescription>No upcoming bookings</CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {loading ? (
              Array(3).fill(0).map((_, i) => <LoadingBookingCard key={i} />)
            ) : bookings.completed.length > 0 ? (
              bookings.completed.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardHeader>
                  <CardDescription>No completed bookings</CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {loading ? (
              Array(3).fill(0).map((_, i) => <LoadingBookingCard key={i} />)
            ) : bookings.cancelled.length > 0 ? (
              bookings.cancelled.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <Card>
                <CardHeader>
                  <CardDescription>No cancelled bookings</CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 