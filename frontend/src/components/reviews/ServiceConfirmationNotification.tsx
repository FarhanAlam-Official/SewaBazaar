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
  MapPin
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
            <h4 className="font-bold text-lg md:text-xl">{serviceName}</h4>
            <p className="text-base text-muted-foreground">{providerName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Calendar className="h-4 w-4" />
              <span>Service date: {serviceDate}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {status === "delivered" && (
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
            
            <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground text-base py-5 px-6">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}