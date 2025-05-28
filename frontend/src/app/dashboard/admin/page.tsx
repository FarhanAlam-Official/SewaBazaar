"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, ShoppingBag, CheckCircle, XCircle, ArrowUpRight, Search } from "lucide-react"
import DashboardSidebar from "@/components/layout/dashboard-sidebar"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface Stats {
  totalUsers: number
  userGrowth: number
  totalProviders: number
  providerGrowth: number
  totalServices: number
  serviceGrowth: number
  totalBookings: number
  bookingGrowth: number
  totalRevenue: number
  revenueGrowth: number
}

interface Provider {
  id: number
  name: string
  email: string
  phone: string
  category: string
  joinDate: string
  status: string
  image: string
}

interface Service {
  id: number
  title: string
  provider: string
  category: string
  price: number
  submitDate: string
  status: string
  image: string
}

interface Booking {
  id: number
  service: string
  provider: string
  customer: string
  date: string
  time: string
  status: string
  price: number
  location: string
  providerImage: string
  customerImage: string
}

interface BookingData {
  id: number
  price: number
}

interface ServiceData {
  id: number
  title: string
  provider: {
    name: string
  }
  category: string
  price: number
  created_at: string
  status: string
  image_url: string | null
}

interface ProviderData {
  id: number
  name: string
  email: string
  phone: string
  category: string
  created_at: string
  status: string
  avatar_url: string | null
}

interface BookingFullData {
  id: number
  service: {
    title: string
  }
  provider: {
    name: string
    avatar_url: string | null
  }
  customer: {
    name: string
    avatar_url: string | null
  }
  date: string
  time: string
  status: string
  price: number
  location: string
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingServices, setPendingServices] = useState<Service[]>([])
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState({
    stats: true,
    services: true,
    providers: true,
    bookings: true
  })
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchStats()
    fetchPendingServices()
    fetchPendingProviders()
    fetchRecentBookings()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch total users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
      
      if (usersError) throw usersError

      // Fetch total providers
      const { data: providers, error: providersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'provider')
      
      if (providersError) throw providersError

      // Fetch total services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
      
      if (servicesError) throw servicesError

      // Fetch total bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, price', { count: 'exact' })
      
      if (bookingsError) throw bookingsError

      // Calculate total revenue
      const totalRevenue = (bookings as BookingData[] | null)?.reduce((acc: number, booking: BookingData) => acc + booking.price, 0) || 0

      setStats({
        totalUsers: users?.length || 0,
        userGrowth: 12.5, // TODO: Calculate actual growth
        totalProviders: providers?.length || 0,
        providerGrowth: 8.3, // TODO: Calculate actual growth
        totalServices: services?.length || 0,
        serviceGrowth: 15.2, // TODO: Calculate actual growth
        totalBookings: bookings?.length || 0,
        bookingGrowth: 22.7, // TODO: Calculate actual growth
        totalRevenue,
        revenueGrowth: 18.9, // TODO: Calculate actual growth
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }

  const fetchPendingServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          provider:profiles(name),
          category,
          price,
          created_at,
          status,
          image_url
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      setPendingServices((data as ServiceData[]).map((service: ServiceData) => ({
        id: service.id,
        title: service.title,
        provider: service.provider.name,
        category: service.category,
        price: service.price,
        submitDate: new Date(service.created_at).toLocaleDateString(),
        status: service.status,
        image: service.image_url || "/placeholder.svg"
      })))
    } catch (error) {
      console.error('Error fetching pending services:', error)
      toast({
        title: "Error",
        description: "Failed to fetch pending services",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, services: false }))
    }
  }

  const fetchPendingProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          category,
          created_at,
          status,
          avatar_url
        `)
        .eq('role', 'provider')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      setPendingProviders((data as ProviderData[]).map((provider: ProviderData) => ({
        id: provider.id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        category: provider.category,
        joinDate: new Date(provider.created_at).toLocaleDateString(),
        status: provider.status,
        image: provider.avatar_url || "/placeholder.svg"
      })))
    } catch (error) {
      console.error('Error fetching pending providers:', error)
      toast({
        title: "Error",
        description: "Failed to fetch pending providers",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, providers: false }))
    }
  }

  const fetchRecentBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service:services(title),
          provider:profiles!bookings_provider_id_fkey(name, avatar_url),
          customer:profiles!bookings_customer_id_fkey(name, avatar_url),
          date,
          time,
          status,
          price,
          location
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error

      setRecentBookings((data as BookingFullData[]).map((booking: BookingFullData) => ({
        id: booking.id,
        service: booking.service.title,
        provider: booking.provider.name,
        customer: booking.customer.name,
        date: new Date(booking.date).toLocaleDateString(),
        time: booking.time,
        status: booking.status,
        price: booking.price,
        location: booking.location,
        providerImage: booking.provider.avatar_url || "/placeholder.svg",
        customerImage: booking.customer.avatar_url || "/placeholder.svg"
      })))
    } catch (error) {
      console.error('Error fetching recent bookings:', error)
      toast({
        title: "Error",
        description: "Failed to fetch recent bookings",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }))
    }
  }

  const handleApproveService = async (serviceId: number) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'active' })
        .eq('id', serviceId)
      
      if (error) throw error

      setPendingServices(prev => 
        prev.filter(service => service.id !== serviceId)
      )

      toast({
        title: "Success",
        description: "Service has been approved",
      })
    } catch (error) {
      console.error('Error approving service:', error)
      toast({
        title: "Error",
        description: "Failed to approve service",
        variant: "destructive",
      })
    }
  }

  const handleRejectService = async (serviceId: number) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'rejected' })
        .eq('id', serviceId)
      
      if (error) throw error

      setPendingServices(prev => 
        prev.filter(service => service.id !== serviceId)
      )

      toast({
        title: "Success",
        description: "Service has been rejected",
      })
    } catch (error) {
      console.error('Error rejecting service:', error)
      toast({
        title: "Error",
        description: "Failed to reject service",
        variant: "destructive",
      })
    }
  }

  const handleApproveProvider = async (providerId: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', providerId)
      
      if (error) throw error

      setPendingProviders(prev => 
        prev.filter(provider => provider.id !== providerId)
      )

      toast({
        title: "Success",
        description: "Provider has been approved",
      })
    } catch (error) {
      console.error('Error approving provider:', error)
      toast({
        title: "Error",
        description: "Failed to approve provider",
        variant: "destructive",
      })
    }
  }

  const handleRejectProvider = async (providerId: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', providerId)
      
      if (error) throw error

      setPendingProviders(prev => 
        prev.filter(provider => provider.id !== providerId)
      )

      toast({
        title: "Success",
        description: "Provider has been rejected",
      })
    } catch (error) {
      console.error('Error rejecting provider:', error)
      toast({
        title: "Error",
        description: "Failed to reject provider",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredServices = pendingServices.filter(service =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredProviders = pendingProviders.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-pearlWhite dark:bg-black">
      <DashboardSidebar userType="admin" />
      
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-500">Monitor and manage the SewaBazaar marketplace.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {loading.stats ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats.totalUsers}</div>
                    <div className="flex items-center text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats.userGrowth}%
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Service Providers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats.totalProviders}</div>
                    <div className="flex items-center text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats.providerGrowth}%
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats.totalServices}</div>
                    <div className="flex items-center text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats.serviceGrowth}%
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats.totalBookings}</div>
                    <div className="flex items-center text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats.bookingGrowth}%
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">NPR {(stats.totalRevenue / 1000).toFixed(0)}K</div>
                    <div className="flex items-center text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {stats.revenueGrowth}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pending Approvals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Pending Approvals</h2>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Tabs defaultValue="services">
              <TabsList className="mb-4">
                <TabsTrigger value="services">
                  Services ({pendingServices.length})
                </TabsTrigger>
                <TabsTrigger value="providers">
                  Providers ({pendingProviders.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="services">
                <div className="space-y-4">
                  {loading.services ? (
                    Array(3).fill(0).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <div className="flex space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex-1 space-y-4">
                              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <Card key={service.id}>
                        <CardContent className="p-6">
                          <div className="flex">
                            <div className="w-16 mr-4">
                              <Image
                                src={service.image}
                                alt={service.title}
                                width={60}
                                height={60}
                                className="rounded-md"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold">{service.title}</h3>
                                  <p className="text-sm text-gray-500">by {service.provider}</p>
                                </div>
                                <Badge className={getStatusColor(service.status)} variant="outline">
                                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center text-sm text-gray-500">
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  {service.category}
                                </div>
                                <p className="font-bold text-freshAqua">NPR {service.price}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">Submitted: {service.submitDate}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-brightTeal hover:bg-brightTeal/90 text-black"
                                    onClick={() => handleApproveService(service.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleRejectService(service.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No pending services found
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="providers">
                <div className="space-y-4">
                  {loading.providers ? (
                    Array(2).fill(0).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <div className="flex space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-4">
                              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : filteredProviders.length > 0 ? (
                    filteredProviders.map((provider) => (
                      <Card key={provider.id}>
                        <CardContent className="p-6">
                          <div className="flex">
                            <div className="w-12 mr-4">
                              <Image
                                src={provider.image}
                                alt={provider.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">{provider.name}</h3>
                                <Badge className={getStatusColor(provider.status)} variant="outline">
                                  {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                <div className="flex items-center text-sm text-gray-500">
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  {provider.category}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Joined: {provider.joinDate}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm">{provider.email}</p>
                                  <p className="text-sm">{provider.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-brightTeal hover:bg-brightTeal/90 text-black"
                                    onClick={() => handleApproveProvider(provider.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleRejectProvider(provider.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No pending providers found
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Bookings</h2>
              <Link href="/dashboard/admin/bookings">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {loading.bookings ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{booking.service}</h3>
                          <Badge className={getStatusColor(booking.status)} variant="outline">
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center mb-4">
                          <div className="flex items-center mr-4">
                            <Image
                              src={booking.providerImage}
                              alt={booking.provider}
                              width={24}
                              height={24}
                              className="rounded-full mr-2"
                            />
                            <span className="text-sm">{booking.provider}</span>
                          </div>
                          <div className="flex items-center">
                            <Image
                              src={booking.customerImage}
                              alt={booking.customer}
                              width={24}
                              height={24}
                              className="rounded-full mr-2"
                            />
                            <span className="text-sm">{booking.customer}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {booking.date}
                          </div>
                          <div>{booking.time}</div>
                          <div>{booking.location}</div>
                          <div className="font-semibold text-freshAqua">
                            NPR {booking.price}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent bookings found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
