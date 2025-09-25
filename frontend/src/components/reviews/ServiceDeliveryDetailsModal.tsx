"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Calendar, 
  MapPin, 
  UserCheck, 
  Clock, 
  Tag, 
  IndianRupee,
  FileText,
  Camera,
  X,
  CheckCircle,
  Truck
} from "lucide-react"
import { format } from "date-fns"
import { bookingsApi } from "@/services/api"
import Image from "next/image"

// Component to handle delivery photo with error handling
function DeliveryPhotoCard({ photo, index, onClick }: { photo: string, index: number, onClick: () => void }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div 
      className="relative group cursor-pointer bg-gray-100 dark:bg-gray-800 rounded-lg border overflow-hidden"
      onClick={onClick}
      style={{ minHeight: '96px' }}
    >
      {!imageError ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          <Image
            src={photo}
            alt={`Delivery photo ${index + 1}`}
            fill
            className={`object-cover hover:opacity-90 transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.error(`Delivery photo ${index + 1} failed:`, photo)
              setImageError(true)
            }}
            unoptimized={true}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-24 text-gray-400">
          <Camera className="h-8 w-8 mb-1" />
          <span className="text-xs">Image unavailable</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
        <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

interface ServiceDeliveryDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  serviceName: string
  providerName: string
  serviceDate: string
  status: "delivered" | "confirmed" | "pending"
  serviceCategory?: string
  servicePrice?: number
  serviceDescription?: string
  serviceDuration?: string
  serviceImages?: string[]
  serviceTags?: string[]
  bookingId?: number
  confirmationDate?: string
  deliveryNotes?: string
  deliveryPhotos?: string[]
  deliveredAt?: string
}

export function ServiceDeliveryDetailsModal({
  isOpen,
  onClose,
  serviceName,
  providerName,
  serviceDate,
  status,
  serviceCategory,
  servicePrice,
  serviceDescription,
  serviceDuration,
  serviceImages,
  serviceTags,
  bookingId,
  confirmationDate,
  deliveryNotes,
  deliveryPhotos,
  deliveredAt
}: ServiceDeliveryDetailsModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [deliveryData, setDeliveryData] = useState<any>(null)
  const [loadingDeliveryData, setLoadingDeliveryData] = useState(false)

  const fetchDeliveryData = useCallback(async () => {
    if (!bookingId) {
      return
    }
    
    setLoadingDeliveryData(true)
    try {
      const data = await bookingsApi.getServiceDeliveryStatus(bookingId)
      setDeliveryData(data)
    } catch (error: any) {
      console.error('Error fetching delivery data:', error)
      setDeliveryData(null)
    } finally {
      setLoadingDeliveryData(false)
    }
  }, [bookingId])

  // Fetch delivery data when modal opens
  useEffect(() => {
    if (isOpen && bookingId) {
      fetchDeliveryData()
    }
  }, [isOpen, bookingId, fetchDeliveryData])

  const getStatusInfo = () => {
    switch (status) {
      case "delivered":
        return {
          icon: <Truck className="h-5 w-5 text-purple-500" />,
          title: "Service Delivered",
          description: "Your service has been completed and delivered.",
          badge: <Badge className="bg-purple-100 text-purple-800">Delivered</Badge>,
          color: "text-purple-600"
        }
      case "confirmed":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          title: "Service Confirmed",
          description: "You have confirmed the service completion.",
          badge: <Badge className="bg-green-100 text-green-800">Confirmed</Badge>,
          color: "text-green-600"
        }
      case "pending":
      default:
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          title: "Service in Progress",
          description: "Your service is currently in progress.",
          badge: <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>,
          color: "text-yellow-600"
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {statusInfo.icon}
            Service Delivery Details
          </DialogTitle>
          <DialogDescription>
            Complete information about your service delivery and completion status.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-6 pb-6">
            {/* Status Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {statusInfo.icon}
                    {statusInfo.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {statusInfo.description}
                  </p>
                </div>
                {statusInfo.badge}
              </div>
            </div>

            {/* Service Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    Service Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Service Name</span>
                      <p className="font-semibold text-lg">{serviceName}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Provider</span>
                      <p className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">{providerName}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Service Date</span>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span>{serviceDate}</span>
                      </p>
                    </div>

                    {bookingId && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Booking ID</span>
                        <p className="font-mono text-sm">#{bookingId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-500" />
                    Service Details
                  </h4>
                  <div className="space-y-3">
                    {serviceCategory && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                          {serviceCategory}
                        </Badge>
                      </div>
                    )}

                    {servicePrice && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Price</span>
                        <p className="flex items-center gap-1 font-semibold">
                          <IndianRupee className="h-4 w-4" />
                          <span>₹{servicePrice}</span>
                        </p>
                      </div>
                    )}

                    {serviceDuration && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</span>
                        <p className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{serviceDuration}</span>
                        </p>
                      </div>
                    )}

                    {serviceDescription && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {serviceDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Delivery Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    Delivery Information
                  </h4>
                  <div className="space-y-3">
                    {(deliveryData?.service_delivery?.delivered_at || deliveredAt) && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Delivered On</span>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span>
                            {deliveryData?.service_delivery?.delivered_at 
                              ? format(new Date(deliveryData.service_delivery.delivered_at), "MMMM d, yyyy 'at' h:mm a")
                              : deliveredAt 
                                ? format(new Date(deliveredAt), "MMMM d, yyyy 'at' h:mm a")
                                : "N/A"
                            }
                          </span>
                        </p>
                      </div>
                    )}

                    {(deliveryData?.service_delivery?.customer_confirmed_at || confirmationDate) && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Confirmed On</span>
                        <p className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>
                            {deliveryData?.service_delivery?.customer_confirmed_at
                              ? format(new Date(deliveryData.service_delivery.customer_confirmed_at), "MMMM d, yyyy 'at' h:mm a")
                              : confirmationDate || "N/A"
                            }
                          </span>
                        </p>
                      </div>
                    )}

                    {(deliveryData?.service_delivery?.delivery_notes || deliveryNotes) ? (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Provider Notes</span>
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                            <span>{deliveryData?.service_delivery?.delivery_notes || deliveryNotes}</span>
                          </p>
                        </div>
                      </div>
                    ) : deliveryData?.booking_status === 'service_delivered' && !deliveryData?.service_delivery ? (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Provider Notes</span>
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                            <span>No delivery notes were recorded for this service.</span>
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Service Tags */}
                {serviceTags && serviceTags.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                    <h4 className="font-semibold mb-3">Service Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {serviceTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Photos */}
            {(deliveryData?.service_delivery?.delivery_photos || deliveryPhotos || deliveryData?.booking_status === 'service_delivered') && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-500" />
                  Delivery Photos ({(deliveryData?.service_delivery?.delivery_photos || deliveryPhotos || []).length})
                </h4>
                {loadingDeliveryData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading photos...</span>
                  </div>
                ) : (deliveryData?.service_delivery?.delivery_photos || deliveryPhotos || []).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(deliveryData?.service_delivery?.delivery_photos || deliveryPhotos || []).map((photo: string, index: number) => (
                      <DeliveryPhotoCard
                        key={index}
                        photo={photo}
                        index={index}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No delivery photos available</p>
                    {deliveryData?.booking_status === 'service_delivered' && !deliveryData?.service_delivery && (
                      <p className="text-xs text-gray-400 mt-2">
                        This service was marked as delivered but no delivery details were recorded.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Service Images (if any) */}
            {serviceImages && serviceImages.length > 0 && serviceImages.filter(img => img && typeof img === 'string' && img.trim() !== '').length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-500" />
                  Service Images ({serviceImages.filter(img => img && typeof img === 'string' && img.trim() !== '').length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {serviceImages
                    .filter(img => img && typeof img === 'string' && img.trim() !== '')
                    .map((image, index) => (
                    <div 
                      key={index} 
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <Image
                        src={image}
                        alt={`Service image ${index + 1}`}
                        width={191}
                        height={96}
                        className="w-full h-24 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                        onError={() => {
                          console.error('Service image failed to load:', image)
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Viewer Modal */}
        {selectedImageIndex !== null && (
          <Dialog open={selectedImageIndex !== null} onOpenChange={() => setSelectedImageIndex(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>Image Viewer</DialogTitle>
              </DialogHeader>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                {(() => {
                  const allImages = [
                    ...(deliveryData?.service_delivery?.delivery_photos || []),
                    ...(deliveryPhotos || []),
                    ...(serviceImages || []).filter(img => img && typeof img === 'string' && img.trim() !== '')
                  ]
                  const imageUrl = allImages[selectedImageIndex]
                  
                  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Image not available</p>
                      </div>
                    )
                  }
                  
                  return (
                    <Image
                      src={imageUrl}
                      alt={`Image ${selectedImageIndex + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-full object-contain max-h-[80vh]"
                    />
                  )
                })()}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Footer */}
        <div className="flex justify-end p-6 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
