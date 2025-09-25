"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/components/ui/enhanced-toast"
import { Truck, Upload, X, CheckCircle } from "lucide-react"
import { useProviderBookings } from "@/hooks/useProviderBookings"
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
  const [deliveryPhotos, setDeliveryPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { markServiceDelivered, updating } = useProviderBookings()

  const handleMarkDelivered = async () => {
    // Prevent double submission
    if (isSubmitting || updating) {
      return
    }

    if (!deliveryNotes.trim()) {
      showToast.error({
        title: "Delivery Notes Required",
        description: "Please provide notes about the service delivery",
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)
    try {
      // First upload photos if any
      let uploadedPhotoUrls: string[] = []
      if (deliveryPhotos.length > 0) {
        try {
          const uploadResult = await providerApi.uploadDeliveryPhotos(Number(booking.id), deliveryPhotos)
          uploadedPhotoUrls = uploadResult.uploaded_photos
        } catch (uploadError: any) {
          console.error('Error uploading photos:', uploadError)
          showToast.error({
            title: "Photo Upload Failed",
            description: "Failed to upload photos. Please try again.",
            duration: 5000
          })
          return
        }
      }

      // Then mark service as delivered with the uploaded photo URLs
      await markServiceDelivered(
        Number(booking.id),
        deliveryNotes,
        uploadedPhotoUrls
      )
      
      onSuccess()
    } catch (error: any) {
      console.error('Error marking service as delivered:', error)
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      
      // Validate file types and sizes
      const validFiles: File[] = []
      const invalidFiles: string[] = []
      
      fileArray.forEach(file => {
        if (!file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} (not an image)`)
        } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
          invalidFiles.push(`${file.name} (too large, max 5MB)`)
        } else {
          validFiles.push(file)
        }
      })
      
      if (invalidFiles.length > 0) {
        showToast.error({
          title: "Invalid Files",
          description: `Some files were rejected: ${invalidFiles.join(', ')}`,
          duration: 5000
        })
      }
      
      if (validFiles.length > 0) {
        // Store files locally
        setDeliveryPhotos(prev => [...prev, ...validFiles])
        
        // Create preview URLs
        const newPreviews = validFiles.map(file => URL.createObjectURL(file))
        setPhotoPreviews(prev => [...prev, ...newPreviews])
        
        showToast.success({
          title: "Photos Added",
          description: `${validFiles.length} photos added. They will be uploaded when you mark the service as delivered.`,
          duration: 3000
        })
      }
    }
  }

  const removePhoto = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(photoPreviews[index])
    
    setDeliveryPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold">Mark Service as Delivered</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Confirm that you have completed the service for this booking. The customer will be notified to confirm service completion.
      </p>
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
          {photoPreviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Photos ({photoPreviews.length}):</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Delivery photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Photos will be uploaded when you mark the service as delivered.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleMarkDelivered}
            disabled={isSubmitting || updating || !deliveryNotes.trim()}
            className="flex-1"
          >
            {isSubmitting || updating ? (
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
            disabled={isSubmitting || updating}
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
    </div>
  )
}
