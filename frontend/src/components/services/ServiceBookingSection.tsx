"use client"

import React, { useState, useEffect } from 'react'
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
    contact_preference: 'platform',
    project_description: '',
    requirements: '',
    special_instructions: ''
  })
  const [activeTab, setActiveTab] = useState('book-now')
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false)

  // Get available dates (next 30 days)
  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
    .filter(date => !isBefore(date, startOfDay(new Date())))

  // Get time slots for selected date
  const dateSlots = availableSlots.filter(slot => 
    selectedDate && format(new Date(slot.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  )

  // Calculate pricing
  const selectedPackage = service.packages.find(pkg => pkg.id === formData.package_id)
  const basePrice = selectedPackage?.price || Math.min(...service.packages.map(pkg => pkg.price))
  const rushFee = selectedSlot?.is_rush ? basePrice * 0.5 : 0
  const totalPrice = basePrice + rushFee

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

  // Handle booking submission
  const handleSubmit = () => {
    if (!selectedSlot || !formData.project_description) return

    const completeFormData: BookingFormData = {
      service_id: service.id,
      package_id: formData.package_id,
      selected_extras: formData.selected_extras || [],
      preferred_date: selectedSlot.date,
      preferred_time: selectedSlot.start_time,
      project_description: formData.project_description || '',
      requirements: formData.requirements || '',
      budget_range: formData.budget_range,
      deadline: formData.deadline,
      special_instructions: formData.special_instructions || '',
      contact_preference: formData.contact_preference || 'platform'
    }

    onBookingSubmit(completeFormData)
  }

  // Check if form is valid
  const isFormValid = selectedSlot && formData.project_description && formData.project_description.length >= 20

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

                    {/* Urgent Booking Option */}
                    {urgentBookingAvailable && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border border-orange-200 dark:border-orange-700"
                      >
                        <div className="flex items-start gap-3">
                          <Zap className="h-5 w-5 text-orange-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-orange-800 dark:text-orange-200">
                              Need it urgently?
                            </h4>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                              Express service available for rush orders (+50% fee)
                            </p>
                            <Button size="sm" variant="outline" className="border-orange-300 text-orange-600">
                              Book Express Service
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
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
                      <div className="grid grid-cols-2 gap-2">
                        {dateSlots.map((slot) => (
                          <motion.button
                            key={slot.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={!slot.is_available}
                            className={cn(
                              "p-3 rounded-lg border text-sm font-medium transition-all",
                              slot.is_available
                                ? selectedSlot?.id === slot.id
                                  ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-300"
                                  : "border-slate-200 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:hover:border-violet-600"
                                : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>{slot.start_time} - {slot.end_time}</span>
                              {slot.is_rush && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  Rush
                                </Badge>
                              )}
                            </div>
                            {slot.provider_note && (
                              <div className="text-xs text-slate-500 mt-1">
                                {slot.provider_note}
                              </div>
                            )}
                          </motion.button>
                        ))}
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

              {/* Right Side - Project Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    Project Details
                  </h3>

                  <div className="space-y-4">
                    {/* Package Selection */}
                    <div>
                      <Label htmlFor="package">Select Package</Label>
                      <Select 
                        value={formData.package_id} 
                        onValueChange={(value) => updateFormData({ package_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a package" />
                        </SelectTrigger>
                        <SelectContent>
                          {service.packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{pkg.title}</span>
                                <span className="text-sm text-slate-600">
                                  {service.currency} {pkg.price}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Project Description */}
                    <div>
                      <Label htmlFor="description">Project Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your project requirements in detail (minimum 20 characters)"
                        value={formData.project_description}
                        onChange={(e) => updateFormData({ project_description: e.target.value })}
                        className="min-h-[100px]"
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        {formData.project_description?.length || 0}/20 minimum
                      </div>
                    </div>

                    {/* Budget Range */}
                    <div>
                      <Label htmlFor="budget">Budget Range (Optional)</Label>
                      <Select 
                        value={formData.budget_range} 
                        onValueChange={(value) => updateFormData({ budget_range: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-1000">Under NPR 1,000</SelectItem>
                          <SelectItem value="1000-5000">NPR 1,000 - 5,000</SelectItem>
                          <SelectItem value="5000-10000">NPR 5,000 - 10,000</SelectItem>
                          <SelectItem value="10000-25000">NPR 10,000 - 25,000</SelectItem>
                          <SelectItem value="25000-50000">NPR 25,000 - 50,000</SelectItem>
                          <SelectItem value="over-50000">Over NPR 50,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Deadline */}
                    <div>
                      <Label htmlFor="deadline">Project Deadline (Optional)</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => updateFormData({ deadline: e.target.value })}
                        min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      />
                    </div>

                    {/* Contact Preference */}
                    <div>
                      <Label htmlFor="contact">Preferred Contact Method</Label>
                      <Select 
                        value={formData.contact_preference} 
                        onValueChange={(value) => updateFormData({ contact_preference: value as 'email' | 'phone' | 'platform' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="platform">Platform Messages</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <Label htmlFor="instructions">Special Instructions</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Any specific requirements or instructions"
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
              {selectedSlot && selectedPackage && (
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
                        <span>Service Package:</span>
                        <span className="font-medium">{selectedPackage.title}</span>
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
                          <span>Rush Fee (50%):</span>
                          <span className="font-medium">+{service.currency} {rushFee.toLocaleString()}</span>
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
                            <p>• Includes: {selectedPackage.features.slice(0, 3).join(', ')}</p>
                            <p>• Delivery: {selectedPackage.delivery_time}</p>
                            <p>• Revisions: {selectedPackage.revisions === 'unlimited' ? 'Unlimited' : selectedPackage.revisions}</p>
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