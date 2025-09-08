"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Truck, 
  UserCheck, 
  Clock, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User
} from "lucide-react"
import { ServiceDelivery } from "@/types"
import { format } from "date-fns"

// Define a partial booking interface for the status component
interface PartialBooking {
  id: number | string
  status: string
  payment_type?: string
  // Add other properties as needed
}

interface ServiceDeliveryStatusProps {
  booking: PartialBooking
  serviceDelivery?: ServiceDelivery
  onMarkDelivered?: () => void
  onConfirmCompletion?: () => void
  onProcessCashPayment?: () => void
  userRole: 'customer' | 'provider' | 'admin'
}

export default function ServiceDeliveryStatus({
  booking,
  serviceDelivery,
  onMarkDelivered,
  onConfirmCompletion,
  onProcessCashPayment,
  userRole
}: ServiceDeliveryStatusProps) {
  
  const getStatusIcon = () => {
    switch (booking.status) {
      case 'confirmed':
        return <Clock className="h-4 w-4" />
      case 'service_delivered':
        return <Truck className="h-4 w-4" />
      case 'awaiting_confirmation':
        return <UserCheck className="h-4 w-4" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'disputed':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (booking.status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'service_delivered':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'awaiting_confirmation':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionButton = () => {
    if (userRole === 'provider') {
      if (booking.status === 'confirmed') {
        return (
          <Button onClick={onMarkDelivered} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Truck className="h-4 w-4 mr-2" />
            Mark as Delivered
          </Button>
        )
      }
      if (booking.status === 'service_delivered' && booking.payment_type === 'cash') {
        return (
          <Button onClick={onProcessCashPayment} size="sm" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Process Cash Payment
          </Button>
        )
      }
    }
    
    if (userRole === 'customer') {
      if (booking.status === 'service_delivered') {
        return (
          <Button onClick={onConfirmCompletion} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <UserCheck className="h-4 w-4 mr-2" />
            Confirm Completion
          </Button>
        )
      }
    }
    
    return null
  }

  const renderDeliveryInfo = () => {
    if (!serviceDelivery) return null

    return (
      <div className="space-y-3">
        {/* Delivery Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Delivered by:</span>
            <span className="font-medium">{serviceDelivery.delivered_by_name || 'Provider'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Delivered at:</span>
            <span className="font-medium">
              {serviceDelivery.delivered_at ? 
                format(new Date(serviceDelivery.delivered_at), 'MMM dd, yyyy HH:mm') : 
                'N/A'
              }
            </span>
          </div>
        </div>

        {/* Delivery Notes */}
        {serviceDelivery.delivery_notes && (
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Provider Notes:</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {serviceDelivery.delivery_notes}
            </p>
          </div>
        )}

        {/* Delivery Photos */}
        {serviceDelivery.delivery_photos && serviceDelivery.delivery_photos.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Service Photos:</h4>
            <div className="flex flex-wrap gap-2">
              {serviceDelivery.delivery_photos.map((photo, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  Photo {index + 1}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCustomerConfirmation = () => {
    if (!serviceDelivery || !serviceDelivery.customer_confirmed_at) return null

    return (
      <div className="space-y-3">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2 text-green-800 dark:text-green-200">
            Customer Confirmation
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-green-700 dark:text-green-300">Confirmed at:</span>
              <span className="font-medium">
                {format(new Date(serviceDelivery.customer_confirmed_at), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            
            {serviceDelivery.customer_rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-green-700 dark:text-green-300">Rating:</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < serviceDelivery.customer_rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-medium">{serviceDelivery.customer_rating}/5</span>
                </div>
              </div>
            )}
          </div>

          {serviceDelivery.customer_notes && (
            <div className="mt-2">
              <h5 className="font-medium text-sm mb-1">Customer Feedback:</h5>
              <p className="text-sm text-green-700 dark:text-green-300">
                {serviceDelivery.customer_notes}
              </p>
            </div>
          )}

          {serviceDelivery.would_recommend !== null && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-green-700 dark:text-green-300">Would recommend:</span>
              {serviceDelivery.would_recommend ? (
                <div className="flex items-center gap-1 text-green-600">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Yes</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="h-4 w-4" />
                  <span className="text-sm font-medium">No</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDisputeInfo = () => {
    if (!serviceDelivery || !serviceDelivery.dispute_raised) return null

    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <h4 className="font-medium text-sm mb-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          Service Dispute
        </h4>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-red-700 dark:text-red-300">Dispute Reason:</span>
            <p className="mt-1 text-red-700 dark:text-red-300">
              {serviceDelivery.dispute_reason}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-red-700 dark:text-red-300">Status:</span>
            <Badge variant={serviceDelivery.dispute_resolved ? "default" : "destructive"}>
              {serviceDelivery.dispute_resolved ? "Resolved" : "Pending Resolution"}
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Service Delivery Status</CardTitle>
          </div>
          <Badge className={`${getStatusColor()} border`}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <CardDescription>
          Track the progress of service delivery and customer confirmation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Action Button */}
        {getActionButton() && (
          <div className="flex justify-end">
            {getActionButton()}
          </div>
        )}

        {/* Delivery Information */}
        {renderDeliveryInfo()}

        {/* Customer Confirmation */}
        {renderCustomerConfirmation()}

        {/* Dispute Information */}
        {renderDisputeInfo()}

        {/* Status Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Status Summary</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {booking.status === 'confirmed' && "Service is scheduled and confirmed. Provider will mark as delivered after completion."}
            {booking.status === 'service_delivered' && "Provider has marked the service as delivered. Waiting for customer confirmation."}
            {booking.status === 'awaiting_confirmation' && "Service delivered and awaiting customer confirmation."}
            {booking.status === 'completed' && "Service completed and confirmed by customer."}
            {booking.status === 'disputed' && "Service delivery has been disputed and is under review."}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
