"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  DollarSign,
  Info,
  X
} from 'lucide-react'
import { format, addDays, isBefore, startOfDay, parse, isSameDay } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { customerApi } from '@/services/customer.api'
import { bookingsApi } from '@/services/api'
import { showToast } from '@/components/ui/enhanced-toast'
import { cn } from '@/lib/utils'

// Types for reschedule data
interface RescheduleSlot {
  id: number
  date: string
  start_time: string
  end_time: string
  slot_type: string
  is_rush: boolean
  rush_fee_percentage: number
  calculated_price: number
  provider_note: string
  current_bookings: number
  max_bookings: number
  is_fully_booked: boolean
}

interface RescheduleOptions {
  current_booking: {
    id: number
    date: string
    time: string
    slot_type: string
    total_amount: number
    express_fee: number
  }
  available_slots: RescheduleSlot[]
  date_range: {
    start_date: string
    end_date: string
  }
  service_id: number
}

interface PriceCalculation {
  current_price: number
  new_price: number
  price_difference: number
  is_upgrade: boolean
  is_downgrade: boolean
  is_same_price: boolean
  new_slot: {
    id: number
    date: string
    start_time: string
    end_time: string
    slot_type: string
    is_rush: boolean
    rush_fee_percentage: number
  }
}

interface RescheduleModalProps {
  isOpen: boolean
  bookingId: number | null
  onClose: () => void
  onSuccess: () => void
}

// Common reschedule reasons - static to prevent recreation
const RESCHEDULE_REASONS = [
  "Schedule conflict",
  "Change of plans", 
  "Found a better time",
  "Emergency came up",
  "Weather conditions",
  "Other"
] as const

export default function RescheduleModal({ isOpen, bookingId, onClose, onSuccess }: RescheduleModalProps) {
  // Local state for modal - completely isolated from parent
  const [rescheduleOptions, setRescheduleOptions] = useState<RescheduleOptions | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<RescheduleSlot | null>(null)
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState("")
  const [showCustomReason, setShowCustomReason] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && !isProcessing) {
      setRescheduleOptions(null)
      setSelectedDate(undefined)
      setSelectedSlot(null)
      setPriceCalculation(null)
      setRescheduleReason("")
      setShowCustomReason(false)
      setIsLoading(false)
      setIsLoadingSlots(false)
      setIsProcessing(false)
      setError(null)
      onClose()
    }
  }, [isProcessing, onClose])

  // Fetch reschedule options when modal opens
  useEffect(() => {
    if (isOpen && bookingId) {
      fetchRescheduleOptions()
    }
  }, [isOpen, bookingId])

  // Fetch booking details and initialize reschedule options
  const fetchRescheduleOptions = useCallback(async () => {
    if (!bookingId) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Get the booking details to get the service ID and current booking info
      const booking = await bookingsApi.getBookingById(bookingId)
      // Extract service ID - it could be a number or an object
      const serviceId = typeof booking.service === 'object' ? booking.service.id : booking.service
      
      // Create the reschedule options structure with empty slots initially
      const options = {
        current_booking: {
          id: booking.id,
          date: booking.booking_date,
          time: booking.booking_time,
          slot_type: booking.booking_slot?.slot_type || 'normal',
          total_amount: booking.total_amount,
          express_fee: booking.express_fee || 0
        },
        available_slots: [], // Will be populated when date is selected
        date_range: {
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        service_id: serviceId // Store service ID for fetching slots
      }
      
      
      setRescheduleOptions(options)
    } catch (error: any) {
      console.error('Error fetching reschedule options:', error)
      setError(error.message || 'Failed to load reschedule options')
      showToast.error({
        title: "Failed to Load Options",
        description: error.message || "Couldn't load available reschedule options. Please try again.",
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }, [bookingId])

  // Fetch slots for a specific date (similar to booking page)
  const fetchSlotsForDate = useCallback(async (date: Date) => {
    if (!rescheduleOptions?.service_id) {
      return
    }

    try {
      setIsLoadingSlots(true)
      const dateStr = format(date, 'yyyy-MM-dd')
      
      const slotsData = await bookingsApi.getAvailableSlots(rescheduleOptions.service_id, dateStr)
      
      // Handle different response structures
      let actualSlots = slotsData
      if (slotsData && typeof slotsData === 'object' && !Array.isArray(slotsData)) {
        // If response is an object, check for common property names
        actualSlots = slotsData.slots || slotsData.results || slotsData.data || []
      }
      
      if (actualSlots && Array.isArray(actualSlots) && actualSlots.length > 0) {
        // Transform the slots to match our interface
        const transformedSlots = actualSlots.map((slot: any) => ({
          id: slot.id,
          date: dateStr,
          start_time: slot.start_time,
          end_time: slot.end_time,
          slot_type: slot.slot_type || 'normal',
          is_rush: slot.is_rush || false,
          rush_fee_percentage: slot.rush_fee_percentage || 0,
          calculated_price: slot.calculated_price || slot.price || 0,
          provider_note: slot.provider_note || '',
          current_bookings: slot.current_bookings || 0,
          max_bookings: slot.max_bookings || 1,
          is_fully_booked: slot.is_fully_booked || false
        }))
        
        // Update the available slots in the options
        setRescheduleOptions(prev => prev ? {
          ...prev,
          available_slots: transformedSlots
        } : null)
      } else {
        // No slots available for this date
        setRescheduleOptions(prev => prev ? {
          ...prev,
          available_slots: []
        } : null)
      }
    } catch (error) {
      console.error('Error fetching slots for date:', error)
      // Set empty slots on error
      setRescheduleOptions(prev => prev ? {
        ...prev,
        available_slots: []
      } : null)
    } finally {
      setIsLoadingSlots(false)
    }
  }, [rescheduleOptions?.service_id])

  // Fetch slots when date is selected
  useEffect(() => {
    if (selectedDate && rescheduleOptions?.service_id) {
      fetchSlotsForDate(selectedDate)
    }
  }, [selectedDate, fetchSlotsForDate])

  // Calculate price when slot is selected
  useEffect(() => {
    if (selectedSlot && bookingId) {
      calculatePrice()
    } else {
      setPriceCalculation(null)
    }
  }, [selectedSlot, bookingId])

  // Calculate price difference for selected slot
  const calculatePrice = useCallback(async () => {
    if (!selectedSlot || !bookingId) return

    try {
      const calculation = await customerApi.calculateReschedulePrice(bookingId, selectedSlot.id)
      setPriceCalculation(calculation)
    } catch (error: any) {
      console.error('Price calculation failed:', error)
      // Don't show error toast for price calculation failures
      setPriceCalculation(null)
    }
  }, [selectedSlot, bookingId])

  // Handle date selection
  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedSlot(null) // Clear selected slot when date changes
    setPriceCalculation(null)
  }, [])

  // Handle slot selection
  const handleSlotSelect = useCallback((slot: RescheduleSlot) => {
    setSelectedSlot(slot)
  }, [])

  // Handle reason selection
  const handleReasonSelect = useCallback((selectedReason: string) => {
    if (isProcessing) return
    
    if (selectedReason === "Other") {
      setShowCustomReason(true)
      setRescheduleReason("")
    } else {
      setRescheduleReason(selectedReason)
      setShowCustomReason(false)
    }
  }, [isProcessing])

  // Handle custom reason input
  const handleCustomReasonChange = useCallback((value: string) => {
    if (isProcessing) return
    setRescheduleReason(value)
  }, [isProcessing])

  // Handle reschedule submission
  const handleReschedule = useCallback(async () => {
    if (!bookingId || !selectedSlot || isProcessing) return

    try {
      setIsProcessing(true)
      const result = await customerApi.rescheduleBooking(
        bookingId, 
        selectedSlot.id, 
        rescheduleReason.trim() || undefined
      )
      
      showToast.success({
        title: "📅 Booking Rescheduled!",
        description: `Your booking has been successfully rescheduled to ${format(new Date(selectedSlot.date), 'MMM d, yyyy')} at ${selectedSlot.start_time}. Check your updated details! 🕒`,
        duration: 5000
      })
      
      onSuccess()
      handleOpenChange(false)
    } catch (error: any) {
      showToast.error({
        title: "🚫 Reschedule Failed!",
        description: error.message || "Couldn't reschedule your booking. Please try again or contact support! 🆘",
        duration: 5000
      })
    } finally {
      setIsProcessing(false)
    }
  }, [bookingId, selectedSlot, rescheduleReason, isProcessing, onSuccess, handleOpenChange])

  // Get available dates from reschedule options
  const availableDates = useMemo(() => {
    if (!rescheduleOptions) return []
    
    const dates = new Set<string>()
    rescheduleOptions.available_slots.forEach(slot => {
      dates.add(slot.date)
    })
    
    return Array.from(dates)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime())
  }, [rescheduleOptions])

  // Get slots for selected date
  const dateSlots = useMemo(() => {
    if (!rescheduleOptions || !selectedDate) {
      return []
    }
    
    // Since we fetch slots for the selected date, we can just return the available slots
    // They should already be filtered for the selected date
    return rescheduleOptions.available_slots.sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [selectedDate, rescheduleOptions])

  // Helper function to convert 24hr time to 12hr format
  const formatTime12Hr = useCallback((time24: string) => {
    try {
      const [hours, minutes] = time24.split(':')
      const hour24 = parseInt(hours, 10)
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      return `${hour12}:${minutes} ${ampm}`
    } catch {
      return time24 // fallback to original if parsing fails
    }
  }, [])

  // Validation
  const isFormValid = selectedSlot && rescheduleReason.trim()

  if (!isOpen || !bookingId) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col bg-background dark:bg-background border-border/50 dark:border-border/30">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative p-6 pb-4 bg-gradient-to-br from-blue-500/8 via-background/80 to-background dark:from-blue-500/15 dark:via-background/60 dark:to-background"
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-foreground dark:text-foreground flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="flex-shrink-0 p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 dark:bg-blue-500/20 dark:border-blue-400/40"
              >
                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </motion.div>
              Reschedule Booking #{bookingId}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground dark:text-muted-foreground pl-10">
              Select a new date and time for your booking. Price differences will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
        </motion.div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground">Loading available options...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-foreground">Failed to Load Options</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchRescheduleOptions}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : rescheduleOptions ? (
            <div className="space-y-6">
              {/* Current Booking Info */}
              <Card className="bg-muted/30 dark:bg-muted/15 border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Current Booking</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(rescheduleOptions.current_booking.date), 'MMM d, yyyy')} at {formatTime12Hr(rescheduleOptions.current_booking.time)} • 
                        {rescheduleOptions.current_booking.slot_type.charAt(0).toUpperCase() + rescheduleOptions.current_booking.slot_type.slice(1)} • 
                        NPR {rescheduleOptions.current_booking.total_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left Side - Date & Time Selection */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                      Select New Date & Time
                    </h3>
                    
                    {/* Calendar */}
                    <div className="space-y-4">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => isBefore(date, startOfDay(new Date()))}
                        className="rounded-lg border"
                      />

                      {/* Time Slots */}
                      {selectedDate ? (
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            Available Time Slots
                            {isLoadingSlots && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                          </h4>
                          
                          {isLoadingSlots ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                              <p className="font-medium">Loading time slots...</p>
                              <p className="text-sm">Please wait while we fetch available slots</p>
                            </div>
                          ) : dateSlots.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                              {dateSlots.slice(0, 6).map((slot) => (
                                <Button
                                  key={slot.id}
                                  variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                  className={cn(
                                    "h-20 flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 p-1",
                                    selectedSlot?.id === slot.id && "ring-2 ring-blue-500 ring-offset-2",
                                    slot.slot_type === 'urgent' && "border-orange-500 bg-orange-50/50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-900/30",
                                    slot.slot_type === 'emergency' && "border-red-500 bg-red-50/50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                                  )}
                                  onClick={() => handleSlotSelect(slot)}
                                >
                                  <span className="font-medium text-sm">
                                    {formatTime12Hr(slot.start_time)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    NPR {slot.calculated_price.toLocaleString()}
                                  </span>
                                  {slot.slot_type && slot.slot_type !== 'normal' && (
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "mt-1 px-1.5 py-0.5 text-xs",
                                        slot.slot_type === 'urgent' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
                                        slot.slot_type === 'emergency' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                      )}
                                    >
                                      {slot.slot_type.charAt(0).toUpperCase() + slot.slot_type.slice(1)}
                                    </Badge>
                                  )}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="font-medium">No slots available for this date</p>
                              <p className="text-sm">Try selecting another date</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Select a date to view available time slots</p>
                          <p className="text-sm">Choose a date from the calendar above</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Price & Reason */}
                <div className="space-y-4">
                  {/* Top Row - Price Comparison and Reason Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Price Comparison */}
                    {priceCalculation && (
                      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200/50 dark:border-green-700/50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800 dark:text-green-200">
                            <DollarSign className="h-4 w-4" />
                            Price Comparison
                          </h4>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Current Price:</span>
                              <span className="font-medium">NPR {priceCalculation.current_price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>New Price:</span>
                              <span className="font-medium">NPR {priceCalculation.new_price.toLocaleString()}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold">
                              <span>Difference:</span>
                              <span className={cn(
                                priceCalculation.is_upgrade && "text-orange-600 dark:text-orange-400",
                                priceCalculation.is_downgrade && "text-green-600 dark:text-green-400",
                                priceCalculation.is_same_price && "text-muted-foreground"
                              )}>
                                {priceCalculation.is_upgrade && "+"}
                                {priceCalculation.is_downgrade && "-"}
                                {priceCalculation.is_same_price && "No change"}
                                {!priceCalculation.is_same_price && `NPR ${Math.abs(priceCalculation.price_difference).toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Reschedule Reason */}
                    <div>
                      <h4 className="font-medium mb-3">Reason for Rescheduling</h4>
                      
                      <div className="grid gap-2">
                        {RESCHEDULE_REASONS.map((reasonOption, index) => {
                          const isSelected = reasonOption === "Other" ? showCustomReason : rescheduleReason === reasonOption
                        
                        return (
                          <motion.label 
                            key={reasonOption}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer group transition-all duration-200 ${
                              isSelected 
                                ? 'bg-primary/10 border-primary/40 shadow-sm dark:bg-primary/15 dark:border-primary/50' 
                                : 'border-border/50 hover:border-primary/40 hover:bg-primary/5 dark:border-border/30 dark:hover:border-primary/40 dark:hover:bg-primary/10'
                            }`}
                            onClick={() => handleReasonSelect(reasonOption)}
                          >
                            <div className="flex items-center justify-center">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                                isSelected 
                                  ? 'border-primary bg-primary dark:border-primary dark:bg-primary' 
                                  : 'border-muted-foreground/40 group-hover:border-primary/60 dark:border-muted-foreground/50 dark:group-hover:border-primary/70'
                              }`}>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground dark:text-primary-foreground" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            
                            <span className={`text-sm font-medium select-none transition-colors duration-200 ${
                              isSelected 
                                ? 'text-foreground dark:text-foreground' 
                                : 'text-muted-foreground group-hover:text-foreground dark:text-muted-foreground dark:group-hover:text-foreground'
                            }`}>
                              {reasonOption}
                            </span>
                          </motion.label>
                        )
                      })}
                    </div>
                    
                    {/* Custom reason input */}
                    <AnimatePresence>
                      {showCustomReason && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pt-2"
                        >
                          <Textarea
                            placeholder="Please specify your reason..."
                            value={rescheduleReason}
                            onChange={(e) => handleCustomReasonChange(e.target.value)}
                            className="min-h-[80px] text-sm rounded-lg border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-background dark:bg-background dark:border-border/30 dark:focus:border-primary/60 dark:focus:ring-primary/25"
                            autoFocus
                            disabled={isProcessing}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Bottom Section - Additional Time Slots Display */}
                  {selectedDate && dateSlots.length > 6 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        More Available Slots
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                        {dateSlots.slice(6).map((slot) => (
                          <Button
                            key={slot.id}
                            variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                            className={cn(
                              "h-16 flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 p-1",
                              selectedSlot?.id === slot.id && "ring-2 ring-blue-500 ring-offset-2",
                              slot.slot_type === 'urgent' && "border-orange-500 bg-orange-50/50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-900/30",
                              slot.slot_type === 'emergency' && "border-red-500 bg-red-50/50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                            )}
                            onClick={() => handleSlotSelect(slot)}
                          >
                            <span className="font-medium text-xs">
                              {formatTime12Hr(slot.start_time)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              NPR {slot.calculated_price.toLocaleString()}
                            </span>
                            {slot.slot_type && slot.slot_type !== 'normal' && (
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "mt-1 px-1 py-0.5 text-xs",
                                  slot.slot_type === 'urgent' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
                                  slot.slot_type === 'emergency' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                )}
                              >
                                {slot.slot_type.charAt(0).toUpperCase() + slot.slot_type.slice(1)}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-6 pt-4 bg-muted/30 dark:bg-muted/15 border-t border-border/30 dark:border-border/20">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-3">
            <Button 
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isProcessing}
              className="h-10 px-6 text-sm rounded-lg border border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200 dark:border-border/50 dark:hover:bg-primary/20 dark:hover:border-primary/70 dark:hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReschedule}
              disabled={!isFormValid || isProcessing}
              className="h-10 px-6 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-500/30 active:scale-95"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rescheduling...
                </div>
              ) : isFormValid ? (
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Confirm Reschedule
                </div>
              ) : (
                "Select Date, Time & Reason"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
