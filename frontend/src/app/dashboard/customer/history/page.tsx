"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon, Download,Clock,MapPin,Star } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { customerApi, CustomerBooking } from "@/services/customer.api"
import Link from "next/link"

interface CompletedBooking {
  id: number
  service: {
    id: number
    title: string
    image?: string
    category?: {
      title: string
    }
  }
  provider?: {
    business_name?: string
    first_name?: string
    last_name?: string
  }
  booking_date: string
  booking_time: string
  address: string
  city: string
  total_amount: number
  status: string
  rating?: number
  created_at: string
}

// Transform CustomerBooking to CompletedBooking interface
const transformToCompletedBooking = (customerBooking: CustomerBooking): CompletedBooking => {
  return {
    id: customerBooking.id,
    service: {
      id: customerBooking.id, // Using booking ID as service ID since it's not provided
      title: customerBooking.service,
      image: customerBooking.image,
      category: undefined // Not provided in CustomerBooking
    },
    provider: {
      business_name: customerBooking.provider,
      first_name: undefined,
      last_name: undefined
    },
    booking_date: customerBooking.date,
    booking_time: customerBooking.time,
    address: customerBooking.location,
    city: '', // Not provided in CustomerBooking
    total_amount: customerBooking.price,
    status: customerBooking.status,
    rating: customerBooking.rating,
    created_at: customerBooking.date // Using date as created_at since it's not provided
  }
}

export default function ServiceHistoryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<CompletedBooking[]>([])
  const [date, setDate] = useState<Date>()
  const [serviceType, setServiceType] = useState<string>("all-types")
  const [provider, setProvider] = useState<string>("all-providers")

  useEffect(() => {
    loadServiceHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [completedBookings, date, serviceType, provider])

  const loadServiceHistory = async () => {
    try {
      setLoading(true)
      // Get all bookings and use only the completed ones
      const bookingsData = await customerApi.getBookings()
      const completedBookings = bookingsData.completed.map(transformToCompletedBooking)
      setCompletedBookings(completedBookings)
      setFilteredBookings(completedBookings)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load service history",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...completedBookings]

    // Filter by date
    if (date) {
      const selectedDate = format(date, "yyyy-MM-dd")
      filtered = filtered.filter(booking => booking.booking_date === selectedDate)
    }

    // Filter by service type (category)
    if (serviceType && serviceType !== "all-types") {
      filtered = filtered.filter(booking => 
        booking.service.category?.title.toLowerCase().includes(serviceType.toLowerCase())
      )
    }

    // Filter by provider
    if (provider && provider !== "all-providers") {
      filtered = filtered.filter(booking => {
        const providerName = booking.provider?.business_name || 
          `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim()
        return providerName.toLowerCase().includes(provider.toLowerCase())
      })
    }

    setFilteredBookings(filtered)
  }

  const handleRebook = (booking: CompletedBooking) => {
    // Navigate to service booking page with pre-filled data
    window.location.href = `/services/${booking.service.id}?rebook=true`
  }

  const handleDownloadInvoice = (bookingId: number) => {
    // TODO: Implement invoice download when backend supports it
    toast({
      title: "Feature Coming Soon",
      description: "Invoice download will be available in the next update",
      variant: "default"
    })
  }

  const getUniqueServiceTypes = () => {
    const types = completedBookings
      .map(booking => booking.service.category?.title)
      .filter(Boolean)
    return Array.from(new Set(types))
  }

  const getUniqueProviders = () => {
    const providers = completedBookings
      .map(booking => {
        return booking.provider?.business_name || 
          `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim()
      })
      .filter(Boolean)
    return Array.from(new Set(providers))
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
                <SelectItem value="all-types">All Types</SelectItem>
                {getUniqueServiceTypes().map((type) => (
                  <SelectItem key={type} value={type!}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-providers">All Providers</SelectItem>
                {getUniqueProviders().map((providerName) => (
                  <SelectItem key={providerName} value={providerName!}>{providerName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(date || serviceType !== "all-types" || provider !== "all-providers") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setDate(undefined)
                  setServiceType("all-types")
                  setProvider("all-providers")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => {
            const providerName = booking.provider?.business_name || 
              `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim() || 'Unknown Provider'
            
            return (
              <Card key={booking.id} className="relative">
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full">
                    <Image
                      src={booking.service.image || "/placeholder.svg"}
                      alt={booking.service.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      onClick={() => handleDownloadInvoice(booking.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.service.title}</h3>
                      <p className="text-sm text-muted-foreground">{providerName}</p>
                      {booking.service.category && (
                        <Badge variant="outline" className="mt-1">
                          {booking.service.category.title}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(booking.booking_date), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.booking_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.address}, {booking.city}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm">
                          {booking.rating ? booking.rating.toFixed(1) : 'Not rated'}
                        </span>
                      </div>
                      <div className="font-semibold">Rs. {booking.total_amount}</div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1"
                        onClick={() => handleRebook(booking)}
                      >
                        Book Again
                      </Button>
                      <Link href={`/dashboard/customer/reviews?booking=${booking.id}`}>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Service History Found</h3>
                <p className="text-muted-foreground">
                  {date || serviceType || provider 
                    ? "No services match your current filters. Try adjusting your search criteria."
                    : "You haven't completed any services yet. Book a service to see your history here."}
                </p>
              </div>
              <Link href="/services">
                <Button>Browse Services</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 