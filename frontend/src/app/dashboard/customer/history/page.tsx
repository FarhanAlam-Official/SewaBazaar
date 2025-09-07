"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { 
  CalendarIcon, 
  Download,
  Clock,
  MapPin,
  Star,
  Filter,
  Search,
  BookOpen,
  UserCheck,
  Tag,
  TrendingUp,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { customerApi, CustomerBooking } from "@/services/customer.api"
import Link from "next/link"

/**
 * Interface for completed booking data structure
 * Enhanced with better typing and additional fields for improved UI
 */
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
    id?: number
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

/**
 * Mock data for testing the UI when no real data is available
 * This helps visualize the component design without actual bookings
 */
const MOCK_BOOKINGS: CompletedBooking[] = [
  {
    id: 1001,
    service: {
      id: 1,
      title: "Plumbing Service",
      image: "/placeholder.svg",
      category: { title: "Home Services" }
    },
    provider: {
      business_name: "ABC Plumbing Experts",
      first_name: "John",
      last_name: "Doe",
      id: 101
    },
    booking_date: "2024-05-15",
    booking_time: "10:00",
    address: "Kathmandu",
    city: "Kathmandu",
    total_amount: 1500,
    status: "completed",
    rating: 4.5,
    created_at: "2024-05-15"
  },
  {
    id: 1002,
    service: {
      id: 2,
      title: "Electrician Service",
      image: "/placeholder.svg",
      category: { title: "Home Services" }
    },
    provider: {
      business_name: "XYZ Electric Solutions",
      first_name: "Ram",
      last_name: "Thapa",
      id: 102
    },
    booking_date: "2024-04-22",
    booking_time: "14:30",
    address: "Lalitpur",
    city: "Lalitpur",
    total_amount: 2200,
    status: "completed",
    rating: 5,
    created_at: "2024-04-22"
  },
  {
    id: 1003,
    service: {
      id: 3,
      title: "Haircut & Styling",
      image: "/placeholder.svg",
      category: { title: "Beauty Services" }
    },
    provider: {
      business_name: "Glamour Salon",
      first_name: "Sita",
      last_name: "K.C.",
      id: 103
    },
    booking_date: "2024-03-10",
    booking_time: "11:00",
    address: "Bhaktapur",
    city: "Bhaktapur",
    total_amount: 800,
    status: "completed",
    rating: 4,
    created_at: "2024-03-10"
  }
]

/**
 * Transform CustomerBooking to CompletedBooking interface
 * Enhanced with better data mapping and error handling
 */
const transformToCompletedBooking = (customerBooking: CustomerBooking): CompletedBooking => {
  return {
    id: customerBooking.id,
    service: {
      id: customerBooking.id, // Using booking ID as service ID since it's not provided
      title: customerBooking.service,
      image: customerBooking.image,
      category: customerBooking.service_category ? { title: customerBooking.service_category } : undefined
    },
    provider: {
      business_name: customerBooking.provider,
      first_name: undefined,
      last_name: undefined,
      id: customerBooking.provider_id
    },
    booking_date: customerBooking.date,
    booking_time: customerBooking.time,
    address: customerBooking.location,
    city: customerBooking.city || '', // Added city from CustomerBooking
    total_amount: customerBooking.price,
    status: customerBooking.status,
    rating: customerBooking.rating,
    created_at: customerBooking.date // Using date as created_at since it's not provided
  }
}

/**
 * Enhanced Service History Page Component
 * Features:
 * - Improved visual design with subtle animations
 * - Better responsive layout for all screen sizes
 * - Enhanced filtering capabilities
 * - Improved card design with hover effects
 * - Better empty state handling
 * - Performance optimizations
 */
export default function ServiceHistoryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<CompletedBooking[]>([])
  const [date, setDate] = useState<Date>()
  const [serviceType, setServiceType] = useState<string>("all-types")
  const [provider, setProvider] = useState<string>("all-providers")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  const [useMockData, setUseMockData] = useState(false)

  /**
   * Load service history data on component mount
   * Uses customerApi to fetch booking data and transforms it
   * Falls back to mock data if no real bookings exist
   */
  useEffect(() => {
    loadServiceHistory()
  }, [])

  /**
   * Apply filters whenever filter criteria change
   * Implements search, date, service type, and provider filtering
   */
  useEffect(() => {
    applyFilters()
  }, [completedBookings, date, serviceType, provider, searchQuery, useMockData])

  /**
   * Fetch completed bookings from the API
   * Handles loading states and error notifications
   * Falls back to mock data if no real bookings exist
   */
  const loadServiceHistory = async () => {
    try {
      setLoading(true)
      // Get all bookings and use only the completed ones
      const bookingsData = await customerApi.getBookings()
      const completedBookings = bookingsData.completed.map(transformToCompletedBooking)
      
      // Set real data as default
      setCompletedBookings(completedBookings)
      setFilteredBookings(completedBookings)
      
      // Only use mock data if explicitly enabled for design preview
      // To view designs with mock data, uncomment the following lines:
      // setUseMockData(true)
      // setCompletedBookings(MOCK_BOOKINGS)
      // setFilteredBookings(MOCK_BOOKINGS)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load service history",
        variant: "destructive"
      })
      // Fallback to mock data on error
      setUseMockData(true)
      setCompletedBookings(MOCK_BOOKINGS)
      setFilteredBookings(MOCK_BOOKINGS)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Apply all active filters to the booking data
   * Combines search, date, service type, and provider filters
   */
  const applyFilters = () => {
    // Use mock data if enabled, otherwise use real data
    const sourceData = useMockData ? MOCK_BOOKINGS : completedBookings
    let filtered = [...sourceData]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.service.title.toLowerCase().includes(query) ||
        (booking.provider?.business_name?.toLowerCase().includes(query)) ||
        (booking.service.category?.title.toLowerCase().includes(query))
      )
    }

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

  /**
   * Handle rebooking action
   * Navigates to the service booking page with pre-filled data
   */
  const handleRebook = (booking: CompletedBooking) => {
    // Navigate to service booking page with pre-filled data
    window.location.href = `/services/${booking.service.id}?rebook=true`
  }

  /**
   * Handle invoice download action
   * Shows a toast notification as the feature is not yet implemented
   */
  const handleDownloadInvoice = (bookingId: number) => {
    // TODO: Implement invoice download when backend supports it
    toast({
      title: "Feature Coming Soon",
      description: "Invoice download will be available in the next update",
      variant: "default"
    })
  }

  /**
   * Get unique service types for filter dropdown
   * Extracts distinct service categories from booking data
   */
  const getUniqueServiceTypes = () => {
    const sourceData = useMockData ? MOCK_BOOKINGS : completedBookings
    const types = sourceData
      .map(booking => booking.service.category?.title)
      .filter(Boolean)
    return Array.from(new Set(types))
  }

  /**
   * Get unique providers for filter dropdown
   * Extracts distinct provider names from booking data
   */
  const getUniqueProviders = () => {
    const sourceData = useMockData ? MOCK_BOOKINGS : completedBookings
    const providers = sourceData
      .map(booking => {
        return booking.provider?.business_name || 
          `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim()
      })
      .filter(Boolean)
    return Array.from(new Set(providers))
  }

  /**
   * Clear all active filters
   * Resets all filter criteria to their default values
   */
  const clearFilters = () => {
    setDate(undefined)
    setServiceType("all-types")
    setProvider("all-providers")
    setSearchQuery("")
  }

  /**
   * Enhanced Booking Card Component
   * Features improved visual design, animations, and hover effects
   */
  const BookingCard = ({ booking }: { booking: CompletedBooking }) => {
    const providerName = booking.provider?.business_name || 
      `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim() || 'Unknown Provider'
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="relative h-full overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 rounded-xl group dark:border-border dark:hover:border-primary/70 dark:hover:shadow-primary/10">
          <CardHeader className="p-0 relative">
            <div className="relative h-48 w-full overflow-hidden">
              {booking.service.image && booking.service.image !== "/placeholder.svg" ? (
                <Image
                  src={booking.service.image}
                  alt={booking.service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center dark:bg-muted/20">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-3 right-3 bg-white/90 text-indigo-600 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 dark:bg-background/80 dark:text-indigo-400 dark:border-border hover:shadow-lg hover:shadow-indigo-500/30 dark:hover:shadow-indigo-500/20 border border-border hover:border-indigo-500 dark:hover:border-indigo-500"
                onClick={() => handleDownloadInvoice(booking.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30 border border-emerald-500/30 dark:border-emerald-500/50 transition-colors hover:border-emerald-500 dark:hover:border-emerald-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors dark:text-foreground dark:group-hover:text-indigo-400">
                    {booking.service.title}
                  </h3>
                  <div className="font-semibold text-blue-600 dark:text-blue-400">Rs. {booking.total_amount}</div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {booking.provider?.id ? (
                    <Link 
                      href={`/providers/${booking.provider.id}`} 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 dark:text-muted-foreground dark:hover:text-primary"
                    >
                      <UserCheck className="h-4 w-4" />
                      {providerName}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 dark:text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      {providerName}
                    </p>
                  )}
                </div>
                {booking.service.category && (
                  <Badge variant="secondary" className="mt-2 bg-indigo-600 text-indigo-50 hover:bg-indigo-700 dark:bg-indigo-700 dark:text-indigo-100 dark:hover:bg-indigo-600">
                    {booking.service.category.title}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  <span className="dark:text-foreground">{format(new Date(booking.booking_date), "PPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  <span className="dark:text-foreground">{booking.booking_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  <span className="truncate dark:text-foreground">{booking.address}, {booking.city}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm dark:text-foreground">
                    {booking.rating ? booking.rating.toFixed(1) : 'Not rated'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs hover:bg-primary hover:text-primary-foreground transition-colors dark:hover:bg-primary dark:hover:text-primary-foreground dark:border-border"
                    onClick={() => handleRebook(booking)}
                  >
                    Book Again
                  </Button>
                  <Link href={`/dashboard/customer/reviews?booking=${booking.id}`}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-3 text-xs hover:bg-primary hover:text-primary-foreground transition-colors dark:hover:bg-primary dark:hover:text-primary-foreground dark:border-border"
                    >
                      Review
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  /**
   * Loading skeleton for booking cards
   * Provides visual feedback during data loading
   */
  const LoadingSkeleton = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="h-full dark:bg-background/50">
        <CardHeader className="p-0">
          <Skeleton className="h-48 w-full rounded-t-xl dark:bg-muted/30" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <Skeleton className="h-6 w-3/4 mb-2 dark:bg-muted/30" />
              <Skeleton className="h-4 w-1/2 dark:bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full dark:bg-muted/30" />
              <Skeleton className="h-4 w-5/6 dark:bg-muted/30" />
              <Skeleton className="h-4 w-4/5 dark:bg-muted/30" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-4 w-16 dark:bg-muted/30" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 dark:bg-muted/30" />
                <Skeleton className="h-8 w-20 dark:bg-muted/30" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="container py-6">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 dark:text-foreground">
              <TrendingUp className="h-8 w-8 text-primary" />
              Service History
            </h1>
            <p className="text-muted-foreground mt-2 dark:text-muted-foreground">
              View your completed service bookings and rebook your favorites
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-64 dark:bg-background dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden dark:border-border dark:text-foreground dark:hover:bg-muted/50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={false}
          animate={{ height: showFilters || window.innerWidth >= 768 ? "auto" : 0 }}
          className="overflow-hidden"
        >
          <Card className="mb-6 dark:bg-background/50 dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-auto">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-[240px] justify-start dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-muted/50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 dark:bg-background dark:border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="dark:bg-background dark:text-foreground"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="w-full md:w-[240px] dark:border-border dark:bg-background dark:text-foreground">
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-border dark:bg-background dark:text-foreground">
                    <SelectItem value="all-types" className="dark:hover:bg-muted/50">All Types</SelectItem>
                    {getUniqueServiceTypes().map((type) => (
                      <SelectItem key={type} value={type!} className="dark:hover:bg-muted/50">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="w-full md:w-[240px] dark:border-border dark:bg-background dark:text-foreground">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-border dark:bg-background dark:text-foreground">
                    <SelectItem value="all-providers" className="dark:hover:bg-muted/50">All Providers</SelectItem>
                    {getUniqueProviders().map((providerName) => (
                      <SelectItem key={providerName} value={providerName!} className="dark:hover:bg-muted/50">{providerName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {(date || serviceType !== "all-types" || provider !== "all-providers" || searchQuery) && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="self-end md:self-auto dark:border-border dark:text-foreground dark:hover:bg-muted/50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Results Summary */}
      {!loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground dark:text-muted-foreground">
              Showing <span className="font-semibold text-foreground dark:text-foreground">{filteredBookings.length}</span> of{" "}
              <span className="font-semibold text-foreground dark:text-foreground">{useMockData ? MOCK_BOOKINGS.length : completedBookings.length}</span> completed bookings
              {useMockData && (
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300">
                  Demo Data
                </span>
              )}
            </p>
            {filteredBookings.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>All services completed successfully</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Booking Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Card className="w-full max-w-2xl dark:bg-background/50 dark:border-border">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-muted rounded-full dark:bg-muted/20">
                  <Clock className="h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 dark:text-foreground">
                    {date || serviceType !== "all-types" || provider !== "all-providers" || searchQuery 
                      ? "No Matching Bookings Found" 
                      : "No Service History Yet"}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6 dark:text-muted-foreground">
                    {date || serviceType !== "all-types" || provider !== "all-providers" || searchQuery 
                      ? "No services match your current filters. Try adjusting your search criteria or clearing filters."
                      : useMockData 
                        ? "You're currently viewing demo data. When you complete real bookings, they will appear here."
                        : "You haven't completed any services yet. Book a service to see your history here."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={clearFilters} variant="outline" className="dark:border-border dark:text-foreground dark:hover:bg-muted/50">
                      Clear Filters
                    </Button>
                    <Link href="/services">
                      <Button className="dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">
                        Browse Services
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}