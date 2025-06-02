"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Clock } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/services/api"

interface Notification {
  id: number
  title: string
  message: string
  notification_type: "booking" | "review" | "system" | "payment"
  is_read: boolean
  created_at: string
  related_id?: number
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
      const response = await api.get("/notifications/")
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
      await api.patch(`/notifications/${id}/mark_as_read/`)
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
      await api.patch("/notifications/mark_all_as_read/")
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

  const getNotificationIcon = (type: Notification["notification_type"]) => {
    switch (type) {
      case "booking":
        return <Clock className="h-4 w-4" />
      case "review":
        return <Check className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
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
              <CardTitle className="text-lg">{notification.title}</CardTitle>
              <CardDescription>
                {format(new Date(notification.created_at), "PPp")}
              </CardDescription>
            </div>
          </div>
          {!notification.is_read && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAsRead(notification.id)}
            >
              Mark as read
            </Button>
          )}
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
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div>
        {loading ? (
          Array(3).fill(0).map((_, i) => <LoadingNotificationCard key={i} />)
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
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