"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, MapPin, Calendar as CalendarIcon, X } from "lucide-react"

// Temporary mock data
const MOCK_UPCOMING_SERVICES = [
  {
    id: "1",
    name: "House Cleaning",
    provider: "CleanPro Services",
    date: "2024-03-25",
    time: "14:00",
    location: "Kathmandu",
    status: "confirmed"
  },
  // Add more services...
]

interface ServiceEvent {
  id: string
  name: string
  provider: string
  date: string
  time: string
  location: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedService, setSelectedService] = useState<ServiceEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date)
    // In the future, fetch services for the selected date
  }

  const handleReschedule = (serviceId: string) => {
    // Handle reschedule logic
    console.log("Rescheduling service:", serviceId)
  }

  const handleCancel = (serviceId: string) => {
    // Handle cancellation logic
    console.log("Cancelling service:", serviceId)
  }

  const handleAddToCalendar = (service: ServiceEvent) => {
    // Handle adding to calendar logic
    console.log("Adding to calendar:", service)
  }

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_UPCOMING_SERVICES.map((service) => (
                  <Card key={service.id} className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setSelectedService(service)
                      setIsDialogOpen(true)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{service.name}</h3>
                          <span className="text-sm text-muted-foreground capitalize">
                            {service.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.provider}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{service.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{service.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{service.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{selectedService.name}</h3>
                <p className="text-muted-foreground">{selectedService.provider}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{selectedService.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedService.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedService.location}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddToCalendar(selectedService)}
                >
                  Add to Calendar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReschedule(selectedService.id)}
                >
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleCancel(selectedService.id)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 