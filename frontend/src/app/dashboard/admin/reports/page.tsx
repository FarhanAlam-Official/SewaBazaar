"use client"

import { useState } from "react"
import { AnalyticsChart } from "@/components/ui/analytics-chart"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  BarChart3,
  Calendar,
  Download,
  LineChart,
  Mail,
  Save,
  Users,
} from "lucide-react"

interface RevenueData {
  name: string
  value: number
}

interface UserGrowthData {
  name: string
  value: number
}

interface ServiceData {
  name: string
  value: number
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState("7d")
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [serviceData, setServiceData] = useState<ServiceData[]>([])

  const fetchAnalytics = async () => {
    try {
      // Simulated data - replace with actual API calls
      setRevenueData([
        { name: "Mon", value: 4000 },
        { name: "Tue", value: 3000 },
        { name: "Wed", value: 2000 },
        { name: "Thu", value: 2780 },
        { name: "Fri", value: 1890 },
        { name: "Sat", value: 2390 },
        { name: "Sun", value: 3490 },
      ])

      setUserGrowthData([
        { name: "Mon", value: 100 },
        { name: "Tue", value: 120 },
        { name: "Wed", value: 150 },
        { name: "Thu", value: 180 },
        { name: "Fri", value: 220 },
        { name: "Sat", value: 270 },
        { name: "Sun", value: 350 },
      ])

      setServiceData([
        { name: "Cleaning", value: 40 },
        { name: "Plumbing", value: 30 },
        { name: "Electrical", value: 25 },
        { name: "Painting", value: 20 },
        { name: "Moving", value: 15 },
      ])
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    fetchAnalytics()
  }, [])

  const handleExport = () => {
    toast({
      title: "Coming Soon",
      description: "Export functionality will be available soon",
    })
  }

  const handleSaveReport = () => {
    toast({
      title: "Coming Soon",
      description: "Save report functionality will be available soon",
    })
  }

  const handleScheduleReport = () => {
    toast({
      title: "Coming Soon",
      description: "Schedule report functionality will be available soon",
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveReport}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleScheduleReport}>
            <Mail className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$12,345"
          icon={<LineChart className="h-4 w-4 text-muted-foreground" />}
          growth={12.5}
        />
        <StatCard
          title="Total Users"
          value="1,234"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          growth={8.3}
        />
        <StatCard
          title="Active Services"
          value="567"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          growth={15.2}
        />
        <StatCard
          title="Total Bookings"
          value="890"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          growth={22.7}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsChart
          title="Revenue Trend"
          data={revenueData}
          type="area"
        />
        <AnalyticsChart
          title="User Growth"
          data={userGrowthData}
          type="line"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsChart
          title="Popular Services"
          data={serviceData}
          type="bar"
        />
        <AnalyticsChart
          title="Booking Distribution"
          data={serviceData}
          type="bar"
        />
      </div>
    </div>
  )
} 