/**
 * @fileoverview Customer Schedule Management Page for SewaBazaar Platform
 * 
 * This file contains the main schedule page for customers to view, manage, and interact with
 * their service bookings. It provides a comprehensive dashboard with calendar view, booking
 * statistics, filtering capabilities, and various booking management actions.
 * 
 * @component SchedulePage
 * @version 1.0.0
 * @author SewaBazaar Development Team
 * @created 2025
 * @lastModified Sep 2025
 * 
 * Key Features:
 * - Interactive calendar with booking visualization
 * - Real-time booking statistics with trend analysis
 * - Advanced filtering and search capabilities
 * - Responsive design for all device sizes
 * - Booking management actions (reschedule, cancel, add to calendar)
 * - Keyboard navigation and accessibility support
 * - Toast notifications for user feedback
 * - Modal dialogs for detailed booking information
 * - Performance optimized with motion animations
 * 
 * Page Sections:
 * 1. Header with page title and quick action button
 * 2. Statistics cards showing booking metrics with trends
 * 3. Interactive calendar for date selection and booking visualization
 * 4. Tabbed interface for "Selected Date" and "Upcoming Bookings"
 * 5. Advanced filtering and search controls
 * 6. Booking list with individual booking cards
 * 7. Detailed booking information modal
 * 
 * State Management:
 * - Authentication state through AuthContext
 * - Booking data fetched from customer API
 * - Local state for UI interactions (modals, filters, search)
 * - Calendar state for date selection and event display
 * 
 * Accessibility Features:
 * - Keyboard navigation with hotkeys (Ctrl+K for search)
 * - ARIA labels and proper semantic HTML
 * - Screen reader friendly structure
 * - Focus management for modals and interactions
 * 
 * Dependencies:
 * - React: Core functionality and hooks
 * - Next.js: Routing and navigation
 * - Framer Motion: Smooth animations and transitions
 * - date-fns: Date manipulation and formatting
 * - Lucide React: Icon library
 * - shadcn/ui: UI component library
 * - AuthContext: User authentication management
 * - Customer API: Backend communication for booking data
 * 
 * @requires React
 * @requires Next.js
 * @requires Framer-Motion
 * @requires date-fns
 * @requires AuthContext
 * @requires CustomerAPI
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { showToast } from '@/components/ui/enhanced-toast'
import { CalendarEvent } from "@/components/calendar/AdvancedBookingsCalendar"
import FullCalendarBookings from "@/components/calendar/FullCalendarBookings"
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

/**
 * Enhanced BookingEvent Interface
 * 
 * Represents a comprehensive booking event with all necessary information
 * for display and management in the schedule interface. This interface
 * standardizes booking data from various API sources.
 * 
 * @interface BookingEvent
 * @property {number} id - Unique booking identifier
 * @property {Object} service - Service details object
 * @property {number} service.id - Unique service identifier
 * @property {string} service.title - Service name/title
 * @property {string} [service.image] - Optional service image URL
 * @property {string} [service.category] - Optional service category
 * @property {number} [service.rating] - Optional service rating (0-5)
 * @property {Object} [provider] - Optional provider information
 * @property {string} [provider.business_name] - Provider's business name
 * @property {string} [provider.first_name] - Provider's first name
 * @property {string} [provider.last_name] - Provider's last name
 * @property {string} [provider.avatar] - Provider's profile picture URL
 * @property {string} [provider.phone] - Provider's contact phone number
 * @property {string} [provider.email] - Provider's contact email address
 * @property {string} booking_date - ISO date string for booking date
 * @property {string} booking_time - Formatted time string for booking time
 * @property {string} address - Service delivery address
 * @property {string} city - Service delivery city
 * @property {'pending'|'confirmed'|'completed'|'cancelled'} status - Current booking status
 * @property {number} total_amount - Total booking amount in currency
 * @property {string} created_at - ISO date string for booking creation
 * @property {string} [special_instructions] - Optional customer instructions
 * @property {string} [booking_type] - Optional booking type classification
 * @property {'low'|'medium'|'high'} [priority] - Optional booking priority level
 */
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
 * Transform CustomerBooking to BookingEvent Interface
 * 
 * Converts raw booking data from the API to the standardized BookingEvent interface.
 * Handles various data formats, nested objects, and provides fallback values for 
 * missing or malformed data to ensure consistent UI rendering.
 * 
 * @function transformToBookingEvent
 * @param {any} customerBooking - Raw booking data from customer API
 * @returns {BookingEvent} Transformed and standardized booking event object
 * 
 * @example
 * ```tsx
 * const rawBooking = await customerApi.getBookings()
 * const transformedBooking = transformToBookingEvent(rawBooking)
 * ```
 * 
 * Data Transformations:
 * - Extracts nested service and provider information
 * - Handles missing provider data gracefully
 * - Ensures all required fields have fallback values
 * - Standardizes date and time formats
 * - Maps API status values to interface status enum
 */
const transformToBookingEvent = (customerBooking: any): BookingEvent => {
  // Handle different response formats
  console.log('Transforming booking:', customerBooking)

  // Format time using time utilities - always show time range
  let formattedTime = '';
  if (customerBooking.booking_slot_details?.start_time && customerBooking.booking_slot_details?.end_time) {
    // Use the provided start and end times
    formattedTime = formatTimeRange(
      customerBooking.booking_slot_details.start_time,
      customerBooking.booking_slot_details.end_time
    );
  } else {
    // If no slot details, create a 1-hour time range from the booking time
    const startTime = customerBooking.time || customerBooking.booking_time;
    if (startTime) {
      try {
        // Parse the start time and add 1 hour for end time
        let startHour, startMinute = 0;
        const timeStr = startTime.toLowerCase();
        
        if (timeStr.includes('am') || timeStr.includes('pm')) {
          // 12-hour format
          const [time, modifier] = timeStr.split(/\s+/);
          [startHour, startMinute] = time.split(':').map(Number);
          
          if (modifier === 'pm' && startHour !== 12) {
            startHour += 12;
          } else if (modifier === 'am' && startHour === 12) {
            startHour = 0;
          }
        } else {
          // 24-hour format
          [startHour, startMinute] = timeStr.split(':').map(Number);
        }
        
        // Create end time (1 hour later)
        let endHour = startHour + 1;
        const endMinute = startMinute || 0;
        
        // Handle hour overflow
        if (endHour >= 24) {
          endHour = endHour - 24;
        }
        
        // Format as time strings
        const startTimeFormatted = `${startHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        const endTimeFormatted = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        formattedTime = formatTimeRange(startTimeFormatted, endTimeFormatted);
      } catch (error) {
        // Fallback to original time if parsing fails
        console.warn('Failed to create time range, using original time:', startTime, error);
        formattedTime = formatTime12Hr(startTime);
      }
    }
  }

  const bookingDate = customerBooking.date || customerBooking.booking_date
  console.log('Raw booking date:', bookingDate, 'Type:', typeof bookingDate)
  
  // Ensure proper date handling for calendar
  let processedDate = bookingDate
  if (typeof bookingDate === 'string' && bookingDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // If it's a date string, keep it as is for local timezone handling
    processedDate = bookingDate
  } else if (bookingDate) {
    // Convert to YYYY-MM-DD format for consistent handling
    const date = new Date(bookingDate)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      processedDate = `${year}-${month}-${day}`
    }
  }
  
  // Normalize status to lowercase for consistent comparisons
  const normalizedStatus = (customerBooking.status || '').toString().toLowerCase() as
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'

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
    booking_date: processedDate,
    booking_time: formattedTime, // Use formatted time
    address: customerBooking.location || customerBooking.address || '',
    city: customerBooking.city || '', // Not provided in CustomerBooking
    status: normalizedStatus,
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
        return 'hover:bg-emerald-200 hover:border-emerald-300 hover:text-emerald-900 hover:shadow-lg hover:shadow-emerald-200/50 dark:hover:bg-emerald-800/60 dark:hover:border-emerald-600 dark:hover:text-emerald-100 dark:hover:shadow-emerald-900/30 hover:-translate-y-0.5 transition-all duration-300'
      case 'pending':
        return 'hover:bg-amber-200 hover:border-amber-300 hover:text-amber-900 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:bg-amber-800/60 dark:hover:border-amber-600 dark:hover:text-amber-100 dark:hover:shadow-amber-900/30 hover:-translate-y-0.5 transition-all duration-300'
      case 'cancelled':
        return 'hover:bg-red-200 hover:border-red-300 hover:text-red-900 hover:shadow-lg hover:shadow-red-200/50 dark:hover:bg-red-800/60 dark:hover:border-red-600 dark:hover:text-red-100 dark:hover:shadow-red-900/30 hover:-translate-y-0.5 transition-all duration-300'
      case 'completed':
        return 'hover:bg-blue-200 hover:border-blue-300 hover:text-blue-900 hover:shadow-lg hover:shadow-blue-200/50 dark:hover:bg-blue-800/60 dark:hover:border-blue-600 dark:hover:text-blue-100 dark:hover:shadow-blue-900/30 hover:-translate-y-0.5 transition-all duration-300'
      default:
        return 'hover:bg-gray-200 hover:border-gray-300 hover:text-gray-900 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:bg-gray-700/60 dark:hover:border-gray-600 dark:hover:text-gray-100 dark:hover:shadow-gray-800/30 hover:-translate-y-0.5 transition-all duration-300'
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
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Badge
        className={`${getStatusStyle(status)} ${getStatusHoverStyle(status)} flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all duration-300 cursor-pointer border`}
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
      return 'hover:bg-green-200 hover:border-green-300 hover:text-green-900 hover:shadow-lg hover:shadow-green-200/50 dark:hover:bg-green-800/60 dark:hover:border-green-600 dark:hover:text-green-100 dark:hover:shadow-green-900/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
    case 'express':
      return 'hover:bg-purple-200 hover:border-purple-300 hover:text-purple-900 hover:shadow-lg hover:shadow-purple-200/50 dark:hover:bg-purple-800/60 dark:hover:border-purple-600 dark:hover:text-purple-100 dark:hover:shadow-purple-900/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
    case 'urgent':
      return 'hover:bg-orange-200 hover:border-orange-300 hover:text-orange-900 hover:shadow-lg hover:shadow-orange-200/50 dark:hover:bg-orange-800/60 dark:hover:border-orange-600 dark:hover:text-orange-100 dark:hover:shadow-orange-900/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
    case 'emergency':
      return 'hover:bg-red-200 hover:border-red-300 hover:text-red-900 hover:shadow-lg hover:shadow-red-200/50 dark:hover:bg-red-800/60 dark:hover:border-red-600 dark:hover:text-red-100 dark:hover:shadow-red-900/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
    default:
      return 'hover:bg-gray-200 hover:border-gray-300 hover:text-gray-900 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:bg-gray-700/60 dark:hover:border-gray-600 dark:hover:text-gray-100 dark:hover:shadow-gray-800/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
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

  const getPriorityHoverStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'hover:bg-red-200 hover:border-red-300 hover:text-red-900 hover:shadow-lg hover:shadow-red-200/50 dark:hover:bg-red-800/60 dark:hover:border-red-600 dark:hover:text-red-100 dark:hover:shadow-red-900/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
      case 'medium':
        return 'hover:bg-amber-200 hover:border-amber-300 hover:text-amber-900 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:bg-amber-800/60 dark:hover:border-amber-600 dark:hover:text-amber-100 dark:hover:shadow-amber-900/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
      case 'low':
        return 'hover:bg-green-200 hover:border-green-300 hover:text-green-900 hover:shadow-lg hover:shadow-green-200/50 dark:hover:bg-green-800/60 dark:hover:border-green-600 dark:hover:text-green-100 dark:hover:shadow-green-900/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
      default:
        return 'hover:bg-gray-200 hover:border-gray-300 hover:text-gray-900 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:bg-gray-700/60 dark:hover:border-gray-600 dark:hover:text-gray-100 dark:hover:shadow-gray-800/30 hover:scale-105 hover:-translate-y-0.5 transition-all duration-300'
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Badge
        className={`${getPriorityStyle(priority)} ${getPriorityHoverStyle(priority)} flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium cursor-pointer border`}
      >
        {getPriorityIcon(priority)}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    </motion.div>
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
/**
 * Booking Card Component
 * 
 * Interactive card component that displays comprehensive booking information
 * in a visually appealing and accessible format. Features smooth animations,
 * hover effects, and keyboard navigation support.
 * 
 * @component BookingCard
 * @param {Object} props - Component properties
 * @param {BookingEvent} props.booking - Complete booking event data
 * @param {Function} props.onClick - Callback function for card click/interaction
 * @returns {JSX.Element} Rendered booking card with animations and interactions
 * 
 * @example
 * ```tsx
 * <BookingCard
 *   booking={bookingData}
 *   onClick={() => setSelectedBooking(bookingData)}
 * />
 * ```
 * 
 * Visual Features:
 * - Animated card entrance and exit effects
 * - Hover elevation with shadow effects
 * - Click animation feedback
 * - Status-based color coding
 * - Responsive layout for all screen sizes
 * 
 * Accessibility Features:
 * - Keyboard navigation support (Enter/Space)
 * - Proper ARIA labels and roles
 * - Focus indicators for screen readers
 * - Semantic HTML structure
 * 
 * Information Displayed:
 * - Service image and title with rating
 * - Provider name and business information
 * - Booking date and time
 * - Location (address and city)
 * - Status badge with appropriate styling
 * - Total amount formatted for currency
 * 
 * Interactions:
 * - Click to open detailed booking modal
 * - Hover effects for visual feedback
 * - Keyboard activation support
 * - Touch-friendly tap animations
 */
const BookingCard = ({
  booking,
  onClick,
}: {
  booking: BookingEvent
  onClick: () => void
}) => {
  // Extract provider name with fallbacks for missing data
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
                  unoptimized={booking.service.image?.startsWith('http') || false}
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
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="text-xs font-medium transition-all duration-300 cursor-pointer border
                        bg-secondary text-secondary-foreground border-secondary/50
                        hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5
                        dark:bg-secondary dark:text-secondary-foreground dark:border-secondary/50
                        dark:hover:bg-primary/20 dark:hover:text-primary-foreground dark:hover:border-primary/50 dark:hover:shadow-lg dark:hover:shadow-primary/30"
                    >
                      {booking.service.category}
                    </Badge>
                  </motion.div>
                  {/* Display booking type instead of priority with improved hover effect */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Badge className={`${getBookingTypeStyle(booking.booking_type || 'normal')} ${getBookingTypeHoverStyle(booking.booking_type || 'normal')} flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-300 cursor-pointer border`}>
                      {booking.booking_type || 'normal'}
                    </Badge>
                  </motion.div>
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

/**
 * Customer Schedule Page Component
 * 
 * Main dashboard page for customers to view and manage their service bookings.
 * Provides comprehensive booking management with calendar view, statistics,
 * filtering, and various actions like rescheduling and cancellation.
 * 
 * @component
 * @returns {JSX.Element} Complete schedule management interface
 * 
 * Features Overview:
 * - Real-time booking statistics with trend indicators
 * - Interactive calendar with booking visualization
 * - Advanced filtering by category, status, and priority
 * - Search functionality across booking details
 * - Sorting by date or booking amount
 * - Detailed booking information in responsive modal
 * - Booking management actions (reschedule, cancel, add to calendar)
 * - Keyboard shortcuts for improved accessibility
 * - Responsive design optimized for all screen sizes
 * - Smooth animations and loading states
 */
export default function SchedulePage() {
  // Navigation and authentication hooks
  const router = useRouter()
  const { user } = useAuth()
  console.log('Current user:', user)

  /**
   * Core Loading and Error State Management
   * 
   * @state {boolean} loading - Global loading state for API operations
   * @state {string|null} error - Error message display for failed operations
   */
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Calendar and Date Selection State
   * 
   * @state {Date|undefined} date - Currently selected date in calendar
   * @default {Date} new Date() - Defaults to today's date
   */
  const [date, setDate] = useState<Date | undefined>(new Date())

  /**
   * Booking Detail Modal State Management
   * 
   * @state {BookingEvent|null} selectedBooking - Currently selected booking for detail view
   * @state {boolean} isDialogOpen - Controls visibility of booking detail modal
   */
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  /**
   * Accessibility Reference Elements
   * Used for keyboard navigation and focus management throughout the interface
   * 
   * @ref {HTMLButtonElement} todayTabRef - Reference to "Selected Date" tab button
   * @ref {HTMLButtonElement} upcomingTabRef - Reference to "Upcoming Bookings" tab button  
   * @ref {HTMLInputElement} searchInputRef - Reference to search input for Ctrl+K shortcut
   */
  const todayTabRef = useRef<HTMLButtonElement>(null)
  const upcomingTabRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  /**
   * Booking Data State Arrays
   * 
   * Maintains separate arrays for different views and filtering needs.
   * The reschedule functionality uses dedicated pages instead of modals
   * for better user experience and navigation.
   * 
   * @state {BookingEvent[]} allBookings - Complete list of all user bookings
   * @state {BookingEvent[]} upcomingBookings - Future bookings only (for upcoming tab)
   * @state {BookingEvent[]} todayBookings - Bookings for currently selected date
   * @state {BookingEvent[]} actualTodayBookings - Bookings for actual today (for stats)
   * 
   * Data Flow:
   * 1. allBookings: Master data from API
   * 2. upcomingBookings: Filtered from allBookings (future dates only)
   * 3. todayBookings: Filtered from allBookings (selected date only)
   * 4. actualTodayBookings: Filtered from allBookings (today only, for statistics)
   */
  const [allBookings, setAllBookings] = useState<BookingEvent[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<BookingEvent[]>([])
  const [todayBookings, setTodayBookings] = useState<BookingEvent[]>([])
  const [actualTodayBookings, setActualTodayBookings] = useState<BookingEvent[]>([])

  /**
   * Search and Filter State Management
   * 
   * @state {string} searchTerm - Text search across booking details
   * @state {'date'|'amount'} sortBy - Current sorting criteria
   * @state {'asc'|'desc'} sortOrder - Sort direction (ascending/descending)
   * @state {string} filterCategory - Selected service category filter
   * @state {string} filterStatus - Selected booking status filter
   * @state {string} filterPriority - Selected priority level filter
   * @state {string[]|undefined} activeStatuses - Calendar status filter for visualization
   */
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [activeStatuses, setActiveStatuses] = useState<string[] | undefined>(undefined)

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

  /**
   * Filter Bookings for Specific Date
   *
   * Filters the complete bookings list to show only bookings that match
   * the selected date. Updates the todayBookings state which is used
   * in the "Selected Date Bookings" tab.
   *
   * @function filterBookingsForDate
   * @param {Date} selectedDate - The date to filter bookings for
   * @returns {void}
   * 
   * @example
   * ```tsx
   * // Called when user selects a date from calendar
   * const handleCalendarClick = (date: Date) => {
   *   filterBookingsForDate(date)
   * }
   * ```
   * 
   * Filtering Logic:
   * - Uses date-fns isSameDay for accurate date comparison
   * - Ignores time component, only matches date
   * - Updates todayBookings state for immediate UI refresh
   * - Works with any date (past, present, or future)
   * 
   * Performance:
   * - Efficient filter operation on allBookings array
   * - No API calls needed, uses cached data
   * - Immediate UI update without loading states
   */
  const filterBookingsForDate = useCallback((selectedDate: Date): void => {
    const bookingsForDate = allBookings.filter((booking) =>
      isSameDay(parseISO(booking.booking_date), selectedDate)
    )
    setTodayBookings(bookingsForDate)
  }, [allBookings])

  useEffect(() => {
    if (date && allBookings.length > 0) {
      filterBookingsForDate(date)
    }
  }, [date, allBookings, filterBookingsForDate])

  /**
   * Load Bookings from Customer API
   *
   * Comprehensive data fetching function that retrieves all booking information
   * for the current user and transforms it into the required interface format.
   * Handles different booking states and populates multiple state arrays for
   * various UI views and filtering needs.
   *
   * @async
   * @function loadBookings
   * @returns {Promise<void>} Resolves when all booking data is loaded and processed
   * 
   * @example
   * ```tsx
   * // Called automatically on component mount and user authentication
   * useEffect(() => {
   *   if (user) {
   *     loadBookings()
   *   }
   * }, [user])
   * ```
   * 
   * Data Processing Flow:
   * 1. Clear loading cache and set loading state
   * 2. Fetch grouped booking data from customer API
   * 3. Transform raw API data using transformToBookingEvent
   * 4. Separate bookings into different categories:
   *    - All bookings (upcoming + completed + cancelled)
   *    - Upcoming bookings only (for upcoming tab)
   *    - Today's bookings (for statistics and initial view)
   * 5. Update all relevant state variables
   * 6. Handle errors with toast notifications
   * 
   * Error Handling:
   * - Sets error state for UI display
   * - Shows user-friendly toast notification
   * - Logs detailed error information for debugging
   * - Maintains loading state integrity
   * 
   * Performance Considerations:
   * - Clears localStorage cache for fresh data
   * - Transforms data efficiently with map operations
   * - Uses date filtering for optimal performance
   * - Provides console logging for debugging
   */
  const loadBookings = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      // Don't clear cache for production use
      // localStorage.removeItem('customer_bookings')

      // Get all bookings in one call with grouped format
      console.log('Fetching bookings from API...')
      const bookingsData = await customerApi.getBookings()
      console.log('Bookings data received:', JSON.stringify(bookingsData, null, 2))
      
      // Check if we have any bookings
      if (!bookingsData || 
          (!bookingsData.upcoming?.length && 
           !bookingsData.completed?.length && 
           !bookingsData.cancelled?.length)) {
        console.warn('No bookings data received from API');
        // Add some test data for development
        bookingsData.upcoming = [
          {
            id: 1001,
            service: 'Test Service 1',
            service_category: 'Home Cleaning',
            date: new Date().toISOString().split('T')[0],
            time: '10:00 AM',
            status: 'pending',
            price: 1500,
            provider: 'Test Provider',
            location: '123 Test Street',
            image: '/placeholder.jpg'
          },
          {
            id: 1002,
            service: 'Test Service 2',
            service_category: 'Plumbing',
            date: new Date().toISOString().split('T')[0],
            time: '14:00 PM',
            status: 'confirmed',
            price: 2500,
            provider: 'Test Provider 2',
            location: '456 Test Avenue',
            image: '/placeholder.jpg'
          }
        ];
      }
      
      console.log('Bookings data with test data if needed:', bookingsData)

      // Transform the data to match the expected interface
      const allBookingData = [
        ...bookingsData.upcoming.map(transformToBookingEvent),
        ...bookingsData.completed.map(transformToBookingEvent),
        ...bookingsData.cancelled.map(transformToBookingEvent),
      ]
      const upcomingBookingData = bookingsData.upcoming.map(
        transformToBookingEvent
      )

      console.log('Transformed all booking data:', allBookingData)
      console.log('Transformed upcoming booking data:', upcomingBookingData)
      console.log('Sample booking for calendar:', allBookingData[0])

      setAllBookings(allBookingData)
      setUpcomingBookings(upcomingBookingData)

      // Filter today's bookings for header count (always actual today)
      const today = new Date()
      const todaysBookings = allBookingData.filter((booking) =>
        isSameDay(parseISO(booking.booking_date), today)
      )
      setActualTodayBookings(todaysBookings)
      setTodayBookings(todaysBookings) // Initially set to today's bookings
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

  /**
   * Handle Date Selection from Calendar
   *
   * Central handler for date selection events from the calendar component.
   * Updates the selected date state and triggers filtering of bookings
   * for the new date.
   *
   * @function handleDateSelect
   * @param {Date | undefined} date - Selected date from calendar (undefined for deselection)
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <AdvancedBookingsCalendar
   *   onSelectDate={handleDateSelect}
   *   // other props...
   * />
   * ```
   * 
   * Behavior:
   * - Updates date state for calendar highlighting
   * - Triggers booking filtering only if date is defined
   * - Handles both selection and deselection cases
   * - Maintains calendar state consistency
   * 
   * Side Effects:
   * - Updates date state (triggers calendar re-render)
   * - Updates todayBookings state (triggers tab content refresh)
   * - No API calls or network operations
   */
  const handleDateSelect = (date: Date | undefined): void => {
    setDate(date)
    if (date) {
      filterBookingsForDate(date)
    }
  }

  /**
   * Extract Unique Service Categories
   * 
   * Dynamically generates a list of unique service categories from
   * upcoming bookings for use in the category filter dropdown.
   * 
   * @constant categories
   * @type {string[]} Array of unique category names
   * 
   * Processing:
   * - Maps over upcomingBookings to extract categories
   * - Uses Set to eliminate duplicates
   * - Provides fallback 'General' category for undefined values
   * - Updates automatically when bookings data changes
   */
  const categories = Array.from(
    new Set(
      upcomingBookings.map((booking) => booking.service.category || 'General')
    )
  )

  // Filter bookings based on search term and filters
  const filteredUpcomingBookings = [...upcomingBookings]
    .filter((booking) => {
      // First filter: Only include future bookings (including today's future bookings)
      const now = new Date()
      const bookingDate = parseISO(booking.booking_date)
      
      // If booking is on a future date, include it
      if (bookingDate > startOfDay(now)) {
        return true
      }
      
      // If booking is today, check if the time is in the future
      if (isSameDay(bookingDate, now)) {
        try {
          // Parse booking time - handle both 12-hour and 24-hour formats
          const timeStr = booking.booking_time.toLowerCase()
          let bookingTime: Date
          
          if (timeStr.includes('am') || timeStr.includes('pm')) {
            // 12-hour format
            const [time, modifier] = timeStr.split(/\s+/)
            const timeParts = time.split(':').map(Number)
            let hours = timeParts[0]
            const minutes = timeParts[1]
            
            if (modifier === 'pm' && hours !== 12) {
              hours += 12
            } else if (modifier === 'am' && hours === 12) {
              hours = 0
            }
            
            bookingTime = new Date(bookingDate)
            bookingTime.setHours(hours, minutes || 0, 0, 0)
          } else {
            // 24-hour format or just hours
            const [hours, minutes] = timeStr.split(':').map(Number)
            bookingTime = new Date(bookingDate)
            bookingTime.setHours(hours, minutes || 0, 0, 0)
          }
          
          // Only include if booking time is in the future
          if (bookingTime <= now) {
            return false
          }
        } catch (error) {
          // If time parsing fails, include the booking to be safe
          console.warn('Failed to parse booking time:', booking.booking_time, error)
        }
      } else {
        // Booking is in the past, exclude it
        return false
      }

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

  /**
   * Navigate to Reschedule Page
   *
   * Helper function that navigates to the dedicated reschedule page
   * for a specific booking. Uses Next.js router for client-side navigation.
   *
   * @function navigateToReschedule
   * @param {number} bookingId - Unique identifier of booking to reschedule
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={() => navigateToReschedule(booking.id)}>
   *   Reschedule
   * </Button>
   * ```
   * 
   * Navigation Path:
   * - Route: `/dashboard/customer/bookings/reschedule/${bookingId}`
   * - Maintains booking context through URL parameter
   * - Provides better UX than modal for complex rescheduling
   * - Allows for browser back navigation
   */
  const navigateToReschedule = (bookingId: number): void => {
    router.push(`/dashboard/customer/bookings/reschedule/${bookingId}`)
  }

  /**
   * Handle Booking Reschedule Request
   *
   * Initiates the reschedule process by navigating to the dedicated
   * reschedule page. This approach provides better user experience
   * than in-page modals for complex scheduling operations.
   *
   * @async
   * @function handleReschedule
   * @param {number} bookingId - Unique identifier of booking to reschedule
   * @returns {Promise<void>}
   * 
   * @example
   * ```tsx
   * <DropdownMenuItem onClick={() => handleReschedule(booking.id)}>
   *   Reschedule Booking
   * </DropdownMenuItem>
   * ```
   * 
   * Design Decision:
   * - Uses dedicated page instead of modal for better UX
   * - Allows for complex calendar and slot selection
   * - Maintains booking context through URL routing
   * - Enables proper browser navigation and bookmarking
   */
  const handleReschedule = async (bookingId: number): Promise<void> => {
    navigateToReschedule(bookingId)
  }

  /**
   * Handle Booking Cancellation
   *
   * Cancels a specific booking through the customer API and provides
   * user feedback through toast notifications. Updates the UI by
   * reloading bookings data and closing any open modals.
   *
   * @async
   * @function handleCancel
   * @param {number} bookingId - Unique identifier of booking to cancel
   * @returns {Promise<void>}
   * 
   * @example
   * ```tsx
   * <Button 
   *   variant="destructive" 
   *   onClick={() => handleCancel(booking.id)}
   * >
   *   Cancel Booking
   * </Button>
   * ```
   * 
   * Process Flow:
   * 1. Call customer API to cancel booking
   * 2. Show success toast notification
   * 3. Reload bookings data to reflect changes
   * 4. Close booking detail modal
   * 5. Handle errors with user-friendly messages
   * 
   * Error Handling:
   * - Catches API errors and displays toast messages
   * - Maintains UI state integrity on failures
   * - Provides specific error information when available
   * - Logs errors for debugging purposes
   */
  const handleCancel = async (bookingId: number): Promise<void> => {
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

  /**
   * Handle Add Booking to Calendar
   *
   * Creates a calendar event from booking information and opens it
   * in Google Calendar. Handles various time formats and creates
   * comprehensive event details including service, provider, and
   * location information.
   *
   * @function handleAddToCalendar
   * @param {BookingEvent} booking - Complete booking information
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={() => handleAddToCalendar(selectedBooking)}>
   *   Add to Calendar
   * </Button>
   * ```
   * 
   * Calendar Event Details:
   * - Title: Service name + Provider name
   * - Start/End Time: Parsed from booking time (defaults to 2-hour duration)
   * - Description: Comprehensive booking details (ID, provider, amount, etc.)
   * - Location: Full address from booking
   * 
   * Time Format Support:
   * - 12-hour format with AM/PM
   * - 24-hour format
   * - Handles edge cases with fallback formatting
   * 
   * Error Handling:
   * - Validates parsed dates before calendar creation
   * - Shows error toast for parsing failures
   * - Logs detailed error information for debugging
   * - Graceful fallback for unsupported time formats
   */
  const handleAddToCalendar = (booking: BookingEvent): void => {
    try {
      // Parse the booking date and time properly
      let startDate: Date;
      
      // Handle different time formats
      if (booking.booking_time.includes('AM') || booking.booking_time.includes('PM')) {
        // 12-hour format with AM/PM
        const [time, modifier] = booking.booking_time.split(' ');
        const timeParts = time.split(':').map(Number);
        let hours = timeParts[0];
        const minutes = timeParts[1];
        
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
        const timeParts = booking.booking_time.split(':').map(Number);
        const hours = timeParts[0];
        const minutes = timeParts[1];
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
    const now = new Date()
    
    // Today's bookings count (correct)
    const todayCount = actualTodayBookings.length
    
    // Filter upcoming bookings to only include future bookings (excluding past)
    const futureBookings = upcomingBookings.filter((booking) => {
      const bookingDate = parseISO(booking.booking_date)
      // For today's bookings, also check if the time has passed
      if (isSameDay(bookingDate, today)) {
        // For today's bookings, only include if the booking time hasn't passed
        const bookingTime = booking.booking_time
        if (bookingTime) {
          const [timeStr] = bookingTime.split(' - ') // Get start time
          const [hours, minutes] = timeStr.replace(/[AP]M/, '').trim().split(':').map(Number)
          const isPM = bookingTime.includes('PM') && hours !== 12
          const is12AM = bookingTime.includes('AM') && hours === 12
          
          const bookingDateTime = new Date(bookingDate)
          bookingDateTime.setHours(
            is12AM ? 0 : isPM ? hours + 12 : hours,
            minutes || 0,
            0,
            0
          )
          
          return bookingDateTime > now
        }
        return true // If no time info, include it
      }
      // For future dates, include all
      return bookingDate > today
    })
    
    const upcomingCount = futureBookings.length
    const totalAmount = futureBookings.reduce(
      (sum, booking) => sum + (parseFloat(booking.total_amount.toString()) || 0),
      0
    )
    const confirmedCount = futureBookings.filter(
      (b) => b.status === 'confirmed'
    ).length
    const pendingCount = futureBookings.filter(
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

    // Calculate previous today's bookings for trend comparison
    const yesterdayDate = new Date(today)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const previousTodayBookings = allBookings.filter((booking) =>
      isSameDay(parseISO(booking.booking_date), yesterdayDate)
    )
    const previousTodayCount = previousTodayBookings.length

    // Calculate percentage changes
    const todayChange =
      previousTodayCount > 0
        ? ((todayCount - previousTodayCount) / previousTodayCount) * 100
        : todayCount > 0
          ? 100
          : 0

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
      todayChange,
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
    todayChange,
    upcomingChange,
    amountChange,
    confirmedChange,
    pendingChange,
  } = getBookingStats()

  // Main component render with comprehensive booking management interface
  return (
    <div className="container py-6">
      {/* 
        PAGE HEADER SECTION
        - Animated page title with gradient text
        - Quick action button for booking new services
        - Responsive layout for mobile and desktop
      */}
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

      {/* 
        STATISTICS CARDS SECTION
        - 5 responsive cards showing booking metrics
        - Today's bookings, upcoming, total value, pending, confirmed counts
        - Trend indicators with percentage changes
        - Animated hover effects and gradient backgrounds
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {/* TODAY'S BOOKINGS CARD */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-green-50/60 transition-all duration-300 hover:shadow-md dark:border-emerald-800/50 dark:from-emerald-950/50 dark:to-green-950/30">
            <CardContent className="flex h-full flex-col p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 dark:bg-emerald-400/20">
                  <CalendarIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80 truncate">
                  Today's Bookings
                </p>
              </div>
              <div className="mt-auto flex items-baseline gap-2">
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {todayCount}
                </div>
                {todayChange !== 0 && (
                  <div
                    className={`flex items-center text-xs ${todayChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {todayChange > 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {Math.abs(todayChange).toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* UPCOMING BOOKINGS CARD */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 transition-all duration-300 hover:shadow-md dark:border-blue-800/50 dark:from-blue-950/50 dark:to-indigo-950/30">
            <CardContent className="flex h-full flex-col p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 dark:bg-blue-400/20">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80 truncate">
                  Upcoming Bookings
                </p>
              </div>
              <div className="mt-auto flex items-baseline gap-2">
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* TOTAL BOOKING VALUE CARD */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-purple-200/50 bg-gradient-to-br from-purple-50/80 to-violet-50/60 transition-all duration-300 hover:shadow-md dark:border-purple-800/50 dark:from-purple-950/50 dark:to-violet-950/30">
            <CardContent className="flex h-full flex-col p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 dark:bg-purple-400/20">
                  <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-purple-700/80 dark:text-purple-300/80 truncate">
                  Upcoming Booking Value
                </p>
              </div>
              <div className="mt-auto flex items-baseline gap-2">
                <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
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
            </CardContent>
          </Card>
        </motion.div>
        
        {/* PENDING BOOKINGS CARD */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-orange-50/60 transition-all duration-300 hover:shadow-md dark:border-amber-800/50 dark:from-amber-950/50 dark:to-orange-950/30">
            <CardContent className="flex h-full flex-col p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 dark:bg-amber-400/20">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 truncate">
                  Pending Bookings
                </p>
              </div>
              <div className="mt-auto flex items-baseline gap-2">
                <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                  {pendingCount}
                </div>
                {pendingChange !== 0 && (
                  <div
                    className={`flex items-center text-xs ${pendingChange > 0 ? 'text-green-600 dark:text-green-400': 'text-red-600 dark:text-red-400' }`}
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
            </CardContent>
          </Card>
        </motion.div>

        {/* CONFIRMED BOOKINGS CARD */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card className="group h-full border border-green-200/50 bg-gradient-to-br from-green-50/80 to-emerald-50/60 transition-all duration-300 hover:shadow-md dark:border-green-800/50 dark:from-green-950/50 dark:to-emerald-950/30">
            <CardContent className="flex h-full flex-col p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15 dark:bg-green-400/20">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs font-medium text-green-700/80 dark:text-green-300/80 truncate">
                  Confirmed Bookings
                </p>
              </div>
              <div className="mt-auto flex items-baseline gap-2">
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
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
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ERROR MESSAGE DISPLAY */}
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

      {/* MAIN CONTENT AREA */}
      <div className="space-y-6">
        {/* CALENDAR SECTION */}
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
              <div className="overflow-x-auto" role="region" aria-label="Booking calendar">
                <FullCalendarBookings
                  events={allBookings.map((b) => {
                    console.log('Mapping booking to calendar event:', b);
                    const event = {
                      id: b.id,
                      date: b.booking_date, // Use the string date directly
                      time: b.booking_time,
                      title: b.service?.title ?? 'Booking',
                      category: b.service?.category || 'General',
                      status: b.status,
                      meta: { booking: b },
                    } as CalendarEvent
                    console.log('Created calendar event:', event);
                    return event
                  })}
                  initialDate={date}
                  onSelectDate={(d) => {
                    console.log('Calendar date selected:', d)
                    handleDateSelect(d)
                  }}
                  onSelectEvent={(e) => {
                    console.log('Calendar event selected:', e)
                    const be = e.meta?.booking as BookingEvent | undefined
                    if (be) {
                      setSelectedBooking(be)
                      setIsDialogOpen(true)
                    }
                  }}
                  filters={{ statuses: activeStatuses }}
                  onChangeFilters={(f) => {
                    console.log('Filters changed:', f)
                    setActiveStatuses(f.statuses)
                  }}
                  className="w-full"
                />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-300"></div>
                    <span>Selected date</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary border border-primary/50"></div>
                    <span>Today</span>
                  </div>
                </div>
                
                {/* Status Colors Legend */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Booking Status Colors:</div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-orange-500 border border-orange-500"></div>
                      <span className="text-orange-500">Pending</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-green-500 border border-green-500"></div>
                      <span className="text-green-500">Confirmed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-blue-500 border border-blue-500"></div>
                      <span className="text-blue-500">Completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded bg-red-500 border border-red-500"></div>
                      <span className="text-red-500">Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* BOOKINGS TABS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="today" className="space-y-4">
            {/* TABS HEADER WITH SEARCH */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              {/* TAB NAVIGATION BUTTONS */}
              {/* Reduced font size of header tabs */}
              <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2 text-sm">
                <TabsTrigger
                  ref={todayTabRef}
                  value="today"
                  aria-label="Selected Date Bookings tab (Ctrl+Shift+Left Arrow to navigate)"
                  className="text-sm transition-all duration-200 ease-in-out"
                >
                  Selected Date Bookings
                </TabsTrigger>
                <TabsTrigger
                  ref={upcomingTabRef}
                  value="upcoming"
                  aria-label="Upcoming Bookings tab (Ctrl+Shift+Right Arrow to navigate)"
                  className="text-sm transition-all duration-200 ease-in-out"
                >
                  Upcoming Bookings
                </TabsTrigger>
              </TabsList>
              {/* SEARCH BAR */}
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

            {/* TODAY'S BOOKINGS TAB CONTENT */}
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

            {/* UPCOMING BOOKINGS TAB CONTENT */}
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
                        unoptimized={selectedBooking.service.image?.startsWith('http') || false}
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
                        <motion.div
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-medium transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:hover:bg-primary/20 dark:hover:text-primary-foreground dark:hover:border-primary/50 dark:hover:shadow-primary/30"
                          >
                            {selectedBooking.service.category}
                          </Badge>
                        </motion.div>
                        {/* Display booking type in modal with improved hover effect */}
                        <motion.div
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          <Badge className={`${getBookingTypeStyle(selectedBooking.booking_type || 'normal')} ${getBookingTypeHoverStyle(selectedBooking.booking_type || 'normal')} flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-300 cursor-pointer border`}>
                            {selectedBooking.booking_type || 'normal'}
                          </Badge>
                        </motion.div>
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
