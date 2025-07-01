"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CalendarDays, ChevronLeft, ChevronRight, Filter } from "lucide-react"

interface BookingEvent {
  id: string
  title: string
  customerName: string
  providerName: string
  service: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  time: string
  date: string
}

// Mock data - TODO: Replace with API integration
const mockBookings: BookingEvent[] = [
  {
    id: "BK001",
    title: "House Cleaning Service",
    customerName: "John Doe",
    providerName: "CleanPro Services",
    service: "Deep Cleaning",
    status: "confirmed",
    time: "10:00 AM",
    date: "2024-03-20",
  },
  {
    id: "BK002",
    title: "Plumbing Repair",
    customerName: "Jane Smith",
    providerName: "Quick Fix Plumbing",
    service: "Pipe Repair",
    status: "pending",
    time: "2:00 PM",
    date: "2024-03-20",
  },
]

export default function BookingsCalendarPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")

  // Get events for the selected date
  const getEventsForDate = (date: Date) => {
    return mockBookings.filter(booking => booking.date === date.toISOString().split("T")[0])
  }

  const selectedDateEvents = getEventsForDate(date)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bookings Calendar</h2>
          <p className="text-muted-foreground">View and manage bookings in calendar view</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
            >
              Day
            </Button>
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr,300px]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {date.toLocaleString("default", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(date)
                    newDate.setMonth(date.getMonth() - 1)
                    setDate(newDate)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newDate = new Date(date)
                    newDate.setMonth(date.getMonth() + 1)
                    setDate(newDate)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <span>
                {date.toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDateEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No bookings for this date
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-3 rounded-lg border"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{event.title}</p>
                        <Badge
                          variant={
                            event.status === "confirmed"
                              ? "success"
                              : event.status === "pending"
                              ? "warning"
                              : event.status === "completed"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.providerName}
                      </p>
                      <p className="text-sm font-medium">{event.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="hidden">View Details</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* TODO: Add booking details view */}
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 