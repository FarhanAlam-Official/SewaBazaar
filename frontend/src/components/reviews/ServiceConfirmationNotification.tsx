import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Truck, 
  UserCheck, 
  Star 
} from "lucide-react"
import { motion } from "framer-motion"

interface ServiceConfirmationNotificationProps {
  serviceName: string
  providerName: string
  serviceDate: string
  status: "delivered" | "confirmed" | "pending"
  onLeaveReview: () => void
}

export function ServiceConfirmationNotification({
  serviceName,
  providerName,
  serviceDate,
  status,
  onLeaveReview
}: ServiceConfirmationNotificationProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "delivered":
        return {
          icon: <Truck className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />,
          title: "Service Delivered",
          description: "Your service has been marked as delivered. Please confirm completion.",
          badge: <Badge className="bg-purple-100 text-purple-800 text-xs">Delivered</Badge>
        }
      case "confirmed":
        return {
          icon: <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />,
          title: "Service Confirmed",
          description: "Thank you for confirming your service. Would you like to leave a review?",
          badge: <Badge className="bg-green-100 text-green-800 text-xs">Confirmed</Badge>
        }
      case "pending":
      default:
        return {
          icon: <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />,
          title: "Service in Progress",
          description: "Your service is currently in progress.",
          badge: <Badge className="bg-yellow-100 text-yellow-800 text-xs">In Progress</Badge>
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
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
        <CardHeader className="pb-3 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <Bell className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  {statusInfo.icon}
                  {statusInfo.title}
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {statusInfo.description}
                </p>
              </div>
            </div>
            <div className="self-start">
              {statusInfo.badge}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-4 md:p-6">
          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 md:p-4 mb-4">
            <h4 className="font-medium text-sm md:text-base">{serviceName}</h4>
            <p className="text-xs md:text-sm text-muted-foreground">{providerName}</p>
            <p className="text-xs text-muted-foreground mt-1">Service date: {serviceDate}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            {status === "delivered" && (
              <Button 
                onClick={onLeaveReview}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs md:text-sm"
              >
                <UserCheck className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Confirm Completion</span>
                <span className="xs:hidden">Confirm</span>
              </Button>
            )}
            
            {status === "confirmed" && (
              <Button 
                onClick={onLeaveReview}
                variant="outline"
                size="sm"
                className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 text-xs md:text-sm"
              >
                <Star className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden xs:inline">Leave a Review</span>
                <span className="xs:hidden">Review</span>
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs md:text-sm">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}