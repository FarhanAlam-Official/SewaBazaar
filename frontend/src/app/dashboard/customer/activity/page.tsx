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
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
}

export default function CustomerActivityTimeline() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelineItem[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityTimelineItem[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    loadActivityTimeline()
  }, [])

  useEffect(() => {
    filterActivities(activeTab)
  }, [activityTimeline, activeTab])

  const loadActivityTimeline = async () => {
    try {
      setLoading(true)
      const activityData = await customerApi.getActivityTimeline()
      setActivityTimeline(activityData)
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

  const filterActivities = (filter: string) => {
    if (filter === "all") {
      setFilteredActivities(activityTimeline)
    } else {
      setFilteredActivities(activityTimeline.filter(activity => activity.type === filter))
    }
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

        <Tabs defaultValue="all" className="w-full mb-6" onValueChange={setActiveTab}>
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
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {filteredActivities.length === 0 ? (
                    <motion.div 
                      className="text-center py-12"
                      variants={itemVariants}
                    >
                      <Activity className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Your activity will appear here once you start using our services.
                      </p>
                      <Button asChild>
                        <Link href="/services">
                          Browse Services
                        </Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <VerticalTimeline>
                      {filteredActivities.map((activity, index) => (
                        <VerticalTimeline.Item 
                          key={activity.id} 
                          position={index % 2 === 0 ? "left" : "right"}
                          isFirst={index === 0} 
                          isLast={index === filteredActivities.length - 1}
                          icon={getTypeIcon(activity.type)}
                          accentColorClass={getTypeColor(activity.type)}
                        >
                          <motion.div 
                            className={`rounded-xl p-6 hover:shadow-md transition-all duration-300 border ${getTypeBgColor(activity.type)} relative`}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            variants={itemVariants}
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
                                    {activity.metadata.amount && (
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">₹{activity.metadata.amount.toLocaleString()}</span>
                                      </div>
                                    )}
                                    {activity.metadata.rating && (
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
                      ))}
                    </VerticalTimeline>
                  )}
                </CardContent>
              </Card>

              {filteredActivities.length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  variants={itemVariants}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="booking">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {filteredActivities.filter(a => a.type === "booking").length === 0 ? (
                    <motion.div 
                      className="text-center py-12"
                      variants={itemVariants}
                    >
                      <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Your booking activity will appear here once you start booking services.
                      </p>
                      <Button asChild>
                        <Link href="/services">
                          Browse Services
                        </Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <VerticalTimeline>
                      {filteredActivities.filter(a => a.type === "booking").map((activity, index) => (
                        <VerticalTimeline.Item 
                          key={activity.id} 
                          position={index % 2 === 0 ? "left" : "right"}
                          isFirst={index === 0} 
                          isLast={index === filteredActivities.filter(a => a.type === "booking").length - 1}
                          icon={getTypeIcon(activity.type)}
                          accentColorClass={getTypeColor(activity.type)}
                        >
                          <motion.div 
                            className={`rounded-xl p-6 hover:shadow-md transition-all duration-300 border ${getTypeBgColor(activity.type)} relative`}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            variants={itemVariants}
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
                                    {activity.metadata.amount && (
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">₹{activity.metadata.amount.toLocaleString()}</span>
                                      </div>
                                    )}
                                    {activity.metadata.rating && (
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
                      ))}
                    </VerticalTimeline>
                  )}
                </CardContent>
              </Card>

              {filteredActivities.filter(a => a.type === "booking").length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  variants={itemVariants}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="review">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {filteredActivities.filter(a => a.type === "review").length === 0 ? (
                    <motion.div 
                      className="text-center py-12"
                      variants={itemVariants}
                    >
                      <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Your review activity will appear here once you start reviewing services.
                      </p>
                      <Button asChild>
                        <Link href="/services">
                          Browse Services
                        </Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <VerticalTimeline>
                      {filteredActivities.filter(a => a.type === "review").map((activity, index) => (
                        <VerticalTimeline.Item 
                          key={activity.id} 
                          position={index % 2 === 0 ? "left" : "right"}
                          isFirst={index === 0} 
                          isLast={index === filteredActivities.filter(a => a.type === "review").length - 1}
                          icon={getTypeIcon(activity.type)}
                          accentColorClass={getTypeColor(activity.type)}
                        >
                          <motion.div 
                            className={`rounded-xl p-6 hover:shadow-md transition-all duration-300 border ${getTypeBgColor(activity.type)} relative`}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            variants={itemVariants}
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
                                    {activity.metadata.amount && (
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">₹{activity.metadata.amount.toLocaleString()}</span>
                                      </div>
                                    )}
                                    {activity.metadata.rating && (
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
                      ))}
                    </VerticalTimeline>
                  )}
                </CardContent>
              </Card>

              {filteredActivities.filter(a => a.type === "review").length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  variants={itemVariants}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="profile">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  {filteredActivities.filter(a => a.type === "profile").length === 0 ? (
                    <motion.div 
                      className="text-center py-12"
                      variants={itemVariants}
                    >
                      <UserCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No profile activity yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Your profile activity will appear here once you start updating your profile.
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/customer/profile">
                          Update Profile
                        </Link>
                      </Button>
                    </motion.div>
                  ) : (
                    <VerticalTimeline>
                      {filteredActivities.filter(a => a.type === "profile").map((activity, index) => (
                        <VerticalTimeline.Item 
                          key={activity.id} 
                          position={index % 2 === 0 ? "left" : "right"}
                          isFirst={index === 0} 
                          isLast={index === filteredActivities.filter(a => a.type === "profile").length - 1}
                          icon={getTypeIcon(activity.type)}
                          accentColorClass={getTypeColor(activity.type)}
                        >
                          <motion.div 
                            className={`rounded-xl p-6 hover:shadow-md transition-all duration-300 border ${getTypeBgColor(activity.type)} relative`}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                            variants={itemVariants}
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
                                    {activity.metadata.amount && (
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">₹{activity.metadata.amount.toLocaleString()}</span>
                                      </div>
                                    )}
                                    {activity.metadata.rating && (
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
                      ))}
                    </VerticalTimeline>
                  )}
                </CardContent>
              </Card>

              {filteredActivities.filter(a => a.type === "profile").length > 0 && (
                <motion.div 
                  className="mt-6 text-center"
                  variants={itemVariants}
                >
                  <Button variant="outline" onClick={loadActivityTimeline} className="gap-2">
                    <History className="h-4 w-4" />
                    Refresh Activity
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}