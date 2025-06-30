"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Clock,
  Calendar as CalendarIcon,
  Sun,
  Moon,
  Plane,
  Plus
} from "lucide-react"

export default function ScheduleManagement() {
  const date = new Date()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schedule & Availability</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plane className="h-4 w-4 mr-2" />
            Vacation Mode
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Block Time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Calendar</h2>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Available
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Booked
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Blocked
              </Badge>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={date}
            className="rounded-md border"
          />
        </Card>

        {/* Working Hours */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Working Hours</h2>
          <div className="space-y-6">
            {/* Weekly Schedule */}
            <div className="space-y-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch id={day} />
                    <Label htmlFor={day}>{day}</Label>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Input
                      type="time"
                      className="w-24"
                      defaultValue="09:00"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      className="w-24"
                      defaultValue="17:00"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Break Time */}
            <div>
              <h3 className="text-sm font-medium mb-2">Break Time</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-24"
                  defaultValue="13:00"
                />
                <span>to</span>
                <Input
                  type="time"
                  className="w-24"
                  defaultValue="14:00"
                />
              </div>
            </div>

            {/* Time Slot Duration */}
            <div>
              <h3 className="text-sm font-medium mb-2">Time Slot Duration</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  defaultValue="60"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Sun className="h-4 w-4 mr-2" />
                Copy Weekday Hours
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Moon className="h-4 w-4 mr-2" />
                Copy Weekend Hours
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Reset to Default Hours
              </Button>
            </div>

            <Button className="w-full">Save Changes</Button>
          </div>
        </Card>

        {/* Upcoming Blocked Times */}
        <Card className="lg:col-span-3 p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Blocked Times</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Personal Time Off</h3>
                  <p className="text-sm text-muted-foreground">March 15, 2024 - March 20, 2024</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Remove</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Plane className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Vacation</h3>
                  <p className="text-sm text-muted-foreground">April 1, 2024 - April 7, 2024</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Remove</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 