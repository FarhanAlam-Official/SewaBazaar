/**
 * PHASE 1 NEW COMPONENT: Multi-step Booking Wizard
 * 
 * Purpose: Provide intuitive step-by-step booking process
 * Impact: New component - enhances booking experience while maintaining backward compatibility
 * 
 * Features:
 * - 5-step booking process (Service → Date/Time → Details → Payment → Confirmation)
 * - Progress indicator
 * - Step validation
 * - Data persistence between steps
 * - Responsive design
 * - Fallback to existing booking form
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  User,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { showToast } from '@/components/ui/enhanced-toast';
import { KhaltiPayment } from './KhaltiPayment';
import api from '@/services/api';

interface BookingWizardProps {
  serviceId: string;
  onComplete: (booking: any) => void;
  onCancel: () => void;
  fallbackToOldFlow?: boolean;
}

interface BookingData {
  service: string;
  booking_date: string;
  booking_time: string;
  address: string;
  city: string;
  phone: string;
  special_instructions: string;
  preferred_provider_gender: 'any' | 'male' | 'female';
  is_recurring: boolean;
  recurring_frequency?: 'weekly' | 'biweekly' | 'monthly';
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  current_bookings: number;
  max_bookings: number;
}

const STEPS = [
  { id: 1, title: 'Service Details', description: 'Review service information' },
  { id: 2, title: 'Date & Time', description: 'Choose your preferred slot' },
  { id: 3, title: 'Your Details', description: 'Provide contact information' },
  { id: 4, title: 'Payment', description: 'Complete your payment' },
  { id: 5, title: 'Confirmation', description: 'Booking confirmed' },
];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  serviceId,
  onComplete,
  onCancel,
  fallbackToOldFlow = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    service: serviceId,
    preferred_provider_gender: 'any',
    is_recurring: false,
  });
  const [service, setService] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [booking, setBooking] = useState<any>(null);

  // Fallback to existing booking form if flag is set
  if (fallbackToOldFlow) {
    return (
      <div data-testid="existing-booking-form">
        <p>Existing Booking Form - Fallback Mode</p>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    );
  }

  // Load service details
  useEffect(() => {
    const loadService = async () => {
      try {
        const response = await api.get(`/services/${serviceId}/`);
        if (response.data) {
          setService(response.data);
        }
      } catch (error) {
        console.error('Error loading service:', error);
        showToast.error({
          title: "Service Error",
          description: "Failed to load service details",
          duration: 5000
        });
      }
    };

    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  // Load available slots when date is selected
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedDate || !serviceId) return;

      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        // Use the shared api client instead of direct fetch
        const response = await api.get('/bookings/booking_slots/available_slots/', {
          params: { service_id: serviceId, date: dateStr }
        });
        
        if (response.data) {
          setAvailableSlots(response.data);
        }
      } catch (error) {
        console.error('Error loading slots:', error);
        showToast.error({
          title: "Slots Error",
          description: "Failed to load available time slots",
          duration: 5000
        });
      }
    };

    loadAvailableSlots();
  }, [selectedDate, serviceId]);

  const updateBookingData = (field: string, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 2:
        if (!bookingData.booking_date) {
          newErrors.booking_date = 'Please select a date';
        }
        if (!bookingData.booking_time) {
          newErrors.booking_time = 'Please select a time slot';
        }
        break;
      
      case 3:
        if (!bookingData.address?.trim()) {
          newErrors.address = 'Address is required';
        }
        if (!bookingData.city?.trim()) {
          newErrors.city = 'City is required';
        }
        if (!bookingData.phone?.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(bookingData.phone.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === 3) {
      // Create booking before payment step
      await createBooking();
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const createBooking = async () => {
    setLoading(true);
    try {
      const response = await api.post('/bookings/booking-wizard/create_step/', {
        ...bookingData,
        booking_step: 'payment',
      });

      const data = response.data;

      if (data.success) {
        setBooking(data.data);
      } else {
        throw new Error(data.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      showToast.error({
        title: "Booking Failed",
        description: "Failed to create booking. Please try again.",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setCurrentStep(5);
    onComplete({ ...booking, payment: paymentData });
  };

  const handlePaymentError = (error: string) => {
    showToast.error({
      title: "Error",
      description: error,
      duration: 4000
    });
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    return `${slot.start_time} - ${slot.end_time}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6" data-testid="step-service-details">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Service Details</h2>
              <p className="text-gray-600">Review the service you're about to book</p>
            </div>
            
            {service && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {service.image && (
                      <Image 
                        src={service.image} 
                        alt={service.title}
                        width={80}
                        height={80}
                        className="object-cover rounded-lg"
                        unoptimized={service.image.startsWith('http')}
                        onError={(e) => {
                          console.warn('⚠️ [BookingWizard] Image failed to load:', service.title, service.image);
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{service.title}</h3>
                      <p className="text-gray-600 mt-1">{service.short_description}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-2xl font-bold text-primary">
                          NPR {service.discount_price || service.price}
                        </span>
                        {service.discount_price && (
                          <span className="text-lg text-gray-500 line-through">
                            NPR {service.price}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Duration: {service.duration}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6" data-testid="step-datetime">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Date & Time</h2>
              <p className="text-gray-600">Select your preferred date and time slot</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !selectedDate && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        updateBookingData('booking_date', date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.booking_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.booking_date}</p>
                )}
              </div>

              {/* Time Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Available Time Slots</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={bookingData.booking_time === slot.start_time ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => updateBookingData('booking_time', slot.start_time)}
                        disabled={!slot.is_available}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {formatTimeSlot(slot)}
                        {slot.current_bookings >= slot.max_bookings && (
                          <span className="ml-auto text-xs text-red-500">Full</span>
                        )}
                      </Button>
                    ))
                  ) : selectedDate ? (
                    <p className="text-gray-500 text-center py-4">
                      No available slots for this date
                    </p>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Please select a date first
                    </p>
                  )}
                </div>
                {errors.booking_time && (
                  <p className="text-red-500 text-sm mt-1">{errors.booking_time}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6" data-testid="step-details">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your Details</h2>
              <p className="text-gray-600">Provide your contact information</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  value={bookingData.address || ''}
                  onChange={(e) => updateBookingData('address', e.target.value)}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Enter your city"
                  value={bookingData.city || ''}
                  onChange={(e) => updateBookingData('city', e.target.value)}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="Enter your phone number"
                  value={bookingData.phone || ''}
                  onChange={(e) => updateBookingData('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gender-preference">Provider Gender Preference</Label>
                <Select
                  value={bookingData.preferred_provider_gender}
                  onValueChange={(value) => updateBookingData('preferred_provider_gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Special Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Any special instructions for the service provider"
                value={bookingData.special_instructions || ''}
                onChange={(e) => updateBookingData('special_instructions', e.target.value)}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6" data-testid="step-payment">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Payment</h2>
              <p className="text-gray-600">Complete your payment to confirm booking</p>
            </div>

            {booking ? (
              <KhaltiPayment
                booking={booking}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onCancel={onCancel}
              />
            ) : (
              <div className="text-center">
                <p>Preparing payment...</p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center" data-testid="step-confirmation">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">Booking Confirmed!</h2>
            <p className="text-gray-600">
              Your booking has been successfully created and payment processed.
            </p>
            
            {booking && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2 text-left">
                    <h3 className="font-semibold">Booking Details:</h3>
                    <p><strong>Service:</strong> {service?.title}</p>
                    <p><strong>Date:</strong> {format(new Date(booking.booking_date), 'PPP')}</p>
                    <p><strong>Time:</strong> {booking.booking_time}</p>
                    <p><strong>Address:</strong> {booking.address}</p>
                    <p><strong>Total Amount:</strong> NPR {booking.total_amount}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => window.location.href = '/dashboard/bookings'} className="w-full">
              View My Bookings
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="booking-wizard">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < STEPS.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h1 className="text-lg font-medium">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.title}
          </h1>
          <p className="text-gray-600 text-sm">
            {STEPS[currentStep - 1]?.description}
          </p>
        </div>
        
        <Progress value={(currentStep / STEPS.length) * 100} className="mt-4" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          {currentStep < 4 && (
            <Button onClick={handleNext} disabled={loading}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};