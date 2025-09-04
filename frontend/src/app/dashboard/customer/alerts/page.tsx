"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Clock, Info, AlertTriangle, X, CheckCheck, Trash2, Archive, Filter, Search, Zap, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistance } from "date-fns"

interface Alert {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error" | "urgent"
  priority: "low" | "medium" | "high" | "urgent"
  timestamp: string
  isRead: boolean
  actionUrl?: string
  expiresAt?: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  show: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      duration: 0.5,
      bounce: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: { duration: 0.3 }
  }
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const
    }
  }
}

const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
}

export default function AlertsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      setAlerts([
        {
          id: "1",
          title: "Booking Confirmed",
          message: "Your booking for Home Cleaning has been confirmed for tomorrow at 2 PM. The service provider will arrive on time.",
          type: "success",
          priority: "high",
          timestamp: "2024-03-15T14:00:00Z",
          isRead: false,
          actionUrl: "/dashboard/customer/bookings"
        },
        {
          id: "2",
          title: "Payment Due Soon",
          message: "Payment for your last service booking is due in 2 days. Please complete payment to avoid service interruption.",
          type: "warning",
          priority: "urgent",
          timestamp: "2024-03-14T10:00:00Z",
          isRead: false,
          actionUrl: "/dashboard/customer/payments",
          expiresAt: "2024-03-16T23:59:59Z"
        },
        {
          id: "3",
          title: "Special Limited Offer",
          message: "Get 20% off on your next booking! This exclusive offer is valid for 24 hours only. Don't miss out!",
          type: "info",
          priority: "medium",
          timestamp: "2024-03-13T09:00:00Z",
          isRead: true,
          actionUrl: "/services",
          expiresAt: "2024-03-14T09:00:00Z"
        },
        {
          id: "4",
          title: "Booking Cancelled",
          message: "Your booking for Plumbing Service has been cancelled by the provider due to emergency. Full refund has been processed.",
          type: "error",
          priority: "high",
          timestamp: "2024-03-12T16:00:00Z",
          isRead: true,
          actionUrl: "/dashboard/customer/bookings"
        },
        {
          id: "5",
          title: "Account Security Update",
          message: "We've enhanced our security measures. Your account is now more secure with two-factor authentication available.",
          type: "urgent",
          priority: "medium",
          timestamp: "2024-03-11T12:00:00Z",
          isRead: false,
          actionUrl: "/dashboard/customer/settings"
        },
      ])
      setIsLoading(false)
    }, 1200)
  }, [])

  useEffect(() => {
    filterAlerts()
  }, [alerts, activeTab, searchTerm, priorityFilter])

  const filterAlerts = () => {
    let filtered = [...alerts]
    
    // Always apply search and priority filters first
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (priorityFilter !== "all") {
      filtered = filtered.filter(alert => alert.priority === priorityFilter)
    }
    
    // Apply tab-specific filters
    if (activeTab === "unread") {
      filtered = filtered.filter(alert => !alert.isRead)
    } else if (activeTab === "urgent") {
      filtered = filtered.filter(alert => alert.type === "urgent" || alert.priority === "urgent")
    } else if (activeTab !== "all") {
      filtered = filtered.filter(alert => alert.type === activeTab)
    }
    
    // Sort by priority and timestamp
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    
    setFilteredAlerts(filtered)
  }

  // Helper functions to get specific filtered alerts for each tab
  const getFilteredAlertsForTab = (tabType: string) => {
    let filtered = [...alerts]
    
    // Always apply search and priority filters
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (priorityFilter !== "all") {
      filtered = filtered.filter(alert => alert.priority === priorityFilter)
    }
    
    // Apply tab-specific filters
    if (tabType === "unread") {
      filtered = filtered.filter(alert => !alert.isRead)
    } else if (tabType === "urgent") {
      filtered = filtered.filter(alert => alert.type === "urgent" || alert.priority === "urgent")
    } else if (tabType !== "all") {
      filtered = filtered.filter(alert => alert.type === tabType)
    }
    
    // Sort by priority and timestamp
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    
    return filtered
  }

  const getAlertIcon = (type: Alert["type"], priority: Alert["priority"]) => {
    const iconClasses = "h-5 w-5"
    const isUrgent = priority === "urgent"
    
    switch (type) {
      case "info":
        return <Info className={`${iconClasses} ${isUrgent ? "text-blue-600" : "text-blue-500"}`} />
      case "warning":
        return <AlertTriangle className={`${iconClasses} ${isUrgent ? "text-amber-600" : "text-yellow-500"} ${isUrgent ? "animate-pulse" : ""}`} />
      case "success":
        return <Check className={`${iconClasses} ${isUrgent ? "text-emerald-600" : "text-green-500"}`} />
      case "error":
        return <X className={`${iconClasses} ${isUrgent ? "text-red-600 animate-pulse" : "text-red-500"}`} />
      case "urgent":
        return <Shield className={`${iconClasses} text-orange-600 animate-pulse`} />
    }
  }

  const getAlertBadge = (type: Alert["type"], priority: Alert["priority"]) => {
    const isUrgent = priority === "urgent"
    
    switch (type) {
      case "info":
        return <Badge variant="outline" className={`${isUrgent ? "border-blue-600 text-blue-600 animate-pulse" : "text-blue-500 border-blue-500"}`}>Info</Badge>
      case "warning":
        return <Badge variant="outline" className={`${isUrgent ? "border-amber-600 text-amber-600 animate-pulse" : "text-yellow-500 border-yellow-500"}`}>Warning</Badge>
      case "success":
        return <Badge variant="outline" className={`${isUrgent ? "border-emerald-600 text-emerald-600" : "text-green-500 border-green-500"}`}>Success</Badge>
      case "error":
        return <Badge variant="outline" className={`${isUrgent ? "border-red-600 text-red-600 animate-pulse" : "text-red-500 border-red-500"}`}>Error</Badge>
      case "urgent":
        return <Badge variant="outline" className="border-orange-600 text-orange-600 animate-pulse bg-orange-50 dark:bg-orange-900/20">Urgent</Badge>
    }
  }

  const getPriorityBadge = (priority: Alert["priority"]) => {
    switch (priority) {
      case "low":
        return <Badge variant="secondary" className="text-gray-600 bg-gray-100 dark:bg-gray-800">Low</Badge>
      case "medium":
        return <Badge variant="secondary" className="text-blue-600 bg-blue-100 dark:bg-blue-900/20">Medium</Badge>
      case "high":
        return <Badge variant="secondary" className="text-orange-600 bg-orange-100 dark:bg-orange-900/20">High</Badge>
      case "urgent":
        return <Badge variant="destructive" className="bg-red-600 text-white animate-pulse">Urgent</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const distance = formatDistance(date, now, { addSuffix: true })
    
    return {
      relative: distance,
      absolute: format(date, "PPp")
    }
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const markAsRead = (alertId: string) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    )
    setAlerts(updatedAlerts)
  }

  const deleteAlert = (alertId: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId)
    setAlerts(updatedAlerts)
  }

  const markAllAsRead = () => {
    const updatedAlerts = alerts.map(alert => ({ ...alert, isRead: true }))
    setAlerts(updatedAlerts)
  }

  const clearAllRead = () => {
    const updatedAlerts = alerts.filter(alert => !alert.isRead)
    setAlerts(updatedAlerts)
  }

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const timeInfo = formatTimestamp(alert.timestamp)
    const expired = isExpired(alert.expiresAt)
    
    return (
      <motion.div 
        variants={item}
        whileHover={{ y: -1, scale: 1.01 }}
        layout
        className="group"
      >
        <Card className={`relative transition-all duration-300 border-0 shadow-sm hover:shadow-lg overflow-hidden ${
          !alert.isRead 
            ? `bg-gradient-to-r ${getAlertGradient(alert.type, alert.priority)} border-l-4 ${getAlertBorderColor(alert.type, alert.priority)}`
            : "bg-card hover:bg-accent/20 opacity-75 hover:opacity-90"
        } ${
          expired ? "opacity-60" : ""
        }`}>
          {/* Priority indicator */}
          {alert.priority === "urgent" && (
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[15px] border-l-transparent border-t-[15px] border-t-red-500">
              <Zap className="absolute -top-3 -right-1 h-3 w-3 text-white animate-pulse" />
            </div>
          )}
          
          {/* Expiry warning */}
          {alert.expiresAt && !expired && (
            <motion.div 
              className="absolute top-2 right-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Clock className="h-3 w-3" />
              Expires {formatDistance(new Date(alert.expiresAt), new Date(), { addSuffix: true })}
            </motion.div>
          )}
          
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-4 flex-1">
                <motion.div 
                  className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    !alert.isRead 
                      ? getAlertIconBg(alert.type, alert.priority)
                      : "bg-muted/60 group-hover:bg-muted"
                  }`}
                  whileHover={{ rotate: alert.priority === "urgent" ? [0, -5, 5, 0] : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {getAlertIcon(alert.type, alert.priority)}
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <CardTitle className={`text-base font-semibold transition-colors duration-200 ${!alert.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {alert.title}
                      {expired && <span className="ml-2 text-xs text-red-500">(Expired)</span>}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getAlertBadge(alert.type, alert.priority)}
                      {getPriorityBadge(alert.priority)}
                      {!alert.isRead && (
                        <Badge 
                          variant="default" 
                          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-sm animate-pulse hover:animate-none"
                        >
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            New
                          </div>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span title={timeInfo.absolute}>{timeInfo.relative}</span>
                    {alert.expiresAt && (
                      <>
                        <span>•</span>
                        <span className={expired ? "text-red-500" : "text-amber-600"}>
                          {expired ? "Expired" : `Expires ${formatDistance(new Date(alert.expiresAt), new Date(), { addSuffix: true })}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {!alert.isRead && (
                  <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-4 pb-4 pt-0">
            <motion.p 
              className={`text-sm leading-relaxed transition-colors duration-200 ${
                !alert.isRead ? "text-muted-foreground" : "text-muted-foreground/70"
              }`}
              initial={{ opacity: 0.8 }}
              whileHover={{ opacity: 1 }}
            >
              {alert.message}
            </motion.p>
            
            {alert.actionUrl && !expired && (
              <motion.div 
                className="mt-3"
                whileHover="hover" 
                whileTap="tap" 
                variants={buttonVariants}
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  onClick={() => window.location.href = alert.actionUrl!}
                >
                  Take Action
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const getAlertGradient = (type: Alert["type"], priority: Alert["priority"]) => {
    const isUrgent = priority === "urgent"
    switch (type) {
      case "info":
        return isUrgent ? "from-blue-50 to-blue-25 dark:from-blue-900/10 dark:to-blue-900/5" : "from-blue-25 to-blue-10 dark:from-blue-900/5 dark:to-blue-900/2"
      case "warning":
        return isUrgent ? "from-amber-50 to-amber-25 dark:from-amber-900/10 dark:to-amber-900/5" : "from-yellow-25 to-yellow-10 dark:from-yellow-900/5 dark:to-yellow-900/2"
      case "success":
        return isUrgent ? "from-emerald-50 to-emerald-25 dark:from-emerald-900/10 dark:to-emerald-900/5" : "from-green-25 to-green-10 dark:from-green-900/5 dark:to-green-900/2"
      case "error":
        return isUrgent ? "from-red-50 to-red-25 dark:from-red-900/10 dark:to-red-900/5" : "from-red-25 to-red-10 dark:from-red-900/5 dark:to-red-900/2"
      case "urgent":
        return "from-orange-50 to-red-25 dark:from-orange-900/10 dark:to-red-900/5"
    }
  }

  const getAlertBorderColor = (type: Alert["type"], priority: Alert["priority"]) => {
    const isUrgent = priority === "urgent"
    switch (type) {
      case "info":
        return isUrgent ? "border-l-blue-600" : "border-l-blue-400"
      case "warning":
        return isUrgent ? "border-l-amber-600" : "border-l-yellow-400"
      case "success":
        return isUrgent ? "border-l-emerald-600" : "border-l-green-400"
      case "error":
        return isUrgent ? "border-l-red-600" : "border-l-red-400"
      case "urgent":
        return "border-l-orange-600"
    }
  }

  const getAlertIconBg = (type: Alert["type"], priority: Alert["priority"]) => {
    const isUrgent = priority === "urgent"
    switch (type) {
      case "info":
        return isUrgent ? "bg-blue-100 dark:bg-blue-900/20 shadow-blue-200 dark:shadow-blue-900/10" : "bg-blue-50 dark:bg-blue-900/10"
      case "warning":
        return isUrgent ? "bg-amber-100 dark:bg-amber-900/20 shadow-amber-200 dark:shadow-amber-900/10" : "bg-yellow-50 dark:bg-yellow-900/10"
      case "success":
        return isUrgent ? "bg-emerald-100 dark:bg-emerald-900/20 shadow-emerald-200 dark:shadow-emerald-900/10" : "bg-green-50 dark:bg-green-900/10"
      case "error":
        return isUrgent ? "bg-red-100 dark:bg-red-900/20 shadow-red-200 dark:shadow-red-900/10" : "bg-red-50 dark:bg-red-900/10"
      case "urgent":
        return "bg-orange-100 dark:bg-orange-900/20 shadow-orange-200 dark:shadow-orange-900/10"
    }
  }

  const LoadingAlertCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start gap-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const unreadCount = alerts.filter(alert => !alert.isRead).length
  const urgentCount = alerts.filter(alert => (alert.type === "urgent" || alert.priority === "urgent") && !alert.isRead).length
  const totalCount = alerts.length

  if (isLoading) {
    return (
      <motion.div 
        className="container mx-auto py-8 px-4 max-w-6xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        
        <motion.div 
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {[...Array(5)].map((_, i) => (
            <LoadingAlertCard key={i} />
          ))}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto py-8 px-4 max-w-6xl"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
          }
        }
      }}
    >
      {/* Enhanced Header */}
      <motion.div variants={headerVariants} className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-gradient-to-br from-orange-100 to-red-50 dark:from-orange-900/20 dark:to-red-900/10 rounded-xl relative"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Bell className="h-6 w-6 text-orange-600" />
                {urgentCount > 0 && (
                  <motion.div 
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {urgentCount}
                  </motion.div>
                )}
              </motion.div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Alerts & Notifications
              </h1>
              {urgentCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg animate-pulse"
                >
                  {urgentCount} urgent
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground/90 text-lg">
              {totalCount === 0 
                ? "No alerts at the moment" 
                : `${totalCount} alert${totalCount > 1 ? 's' : ''} total ${unreadCount > 0 ? `• ${unreadCount} unread` : ''} ${urgentCount > 0 ? `• ${urgentCount} urgent` : ''}`
              }
            </p>
          </div>
          
          {/* Action Buttons */}
          {alerts.length > 0 && (
            <motion.div 
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {unreadCount > 0 && (
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={markAllAsRead}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-md"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all read
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllRead}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Clear read
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Search and Filters */}
      {alerts.length > 0 && (
        <motion.div 
          variants={headerVariants}
          className="mb-6 p-4 bg-gradient-to-r from-card via-card to-accent/5 backdrop-blur-sm border rounded-xl shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/60 border-orange-200 focus:border-orange-400 dark:border-orange-800 dark:focus:border-orange-600 transition-colors duration-200"
              />
            </div>
            
            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-background/60 border-orange-200 focus:border-orange-400 dark:border-orange-800 dark:focus:border-orange-600">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="urgent">Urgent only</SelectItem>
                <SelectItem value="high">High priority</SelectItem>
                <SelectItem value="medium">Medium priority</SelectItem>
                <SelectItem value="low">Low priority</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>{urgentCount} urgent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{unreadCount} unread</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {/* Enhanced Tabs and Content */}
      <motion.div variants={headerVariants}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  All
                  <Badge variant="secondary" className="ml-1 text-xs">{totalCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Unread
                  {unreadCount > 0 && <Badge variant="secondary" className="ml-1 text-xs">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="urgent" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Urgent
                  {urgentCount > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs animate-pulse">
                      {urgentCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="warning" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </TabsTrigger>
                <TabsTrigger value="success" className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Success
                </TabsTrigger>
                <TabsTrigger value="error" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Errors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-[600px]">
                  <div className="pr-4">
                    {(() => {
                      const tabAlerts = getFilteredAlertsForTab("all")
                      return tabAlerts.length === 0 ? (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          className="inline-block p-4 bg-gradient-to-br from-orange-100 to-red-50 dark:from-orange-900/20 dark:to-red-900/10 rounded-full mb-6"
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Bell className="h-12 w-12 text-orange-500" />
                        </motion.div>
                        <h3 className="text-xl font-semibold mb-3 text-foreground/90">
                          {searchTerm || priorityFilter !== "all" 
                            ? "No matching alerts" 
                            : "No alerts yet"
                          }
                        </h3>
                        <p className="text-muted-foreground/80 text-lg">
                          {searchTerm || priorityFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "You're all caught up! We'll notify you when new alerts arrive."
                          }
                        </p>
                        {(searchTerm || priorityFilter !== "all") && (
                          <motion.div 
                            className="mt-4"
                            whileHover="hover" 
                            whileTap="tap" 
                            variants={buttonVariants}
                          >
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSearchTerm("")
                                setPriorityFilter("all")
                              }}
                              className="transition-all duration-200"
                            >
                              Clear filters
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="space-y-4"
                          >
                            {tabAlerts.map((alert) => (
                              <AlertCard key={alert.id} alert={alert} />
                            ))}
                          </motion.div>
                        </AnimatePresence>
                      )
                    })()
                    }
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread">
                <ScrollArea className="h-[600px]">
                  <div className="pr-4">
                    {(() => {
                      const tabAlerts = getFilteredAlertsForTab("unread")
                      return tabAlerts.length === 0 ? (
                        <motion.div className="text-center py-12">
                          <motion.div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-full mb-6">
                            <Bell className="h-12 w-12 text-blue-500" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-3">No unread alerts</h3>
                          <p className="text-muted-foreground/80 text-lg">All alerts have been read!</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {tabAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                        </motion.div>
                      )
                    })()
                    }
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="urgent">
                <ScrollArea className="h-[600px]">
                  <div className="pr-4">
                    {(() => {
                      const tabAlerts = getFilteredAlertsForTab("urgent")
                      return tabAlerts.length === 0 ? (
                        <motion.div className="text-center py-12">
                          <motion.div className="inline-block p-4 bg-gradient-to-br from-red-100 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 rounded-full mb-6">
                            <Shield className="h-12 w-12 text-red-500" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-3">No urgent alerts</h3>
                          <p className="text-muted-foreground/80 text-lg">Great! No urgent attention needed.</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {tabAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                        </motion.div>
                      )
                    })()
                    }
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="warning">
                <ScrollArea className="h-[600px]">
                  <div className="pr-4">
                    {(() => {
                      const tabAlerts = getFilteredAlertsForTab("warning")
                      return tabAlerts.length === 0 ? (
                        <motion.div className="text-center py-12">
                          <motion.div className="inline-block p-4 bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 rounded-full mb-6">
                            <AlertTriangle className="h-12 w-12 text-yellow-500" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-3">No warning alerts</h3>
                          <p className="text-muted-foreground/80 text-lg">Everything looks good!</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {tabAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                        </motion.div>
                      )
                    })()
                    }
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="success">
                <ScrollArea className="h-[600px]">
                  <div className="pr-4">
                    {(() => {
                      const tabAlerts = getFilteredAlertsForTab("success")
                      return tabAlerts.length === 0 ? (
                        <motion.div className="text-center py-12">
                          <motion.div className="inline-block p-4 bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-full mb-6">
                            <Check className="h-12 w-12 text-green-500" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-3">No success alerts</h3>
                          <p className="text-muted-foreground/80 text-lg">No recent successes to show.</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {tabAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                        </motion.div>
                      )
                    })()
                    }
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="error">
                <ScrollArea className="h-[600px]">
                  <div className="pr-4">
                    {(() => {
                      const tabAlerts = getFilteredAlertsForTab("error")
                      return tabAlerts.length === 0 ? (
                        <motion.div className="text-center py-12">
                          <motion.div className="inline-block p-4 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10 rounded-full mb-6">
                            <X className="h-12 w-12 text-red-500" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-3">No error alerts</h3>
                          <p className="text-muted-foreground/80 text-lg">No errors to report!</p>
                        </motion.div>
                      ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {tabAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                          ))}
                        </motion.div>
                      )
                    })()
                    }
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
} 