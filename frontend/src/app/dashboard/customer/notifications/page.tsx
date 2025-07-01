"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Clock, Package, CreditCard, AlertTriangle, X } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import api from "@/services/api"

interface Notification {
  id: number
  title: string
  message: string
  notification_type: "booking" | "review" | "system" | "payment"
  is_read: boolean
  created_at: string
  related_id?: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function CustomerNotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setTimeout(() => {
        const mockNotifications: Notification[] = [
          {
            id: 1,
            title: "Booking Confirmed",
            message: "Your booking for Home Cleaning has been confirmed for tomorrow at 2 PM. Our professional cleaner will arrive on time.",
            notification_type: "booking",
            is_read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            title: "New Review Request",
            message: "How was your experience with our Plumbing Service? Your feedback helps us improve our service quality.",
            notification_type: "review",
            is_read: false,
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 3,
            title: "Payment Successful",
            message: "Your payment of ₹2,500 for Electrical Service has been processed successfully. Thank you for using our service!",
            notification_type: "payment",
            is_read: true,
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: 4,
            title: "Service Update",
            message: "Your AC Repair service provider is on the way. Track their location in real-time.",
            notification_type: "system",
            is_read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ]
        setNotifications(mockNotifications)
        setLoading(false)
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notifications",
        variant: "destructive"
      })
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ))
      toast({
        title: "Success",
        description: "Notification marked as read ✓",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })))
      toast({
        title: "Success",
        description: "All notifications marked as read ✓",
        variant: "default"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }

  const getNotificationIcon = (type: Notification["notification_type"]) => {
    switch (type) {
      case "booking":
        return <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
      case "review":
        return <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-purple-500 dark:text-purple-400" />
      case "system":
        return <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
      default:
        return <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
    }
  }

  const getNotificationBadge = (type: Notification["notification_type"]) => {
    switch (type) {
      case "booking":
        return <Badge variant="outline" className="text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400">Booking</Badge>
      case "review":
        return <Badge variant="outline" className="text-green-500 dark:text-green-400 border-green-500 dark:border-green-400">Review</Badge>
      case "payment":
        return <Badge variant="outline" className="text-purple-500 dark:text-purple-400 border-purple-500 dark:border-purple-400">Payment</Badge>
      case "system":
        return <Badge variant="outline" className="text-orange-500 dark:text-orange-400 border-orange-500 dark:border-orange-400">System</Badge>
      default:
        return <Badge variant="outline">Notification</Badge>
    }
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <motion.div variants={item}>
      <Card className={`mb-4 group transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/5 ${
        !notification.is_read 
          ? "border-primary/50 bg-primary/[0.02] dark:bg-primary/[0.02] dark:border-primary/30" 
          : "dark:bg-gray-900/50"
      }`}>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start space-x-4">
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-full transition-colors duration-200 ${
                !notification.is_read 
                  ? "bg-primary/10 group-hover:bg-primary/20 dark:bg-primary/5 dark:group-hover:bg-primary/10" 
                  : "bg-muted group-hover:bg-muted/70 dark:bg-gray-800 dark:group-hover:bg-gray-700"
              }`}>
                {getNotificationIcon(notification.notification_type)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg font-semibold dark:text-white/90">
                    {notification.title}
                  </CardTitle>
                  {getNotificationBadge(notification.notification_type)}
                  {!notification.is_read && (
                    <Badge variant="default" className="bg-primary/90 dark:bg-primary/80 animate-pulse">
                      New
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm dark:text-gray-400">
                  {format(new Date(notification.created_at), "PPp")}
                </CardDescription>
              </div>
            </div>
            {!notification.is_read && (
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 dark:hover:bg-gray-800"
                onClick={() => markAsRead(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardContent className="pt-4">
            <p className="text-muted-foreground/90 dark:text-gray-300">
              {notification.message}
            </p>
          </CardContent>
        </CardHeader>
      </Card>
    </motion.div>
  )

  const LoadingNotificationCard = () => (
    <Card className="mb-4">
      <CardHeader className="p-4">
        <div className="flex items-start space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  )

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary/90 to-primary/50 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-muted-foreground/90 mt-1">
            Stay updated with your service bookings and activities
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="dark:bg-gray-900/50">
        <ScrollArea className="h-[600px]">
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <LoadingNotificationCard key={i} />
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {notifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 dark:text-white/90">No notifications</h3>
                <p className="text-muted-foreground/80">
                  You're all caught up! Check back later for new updates.
                </p>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  )
} 