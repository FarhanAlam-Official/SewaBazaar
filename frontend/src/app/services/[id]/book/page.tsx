"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { servicesApi, reviewsApi } from '@/services/api'
import { showToast } from '@/components/ui/enhanced-toast'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

// Import the new enhanced booking component
import { ServiceBookingSection } from '@/components/services/ServiceBookingSection'

// Import enhanced types
import { 
  EnhancedServiceDetail, 
  DetailedReview, 
  ReviewSummary, 
  BookingSlot, 
  BookingFormData,
  ServicePackageTier 
} from '@/types/service-detail'

export default function BookServicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  
  // Enhanced State Management
  const [service, setService] = useState<EnhancedServiceDetail | null>(null)
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)

  // Transform legacy service data to enhanced format (same as service detail page)
  const transformServiceData = (apiData: any): EnhancedServiceDetail => {
    const mockPackages: ServicePackageTier[] = [
      {
        id: 'basic',
        name: 'basic',
        title: 'Basic Package',
        price: parseFloat(apiData.price || '0'),
        original_price: apiData.discount_price ? parseFloat(apiData.price) : undefined,
        currency: 'NPR',
        description: 'Essential service package',
        features: ['Basic implementation', 'Standard support', '1 revision'],
        delivery_time: apiData.duration || '3-5 days',
        revisions: 1,
        is_popular: false
      },
      {
        id: 'standard',
        name: 'standard', 
        title: 'Standard Package',
        price: parseFloat(apiData.price || '0') * 1.5,
        currency: 'NPR',
        description: 'Most popular choice',
        features: ['Advanced implementation', 'Priority support', '3 revisions', 'Source code'],
        delivery_time: '5-7 days',
        revisions: 3,
        is_popular: true
      }
    ]

    return {
      id: apiData.id || 0,
      title: apiData.title || 'Untitled Service',
      slug: apiData.slug || `service-${apiData.id}`,
      tagline: apiData.short_description || undefined,
      description: apiData.description || 'No description available',
      short_description: apiData.short_description || apiData.description?.substring(0, 150) + '...' || '',
      
      pricing_type: 'package',
      packages: mockPackages,
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
        name: apiData.provider?.name || 'Unknown Provider',
        email: apiData.provider?.email || '',
        phone: apiData.provider?.phone,
        profile: {
          id: apiData.provider?.id || 0,
          bio: apiData.provider?.profile?.bio || 'Professional service provider',
          experience_years: apiData.provider?.profile?.experience_years || 2,
          specializations: apiData.provider?.profile?.specializations || ['General Services'],
          certifications: apiData.provider?.profile?.certifications || [],
          credentials: [],
          portfolio: [],
          avg_rating: parseFloat(apiData.provider?.profile?.avg_rating || '4.5'),
          reviews_count: apiData.provider?.profile?.reviews_count || 0,
          response_time: apiData.provider?.profile?.response_time || 'Within 2 hours',
          is_verified: apiData.provider?.profile?.is_verified || false,
          profile_image: apiData.provider?.profile?.profile_image || '',
          languages: ['English', 'Nepali'],
          working_hours: {
            timezone: 'Asia/Kathmandu',
            availability: {}
          },
          completed_projects: 50,
          repeat_clients_percentage: 80,
          on_time_delivery_rate: 95
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
      total_orders: Math.floor(Math.random() * 100) + 10,
      completion_rate: 95,
      repeat_customer_rate: 80,
      
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
      
      view_count: Math.floor(Math.random() * 500) + 100,
      inquiry_count: Math.floor(Math.random() * 50) + 10,
      save_count: Math.floor(Math.random() * 100) + 20,
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

    setIsBooking(true)
    try {
      // Mock booking submission - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      showToast.success({
        title: "Booking Submitted!",
        description: "Your booking request has been sent to the provider.",
        duration: 5000
      })
      router.push('/dashboard/customer/bookings')
    } catch (err) {
      showToast.error({
        title: "Booking Failed",
        description: "Something went wrong. Please try again.",
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
        
        // Generate mock available slots for the next 30 days
        const mockSlots: BookingSlot[] = []
        for (let i = 1; i <= 30; i++) {
          const date = new Date()
          date.setDate(date.getDate() + i)
          
          // Add 2-3 time slots per day
          const timeSlots = [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '17:00' },
            { start: '18:00', end: '21:00' }
          ]
          
          timeSlots.forEach((slot, index) => {
            mockSlots.push({
              id: `${date.toISOString().split('T')[0]}-${index}`,
              date: date.toISOString().split('T')[0],
              start_time: slot.start,
              end_time: slot.end,
              is_available: Math.random() > 0.3, // 70% availability
              is_rush: index === 2, // Evening slots are rush
              max_bookings: 1,
              current_bookings: 0
            })
          })
        }
        setAvailableSlots(mockSlots)
        
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
        {/* Enhanced Booking Section */}
        <ServiceBookingSection
          service={service}
          selectedSlot={selectedSlot || undefined}
          availableSlots={availableSlots}
          isLoading={isBooking}
          onSlotSelect={handleSlotSelect}
          onBookingSubmit={handleBookingSubmit}
          onMessageProvider={handleMessageProvider}
          urgentBookingAvailable={true}
          className="max-w-6xl mx-auto"
        />
      </div>
    </div>
  )
}