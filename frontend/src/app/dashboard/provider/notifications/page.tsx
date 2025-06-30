"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Clock, User } from "lucide-react"

export default function ProviderNotifications() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="outline">Mark all as read</Button>
      </div>

      <div className="space-y-4">
        {/* Booking Request */}
        <Card className="p-4 hover:bg-accent/5 transition-colors cursor-pointer">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">New Booking Request</h3>
                <Badge>New</Badge>
              </div>
              <p className="text-muted-foreground">
                You have a new booking request from Sarah Smith for House Cleaning service.
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  2 hours ago
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm">Accept</Button>
                <Button size="sm" variant="outline">Decline</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Review Notification */}
        <Card className="p-4 hover:bg-accent/5 transition-colors cursor-pointer">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">New Review</h3>
                <span className="text-sm text-muted-foreground">1 day ago</span>
              </div>
              <p className="text-muted-foreground">
                John Doe left a 5-star review for your Deep Cleaning service.
              </p>
            </div>
          </div>
        </Card>

        {/* System Notification */}
        <Card className="p-4 hover:bg-accent/5 transition-colors cursor-pointer">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">System Update</h3>
                <span className="text-sm text-muted-foreground">2 days ago</span>
              </div>
              <p className="text-muted-foreground">
                We've updated our service provider guidelines. Please review the changes.
              </p>
              <Button variant="link" className="mt-2 h-auto p-0">
                Read More
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 