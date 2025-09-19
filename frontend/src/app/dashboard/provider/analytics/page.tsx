"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  Users2,
  Star,
  Calendar,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  Target,
  Award
} from "lucide-react"
import { useProviderAnalytics } from '@/hooks/useProviderAnalytics'

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isExporting, setIsExporting] = useState(false)

  const {
    overview,
    revenueAnalytics,
    customerAnalytics,
    serviceAnalytics,
    loading,
    error,
    refreshAnalytics,
    exportReport
  } = useProviderAnalytics(selectedPeriod)

  // Handle period change
  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    await refreshAnalytics(period)
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      setIsExporting(true)
      await exportReport({
        format,
        period: selectedPeriod,
        includeCharts: true,
        sections: ['overview', 'revenue', 'customers', 'services']
      })
      toast({
        title: "Export Successful",
        description: `Analytics report exported as ${format.toUpperCase()}`
      })
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export analytics report",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `NPR ${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => refreshAnalytics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your business performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refreshAnalytics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleExport('csv')} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</h3>
                <div className="text-sm flex items-center text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="ml-1">+{overview.revenueGrowth.toFixed(1)}% from last {selectedPeriod}</span>
                </div>
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
                <h3 className="text-2xl font-bold">{overview.totalCustomers}</h3>
                <div className="text-sm flex items-center text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="ml-1">+{overview.customerGrowth.toFixed(1)}% from last {selectedPeriod}</span>
                </div>
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
                <h3 className="text-2xl font-bold">{overview.totalBookings}</h3>
                <div className="text-sm flex items-center text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="ml-1">+{overview.bookingGrowth.toFixed(1)}% from last {selectedPeriod}</span>
                </div>
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
                <h3 className="text-2xl font-bold">{overview.averageRating.toFixed(1)}</h3>
                <div className="text-sm flex items-center text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="ml-1">+{overview.ratingChange.toFixed(1)} from last {selectedPeriod}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Revenue Trend</h3>
                  <p className="text-sm text-muted-foreground">Last {selectedPeriod}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold">{revenueAnalytics ? formatCurrency(revenueAnalytics.totalRevenue) : 'N/A'}</p>
                </div>
              </div>
              <div className="h-[300px] flex items-center justify-center border rounded-lg">
                <p className="text-muted-foreground">Revenue Chart (Chart component integration needed)</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Top Performing Services</h3>
                  <p className="text-sm text-muted-foreground">By revenue</p>
                </div>
              </div>
              <div className="space-y-4">
                {serviceAnalytics && serviceAnalytics.topPerformingServices.slice(0, 5).map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(service.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{service.bookings} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Detailed Revenue Analysis</h3>
                <p className="text-sm text-muted-foreground">Revenue breakdown and trends</p>
              </div>
            </div>
            {revenueAnalytics ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="font-medium">{formatCurrency(revenueAnalytics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Bookings</span>
                  <span className="font-medium">{revenueAnalytics.totalBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average per Booking</span>
                  <span className="font-medium">{formatCurrency(revenueAnalytics.averageBookingValue)}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No revenue data available</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Customer Analytics</h3>
                <p className="text-sm text-muted-foreground">Customer base insights</p>
              </div>
            </div>
            {customerAnalytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Users2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{customerAnalytics.totalCustomers}</p>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{customerAnalytics.customerRetentionRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Retention Rate</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No customer data available</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Service Analytics</h3>
                <p className="text-sm text-muted-foreground">Service performance metrics</p>
              </div>
            </div>
            {serviceAnalytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{serviceAnalytics.totalServices}</p>
                    <p className="text-sm text-muted-foreground">Total Services</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{serviceAnalytics.activeServices}</p>
                    <p className="text-sm text-muted-foreground">Active Services</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No service metrics available</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}