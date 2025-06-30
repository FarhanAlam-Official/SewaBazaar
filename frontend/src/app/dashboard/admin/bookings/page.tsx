"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { AnalyticsChart } from "@/components/ui/analytics-chart"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MoreHorizontal,
} from "lucide-react"

interface Booking {
  id: string
  service_title: string
  customer_name: string
  provider_name: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  date: string
  time: string
  price: number
}

interface BookingStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  revenue: number
}

export default function BookingsManagement() {
  const { toast } = useToast()
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [date, setDate] = useState<Date>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchBookings = async () => {
    try {
      // Simulated data - replace with actual data fetching
      const mockBookings: Booking[] = [
        {
          id: "1",
          service_title: "House Cleaning",
          customer_name: "John Doe",
          provider_name: "Jane Smith",
          status: "confirmed",
          date: "2024-03-20",
          time: "10:00",
          price: 2500,
        },
        {
          id: "2",
          service_title: "Plumbing Service",
          customer_name: "Alice Brown",
          provider_name: "Bob Wilson",
          status: "pending",
          date: "2024-03-21",
          time: "14:30",
          price: 1800,
        },
        // Add more mock bookings as needed
      ]

      setBookings(mockBookings)

      // Calculate stats
      const newStats: BookingStats = {
        total: mockBookings.length,
        pending: mockBookings.filter((b) => b.status === "pending").length,
        confirmed: mockBookings.filter((b) => b.status === "confirmed").length,
        completed: mockBookings.filter((b) => b.status === "completed").length,
        cancelled: mockBookings.filter((b) => b.status === "cancelled").length,
        revenue: mockBookings.reduce((acc, b) => acc + b.price, 0),
      }

      setStats(newStats)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "confirmed":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bookings Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
            >
              Day
            </Button>
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.confirmed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {stats.revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Timeline View */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start gap-4 border-l-2 pl-4"
                  style={{ borderColor: getStatusColor(booking.status) }}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{booking.service_title}</p>
                      <Badge variant="outline">{booking.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.customer_name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {booking.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsChart
            title=""
            data={[
              { name: "Mon", value: 2500 },
              { name: "Tue", value: 3800 },
              { name: "Wed", value: 3200 },
              { name: "Thu", value: 4100 },
              { name: "Fri", value: 3600 },
              { name: "Sat", value: 4800 },
              { name: "Sun", value: 4200 },
            ]}
            type="line"
            height={300}
          />
        </CardContent>
      </Card>
    </div>
  )
} 