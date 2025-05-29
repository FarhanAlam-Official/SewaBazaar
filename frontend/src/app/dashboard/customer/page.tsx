"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { customerApi } from "@/services/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import Link from "next/link"

export default function CustomerDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<{
    totalBookings: number
    upcomingBookings: number
    memberSince: string
  } | null>(null)
  const [bookings, setBookings] = useState<{
    upcoming: any[]
    completed: any[]
    cancelled: any[]
  }>({
    upcoming: [],
    completed: [],
    cancelled: []
  })
  const [recommendedServices, setRecommendedServices] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard overview data
      const dashboardResponse = await customerApi.getDashboardData()
      setDashboardData(dashboardResponse)

      // Fetch bookings
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

      // Fetch recommended services
      const recommendedResponse = await customerApi.getRecommendedServices()
      setRecommendedServices(recommendedResponse)

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
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
      loadDashboardData() // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive"
      })
    }
  }

  const handleRescheduleBooking = async (bookingId: number, newDateTime: string) => {
    try {
      await customerApi.rescheduleBooking(bookingId, newDateTime)
      toast({
        title: "Success",
        description: "Booking rescheduled successfully"
      })
      loadDashboardData() // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule booking",
        variant: "destructive"
      })
    }
  }

  // Mock user data
  const user = {
    name: "Farhan Alam",
    email: "aarav.sharma@example.com",
    phone: "+977 9801234567",
    joinDate: "April 2023",
    bookingsCount: 12,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="text-gray-500">Here's an overview of your bookings and recommended services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.bookingsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bookings.upcoming.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.joinDate}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">My Bookings</h2>
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {bookings.upcoming.length > 0 ? (
              <div className="space-y-4">
                {bookings.upcoming.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-16 mb-4 md:mb-0 md:mr-4">
                          <Image
                            src={booking.image || "/placeholder.svg"}
                            alt={booking.service}
                            width={60}
                            height={60}
                            className="rounded-md"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{booking.service}</h3>
                              <p className="text-sm text-gray-500">by {booking.provider}</p>
                            </div>
                            <Badge className={getStatusColor(booking.status)} variant="outline">
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
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
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                            <p className="font-bold text-freshAqua">NPR {booking.price}</p>
                            <div className="flex gap-2 mt-3 md:mt-0">
                              <Button variant="outline" size="sm">
                                Reschedule
                              </Button>
                              <Button variant="destructive" size="sm">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">You don't have any upcoming bookings.</p>
                  <Button className="mt-4 bg-freshAqua hover:bg-freshAqua/90 text-white">
                    <Link href="/services">Browse Services</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {bookings.completed.length > 0 ? (
              <div className="space-y-4">
                {bookings.completed.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-16 mb-4 md:mb-0 md:mr-4">
                          <Image
                            src={booking.image || "/placeholder.svg"}
                            alt={booking.service}
                            width={60}
                            height={60}
                            className="rounded-md"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{booking.service}</h3>
                              <p className="text-sm text-gray-500">by {booking.provider}</p>
                            </div>
                            <Badge className={getStatusColor(booking.status)} variant="outline">
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
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
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                            <div className="flex items-center">
                              <p className="font-bold text-freshAqua mr-4">NPR {booking.price}</p>
                              <div className="flex items-center">
                                <p className="text-sm mr-2">Your rating:</p>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < (booking.rating || 0)
                                          ? "text-saffronGlow fill-saffronGlow"
                                          : "text-gray-300 dark:text-gray-700"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 md:mt-0">
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                Book Again
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">You don't have any completed bookings yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {bookings.cancelled.length > 0 ? (
              <div className="space-y-4">
                {bookings.cancelled.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-16 mb-4 md:mb-0 md:mr-4">
                          <Image
                            src={booking.image || "/placeholder.svg"}
                            alt={booking.service}
                            width={60}
                            height={60}
                            className="rounded-md"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{booking.service}</h3>
                              <p className="text-sm text-gray-500">by {booking.provider}</p>
                            </div>
                            <Badge className={getStatusColor(booking.status)} variant="outline">
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
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
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                            <div>
                              <p className="font-bold text-freshAqua mb-1">NPR {booking.price}</p>
                              <p className="text-sm text-red-500">Reason: {booking.cancelReason}</p>
                            </div>
                            <Button variant="outline" size="sm" className="mt-3 md:mt-0">
                              Book Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">You don't have any cancelled bookings.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Recommended For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.isArray(recommendedServices) && recommendedServices.length > 0 ? (
            recommendedServices.map((service) => (
              <Link href={`/services/${service.id}`} key={service.id}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="relative h-36">
                    <Image
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{service.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">by {service.provider_name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="text-sm">{service.average_rating || "New"}</span>
                      </div>
                      <p className="font-bold text-freshAqua">
                        NPR {service.discount_price || service.price}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No recommended services available at the moment.</p>
                  <Button className="mt-4 bg-freshAqua hover:bg-freshAqua/90 text-white">
                    <Link href="/services">Browse All Services</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
