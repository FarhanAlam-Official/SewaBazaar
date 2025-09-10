'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { showToast } from '@/components/ui/enhanced-toast'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  X,
  AlertCircle,
  RefreshCw,
  Search,
  User,
  Tag,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  ClockIcon,
  XCircle,
  Filter,
  Star,
  Phone,
  Mail,
  Info,
} from 'lucide-react'
import { format, parseISO, startOfDay, isSameDay } from 'date-fns'
import { customerApi } from '@/services/customer.api'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatTime12Hr, formatTimeRange } from '@/utils/timeUtils'

// Enhanced interface with more detailed booking information
interface BookingEvent {
  id: number
  service: {
    id: number
    title: string
    image?: string
    category?: string
    rating?: number
  }
  provider?: {
    business_name?: string
    first_name?: string
    last_name?: string
    avatar?: string
    phone?: string
    email?: string
  }
  booking_date: string
  booking_time: string
  address: string
  city: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
  created_at: string
  special_instructions?: string
  booking_type?: string
  priority?: 'low' | 'medium' | 'high'
}

/**
 * Transform CustomerBooking to BookingEvent interface
 * 
 * Converts raw booking data from the API to the expected BookingEvent interface.
 * Handles various data formats and provides fallback values for missing data.
 * 
 * @param {any} customerBooking - Raw booking data from API
 * @returns {BookingEvent} Transformed booking event
 */
const transformToBookingEvent = (customerBooking: any): BookingEvent => {
  // Handle different response formats
  console.log('Transforming booking:', customerBooking)

  // Format time using time utilities
  let formattedTime = '';
  if (customerBooking.booking_slot_details?.start_time && customerBooking.booking_slot_details?.end_time) {
    formattedTime = formatTimeRange(
      customerBooking.booking_slot_details.start_time,
      customerBooking.booking_slot_details.end_time
    );
  } else {
    formattedTime = formatTime12Hr(customerBooking.time || customerBooking.booking_time);
  }

  return {
    id: customerBooking.id,
    service: {
      id: customerBooking.id, // Using booking ID as service ID since it's not provided in grouped format
      title:
        customerBooking.service ||
        customerBooking.service_details?.title ||
        'Unknown Service',
      image:
        customerBooking.image ||
        customerBooking.service_details?.image ||
        '/placeholder.svg',
      category:
        customerBooking.service_category ||
        customerBooking.service_details?.category?.title ||
        'General',
      rating:
        customerBooking.service_rating ||
        customerBooking.service_details?.average_rating ||
        0,
    },
    provider: {
      business_name:
        customerBooking.provider ||
        customerBooking.provider_name ||
        customerBooking.service_details?.provider?.business_name,
      first_name: customerBooking.service_details?.provider?.first_name,
      last_name: customerBooking.service_details?.provider?.last_name,
      avatar:
        customerBooking.provider_avatar ||
        customerBooking.service_details?.provider?.avatar ||
        '/placeholder.svg',
      phone:
        customerBooking.provider_phone ||
        customerBooking.service_details?.provider?.phone ||
        '',
      email:
        customerBooking.provider_email ||
        customerBooking.service_details?.provider?.email ||
        '',
    },
    booking_date: customerBooking.date || customerBooking.booking_date,
    booking_time: formattedTime, // Use formatted time
    address: customerBooking.location || customerBooking.address || '',
    city: customerBooking.city || '', // Not provided in CustomerBooking
    status: customerBooking.status as
      | 'pending'
      | 'confirmed'
      | 'completed'
      | 'cancelled',
    total_amount: parseFloat(customerBooking.price?.toString() || customerBooking.total_amount?.toString() || '0'),
    created_at: customerBooking.created_at || new Date().toISOString(),
    special_instructions: customerBooking.special_instructions || '',
    booking_type: customerBooking.booking_type || 'normal',
    priority: customerBooking.priority || 'medium',
  }
}

/**
 * Enhanced status badge component with better styling
 * 
 * Displays a booking status with appropriate color coding and icons.
 * Supports statuses: confirmed, pending, cancelled, completed.
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Booking status
 * @returns {JSX.Element} Status badge component
 */
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  }

  // Enhanced hover styles for better theme compatibility
  const getStatusHoverStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'hover:bg-emerald-200 hover:border-emerald-300 hover:text-emerald-900 dark:hover:bg-emerald-800/50 dark:hover:border-emerald-700 dark:hover:text-emerald-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
      case 'pending':
        return 'hover:bg-amber-200 hover:border-amber-300 hover:text-amber-900 dark:hover:bg-amber-800/50 dark:hover:border-amber-700 dark:hover:text-amber-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
      case 'cancelled':
        return 'hover:bg-red-200 hover:border-red-300 hover:text-red-900 dark:hover:bg-red-800/50 dark:hover:border-red-700 dark:hover:text-red-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
      case 'completed':
        return 'hover:bg-blue-200 hover:border-blue-300 hover:text-blue-900 dark:hover:bg-blue-800/50 dark:hover:border-blue-700 dark:hover:text-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
      default:
        return 'hover:bg-gray-200 hover:border-gray-300 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:hover:text-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />
      case 'pending':
        return <ClockIcon className="h-3 w-3" />
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Badge
        className={`${getStatusStyle(status)} ${getStatusHoverStyle(status)} flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all duration-300 cursor-pointer`}
      >
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    </motion.div>
  )
}

// Determine booking type badge style - moved outside component to be accessible in modal
const getBookingTypeStyle = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'normal':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    case 'express':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
    case 'urgent':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
    case 'emergency':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  }
}

// Enhanced hover styles for booking type badges for better theme compatibility
const getBookingTypeHoverStyle = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'normal':
      return 'hover:bg-green-200 hover:border-green-300 hover:text-green-900 dark:hover:bg-green-800/50 dark:hover:border-green-700 dark:hover:text-green-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
    case 'express':
      return 'hover:bg-purple-200 hover:border-purple-300 hover:text-purple-900 dark:hover:bg-purple-800/50 dark:hover:border-purple-700 dark:hover:text-purple-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
    case 'urgent':
      return 'hover:bg-orange-200 hover:border-orange-300 hover:text-orange-900 dark:hover:bg-orange-800/50 dark:hover:border-orange-700 dark:hover:text-orange-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
    case 'emergency':
      return 'hover:bg-red-200 hover:border-red-300 hover:text-red-900 dark:hover:bg-red-800/50 dark:hover:border-red-700 dark:hover:text-red-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
    default:
      return 'hover:bg-gray-200 hover:border-gray-300 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:hover:text-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-200'
  }
}

/**
 * Priority indicator component
 * 
 * Displays a booking priority with appropriate color coding and icons.
 * Supports priorities: low, medium, high.
 * 
 * @param {Object} props - Component props
 * @param {'low' | 'medium' | 'high'} props.priority - Booking priority
 * @returns {JSX.Element} Priority indicator component
 */
const PriorityIndicator = ({
  priority,
}: {
  priority: 'low' | 'medium' | 'high'
}) => {
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-3 w-3" />
      case 'medium':
        return <Info className="h-3 w-3" />
      case 'low':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  return (
    <Badge
      className={`${getPriorityStyle(priority)} flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium`}
    >
      {getPriorityIcon(priority)}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

/**
 * Rating display component
 * 
 * Displays a service rating with star icons.
 * Only shows if rating is greater than 0.
 * 
 * @param {Object} props - Component props
 * @param {number} props.rating - Service rating (0-5)
 * @returns {JSX.Element | null} Rating display component or null
 */
const RatingDisplay = ({ rating }: { rating: number }) => {
  if (!rating || rating === 0) return null

  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-current text-yellow-500" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

/**
 * Enhanced booking card component with animations
 * 
 * Displays a booking event with service details, provider information,
 * status indicators, and interactive elements. Uses Framer Motion for
 * smooth animations and hover effects.
 * 
 * @param {Object} props - Component props
 * @param {BookingEvent} props.booking - Booking event data
 * @param {Function} props.onClick - Click handler for card interaction
 * @returns {JSX.Element} Booking card component
 */
const BookingCard = ({
  booking,
  onClick,
}: {
  booking: BookingEvent
  onClick: () => void
}) => {
  const providerName =
    booking.provider?.business_name ||
    `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim() ||
    'Unknown Provider'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{
        y: -5,
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
    >
      <Card
        className="group overflow-hidden rounded-xl border border-border transition-all duration-300 hover:border-primary/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-border dark:hover:border-primary/50"
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${booking.service.title} booking on ${format(parseISO(booking.booking_date), 'MMMM do, yyyy')}`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start space-x-3">
              <motion.div
                className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Image
                  src={booking.service.image || '/placeholder.svg'}
                  alt={booking.service.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="truncate font-semibold text-foreground transition-colors duration-300 group-hover:text-primary dark:text-foreground">
                    {booking.service.title}
                  </h4>
                  <RatingDisplay rating={booking.service.rating || 0} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs hover:shadow-md transition-shadow duration-200">
                    {booking.service.category}
                  </Badge>
                  {/* Display booking type instead of priority with improved hover effect */}
                  <Badge className={`${getBookingTypeStyle(booking.booking_type || 'normal')} ${getBookingTypeHoverStyle(booking.booking_type || 'normal')} flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-200 cursor-pointer`}>
                    {booking.booking_type || 'normal'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <User className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm text-muted-foreground">
                    {providerName}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-foreground dark:text-foreground">
                      {format(parseISO(booking.booking_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-foreground dark:text-foreground">
                      {booking.booking_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-foreground dark:text-foreground">
                      {booking.city || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {/* Info icon in top right corner */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    aria-label="View details"
                    className="h-6 w-6 p-0"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.span
                  className="text-lg font-bold text-foreground dark:text-foreground"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Rs. {booking.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={booking.status} />
                {/* Removed standard/medium badge */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Customer Schedule Page Component
 *
 * This component displays a customer's booking schedule with calendar view,
 * filtering options, and detailed booking information.
 *
 * Features:
 * - Calendar view with booking highlights
 * - Filtering by category, status, and priority
 * - Sorting by date or amount
 * * Detailed booking information in modal
 * - Statistics cards for quick overview
 * - Responsive design for all screen sizes
 * - Keyboard navigation and accessibility features
 */
export default function SchedulePage() {
  const router = useRouter()
  const { user } = useAuth()
  console.log('Current user:', user)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(
    null
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Refs for accessibility
  const calendarRef = useRef<HTMLDivElement>(null)
  const todayTabRef = useRef<HTMLButtonElement>(null)
  const upcomingTabRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ENHANCED: Reschedule modal state
  // Reschedule functionality - using dedicated page instead of modal
  // No modal state needed - we navigate to the reschedule page instead
  const [allBookings, setAllBookings] = useState<BookingEvent[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<BookingEvent[]>([])
  const [todayBookings, setTodayBookings] = useState<BookingEvent[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  /**
   * Keyboard navigation handler
   *
   * Implements keyboard shortcuts for improved accessibility:
   * - Ctrl+K or Cmd+K: Focus search input
   * - Escape: Close dialog
   * - Ctrl+Shift+Arrow keys: Navigate between tabs
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search input with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Close dialog with Escape key
      if (e.key === 'Escape' && isDialogOpen) {
        setIsDialogOpen(false)
      }

      // Navigate between tabs with Ctrl+Shift+Arrow keys
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          todayTabRef.current?.focus()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          upcomingTabRef.current?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDialogOpen])

  useEffect(() => {
    if (user) {
      console.log('User authenticated, loading bookings...')
      loadBookings()
    } else {
      console.log('User not authenticated, waiting...')
    }
  }, [user])

  useEffect(() => {
    if (date && allBookings.length > 0) {
      filterBookingsForDate(date)
    }
  }, [date, allBookings])

  /**
   * Load bookings from API
   *
   * Fetches all bookings for the current user and transforms the data
   * to match the expected interface. Populates state variables for
   * all bookings, upcoming bookings, and today's bookings.
   *
   * @returns {Promise<void>} Resolves when bookings are loaded
   */
  const loadBookings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Clear cache for testing
      localStorage.removeItem('customer_bookings')

      // Get all bookings in one call with grouped format
      console.log('Fetching bookings from API...')
      const bookingsData = await customerApi.getBookings()
      console.log('Bookings data received:', bookingsData)

      // Transform the data to match the expected interface
      const allBookingData = [
        ...bookingsData.upcoming.map(transformToBookingEvent),
        ...bookingsData.completed.map(transformToBookingEvent),
      ]
      const upcomingBookingData = bookingsData.upcoming.map(
        transformToBookingEvent
      )

      console.log('Transformed all booking data:', allBookingData)
      console.log('Transformed upcoming booking data:', upcomingBookingData)

      setAllBookings(allBookingData)
      setUpcomingBookings(upcomingBookingData)

      // Filter today's bookings
      const today = new Date()
      const todaysBookings = allBookingData.filter((booking) =>
        isSameDay(parseISO(booking.booking_date), today)
      )
      setTodayBookings(todaysBookings)
    } catch (error: any) {
      console.error('Error loading bookings:', error)
      setError(error.message || 'Failed to load schedule')
      showToast.error({
        title: 'Error',
        description: error.message || 'Failed to load schedule',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const filterBookingsForDate = (selectedDate: Date) => {
    const bookingsForDate = allBookings.filter((booking) =>
      isSameDay(parseISO(booking.booking_date), selectedDate)
    )
    setTodayBookings(bookingsForDate)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date)
    if (date) {
      filterBookingsForDate(date)
    }
  }

  // Get unique categories for filtering
  const categories = Array.from(
    new Set(
      upcomingBookings.map((booking) => booking.service.category || 'General')
    )
  )

  // Filter bookings based on search term and filters
  const filteredUpcomingBookings = [...upcomingBookings]
    .filter((booking) => {
      // Apply search filter
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase()
        if (
          !(
            booking.service.title.toLowerCase().includes(searchTermLower) ||
            (booking.provider?.business_name &&
              booking.provider.business_name
                .toLowerCase()
                .includes(searchTermLower)) ||
            booking.booking_time.toLowerCase().includes(searchTermLower) ||
            (booking.service.category &&
              booking.service.category.toLowerCase().includes(searchTermLower))
          )
        ) {
          return false
        }
      }

      // Apply category filter
      if (
        filterCategory !== 'all' &&
        booking.service.category !== filterCategory
      ) {
        return false
      }

      // Apply status filter
      if (filterStatus !== 'all' && booking.status !== filterStatus) {
        return false
      }

      // Apply priority filter
      if (filterPriority !== 'all' && booking.priority !== filterPriority) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = (
          new Date(a.booking_date).getTime() -
          new Date(b.booking_date).getTime()
        )
      } else {
        comparison = b.total_amount - a.total_amount
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // ENHANCED: New reschedule modal handlers
  // Navigate to reschedule page instead of opening modal
  const navigateToReschedule = (bookingId: number) => {
    router.push(`/dashboard/customer/bookings/reschedule/${bookingId}`)
  }

  // Navigate to reschedule page
  const handleReschedule = async (bookingId: number) => {
    navigateToReschedule(bookingId)
  }

  const handleCancel = async (bookingId: number) => {
    try {
      await customerApi.cancelBooking(bookingId)
      showToast.success({
        title: 'Success',
        description: 'Booking cancelled successfully',
        duration: 3000,
      })
      loadBookings() // Reload to update the list
      setIsDialogOpen(false)
    } catch (error: any) {
      showToast.error({
        title: 'Error',
        description: error.message || 'Failed to cancel booking',
        duration: 5000,
      })
    }
  }

  const handleAddToCalendar = (booking: BookingEvent) => {
    try {
      // Parse the booking date and time properly
      let startDate: Date;
      
      // Handle different time formats
      if (booking.booking_time.includes('AM') || booking.booking_time.includes('PM')) {
        // 12-hour format with AM/PM
        const [time, modifier] = booking.booking_time.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (modifier === 'PM' && hours !== 12) {
          hours += 12;
        }
        if (modifier === 'AM' && hours === 12) {
          hours = 0;
        }
        
        startDate = new Date(booking.booking_date);
        startDate.setHours(hours, minutes, 0, 0);
      } else if (booking.booking_time.includes(':')) {
        // 24-hour format
        const [hours, minutes] = booking.booking_time.split(':').map(Number);
        startDate = new Date(booking.booking_date);
        startDate.setHours(hours, minutes, 0, 0);
      } else {
        // Fallback to simple date parsing
        startDate = new Date(`${booking.booking_date}T${booking.booking_time}`);
      }
      
      // Validate the date
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid date');
      }
      
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

      // Create comprehensive description with more booking details
      const providerName = booking.provider?.business_name ||
        `${booking.provider?.first_name || ''} ${booking.provider?.last_name || ''}`.trim() ||
        'Provider';
        
      const description = [
        `Service: ${booking.service.title}`,
        `Booking ID: #${booking.id}`,
        `Provider: ${providerName}`,
        `Type: ${booking.booking_type || 'Normal'}`,
        `Status: ${booking.status}`,
        `Location: ${booking.address}, ${booking.city}`,
        `Amount: Rs. ${booking.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        booking.special_instructions ? `Instructions: ${booking.special_instructions}` : ''
      ].filter(line => line).join('\n\n');

      const calendarData = {
        title: `${booking.service.title} - ${providerName}`,
        start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
        end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
        description: description,
        location: `${booking.address}, ${booking.city}`,
      };

      // Create Google Calendar URL with more details
      const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.title)}&dates=${calendarData.start}/${calendarData.end}&details=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}`;

      window.open(googleCalUrl, '_blank');
    } catch (error) {
      console.error('Error creating calendar event:', error);
      showToast.error({
        title: 'Error',
        description: 'Unable to add booking to calendar. Please try again.',
        duration: 5000,
      });
    }
  }

  const getBookingDates = () => {
    return allBookings.map((booking) => parseISO(booking.booking_date))
  }

  /**
   * Calculate summary statistics with trends
   *
   * Computes booking statistics including counts and amounts for various
   * categories, along with percentage changes compared to the previous
   * 30-day period for trend analysis.
   *
   * @returns {Object} Statistics object containing counts, amounts, and changes
   */
  const getBookingStats = () => {
    const today = new Date()
    const todayCount = todayBookings.length
    const upcomingCount = upcomingBookings.length
    const totalAmount = upcomingBookings.reduce(
      (sum, booking) => sum + (parseFloat(booking.total_amount.toString()) || 0),
      0
    )
    const confirmedCount = upcomingBookings.filter(
      (b) => b.status === 'confirmed'
    ).length
    const pendingCount = upcomingBookings.filter(
      (b) => b.status === 'pending'
    ).length

    // Calculate previous period stats for trend comparison (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const previousBookings = allBookings.filter((booking) => {
      const bookingDate = parseISO(booking.booking_date)
      return bookingDate >= thirtyDaysAgo && bookingDate < today
    })

    const previousUpcomingCount = previousBookings.length
    const previousTotalAmount = previousBookings.reduce(
      (sum, booking) => sum + (parseFloat(booking.total_amount.toString()) || 0),
      0
    )
    const previousConfirmedCount = previousBookings.filter(
      (b) => b.status === 'confirmed'
    ).length
    const previousPendingCount = previousBookings.filter(
      (b) => b.status === 'pending'
    ).length

    // Calculate percentage changes
    const upcomingChange =
      previousUpcomingCount > 0
        ? ((upcomingCount - previousUpcomingCount) / previousUpcomingCount) *
          100
        : upcomingCount > 0
          ? 100
          : 0

    const amountChange =
      previousTotalAmount > 0
        ? ((totalAmount - previousTotalAmount) / previousTotalAmount) * 100
        : totalAmount > 0
          ? 100
          : 0

    const confirmedChange =
      previousConfirmedCount > 0
        ? ((confirmedCount - previousConfirmedCount) / previousConfirmedCount) *
          100
        : confirmedCount > 0
          ? 100
          : 0

    const pendingChange =
      previousPendingCount > 0
        ? ((pendingCount - previousPendingCount) / previousPendingCount) * 100
        : pendingCount > 0
          ? 100
          : 0

    return {
      todayCount,
      upcomingCount,
      totalAmount,
      confirmedCount,
      pendingCount,
      upcomingChange,
      amountChange,
      confirmedChange,
      pendingChange,
    }
  }

  const {
    todayCount,
    upcomingCount,
    totalAmount,
    confirmedCount,
    pendingCount,
    upcomingChange,
    amountChange,
    confirmedChange,
    pendingChange,
  } = getBookingStats()

  return (
    <div className="container py-6">
      {/* Page Header - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <motion.h1
              className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              My Schedule
            </motion.h1>
            <motion.p
              className="mt-2 text-sm text-muted-foreground sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Manage your upcoming bookings and appointments
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/services')}
                className="w-full transition-all duration-300 hover:scale-105 hover:bg-primary/10 hover:text-primary sm:w-auto"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Book Service</span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards - Responsive Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-green-50/60 transition-all duration-300 hover:shadow-md dark:border-emerald-800/50 dark:from-emerald-950/50 dark:to-green-950/30">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 dark:bg-emerald-400/20 sm:h-10 sm:w-10">
                  <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:h-5 sm:w-5" />
                </div>
                <TrendingUp className="h-3 w-3 text-emerald-500/60 sm:h-4 sm:w-4" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">
                  Today's Bookings
                </p>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 sm:text-xl">
                    {todayCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 transition-all duration-300 hover:shadow-md dark:border-blue-800/50 dark:from-blue-950/50 dark:to-indigo-950/30">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 dark:bg-blue-400/20 sm:h-10 sm:w-10">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
                </div>
                <TrendingUp className="h-3 w-3 text-blue-500/60 sm:h-4 sm:w-4" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-blue-700/80 dark:text-blue-300/80">
                  Upcoming
                </p>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300 sm:text-xl">
                    {upcomingCount}
                  </div>
                  {upcomingChange !== 0 && (
                    <div
                      className={`flex items-center text-xs ${upcomingChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {upcomingChange > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(upcomingChange).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-purple-200/50 bg-gradient-to-br from-purple-50/80 to-violet-50/60 transition-all duration-300 hover:shadow-md dark:border-purple-800/50 dark:from-purple-950/50 dark:to-violet-950/30">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 dark:bg-purple-400/20 sm:h-10 sm:w-10">
                  <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
                </div>
                <TrendingUp className="h-3 w-3 text-purple-500/60 sm:h-4 sm:w-4" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-purple-700/80 dark:text-purple-300/80">
                  Total Value
                </p>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300 sm:text-xl">
                    Rs. {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {amountChange !== 0 && (
                    <div
                      className={`flex items-center text-xs ${amountChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {amountChange > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(amountChange).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-green-200/50 bg-gradient-to-br from-green-50/80 to-emerald-50/60 transition-all duration-300 hover:shadow-md dark:border-green-800/50 dark:from-green-950/50 dark:to-emerald-950/30">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15 dark:bg-green-400/20 sm:h-10 sm:w-10">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
                </div>
                <TrendingUp className="h-3 w-3 text-green-500/60 sm:h-4 sm:w-4" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-green-700/80 dark:text-green-300/80">
                  Confirmed
                </p>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300 sm:text-xl">
                    {confirmedCount}
                  </div>
                  {confirmedChange !== 0 && (
                    <div
                      className={`flex items-center text-xs ${confirmedChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      {confirmedChange > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(confirmedChange).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-yellow-50/60 transition-all duration-300 hover:shadow-md dark:border-amber-800/50 dark:from-amber-950/50 dark:to-yellow-950/30">
            <CardContent className="flex h-full flex-col justify-between p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 dark:bg-amber-400/20 sm:h-10 sm:w-10">
                  <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" />
                </div>
                <TrendingUp className="h-3 w-3 text-amber-500/60 sm:h-4 sm:w-4" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-amber-700/80 dark:text-amber-300/80">
                  Pending
                </p>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300 sm:text-xl">
                    {pendingCount}
                  </div>
                  {pendingChange !== 0 && (
                    <div
                      className={`flex items-center text-xs ${pendingChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                    >
                      {pendingChange > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {Math.abs(pendingChange).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Error Message Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-medium text-red-800">
                Error Loading Bookings
              </h3>
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-red-200 text-red-700 hover:bg-red-100"
                onClick={loadBookings}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={calendarRef}
                className="overflow-x-auto"
                role="region"
                aria-label="Booking calendar"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  className="w-full rounded-md border"
                  modifiers={{
                    hasBooking: getBookingDates(),
                    today: new Date(),
                    weekend: (date: Date) => [0, 6].includes(date.getDay()),
                  }}
                  modifiersStyles={{
                    hasBooking: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'white',
                      fontWeight: 'bold',
                      position: 'relative',
                    },
                    today: {
                      backgroundColor: 'hsl(var(--accent))',
                      color: 'hsl(var(--accent-foreground))',
                      fontWeight: 'bold',
                    },
                    weekend: {
                      color: 'hsl(var(--muted-foreground))',
                    },
                  }}
                  aria-label="Select a date to view bookings"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary"></div>
                  <span>Dates with bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-accent"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted"></div>
                  <span>Weekend</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="today" className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              {/* Reduced font size of header tabs */}
              <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2 text-sm">
                <TabsTrigger
                  ref={todayTabRef}
                  value="today"
                  aria-label="Today's Schedule tab (Ctrl+Shift+Left Arrow to navigate)"
                  className="text-sm transition-all duration-200 ease-in-out"
                >
                  Today's Schedule
                </TabsTrigger>
                <TabsTrigger
                  ref={upcomingTabRef}
                  value="upcoming"
                  aria-label="All Upcoming tab (Ctrl+Shift+Right Arrow to navigate)"
                  className="text-sm transition-all duration-200 ease-in-out"
                >
                  All Upcoming
                </TabsTrigger>
              </TabsList>
              {/* Increased search bar length and improved design */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search bookings... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-base border-2 border-muted focus:border-primary rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                  aria-label="Search bookings"
                />
              </div>
            </div>

            <TabsContent value="today" className="mt-4">
              <Card className="h-full max-h-[calc(100vh-200px)] overflow-y-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="h-4 w-4" />
                    {date ? format(date, 'PPPP') : "Today's Schedule"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[160px]" />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : todayBookings.length > 0 ? (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {todayBookings.map((booking) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            onClick={() => {
                              setSelectedBooking(booking)
                              setIsDialogOpen(true)
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="py-8 text-center"
                    >
                      <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        No bookings for this date
                      </h3>
                      <p className="text-muted-foreground">
                        Select a different date or book a new service.
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 inline-block"
                      >
                        <Button
                          variant="default"
                          className="transition-transform hover:scale-105"
                          onClick={() => (window.location.href = '/services')}
                        >
                          Book a Service
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-4">
              <Card className="h-full max-h-[calc(100vh-200px)] overflow-y-auto">
                <CardHeader className="pb-3">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-4 w-4" />
                      All Upcoming Bookings
                    </CardTitle>
                    {/* Enhanced filter section with improved dropdown design */}
                    <div className="flex flex-wrap items-end gap-3">
                      <Filter className="h-5 w-5 text-muted-foreground mb-5" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground mb-1">Category</span>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="rounded-lg border-2 border-muted bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-150 shadow-sm hover:shadow-md dark:bg-background w-36"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground mb-1">Status</span>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="rounded-lg border-2 border-muted bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-150 shadow-sm hover:shadow-md dark:bg-background w-36"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground mb-1">Priority</span>
                        <select
                          value={filterPriority}
                          onChange={(e) => setFilterPriority(e.target.value)}
                          className="rounded-lg border-2 border-muted bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-150 shadow-sm hover:shadow-md dark:bg-background w-36"
                        >
                          <option value="all">All Priorities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="flex flex-col relative">
                        <span className="text-xs font-medium text-foreground mb-1">Sort by</span>
                        <div className="relative">
                          <select
                            value={sortBy}
                            onChange={(e) =>
                              setSortBy(e.target.value as 'date' | 'amount')
                            }
                            className="rounded-lg border-2 border-muted bg-background px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-150 shadow-sm hover:shadow-md dark:bg-background w-36 appearance-none"
                          >
                            <option value="date">Date</option>
                            <option value="amount">Amount</option>
                          </select>
                          <button 
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                          >
                            {sortOrder === 'asc' ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[160px]" />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : filteredUpcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {filteredUpcomingBookings.map((booking) => (
                          <BookingCard
                            key={booking.id}
                            booking={booking}
                            onClick={() => {
                              setSelectedBooking(booking)
                              setIsDialogOpen(true)
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="py-8 text-center"
                    >
                      <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">
                        {searchTerm ||
                        filterCategory !== 'all' ||
                        filterStatus !== 'all' ||
                        filterPriority !== 'all'
                          ? 'No matching bookings found'
                          : 'No upcoming bookings'}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm ||
                        filterCategory !== 'all' ||
                        filterStatus !== 'all' ||
                        filterPriority !== 'all'
                          ? 'Try adjusting your search terms or filters'
                          : 'Book a service to see your schedule here.'}
                      </p>
                      {!(
                        searchTerm ||
                        filterCategory !== 'all' ||
                        filterStatus !== 'all' ||
                        filterPriority !== 'all'
                      ) && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-4 inline-block"
                        >
                          <Button
                            variant="default"
                            className="transition-transform hover:scale-105"
                            onClick={() => (window.location.href = '/services')}
                          >
                            Book a Service
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Booking Details Dialog - Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-[90vw] md:max-w-[720px]"
          aria-label="Booking details"
          role="dialog"
          aria-modal="true"
        >
          <DialogHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-lg -m-6 mb-6 p-6">
            <DialogTitle className="flex items-center justify-between text-white">
              <span>Booking Details</span>
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence>
            {selectedBooking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Booking ID and Service Info */}
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-col items-start space-x-0 space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                    <motion.div
                      className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Image
                        src={selectedBooking.service.image || '/placeholder.svg'}
                        alt={selectedBooking.service.title}
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="truncate text-lg font-semibold">
                          {selectedBooking.service.title}
                        </h3>
                        <RatingDisplay
                          rating={selectedBooking.service.rating || 0}
                        />
                      </div>
                      <p className="truncate text-muted-foreground text-sm">
                        Booking ID: #{selectedBooking.id}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs hover:shadow-md transition-shadow duration-200">
                          {selectedBooking.service.category}
                        </Badge>
                        {/* Display booking type in modal with improved hover effect */}
                        <Badge className={`${getBookingTypeStyle(selectedBooking.booking_type || 'normal')} ${getBookingTypeHoverStyle(selectedBooking.booking_type || 'normal')} flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-200 cursor-pointer`}>
                          {selectedBooking.booking_type || 'normal'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Provider Information - Enhanced Design */}
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4" />
                      Provider Information
                    </h4>
                    <div className="space-y-4">
                      {/* Provider Avatar and Name */}
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          <Image
                            src={selectedBooking.provider?.avatar || '/placeholder.svg'}
                            alt="Provider avatar"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedBooking.provider?.business_name ||
                              `${selectedBooking.provider?.first_name || ''} ${selectedBooking.provider?.last_name || ''}`.trim() ||
                              'Provider'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Service Provider
                          </p>
                        </div>
                      </div>
                      
                      {/* Contact Information */}
                      <div className="space-y-2 pt-2">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Contact Information
                        </h5>
                        <div className="space-y-2">
                          {selectedBooking.provider?.phone && (
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <Phone className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Phone</p>
                                <a 
                                  href={`tel:${selectedBooking.provider.phone}`} 
                                  className="text-sm text-muted-foreground hover:text-primary"
                                >
                                  {selectedBooking.provider.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          {selectedBooking.provider?.email && (
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <Mail className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Email</p>
                                <a 
                                  href={`mailto:${selectedBooking.provider.email}`} 
                                  className="text-sm text-muted-foreground hover:text-primary"
                                >
                                  {selectedBooking.provider.email}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Info className="h-4 w-4" />
                      Booking Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="text-sm">
                          {format(parseISO(selectedBooking.booking_date), 'PPP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="text-sm">
                          {/* Updated to use formatted time */}
                          {selectedBooking.booking_time}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedBooking.address || 'N/A'},{' '}
                          {selectedBooking.city || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="text-sm capitalize">
                          {selectedBooking.booking_type || 'normal'}
                        </span>
                      </div>
                      <div className="pt-2">
                        <StatusBadge status={selectedBooking.status} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedBooking.special_instructions && (
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      Special Instructions
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.special_instructions}
                    </p>
                  </div>
                )}

                {/* Total Amount */}
                <motion.div
                  className="rounded-lg border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-sm dark:border-indigo-800 dark:from-indigo-900/20 dark:to-purple-900/20"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-lg font-bold">
                      Rs. {selectedBooking.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </motion.div>

                {/* Pending Status Notice */}
                {selectedBooking.status === 'pending' && (
                  <motion.div
                    className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800">
                      This booking is pending confirmation from the provider.
                    </span>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full transition-transform hover:scale-105 hover:shadow-md"
                      onClick={() => handleAddToCalendar(selectedBooking)}
                    >
                      Add to Calendar
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      variant="default"
                      className="w-full transition-transform hover:scale-105 hover:shadow-md"
                      onClick={() => router.push('/dashboard/customer/bookings')}
                    >
                      Manage in Bookings
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* ENHANCED: New reschedule modal component with calendar and slot selection */}
      {/* Reschedule functionality now uses dedicated page instead of modal */}
    </div>
  )
}