"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/enhanced-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VerticalTimeline } from "@/components/ui/vertical-timeline"

import {
  Calendar,
  Wallet,
  Star,
  Users,
  Activity,
  History,
  ChevronLeft,
  BookOpen,
  CreditCard,
  UserCheck,
  Circle
} from "lucide-react"

import { customerApi } from "@/services/customer.api"
import { useAuth } from "@/contexts/AuthContext"

interface ActivityTimelineItem {
  id: string
  type: 'booking' | 'review' | 'profile'
  title: string
  description: string
  timestamp: string
  status: string
  icon: string
  metadata?: {
    amount?: number
    service?: string
    rating?: number
    field_changed?: string
    old_value?: string
    new_value?: string
  }
}

// Removed container/child variant choreography to prevent blocked animations

export default function CustomerActivityTimeline() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelineItem[]>([])
  const [activeTab, setActiveTab] = useState("all")
  // Tab-specific pagination states
  const [tabPagination, setTabPagination] = useState({
    all: 1,
    booking: 1,
    review: 1,
    profile: 1
  })
  const [itemsPerPage] = useState(10) // Show 10 items per page

  useEffect(() => {
    loadActivityTimeline()
  }, [])

  const loadActivityTimeline = async () => {
    try {
      setLoading(true)
      const activityData = await customerApi.getActivityTimeline()
      setActivityTimeline(activityData)
      // Reset pagination for all tabs when loading new data
      setTabPagination({
        all: 1,
        booking: 1,
        review: 1,
        profile: 1
      })
    } catch (error: any) {
      console.error('Failed to load activity timeline:', error)
      showToast.error({
        title: "Error",
        description: "Failed to load activity timeline. Please try again later.",
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Update pagination when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Handle pagination for a specific tab
  const paginate = (tab: string, pageNumber: number) => {
    setTabPagination(prev => ({
      ...prev,
      [tab]: pageNumber
    }))
  }

  // Get items for a specific tab with pagination
  const getTabItems = (tabType: string) => {
    const tabFiltered = tabType === 'all' 
      ? activityTimeline 
      : activityTimeline.filter(activity => activity.type === tabType)
    
    const currentPage = tabPagination[tabType as keyof typeof tabPagination]
    const indexOfLast = currentPage * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage
    return tabFiltered.slice(indexOfFirst, indexOfLast)
  }

  // Get total pages for a specific tab
  const getTabTotalPages = (tabType: string) => {
    const tabFiltered = tabType === 'all' 
      ? activityTimeline 
      : activityTimeline.filter(activity => activity.type === tabType)
    
    return Math.ceil(tabFiltered.length / itemsPerPage)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="h-5 w-5" />
      case 'review': return <Star className="h-5 w-5" />
      case 'profile': return <UserCheck className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-blue-500'
      case 'review': return 'bg-yellow-500'
      case 'profile': return 'bg-purple-500'
      default: return 'bg-primary'
    }
  }

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
      case 'review': return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900'
      case 'profile': return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900'
      default: return 'bg-muted border-border'
    }
  }

  // Render activity item component to avoid duplication
  const renderActivityItem = (activity: ActivityTimelineItem, index: number, tabItems: ActivityTimelineItem[]) => (
    <VerticalTimeline.Item 
      key={activity.id} 
      position={index % 2 === 0 ? "left" : "right"}
      isFirst={index === 0} 
      isLast={index === tabItems.length - 1}
      icon={getTypeIcon(activity.type)}
      accentColorClass={getTypeColor(activity.type)}
    >
      <motion.div 
        className={`rounded-xl p-6 hover:shadow-md transition-all duration-300 border ${getTypeBgColor(activity.type)} relative`}
        whileHover={{ scale: 1.01 }}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${getTypeColor(activity.type)} text-white mt-1 shadow`}>
            {getTypeIcon(activity.type)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground text-lg">{activity.title}</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                activity.status === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900 border border-green-200' 
                  : activity.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900 border border-yellow-200'
                  : activity.status === 'cancelled'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900 border border-red-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900 border border-blue-200'
              }`}>
                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
              </span>
            </div>
            <p className="text-muted-foreground mt-2">{activity.description}</p>
            
            {activity.metadata && (
              <div className="flex flex-wrap gap-4 mt-4">
                {activity.metadata.amount !== undefined && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">₹{activity.metadata.amount.toLocaleString()}</span>
                  </div>
                )}
                {activity.metadata.rating !== undefined && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{activity.metadata.rating}★</span>
                  </div>
                )}
                {activity.metadata.service && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{activity.metadata.service}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground mt-4 flex items-center">
              <Circle className="h-2 w-2 mr-2 fill-current" />
              {activity.timestamp && !isNaN(new Date(activity.timestamp).getTime()) 
                ? format(new Date(activity.timestamp), "MMM d, yyyy • h:mm a")
                : "Invalid Date"}
            </div>
          </div>
        </div>
      </motion.div>
    </VerticalTimeline.Item>
  )

  // Render pagination component
  const renderPagination = (tabType: string) => {
    const totalPages = getTabTotalPages(tabType)
    const currentPage = tabPagination[tabType as keyof typeof tabPagination]
    
    if (totalPages <= 1) return null
    
    return (
      <div className="flex justify-center mt-8">
        <nav className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(tabType, Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => paginate(tabType, pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(tabType, Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </nav>
      </div>
    )
  }

  // Render empty state component
  const renderEmptyState = (icon: React.ReactNode, title: string, description: string, action?: { text: string, href: string }) => (
    <motion.div 
      className="text-center py-12"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25 }}
    >
      {icon}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <Button asChild>
          <Link href={action.href}>
            {action.text}
          </Link>
        </Button>
      )}
    </motion.div>
  )

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Activity className="h-8 w-8 mr-3 text-primary" />
                Activity Timeline
              </h1>
              <p className="text-muted-foreground">Your recent service activity</p>
            </div>
            <Button variant="outline" asChild className="w-full md:w-auto">
              <Link href="/dashboard/customer">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Activity className="h-8 w-8 mr-3 text-primary" />
              Activity Timeline
            </h1>
            <p className="text-muted-foreground">Your recent service activity</p>
          </div>
          <Button variant="outline" asChild className="w-full md:w-auto">
            <Link href="/dashboard/customer">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full mb-6" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All
            </TabsTrigger>
            <TabsTrigger value="booking">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="review">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="profile">
              Profile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div>
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {getTabItems('all').length === 0 ? (
                    renderEmptyState(
                      <Activity className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />,
                      "No activity yet",
                      "Your activity will appear here once you start using our services.",
                      { text: "Browse Services", href: "/services" }
                    )
                  ) : (
                    <>
                      <VerticalTimeline>
                        {getTabItems('all').map((activity, index, arr) => 
                          renderActivityItem(activity, index, arr)
                        )}
                      </VerticalTimeline>
                      {renderPagination('all')}
                    </>
                  )}
                </CardContent>
              </Card>

              {getTabItems('all').length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="booking">
            <div>
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {getTabItems('booking').length === 0 ? (
                    renderEmptyState(
                      <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />,
                      "No bookings yet",
                      "Your booking activity will appear here once you start booking services.",
                      { text: "Browse Services", href: "/services" }
                    )
                  ) : (
                    <>
                      <VerticalTimeline>
                        {getTabItems('booking').map((activity, index, arr) => 
                          renderActivityItem(activity, index, arr)
                        )}
                      </VerticalTimeline>
                      {renderPagination('booking')}
                    </>
                  )}
                </CardContent>
              </Card>

              {getTabItems('booking').length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="review">
            <div>
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {getTabItems('review').length === 0 ? (
                    renderEmptyState(
                      <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />,
                      "No reviews yet",
                      "Your review activity will appear here once you start reviewing services.",
                      { text: "Browse Services", href: "/services" }
                    )
                  ) : (
                    <>
                      <VerticalTimeline>
                        {getTabItems('review').map((activity, index, arr) => 
                          renderActivityItem(activity, index, arr)
                        )}
                      </VerticalTimeline>
                      {renderPagination('review')}
                    </>
                  )}
                </CardContent>
              </Card>

              {getTabItems('review').length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <div>
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {getTabItems('profile').length === 0 ? (
                    renderEmptyState(
                      <UserCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />,
                      "No profile activity yet",
                      "Your profile activity will appear here once you start updating your profile.",
                      { text: "Update Profile", href: "/dashboard/customer/profile" }
                    )
                  ) : (
                    <>
                      <VerticalTimeline>
                        {getTabItems('profile').map((activity, index, arr) => 
                          renderActivityItem(activity, index, arr)
                        )}
                      </VerticalTimeline>
                      {renderPagination('profile')}
                    </>
                  )}
                </CardContent>
              </Card>

              {getTabItems('profile').length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}