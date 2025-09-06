"use client"

import { useState, useEffect, useMemo } from "react"
import { showToast } from "@/components/ui/enhanced-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Clock, Package, CreditCard, AlertTriangle, X, CheckCheck, Trash2, Archive, Filter, Search } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { customerApi } from "@/services/customer.api"
import { useNotifications } from "@/contexts/NotificationContext"

type NotificationType = "booking" | "review" | "system" | "payment"

interface Notification {
  id: number
  title: string
  message: string
  notification_type: NotificationType
  is_read: boolean
  created_at: string
  related_id?: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      duration: 0.6,
      bounce: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: -100,
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

export default function CustomerNotificationsPage() {

  const { markAsRead: contextMarkAsRead, markAllAsRead: contextMarkAllAsRead, refreshUnreadCount } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRead, setFilterRead] = useState<string>("all")

  // Derive filtered notifications with useMemo for better performance
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(notification => {
        if (!searchTerm) return true
        return (
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
      .filter(notification => {
        if (filterType === "all") return true
        return notification.notification_type === filterType
      })
      .filter(notification => {
        if (filterRead === "all") return true
        if (filterRead === "read") return notification.is_read
        if (filterRead === "unread") return !notification.is_read
        return true
      })
  }, [notifications, searchTerm, filterType, filterRead])

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      // Fetch notifications from API
      const response = await customerApi.getNotifications()
      const notificationsArray = Array.isArray(response) ? response : 
                               (response && typeof response === 'object' && 'results' in response ? response.results : [])
      
      setNotifications(notificationsArray)
      
    } catch (error: any) {
      console.error('Error loading notifications:', error)
      showToast.error({
        title: "📡 Connection Issue!",
        description: error.response?.data?.detail || error.message || "Couldn't load your notifications right now. Check your connection and try again! 🔌",
        duration: 5000
      })
      // Set empty array on error - no mock data fallback
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      // Use context method which handles both API call and global state update
      await contextMarkAsRead(id)
      
      // Update local state for immediate UI update
      const updatedNotifications = notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      )
      setNotifications(updatedNotifications)
      
      showToast.success({
        title: "📖 Perfect!",
        description: "Notification marked as read! Keep your inbox organized 🎯",
        duration: 3000
      })
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      showToast.error({
        title: "😕 Oops!",
        description: error.response?.data?.detail || error.message || "Couldn't mark notification as read. Please try again! 🔄",
        duration: 5000
      })
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      // Check if notification was unread before deleting
      const notification = notifications.find(n => n.id === id)
      const wasUnread = notification && !notification.is_read
      
      // Delete notification via API
      await customerApi.deleteNotification(id)
      
      // Update local state immediately for optimistic update
      const updatedNotifications = notifications.filter(notification => notification.id !== id)
      setNotifications(updatedNotifications)
      
      // If deleted notification was unread, refresh the global count
      if (wasUnread) {
        await refreshUnreadCount()
      }
      
      showToast.success({
        title: "🗑️ Gone!",
        description: "Notification deleted successfully! One less thing to worry about 😌",
        duration: 3000
      })
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      showToast.error({
        title: "💥 Uh oh!",
        description: error.response?.data?.detail || error.message || "Couldn't delete notification. Let's try that again! 🚀",
        duration: 5000
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      // Use context method which handles both API call and global state update
      await contextMarkAllAsRead()
      
      // Update local state for immediate UI update
      const updatedNotifications = notifications.map(notification => ({ ...notification, is_read: true }))
      setNotifications(updatedNotifications)
      
      showToast.success({
        title: "🎉 All Clear!",
        description: "Every notification is now marked as read! Your inbox is sparkling clean ✨",
        duration: 3000
      })
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
      showToast.error({
        title: "😔 Not quite!",
        description: error.response?.data?.detail || error.message || "Couldn't mark all notifications as read. Give it another shot! 💪",
        duration: 5000
      })
    }
  }

  const clearAllRead = async () => {
    try {
      const readNotifications = notifications.filter(n => n.is_read)
      if (readNotifications.length === 0) {
        showToast.info({
          title: "📭 Nothing here!",
          description: "No read notifications to clear. Your inbox is already tidy! 🧹",
          duration: 3000
        })
        return
      }
      
      // Clear read notifications via API
      await customerApi.clearReadNotifications()
      
      // Update local state immediately for optimistic update
      const updatedNotifications = notifications.filter(notification => !notification.is_read)
      setNotifications(updatedNotifications)
      
      showToast.success({
        title: "🧹 Squeaky Clean!",
        description: `Cleared ${readNotifications.length} read notifications! Your inbox is now pristine ✨`,
        duration: 3000
      })
    } catch (error: any) {
      console.error('Error clearing read notifications:', error)
      showToast.error({
        title: "🤖 Technical hiccup!",
        description: error.response?.data?.detail || error.message || "Couldn't clear read notifications. Let's try once more! 🔧",
        duration: 5000
      })
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "booking":
        return <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case "review":
        return <Check className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
      case "system":
        return <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getNotificationBadge = (type: NotificationType) => {
    switch (type) {
      case "booking":
        return <Badge variant="outline" className="text-blue-700 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-950/20 font-medium">Booking</Badge>
      case "review":
        return <Badge variant="outline" className="text-purple-700 dark:text-purple-400 border-purple-500 bg-purple-50 dark:bg-purple-950/20 font-medium">Review</Badge>
      case "payment":
        return <Badge variant="outline" className="text-green-700 dark:text-green-400 border-green-500 bg-green-50 dark:bg-green-950/20 font-medium">Payment</Badge>
      case "system":
        return <Badge variant="outline" className="text-orange-700 dark:text-orange-400 border-orange-500 bg-orange-50 dark:bg-orange-950/20 font-medium">System</Badge>
      default:
        return <Badge variant="outline" className="font-medium">Notification</Badge>
    }
  }

  const getNotificationColors = (type: NotificationType) => {
    switch (type) {
      case "booking":
        return { 
          border: "border-l-blue-500 dark:border-l-blue-400",
          background: "bg-blue-50 dark:bg-blue-950/20",
          hoverBackground: "hover:bg-blue-100/50 dark:hover:bg-blue-950/30"
        }
      case "review":
        return { 
          border: "border-l-purple-500 dark:border-l-purple-400",
          background: "bg-purple-50 dark:bg-purple-950/20",
          hoverBackground: "hover:bg-purple-100/50 dark:hover:bg-purple-950/30"
        }
      case "payment":
        return { 
          border: "border-l-green-500 dark:border-l-green-400",
          background: "bg-green-50 dark:bg-green-950/20",
          hoverBackground: "hover:bg-green-100/50 dark:hover:bg-green-950/30"
        }
      case "system":
        return { 
          border: "border-l-orange-500 dark:border-l-orange-400",
          background: "bg-orange-50 dark:bg-orange-950/20",
          hoverBackground: "hover:bg-orange-100/50 dark:hover:bg-orange-950/30"
        }
      
    }
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const colors = getNotificationColors(notification.notification_type)
    
    return (
      <motion.div 
        variants={item}
        whileHover={{ y: -2 }}
        layout
        className="group"
      >
        <Card className={`relative transition-all duration-300 border shadow-sm hover:shadow-lg ${
          !notification.is_read 
            ? `${colors.background} border-l-4 ${colors.border} shadow-md ${colors.hoverBackground}` 
            : "bg-card hover:bg-muted/50 border-border"
        }`}>
          
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start space-x-4">
              <div className="flex items-start space-x-4 flex-1">
                <div 
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    !notification.is_read 
                      ? "bg-background border border-border shadow-sm" 
                      : "bg-muted/50 border border-border"
                  }`}
                >
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <CardTitle className={`text-base transition-colors duration-200 truncate ${
                      !notification.is_read 
                        ? "text-foreground font-semibold" 
                        : "text-muted-foreground font-medium"
                    }`}>
                      {notification.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getNotificationBadge(notification.notification_type)}
                      {!notification.is_read && (
                        <Badge 
                          variant="default" 
                          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-md transition-all duration-300 font-medium"
                        >
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            New
                          </div>
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground transition-colors duration-200">
                    {format(new Date(notification.created_at), "PPp")}
                  </CardDescription>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {!notification.is_read && (
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors duration-200"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors duration-200"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-4 pb-4 pt-2">
            <p className="text-sm text-muted-foreground group-hover:text-foreground leading-relaxed transition-colors duration-200">
              {notification.message}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const LoadingNotificationCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const unreadCount = notifications.filter(n => !n.is_read).length
  const totalCount = notifications.length

  return (
    <motion.div 
      className="container mx-auto py-8 px-4 max-w-5xl"
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
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Bell className="h-6 w-6 text-primary" />
              </motion.div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge 
                  variant="default" 
                  className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg animate-bounce"
                >
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground/90 text-lg">
              {totalCount === 0 
                ? "No notifications yet" 
                : `${totalCount} notification${totalCount > 1 ? 's' : ''} total ${unreadCount > 0 ? `• ${unreadCount} unread` : ''}`
              }
            </p>
          </div>
          
          {/* Action Buttons */}
          {notifications.length > 0 && (
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
      {notifications.length > 0 && (
        <motion.div 
          variants={headerVariants}
          className="mb-6 p-4 bg-card/50 backdrop-blur-sm border rounded-xl shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/60 border-primary/20 focus:border-primary/40 transition-colors duration-200"
              />
            </div>
            
            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-background/60 border-primary/20 focus:border-primary/40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Read Status Filter */}
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="bg-background/60 border-primary/20 focus:border-primary/40">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="unread">Unread only</SelectItem>
                <SelectItem value="read">Read only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

      {/* Enhanced Content Area */}
      <motion.div variants={headerVariants}>
        <Card className="border shadow-lg bg-white dark:bg-gradient-to-br dark:from-card dark:via-card dark:to-card/95 backdrop-blur-sm">
          <ScrollArea className="h-[600px]">
            <CardContent className="p-6">
              {loading ? (
                <motion.div 
                  className="space-y-4"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {[...Array(4)].map((_, i) => (
                    <LoadingNotificationCard key={i} />
                  ))}
                </motion.div>
              ) : filteredNotifications.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {filteredNotifications.map((notification) => (
                      <NotificationCard key={notification.id} notification={notification} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="inline-block p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full mb-6"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Bell className="h-12 w-12 text-primary/60" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground/90">
                    {searchTerm || filterType !== "all" || filterRead !== "all" 
                      ? "No matching notifications" 
                      : "No notifications yet"
                    }
                  </h3>
                  <p className="text-muted-foreground/80 text-lg">
                    {searchTerm || filterType !== "all" || filterRead !== "all"
                      ? "Try adjusting your search or filters"
                      : "You're all caught up! Check back later for new updates."
                    }
                  </p>
                  {(searchTerm || filterType !== "all" || filterRead !== "all") && (
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
                          setFilterType("all")
                          setFilterRead("all")
                        }}
                        className="transition-all duration-200"
                      >
                        Clear filters
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </motion.div>
    </motion.div>
  )
}