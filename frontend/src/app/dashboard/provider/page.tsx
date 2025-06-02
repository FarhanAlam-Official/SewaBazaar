import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Star, Plus, CheckCircle, XCircle } from "lucide-react"
import DashboardSidebar from "@/components/layout/dashboard-sidebar"
import Image from "next/image"
import Link from "next/link"

export default function ProviderDashboard() {
  // Mock provider data
  const provider = {
    name: "CleanHome Nepal",
    email: "info@cleanhome.com.np",
    phone: "+977 9801234567",
    joinDate: "January 2020",
    servicesCount: 5,
    bookingsCount: 124,
    rating: 4.8,
    earnings: {
      total: 145000,
      thisMonth: 24500,
      pending: 8000,
    },
  }

  // Mock services data
  const services = [
    {
      id: 1,
      title: "Professional House Cleaning",
      price: 1200,
      bookings: 78,
      rating: 4.9,
      status: "active",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      title: "Deep Cleaning Service",
      price: 2200,
      bookings: 32,
      rating: 4.7,
      status: "active",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 3,
      title: "Office Cleaning",
      price: 1800,
      bookings: 14,
      rating: 4.6,
      status: "active",
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  // Mock bookings data
  const bookings = {
    pending: [
      {
        id: 1,
        service: "Professional House Cleaning",
        customer: "Aarav Sharma",
        date: "May 15, 2025",
        time: "09:00 AM - 12:00 PM",
        status: "pending",
        price: 1200,
        location: "Kathmandu",
        customerImage: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        service: "Deep Cleaning Service",
        customer: "Priya Thapa",
        date: "May 16, 2025",
        time: "02:00 PM - 06:00 PM",
        status: "pending",
        price: 2200,
        location: "Lalitpur",
        customerImage: "/placeholder.svg?height=40&width=40",
      },
    ],
    upcoming: [
      {
        id: 3,
        service: "Professional House Cleaning",
        customer: "Rohan Gurung",
        date: "May 12, 2025",
        time: "10:00 AM - 01:00 PM",
        status: "confirmed",
        price: 1200,
        location: "Bhaktapur",
        customerImage: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 4,
        service: "Office Cleaning",
        customer: "Maya Shrestha",
        date: "May 14, 2025",
        time: "09:00 AM - 12:00 PM",
        status: "confirmed",
        price: 1800,
        location: "Kathmandu",
        customerImage: "/placeholder.svg?height=40&width=40",
      },
    ],
    completed: [
      {
        id: 5,
        service: "Professional House Cleaning",
        customer: "Sanjay Poudel",
        date: "May 5, 2025",
        time: "09:00 AM - 12:00 PM",
        status: "completed",
        price: 1200,
        location: "Kathmandu",
        rating: 5,
        customerImage: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 6,
        service: "Deep Cleaning Service",
        customer: "Anita Rai",
        date: "May 3, 2025",
        time: "01:00 PM - 05:00 PM",
        status: "completed",
        price: 2200,
        location: "Lalitpur",
        rating: 4,
        customerImage: "/placeholder.svg?height=40&width=40",
      },
    ],
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen bg-pearlWhite dark:bg-black">
      <DashboardSidebar userType="provider" />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {provider.name}!</h1>
          <p className="text-gray-500">Here's an overview of your services and bookings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">NPR {provider.earnings.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">NPR {provider.earnings.thisMonth.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{provider.bookingsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center">
                {provider.rating}
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 ml-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Services</h2>
              <Button className="bg-freshAqua hover:bg-freshAqua/90 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add New Service
              </Button>
            </div>
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex">
                      <div className="w-16 mr-4">
                        <Image
                          src={service.image || "/placeholder.svg"}
                          alt={service.title}
                          width={60}
                          height={60}
                          className="rounded-md"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{service.title}</h3>
                          <Badge className={getStatusColor(service.status)} variant="outline">
                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-freshAqua">NPR {service.price}</p>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-saffronGlow fill-saffronGlow mr-1" />
                            <span className="text-sm">{service.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">{service.bookings} bookings</p>
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
              {bookings.pending.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="w-10 h-10 mr-4">
                        <Image
                          src={booking.customerImage || "/placeholder.svg"}
                          alt={booking.customer}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{booking.service}</h3>
                            <p className="text-sm text-gray-500">by {booking.customer}</p>
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
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sky-600">NPR {booking.price}</p>
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                  {bookings.upcoming.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start">
                          <div className="w-10 h-10 mr-4">
                            <Image
                              src={booking.customerImage || "/placeholder.svg"}
                              alt={booking.customer}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{booking.service}</h3>
                                <p className="text-sm text-gray-500">by {booking.customer}</p>
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
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sky-600">NPR {booking.price}</p>
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
                  {bookings.completed.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start">
                          <div className="w-10 h-10 mr-4">
                            <Image
                              src={booking.customerImage || "/placeholder.svg"}
                              alt={booking.customer}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{booking.service}</h3>
                                <p className="text-sm text-gray-500">by {booking.customer}</p>
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <p className="font-bold text-sky-600 mr-4">NPR {booking.price}</p>
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
      </div>
    </div>
  )
}
