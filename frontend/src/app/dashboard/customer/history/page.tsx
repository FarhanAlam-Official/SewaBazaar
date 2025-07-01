"use client"

import { useState } from "react"
import { ServiceCard } from "@/components/services/ServiceCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download } from "lucide-react"
import { format } from "date-fns"

// Temporary mock data - will be replaced with API calls
const MOCK_SERVICES = [
  {
    id: "1",
    name: "House Cleaning",
    provider: "CleanPro Services",
    image: "/placeholder.jpg",
    rating: 4.5,
    price: 2500,
    date: "2024-03-15",
    time: "14:00",
    location: "Kathmandu",
    status: "completed"
  },
  // Add more mock services...
]

export default function ServiceHistoryPage() {
  const [date, setDate] = useState<Date>()
  const [serviceType, setServiceType] = useState<string>("")
  const [provider, setProvider] = useState<string>("")

  const handleRebook = (serviceId: string) => {
    // Handle rebooking logic
    console.log("Rebooking service:", serviceId)
  }

  const handleDownloadInvoice = (serviceId: string) => {
    // Handle invoice download logic
    console.log("Downloading invoice for:", serviceId)
  }

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full md:w-[240px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cleanpro">CleanPro Services</SelectItem>
                <SelectItem value="handyman">Handyman Pro</SelectItem>
                <SelectItem value="maintenance">Maintenance Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SERVICES.map((service) => (
          <div key={service.id} className="relative">
            <ServiceCard
              service={service}
              variant="history"
              onAction={handleRebook}
              actionLabel="Rebook"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => handleDownloadInvoice(service.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 