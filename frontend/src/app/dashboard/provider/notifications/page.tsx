"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  MessageSquare
} from "lucide-react"
import { useProviderNotifications } from '@/hooks/useProviderNotifications'
import { formatDistanceToNow } from 'date-fns'

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

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
      case 'booking_update':
        return <Calendar className="h-5 w-5 text-primary" />
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'system':
        return <Bell className="h-5 w-5 text-blue-500" />
      case 'reminder':
        return <Clock className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
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
      toast({
        title: "Notification Deleted",
        description: "Notification has been deleted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete notification",
        variant: "destructive"
      })
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast({
        title: "All Marked as Read",
        description: "All notifications have been marked as read"
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to mark notifications as read",
        variant: "destructive"
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading notifications...</span>
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
          <Button onClick={refreshNotifications}>
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
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
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
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="booking">Bookings</TabsTrigger>
          <TabsTrigger value="review">Reviews</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`p-4 hover:bg-accent/5 transition-colors cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && <Badge variant="default">New</Badge>}
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Trash2 className="h-3 w-3" />
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
                        </div>
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                      
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
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll see notifications for bookings, reviews, and updates here
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread">
          <div className="space-y-4">
            {notifications.filter(n => !n.is_read).length > 0 ? (
              notifications.filter(n => !n.is_read).map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`p-4 hover:bg-accent/5 transition-colors cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} bg-blue-50/50`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">New</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No unread notifications
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="booking">
          <div className="space-y-4">
            {notifications.filter(n => n.type.includes('booking')).map((notification) => (
              <Card 
                key={notification.id} 
                className={`p-4 hover:bg-accent/5 transition-colors cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && <Badge variant="default">New</Badge>}
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review">
          <div className="space-y-4">
            {notifications.filter(n => n.type === 'review').map((notification) => (
              <Card 
                key={notification.id} 
                className={`p-4 hover:bg-accent/5 transition-colors cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && <Badge variant="default">New</Badge>}
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-4">
            {notifications.filter(n => n.type === 'system').map((notification) => (
              <Card 
                key={notification.id} 
                className={`p-4 hover:bg-accent/5 transition-colors cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && <Badge variant="default">New</Badge>}
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 