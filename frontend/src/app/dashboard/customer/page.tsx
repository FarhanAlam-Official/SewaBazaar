"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Search,
  Plus,
  Bell,
  History,
  Wallet,
  Heart,
  Settings,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { customerApi } from "@/services/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import Link from "next/link"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function CustomerDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<{
    totalBookings: number
    upcomingBookings: number
    memberSince: string
    totalSpent: number
    savedServices: number
    lastBooking: string
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
      
      // Simulating API calls with mock data
      setTimeout(() => {
        setDashboardData({
          totalBookings: 24,
          upcomingBookings: 3,
          memberSince: "April 2023",
          totalSpent: 25000,
          savedServices: 12,
          lastBooking: "2024-03-15"
        })

        setBookings({
          upcoming: [
            {
              id: 1,
              service: "Home Cleaning",
              provider: "CleanPro Services",
              image: "/placeholder.svg",
              date: "2024-03-20",
              time: "14:00",
              location: "Kathmandu",
              price: 2500,
              status: "confirmed"
            },
            // Add more mock bookings
          ],
          completed: [
            {
              id: 2,
              service: "Plumbing Service",
              provider: "FixIt Pro",
              image: "/placeholder.svg",
              date: "2024-03-15",
              time: "10:00",
              location: "Lalitpur",
              price: 1800,
              status: "completed",
              rating: 5
            },
            // Add more mock bookings
          ],
          cancelled: []
        })

        setRecommendedServices([
          {
            id: 1,
            title: "Deep House Cleaning",
            provider_name: "CleanPro Services",
            image: "/placeholder.svg",
            average_rating: 4.8,
            price: 3000,
            discount_price: 2500
          },
          // Add more mock services
        ])

        setLoading(false)
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive"
      })
    }
  }

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await customerApi.cancelBooking(bookingId)
      toast({
        title: "Success",
        description: "Booking cancelled successfully"
      })
      loadDashboardData()
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
      loadDashboardData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule booking",
        variant: "destructive"
      })
    }
  }

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
        return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const quickActions = [
    {
      title: "Book Service",
      icon: Plus,
      href: "/services",
      color: "text-green-500"
    },
    {
      title: "View History",
      icon: History,
      href: "/dashboard/customer/history",
      color: "text-blue-500"
    },
    {
      title: "Payments",
      icon: Wallet,
      href: "/dashboard/customer/payments",
      color: "text-purple-500"
    },
    {
      title: "Favorites",
      icon: Heart,
      href: "/dashboard/customer/favorites",
      color: "text-red-500"
    }
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="container mx-auto py-8 max-w-7xl"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <motion.div variants={item} className="mb-4 md:mb-0">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary/90 to-primary/50 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground/90 mt-2">
            Here's what's happening with your services today.
          </p>
        </motion.div>
        <motion.div variants={item} className="flex gap-3">
          <Button asChild>
            <Link href="/services">
              <Search className="h-4 w-4 mr-2" />
              Find Services
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/customer/notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div variants={item}>
          <Card className="relative overflow-hidden dark:bg-gray-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground/90">
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-white/90">{dashboardData?.totalBookings || 0}</div>
              <div className="text-xs text-muted-foreground/80 mt-1">
                Last booking on {dashboardData?.lastBooking}
              </div>
              <div className="absolute right-4 top-4 p-2 bg-primary/10 dark:bg-white/5 rounded-full">
                <Calendar className="h-4 w-4 text-primary dark:text-white/70" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="relative overflow-hidden dark:bg-gray-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground/90">
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-white/90">NPR {dashboardData?.totalSpent || 0}</div>
              <div className="text-xs text-muted-foreground/80 mt-1">
                Across {dashboardData?.totalBookings || 0} bookings
              </div>
              <div className="absolute right-4 top-4 p-2 bg-primary/10 dark:bg-white/5 rounded-full">
                <Wallet className="h-4 w-4 text-primary dark:text-white/70" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="relative overflow-hidden dark:bg-gray-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground/90">
                Saved Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-white/90">{dashboardData?.savedServices || 0}</div>
              <div className="text-xs text-muted-foreground/80 mt-1">
                In your wishlist
              </div>
              <div className="absolute right-4 top-4 p-2 bg-primary/10 dark:bg-white/5 rounded-full">
                <Heart className="h-4 w-4 text-primary dark:text-white/70" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="relative overflow-hidden dark:bg-gray-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground/90">
                Member Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-white/90">{dashboardData?.memberSince}</div>
              <div className="text-xs text-muted-foreground/80 mt-1">
                Trusted customer
              </div>
              <div className="absolute right-4 top-4 p-2 bg-primary/10 dark:bg-white/5 rounded-full">
                <Star className="h-4 w-4 text-primary dark:text-white/70" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 dark:bg-gray-900/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <action.icon className={`h-5 w-5 mr-3 ${action.color} dark:text-white/80`} />
                    <span className="font-medium dark:text-white/90">{action.title}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary dark:text-white/70 dark:group-hover:text-white transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Recent Activity
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/customer/history" className="text-primary">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <Card>
          <ScrollArea className="h-[400px]">
            <CardContent className="p-0">
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b">
                  <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="p-4">
                  {bookings.upcoming.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.upcoming.map((booking) => (
                        <Card key={booking.id} className="group transition-all duration-200 hover:shadow-md dark:bg-gray-900/50">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                                <Image
                                  src={booking.image || "/placeholder.svg"}
                                  alt={booking.service}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold group-hover:text-primary dark:text-white/90 dark:group-hover:text-primary/90 transition-colors">
                                      {booking.service}
                                    </h3>
                                    <p className="text-sm text-muted-foreground/90">by {booking.provider}</p>
                                  </div>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-2">
                                  <div className="flex items-center text-sm text-muted-foreground/80">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {booking.date}
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground/80">
                                    <Clock className="h-4 w-4 mr-2" />
                                    {booking.time}
                                  </div>
                                  <div className="flex items-center text-sm text-muted-foreground/80">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {booking.location}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <p className="font-bold text-primary dark:text-primary/90">NPR {booking.price}</p>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="dark:bg-gray-800 dark:hover:bg-gray-700">
                                      Reschedule
                                    </Button>
                                    <Button variant="destructive" size="sm" className="dark:hover:bg-red-900">
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
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No upcoming bookings</p>
                      <Button className="mt-4" asChild>
                        <Link href="/services">Browse Services</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="p-4">
                  {/* Similar structure for completed bookings */}
                </TabsContent>

                <TabsContent value="cancelled" className="p-4">
                  {/* Similar structure for cancelled bookings */}
                </TabsContent>
              </Tabs>
            </CardContent>
          </ScrollArea>
        </Card>
      </motion.div>

      {/* Recommended Services */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Recommended For You
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/services" className="text-primary">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.isArray(recommendedServices) && recommendedServices.length > 0 ? (
            recommendedServices.map((service) => (
              <Link href={`/services/${service.id}`} key={service.id}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 dark:bg-gray-900/50">
                  <div className="relative h-48">
                    <Image
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {service.discount_price && (
                      <Badge className="absolute top-2 right-2 bg-primary text-white dark:bg-primary/90">
                        Save {Math.round(((service.price - service.discount_price) / service.price) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 group-hover:text-primary dark:text-white/90 dark:group-hover:text-primary/90 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/90 mb-2">by {service.provider_name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="text-sm dark:text-white/80">{service.average_rating || "New"}</span>
                      </div>
                      <div className="text-right">
                        {service.discount_price ? (
                          <>
                            <p className="text-sm text-muted-foreground/80 line-through">
                              NPR {service.price}
                            </p>
                            <p className="font-bold text-primary dark:text-primary/90">
                              NPR {service.discount_price}
                            </p>
                          </>
                        ) : (
                          <p className="font-bold text-primary dark:text-primary/90">
                            NPR {service.price}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-3">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    We're personalizing recommendations based on your preferences.
                  </p>
                  <Button asChild>
                    <Link href="/services">Browse All Services</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
