import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Edit, Trash, ThumbsUp, Shield, Calendar, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { format, formatDistance } from "date-fns"

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
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  canModify?: boolean
}

const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
}

export function ReviewCard({ review, onEdit, onDelete, canModify = false }: ReviewCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card className="transition-all duration-300 border-0 shadow-sm hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
        <CardHeader className="p-6 pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-200">
                  {review.serviceName}
                </h3>
                {review.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-medium">{review.providerName}</p>
              
              {/* Rating and Date */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Star
                        className={`h-4 w-4 transition-colors duration-200 ${
                          i < review.rating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </motion.div>
                  ))}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {review.rating}.0
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span title={review.date}>{formatDistance(new Date(review.date), new Date(), { addSuffix: true })}</span>
                </div>
                {review.serviceDate && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-xs text-muted-foreground">
                      Service: {format(new Date(review.serviceDate), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            {canModify && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit?.(review.id)}
                    className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete?.(review.id)}
                    className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors duration-200"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            {/* Review Comment */}
            <motion.p 
              className="text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors duration-200"
              initial={{ opacity: 0.9 }}
              whileHover={{ opacity: 1 }}
            >
              {review.comment}
            </motion.p>
            
            {/* Images */}
            {review.images && review.images.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Photos from this review
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {review.images.map((image, index) => (
                    <motion.div 
                      key={index} 
                      className="relative aspect-square overflow-hidden rounded-lg bg-muted group/image cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Image
                        src={image}
                        alt={`Review image ${index + 1}`}
                        fill
                        className="object-cover transition-all duration-300 group-hover/image:scale-110"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Provider Response */}
            {review.responseFromProvider && (
              <motion.div 
                className="mt-4 p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary/60"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-primary border-primary">
                    Provider Response
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.responseFromProvider}
                </p>
              </motion.div>
            )}
            
            {/* Helpful Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                {review.helpful !== undefined && (
                  <div className="flex items-center gap-2">
                    <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful ({review.helpful})
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
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
                      : review.rating >= 3 
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {review.rating >= 4 ? "Excellent" : review.rating >= 3 ? "Good" : "Needs Improvement"}
                </Badge>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 