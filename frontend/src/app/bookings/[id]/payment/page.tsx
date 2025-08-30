"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Shield,
  Clock,
  MapPin,
  User,
  Star
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useParams } from "next/navigation"
import { showToast } from "@/components/ui/enhanced-toast"
import { bookingsApi } from "@/services/api"
import { KhaltiPayment } from "@/components/services/KhaltiPayment"

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
      profile?: {
        avg_rating?: number
        reviews_count?: number
        is_verified?: boolean
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
}

interface PaymentMethod {
  id: number
  name: string
  payment_type: string
  icon: string
  is_featured: boolean
  description: string
}

export default function BookingPaymentPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string

  // State
  const [booking, setBooking] = useState<Booking | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)

  // Fetch booking details
  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch booking details from API
      const bookingData = await bookingsApi.getBookingById(parseInt(bookingId))
      setBooking(bookingData)
      
      // Mock payment methods - replace with actual API call when payment methods API is ready
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 1,
          name: "Khalti",
          payment_type: "digital_wallet",
          icon: "💳",
          is_featured: true,
          description: "Fast and secure digital payment"
        },
        {
          id: 2,
          name: "eSewa",
          payment_type: "digital_wallet",
          icon: "📱",
          is_featured: false,
          description: "Popular mobile payment solution"
        },
        {
          id: 3,
          name: "Cash on Service",
          payment_type: "cash",
          icon: "💰",
          is_featured: false,
          description: "Pay after service completion"
        }
      ]
      
      setPaymentMethods(mockPaymentMethods)
      setSelectedPaymentMethod(mockPaymentMethods[0]) // Default to Khalti
      
    } catch (err: any) {
      console.error('Error fetching booking details:', err)
      setError(err.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
  }

  // Handle payment success
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setPaymentLoading(true)
      
      // Update booking status to confirmed
      await bookingsApi.updateBookingStatus(booking!.id, {
        status: "confirmed",
        payment_data: paymentData
      })
      
      showToast.success({
        title: "Payment Successful!",
        description: "Your booking has been confirmed. You'll receive a confirmation email shortly.",
        duration: 5000
      })

      // Redirect to booking confirmation page
      setTimeout(() => {
        router.push(`/bookings/${booking!.id}/confirmation`)
      }, 2000)
      
    } catch (err: any) {
      console.error('Payment confirmation error:', err)
      showToast.error({
        title: "Payment Error",
        description: "Payment was successful but there was an issue updating your booking. Please contact support.",
        duration: 5000
      })
    } finally {
      setPaymentLoading(false)
    }
  }

  // Handle payment error
  const handlePaymentError = (error: string) => {
    showToast.error({
      title: "Payment Failed",
      description: error,
      duration: 5000
    })
  }

  // Handle cash payment
  const handleCashPayment = async () => {
    try {
      setPaymentLoading(true)
      
      // Update booking status to confirmed for cash payment
      await bookingsApi.updateBookingStatus(booking!.id, {
        status: "confirmed",
        payment_method: "cash"
      })
      
      showToast.success({
        title: "Booking Confirmed!",
        description: "Your booking has been confirmed. Please pay in cash when the service is completed.",
        duration: 5000
      })

      // Redirect to booking confirmation page
      setTimeout(() => {
        router.push(`/bookings/${booking!.id}/confirmation`)
      }, 2000)
      
    } catch (err: any) {
      console.error('Cash payment error:', err)
      showToast.error({
        title: "Booking Error",
        description: "There was an issue confirming your booking. Please try again.",
        duration: 5000
      })
    } finally {
      setPaymentLoading(false)
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
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-300">Loading payment details...</p>
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
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || "The booking you're looking for doesn't exist or has been removed."}
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
    )
  }

  const currentPrice = booking.service.discount_price || booking.service.price
  const originalPrice = booking.service.discount_price ? booking.service.price : null
  const hasDiscount = !!booking.service.discount_price

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Secure payment for your booking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image 
                      src={booking.service.image || "/placeholder.svg"} 
                      alt={booking.service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{booking.service.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{booking.service.provider.name}</span>
                      {booking.service.provider.profile?.is_verified && (
                        <Shield className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(booking.booking_date), "PPP")} at {booking.booking_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{booking.address}, {booking.city}</span>
                    </div>
                    {booking.service.provider.profile?.avg_rating && (
                      <div className="flex items-center gap-1 mt-2">
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

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPaymentMethod?.id === method.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePaymentMethodSelect(method)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <h4 className="font-medium">{method.name}</h4>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                      {method.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Processing */}
            {selectedPaymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPaymentMethod.payment_type === 'cash' ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">💰</div>
                      <h3 className="text-lg font-semibold mb-2">Cash on Service</h3>
                      <p className="text-gray-600 mb-6">
                        You'll pay in cash when the service is completed. No payment required now.
                      </p>
                      <Button 
                        onClick={handleCashPayment}
                        disabled={paymentLoading}
                        className="w-full"
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirming Booking...
                          </>
                        ) : (
                          "Confirm Booking"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Payment Amount</h4>
                        <div className="text-2xl font-bold text-blue-600">
                          NPR {booking.total_amount.toLocaleString()}
                        </div>
                      </div>
                      
                      {selectedPaymentMethod.name === 'Khalti' ? (
                        <KhaltiPayment
                          booking={{
                            id: booking.id,
                            service: {
                              title: booking.service.title,
                              provider: {
                                full_name: booking.service.provider.name
                              }
                            },
                            total_amount: booking.total_amount,
                            booking_date: booking.booking_date,
                            booking_time: booking.booking_time
                          }}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentError={handlePaymentError}
                          onCancel={() => router.back()}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">🚧</div>
                          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                          <p className="text-gray-600 mb-6">
                            {selectedPaymentMethod.name} payment integration is coming soon.
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedPaymentMethod(paymentMethods[0])}
                          >
                            Use Khalti Instead
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service Price</span>
                    <span>NPR {currentPrice.toLocaleString()}</span>
                  </div>
                  {hasDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-NPR {(originalPrice! - currentPrice).toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>NPR {booking.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Secure Payment</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your payment information is encrypted and secure.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Free cancellation up to 24 hours before service</p>
                  <p>• Secure payment through SewaBazaar</p>
                  <p>• 100% satisfaction guarantee</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
