"use client"

import { useState, useMemo } from "react"
import { showToast } from "@/components/ui/enhanced-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Bell, 
  Calendar, 
  Clock, 
  User, 
  Star,
  DollarSign,
  Settings,
  Trash2,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Mail,
  Smartphone,
  MessageSquare,
  Search,
  Filter,
  CheckCheck,
  Archive
} from "lucide-react"
import { useProviderNotifications } from '@/hooks/useProviderNotifications'
import { formatDistanceToNow, format } from 'date-fns'
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

// Import the notification type from the hook
type ProviderNotification = {
  id: number
  type: 'booking_request' | 'booking_update' | 'review' | 'payment' | 'system' | 'reminder'
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
  action_required: boolean
  action_url?: string
  priority: 'low' | 'medium' | 'high'
}

type NotificationPreferences = {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  booking_requests: boolean
  booking_updates: boolean
  payment_notifications: boolean
  review_notifications: boolean
  system_notifications: boolean
  marketing_notifications: boolean
  reminder_notifications: boolean
}

// Animation variants
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

export default function ProviderNotifications() {
  const { toast } = useToast()
  const {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refreshNotifications
  } = useProviderNotifications()

  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false)
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
        return notification.type === filterType
      })
      .filter(notification => {
        if (filterRead === "all") return true
        if (filterRead === "read") return notification.is_read
        if (filterRead === "unread") return !notification.is_read
        return true
      })
  }, [notifications, searchTerm, filterType, filterRead])

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
      case 'booking_update':
        return <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'review':
        return <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'system':
        return <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      case 'reminder':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'booking_request':
      case 'booking_update':
        return <Badge variant="outline" className="text-blue-700 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-950/20 font-medium">Booking</Badge>
      case 'review':
        return <Badge variant="outline" className="text-purple-700 dark:text-purple-400 border-purple-500 bg-purple-50 dark:bg-purple-950/20 font-medium">Review</Badge>
      case 'payment':
        return <Badge variant="outline" className="text-green-700 dark:text-green-400 border-green-500 bg-green-50 dark:bg-green-950/20 font-medium">Payment</Badge>
      case 'system':
        return <Badge variant="outline" className="text-orange-700 dark:text-orange-400 border-orange-500 bg-orange-50 dark:bg-orange-950/20 font-medium">System</Badge>
      case 'reminder':
        return <Badge variant="outline" className="text-yellow-700 dark:text-yellow-400 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 font-medium">Reminder</Badge>
      default:
        return <Badge variant="outline" className="font-medium">Notification</Badge>
    }
  }

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'booking_request':
      case 'booking_update':
        return { 
          border: "border-l-blue-500 dark:border-l-blue-400",
          background: "bg-blue-50 dark:bg-blue-950/20",
          hoverBackground: "hover:bg-blue-100/50 dark:hover:bg-blue-950/30"
        }
      case 'review':
        return { 
          border: "border-l-purple-500 dark:border-l-purple-400",
          background: "bg-purple-50 dark:bg-purple-950/20",
          hoverBackground: "hover:bg-purple-100/50 dark:hover:bg-purple-950/30"
        }
      case 'payment':
        return { 
          border: "border-l-green-500 dark:border-l-green-400",
          background: "bg-green-50 dark:bg-green-950/20",
          hoverBackground: "hover:bg-green-100/50 dark:hover:bg-green-950/30"
        }
      case 'system':
        return { 
          border: "border-l-orange-500 dark:border-l-orange-400",
          background: "bg-orange-50 dark:bg-orange-950/20",
          hoverBackground: "hover:bg-orange-100/50 dark:hover:bg-orange-950/30"
        }
      case 'reminder':
        return { 
          border: "border-l-yellow-500 dark:border-l-yellow-400",
          background: "bg-yellow-50 dark:bg-yellow-950/20",
          hoverBackground: "hover:bg-yellow-100/50 dark:hover:bg-yellow-950/30"
        }
      default:
        return { 
          border: "border-l-gray-500 dark:border-l-gray-400",
          background: "bg-gray-50 dark:bg-gray-950/20",
          hoverBackground: "hover:bg-gray-100/50 dark:hover:bg-gray-950/30"
        }
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      default:
        return 'border-l-blue-500'
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: ProviderNotification) => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Handle action URL if present
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId)
      showToast.success({
        title: "Notification Deleted",
        description: "Notification has been deleted successfully"
      })
    } catch (error: any) {
      showToast.error({
        title: "Delete Failed",
        description: error.message || "Failed to delete notification. Please try again."
      })
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      showToast.success({
        title: "All Marked as Read",
        description: "All notifications have been marked as read"
      })
    } catch (error: any) {
      showToast.error({
        title: "Update Failed",
        description: error.message || "Failed to mark notifications as read. Please try again."
      })
    }
  }

  // Handle clear all read
  const handleClearAllRead = async () => {
    try {
      // Filter read notifications
      const readNotifications = notifications.filter(n => n.is_read)
      if (readNotifications.length === 0) {
        showToast.info({
          title: "No Read Notifications",
          description: "There are no read notifications to clear"
        })
        return
      }

      // Delete all read notifications one by one
      const deletePromises = readNotifications.map(notification => 
        deleteNotification(notification.id)
      )
      
      await Promise.all(deletePromises)

      showToast.success({
        title: "Read Notifications Cleared",
        description: `Successfully cleared ${readNotifications.length} read notifications`
      })
    } catch (error: any) {
      showToast.error({
        title: "Clear Failed",
        description: error.message || "Failed to clear read notifications. Please try again."
      })
    }
  }

  // Handle preference update
  const handlePreferenceUpdate = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    try {
      setIsUpdatingPreferences(true)
      await updatePreferences({ [key]: value })
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been updated"
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update preferences",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingPreferences(false)
    }
  }

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "PPp")
  }

  if (error) {
    return (
      <motion.div 
        className="container mx-auto py-8 px-4 max-w-5xl"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Unable to Load Notifications</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={refreshNotifications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  const NotificationCard = ({ notification }: { notification: ProviderNotification }) => {
    const colors = getNotificationColors(notification.type)
    
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
                  {getNotificationIcon(notification.type)}
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
                      {getNotificationBadge(notification.type)}
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
                    {formatDate(notification.created_at)}
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this notification? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </motion.div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-4 pb-4 pt-2">
            <p className="text-sm text-muted-foreground group-hover:text-foreground leading-relaxed transition-colors duration-200">
              {notification.message}
            </p>
            
            {notification.action_required && notification.type === 'booking_request' && (
              <div className="flex gap-2 mt-4">
                <Button size="sm">
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="outline">
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}
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
                    onClick={handleMarkAllAsRead}
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
                  onClick={handleClearAllRead}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Clear read
                </Button>
              </motion.div>
              <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
                <DialogTrigger asChild>
                  <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Notification Preferences</DialogTitle>
                    <DialogDescription>
                      Configure how you want to receive notifications
                    </DialogDescription>
                  </DialogHeader>
                  
                  {preferences && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Delivery Methods</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <Label>Email Notifications</Label>
                            </div>
                            <Switch
                              checked={preferences.email_notifications}
                              onCheckedChange={(checked) => handlePreferenceUpdate('email_notifications', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              <Label>Push Notifications</Label>
                            </div>
                            <Switch
                              checked={preferences.push_notifications}
                              onCheckedChange={(checked) => handlePreferenceUpdate('push_notifications', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              <Label>SMS Notifications</Label>
                            </div>
                            <Switch
                              checked={preferences.sms_notifications}
                              onCheckedChange={(checked) => handlePreferenceUpdate('sms_notifications', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Notification Types</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Booking Requests</Label>
                            <Switch
                              checked={preferences.booking_requests}
                              onCheckedChange={(checked) => handlePreferenceUpdate('booking_requests', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Booking Updates</Label>
                            <Switch
                              checked={preferences.booking_updates}
                              onCheckedChange={(checked) => handlePreferenceUpdate('booking_updates', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Payment Notifications</Label>
                            <Switch
                              checked={preferences.payment_notifications}
                              onCheckedChange={(checked) => handlePreferenceUpdate('payment_notifications', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Review Notifications</Label>
                            <Switch
                              checked={preferences.review_notifications}
                              onCheckedChange={(checked) => handlePreferenceUpdate('review_notifications', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>System Notifications</Label>
                            <Switch
                              checked={preferences.system_notifications}
                              onCheckedChange={(checked) => handlePreferenceUpdate('system_notifications', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Reminder Notifications</Label>
                            <Switch
                              checked={preferences.reminder_notifications}
                              onCheckedChange={(checked) => handlePreferenceUpdate('reminder_notifications', checked)}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPreferencesOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Refresh button as icon only, placed after settings button */}
              <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshNotifications}
                  className="p-2"
                >
                  <RefreshCw className="h-4 w-4" />
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
                <SelectItem value="booking_request">Booking Request</SelectItem>
                <SelectItem value="booking_update">Booking Update</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
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