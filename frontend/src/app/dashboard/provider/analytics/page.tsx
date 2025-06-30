"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  Users2,
  Star,
  Calendar,
  Clock,
  Download,
  Filter
} from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your business performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <h3 className="text-2xl font-bold">NPR 125,000</h3>
              <p className="text-sm text-green-600">+12.5% from last month</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <h3 className="text-2xl font-bold">156</h3>
              <p className="text-sm text-green-600">+8.2% from last month</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <h3 className="text-2xl font-bold">248</h3>
              <p className="text-sm text-green-600">+15.3% from last month</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <h3 className="text-2xl font-bold">4.8</h3>
              <p className="text-sm text-green-600">+0.2 from last month</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Trend Chart */}
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Revenue Trend</h3>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                {/* Placeholder for Chart */}
                <p className="text-muted-foreground">Revenue Chart</p>
              </div>
            </Card>

            {/* Booking Statistics */}
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Booking Statistics</h3>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
                <Button variant="outline" size="sm">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                {/* Placeholder for Chart */}
                <p className="text-muted-foreground">Bookings Chart</p>
              </div>
            </Card>

            {/* Service Performance */}
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Service Performance</h3>
                  <p className="text-sm text-muted-foreground">By service type</p>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                {/* Placeholder for Chart */}
                <p className="text-muted-foreground">Service Performance Chart</p>
              </div>
            </Card>

            {/* Customer Growth */}
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Customer Growth</h3>
                  <p className="text-sm text-muted-foreground">New vs Returning</p>
                </div>
                <Button variant="outline" size="sm">
                  <Users2 className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                {/* Placeholder for Chart */}
                <p className="text-muted-foreground">Customer Growth Chart</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Detailed Revenue Analysis</h3>
                <p className="text-sm text-muted-foreground">Track your earnings</p>
              </div>
            </div>
            {/* Add detailed revenue analysis components here */}
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Customer Analytics</h3>
                <p className="text-sm text-muted-foreground">Understand your customer base</p>
              </div>
            </div>
            {/* Add customer analytics components here */}
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Service Analytics</h3>
                <p className="text-sm text-muted-foreground">Track service performance</p>
              </div>
            </div>
            {/* Add service analytics components here */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

