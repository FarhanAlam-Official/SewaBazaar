"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { showToast } from "@/components/ui/enhanced-toast"

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Star,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Download,
  Filter
} from "lucide-react"

import { safeToFixed, safeFormatCurrency, safeFormatPercentage } from "@/utils/safeUtils"
import type { ProviderService } from "@/types/provider"

interface ServiceAnalyticsProps {
  service: ProviderService
  onRefresh?: () => void
}

interface AnalyticsData {
  overview: {
    total_views: number
    total_inquiries: number
    conversion_rate: number
    average_rating: number
    total_reviews: number
    total_bookings: number
    total_revenue: number
    response_rate: number
  }
  performance: {
    views_trend: Array<{ date: string; views: number }>
    inquiries_trend: Array<{ date: string; inquiries: number }>
    bookings_trend: Array<{ date: string; bookings: number }>
    revenue_trend: Array<{ date: string; revenue: number }>
  }
  demographics: {
    age_groups: Array<{ age_group: string; percentage: number }>
    gender_distribution: Array<{ gender: string; percentage: number }>
    location_distribution: Array<{ location: string; percentage: number }>
  }
  reviews: {
    rating_distribution: Array<{ rating: number; count: number }>
    recent_reviews: Array<{
      id: number
      rating: number
      comment: string
      customer_name: string
      created_at: string
    }>
  }
  competitors: {
    similar_services: Array<{
      id: number
      title: string
      price: number
      rating: number
      bookings_count: number
    }>
  }
}

const mockAnalyticsData: AnalyticsData = {
  overview: {
    total_views: 1250,
    total_inquiries: 89,
    conversion_rate: 7.12,
    average_rating: 4.6,
    total_reviews: 23,
    total_bookings: 67,
    total_revenue: 125000,
    response_rate: 95.5
  },
  performance: {
    views_trend: [
      { date: "2024-01-01", views: 45 },
      { date: "2024-01-02", views: 52 },
      { date: "2024-01-03", views: 38 },
      { date: "2024-01-04", views: 61 },
      { date: "2024-01-05", views: 48 },
      { date: "2024-01-06", views: 55 },
      { date: "2024-01-07", views: 42 }
    ],
    inquiries_trend: [
      { date: "2024-01-01", inquiries: 3 },
      { date: "2024-01-02", inquiries: 4 },
      { date: "2024-01-03", inquiries: 2 },
      { date: "2024-01-04", inquiries: 5 },
      { date: "2024-01-05", inquiries: 3 },
      { date: "2024-01-06", inquiries: 4 },
      { date: "2024-01-07", inquiries: 2 }
    ],
    bookings_trend: [
      { date: "2024-01-01", bookings: 2 },
      { date: "2024-01-02", bookings: 3 },
      { date: "2024-01-03", bookings: 1 },
      { date: "2024-01-04", bookings: 4 },
      { date: "2024-01-05", bookings: 2 },
      { date: "2024-01-06", bookings: 3 },
      { date: "2024-01-07", bookings: 1 }
    ],
    revenue_trend: [
      { date: "2024-01-01", revenue: 4000 },
      { date: "2024-01-02", revenue: 6000 },
      { date: "2024-01-03", revenue: 2000 },
      { date: "2024-01-04", revenue: 8000 },
      { date: "2024-01-05", revenue: 4000 },
      { date: "2024-01-06", revenue: 6000 },
      { date: "2024-01-07", revenue: 2000 }
    ]
  },
  demographics: {
    age_groups: [
      { age_group: "18-25", percentage: 25 },
      { age_group: "26-35", percentage: 40 },
      { age_group: "36-45", percentage: 20 },
      { age_group: "46-55", percentage: 10 },
      { age_group: "55+", percentage: 5 }
    ],
    gender_distribution: [
      { gender: "Male", percentage: 60 },
      { gender: "Female", percentage: 40 }
    ],
    location_distribution: [
      { location: "Kathmandu", percentage: 45 },
      { location: "Pokhara", percentage: 25 },
      { location: "Lalitpur", percentage: 15 },
      { location: "Bhaktapur", percentage: 10 },
      { location: "Other", percentage: 5 }
    ]
  },
  reviews: {
    rating_distribution: [
      { rating: 5, count: 15 },
      { rating: 4, count: 6 },
      { rating: 3, count: 2 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 }
    ],
    recent_reviews: [
      {
        id: 1,
        rating: 5,
        comment: "Excellent service! Very professional and punctual.",
        customer_name: "John Doe",
        created_at: "2024-01-15"
      },
      {
        id: 2,
        rating: 4,
        comment: "Good quality work, would recommend.",
        customer_name: "Jane Smith",
        created_at: "2024-01-14"
      }
    ]
  },
  competitors: {
    similar_services: [
      {
        id: 1,
        title: "Professional Cleaning Service",
        price: 2500,
        rating: 4.5,
        bookings_count: 45
      },
      {
        id: 2,
        title: "Home Cleaning Experts",
        price: 3000,
        rating: 4.3,
        bookings_count: 38
      }
    ]
  }
}

export default function ServiceAnalytics({ service, onRefresh }: ServiceAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(mockAnalyticsData)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState("7d")
  const [activeTab, setActiveTab] = useState("overview")

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      onRefresh?.()
      showToast.success({
        title: "Analytics Updated",
        description: "Service analytics have been refreshed",
        duration: 3000
      })
    } catch (error) {
      showToast.error({
        title: "Refresh Failed",
        description: "Failed to refresh analytics data",
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }, [onRefresh])

  const handleExportData = useCallback(() => {
    // Simulate data export
    showToast.info({
      title: "Export Started",
      description: "Analytics data export will be available shortly",
      duration: 3000
    })
  }, [])

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4" />
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600"
    if (current < previous) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Analytics</h2>
          <p className="text-muted-foreground">{service.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">{analyticsData.overview.total_views.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(analyticsData.overview.total_views, 1000)}
                      <span className={`text-sm ${getTrendColor(analyticsData.overview.total_views, 1000)}`}>
                        +25%
                      </span>
                    </div>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inquiries</p>
                    <p className="text-2xl font-bold">{analyticsData.overview.total_inquiries}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(analyticsData.overview.total_inquiries, 75)}
                      <span className={`text-sm ${getTrendColor(analyticsData.overview.total_inquiries, 75)}`}>
                        +18.7%
                      </span>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{safeFormatPercentage(analyticsData.overview.conversion_rate)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(analyticsData.overview.conversion_rate, 6.5)}
                      <span className={`text-sm ${getTrendColor(analyticsData.overview.conversion_rate, 6.5)}`}>
                        +9.5%
                      </span>
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold">{safeToFixed(analyticsData.overview.average_rating, 1)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.overview.total_reviews} reviews
                      </span>
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold">{analyticsData.overview.total_bookings}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(analyticsData.overview.total_bookings, 60)}
                      <span className={`text-sm ${getTrendColor(analyticsData.overview.total_bookings, 60)}`}>
                        +11.7%
                      </span>
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{safeFormatCurrency(analyticsData.overview.total_revenue)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(analyticsData.overview.total_revenue, 110000)}
                      <span className={`text-sm ${getTrendColor(analyticsData.overview.total_revenue, 110000)}`}>
                        +13.6%
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                    <p className="text-2xl font-bold">{safeFormatPercentage(analyticsData.overview.response_rate)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(analyticsData.overview.response_rate, 92)}
                      <span className={`text-sm ${getTrendColor(analyticsData.overview.response_rate, 92)}`}>
                        +3.8%
                      </span>
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service Status</p>
                    <p className="text-2xl font-bold capitalize">{service.status}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge 
                        variant={service.status === 'active' ? 'default' : 'secondary'}
                        className={service.status === 'active' ? 'bg-green-500' : ''}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Views Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.views_trend.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(day.views / 70) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{day.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inquiries Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.inquiries_trend.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(day.inquiries / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{day.inquiries}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookings Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.bookings_trend.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(day.bookings / 4) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{day.bookings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.revenue_trend.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(day.revenue / 8000) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16">{safeFormatCurrency(day.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.demographics.age_groups.map((group, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{group.age_group}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.demographics.gender_distribution.map((group, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{group.gender}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.demographics.location_distribution.map((group, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{group.location}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.reviews.rating_distribution.map((rating, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{rating.rating}</span>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ 
                              width: `${(rating.count / analyticsData.overview.total_reviews) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{rating.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.reviews.recent_reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.customer_name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.created_at}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Similar Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.competitors.similar_services.map((competitor) => (
                  <div key={competitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{competitor.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {safeFormatCurrency(competitor.price)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {safeToFixed(competitor.rating, 1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {competitor.bookings_count} bookings
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {competitor.price < service.price ? 'Lower Price' : 'Higher Price'}
                      </Badge>
                      <Badge variant={competitor.rating > service.average_rating ? 'default' : 'secondary'}>
                        {competitor.rating > service.average_rating ? 'Higher Rating' : 'Lower Rating'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
