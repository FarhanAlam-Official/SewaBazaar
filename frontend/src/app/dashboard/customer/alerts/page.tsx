"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Clock, Info, AlertTriangle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Alert {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  timestamp: string
  isRead: boolean
}

export default function AlertsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      setAlerts([
        {
          id: "1",
          title: "Booking Confirmed",
          message: "Your booking for Home Cleaning has been confirmed for tomorrow at 2 PM.",
          type: "success",
          timestamp: "2024-03-15T14:00:00Z",
          isRead: false,
        },
        {
          id: "2",
          title: "Payment Due",
          message: "Payment for your last service booking is due in 2 days.",
          type: "warning",
          timestamp: "2024-03-14T10:00:00Z",
          isRead: false,
        },
        {
          id: "3",
          title: "Special Offer",
          message: "Get 20% off on your next booking! Valid for 24 hours only.",
          type: "info",
          timestamp: "2024-03-13T09:00:00Z",
          isRead: true,
        },
        {
          id: "4",
          title: "Booking Cancelled",
          message: "Your booking for Plumbing Service has been cancelled by the provider.",
          type: "error",
          timestamp: "2024-03-12T16:00:00Z",
          isRead: true,
        },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "success":
        return <Check className="h-5 w-5 text-green-500" />
      case "error":
        return <X className="h-5 w-5 text-red-500" />
    }
  }

  const getAlertBadge = (type: Alert["type"]) => {
    switch (type) {
      case "info":
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Info</Badge>
      case "warning":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Warning</Badge>
      case "success":
        return <Badge variant="outline" className="text-green-500 border-green-500">Success</Badge>
      case "error":
        return <Badge variant="outline" className="text-red-500 border-red-500">Error</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ))
  }

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !alert.isRead
    return alert.type === activeTab
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAlerts(alerts.map(alert => ({ ...alert, isRead: true })))}
            >
              Mark all as read
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="warning">Warnings</TabsTrigger>
              <TabsTrigger value="success">Success</TabsTrigger>
              <TabsTrigger value="error">Errors</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4">
                  {filteredAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Bell className="h-12 w-12 mb-4 opacity-20" />
                      <p>No alerts to display</p>
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <Card key={alert.id} className={alert.isRead ? "opacity-70" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1">{getAlertIcon(alert.type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{alert.title}</h4>
                                  {getAlertBadge(alert.type)}
                                  {!alert.isRead && (
                                    <Badge variant="default" className="bg-primary">New</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {formatTimestamp(alert.timestamp)}
                                  </span>
                                  {!alert.isRead && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => markAsRead(alert.id)}
                                    >
                                      Mark as read
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-muted-foreground">{alert.message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 