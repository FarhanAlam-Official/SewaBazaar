"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { servicesApi, reviewsApi, bookingsApi } from '@/services/api'
import { showToast } from '@/components/ui/enhanced-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  Shield, 
  Calendar as CalendarIcon,
  Clock,
  Zap,
  Package,
  CreditCard,
  CheckCircle2,
  Award,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Star,
  Info,
  X,
  User
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, isBefore, startOfDay, parse, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

// Import enhanced types
import { 
  EnhancedServiceDetail, 
  DetailedReview, 
  ReviewSummary, 
  BookingSlot, 
  BookingFormData,
  ServicePackageTier 
} from '@/types/service-detail'

// Enhanced Booking Form Component
interface EnhancedBookingFormProps {
   service: EnhancedServiceDetail
   selectedSlot: BookingSlot | null
   selectedDate: Date | undefined
   availableSlots: BookingSlot[]
   slotTypeFilter: 'all' | 'normal' | 'express' | 'urgent' | 'emergency'
   isLoading: boolean
   basePrice: number
   expressFee: number
   totalPrice: number
   formData: Partial<BookingFormData>
   onSlotSelect: (slot: BookingSlot) => void
   onDateSelect: (date: Date | undefined) => void
   onSlotTypeFilterChange: (filter: 'all' | 'normal' | 'express' | 'urgent' | 'emergency') => void
   onFormDataChange: (data: Partial<BookingFormData>) => void
   onBookingSubmit: (data: BookingFormData) => void
   onMessageProvider: () => void
 }

function EnhancedBookingForm({
   service,
   selectedSlot,
   selectedDate,
   availableSlots,
   slotTypeFilter,
   isLoading,
   basePrice,
   expressFee,
   totalPrice,
   formData,
   onSlotSelect,
   onDateSelect,
   onSlotTypeFilterChange,
   onFormDataChange,
   onBookingSubmit,
   onMessageProvider
 }: EnhancedBookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false)
  
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
  
  // Available dates (next 31 days from today to ensure we include October 1st)
  const availableDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Generate dates for the next 31 days
    const dates = [];
    for (let i = 0; i < 31; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, []);

  // Get time slots for selected date with filtering
  const dateSlots = useMemo(() => {
    if (!selectedDate) return []
    
    return availableSlots.filter(slot => {
      const slotDate = new Date(slot.date)
      const matchesDate = isSameDay(slotDate, selectedDate)
      
      if (!matchesDate) return false
      
      // Apply slot type filter
      switch (slotTypeFilter) {
        case 'normal':
          return slot.slot_type === 'normal'
        case 'express':
          return slot.slot_type === 'express'
        case 'urgent':
          return slot.slot_type === 'urgent'
        case 'emergency':
          return slot.slot_type === 'emergency'
        case 'all':
        default:
          return true
      }
    })
  }, [availableSlots, selectedDate, slotTypeFilter])

  // Auto-select tomorrow's date if no date is selected (since slots start tomorrow)
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      // Start with tomorrow if today has no slots
      const tomorrow = addDays(new Date(), 1)
      if (availableDates.some(date => isSameDay(date, tomorrow))) {
        onDateSelect(tomorrow)
      } else {
        onDateSelect(availableDates[0])
      }
    }
  }, [selectedDate, availableDates, onDateSelect])

  // Update form data helper
  const updateFormData = useCallback((updates: Partial<BookingFormData>) => {
    onFormDataChange({ ...formData, ...updates })
  }, [formData, onFormDataChange])

  // Handle booking submission
  const handleSubmit = useCallback(() => {
    if (!selectedSlot) return

    // Determine express mode and type based on selected slot
    const isExpressSlot = selectedSlot?.slot_type === 'urgent' || selectedSlot?.slot_type === 'emergency' || selectedSlot?.slot_type === 'express'
    const expressType = selectedSlot?.slot_type === 'urgent' ? 'urgent' : 
                       selectedSlot?.slot_type === 'emergency' ? 'emergency' : 
                       'standard'

    const completeFormData: BookingFormData = {
      service_id: service.id,
      preferred_date: selectedSlot.date,
      preferred_time: selectedSlot.start_time,
      special_instructions: formData.special_instructions || '',
      address: formData.address || '',
      city: formData.city || '',
      phone: formData.phone || '',
      is_express: isExpressSlot,
      express_type: expressType
    }

    onBookingSubmit(completeFormData)
  }, [selectedSlot, service.id, formData.special_instructions, formData.address, formData.city, formData.phone, onBookingSubmit])

  // Validation
  const isFormValid = selectedSlot && formData.address && formData.city && formData.phone

  // Skeleton loader for time slots
  const TimeSlotSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="p-5 rounded-lg border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 min-h-[100px]">
          <div className="flex flex-col items-start space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-3 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Booking Steps and Service Selection */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Booking Steps */}
            <div className="lg:col-span-2 space-y-6">
              {/* Slot Type Filter */}
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Select Slot Type
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Button
                    variant={slotTypeFilter === 'all' ? "default" : "outline"}
                    onClick={() => onSlotTypeFilterChange('all')}
                    className={cn(
                      "flex flex-col items-center justify-center h-auto py-3 gap-1",
                      slotTypeFilter === 'all' && "border-violet-500 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-600"
                    )}
                  >
                    <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                    <span className="text-sm font-medium">All Slots</span>
                  </Button>
                  
                  <Button
                    variant={slotTypeFilter === 'normal' ? "default" : "outline"}
                    onClick={() => onSlotTypeFilterChange('normal')}
                    className={cn(
                      "flex flex-col items-center justify-center h-auto py-3 gap-1",
                      slotTypeFilter === 'normal' && "border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-200 dark:border-green-600"
                    )}
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Normal</span>
                  </Button>
                  
                  <Button
                    variant={slotTypeFilter === 'express' ? "default" : "outline"}
                    onClick={() => onSlotTypeFilterChange('express')}
                    className={cn(
                      "flex flex-col items-center justify-center h-auto py-3 gap-1",
                      slotTypeFilter === 'express' && "border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-600"
                    )}
                  >
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium">Express</span>
                  </Button>
                  
                  <Button
                    variant={slotTypeFilter === 'urgent' ? "default" : "outline"}
                    onClick={() => onSlotTypeFilterChange('urgent')}
                    className={cn(
                      "flex flex-col items-center justify-center h-auto py-3 gap-1",
                      slotTypeFilter === 'urgent' && "border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-600"
                    )}
                  >
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium">Urgent</span>
                  </Button>
                  
                  <Button
                    variant={slotTypeFilter === 'emergency' ? "default" : "outline"}
                    onClick={() => onSlotTypeFilterChange('emergency')}
                    className={cn(
                      "flex flex-col items-center justify-center h-auto py-3 gap-1",
                      slotTypeFilter === 'emergency' && "border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-200 dark:border-red-600"
                    )}
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">Emergency</span>
                  </Button>
                </div>

                {/* Slot Type Descriptions */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {slotTypeFilter === 'normal' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">Normal Slots</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Standard service hours with regular pricing</p>
                      </div>
                    </div>
                  )}
                  {slotTypeFilter === 'express' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mt-1 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">Express Slots</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Afternoon hours with priority service (+50% fee)</p>
                      </div>
                    </div>
                  )}
                  {slotTypeFilter === 'urgent' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mt-1 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">Urgent Slots</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Late evening hours with high priority (+75% fee)</p>
                      </div>
                    </div>
                  )}
                  {slotTypeFilter === 'emergency' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">Emergency Slots</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Night hours with immediate response (+100% fee)</p>
                      </div>
                    </div>
                  )}
                  {slotTypeFilter === 'all' && (
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-slate-500 mt-1 flex-shrink-0"></div>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">All Slots</span>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Showing all available time slots</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CalendarIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Select Date
                </h3>
                
                {/* Calendar */}
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>


            </div>

            {/* Right Side - Service Details */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Service Details
                </h3>

                <div className="space-y-5">
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-700 dark:text-slate-300 font-medium">Service Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your full address where the service should be performed"
                      value={formData.address || ''}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className="min-h-[100px] border-slate-300 focus:border-violet-500 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-slate-700 dark:text-slate-300 font-medium">City *</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city || ''}
                        onChange={(e) => updateFormData({ city: e.target.value })}
                        className="border-slate-300 focus:border-violet-500 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="Phone number"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData({ phone: e.target.value })}
                        className="border-slate-300 focus:border-violet-500 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg h-12"
                        required
                      />
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="instructions" className="text-slate-700 dark:text-slate-300 font-medium">Special Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Any specific requirements or instructions for the service provider"
                      value={formData.special_instructions || ''}
                      onChange={(e) => updateFormData({ special_instructions: e.target.value })}
                      rows={4}
                      className="border-slate-300 focus:border-violet-500 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots Section - Full Width Below Service Details */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Available Time Slots - {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {dateSlots.length} slots available
                </div>
              </div>
              
              {dateSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dateSlots.map((slot) => (
                    <motion.button
                      key={slot.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSlotSelect(slot)}
                      disabled={!slot.is_available || slot.is_fully_booked}
                      className={cn(
                        "p-5 rounded-lg border text-sm font-medium transition-all duration-200 hover:shadow-md relative overflow-hidden min-h-[100px]",
                        slot.is_available && !slot.is_fully_booked
                          ? selectedSlot?.id === slot.id
                            ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-600 shadow-md"
                            : "border-slate-200 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:hover:border-violet-500 dark:hover:bg-violet-950/20 dark:hover:text-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500",
                        // Slot type specific styling
                        slot.slot_type === 'normal' && selectedSlot?.id !== slot.id && "hover:bg-green-50 dark:hover:bg-green-950/20",
                        slot.slot_type === 'express' && selectedSlot?.id !== slot.id && "hover:bg-purple-50 dark:hover:bg-purple-950/20",
                        slot.slot_type === 'urgent' && selectedSlot?.id !== slot.id && "hover:bg-orange-50 dark:hover:bg-orange-950/20",
                        slot.slot_type === 'emergency' && selectedSlot?.id !== slot.id && "hover:bg-red-50 dark:hover:bg-red-950/20"
                      )}
                    >
                      {/* Slot type indicator bar */}
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-1",
                        slot.slot_type === 'normal' && "bg-green-500",
                        slot.slot_type === 'express' && "bg-purple-500",
                        slot.slot_type === 'urgent' && "bg-orange-500",
                        slot.slot_type === 'emergency' && "bg-red-500"
                      )}></div>
                      
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{formatTime12Hr(slot.start_time)} - {formatTime12Hr(slot.end_time)}</span>
                        
                        {/* Slot type tag below time */}
                        <div className="mt-2">
                          <Badge className={cn(
                            "text-xs px-2 py-1 font-medium transition-all duration-300 hover:scale-105 transform cursor-pointer",
                            slot.slot_type === 'normal' && "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 hover:bg-green-200 hover:text-green-900 dark:hover:bg-green-800 dark:hover:text-green-100 hover:shadow-md",
                            slot.slot_type === 'express' && "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 hover:bg-purple-200 hover:text-purple-900 dark:hover:bg-purple-800 dark:hover:text-purple-100 hover:shadow-md",
                            slot.slot_type === 'urgent' && "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 hover:bg-orange-200 hover:text-orange-900 dark:hover:bg-orange-800 dark:hover:text-orange-100 hover:shadow-md",
                            slot.slot_type === 'emergency' && "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 hover:bg-red-200 hover:text-red-900 dark:hover:bg-red-800 dark:hover:text-red-100 hover:shadow-md"
                          )}>
                            {slot.slot_type ? slot.slot_type.charAt(0).toUpperCase() + slot.slot_type.slice(1) : 'Unknown'}
                          </Badge>
                        </div>
                        
                        {slot.provider_note && (
                          <div className="text-xs text-slate-500 text-left mt-2 line-clamp-2">
                            {slot.provider_note}
                          </div>
                        )}
                        {slot.is_fully_booked && (
                          <div className="text-xs text-red-500 text-left mt-1">
                            Fully Booked
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : isLoading ? (
                // Show skeleton loader when slots are being fetched
                <div className="py-6 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <TimeSlotSkeleton />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Clock className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">No Time Slots Available</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                      The provider hasn't set up availability for this service yet. Please contact them to schedule your booking.
                    </p>
                    <Button
                      variant="outline"
                      onClick={onMessageProvider}
                      className="border-slate-300 hover:border-violet-400 dark:border-slate-600 dark:hover:border-violet-500"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Provider
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Clock className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">No Available Slots</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                      No available time slots for the selected date. Please choose a different date to find available slots.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => onDateSelect(undefined)}
                      className="border-slate-300 hover:border-violet-400 dark:border-slate-600 dark:hover:border-violet-500"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Select Different Date
                    </Button>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Price Summary */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border-violet-200/50 dark:border-violet-700/50 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-lg font-semibold text-violet-800 dark:text-violet-200 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Booking Summary
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                    className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-violet-200/50 dark:border-violet-700/50">
                    <span className="text-slate-600 dark:text-slate-400">Service:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{service.title}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-violet-200/50 dark:border-violet-700/50">
                    <span className="text-slate-600 dark:text-slate-400">Date & Time:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedSlot.date && format(new Date(selectedSlot.date), 'MMM d, yyyy')} at {formatTime12Hr(selectedSlot.start_time)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-violet-200/50 dark:border-violet-700/50">
                    <span className="text-slate-600 dark:text-slate-400">Base Price:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{service.currency} {basePrice.toLocaleString()}</span>
                  </div>
                  
                  {expressFee > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b border-violet-200/50 dark:border-violet-700/50 text-purple-600 dark:text-purple-400">
                      <span>Express Fee ({selectedSlot?.slot_type === 'urgent' ? 'Urgent' : selectedSlot?.slot_type === 'emergency' ? 'Emergency' : 'Express'} - {(expressFee / basePrice * 100).toFixed(0)}%):</span>
                      <span className="font-medium">+{service.currency} {expressFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-violet-800 dark:text-violet-200">Total:</span>
                    <span className="text-lg font-bold text-violet-800 dark:text-violet-200">{service.currency} {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {showPriceBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-5 pt-5 border-t border-violet-200 dark:border-violet-700"
                    >
                      <div className="text-sm text-violet-700 dark:text-violet-300 space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Duration: {service.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Provider: {service.provider.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Payment: Secure payment processing</span>
                        </div>
                        {(selectedSlot?.slot_type === 'urgent' || selectedSlot?.slot_type === 'emergency' || selectedSlot?.slot_type === 'express') && (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>Express service: Priority scheduling and faster delivery</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          size="lg"
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Book Now - {service.currency} {totalPrice.toLocaleString()}
              {(selectedSlot?.slot_type === 'urgent' || selectedSlot?.slot_type === 'emergency' || selectedSlot?.slot_type === 'express') && <Zap className="ml-2 h-4 w-4" />}
            </>
          )}
        </Button>

        {/* Alternative Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={onMessageProvider}
            className="flex items-center gap-2 border-slate-300 hover:border-violet-400 dark:border-slate-600 dark:hover:border-violet-500 text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors duration-200 rounded-lg"
          >
            <MessageCircle className="h-4 w-4" />
            Message Provider
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>Money Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            <span>Quality Assured</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookServicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  
  // Enhanced State Management with useMemo and useCallback
  const [service, setService] = useState<EnhancedServiceDetail | null>(null)
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [slotTypeFilter, setSlotTypeFilter] = useState<'all' | 'normal' | 'express' | 'urgent' | 'emergency'>('all')
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    address: '',
    city: '',
    phone: '',
    special_instructions: '',
    is_express: false,
    express_type: 'standard'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  
  // Check for pre-selected slot type from query parameters
  useEffect(() => {
    const slotTypeParam = searchParams.get('slotType')
    if (slotTypeParam && ['normal', 'express', 'urgent', 'emergency'].includes(slotTypeParam)) {
      const slotType = slotTypeParam as 'normal' | 'express' | 'urgent' | 'emergency'
      setSlotTypeFilter(slotType)
      
      // Enable express mode for urgent/emergency slots
      if (slotType === 'urgent' || slotType === 'emergency') {
        setFormData(prev => ({
          ...prev,
          is_express: true,
          express_type: slotType
        }))
      }
    }
  }, [searchParams])
  
     // Calculate pricing with express fees using useMemo for performance
   const basePrice = useMemo(() => service?.packages[0]?.price || 0, [service])
   
   // Express fee calculation
   const expressMultipliers = useMemo(() => ({
     standard: 0.5,   // 50%
     urgent: 0.75,    // 75%
     emergency: 1.0   // 100%
   }), [])
   
   const expressFee = useMemo(() => {
     // Determine if we should apply express fee based on slot type
     const isExpressSlot = selectedSlot?.slot_type === 'urgent' || selectedSlot?.slot_type === 'emergency' || selectedSlot?.slot_type === 'express'
     const expressType = selectedSlot?.slot_type === 'urgent' ? 'urgent' : 
                        selectedSlot?.slot_type === 'emergency' ? 'emergency' : 
                        'standard'
     
     return isExpressSlot ? basePrice * expressMultipliers[expressType] : 0
   }, [selectedSlot, basePrice, expressMultipliers])
   
   const totalPrice = useMemo(() => basePrice + expressFee, [basePrice, expressFee])
  
  // Debounce date selection to prevent excessive API calls with caching
  const [debouncedDate, setDebouncedDate] = useState<Date | undefined>(undefined)
  const [slotCache, setSlotCache] = useState<Record<string, BookingSlot[]>>({})
  
  // Reduce debounce delay from 300ms to 100ms for faster response
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDate(selectedDate)
    }, 100) // Reduced from 300ms to 100ms for faster response
    
    return () => clearTimeout(timer)
  }, [selectedDate])
  
  // Fetch slots when date changes (debounced)
  useEffect(() => {
    const fetchSlotsForDate = async () => {
      if (!service || !debouncedDate) return

      const dateStr = format(debouncedDate, 'yyyy-MM-dd')
      const cacheKey = `${service.id}-${dateStr}`
      
      // Check cache first
      if (slotCache[cacheKey]) {
        setAvailableSlots(slotCache[cacheKey])
        return
      }
      
      try {
        setSlotsLoading(true)
        // Add timeout to prevent hanging requests 
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
        
        // Fetch all slots - we want to show "No Available Slots" when none exist
        const slotsDataPromise = bookingsApi.getAvailableSlots(service.id, dateStr)
        
        // Use Promise.race to handle timeout, but properly distinguish between timeout and empty response
        let slotsData
        try {
          slotsData = await Promise.race([slotsDataPromise, timeoutPromise])
        } catch (raceError: any) {
          // Only show timeout error if it's actually a timeout
          if (raceError.message === 'Request timeout') {
            showToast.error({
              title: "Loading Taking Longer Than Expected",
              description: "The request took too long to complete. Please try again or select a different date.",
              duration: 5000
            })
          }
          throw raceError
        }
        
        // Check if we received an empty array (no slots available)
        if (Array.isArray(slotsData) && slotsData.length === 0) {
          // This is a valid response - no slots available for this date
          // Update cache with empty array and set available slots
          setSlotCache(prev => ({ ...prev, [cacheKey]: [] }))
          setAvailableSlots([])
          return
        }
        
        // Transform backend slots to frontend format (only if we have slots)
        const transformedSlots: BookingSlot[] = slotsData.map((slot: any) => ({
          id: slot.id?.toString() || `${slot.date}-${slot.start_time}`,
          service: slot.service,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available || true,
          max_bookings: slot.max_bookings || 1,
          current_bookings: slot.current_bookings || 0,
          is_fully_booked: slot.is_fully_booked || false,
          is_rush: slot.is_rush || false,
          rush_fee_percentage: slot.rush_fee_percentage || 0,
          slot_type: slot.slot_type || 'normal',
          provider_note: slot.provider_note || '',
          base_price_override: slot.base_price_override,
          calculated_price: slot.calculated_price,
          rush_fee_amount: slot.rush_fee_amount,
          created_at: slot.created_at,
          // Legacy compatibility
          price: slot.calculated_price || slot.base_price_override
        }))
        
        // Update cache
        setSlotCache(prev => ({ ...prev, [cacheKey]: transformedSlots }))
        setAvailableSlots(transformedSlots)
      } catch (slotError: any) {
        console.warn('Failed to fetch slots for date:', dateStr, slotError)
        
        // Handle timeout specifically
        if (slotError.message === 'Request timeout') {
          // Timeout error already handled above, no need to show toast again
        }
        // Check if it's an authentication error
        else if (slotError.response?.status === 403 || slotError.response?.status === 401) {
          console.warn('Authentication required for booking slots')
          // Don't show error toast for auth issues, just set empty slots
        } else if (slotError.response?.status === 400) {
          // Handle bad request errors (e.g., invalid date format)
          showToast.error({
            title: "Invalid Request",
            description: slotError.response.data.error || "Invalid request parameters.",
            duration: 5000
          })
        } else if (slotError.response?.status === 404) {
          // Handle not found errors (e.g., service not found)
          showToast.error({
            title: "Service Not Found",
            description: "The requested service could not be found.",
            duration: 5000
          })
        } else if (slotError.response?.status === 500) {
          // Handle server errors
          showToast.error({
            title: "Server Error",
            description: "An unexpected error occurred. Please try again later.",
            duration: 5000
          })
        } else if (slotError.message !== 'Request timeout') {
          // Handle other errors (but not timeout which was already handled)
          console.error('Error fetching slots:', slotError)
          showToast.error({
            title: "Slot Loading Failed",
            description: "Failed to load available time slots. Please try again.",
            duration: 5000
          })
        }
        
        setAvailableSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }

    fetchSlotsForDate()
  }, [service, debouncedDate, slotCache])

  // Handle slot type filter change
  const handleSlotTypeFilterChange = useCallback((filter: 'all' | 'normal' | 'express' | 'urgent' | 'emergency') => {
    setSlotTypeFilter(filter)
    // Clear selected slot when changing filter to avoid conflicts
    setSelectedSlot(null)
    
    // Automatically enable express mode for urgent and emergency slots
    if (filter === 'urgent' || filter === 'emergency') {
      setFormData(prev => ({
        ...prev,
        is_express: true,
        express_type: filter
      }))
    }
  }, [])

  // Transform service data to use actual API data (no mock packages)
  const transformServiceData = useCallback((apiData: any): EnhancedServiceDetail => {
    // Use actual service price, not mock packages
    const actualPackage: ServicePackageTier = {
      id: 'service-package',
      name: 'service',
      title: apiData.title || 'Service Package',
      price: parseFloat(apiData.price || '0'),
      original_price: apiData.discount_price ? parseFloat(apiData.discount_price) : undefined,
      currency: 'NPR',
      description: apiData.short_description || 'Service package',
      features: apiData.includes || ['Professional service'],
      delivery_time: apiData.duration || '1-3 days',
      revisions: 1,
      is_popular: true
    }

    return {
      id: apiData.id || 0,
      title: apiData.title || 'Untitled Service',
      slug: apiData.slug || `service-${apiData.id}`,
      tagline: apiData.short_description || undefined,
      description: apiData.description || 'No description available',
      short_description: apiData.short_description || apiData.description?.substring(0, 150) + '...' || '',
      
      pricing_type: 'fixed',
      packages: [actualPackage],
      currency: 'NPR',
      
      duration: apiData.duration || '1-2 hours',
      category: apiData.category || { id: 0, title: 'Unknown', slug: 'unknown' },
      
      features: apiData.includes || ['Professional service', 'Quality guarantee'],
      benefits: [
        {
          id: '1',
          title: 'Quality Assured',
          description: 'Professional quality guaranteed',
          icon: 'award',
          category: 'quality'
        }
      ],
      use_cases: [
        {
          id: '1',
          title: 'Perfect for businesses',
          description: 'Ideal for business requirements',
          scenario: 'business',
          ideal_for: ['Startups', 'SMEs']
        }
      ],
      includes: apiData.includes || [],
      excludes: apiData.excludes || [],
      
      provider: {
        id: apiData.provider?.id || 0,
        name: apiData.provider?.name || apiData.provider?.first_name + ' ' + apiData.provider?.last_name || 'Unknown Provider',
        email: apiData.provider?.email || '',
        phone: apiData.provider?.phone,
        profile: {
          id: apiData.provider?.id || 0,
          bio: apiData.provider?.profile?.bio || '',
          experience_years: apiData.provider?.profile?.experience_years || 0,
          specializations: apiData.provider?.profile?.specializations || [],
          certifications: apiData.provider?.profile?.certifications || [],
          credentials: [],
          portfolio: [],
          avg_rating: parseFloat(apiData.provider?.profile?.avg_rating || '0'),
          reviews_count: apiData.provider?.profile?.reviews_count || 0,
          response_time: apiData.response_time || 'Within 24 hours',
          is_verified: apiData.provider?.profile?.is_approved || false,
          profile_image: apiData.provider?.profile_picture || '',
          languages: ['English', 'Nepali'],
          working_hours: {
            timezone: 'Asia/Kathmandu',
            availability: {}
          },
          completed_projects: 0,
          repeat_clients_percentage: 0,
          on_time_delivery_rate: 0
        }
      },
      
      cities: apiData.cities || [],
      service_location_type: 'hybrid',
      
      hero_image: apiData.image,
      gallery_images: apiData.gallery_images?.map((img: any, index: number) => ({
        ...img,
        is_hero: index === 0,
        order: index
      })) || [],
      
      average_rating: parseFloat(apiData.average_rating || '0'),
      reviews_count: apiData.reviews_count || 0,
      total_orders: apiData.total_orders || 0,
      completion_rate: apiData.completion_rate || 0,
      repeat_customer_rate: apiData.repeat_customer_rate || 0,
      
      tags: apiData.tags || [],
      is_verified_provider: apiData.is_verified_provider || false,
      response_time: apiData.response_time || 'Within 2 hours',
      cancellation_policy: apiData.cancellation_policy || 'Free cancellation up to 24h',
      
      instant_delivery_available: false,
      rush_order_available: true,
      custom_orders_accepted: true,
      samples_available: false,
      consultation_available: true,
      
      faqs: [],
      support_included: true,
      
      view_count: apiData.view_count || 0,
      inquiry_count: apiData.inquiry_count || 0,
      save_count: apiData.save_count || 0,
      last_activity: apiData.updated_at || new Date().toISOString(),
      
      created_at: apiData.created_at || new Date().toISOString(),
      updated_at: apiData.updated_at || new Date().toISOString(),
      
      is_favorited: false,
      can_book: true,
      is_available: true
    }
  }, [])

  // Handler functions
  const handleSlotSelect = useCallback((slot: BookingSlot) => {
    setSelectedSlot(slot)
  }, [])

  const handleBookingSubmit = useCallback(async (formData: BookingFormData) => {
    if (!isAuthenticated) {
      showToast.warning({
        title: "Login Required",
        description: "Please login to book this service",
        duration: 4000,
        action: {
          label: "Login Now",
          onClick: () => router.push("/login")
        }
      })
      return
    }

    try {
      setIsBooking(true)
      
      // Determine express mode and type based on selected slot
      const isExpressSlot = selectedSlot?.slot_type === 'urgent' || selectedSlot?.slot_type === 'emergency' || selectedSlot?.slot_type === 'express'
      const expressType = selectedSlot?.slot_type === 'urgent' ? 'urgent' : 
                         selectedSlot?.slot_type === 'emergency' ? 'emergency' : 
                         'standard'
      
      // Validate required fields
      if (!selectedSlot?.date || !selectedSlot?.start_time) {
        showToast.error({
          title: "Missing Information",
          description: "Please select a date and time slot before booking.",
          duration: 5000
        })
        return
      }
      
      if (!formData.address || !formData.city || !formData.phone) {
        showToast.error({
          title: "Missing Information",
          description: "Please fill in all required fields (address, city, phone).",
          duration: 5000
        })
        return
      }
      
      // Format date properly for backend (YYYY-MM-DD format)
      const formattedDate = selectedSlot.date ? format(new Date(selectedSlot.date), 'yyyy-MM-dd') : ''
      
             const bookingData: any = {
         service: service?.id || 0,
         booking_date: formattedDate,
         booking_time: selectedSlot.start_time,
         address: formData.address,
         city: formData.city,
         phone: formData.phone,
         note: formData.special_instructions || '',
         price: basePrice,
         total_amount: totalPrice,
         is_express_booking: isExpressSlot,
         express_fee: expressFee
       }
      
      // Create booking with proper error handling
      let bookingResult: any = null
      try {
        bookingResult = await bookingsApi.createBooking(bookingData)
      } catch (apiError: any) {
        console.error('API call failed:', apiError)
        throw apiError
      }
       
      showToast.success({
        title: "Booking Created Successfully!",
        description: "Your service booking has been created. Please complete the payment to confirm your booking.",
        duration: 2000
      })
       
      // Redirect to payment page with booking ID
      if (bookingResult && bookingResult.id) {
        // Add a small delay to allow the toast to be seen before redirecting
        setTimeout(() => {
          router.push(`/bookings/${bookingResult.id}/payment`)
        }, 1500)
      } else {
        // Fallback to bookings page if no booking ID
        router.push('/bookings')
      }
    } catch (error: any) {
      // Log error for debugging purposes
      console.error('Booking error:', error)
      
      // Prepare user-friendly error message
      let errorMessage = "Failed to create booking. Please try again."
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please login and try again."
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied. You don't have permission to book this service."
      } else if (error.response?.status === 404) {
        errorMessage = "Service not found. Please check the service and try again."
      } else if (error.response?.status === 400) {
        // Handle validation errors
        if (error.response.data) {
          if (error.response.data.error) {
            errorMessage = error.response.data.error
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail
          } else {
            // Handle field-specific validation errors
            const validationErrors = Object.entries(error.response.data)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ')
            if (validationErrors) {
              errorMessage = `Validation errors: ${validationErrors}`
            }
          }
        }
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Show error notification to user
      showToast.error({
        title: "Booking Failed",
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsBooking(false)
    }
  }, [selectedSlot, service, isAuthenticated, router])

  const handleMessageProvider = useCallback(() => {
    if (!isAuthenticated) {
      showToast.warning({
        title: "Login Required",
        description: "Please login to message the provider",
        duration: 3000
      })
      return
    }
    router.push(`/messages/${service?.provider.id}`)
  }, [isAuthenticated, router, service?.provider.id])

  // Fetch service details
  useEffect(() => {
    const fetchServiceData = async () => {
      if (!resolvedParams.id || resolvedParams.id === 'undefined' || resolvedParams.id === 'null') {
        setError('Invalid service ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch service data
        const serviceData = await servicesApi.getServiceById(resolvedParams.id)
        if (!serviceData || !serviceData.id) {
          throw new Error('Invalid service data received from API')
        }
        
        // Transform to enhanced format
        const enhancedService = transformServiceData(serviceData)
        setService(enhancedService)
        
        // Don't fetch slots here - will be fetched when date is selected
        
      } catch (err: any) {
        console.error('Error fetching service:', err)
        if (err.response?.status === 404) {
          setError('Service not found')
        } else {
          setError(err.message || 'Failed to load service details')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchServiceData()
  }, [resolvedParams.id, transformServiceData])

  // Check authentication when auth loading is complete
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        showToast.warning({
          title: "Login Required",
          description: "Please login to book this service",
          duration: 4000,
          action: {
            label: "Login Now",
            onClick: () => router.push("/login")
          }
        })
        return
      }

      if (user?.role !== 'customer') {
        showToast.error({
          title: "Access Denied", 
          description: "Only customers can book services.",
          duration: 5000
        })
        router.push(`/services/${resolvedParams.id}`)
        return
      }
    }
  }, [authLoading, isAuthenticated, user, resolvedParams.id, router])

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-violet-600 dark:text-violet-400" />
                <p className="text-slate-600 dark:text-slate-300">Loading booking page...</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-red-600 mb-4">Unable to Load Service</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                {error || "The service you're trying to book is not available."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.back()} 
                  variant="outline"
                  className="border-slate-300 hover:border-violet-400 dark:border-slate-600 dark:hover:border-violet-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button 
                  onClick={() => router.push('/services')}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Browse Services
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Shield className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Login Required</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Please login to your account to book this service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push("/login")}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Login Now
                </Button>
                <Button 
                  onClick={() => router.back()} 
                  variant="outline"
                  className="border-slate-300 hover:border-violet-400 dark:border-slate-600 dark:hover:border-violet-500"
                >
                  Go Back
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <Link href={`/services/${service.id}`} className="text-slate-500 hover:text-violet-600 transition-colors duration-200 font-medium">
                  {service.title}
                </Link>
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Book Your Service
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complete your booking in a few simple steps
              </p>
            </div>
            
            <div className="w-32"> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Booking Form */}
        <div className="max-w-6xl mx-auto">
                     <EnhancedBookingForm
             service={service}
             selectedSlot={selectedSlot}
             selectedDate={selectedDate}
             availableSlots={availableSlots}
             slotTypeFilter={slotTypeFilter}
             isLoading={loading || slotsLoading}
             basePrice={basePrice}
             expressFee={expressFee}
             totalPrice={totalPrice}
             formData={formData}
             onSlotSelect={handleSlotSelect}
             onDateSelect={setSelectedDate}
             onSlotTypeFilterChange={handleSlotTypeFilterChange}
             onFormDataChange={setFormData}
             onBookingSubmit={handleBookingSubmit}
             onMessageProvider={handleMessageProvider}
           />
        </div>
      </div>
    </div>
  )
}