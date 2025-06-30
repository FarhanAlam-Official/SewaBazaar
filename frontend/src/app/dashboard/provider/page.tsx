"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Star, Plus, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { StatCard } from "@/components/ui/stat-card"
import { DollarSign } from "lucide-react"
import {
  ShoppingBag,
  Briefcase,
  Image as ImageIcon,
  BarChart2,
  TrendingUp,
  Bell,
  Target,
  FileText,
  Settings,
  Users2
} from "lucide-react"

interface Booking {
  id: number
  service: string
  customer: string
  date: string
  time: string
  location: string
  status: string
  customerImage: string
  price?: number
  rating?: number
}

interface BookingGroups {
  pending: Booking[]
  upcoming: Booking[]
  completed: Booking[]
}

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
  const bookings: BookingGroups = {
    pending: [
      {
        id: 1,
        service: "House Cleaning",
        customer: "John Doe",
        date: "2024-03-20",
        time: "10:00 AM",
        location: "Kathmandu",
        status: "pending",
        customerImage: "/placeholder.svg",
        price: 1500
      },
    ],
    upcoming: [
      {
        id: 2,
        service: "Deep Cleaning",
        customer: "Jane Smith",
        date: "2024-03-21",
        time: "2:00 PM",
        location: "Lalitpur",
        status: "confirmed",
        customerImage: "/placeholder.svg",
        price: 2500
      },
    ],
    completed: [
      {
        id: 3,
        service: "Office Cleaning",
        customer: "Mike Johnson",
        date: "2024-03-19",
        time: "9:00 AM",
        location: "Bhaktapur",
        status: "completed",
        customerImage: "/placeholder.svg",
        price: 1800,
        rating: 5
      },
    ],
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-600 bg-green-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "completed":
        return "text-blue-600 bg-blue-100"
      case "confirmed":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {provider.name}!</h1>
        <p className="text-gray-500">Here's an overview of your services and bookings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Bookings"
          value={provider.bookingsCount}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="Last 30 days"
          growth={12}
        />
        <StatCard
          title="Active Hours"
          value="48"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="This month"
          growth={8}
        />
        <StatCard
          title="Total Earnings"
          value={`NPR ${provider.earnings.thisMonth.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="This month"
          growth={15}
        />
        <StatCard
          title="Rating"
          value={provider.rating}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
          description="Average rating"
          growth={2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          {/* Add recent bookings table/list component here */}
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
          {/* Add recent reviews component here */}
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

      <div className="mt-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">New Booking Request</p>
                <p className="text-sm text-muted-foreground">House Cleaning Service - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">New Review</p>
                <p className="text-sm text-muted-foreground">5-star rating received - 3 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Payment Received</p>
                <p className="text-sm text-muted-foreground">NPR 2,500 - 4 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Services Management */}
        <Link href="/dashboard/provider/services">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Services</h3>
                <p className="text-sm text-muted-foreground">Manage your service offerings</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Schedule</span>
              <span className="bg-muted px-2 py-1 rounded">Pricing</span>
              <span className="bg-muted px-2 py-1 rounded">Areas</span>
            </div>
          </Card>
        </Link>

        {/* Bookings Management */}
        <Link href="/dashboard/provider/bookings">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Bookings</h3>
                <p className="text-sm text-muted-foreground">Manage appointments & schedule</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Calendar</span>
              <span className="bg-muted px-2 py-1 rounded">Requests</span>
              <span className="bg-muted px-2 py-1 rounded">History</span>
            </div>
          </Card>
        </Link>

        {/* Portfolio */}
        <Link href="/dashboard/provider/portfolio">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Portfolio</h3>
                <p className="text-sm text-muted-foreground">Showcase your work</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Projects</span>
              <span className="bg-muted px-2 py-1 rounded">Reviews</span>
              <span className="bg-muted px-2 py-1 rounded">Photos</span>
            </div>
          </Card>
        </Link>

        {/* Analytics */}
        <Link href="/dashboard/provider/analytics">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">Track performance metrics</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Reports</span>
              <span className="bg-muted px-2 py-1 rounded">Insights</span>
              <span className="bg-muted px-2 py-1 rounded">Trends</span>
            </div>
          </Card>
        </Link>

        {/* Earnings */}
        <Link href="/dashboard/provider/earnings">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Earnings</h3>
                <p className="text-sm text-muted-foreground">Track your income</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Payments</span>
              <span className="bg-muted px-2 py-1 rounded">History</span>
              <span className="bg-muted px-2 py-1 rounded">Reports</span>
            </div>
          </Card>
        </Link>

        {/* Business Tools */}
        <Link href="/dashboard/provider/marketing">
          <Card className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Business Tools</h3>
                <p className="text-sm text-muted-foreground">Grow your business</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">Marketing</span>
              <span className="bg-muted px-2 py-1 rounded">Customers</span>
              <span className="bg-muted px-2 py-1 rounded">Documents</span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
