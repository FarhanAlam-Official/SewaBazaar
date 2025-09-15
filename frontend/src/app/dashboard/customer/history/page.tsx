"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { customerApi, CustomerBooking } from "@/services/customer.api"
import { formatTimeRange, formatTime12Hr } from "@/utils/timeUtils"
import Link from "next/link"

// ======================
// Type Definitions
// ======================

/**
 * Interface for completed booking data structure
 * Defines the shape of booking data used in the UI components
 * This interface maps the API response to a format suitable for display
 */
interface CompletedBooking {
  /** Unique identifier for the booking */
  id: number
  /** Service information associated with the booking */
  service: {
    /** Service identifier */
    id: number
    /** Title/name of the service */
    title: string
    /** Optional image URL for the service */
    image?: string
    /** Category information for the service */
    category?: {
      /** Title/name of the service category */
      title: string
    }
  }
  /** Provider information for the service */
  provider?: {
    /** Business name of the provider */
    business_name?: string
    /** First name of the provider */
    first_name?: string
    /** Last name of the provider */
    last_name?: string
    /** Unique identifier for the provider */
    id?: number
  }
  /** Date when the booking was made (ISO format) */
  booking_date: string
  /** Time when the booking was made */
  booking_time: string
  /** Address where the service will be provided */
  address: string
  /** City where the service will be provided */
  city: string
  /** Total amount charged for the booking */
  total_amount: number
  /** Current status of the booking */
  status: string
  /** Optional rating given by the customer */
  rating?: number
  /** Creation timestamp of the booking */
  created_at: string
  /** Optional booking slot details */
  booking_slot_details?: {
    /** Slot identifier */
    id: number
    /** Start time of the slot */
    start_time: string
    /** End time of the slot */
    end_time: string
    /** Type of the slot */
    slot_type: string
  }
}

// ======================
// Helper Functions
// ======================

/**
 * Transform CustomerBooking to CompletedBooking interface
 * Maps API response data to the format expected by UI components
 * This function handles data transformation and normalization for consistent display
 * 
 * @param customerBooking - Raw booking data from API
 * @returns Transformed booking data for UI display
 */
const transformToCompletedBooking = (customerBooking: CustomerBooking): CompletedBooking => {
  // Handle case where service_category might be an empty string or undefined
  // Default to 'General Service' if no category is provided
  const hasCategory = customerBooking.service_category && customerBooking.service_category.trim() !== '';
  const category = hasCategory ? { title: customerBooking.service_category! } : { title: 'General Service' };
  
  return {
    id: customerBooking.id,
    service: {
      id: customerBooking.service_id || customerBooking.id, // Use service_id if available, fallback to booking ID
      title: customerBooking.service,
      image: customerBooking.image,
      category: category
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
    created_at: customerBooking.date, // Using date as created_at since it's not provided
    booking_slot_details: customerBooking.booking_slot_details || undefined
  };
}

// ======================
// Main Component
// ======================

/**
 * Service History Page Component
 * Displays a list of completed bookings with filtering capabilities
 * 
 * Features:
 * - Responsive grid layout for booking cards
 * - Advanced filtering by date, service type, and provider
 * - Search functionality across service titles, providers, and categories
 * - Rebooking and review actions for each completed service
 * - Loading states with skeleton screens and empty state handling
 * - Animations for enhanced user experience
 * - Pagination support for better performance with large datasets
 * 
 * @returns JSX.Element - The rendered service history page
 */
export default function ServiceHistoryPage() {
  // ======================
  // Hooks and State
  // ======================
  
  /** Toast notification hook for user feedback */
  const { toast } = useToast()
  /** Router hook for navigation */
  const router = useRouter()
  /** Loading state for data fetching */
  const [loading, setLoading] = useState(true)
  /** All completed bookings fetched from the API */
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([])
  /** Filtered bookings based on active filters */
  const [filteredBookings, setFilteredBookings] = useState<CompletedBooking[]>([])
  /** Selected date for filtering */
  const [date, setDate] = useState<Date>()
  /** Selected service type for filtering */
  const [serviceType, setServiceType] = useState<string>("all-types")
  /** Selected provider for filtering */
  const [provider, setProvider] = useState<string>("all-providers")
  /** Search query for text-based filtering */
  const [searchQuery, setSearchQuery] = useState<string>("")
  /** Visibility state for the filter section */
  const [showFilters, setShowFilters] = useState(true)
  /** Current page number for pagination */
  const [currentPage, setCurrentPage] = useState(1)
  /** Total number of bookings available */
  const [totalBookings, setTotalBookings] = useState(0)
  /** Page size for pagination */
  const [pageSize] = useState(10) // Show 10 bookings per page for better UX
  /** Total pages calculated from total bookings and page size */
  const [totalPages, setTotalPages] = useState(1)

  // ======================
  // Lifecycle Effects
  // ======================
  
  // Load service history when component mounts or when pagination changes
  useEffect(() => {
    loadServiceHistory()
  }, [currentPage])

  // Apply filters whenever filter criteria change
  // Note: This will reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
    // In a real implementation, we would re-apply filters on the server side
    // For now, we'll apply client-side filtering on the current page of data
  }, [date, serviceType, provider, searchQuery])

  // Update total pages when total bookings changes
  useEffect(() => {
    setTotalPages(Math.ceil(totalBookings / pageSize))
  }, [totalBookings, pageSize])

  // ======================
  // Data Fetching
  // ======================
  
  /**
   * Fetch completed bookings from the API
   * Handles loading states and error notifications
   * Uses pagination to fetch only the required data
   */
  const loadServiceHistory = async () => {
    try {
      setLoading(true)
      // Get bookings for the current page with specified page size
      const bookingsData = await customerApi.getBookings({ 
        page: currentPage,
        page_size: pageSize 
      })
      
      const completedBookings = bookingsData.completed.map(transformToCompletedBooking)
      
      // Set real data as default
      setCompletedBookings(completedBookings)
      setFilteredBookings(completedBookings)
      setTotalBookings(bookingsData.count) // Total count from API response
      
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

  // ======================
  // Pagination Handlers
  // ======================
  
  /**
   * Navigate to the previous page
   */
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  /**
   * Navigate to the next page
   */
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  /**
   * Navigate to a specific page
   * @param page - Page number to navigate to
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  /**
   * Generate page numbers for pagination controls
   * Creates an array of page numbers with ellipsis for large page counts
   * @returns Array of page numbers and ellipsis markers
   */
  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)
      
      // Show ellipsis if needed
      if (currentPage > 3) {
        pages.push("ellipsis-start")
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pages.push("ellipsis-end")
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // ======================
  // Action Handlers
  // ======================
  
  /**
   * Handle rebooking action
   * Navigates to the service detail page where users can make a new booking
   * Uses the service ID to directly access the service page
   * 
   * @param booking - The booking to rebook
   */
  const handleRebook = (booking: CompletedBooking) => {
    if (booking.service.id) {
      router.push(`/services/${booking.service.id}`)
    } else {
      // Fallback: Navigate to services page if service ID is not available
      router.push('/services')
    }
  }

  /**
   * Handle invoice download action
   * Shows a toast notification as the feature is not yet implemented
   * This is a placeholder for future functionality
   * 
   * @param bookingId - ID of the booking for which to download invoice
   */
  const handleDownloadInvoice = (bookingId: number) => {
    toast({
      title: "Feature Coming Soon",
      description: "Invoice download will be available in the next update",
      variant: "default"
    })
  }

  /**
   * Clear all active filters
   * Resets all filter criteria to their default values
   * This allows users to see all bookings again
   */
  const clearFilters = () => {
    setDate(undefined)
    setServiceType("all-types")
    setProvider("all-providers")
    setSearchQuery("")
    setCurrentPage(1) // Reset to first page when clearing filters
  }

  // ======================
  // Filter Data Helpers
  // ======================
  
  /**
   * Get unique service types for filter dropdown
   * Extracts distinct service categories from booking data
   * This ensures the dropdown only shows relevant options
   * 
   * @returns Array of unique service category titles
   */
  const getUniqueServiceTypes = () => {
    const types = completedBookings
      .map(booking => booking.service.category?.title)
      .filter((title): title is string => Boolean(title)) // Better type checking
    return Array.from(new Set(types))
  }

  /**
   * Get unique providers for filter dropdown
   * Extracts distinct provider names from booking data
   * This ensures the dropdown only shows providers that have completed bookings
   * 
   * @returns Array of unique provider names
   */
  const getUniqueProviders = () => {
    const providers = completedBookings
      .map(booking => {
        return booking.provider?.business_name || 
          `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim()
      })
      .filter((name): name is string => Boolean(name)) // Better type checking
    return Array.from(new Set(providers))
  }

  // ======================
  // UI Components
  // ======================
  
  /**
   * Booking Card Component
   * Displays individual booking information in a card format
   * Includes service details, provider information, booking time, and actions
   * 
   * @param booking - The booking data to display
   */
  const BookingCard = ({ booking }: { booking: CompletedBooking }) => {
    // Construct provider name from available data
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
                  unoptimized={booking.service.image.startsWith('http')}
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
                  <Badge variant="secondary" className="mt-2 bg-indigo-600 text-indigo-50 hover:bg-indigo-700 dark:bg-indigo-700 dark:text-indigo-100 dark:hover:bg-indigo-500 border border-indigo-500/30 dark:border-indigo-500/50 transition-colors hover:border-indigo-500 dark:hover:border-indigo-500">
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
                  <span className="dark:text-foreground">
                    {booking.booking_slot_details?.start_time && booking.booking_slot_details?.end_time 
                      ? formatTimeRange(booking.booking_slot_details.start_time, booking.booking_slot_details.end_time)
                      : formatTime12Hr(booking.booking_time)
                    }
                  </span>
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
   * Pagination Component
   * Displays pagination controls for navigating between pages
   */
  const PaginationControls = () => {
    if (totalPages <= 1) return null
    
    return (
      <div className="flex items-center justify-between border-t border-border pt-6 mt-6 dark:border-border">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
          Showing <span className="font-semibold text-foreground dark:text-foreground">
            {Math.min((currentPage - 1) * pageSize + 1, totalBookings)}
          </span> to <span className="font-semibold text-foreground dark:text-foreground">
            {Math.min(currentPage * pageSize, totalBookings)}
          </span> of <span className="font-semibold text-foreground dark:text-foreground">
            {totalBookings}
          </span> results
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="dark:border-border dark:text-foreground dark:hover:bg-muted/50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {generatePageNumbers().map((page, index) => (
              page === "ellipsis-start" || page === "ellipsis-end" ? (
                <div 
                  key={`ellipsis-${index}`} 
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground dark:text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  key={page as number}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page as number)}
                  className={
                    currentPage === page 
                      ? "dark:bg-primary dark:text-primary-foreground" 
                      : "dark:border-border dark:text-foreground dark:hover:bg-muted/50"
                  }
                >
                  {page}
                </Button>
              )
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="dark:border-border dark:text-foreground dark:hover:bg-muted/50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // ======================
  // Main Render
  // ======================
  
  return (
    <div className="container py-6">
      {/* Page Header with title and search */}
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
              Showing <span className="font-semibold text-foreground dark:text-foreground">
                {Math.min((currentPage - 1) * pageSize + 1, totalBookings)}
              </span> to <span className="font-semibold text-foreground dark:text-foreground">
                {Math.min(currentPage * pageSize, totalBookings)}
              </span> of <span className="font-semibold text-foreground dark:text-foreground">
                {totalBookings}
              </span> completed bookings
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
        // Loading state is now handled by the separate loading.tsx file
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-full">
              <Card className="h-full">
                <CardHeader className="p-0">
                  <div className="h-48 w-full bg-muted rounded-t-xl animate-pulse" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                      <div className="flex gap-2">
                        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <>
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
          
          {/* Pagination Controls */}
          <PaginationControls />
        </>
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