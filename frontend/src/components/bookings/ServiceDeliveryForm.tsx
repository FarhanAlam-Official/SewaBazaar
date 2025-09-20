"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { Truck, Upload, X, CheckCircle } from "lucide-react"
import { providerApi } from "@/services/provider.api"
import { Booking } from "@/types"

// Define a partial booking interface for the form
interface PartialBooking {
  id: number | string
  service?: {
    title?: string
  }
  booking_date?: string
  booking_time?: string
  total_amount?: number
  // Add other properties as needed
}

interface ServiceDeliveryFormProps {
  booking: PartialBooking
  onSuccess: () => void
  onCancel: () => void
}

export default function ServiceDeliveryForm({ booking, onSuccess, onCancel }: ServiceDeliveryFormProps) {
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [deliveryPhotos, setDeliveryPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMarkDelivered = async () => {
    if (!deliveryNotes.trim()) {
      showToast.error({
        title: "Delivery Notes Required",
        description: "Please provide notes about the service delivery",
        duration: 3000
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      await providerApi.markServiceDelivered(
        Number(booking.id),
        deliveryNotes,
        deliveryPhotos
      )
      
      showToast.success({
        title: "Service Marked as Delivered",
        description: "Customer will be notified to confirm service completion",
        duration: 3000
      })
      
      onSuccess()
    } catch (error: any) {
      console.error('Error marking service as delivered:', error)
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          "Failed to mark service as delivered"
      
      showToast.error({
        title: "Error",
        description: errorMessage,
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // In a real implementation, you would upload files to a storage service
      // For now, we'll just add the file names to the array
      const newPhotos = Array.from(files).map(file => file.name)
      setDeliveryPhotos(prev => [...prev, ...newPhotos])
    }
  }

  const removePhoto = (index: number) => {
    setDeliveryPhotos(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-purple-600" />
          <CardTitle>Mark Service as Delivered</CardTitle>
        </div>
        <CardDescription>
          Confirm that you have completed the service for this booking. The customer will be notified to confirm service completion.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Booking Details */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Booking Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Service:</span>
              <span className="ml-2 font-medium">{booking.service?.title || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="ml-2 font-medium">{booking.booking_date}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Time:</span>
              <span className="ml-2 font-medium">{booking.booking_time}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Amount:</span>
              <span className="ml-2 font-medium">Rs. {booking.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Delivery Notes */}
        <div className="space-y-2">
          <Label htmlFor="delivery-notes" className="text-sm font-medium">
            Delivery Notes <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="delivery-notes"
            placeholder="Describe what was completed, any issues encountered, or additional work performed..."
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Minimum 10 characters. Describe the service completion in detail.
          </p>
        </div>

        {/* Delivery Photos */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Service Photos (Optional)</Label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Upload photos of the completed service
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                Choose Photos
              </Button>
            </div>
          </div>
          
          {/* Photo Preview */}
          {deliveryPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Photos:</p>
              <div className="flex flex-wrap gap-2">
                {deliveryPhotos.map((photo, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {photo}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleMarkDelivered}
            disabled={isSubmitting || !deliveryNotes.trim()}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Marking as Delivered...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Service as Delivered
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Important:</strong> Once marked as delivered, the customer will be notified to confirm service completion. 
            The booking will only be considered fully completed after customer confirmation.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
