"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { UserCheck, Star, ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react"
import { bookingsApi } from "@/services/api"
import { Booking } from "@/types"

// Define a partial booking interface for the form
interface PartialBooking {
  id: number | string
  service?: {
    title?: string
  }
  provider?: {
    name?: string
  }
  booking_date?: string
  booking_time?: string
  service_delivery?: any
  // Add other properties as needed
}

interface ServiceConfirmationFormProps {
  booking: PartialBooking
  onSuccess: () => void
  onCancel: () => void
}

export default function ServiceConfirmationForm({ booking, onSuccess, onCancel }: ServiceConfirmationFormProps) {
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState("")
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirmCompletion = async () => {
    if (rating === 0) {
      showToast.error({
        title: "Rating Required",
        description: "Please provide a rating for the service",
        duration: 3000
      })
      return
    }

    if (wouldRecommend === null) {
      showToast.error({
        title: "Recommendation Required",
        description: "Please indicate if you would recommend this provider",
        duration: 3000
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      await bookingsApi.confirmServiceCompletion(Number(booking.id), {
        customer_rating: rating,
        customer_notes: notes,
        would_recommend: wouldRecommend
      })
      
      showToast.success({
        title: "Service Confirmed",
        description: "Thank you for confirming service completion!",
        duration: 3000
      })
      
      onSuccess()
    } catch (error: any) {
      console.error('Error confirming service completion:', error)
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          "Failed to confirm service completion"
      
      showToast.error({
        title: "Error",
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            type="button"
            variant={star <= rating ? "default" : "outline"}
            size="sm"
            onClick={() => setRating(star)}
            className="h-8 w-8 p-0"
            disabled={isSubmitting}
          >
            <Star className={`h-4 w-4 ${star <= rating ? 'fill-current' : ''}`} />
          </Button>
        ))}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-orange-600" />
          <CardTitle>Confirm Service Completion</CardTitle>
        </div>
        <CardDescription>
          Please confirm that the service was completed to your satisfaction. Your feedback helps us improve our services.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Booking Details */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Service Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Service:</span>
              <span className="ml-2 font-medium">{booking.service?.title || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Provider:</span>
              <span className="ml-2 font-medium">{booking.provider?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="ml-2 font-medium">{booking.booking_date}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Time:</span>
              <span className="ml-2 font-medium">{booking.booking_time}</span>
            </div>
          </div>
        </div>

        {/* Service Delivery Info */}
        {booking.service_delivery && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-purple-800 dark:text-purple-200">Service Delivery Info</h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-purple-700 dark:text-purple-300">Delivered by:</span>
                <span className="ml-2 font-medium">{booking.service_delivery.delivered_by_name || 'Provider'}</span>
              </div>
              <div>
                <span className="text-purple-700 dark:text-purple-300">Delivered at:</span>
                <span className="ml-2 font-medium">
                  {booking.service_delivery.delivered_at ? 
                    new Date(booking.service_delivery.delivered_at).toLocaleString() : 
                    'N/A'
                  }
                </span>
              </div>
              {booking.service_delivery.delivery_notes && (
                <div>
                  <span className="text-purple-700 dark:text-purple-300">Provider notes:</span>
                  <p className="ml-2 mt-1 text-gray-700 dark:text-gray-300">
                    {booking.service_delivery.delivery_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Rating */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            How would you rate this service? <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-3">
            {renderStars()}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {rating > 0 && (
                <>
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="confirmation-notes" className="text-sm font-medium">
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="confirmation-notes"
            placeholder="Any feedback about the service quality, provider performance, or suggestions for improvement..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500">
            Your feedback helps us improve our services and helps other customers make informed decisions.
          </p>
        </div>

        {/* Recommendation */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Would you recommend this provider to others? <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={wouldRecommend === true ? "default" : "outline"}
              onClick={() => setWouldRecommend(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Yes
            </Button>
            <Button
              type="button"
              variant={wouldRecommend === false ? "default" : "outline"}
              onClick={() => setWouldRecommend(false)}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              No
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConfirmCompletion}
            disabled={isSubmitting || rating === 0 || wouldRecommend === null}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Service Completion
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        {/* Important Note */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Thank you!</strong> Your confirmation helps us maintain service quality and provides valuable feedback 
            for our providers. The booking will be marked as completed once you confirm.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
