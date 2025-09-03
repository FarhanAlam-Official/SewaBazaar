"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, Clock, MapPin, Phone, Mail, 
  MessageCircle, CheckCircle2, AlertCircle, Loader2, 
  Zap, Shield, Award, Star, Users, ArrowRight,
  Package, Gift, Sparkles, Crown, Diamond,
  CreditCard, Wallet, DollarSign, Info, HelpCircle
} from 'lucide-react'
import { format, addDays, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ServiceBookingProps, BookingSlot, BookingFormData } from '@/types/service-detail'
import { cn } from '@/lib/utils'

import { TimeSlotSkeleton } from "./TimeSlotSkeleton"

interface ServiceBookingSectionProps extends ServiceBookingProps {
  onQuickConsultation?: () => void
  onMessageProvider?: () => void
  urgentBookingAvailable?: boolean
  className?: string
}

export function ServiceBookingSection({ 
  service, 
  availableSlots, 
  onSlotSelect, 
  onBookingSubmit, 
  selectedSlot,
  isLoading,
  onQuickConsultation,
  onMessageProvider,
  urgentBookingAvailable = false,
  className 
}: ServiceBookingSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    service_id: service.id,
    special_instructions: '',
    address: '',
    city: '',
    phone: '',
    is_express: false,
    express_type: 'standard'
  })
  const [activeTab, setActiveTab] = useState('book-now')
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false)

  // Get available dates (next 31 days from today to ensure we include October 1st)
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
    
    return dates.filter(date => !isBefore(date, startOfDay(new Date())));
  }, []);

  // Get time slots for selected date
  const dateSlots = availableSlots.filter(slot => 
    selectedDate && format(new Date(slot.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  )

  // Calculate pricing - use actual package price with express fees
  const basePrice = service.packages[0]?.price || 0
  const expressMultiplier = formData.is_express 
    ? (formData.express_type === 'emergency' ? 1.0 : formData.express_type === 'urgent' ? 0.75 : 0.5)
    : 0
  const rushFee = selectedSlot?.is_rush ? basePrice * (selectedSlot.rush_fee_percentage || 50) / 100 : 0
  const expressFee = formData.is_express ? basePrice * expressMultiplier : 0
  const totalPrice = basePrice + rushFee + expressFee

  // Handle form updates
  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    onSlotSelect && selectedSlot && onSlotSelect(selectedSlot) // Clear selected slot when date changes
  }

  // Handle slot selection
  const handleSlotSelect = (slot: BookingSlot) => {
    onSlotSelect(slot)
    updateFormData({
      preferred_date: slot.date,
      preferred_time: slot.start_time
    })
  }

  // Handle booking submission - align with backend fields
  const handleSubmit = () => {
    if (!selectedSlot) {
      return
    }

    const completeFormData: BookingFormData = {
      service_id: service.id,
      preferred_date: selectedSlot.date,
      preferred_time: selectedSlot.start_time,
      special_instructions: formData.special_instructions || '',
      address: formData.address || '',
      city: formData.city || '',
      phone: formData.phone || ''
    }

    onBookingSubmit(completeFormData)
  }

  // Check if form is valid - simplified validation
  const isFormValid = selectedSlot

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("space-y-6", className)}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Book your service now or schedule a free consultation
        </p>
      </div>

      {/* Main Booking Interface */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="book-now">Book Now</TabsTrigger>
            <TabsTrigger value="consultation">Free Consultation</TabsTrigger>
            <TabsTrigger value="contact">Contact Provider</TabsTrigger>
          </TabsList>

          {/* Book Now Tab */}
          <TabsContent value="book-now" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Date & Time Selection */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-violet-600" />
                    Select Date & Time
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

                    {/* Time Slots Section */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-violet-600" />
                        Available Time Slots
                      </h4>
                      
                      {isLoading ? (
                        <TimeSlotSkeleton count={8} variant="service-section" />
                      ) : dateSlots.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {dateSlots.map((slot) => (
                            <Button
                              key={`${slot.date}-${slot.start_time}`}
                              variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                              className={cn(
                                "h-16 flex flex-col items-center justify-center text-sm font-medium transition-all duration-200",
                                selectedSlot?.id === slot.id && "ring-2 ring-violet-500 ring-offset-2",
                                slot.slot_type === 'urgent' && "border-orange-500 bg-orange-50/50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-900/30",
                                slot.slot_type === 'emergency' && "border-red-500 bg-red-50/50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                              )}
                              onClick={() => handleSlotSelect(slot)}
                            >
                              <span className="font-medium">
                                {formatTime12Hr(slot.start_time)}
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
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">No slots available for this date</p>
                          <p className="text-sm">Try selecting another date</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Project Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    Booking Details
                  </h3>

                  <div className="space-y-4">
                    {/* Contact Information */}
                    <div>
                      <Label htmlFor="address">Service Address *</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your full address where the service should be performed"
                        value={formData.address}
                        onChange={(e) => updateFormData({ address: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => updateFormData({ city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="Phone number"
                          value={formData.phone}
                          onChange={(e) => updateFormData({ phone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Any specific requirements or instructions for the service provider"
                        value={formData.special_instructions}
                        onChange={(e) => updateFormData({ special_instructions: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <AnimatePresence>
              {selectedSlot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t pt-6"
                >
                  <div className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 rounded-xl p-6 border border-violet-200/50 dark:border-violet-700/50">
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
                          {format(new Date(selectedSlot.date), 'MMM d, yyyy')} at {selectedSlot.start_time}
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
                          <span>Express Fee ({formData.express_type} - {(expressMultiplier * 100).toFixed(0)}%):</span>
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
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Book Now Button */}
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
                  </>
                )}
              </Button>

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
          </TabsContent>

          {/* Free Consultation Tab */}
          <TabsContent value="consultation" className="p-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-emerald-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Free Consultation
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Not sure which package is right for you? Get personalized advice from our expert.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  <span>15-30 minutes</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Phone className="h-5 w-5 text-emerald-500" />
                  <span>Video or phone call</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Gift className="h-5 w-5 text-emerald-500" />
                  <span>Completely free</span>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={onQuickConsultation}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Schedule Free Consultation
              </Button>
            </div>
          </TabsContent>

          {/* Contact Provider Tab */}
          <TabsContent value="contact" className="p-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Contact Provider
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Have specific questions? Send a direct message to {service.provider.name}.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Response within {service.response_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{service.provider.profile.avg_rating} rating</span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  onClick={onMessageProvider}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  )
}