"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { servicesApi, reviewsApi, bookingsApi } from '@/services/api'
import { showToast } from '@/components/ui/enhanced-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
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
  X
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, isBefore, startOfDay, parse } from 'date-fns'
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
  isExpressMode: boolean
  expressType: 'standard' | 'urgent' | 'emergency'
  slotTypeFilter: 'all' | 'standard' | 'rush' | 'express'
  isLoading: boolean
  basePrice: number
  rushFee: number
  expressFee: number
  totalPrice: number
  formData: Partial<BookingFormData>
  onSlotSelect: (slot: BookingSlot) => void
  onDateSelect: (date: Date | undefined) => void
  onExpressToggle: (enable: boolean) => void
  onExpressTypeChange: (type: 'standard' | 'urgent' | 'emergency') => void
  onSlotTypeFilterChange: (filter: 'all' | 'standard' | 'rush' | 'express') => void
  onFormDataChange: (data: Partial<BookingFormData>) => void
  onBookingSubmit: (data: BookingFormData) => void
  onMessageProvider: () => void
}

function EnhancedBookingForm({
  service,
  selectedSlot,
  selectedDate,
  availableSlots,
  isExpressMode,
  expressType,
  slotTypeFilter,
  isLoading,
  basePrice,
  rushFee,
  expressFee,
  totalPrice,
  formData,
  onSlotSelect,
  onDateSelect,
  onExpressToggle,
  onExpressTypeChange,
  onSlotTypeFilterChange,
  onFormDataChange,
  onBookingSubmit,
  onMessageProvider
}: EnhancedBookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false)
  
  // Helper function to convert 24hr time to 12hr format
  const formatTime12Hr = (time24: string) => {
    try {
      const [hours, minutes] = time24.split(':')
      const hour24 = parseInt(hours, 10)
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      return `${hour12}:${minutes} ${ampm}`
    } catch {
      return time24 // fallback to original if parsing fails
    }
  }
  
  // Available dates (next 30 days)
  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
    .filter(date => !isBefore(date, startOfDay(new Date())))

  // Get time slots for selected date with filtering
  const dateSlots = availableSlots.filter(slot => {
    const matchesDate = selectedDate && format(new Date(slot.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    
    if (!matchesDate) return false
    
    // Apply slot type filter
    switch (slotTypeFilter) {
      case 'standard':
        return !slot.is_rush && slot.slot_type === 'standard'
      case 'rush':
        return slot.is_rush
      case 'express':
        return slot.slot_type !== 'standard' && !slot.is_rush
      case 'all':
      default:
        return true
    }
  })

  // Auto-select tomorrow's date if no date is selected (since slots start tomorrow)
  React.useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      // Start with tomorrow if today has no slots
      const tomorrow = addDays(new Date(), 1)
      if (availableDates.some(date => format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd'))) {
        onDateSelect(tomorrow)
      } else {
        onDateSelect(availableDates[0])
      }
    }
  }, [selectedDate, availableDates, onDateSelect])

  // Update form data helper
  const updateFormData = (updates: Partial<BookingFormData>) => {
    onFormDataChange({ ...formData, ...updates })
  }

  // Handle booking submission
  const handleSubmit = () => {
    if (!selectedSlot) return

    const completeFormData: BookingFormData = {
      service_id: service.id,
      preferred_date: selectedSlot.date,
      preferred_time: selectedSlot.start_time,
      special_instructions: formData.special_instructions || '',
      address: formData.address || '',
      city: formData.city || '',
      phone: formData.phone || '',
      is_express: isExpressMode,
      express_type: expressType
    }

    onBookingSubmit(completeFormData)
  }

  // Validation
  const isFormValid = selectedSlot && formData.address && formData.city && formData.phone

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Book {service.title}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Select your preferred date, time, and provide service details
        </p>
      </div>

      {/* Express Mode Toggle */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Express Service
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Get faster service with priority scheduling and same-day availability
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isExpressMode && (
                <Select value={expressType} onValueChange={onExpressTypeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (+50%)</SelectItem>
                    <SelectItem value="urgent">Urgent (+75%)</SelectItem>
                    <SelectItem value="emergency">Emergency (+100%)</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={isExpressMode}
                  onCheckedChange={onExpressToggle}
                />
                {isExpressMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExpressToggle(false)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {isExpressMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg"
            >
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Express {expressType} service:</strong> {' '}
                Additional {(expressType === 'emergency' ? 100 : expressType === 'urgent' ? 75 : 50)}% fee applies
                <br />
                <span className="text-xs">Priority booking with faster service delivery</span>
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Main Booking Form */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Date & Time Selection */}
            <div className="space-y-6">
              {/* Slot Type Filter */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-violet-600" />
                  Time Slot Types
                </h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <Button
                    variant={slotTypeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSlotTypeFilterChange('all')}
                    className="flex items-center gap-1"
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    All Slots
                  </Button>
                  
                  <Button
                    variant={slotTypeFilter === 'standard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSlotTypeFilterChange('standard')}
                    className="flex items-center gap-1"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Standard
                  </Button>
                  
                  <Button
                    variant={slotTypeFilter === 'rush' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSlotTypeFilterChange('rush')}
                    className="flex items-center gap-1"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Rush Hours
                  </Button>
                  
                  <Button
                    variant={slotTypeFilter === 'express' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSlotTypeFilterChange('express')}
                    className="flex items-center gap-1"
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    Express
                  </Button>
                </div>
                
                {/* Filter Info */}
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {slotTypeFilter === 'all' && "Showing all available time slots"}
                  {slotTypeFilter === 'standard' && "Standard time slots with regular pricing"}
                  {slotTypeFilter === 'rush' && "Rush hour slots with additional fees"}
                  {slotTypeFilter === 'express' && "Express slots for urgent bookings"}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-violet-600" />
                  Select Date
                </h3>
                
                {/* Calendar */}
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateSelect}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className="rounded-lg border"
                  />
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Available Times - {format(selectedDate, 'MMMM d, yyyy')}
                  </h4>
                  
                  {dateSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {dateSlots.map((slot) => (
                        <motion.button
                          key={slot.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSlotSelect(slot)}
                          disabled={!slot.is_available || slot.is_fully_booked}
                          className={cn(
                            "p-4 rounded-lg border text-sm font-medium transition-all",
                            slot.is_available && !slot.is_fully_booked
                              ? selectedSlot?.id === slot.id
                                ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-600"
                                : "border-slate-200 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:hover:border-violet-500 dark:hover:bg-violet-950/20 dark:hover:text-slate-100"
                              : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{formatTime12Hr(slot.start_time)} - {formatTime12Hr(slot.end_time)}</span>
                            <div className="flex gap-1">
                              {slot.is_rush && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs px-1 py-0">
                                  Rush
                                </Badge>
                              )}
                              {slot.slot_type !== 'standard' && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs px-1 py-0">
                                  {slot.slot_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {slot.provider_note && (
                            <div className="text-xs text-slate-500 text-left">
                              {slot.provider_note}
                            </div>
                          )}
                          {slot.is_fully_booked && (
                            <div className="text-xs text-red-500 text-left">
                              Fully Booked
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No time slots available</p>
                      <p className="text-sm">The provider hasn't set up availability yet</p>
                      <Button
                        variant="outline"
                        onClick={onMessageProvider}
                        className="mt-4"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Provider
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No available slots for this date</p>
                      <p className="text-sm">Please select a different date</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right Side - Service Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Service Details
                </h3>

                <div className="space-y-4">
                  {/* Contact Information */}
                  <div>
                    <Label htmlFor="address">Service Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your full address where the service should be performed"
                      value={formData.address || ''}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className="min-h-[80px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city || ''}
                        onChange={(e) => updateFormData({ city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="Phone number"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData({ phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Any specific requirements or instructions for the service provider"
                      value={formData.special_instructions || ''}
                      onChange={(e) => updateFormData({ special_instructions: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Summary */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border-violet-200/50 dark:border-violet-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-violet-800 dark:text-violet-200">
                    Booking Summary
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium">{service.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span className="font-medium">
                      {format(new Date(selectedSlot.date), 'MMM d, yyyy')} at {formatTime12Hr(selectedSlot.start_time)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span className="font-medium">{service.currency} {basePrice.toLocaleString()}</span>
                  </div>
                  {rushFee > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Rush Fee ({selectedSlot?.rush_fee_percentage || 50}%):</span>
                      <span className="font-medium">+{service.currency} {rushFee.toLocaleString()}</span>
                    </div>
                  )}
                  {expressFee > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>Express Fee ({expressType} - {(expressFee / basePrice * 100).toFixed(0)}%):</span>
                      <span className="font-medium">+{service.currency} {expressFee.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-violet-800 dark:text-violet-200">
                    <span>Total:</span>
                    <span>{service.currency} {totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {showPriceBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-violet-200 dark:border-violet-700"
                    >
                      <div className="text-xs text-violet-700 dark:text-violet-300 space-y-1">
                        <p>• Duration: {service.duration}</p>
                        <p>• Provider: {service.provider.name}</p>
                        <p>• Payment: Secure payment processing</p>
                        {isExpressMode && (
                          <p>• Express service: Priority scheduling and faster delivery</p>
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
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
              {isExpressMode && <Zap className="ml-2 h-4 w-4" />}
            </>
          )}
        </Button>

        {/* Alternative Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={onMessageProvider}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Message Provider
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>Money Back Guarantee</span>
          </div>
          <div className="flex items-center gap-1">
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
  
  // Enhanced State Management
  const [service, setService] = useState<EnhancedServiceDetail | null>(null)
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isExpressMode, setIsExpressMode] = useState(false)
  const [expressType, setExpressType] = useState<'standard' | 'urgent' | 'emergency'>('standard')
  const [slotTypeFilter, setSlotTypeFilter] = useState<'all' | 'standard' | 'rush' | 'express'>('all')
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
  
  // Calculate pricing with express fees
  const basePrice = service?.packages[0]?.price || 0
  const rushFee = selectedSlot?.is_rush ? basePrice * ((selectedSlot.rush_fee_percentage || 50) / 100) : 0
  
  // Express fee calculation
  const expressMultipliers = {
    standard: 0.5,   // 50%
    urgent: 0.75,    // 75%
    emergency: 1.0   // 100%
  }
  const expressFee = isExpressMode ? basePrice * expressMultipliers[expressType] : 0
  
  const totalPrice = basePrice + rushFee + expressFee
  
  // Helper functions
  const toggleExpressMode = (enable: boolean) => {
    setIsExpressMode(enable)
    setFormData(prev => ({
      ...prev,
      is_express: enable,
      express_type: enable ? expressType : 'standard'
    }))
  }
  
  const handleExpressTypeChange = (type: 'standard' | 'urgent' | 'emergency') => {
    setExpressType(type)
    setFormData(prev => ({
      ...prev,
      express_type: type
    }))
  }
  
  const handleSlotTypeFilterChange = (filter: 'all' | 'standard' | 'rush' | 'express') => {
    setSlotTypeFilter(filter)
    // Clear selected slot when changing filter to avoid conflicts
    setSelectedSlot(null)
  }

  // Transform service data to use actual API data (no mock packages)
  const transformServiceData = (apiData: any): EnhancedServiceDetail => {
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
  }

  // Handler functions
  const handleSlotSelect = (slot: BookingSlot) => {
    setSelectedSlot(slot)
  }

  const handleBookingSubmit = async (formData: BookingFormData) => {
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
      return
    }

    if (!service || !selectedSlot) {
      showToast.error({
        title: "Missing Information",
        description: "Please select a time slot before booking.",
        duration: 5000
      })
      return
    }

    setIsBooking(true)
    try {
      // Check if this is an express booking
      if (formData.is_express) {
        // Use express booking API
        const expressBookingData = {
          service_id: service.id,
          booking_date: formData.preferred_date || selectedSlot.date,
          booking_time: formData.preferred_time || selectedSlot.start_time,
          express_type: formData.express_type || 'standard',
          address: formData.address || '',
          city: formData.city || '',
          phone: formData.phone || '',
          special_instructions: formData.special_instructions || ''
        }

        const booking = await bookingsApi.createExpressBooking(expressBookingData)
        
        showToast.success({
          title: "Express Booking Created!",
          description: `Your express booking has been created. Redirecting to payment...`,
          duration: 3000
        })
        
        // Add delay before redirecting so user can see the toast
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Redirect to payment page for express bookings - handle nested response structure
        const bookingId = booking.booking?.id || booking.id
        router.push(`/bookings/${bookingId}/payment`)
      } else {
        // Regular booking submission - Create booking and redirect to payment
        const bookingData = {
          service: service.id,
          booking_date: formData.preferred_date || selectedSlot.date,
          booking_time: formData.preferred_time || selectedSlot.start_time,
          address: formData.address || '',
          city: formData.city || '',
          phone: formData.phone || '',
          note: formData.special_instructions || '',
          special_instructions: formData.special_instructions || '',
          price: service.packages[0]?.price || 0,
          total_amount: totalPrice,
          status: 'pending' // Set as pending until payment is completed
        }

        const booking = await bookingsApi.createBooking(bookingData)
        
        showToast.success({
          title: "Booking Created!",
          description: `Your booking has been created. Redirecting to payment...`,
          duration: 3000
        })
        
        // Add delay before redirecting so user can see the toast
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Redirect to payment page instead of dashboard
        router.push(`/bookings/${booking.id}/payment`)
      }
    } catch (err: any) {
      console.error('Booking submission error:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          (err.response?.data && typeof err.response.data === 'object' 
                            ? Object.values(err.response.data).flat().join(', ') 
                            : err.message) || 
                          "Something went wrong. Please try again."
      
      showToast.error({
        title: "Booking Failed",
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsBooking(false)
    }
  }

  const handleMessageProvider = () => {
    if (!isAuthenticated) {
      showToast.warning({
        title: "Login Required",
        description: "Please login to message the provider",
        duration: 3000
      })
      return
    }
    router.push(`/messages/${service?.provider.id}`)
  }

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
  }, [resolvedParams.id])

  // Fetch slots when date changes
  useEffect(() => {
    const fetchSlotsForDate = async () => {
      if (!service || !selectedDate) return

      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      try {
        const slotsData = await bookingsApi.getAvailableSlots(service.id, dateStr)
        
        // Transform backend slots to frontend format
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
          slot_type: slot.slot_type || 'standard',
          provider_note: slot.provider_note || '',
          base_price_override: slot.base_price_override,
          calculated_price: slot.calculated_price,
          rush_fee_amount: slot.rush_fee_amount,
          created_at: slot.created_at,
          // Legacy compatibility
          price: slot.calculated_price || slot.base_price_override
        }))
        
        setAvailableSlots(transformedSlots)
      } catch (slotError: any) {
        console.warn('Failed to fetch slots for date:', dateStr, slotError)
        
        // Check if it's an authentication error
        if (slotError.response?.status === 403 || slotError.response?.status === 401) {
          console.warn('Authentication required for booking slots')
          // Don't show error toast for auth issues, just set empty slots
        } else {
          console.error('Error fetching slots:', slotError)
        }
        
        setAvailableSlots([])
      }
    }

    fetchSlotsForDate()
  }, [service, selectedDate])

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
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-violet-600" />
              <p className="text-slate-600 dark:text-slate-300">Loading booking page...</p>
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
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Unable to Load Service</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {error || "The service you're trying to book is not available."}
            </p>
            <div className="space-x-4">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push('/services')}>
                Browse Services
              </Button>
            </div>
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
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Login Required</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Please login to your account to book this service.
            </p>
            <div className="space-x-4">
              <Button onClick={() => router.push("/login")}>
                Login Now
              </Button>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Service
              </Button>
              
              <div className="hidden md:block">
                <Link href={`/services/${service.id}`} className="text-slate-500 hover:text-violet-600 transition-colors">
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
            isExpressMode={isExpressMode}
            expressType={expressType}
            slotTypeFilter={slotTypeFilter}
            isLoading={isBooking}
            basePrice={basePrice}
            rushFee={rushFee}
            expressFee={expressFee}
            totalPrice={totalPrice}
            formData={formData}
            onSlotSelect={handleSlotSelect}
            onDateSelect={setSelectedDate}
            onExpressToggle={toggleExpressMode}
            onExpressTypeChange={handleExpressTypeChange}
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