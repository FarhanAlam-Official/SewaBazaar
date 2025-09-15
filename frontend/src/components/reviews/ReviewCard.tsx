import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Star, 
  Edit, 
  Trash, 
  ThumbsUp, 
  Shield, 
  Calendar, 
  MessageCircle, 
  CheckCircle, 
  Truck, 
  UserCheck,
  Award,
  Clock,
  Tag,
  MapPin,
  Heart,
  Reply,
  TrendingUp,
  Zap,
  Phone,
  Wallet,
  X,
  Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { format, formatDistance } from "date-fns"
import { useState } from "react"

/**
 * Props interface for ReviewCard component
 * Defines the structure of data required to display a review
 */
interface ReviewCardProps {
  review: {
    id: string
    serviceName: string
    providerName: string
    rating: number
    comment: string
    date: string
    images?: string[]
    helpful?: number
    verified?: boolean
    serviceDate?: string
    responseFromProvider?: string
    // Service delivery related fields
    serviceDeliveryStatus?: "delivered" | "confirmed" | "disputed"
    deliveryDate?: string
    confirmationDate?: string
    // Additional fields for enhanced display
    category?: string
    location?: string
    price?: string
    duration?: string
    tags?: string[]
    // User interaction
    isHelpful?: boolean
    // Include booking object for matching
    booking?: any
    // NEW FIELDS: Detailed quality ratings
    punctuality_rating?: number
    quality_rating?: number
    communication_rating?: number
    value_rating?: number
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  canModify?: boolean
  onHelpful?: (id: string) => void
}

// Animation variants for interactive buttons
const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
}

/**
 * ReviewCard Component
 * 
 * Displays a single review with all its details including:
 * - Service and provider information
 * - Star rating visualization
 * - Review comment
 * - Photos from the review
 * - Provider response
 * - Service delivery timeline
 * - Helpful actions
 * - NEW: Detailed quality ratings
 * 
 * Features:
 * - Responsive design for all screen sizes
 * - Interactive elements with animations
 * - Conditional rendering based on available data
 * - Edit and delete functionality
 */
export function ReviewCard({ review, onEdit, onDelete, canModify = false, onHelpful }: ReviewCardProps) {
  /**
   * Get the appropriate badge for service delivery status
   * Returns a styled badge component based on the delivery status
   */
  const getServiceDeliveryStatusBadge = () => {
    if (!review.serviceDeliveryStatus) return null;
    
    switch (review.serviceDeliveryStatus) {
      case "delivered":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors duration-200 cursor-pointer">
            <Truck className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors duration-200 cursor-pointer">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "disputed":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors duration-200 cursor-pointer">
            <UserCheck className="h-3 w-3 mr-1" />
            Disputed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render star rating
  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Star
              className={`h-4 w-4 md:h-5 md:w-5 transition-colors duration-200 ${
                i < review.rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </motion.div>
        ))}
        <span className="ml-2 md:ml-3 text-sm md:text-base font-bold text-foreground">
          {review.rating}.0
        </span>
      </div>
    );
  };

  // Render service details
  const renderServiceDetails = () => {
    if (!review.category && !review.location && !review.price && !review.duration) return null;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        {review.category && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>{review.category}</span>
          </div>
        )}
        {review.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{review.location}</span>
          </div>
        )}
        {review.price && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Award className="h-3 w-3" />
            <span>{review.price}</span>
          </div>
        )}
        {review.duration && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{review.duration}</span>
          </div>
        )}
      </div>
    );
  };

  // Render tags
  const renderTags = () => {
    if (!review.tags || review.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {review.tags.map((tag, index) => (
          <Badge key={index} variant="outline" className="text-xs px-2 py-0.5 hover:bg-accent hover:text-accent-foreground transition-colors duration-200 cursor-pointer">
            {tag}
          </Badge>
        ))}
      </div>
    );
  };

  // NEW: Render detailed quality ratings
  const renderQualityRatings = () => {
    // Check if any detailed ratings are available
    const hasDetailedRatings = review.punctuality_rating || review.quality_rating || 
                              review.communication_rating || review.value_rating;
    
    if (!hasDetailedRatings) return null;
    
    return (
      <div className="mt-4 p-4 md:p-5 bg-muted/30 rounded-xl shadow-sm">
        <h4 className="text-sm md:text-base font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
          Quality Ratings
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {review.punctuality_rating && (
            <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg border hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200 cursor-pointer">
              <Zap className="h-5 w-5 text-blue-500 mb-1" />
              <span className="text-xs text-muted-foreground mb-1">Punctuality</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < (review.punctuality_rating || 0)
                        ? "fill-blue-400 text-blue-400" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs font-medium ml-1">{review.punctuality_rating}</span>
              </div>
            </div>
          )}
          
          {review.quality_rating && (
            <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg border hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors duration-200 cursor-pointer">
              <Award className="h-5 w-5 text-green-500 mb-1" />
              <span className="text-xs text-muted-foreground mb-1">Quality</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < (review.quality_rating || 0)
                        ? "fill-green-400 text-green-400" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs font-medium ml-1">{review.quality_rating}</span>
              </div>
            </div>
          )}
          
          {review.communication_rating && (
            <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg border hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors duration-200 cursor-pointer">
              <Phone className="h-5 w-5 text-purple-500 mb-1" />
              <span className="text-xs text-muted-foreground mb-1">Communication</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < (review.communication_rating || 0)
                        ? "fill-purple-400 text-purple-400" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs font-medium ml-1">{review.communication_rating}</span>
              </div>
            </div>
          )}
          
          {review.value_rating && (
            <div className="flex flex-col items-center p-3 bg-background/50 rounded-lg border hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors duration-200 cursor-pointer">
              <Wallet className="h-5 w-5 text-amber-500 mb-1" />
              <span className="text-xs text-muted-foreground mb-1">Value</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < (review.value_rating || 0)
                        ? "fill-amber-400 text-amber-400" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-xs font-medium ml-1">{review.value_rating}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // State for image modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Function to open image in modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageModalOpen(true)
  }

  // Function to close image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedImage(null)
  }

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card className="transition-all duration-300 border-0 shadow-lg hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-xl overflow-hidden">
        <CardHeader className="p-4 md:p-6 pb-3 md:pb-4 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg md:text-xl text-foreground group-hover:text-primary transition-colors duration-200">
                  {review.serviceName}
                </h3>
                {review.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors duration-200 cursor-pointer">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {getServiceDeliveryStatusBadge()}
              </div>
              <p className="text-muted-foreground font-medium text-base md:text-lg">{review.providerName}</p>
              
              {/* Rating and Date */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                {renderStarRating()}
                <Separator orientation="vertical" className="h-4 hidden sm:block" />
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span title={review.date}>{format(new Date(review.date), "MMM d, yyyy")}</span>
                </div>
                {review.serviceDate && (
                  <>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <span className="text-sm text-muted-foreground">
                      Service: {format(new Date(review.serviceDate), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
              
              {/* Service Details */}
              {renderServiceDetails()}
              
              {/* Tags */}
              {renderTags()}
            </div>
            
            {/* Action Buttons */}
            {canModify && (
              <div className="flex items-center gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit?.(review.id)}
                    className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors duration-200 h-8 w-8 md:h-9 md:w-9"
                  >
                    <Edit className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete?.(review.id)}
                    className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors duration-200 h-8 w-8 md:h-9 md:w-9"
                  >
                    <Trash className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="space-y-4 md:space-y-5">
            {/* Review Comment */}
            <motion.p 
              className="text-foreground/90 leading-relaxed text-base md:text-lg group-hover:text-foreground transition-colors duration-200"
              initial={{ opacity: 0.9 }}
              whileHover={{ opacity: 1 }}
            >
              {review.comment}
            </motion.p>
            
            {/* Images */}
            {review.images && review.images.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                  Photos from this review
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {review.images.map((image, index) => (
                    <motion.div 
                      key={index} 
                      className="relative aspect-square overflow-hidden rounded-md bg-muted group/image cursor-pointer shadow-sm border border-border/50 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => openImageModal(image)}
                    >
                      <Image
                        src={image}
                        alt={`Review image ${index + 1}`}
                        fill
                        className="object-cover transition-all duration-300 group-hover/image:scale-110"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <Search className="h-4 w-4 text-white opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Image Modal */}
            <AnimatePresence>
              {isImageModalOpen && selectedImage && (
                <motion.div 
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeImageModal}
                >
                  <motion.div 
                    className="relative max-w-4xl max-h-[90vh] w-full h-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={selectedImage}
                      alt="Enlarged review image"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70"
                      onClick={closeImageModal}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Provider Response */}
            {review.responseFromProvider && (
              <motion.div 
                className="mt-4 p-4 md:p-5 bg-muted/30 rounded-xl border-l-4 border-l-primary/60 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-primary border-primary text-xs md:text-sm hover:bg-primary/10 transition-colors duration-200 cursor-pointer">
                    Provider Response
                  </Badge>
                </div>
                <div className="flex items-start gap-3">
                  <Reply className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {review.responseFromProvider}
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* Service Delivery Timeline */}
            {(review.deliveryDate || review.confirmationDate) && (
              <div className="mt-4 p-4 md:p-5 bg-muted/30 rounded-xl shadow-sm">
                <h4 className="text-sm md:text-base font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  Service Timeline
                </h4>
                <div className="space-y-3">
                  {review.deliveryDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Truck className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">Delivered</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.deliveryDate), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                  {review.confirmationDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Confirmed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.confirmationDate), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* NEW: Detailed Quality Ratings */}
            {renderQualityRatings()}
            
            {/* Helpful Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-3 md:gap-4">
                {review.helpful !== undefined && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                      <Button 
                        variant={review.isHelpful ? "default" : "ghost"} 
                        size="sm" 
                        onClick={() => onHelpful?.(review.id)}
                        className={`${
                          review.isHelpful 
                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50" 
                            : "text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        } transition-colors duration-200 h-9 px-3 md:h-10 md:px-4 text-sm`}
                      >
                        <ThumbsUp className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                        Helpful
                        {review.helpful > 0 && (
                          <span className="ml-1">({review.helpful})</span>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
              
              {/* Rating Badge */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Badge 
                  variant="secondary" 
                  className={`${
                    review.rating >= 4 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50" 
                      : review.rating >= 3 
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/50"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50"
                  } text-sm py-1 px-3 font-medium transition-colors duration-200 cursor-pointer`}
                >
                  {review.rating >= 4 ? (
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Excellent
                    </div>
                  ) : review.rating >= 3 ? "Good" : "Needs Improvement"}
                </Badge>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}