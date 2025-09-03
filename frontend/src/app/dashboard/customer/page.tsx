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
  TrendingUp,
  Users,
  X
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { customerService, DashboardStats, CustomerBooking, BookingGroups, RecommendedService } from "@/services/customerService"
import api from "@/services/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

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
  const { user } = useAuth() // Get user from AuthContext
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [bookings, setBookings] = useState<BookingGroups>({
    upcoming: [],
    completed: [],
    cancelled: []
  })
  const [recommendedServices, setRecommendedServices] = useState<RecommendedService[]>([])
  const [activityTimeline, setActivityTimeline] = useState<any[]>([])
  const [spendingTrends, setSpendingTrends] = useState<any[]>([])
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  
  // Modal states
  const [isReschedulingOpen, setIsReschedulingOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  
  // Review states
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  
  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [filteredServices, setFilteredServices] = useState<RecommendedService[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])
  
  // Filter services by category
  useEffect(() => {
    if (categoryFilter === "all") {
      setFilteredServices(recommendedServices)
    } else {
      setFilteredServices(recommendedServices.filter(service => 
        service.category === categoryFilter || (!service.category && categoryFilter === "other")
      ))
    }
  }, [categoryFilter, recommendedServices])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load dashboard data, bookings, and recommended services in parallel
      const [statsResponse, bookingsResponse, recommendedResponse, timelineResponse, trendsResponse, familyResponse] = await Promise.all([
        customerService.getDashboardStats(),
        customerService.getBookings(),
        customerService.getRecommendedServices(),
        customerService.getActivityTimeline().catch(() => []),
        customerService.getSpendingTrends().catch(() => []),
        customerService.getFamilyMembers().catch(() => [])
      ])

      setDashboardStats(statsResponse)
      setBookings(bookingsResponse)
      setRecommendedServices(recommendedResponse)
      setActivityTimeline(timelineResponse)
      setSpendingTrends(trendsResponse)
      setFamilyMembers(familyResponse)
      setFilteredServices(recommendedResponse)
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
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
      await customerService.cancelBooking(bookingId)
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

  // Function to open the reschedule dialog
  const openRescheduleDialog = (bookingId: number) => {
    setSelectedBooking(bookingId)
    setIsReschedulingOpen(true)
  }

  // Function to submit the reschedule
  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !selectedDate || !selectedTime) return
    
    try {
      // Format date for the API
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      
      await customerService.rescheduleBooking(selectedBooking, formattedDate, selectedTime)
      toast({
        title: "Success",
        description: "Booking rescheduled successfully"
      })
      setIsReschedulingOpen(false)
      loadDashboardData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule booking",
        variant: "destructive"
      })
    }
  }
  
  // Function to open the review dialog
  const openReviewDialog = (bookingId: number) => {
    setSelectedBookingForReview(bookingId)
    setReviewOpen(true)
    setReviewRating(0)
    setReviewComment("")
  }
  
  // Function to submit a review
  const handleSubmitReview = async () => {
    if (!selectedBookingForReview || reviewRating === 0) return
    
    try {
      await customerService.submitReview(selectedBookingForReview, reviewRating, reviewComment)
      toast({
        title: "Success",
        description: "Review submitted successfully"
      })
      setReviewOpen(false)
      loadDashboardData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      })
    }
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
            Welcome back, {user?.first_name || user?.email || 'User'}!
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
              <div className="text-3xl font-bold dark:text-white/90">{dashboardStats?.totalBookings || 0}</div>
              <div className="text-xs text-muted-foreground/80 mt-1">
                Last booking on {dashboardStats?.lastBooking || 'No bookings yet'}
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
              <div className="text-3xl font-bold dark:text-white/90">NPR {dashboardStats?.totalSpent || 0}</div>
              <div className="text-xs text-muted-foreground/80 mt-1">
                Across {dashboardStats?.totalBookings || 0} bookings
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
              <div className="text-3xl font-bold dark:text-white/90">{dashboardStats?.savedServices || 0}</div>
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
              <div className="text-3xl font-bold dark:text-white/90">{dashboardStats?.memberSince}</div>
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

      {/* Activity Timeline - New Section */}
      {activityTimeline && activityTimeline.length > 0 && (
        <motion.div variants={item} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Activity Timeline
          </h2>
          <Card className="dark:bg-gray-900/50">
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
                  ))}
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
                  {activityTimeline.map((activity, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[29px] p-1 rounded-full bg-background border-2 border-primary">
                        {activity.type === 'booking' ? (
                          <Calendar className="h-4 w-4 text-primary" />
                        ) : activity.type === 'payment' ? (
                          <Wallet className="h-4 w-4 text-primary" />
                        ) : (
                          <Star className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="mb-1 text-sm text-muted-foreground">
                        {format(new Date(activity.date), "MMM d, yyyy • h:mm a")}
                      </div>
                      <p className="font-medium dark:text-white/90">{activity.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Upcoming ({bookings.upcoming.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({bookings.completed.length})</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled ({bookings.cancelled.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Bookings</CardTitle>
                      <CardDescription>Your scheduled services</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {bookings.upcoming.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <Calendar className="h-12 w-12 text-muted-foreground/50" />
                              <h3 className="mt-4 text-lg font-semibold">No upcoming bookings</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                You don't have any upcoming bookings. Browse services to book your next appointment.
                              </p>
                              <Button className="mt-4" asChild>
                                <Link href="/services">Browse Services</Link>
                              </Button>
                            </div>
                          ) : (
                            bookings.upcoming.map((booking) => (
                              <div key={booking.id} className="flex flex-col space-y-3 rounded-lg border p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-md">
                                      <Image
                                        src={booking.image}
                                        alt={booking.service}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{booking.service}</h4>
                                      <p className="text-sm text-muted-foreground">{booking.provider}</p>
                                    </div>
                                  </div>
                                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                                    {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 text-sm">
                                  <div className="flex items-center">
                                    <Calendar className="mr-1 h-4 w-4" />
                                    {booking.date}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" />
                                    {booking.time}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="mr-1 h-4 w-4" />
                                    {booking.location}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">₹{booking.price}</div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking.id)}>
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => openRescheduleDialog(booking.id)}>Reschedule</Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="completed">
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Bookings</CardTitle>
                      <CardDescription>Your service history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {bookings.completed.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <History className="h-12 w-12 text-muted-foreground/50" />
                              <h3 className="mt-4 text-lg font-semibold">No completed bookings</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                You don't have any completed bookings yet.
                              </p>
                            </div>
                          ) : (
                            bookings.completed.map((booking) => (
                              <div key={booking.id} className="flex flex-col space-y-3 rounded-lg border p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-md">
                                      <Image
                                        src={booking.image}
                                        alt={booking.service}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{booking.service}</h4>
                                      <p className="text-sm text-muted-foreground">{booking.provider}</p>
                                    </div>
                                  </div>
                                  <Badge>Completed</Badge>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 text-sm">
                                  <div className="flex items-center">
                                    <Calendar className="mr-1 h-4 w-4" />
                                    {booking.date}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" />
                                    {booking.time}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">₹{booking.price}</div>
                                  <div className="flex items-center space-x-1">
                                    {booking.rating ? (
                                      <>
                                        <span className="text-sm">Your rating:</span>
                                        <div className="flex items-center">
                                          {Array.from({ length: booking.rating }).map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                                          ))}
                                          {Array.from({ length: 5 - booking.rating }).map((_, i) => (
                                            <Star key={i} className="h-4 w-4 text-muted-foreground" />
                                          ))}
                                        </div>
                                      </>
                                    ) : (
                                      <Button size="sm" onClick={() => openReviewDialog(booking.id)}>Leave Review</Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="cancelled">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cancelled Bookings</CardTitle>
                      <CardDescription>Your cancelled services</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {bookings.cancelled.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <History className="h-12 w-12 text-muted-foreground/50" />
                              <h3 className="mt-4 text-lg font-semibold">No cancelled bookings</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                You don't have any cancelled bookings.
                              </p>
                            </div>
                          ) : (
                            bookings.cancelled.map((booking) => (
                              <div key={booking.id} className="flex flex-col space-y-3 rounded-lg border p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-md">
                                      <Image
                                        src={booking.image}
                                        alt={booking.service}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">{booking.service}</h4>
                                      <p className="text-sm text-muted-foreground">{booking.provider}</p>
                                    </div>
                                  </div>
                                  <Badge variant="destructive">Cancelled</Badge>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 text-sm">
                                  <div className="flex items-center">
                                    <Calendar className="mr-1 h-4 w-4" />
                                    {booking.date}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" />
                                    {booking.time}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">₹{booking.price}</div>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/services/${booking.id}/book`}>Book Again</Link>
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </ScrollArea>
        </Card>
      </motion.div>

      {/* Recommended Services */}
      <motion.div variants={item}>
        <div className="flex flex-col space-y-4 mb-4">
          <div className="flex items-center justify-between">
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
          
          <div className="flex overflow-x-auto pb-2 space-x-2">
            <Button 
              variant={categoryFilter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Button>
            {["home", "professional", "health", "education", "events", "other"].map(cat => (
              <Button 
                key={cat} 
                variant={categoryFilter === cat ? "default" : "outline"} 
                size="sm"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-3">
              <Card>
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Book more services to get personalized recommendations.
                  </p>
                  <Button asChild>
                    <Link href="/services">Browse All Services</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredServices.map((service) => (
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
          )}
        </div>
      </motion.div>
      
      {/* Family Sharing Section - If family members exist */}
      {familyMembers && familyMembers.length > 0 && (
        <motion.div variants={item} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Family Sharing
            </h2>
            <Button asChild>
              <Link href="/dashboard/customer/family">
                Manage Family
              </Link>
            </Button>
          </div>

          <Card className="dark:bg-gray-900/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                {familyMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium dark:text-white/90">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.relationship}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.permissions.bookServices && (
                        <Badge variant="outline" className="text-blue-500 border-blue-500">Booking</Badge>
                      )}
                      {member.permissions.useWallet && (
                        <Badge variant="outline" className="text-green-500 border-green-500">Payments</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      {/* Modal Dialogs for Reschedule and Reviews */}
      <Dialog open={isReschedulingOpen} onOpenChange={setIsReschedulingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Select Date</h3>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Select Time</h3>
              <Select 
                value={selectedTime} 
                onValueChange={setSelectedTime}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(
                    (time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReschedulingOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRescheduleBooking}
              disabled={!selectedDate || !selectedTime}
            >
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Rating</h3>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 cursor-pointer ${
                      reviewRating >= star
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setReviewRating(star)}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Your Comments</h3>
              <Textarea
                placeholder="Share your experience with this service..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={reviewRating === 0}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
