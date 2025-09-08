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
import { getStatusInfo } from "@/utils/statusUtils"
import type { PaymentMethod } from "@/types"

// CSS animations for enhanced UI
const animationStyles = `
@keyframes animation-delay-500 {
  0% { animation-delay: 0.5s; }
}
@keyframes animation-delay-1000 {
  0% { animation-delay: 1s; }
}
.animation-delay-500 {
  animation-delay: 0.5s;
}
.animation-delay-1000 {
  animation-delay: 1s;
}
`

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
  // Payment related fields
  payment?: {
    id: number
    status: "pending" | "processing" | "completed" | "failed"
    payment_type: "digital_wallet" | "bank_transfer" | "cash"
    amount: number
    paid_at?: string
  }
  payment_status?: "pending" | "paid" | "refunded"
  has_payment?: boolean
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

  // Add custom animation styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = animationStyles
    document.head.appendChild(styleElement)
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Fetch booking details
  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch booking details from API
      const bookingData = await bookingsApi.getBookingById(parseInt(bookingId))
      
      // Handle different response structures - use service_details if available, otherwise service
      const processedBooking = {
        ...bookingData,
        service: bookingData.service_details || bookingData.service
      }
      
      setBooking(processedBooking)
      
      // Fetch real payment methods from API
      try {
        const paymentMethodsData = await bookingsApi.getPaymentMethods()
        
        // Ensure paymentMethodsData is an array
        const methodsArray = Array.isArray(paymentMethodsData) ? paymentMethodsData : 
                            (paymentMethodsData?.results && Array.isArray(paymentMethodsData.results)) ? paymentMethodsData.results : []
        
        console.log('Payment methods fetched:', methodsArray) // Debug log
        setPaymentMethods(methodsArray)
        
        // Default to first available method (usually Khalti)
        if (methodsArray && methodsArray.length > 0) {
          setSelectedPaymentMethod(methodsArray[0])
        }
      } catch (methodError: any) {
        console.error('Failed to load payment methods:', methodError)
      }
      
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

  // Check if payment is already completed
  const isPaymentCompleted = () => {
    if (!booking) return false
    
    // Check various indicators of completed payment
    const hasCompletedPayment = booking.payment?.status === "completed" ||
                               booking.payment_status === "paid" ||
                               booking.status === "confirmed" ||
                               booking.status === "completed" ||
                               booking.status === "service_delivered" ||
                               booking.status === "awaiting_confirmation"
    
    return hasCompletedPayment
  }

  // Check if payment can be modified (cash to digital switch)
  const canModifyPayment = () => {
    if (!booking) return false
    
    // Allow modification only for pending payments or cash payments that haven't been collected
    const canModify = booking.status === "pending" ||
                     (booking.payment?.payment_type === "cash" && !booking.payment?.paid_at)
    
    return canModify
  }

  // Handle payment success
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setPaymentLoading(true)
      
      // Check if payment is already completed before processing
      if (isPaymentCompleted()) {
        showToast.error({
          title: "Payment Already Completed",
          description: "This booking has already been paid for. Please refresh the page.",
          duration: 5000
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        return
      }
      
      // Process payment through backend Khalti integration
      const paymentResult = await bookingsApi.processKhaltiPayment({
        token: paymentData.token,
        amount: Math.round(booking!.total_amount * 100), // Convert to paisa
        booking_id: booking!.id
      })
      
      if (paymentResult.success) {
        showToast.success({
          title: "Payment Successful!",
          description: "Your booking has been confirmed. You'll receive a confirmation email shortly.",
          duration: 3000
        })

        // Redirect to booking confirmation page or dashboard
        setTimeout(() => {
          router.push(`/dashboard/customer/bookings`)
        }, 1000)
      } else {
        throw new Error(paymentResult.error || 'Payment processing failed')
      }
      
    } catch (err: any) {
      console.error('Payment processing error:', err)
      showToast.error({
        title: "Payment Error",
        description: err.message || "Payment processing failed. Please try again.",
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
      
      // Check if payment is already completed before processing
      if (isPaymentCompleted()) {
        showToast.error({
          title: "Payment Already Completed",
          description: "This booking has already been paid for. Please refresh the page.",
          duration: 5000
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        return
      }
      
      // Check if a payment already exists for this booking
      const existingPaymentCheck = async () => {
        try {
          // Try to initiate payment with the cash payment method
          await bookingsApi.initiatePayment(booking!.id, selectedPaymentMethod!.id)
        } catch (paymentError: any) {
          // If payment already exists, that's okay for cash payments
          if (paymentError.response?.status === 400 && 
              (paymentError.response.data?.detail?.includes('already exists') || 
               paymentError.response.data?.error?.includes('already exists'))) {
            console.log('Payment already exists for this booking, proceeding with status update')
            return true // Payment exists, continue
          } else {
            throw paymentError // Re-throw if it's a different error
          }
        }
        return true // Payment initiated successfully
      }
      
      await existingPaymentCheck()
      
      // Update booking status to confirmed for cash payment
      await bookingsApi.updateBookingStatus(booking!.id, {
        status: "confirmed"
      })
      
      showToast.success({
        title: "Booking Confirmed!",
        description: "Your booking has been confirmed. The provider will mark the service as delivered when completed, and you'll be able to confirm service completion.",
        duration: 4000
      })

      // Add delay before redirecting so user can see the toast
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect to booking dashboard
      router.push(`/dashboard/customer/bookings`)
      
    } catch (err: any) {
      console.error('Cash payment error:', err)
      // More descriptive error message
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          (err.response?.data && typeof err.response.data === 'object' 
                            ? Object.values(err.response.data).flat().join(', ') 
                            : null) ||
                          "There was an issue confirming your booking. Please try again."
      
      showToast.error({
        title: "Booking Error",
        description: errorMessage,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-24 bg-muted rounded animate-pulse" />
            </div>
            
            <div className="mb-2">
              <div className="h-8 w-64 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Section Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Summary Card Skeleton */}
              <Card>
                <CardHeader>
                  <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    {/* Image Skeleton */}
                    <div className="relative w-20 h-20 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                    
                    {/* Content Skeleton */}
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods Card Skeleton */}
              <Card>
                <CardHeader>
                  <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Payment Method Options Skeleton */}
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-xl border-2 border-border p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                            {item === 1 && <div className="h-5 w-16 bg-muted rounded animate-pulse" />}
                          </div>
                          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment Details Card Skeleton */}
              <Card>
                <CardHeader>
                  <div className="h-6 w-36 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-muted animate-pulse" />
                    <div className="h-6 w-48 bg-muted rounded mx-auto animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
                    <div className="h-12 w-48 bg-muted rounded mx-auto animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Card Skeleton */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Breakdown Skeleton */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between">
                      <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Secure Payment Info Skeleton */}
                  <div className="rounded-xl border p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-full bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Features List Skeleton */}
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
                        <div className="h-3 w-full bg-muted rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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

  // Payment completion check - redirect if payment is already completed
  if (isPaymentCompleted()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          {/* Top Navigation */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/services')}
              className="mb-4 group hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Services
            </Button>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Main Success Card */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 shadow-xl shadow-green-100 dark:shadow-green-900/20 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
              <CardContent className="p-0">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-4 md:p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/8 rounded-full blur-xl animate-pulse" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/4 rounded-full blur-lg animate-pulse animation-delay-1000" />
                  <div className="relative text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20 hover:scale-110 transition-transform duration-500">
                      <CheckCircle2 className="h-8 w-8 text-white animate-bounce" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">
                      Payment Completed Successfully!
                    </h2>
                    <p className="text-green-50 opacity-90 text-sm">
                      This booking has already been paid for
                    </p>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Booking Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        Booking Information
                      </h3>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 shadow-lg border border-gray-100 dark:border-gray-800/30 hover:shadow-xl transition-all duration-500 group hover:scale-[1.02]">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100">{booking.service.title}</h4>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <p className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {format(new Date(booking.booking_date), "PPP")} at {booking.booking_time}
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {booking.address}, {booking.city}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-700/30 hover:shadow-lg transition-all duration-500 group hover:scale-[1.02]">
                        <span className="font-bold text-blue-800 dark:text-blue-200">Total Amount</span>
                        <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                          NPR {booking.total_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Payment Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        Payment Details
                      </h3>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 shadow-lg border border-gray-100 dark:border-gray-800/30 hover:shadow-xl transition-all duration-500 group hover:scale-[1.02]">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors duration-300">
                            <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Booking Status</span>
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-colors hover:scale-105 duration-300 text-xs">
                              {booking.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          {booking.payment && (
                            <>
                              <div className="flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors duration-300">
                                <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Payment Status</span>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 transition-colors hover:scale-105 duration-300 text-xs">
                                  {booking.payment.status.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors duration-300">
                                <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Payment Method</span>
                                <span className="font-bold text-gray-900 dark:text-gray-100 capitalize text-sm">
                                  {booking.payment.payment_type.replace('_', ' ')}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors duration-300">
                                <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Amount Paid</span>
                                <span className="font-black text-gray-900 dark:text-gray-100">
                                  NPR {booking.payment.amount.toLocaleString()}
                                </span>
                              </div>
                              
                              {booking.payment.paid_at && (
                                <div className="flex justify-between items-center group/item hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors duration-300">
                                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Payment Date</span>
                                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                    {format(new Date(booking.payment.paid_at), "MMM dd, yyyy")}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => router.push('/dashboard/customer/bookings')}
                      className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.05] group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CreditCard className="mr-2 h-4 w-4 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12" />
                      <span className="relative z-10">View My Bookings</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/dashboard/customer/payments')}
                      className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.05] group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CreditCard className="mr-2 h-4 w-4 transition-transform duration-500 group-hover:scale-125" />
                      <span className="relative z-10">Payment Dashboard</span>
                    </Button>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-lg border border-blue-200 dark:border-blue-700/30 hover:shadow-lg transition-all duration-500 group hover:scale-[1.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1 text-sm">What's Next?</h4>
                        <p className="text-blue-700 dark:text-blue-300 leading-relaxed text-xs">
                          Your booking is confirmed! The service provider will contact you before the scheduled time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Top Navigation */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/services')}
            className="mb-4 group hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Services
          </Button>
          
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Secure payment for your booking
            </p>
          </div>
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
                      <span className="text-sm text-gray-600">
                        {booking.service.provider?.name || (booking.service.provider as any)?.full_name || 'Provider'}
                      </span>
                      {booking.service.provider?.profile?.is_verified && (
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
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Select Payment Method
                  {!canModifyPayment() && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                      Limited Options
                    </Badge>
                  )}
                </CardTitle>
                {!canModifyPayment() && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-orange-800 dark:text-orange-200 font-medium">Payment Method Locked</p>
                        <p className="text-orange-700 dark:text-orange-300 mt-1">
                          This booking's payment method cannot be changed as payment processing has already begun or been completed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.isArray(paymentMethods) && paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => {
                    const isSelected = selectedPaymentMethod?.id === method.id;
                    const isDisabled = !canModifyPayment() && method.payment_type !== 'cash';
                    
                    return (
                      <div
                        key={method.id}
                        className={`
                          group relative overflow-hidden rounded-xl border-2 p-4 
                          transition-all duration-200 ease-out transform-gpu
                          ${
                            isDisabled 
                              ? 'opacity-50 cursor-not-allowed border-border bg-muted/50'
                              : isSelected
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md shadow-primary/20 scale-[1.02] cursor-pointer'
                                : 'border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/5 hover:shadow-sm hover:scale-[1.01] cursor-pointer'
                          }
                        `}
                        onClick={() => !isDisabled && handlePaymentMethodSelect(method)}
                      >
                        {/* Selection Indicator */}
                        {isSelected && !isDisabled && (
                          <div className="absolute top-3 right-3">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        
                        {/* Disabled Indicator */}
                        {isDisabled && (
                          <div className="absolute top-3 right-3">
                            <div className="w-5 h-5 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                              <AlertCircle className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex items-center gap-4">
                          {/* Enhanced Icon Display */}
                          <div className={`
                            relative flex items-center justify-center w-14 h-14 rounded-xl 
                            transition-all duration-200 ease-out
                            ${
                              isSelected
                                ? 'bg-primary/10 dark:bg-primary/20 shadow-sm'
                                : 'bg-muted group-hover:bg-primary/5 dark:group-hover:bg-primary/10'
                            }
                          `}>
                            {method.icon_image ? (
                              <img 
                                src={method.icon_image} 
                                alt={method.name}
                                className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
                              />
                            ) : method.icon_url ? (
                              <img 
                                src={method.icon_url} 
                                alt={method.name}
                                className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
                                onError={(e) => {
                                  // Fallback to emoji if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-2xl transition-transform duration-200 group-hover:scale-110">${method.icon_emoji || '💳'}</span>`;
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                                {method.icon_emoji || '💳'}
                              </span>
                            )}
                          </div>
                          
                          {/* Method Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold transition-colors ${
                                isDisabled ? 'text-muted-foreground' :
                                isSelected ? 'text-primary' : 'text-foreground'
                              }`}>
                                {method.name}
                              </h4>
                              {method.is_featured && !isDisabled && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                >
                                  Popular
                                </Badge>
                              )}
                              {isDisabled && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-muted text-muted-foreground border-border"
                                >
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed ${
                              isDisabled ? 'text-muted-foreground' : 'text-muted-foreground'
                            }`}>
                              {isDisabled 
                                ? `${method.description} (Not available for this booking)`
                                : method.description
                              }
                            </p>
                            {method.processing_fee_percentage > 0 && !isDisabled && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Processing fee: {method.processing_fee_percentage}%
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Subtle gradient overlay on hover */}
                        <div className={`
                          absolute inset-0 opacity-0 transition-opacity duration-200
                          bg-gradient-to-r from-primary/5 to-accent/5
                          ${
                            isSelected ? 'opacity-100' : 'group-hover:opacity-50'
                          }
                        `} />
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-3">
                    {/* Payment Methods Loading Skeleton */}
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="rounded-xl border-2 border-border p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-20 bg-muted rounded" />
                              {item === 1 && <div className="h-5 w-16 bg-muted rounded" />}
                            </div>
                            <div className="h-4 w-3/4 bg-muted rounded" />
                            <div className="h-3 w-1/2 bg-muted rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Processing */}
            {selectedPaymentMethod && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPaymentMethod.payment_type === 'cash' ? (
                    <div className="text-center py-8">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center mb-4">
                          <div className="text-4xl">💰</div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground">Cash on Service</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed max-w-md mx-auto">
                        You'll pay in cash when the service is completed. No advance payment required.
                        Your booking will be confirmed immediately.
                      </p>
                      <Button 
                        onClick={handleCashPayment}
                        disabled={paymentLoading}
                        className="w-full max-w-sm mx-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 h-auto"
                        size="lg"
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Confirming Booking...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Confirm Booking
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 p-6 border border-primary/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-2xl" />
                        <div className="relative">
                          <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            Payment Amount
                          </h4>
                          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            NPR {booking.total_amount.toLocaleString()}
                          </div>
                          {selectedPaymentMethod.processing_fee_percentage > 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Includes {selectedPaymentMethod.processing_fee_percentage}% processing fee
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {selectedPaymentMethod.name === 'Khalti' ? (
                        <div className="bg-muted/50 rounded-xl p-6">
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
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <div className="text-3xl">🚧</div>
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-foreground">Coming Soon</h3>
                          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            {selectedPaymentMethod.name} payment integration is coming soon.
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedPaymentMethod(paymentMethods[0])}
                            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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

            {/* Service Delivery Workflow Information - Added to main content area */}
            <Card className="mt-6 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Service Delivery Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold mt-0.5 shadow-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">Payment Confirmation</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Complete payment to confirm your booking
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm flex items-center justify-center font-semibold mt-0.5 shadow-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">Service Delivery</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Provider will mark service as delivered when completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm flex items-center justify-center font-semibold mt-0.5 shadow-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">Customer Confirmation</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        You'll confirm service completion and provide feedback
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
