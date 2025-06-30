"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Clock, Users, AlertTriangle, Settings } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/services/api"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: number
  title: string
  message: string
  notification_type: "user" | "service" | "booking" | "system" | "report" | "alert"
  severity: "low" | "medium" | "high"
  is_read: boolean
  created_at: string
  related_id?: number
}

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<Notification["notification_type"] | "all">("all")

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get("/admin/notifications/")
      setNotifications(response.data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notifications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/admin/notifications/${id}/mark_as_read/`)
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ))
      toast({
        title: "Success",
        description: "Notification marked as read"
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
      await api.patch("/admin/notifications/mark_all_as_read/")
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })))
      toast({
        title: "Success",
        description: "All notifications marked as read"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/admin/notifications/${id}/`)
      setNotifications(notifications.filter(n => n.id !== id))
      toast({
        title: "Success",
        description: "Notification deleted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive"
      })
    }
  }

  const getNotificationIcon = (type: Notification["notification_type"]) => {
    switch (type) {
      case "user":
        return <Users className="h-4 w-4" />
      case "booking":
        return <Clock className="h-4 w-4" />
      case "service":
        return <Settings className="h-4 w-4" />
      case "report":
        return <Check className="h-4 w-4" />
      case "alert":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: Notification["severity"]) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card className={`mb-4 ${!notification.is_read ? "border-primary" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${!notification.is_read ? "bg-primary/10" : "bg-muted"}`}>
              {getNotificationIcon(notification.notification_type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{notification.title}</CardTitle>
                <Badge variant="outline" className={getSeverityColor(notification.severity)}>
                  {notification.severity}
                </Badge>
              </div>
              <CardDescription>
                {format(new Date(notification.created_at), "PPp")}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {!notification.is_read && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => markAsRead(notification.id)}
              >
                Mark as read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => deleteNotification(notification.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{notification.message}</p>
      </CardContent>
    </Card>
  )

  const LoadingNotificationCard = () => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  )

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => n.notification_type === filter)

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "user" ? "default" : "outline"}
          onClick={() => setFilter("user")}
        >
          Users
        </Button>
        <Button
          variant={filter === "service" ? "default" : "outline"}
          onClick={() => setFilter("service")}
        >
          Services
        </Button>
        <Button
          variant={filter === "booking" ? "default" : "outline"}
          onClick={() => setFilter("booking")}
        >
          Bookings
        </Button>
        <Button
          variant={filter === "report" ? "default" : "outline"}
          onClick={() => setFilter("report")}
        >
          Reports
        </Button>
        <Button
          variant={filter === "alert" ? "default" : "outline"}
          onClick={() => setFilter("alert")}
        >
          Alerts
        </Button>
      </div>

      <div>
        {loading ? (
          Array(3).fill(0).map((_, i) => <LoadingNotificationCard key={i} />)
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardDescription>No notifications</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
} 