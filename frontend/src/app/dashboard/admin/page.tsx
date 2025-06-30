"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { AnalyticsChart } from "@/components/ui/analytics-chart"
import { ActivityTimeline } from "@/components/ui/activity-timeline"
import { DataGrid } from "@/components/ui/data-grid"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Users,
  ShoppingBag,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react"

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

interface RevenueData {
  name: string
  value: number
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState({
    stats: true,
    revenue: true,
    activities: true,
  })

  useEffect(() => {
    fetchStats()
    fetchRevenueData()
    fetchRecentActivities()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch total users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })

      if (usersError) throw usersError

      // Fetch total providers
      const { data: providers, error: providersError } = await supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("role", "provider")

      if (providersError) throw providersError

      // Fetch total services
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("id", { count: "exact" })

      if (servicesError) throw servicesError

      // Fetch total bookings and calculate revenue
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, price")

      if (bookingsError) throw bookingsError

      const totalRevenue = bookings?.reduce(
        (acc, booking) => acc + (booking.price || 0),
        0
      )

      setStats({
        totalUsers: users?.length || 0,
        userGrowth: 12.5,
        totalProviders: providers?.length || 0,
        providerGrowth: 8.3,
        totalServices: services?.length || 0,
        serviceGrowth: 15.2,
        totalBookings: bookings?.length || 0,
        bookingGrowth: 22.7,
        totalRevenue: totalRevenue || 0,
        revenueGrowth: 18.9,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }))
    }
  }

  const fetchRevenueData = async () => {
    try {
      // Simulated revenue data - replace with actual data
      setRevenueData([
        { name: "Jan", value: 4000 },
        { name: "Feb", value: 3000 },
        { name: "Mar", value: 2000 },
        { name: "Apr", value: 2780 },
        { name: "May", value: 1890 },
        { name: "Jun", value: 2390 },
        { name: "Jul", value: 3490 },
      ])
    } catch (error) {
      console.error("Error fetching revenue data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch revenue data",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, revenue: false }))
    }
  }

  const fetchRecentActivities = async () => {
    try {
      // Simulated activity data - replace with actual data
      setRecentActivities([
        {
          id: 1,
          title: "New Service Added",
          description: "A new cleaning service was added by John Doe",
          timestamp: "2 hours ago",
          type: "success",
          icon: <ShoppingBag className="h-4 w-4 text-white" />,
        },
        {
          id: 2,
          title: "Booking Cancelled",
          description: "Booking #1234 was cancelled by the customer",
          timestamp: "3 hours ago",
          type: "error",
          icon: <XCircle className="h-4 w-4 text-white" />,
        },
        {
          id: 3,
          title: "New Provider",
          description: "Jane Smith registered as a new service provider",
          timestamp: "5 hours ago",
          type: "info",
          icon: <Users className="h-4 w-4 text-white" />,
        },
      ])
    } catch (error) {
      console.error("Error fetching activities:", error)
      toast({
        title: "Error",
        description: "Failed to fetch recent activities",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, activities: false }))
    }
  }

  if (loading.stats || loading.revenue || loading.activities) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          growth={stats?.userGrowth}
        />
        <StatCard
          title="Total Services"
          value={stats?.totalServices || 0}
          icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
          growth={stats?.serviceGrowth}
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          growth={stats?.bookingGrowth}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats?.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          growth={stats?.revenueGrowth}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsChart
          title="Revenue Trend"
          data={revenueData}
          type="area"
        />
        <AnalyticsChart
          title="Bookings Overview"
          data={revenueData}
          type="bar"
        />
      </div>

      {/* Activity Timeline */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActivityTimeline
          title="Recent Activities"
          items={recentActivities}
        />
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Quick Stats</h3>
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Active Services</span>
              </div>
              <span className="font-medium">{stats?.totalServices || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span>Pending Reviews</span>
              </div>
              <span className="font-medium">12</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <span>System Health</span>
              </div>
              <span className="font-medium text-green-500">Good</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
