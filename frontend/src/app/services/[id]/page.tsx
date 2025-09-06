"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, AlertCircle, Heart, Share2, ChevronRight, MessageCircle, Shield, CheckCircle2, Award } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
import { showToast } from "@/components/ui/enhanced-toast"
import { servicesApi, reviewsApi, bookingsApi } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// Import new redesigned components
import { ServiceHeroSection } from "@/components/services/ServiceHeroSection"
import { ServiceDescriptionSection } from "@/components/services/ServiceDescriptionSection"
import { ServicePricingSection } from "@/components/services/ServicePricingSection"
import { ServiceBookingSection } from "@/components/services/ServiceBookingSection"
import { ServiceReviewsSection } from "@/components/services/ServiceReviewsSection"
import { ServiceProviderSection } from "@/components/services/ServiceProviderSection"

// Import enhanced types
import { 
  EnhancedServiceDetail, 
  DetailedReview, 
  ReviewSummary, 
  BookingFormData,
  ReviewFormData,
  ServicePackageTier 
} from "@/types/service-detail"

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  
  // Enhanced State Management
  const [service, setService] = useState<EnhancedServiceDetail | null>(null)
  const [reviews, setReviews] = useState<DetailedReview[]>([])
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    address: '',
    city: '',
    phone: '',
    special_instructions: ''
  })
  
  // Calculate pricing - add after service is loaded
  const selectedPackageData = service?.packages.find(pkg => pkg.id === selectedPackage)
  const basePrice = selectedPackageData?.price || service?.packages[0]?.price || 0
  const totalPrice = basePrice
  
  // UI States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [viewCount] = useState(156)
  const [recentBookings] = useState(24)
  
  // Hooks
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isBookingIntent = searchParams.get('booking') === 'true'

  const [isNavigating, setIsNavigating] = useState(false) // Prevent multiple rapid clicks
  // Transform legacy service data to enhanced format
  const transformServiceData = (apiData: any): EnhancedServiceDetail => {
    // Extract actual data from API response and supplement with reasonable defaults
    const basePrice = parseFloat(apiData.price || '0')
    const discountPrice = apiData.discount_price ? parseFloat(apiData.discount_price) : undefined
    
    // Create packages based on actual service pricing
    const mockPackages: ServicePackageTier[] = [
      {
        id: 'basic',
        name: 'basic',
        title: 'Standard Service',
        price: basePrice,
        original_price: discountPrice ? basePrice : undefined,
        currency: 'NPR',
        description: apiData.short_description || 'Professional service package',
        features: Array.isArray(apiData.includes) ? apiData.includes.slice(0, 3) : ['Professional service', 'Quality guarantee', 'Support included'],
        delivery_time: apiData.duration || '1-2 hours',
        revisions: 1,
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
      
      features: Array.isArray(apiData.includes) ? apiData.includes : ['Professional service', 'Quality guarantee'],
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
          title: 'Perfect for your needs',
          description: 'Ideal for various requirements',
          scenario: 'general',
          ideal_for: ['Individuals', 'Businesses']
        }
      ],
      includes: Array.isArray(apiData.includes) ? apiData.includes : apiData.includes ? apiData.includes.split('\n').filter(Boolean) : [],
      excludes: Array.isArray(apiData.excludes) ? apiData.excludes : apiData.excludes ? apiData.excludes.split('\n').filter(Boolean) : [],
      requirements: [],
      process_steps: [],
      
      provider: {
        id: apiData.provider?.id || 0,
        name: apiData.provider?.name || apiData.provider?.first_name + ' ' + apiData.provider?.last_name || 'Unknown Provider',
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
          response_time: apiData.response_time || 'Within 2 hours',
          is_verified: apiData.provider?.profile?.is_approved || false,
          profile_image: apiData.provider?.profile_picture || '',
          languages: ['English', 'Nepali'],
          working_hours: {
            timezone: 'Asia/Kathmandu',
            availability: {}
          },
          completed_projects: Math.floor(Math.random() * 100) + 10,
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
      
      tags: Array.isArray(apiData.tags) ? apiData.tags : [],
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
      refund_policy: 'Standard refund policy applies',
      modification_policy: 'Modifications allowed as per service terms',
      
      view_count: apiData.view_count || Math.floor(Math.random() * 500) + 100,
      inquiry_count: apiData.inquiry_count || Math.floor(Math.random() * 50) + 10,
      save_count: Math.floor(Math.random() * 100) + 20,
      last_activity: apiData.updated_at || new Date().toISOString(),
      
      created_at: apiData.created_at || new Date().toISOString(),
      updated_at: apiData.updated_at || new Date().toISOString(),
      
      is_favorited: false,
      can_book: true,
      is_available: apiData.status === 'active'
    }
  }

  // Handler functions
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      showToast.warning({
        title: "Login Required",
        description: "Please login to add favorites",
        duration: 3000
      })
      return
    }

    try {
      setIsFavorited(!isFavorited)
      showToast.success({
        title: isFavorited ? "Removed from Favorites" : "Added to Favorites",
        description: isFavorited ? "Service removed from your favorites" : "Service added to your favorites",
        duration: 3000
      })
    } catch (err) {
      console.error('Favorite toggle error:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.title,
          text: service?.short_description,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast.success({
        title: "Link Copied",
        description: "Service link copied to clipboard",
        duration: 3000
      })
    }
  }

  const handleImageGalleryOpen = () => {
    // Implementation for gallery modal
    console.log('Opening image gallery')
  }

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId)
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

    if (!service) {
      showToast.error({
        title: "Service Error",
        description: "Service information is not available.",
        duration: 5000
      })
      return
    }

    setIsBooking(true)
    try {
      // Create booking and redirect to payment
      const bookingData = {
        service: service.id,
        booking_date: formData.preferred_date,
        booking_time: formData.preferred_time,
        address: formData.address || '',
        city: formData.city || '',
        phone: formData.phone || '',
        special_instructions: formData.special_instructions || '',
        price: selectedPackageData?.price || service.packages[0]?.price || 0,
        total_amount: totalPrice,
        status: 'pending' // Set as pending until payment is completed
      }

      const booking = await bookingsApi.createBooking(bookingData)
      
      showToast.success({
        title: "Booking Created!",
        description: `Your booking #${booking.id} has been created. Please complete payment to confirm.`,
        duration: 5000
      })
      
      // Redirect to payment page instead of dashboard
      router.push(`/bookings/${booking.id}/payment`)
    } catch (err: any) {
      console.error('Booking submission error:', err)
      showToast.error({
        title: "Booking Failed",
        description: err.response?.data?.detail || err.message || "Something went wrong. Please try again.",
        duration: 5000
      })
    } finally {
      setIsBooking(false)
    }
  }

  const handleReviewSubmit = async (reviewData: ReviewFormData) => {
    if (!isAuthenticated) {
      showToast.warning({
        title: "Login Required",
        description: "Please login to submit a review",
        duration: 3000
      })
      return
    }

    if (!service?.provider?.id) {
      showToast.error({
        title: "Review Failed",
        description: "Provider information not available",
        duration: 3000
      })
      return
    }

    try {
      // Submit review using actual API
      const reviewPayload = {
        service: service.id,
        rating: reviewData.overall_rating,
        quality_rating: reviewData.quality_rating,
        value_rating: reviewData.value_rating,
        communication_rating: reviewData.communication_rating,
        punctuality_rating: reviewData.punctuality_rating,
        title: reviewData.title,
        comment: reviewData.comment
      }
      
      const newReviewData = await reviewsApi.createProviderReview(service.provider.id, reviewPayload)
      
      // Transform API response to our review format
      const newReview: DetailedReview = {
        id: newReviewData.id,
        user: {
          id: user?.id || 0,
          name: user?.first_name + ' ' + user?.last_name || 'Anonymous',
          avatar: '',
          verified_buyer: true,
          review_count: 1,
          member_since: new Date().toISOString()
        },
        service_id: service.id,
        overall_rating: reviewData.overall_rating,
        quality_rating: reviewData.quality_rating,
        value_rating: reviewData.value_rating,
        communication_rating: reviewData.communication_rating,
        punctuality_rating: reviewData.punctuality_rating,
        title: reviewData.title,
        comment: reviewData.comment,
        is_verified_booking: true,
        is_featured: false,
        helpful_count: 0,
        unhelpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setReviews(prev => [newReview, ...prev])
      
      // Update review summary
      if (reviewSummary) {
        const newTotal = reviewSummary.total_reviews + 1
        const newAverage = ((reviewSummary.average_rating * reviewSummary.total_reviews) + reviewData.overall_rating) / newTotal
        
        setReviewSummary({
          ...reviewSummary,
          average_rating: Math.round(newAverage * 10) / 10,
          total_reviews: newTotal,
          rating_distribution: {
            ...reviewSummary.rating_distribution,
            [reviewData.overall_rating]: reviewSummary.rating_distribution[reviewData.overall_rating as keyof typeof reviewSummary.rating_distribution] + 1
          }
        })
      }
      
      showToast.success({
        title: "Review Submitted!",
        description: "Thank you for your feedback.",
        duration: 3000
      })
    } catch (err: any) {
      console.error('Review submission error:', err)
      showToast.error({
        title: "Review Failed",
        description: err.response?.data?.detail || err.message || "Failed to submit review. Please try again.",
        duration: 3000
      })
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
    
    if (isNavigating) return // Prevent multiple rapid clicks
    
    setIsNavigating(true)
    // Navigate to messaging interface
    router.push(`/messages/${service?.provider.id}`)
  }

  const handleViewPortfolio = () => {
    if (isNavigating) return // Prevent multiple rapid clicks
    
    setIsNavigating(true)
    router.push(`/providers/${service?.provider.id}/portfolio`)
  }

  // Data loading effect
  useEffect(() => {
    const loadServiceDetails = async () => {
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
        
        // Remove slot fetching from service detail page to improve loading performance
        // Slots will be fetched on the booking page when needed
        
        // Fetch reviews
        if (enhancedService.provider?.id) {
          try {
            const reviewsData = await reviewsApi.getProviderReviews(enhancedService.provider.id)
            const transformedReviews: DetailedReview[] = (reviewsData.results || []).map((review: any) => ({
              id: review.id,
              user: {
                id: review.user?.id || 0,
                name: review.user?.name || 'Anonymous',
                avatar: review.user?.avatar,
                verified_buyer: review.is_verified_booking || false,
                review_count: 1,
                member_since: review.created_at
              },
              service_id: enhancedService.id,
              overall_rating: review.rating,
              quality_rating: review.quality_rating || review.rating,
              value_rating: review.value_rating || review.rating,
              communication_rating: review.communication_rating || review.rating, 
              punctuality_rating: review.punctuality_rating || review.rating,
              title: review.title,
              comment: review.comment,
              is_verified_booking: review.is_verified_booking || false,
              is_featured: false,
              helpful_count: 0,
              unhelpful_count: 0,
              created_at: review.created_at,
              updated_at: review.updated_at || review.created_at
            }))
            setReviews(transformedReviews)
            
            // Create review summary
            const summary: ReviewSummary = {
              average_rating: enhancedService.average_rating,
              total_reviews: transformedReviews.length,
              rating_distribution: {
                5: transformedReviews.filter(r => r.overall_rating === 5).length,
                4: transformedReviews.filter(r => r.overall_rating === 4).length,
                3: transformedReviews.filter(r => r.overall_rating === 3).length,
                2: transformedReviews.filter(r => r.overall_rating === 2).length,
                1: transformedReviews.filter(r => r.overall_rating === 1).length
              },
              category_averages: {
                quality: transformedReviews.reduce((sum, r) => sum + r.quality_rating, 0) / transformedReviews.length || 0,
                value: transformedReviews.reduce((sum, r) => sum + r.value_rating, 0) / transformedReviews.length || 0,
                communication: transformedReviews.reduce((sum, r) => sum + r.communication_rating, 0) / transformedReviews.length || 0,
                punctuality: transformedReviews.reduce((sum, r) => sum + r.punctuality_rating, 0) / transformedReviews.length || 0
              },
              recent_trend: 'stable',
              verified_reviews_percentage: Math.round((transformedReviews.filter(r => r.is_verified_booking).length / transformedReviews.length) * 100) || 0
            }
            setReviewSummary(summary)
          } catch (reviewErr) {
            console.warn('Reviews could not be loaded:', reviewErr)
            setReviews([])
            setReviewSummary({
              average_rating: enhancedService.average_rating,
              total_reviews: 0,
              rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
              category_averages: { quality: 0, value: 0, communication: 0, punctuality: 0 },
              recent_trend: 'stable',
              verified_reviews_percentage: 0
            })
          }
        }
        
      } catch (err: any) {
        console.error('Error fetching service details:', err)
        if (err.response?.status === 404) {
          setError('Service not found. The service may have been removed or the ID is invalid.')
        } else {
          setError(err.message || 'Failed to load service details')
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadServiceDetails()
  }, [resolvedParams.id])

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8 space-y-12">
            {/* Hero Section Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="relative h-96">
                <Skeleton className="w-full h-full" />
              </div>
              <div className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-6" />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                  <div className="lg:w-80">
                    <div className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 rounded-2xl p-6 border border-violet-200/50 dark:border-violet-700/50">
                      <Skeleton className="h-6 w-1/2 mb-4" />
                      <Skeleton className="h-8 w-3/4 mb-6" />
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
              <Skeleton className="h-8 w-1/3 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
              </div>
            </div>

            {/* Pricing Section Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
              <Skeleton className="h-8 w-1/3 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <div className="space-y-2 mb-6">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Provider Section Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
              <Skeleton className="h-8 w-1/3 mb-6" />
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <Skeleton className="w-24 h-24 rounded-full" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8">
              <Skeleton className="h-8 w-1/3 mb-6" />
              <div className="flex items-center gap-8 mb-8">
                <div className="text-center">
                  <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
                  <Skeleton className="h-6 w-16 mx-auto" />
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20 ml-auto" />
                    </div>
                    <Skeleton className="h-5 w-3/4 mb-3" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-red-600 mb-4">Service Not Found</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {error || "The service you're looking for doesn't exist or has been removed."}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Enhanced Header without Breadcrumb */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">          
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/services')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleFavoriteToggle}>
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <ServiceHeroSection
          service={service}
          onImageGalleryOpen={handleImageGalleryOpen}
          onFavoriteToggle={handleFavoriteToggle}
          isFavorited={isFavorited}
          onShare={handleShare}
          onBookNow={() => router.push(`/services/${service.id}/book`)}
          viewCount={viewCount}
          recentBookings={recentBookings}
        />

        {/* Description Section */}
        <ServiceDescriptionSection
          service={service}
        />

        {/* Pricing Section */}
        <ServicePricingSection
          packages={service.packages}
          pricing_type={service.pricing_type}
          currency={service.currency}
          selectedPackage={selectedPackage}
          onPackageSelect={handlePackageSelect}
          onGetQuote={() => {
            // Handle quote request
            showToast.info({
              title: "Quote Request",
              description: "Contact the provider for a custom quote",
              duration: 3000
            })
          }}
          onContactProvider={handleMessageProvider}
        />

        {/* Provider Section */}
        <ServiceProviderSection
          service={service}
          provider={service.provider}
          onMessageProvider={handleMessageProvider}
          onViewPortfolio={handleViewPortfolio}
        />

        {/* Reviews Section */}
        <ServiceReviewsSection
          reviews={reviews}
          summary={reviewSummary || {
            average_rating: 0,
            total_reviews: 0,
            rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            category_averages: { quality: 0, value: 0, communication: 0, punctuality: 0 },
            recent_trend: 'stable',
            verified_reviews_percentage: 0
          }}
          isLoading={loading}
          onReviewSubmit={handleReviewSubmit}
          canReview={isAuthenticated && user?.role === 'customer'}
        />

        {/* Enhanced Call to Action Section */}
        <div className="bg-gradient-to-br from-violet-50 via-blue-50/50 to-indigo-50/40 dark:from-violet-950/20 dark:via-blue-950/10 dark:to-indigo-950/20 rounded-3xl p-8 border border-violet-200/50 dark:border-violet-700/50 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Action Buttons */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Ready to Book This Service?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Start your project today with our professional service provider.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Primary Book Now Button */}
                <Button 
                  onClick={() => router.push(`/services/${service.id}/book`)}
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Book Now - {service.currency} {Math.min(...service.packages.map(pkg => pkg.price)).toLocaleString()}
                </Button>
                
                {/* Secondary Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="lg" onClick={handleFavoriteToggle}>
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleShare}>
                    <Share2 className="h-5 w-5 text-slate-600" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleMessageProvider}>
                    <MessageCircle className="h-5 w-5 text-slate-600" />
                  </Button>
                </div>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
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
            
            {/* Right Side - Quick Info */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                  What You Get:
                </h4>
                <div className="space-y-3">
                  {service.packages[0]?.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Starting from:</span>
                    <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                      {service.currency} {Math.min(...service.packages.map(pkg => pkg.price)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}