import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Truck, 
  UserCheck, 
  Star,
  Calendar,
  MapPin,
  ClockIcon,
  Tag,
  IndianRupee
} from "lucide-react"
import { motion } from "framer-motion"

interface ServiceConfirmationNotificationProps {
  serviceName: string
  providerName: string
  serviceDate: string
  status: "delivered" | "confirmed" | "pending"
  onLeaveReview: () => void
  onConfirmService?: (rating: number, notes?: string) => void
  onViewDetails?: () => void
  serviceCategory?: string
  servicePrice?: number
  serviceDescription?: string
  serviceDuration?: string
  serviceImages?: string[]
  serviceTags?: string[]
  bookingId?: number
  confirmationDate?: string
  deliveryNotes?: string
}

export function ServiceConfirmationNotification({
  serviceName,
  providerName,
  serviceDate,
  status,
  onLeaveReview,
  onConfirmService,
  onViewDetails,
  serviceCategory,
  servicePrice,
  serviceDescription,
  serviceDuration,
  serviceImages,
  serviceTags,
  bookingId,
  confirmationDate,
  deliveryNotes
}: ServiceConfirmationNotificationProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "delivered":
        return {
          icon: <Truck className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />,
          title: "Service Delivered",
          description: "Your service has been marked as delivered. Please confirm completion.",
          badge: <Badge className="bg-purple-100 text-purple-800 text-base py-1 px-3">Delivered</Badge>,
          color: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
          border: "border-l-purple-500"
        }
      case "confirmed":
        return {
          icon: <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />,
          title: "Service Confirmed",
          description: "Thank you for confirming your service. Would you like to leave a review?",
          badge: <Badge className="bg-green-100 text-green-800 text-base py-1 px-3">Confirmed</Badge>,
          color: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
          border: "border-l-green-500"
        }
      case "pending":
      default:
        return {
          icon: <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />,
          title: "Service in Progress",
          description: "Your service is currently in progress.",
          badge: <Badge className="bg-yellow-100 text-yellow-800 text-base py-1 px-3">In Progress</Badge>,
          color: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
          border: "border-l-yellow-500"
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-l-4 ${statusInfo.border} bg-gradient-to-r ${statusInfo.color} shadow-lg`}>
        <CardHeader className="pb-3 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-3">
                  {statusInfo.icon}
                  {statusInfo.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {statusInfo.description}
                </p>
              </div>
            </div>
            <div className="self-start">
              {statusInfo.badge}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-5 md:p-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 md:p-5 mb-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Service Name</span>
                  <h4 className="font-bold text-lg md:text-xl flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {serviceName}
                  </h4>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Provider Name</span>
                  <p className="text-base text-muted-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-200">{providerName}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Service date: {serviceDate}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {serviceCategory && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 text-xs px-2 py-1">
                      <Tag className="h-3 w-3 mr-1" />
                      {serviceCategory}
                    </Badge>
                  )}
                  
                  {servicePrice && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      <IndianRupee className="h-4 w-4" />
                      <span>₹{servicePrice}</span>
                    </div>
                  )}
                  
                  {serviceDuration && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      <ClockIcon className="h-4 w-4" />
                      <span>{serviceDuration}</span>
                    </div>
                  )}
                </div>
                
                {serviceDescription && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Description</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{serviceDescription}</p>
                  </div>
                )}
              </div>
            </div>
            
            {(serviceTags && serviceTags.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {serviceTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {bookingId && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Booking ID</span>
                  <p className="text-sm font-medium">#{bookingId}</p>
                </div>
              )}
              
              {confirmationDate && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Confirmed On</span>
                  <p className="text-sm font-medium">{confirmationDate}</p>
                </div>
              )}
            </div>
            
            {deliveryNotes && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Delivery Notes</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{deliveryNotes}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {status === "delivered" && onConfirmService && (
              <Button 
                onClick={() => {
                  // For now, provide default values but this could be enhanced with a dialog
                  onConfirmService(5, "Service completed successfully")
                }}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base py-5 px-6 shadow-md"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Confirm Completion
              </Button>
            )}
            
            {status === "delivered" && !onConfirmService && (
              <Button 
                onClick={onLeaveReview}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base py-5 px-6 shadow-md"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Confirm Completion
              </Button>
            )}
            
            {status === "confirmed" && (
              <Button 
                onClick={onLeaveReview}
                variant="outline"
                size="lg"
                className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 text-base py-5 px-6"
              >
                <Star className="h-5 w-5 mr-2" />
                Leave a Review
              </Button>
            )}
            
            <Button variant="ghost" size="lg" onClick={onViewDetails} className="text-dark dark:text-white dark:hover:text-white hover:text-white text-base py-5 px-6">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}