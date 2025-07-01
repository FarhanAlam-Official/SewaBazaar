"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataGrid } from "@/components/ui/data-grid"
import { AnalyticsChart } from "@/components/ui/analytics-chart"
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Star,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react"

// TODO: Replace with actual API calls and database models
interface AnalyticsSummary {
  totalUsers: number
  totalBookings: number
  totalRevenue: number
  totalProviders: number
  userGrowth: number
  bookingGrowth: number
  revenueGrowth: number
  providerGrowth: number
}

interface TopService {
  id: string
  name: string
  bookings: number
  revenue: number
  rating: number
  growth: number
}

interface TopProvider {
  id: string
  name: string
  services: number
  bookings: number
  revenue: number
  rating: number
}

// Mock data
const MOCK_SUMMARY: AnalyticsSummary = {
  totalUsers: 15234,
  totalBookings: 8456,
  totalRevenue: 456789,
  totalProviders: 342,
  userGrowth: 12.5,
  bookingGrowth: 8.3,
  revenueGrowth: 15.7,
  providerGrowth: 5.2,
}

const MOCK_TOP_SERVICES: TopService[] = [
  {
    id: "1",
    name: "House Cleaning",
    bookings: 1234,
    revenue: 98765,
    rating: 4.8,
    growth: 15.3,
  },
  {
    id: "2",
    name: "Plumbing",
    bookings: 987,
    revenue: 87654,
    rating: 4.7,
    growth: 12.1,
  },
]

const MOCK_TOP_PROVIDERS: TopProvider[] = [
  {
    id: "1",
    name: "CleanPro Services",
    services: 5,
    bookings: 456,
    revenue: 45678,
    rating: 4.9,
  },
  {
    id: "2",
    name: "HandyFix Solutions",
    services: 3,
    bookings: 345,
    revenue: 34567,
    rating: 4.8,
  },
]

const MOCK_CHART_DATA = {
  bookings: [
    { date: "2024-01", value: 234 },
    { date: "2024-02", value: 345 },
    { date: "2024-03", value: 456 },
  ],
  revenue: [
    { date: "2024-01", value: 23456 },
    { date: "2024-02", value: 34567 },
    { date: "2024-03", value: 45678 },
  ],
  users: [
    { date: "2024-01", value: 1234 },
    { date: "2024-02", value: 2345 },
    { date: "2024-03", value: 3456 },
  ],
}

export default function AnalyticsPage() {
  const serviceColumns = [
    {
      field: "name",
      headerName: "Service",
      flex: 2,
    },
    {
      field: "bookings",
      headerName: "Bookings",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          {params.row.bookings}
        </div>
      ),
    },
    {
      field: "revenue",
      headerName: "Revenue",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          ${params.row.revenue}
        </div>
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" />
          {params.row.rating}
        </div>
      ),
    },
    {
      field: "growth",
      headerName: "Growth",
      flex: 1,
      renderCell: (params: any) => (
        <Badge variant={params.row.growth > 0 ? "default" : "destructive"}>
          {params.row.growth > 0 ? (
            <ArrowUpRight className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 mr-1" />
          )}
          {Math.abs(params.row.growth)}%
        </Badge>
      ),
    },
  ]

  const providerColumns = [
    {
      field: "name",
      headerName: "Provider",
      flex: 2,
    },
    {
      field: "services",
      headerName: "Services",
      flex: 1,
    },
    {
      field: "bookings",
      headerName: "Bookings",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          {params.row.bookings}
        </div>
      ),
    },
    {
      field: "revenue",
      headerName: "Revenue",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          ${params.row.revenue}
        </div>
      ),
    },
    {
      field: "rating",
      headerName: "Rating",
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" />
          {params.row.rating}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_SUMMARY.totalUsers}</div>
            <Badge variant={MOCK_SUMMARY.userGrowth > 0 ? "default" : "destructive"}>
              {MOCK_SUMMARY.userGrowth > 0 ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {Math.abs(MOCK_SUMMARY.userGrowth)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_SUMMARY.totalBookings}</div>
            <Badge variant={MOCK_SUMMARY.bookingGrowth > 0 ? "default" : "destructive"}>
              {MOCK_SUMMARY.bookingGrowth > 0 ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {Math.abs(MOCK_SUMMARY.bookingGrowth)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${MOCK_SUMMARY.totalRevenue}</div>
            <Badge variant={MOCK_SUMMARY.revenueGrowth > 0 ? "default" : "destructive"}>
              {MOCK_SUMMARY.revenueGrowth > 0 ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {Math.abs(MOCK_SUMMARY.revenueGrowth)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Providers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_SUMMARY.totalProviders}</div>
            <Badge variant={MOCK_SUMMARY.providerGrowth > 0 ? "default" : "destructive"}>
              {MOCK_SUMMARY.providerGrowth > 0 ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {Math.abs(MOCK_SUMMARY.providerGrowth)}%
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Trends</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <AnalyticsChart
                data={MOCK_CHART_DATA.bookings}
                title="Monthly Bookings"
                description="Number of bookings per month"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <AnalyticsChart
                data={MOCK_CHART_DATA.revenue}
                title="Monthly Revenue"
                description="Revenue generated per month"
                valuePrefix="$"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <AnalyticsChart
                data={MOCK_CHART_DATA.users}
                title="Monthly Users"
                description="New users registered per month"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid
              rows={MOCK_TOP_SERVICES}
              columns={serviceColumns}
              pageSize={5}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid
              rows={MOCK_TOP_PROVIDERS}
              columns={providerColumns}
              pageSize={5}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 