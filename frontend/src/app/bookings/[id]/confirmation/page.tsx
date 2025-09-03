"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { 
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Star,
  Shield,
  Download,
  Share2,
  ArrowRight
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useParams } from "next/navigation"
import { showToast } from "@/components/ui/enhanced-toast"

// Types
interface Booking {
  id: number
  service: {
    id: number
    title: string
    image?: string
    price: number
    discount_price?: number
    duration: string
    provider: {
      id: number
      name: string
      email: string
      phone?: string
      profile?: {
        avg_rating?: number
        reviews_count?: number
        is_verified?: boolean
        profile_image?: string
      }
    }
  }
  booking_date: string
  booking_time: string
  address: string
  city: string
  phone: string
  special_instructions: string
  preferred_provider_gender: string
  price: number
  discount: number
  total_amount: number
  status: string
  created_at: string
  payment_method?: string
}

export default function BookingConfirmationPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  // State
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch booking details
  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch booking details from API
      const bookingData = await bookingsApi.getBookingById(parseInt(bookingId))
      setBooking(bookingData)
      
    } catch (err: any) {
      console.error('Error fetching booking details:', err)
      setError(err.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  // Handle download receipt
  const handleDownloadReceipt = () => {
    // Mock download functionality
    showToast.success({
      title: "Receipt Downloaded",
      description: "Your booking receipt has been downloaded successfully.",
      duration: 3000
    })
  }

  // Handle share booking
  const handleShareBooking = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Booking Confirmation - ${booking?.service.title}`,
          text: `I've booked ${booking?.service.title} for ${format(new Date(booking?.booking_date || ''), "PPP")} at ${booking?.booking_time}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      showToast.success({
        title: "Link Copied",
        description: "Booking link copied to clipboard",
        duration: 3000
      })
    }
  }

  // Effects
  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading booking confirmation...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 text-red-500">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || "The booking you're looking for doesn't exist or has been removed."}
          </p>
          <div className="space-x-4">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
            <Button onClick={() => router.push('/services')}>
              Browse Services
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Your booking has been successfully confirmed. We've sent you a confirmation email.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Service Details</span>
                  <Badge variant="secondary" className="ml-auto">
                    {booking.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image 
                      src={booking.service.image || "/placeholder.svg"} 
                      alt={booking.service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{booking.service.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Duration: {booking.service.duration}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{booking.service.provider.name}</span>
                      {booking.service.provider.profile?.is_verified && (
                        <Shield className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {booking.service.provider.profile?.avg_rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {booking.service.provider.profile.avg_rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({booking.service.provider.profile.reviews_count} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(booking.booking_date), "PPP")} at {booking.booking_time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-gray-600">
                        {booking.address}, {booking.city}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Contact Phone</p>
                      <p className="text-sm text-gray-600">{booking.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Provider Preference</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {booking.preferred_provider_gender} provider
                      </p>
                    </div>
                  </div>
                </div>
                
                {booking.special_instructions && (
                  <div className="pt-4 border-t">
                    <p className="font-medium mb-2">Special Instructions</p>
                    <p className="text-sm text-gray-600">{booking.special_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image 
                      src={booking.service.provider.profile?.profile_image || "/placeholder.svg"} 
                      alt={booking.service.provider.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{booking.service.provider.name}</h4>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {booking.service.provider.phone || "Phone not available"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {booking.service.provider.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Provider Notification</h4>
                      <p className="text-sm text-gray-600">
                        The service provider has been notified of your booking and will confirm within 24 hours.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Service Day</h4>
                      <p className="text-sm text-gray-600">
                        On the scheduled date, the provider will arrive at your location at the specified time.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Service Completion</h4>
                      <p className="text-sm text-gray-600">
                        After the service is completed, you can rate and review your experience.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service Price</span>
                    <span>NPR {booking.service.price.toLocaleString()}</span>
                  </div>
                  {booking.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-NPR {booking.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Paid</span>
                    <span>NPR {booking.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Payment Successful
                    </span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Paid via {booking.payment_method}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleShareBooking}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Booking
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/services/${booking.service.id}`)}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View Service Details
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  If you have any questions about your booking, our support team is here to help.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>+977-1-4444444</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>support@sewabazaar.com</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 text-center">
          <div className="space-x-4">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => router.push('/services')}>
              Browse More Services
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
