"use client"

import { useState, useEffect } from "react"
import { ReviewCard } from "@/components/reviews/ReviewCard"
import { ServiceConfirmationNotification } from "@/components/reviews/ServiceConfirmationNotification"
import { PhotoUpload } from "@/components/reviews/PhotoUpload"
import { ServiceQualityRating } from "@/components/reviews/ServiceQualityRating"
import { DisputeResolutionForm } from "@/components/reviews/DisputeResolutionForm"
import { RewardNotification } from "@/components/reviews/RewardNotification"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Star, Plus, Search, Filter, Edit3, MessageSquare, ThumbsUp, Calendar, Camera, Gift, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistance } from "date-fns"
import { useBookings } from "@/hooks/useBookings"
import { useReviews } from "@/hooks/useReviews"
import { bookingsApi, reviewsApi } from "@/services/api"
import { Booking, Review } from "@/types"

// Mock data for demonstration
const MOCK_REVIEWS = [
  {
    id: "1",
    serviceName: "Premium House Cleaning",
    providerName: "CleanPro Services",
    rating: 5,
    comment: "Outstanding service! The team was extremely professional, thorough, and paid attention to every detail. My house has never looked this clean. Highly recommend for anyone looking for quality cleaning services.",
    date: "2024-03-15",
    images: ["/placeholder.jpg", "/placeholder2.jpg"],
    helpful: 12,
    verified: true,
    serviceDate: "2024-03-10",
    responseFromProvider: "Thank you so much for the wonderful review! We're thrilled that you're satisfied with our service."
  },
  {
    id: "2",
    serviceName: "Kitchen Deep Clean",
    providerName: "SparkleHome Solutions", 
    rating: 4,
    comment: "Very good service overall. The kitchen looks amazing and they were punctual. Only minor issue was they missed cleaning inside the microwave, but everything else was perfect.",
    date: "2024-03-12",
    images: ["/placeholder3.jpg"],
    helpful: 8,
    verified: true,
    serviceDate: "2024-03-08"
  },
  {
    id: "3", 
    serviceName: "Bathroom Renovation Cleanup",
    providerName: "Expert Cleaners Co.",
    rating: 3,
    comment: "Decent service but took longer than expected. The quality was good but communication could be improved.",
    date: "2024-03-05",
    helpful: 3,
    verified: true,
    serviceDate: "2024-03-01"
  }
]

const MOCK_PENDING_REVIEWS = [
  {
    id: "4",
    serviceName: "Emergency Plumbing Repair",
    providerName: "FixIt Pro Plumbers",
    date: "2024-03-20",
    serviceDate: "2024-03-18",
    bookingId: "BK123456",
    urgent: true
  },
  {
    id: "5",
    serviceName: "Garden Landscaping",
    providerName: "GreenThumb Experts",
    date: "2024-03-18",
    serviceDate: "2024-03-15",
    bookingId: "BK123457",
    urgent: false
  }
]

// Mock service confirmation notifications
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    serviceName: "AC Installation Service",
    providerName: "CoolAir Solutions",
    serviceDate: "2024-03-22",
    status: "delivered" as const
  },
  {
    id: "2",
    serviceName: "Electrical Wiring Check",
    providerName: "SafeWiring Experts",
    serviceDate: "2024-03-15",
    status: "confirmed" as const
  }
]

// Mock reward notifications
const MOCK_REWARDS = [
  {
    id: "1",
    rewardPoints: 50,
    rewardType: "review" as const
  },
  {
    id: "2",
    rewardPoints: 100,
    rewardType: "confirmation" as const
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      duration: 0.6,
      bounce: 0.1
    }
  }
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const
    }
  }
}

const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [reviewTitle, setReviewTitle] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [reviews, setReviews] = useState<any[]>(MOCK_REVIEWS)
  const [pendingReviews, setPendingReviews] = useState<any[]>(MOCK_PENDING_REVIEWS)
  const [notifications] = useState(MOCK_NOTIFICATIONS)
  const [rewards] = useState(MOCK_REWARDS)
  const [photos, setPhotos] = useState<File[]>([])
  const [serviceQuality, setServiceQuality] = useState({
    punctuality: 0,
    quality: 0,
    communication: 0,
    value: 0
  })
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  
  // Fetch real data
  const { bookings, loading: bookingsLoading } = useBookings()
  const { reviews: userReviews, loading: reviewsLoading } = useReviews()

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  // Filter bookings to find completed ones that need reviews
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      // Filter for completed bookings that don't have reviews yet
      const completedBookings = bookings.filter(booking => 
        booking.status === 'completed' && 
        !userReviews.some(review => review.id === booking.id)
      )
      
      // Transform bookings to pending reviews format
      const pending = completedBookings.map(booking => ({
        id: booking.id,
        serviceName: booking.service?.name || "Service",
        providerName: booking.provider?.name || "Provider",
        date: booking.updatedAt || new Date().toISOString(),
        serviceDate: booking.booking_date || new Date().toISOString(),
        bookingId: booking.id,
        urgent: false // This would come from booking data in a real implementation
      }))
      
      setPendingReviews(pending)
    }
  }, [bookings, userReviews])

  const handleEditReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId)
    if (review) {
      setRating(review.rating)
      setComment(review.comment)
      setReviewTitle(review.serviceName)
      setSelectedService(review)
      setIsDialogOpen(true)
    }
  }

  const handleDeleteReview = (reviewId: string) => {
    setReviews(reviews.filter(r => r.id !== reviewId))
  }

  const handleSubmitReview = async () => {
    if (!rating || !comment.trim()) return
    
    try {
      // In a real implementation, we would upload the photos and submit the review
      console.log("Photos to upload:", photos)
      console.log("Service quality ratings:", serviceQuality)
      
      if (selectedService?.id && reviews.find(r => r.id === selectedService.id)) {
        // Edit existing review
        setReviews(reviews.map(r => 
          r.id === selectedService.id 
            ? { ...r, rating, comment, date: format(new Date(), "yyyy-MM-dd") }
            : r
        ))
      } else {
        // Add new review
        const newReview = {
          id: Date.now().toString(),
          serviceName: selectedService?.serviceName || "Service",
          providerName: selectedService?.providerName || "Provider",
          rating,
          comment,
          date: format(new Date(), "yyyy-MM-dd"),
          images: [],
          helpful: 0,
          verified: true,
          serviceDate: selectedService?.serviceDate || format(new Date(), "yyyy-MM-dd")
        }
        setReviews([newReview, ...reviews])
        
        // Remove from pending if it was a pending review
        if (selectedService?.bookingId) {
          setPendingReviews(pendingReviews.filter(p => p.id !== selectedService.id))
        }
      }
      
      setIsDialogOpen(false)
      setRating(0)
      setHoverRating(0)
      setComment("")
      setReviewTitle("")
      setSelectedService(null)
      setPhotos([])
      setServiceQuality({
        punctuality: 0,
        quality: 0,
        communication: 0,
        value: 0
      })
    } catch (error) {
      console.error("Error submitting review:", error)
    }
  }

  const handleLeaveReview = (service: any) => {
    setSelectedService(service)
    setIsDialogOpen(true)
  }

  const handleClaimReward = (rewardId: string) => {
    console.log("Claiming reward:", rewardId)
    // In a real implementation, this would call an API to claim the reward
  }

  const handleDisputeSubmit = (reason: string) => {
    console.log("Submitting dispute with reason:", reason)
    // In a real implementation, this would call an API to submit the dispute
    setShowDisputeForm(false)
  }

  const handleDisputeCancel = () => {
    setShowDisputeForm(false)
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchTerm || 
      review.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter
    
    return matchesSearch && matchesRating
  }).sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case "rating-high":
        return b.rating - a.rating
      case "rating-low":
        return a.rating - b.rating
      case "helpful":
        return (b.helpful || 0) - (a.helpful || 0)
      default: // newest
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })

  return (
    <motion.div 
      className="container mx-auto py-6 px-4 max-w-6xl"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
          }
        }
      }}
    >
      {/* Enhanced Header - Mobile Responsive */}
      <motion.div variants={headerVariants} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div
                className="p-2 bg-gradient-to-br from-blue-100 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/10 rounded-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 bg-clip-text text-transparent">
                My Reviews
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {reviews.length + pendingReviews.length} total
              </Badge>
            </div>
            <p className="text-muted-foreground text-base md:text-lg">
              Share your experience and help others make informed decisions
            </p>
          </div>
          
          {/* Quick Stats - Mobile Responsive */}
          <motion.div 
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{reviews.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-amber-600">{pendingReviews.length}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">
                {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Reward Notifications - Mobile Responsive */}
      {rewards.length > 0 && (
        <motion.div 
          variants={headerVariants} 
          className="mb-6 space-y-4"
        >
          <h2 className="text-lg md:text-xl font-semibold">Rewards</h2>
          <div className="space-y-4">
            {rewards.map((reward) => (
              <RewardNotification
                key={reward.id}
                rewardPoints={reward.rewardPoints}
                rewardType={reward.rewardType}
                onClaimReward={() => handleClaimReward(reward.id)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Service Confirmation Notifications - Mobile Responsive */}
      {notifications.length > 0 && (
        <motion.div 
          variants={headerVariants} 
          className="mb-6 space-y-4"
        >
          <h2 className="text-lg md:text-xl font-semibold">Service Confirmations</h2>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <ServiceConfirmationNotification
                key={notification.id}
                serviceName={notification.serviceName}
                providerName={notification.providerName}
                serviceDate={format(new Date(notification.serviceDate), "MMMM d, yyyy")}
                status={notification.status}
                onLeaveReview={() => handleLeaveReview(notification)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Enhanced Search and Filters - Mobile Responsive */}
      {(reviews.length > 0 || pendingReviews.length > 0) && (
        <motion.div 
          variants={headerVariants}
          className="mb-6 p-4 bg-gradient-to-r from-card via-card to-accent/5 backdrop-blur-sm border rounded-xl shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews and services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/60 border-blue-200 focus:border-blue-400 dark:border-blue-800 dark:focus:border-blue-600 transition-colors duration-200 text-sm md:text-base"
              />
            </div>
            
            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="bg-background/60 border-blue-200 focus:border-blue-400 dark:border-blue-800 dark:focus:border-blue-600 text-sm">
                <Star className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
                <SelectItem value="4">4 stars</SelectItem>
                <SelectItem value="3">3 stars</SelectItem>
                <SelectItem value="2">2 stars</SelectItem>
                <SelectItem value="1">1 star</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-background/60 border-blue-200 focus:border-blue-400 dark:border-blue-800 dark:focus:border-blue-600 text-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="rating-high">Highest rated</SelectItem>
                <SelectItem value="rating-low">Lowest rated</SelectItem>
                <SelectItem value="helpful">Most helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

      {/* Enhanced Tabs - Mobile Responsive */}
      <motion.div variants={headerVariants}>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="flex items-center gap-2 py-2 md:py-3">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">My Reviews</span>
                  <span className="sm:hidden">Reviews</span>
                  <Badge variant="secondary" className="ml-1 text-xs">{reviews.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2 py-2 md:py-3">
                  <Edit3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Pending Reviews</span>
                  <span className="sm:hidden">Pending</span>
                  {pendingReviews.length > 0 && (
                    <Badge variant="default" className="ml-1 text-xs bg-amber-500">{pendingReviews.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[500px] md:h-[600px] lg:h-[700px]">
                  <div className="pr-2 md:pr-4">
                    {filteredReviews.length === 0 ? (
                      <motion.div 
                        className="text-center py-8 md:py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          className="inline-block p-3 md:p-4 bg-gradient-to-br from-blue-100 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/10 rounded-full mb-4 md:mb-6"
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <MessageSquare className="h-8 w-8 md:h-12 md:w-12 text-blue-500" />
                        </motion.div>
                        <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-foreground/90">
                          {searchTerm || ratingFilter !== "all" ? "No matching reviews" : "No reviews yet"}
                        </h3>
                        <p className="text-muted-foreground/80 text-base md:text-lg mb-4 md:mb-6">
                          {searchTerm || ratingFilter !== "all" 
                            ? "Try adjusting your search or filters" 
                            : "Start by using our services, then share your experience with others"
                          }
                        </p>
                        {(searchTerm || ratingFilter !== "all") && (
                          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSearchTerm("")
                                setRatingFilter("all")
                              }}
                              className="text-sm"
                            >
                              Clear filters
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          variants={container}
                          initial="hidden"
                          animate="show"
                          className="space-y-4 md:space-y-6"
                        >
                          {filteredReviews.map((review) => (
                            <motion.div key={review.id} variants={item}>
                              <ReviewCard
                                review={{
                                  ...review,
                                  date: format(new Date(review.date), "MMMM d, yyyy")
                                }}
                                onEdit={handleEditReview}
                                onDelete={handleDeleteReview}
                                canModify
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pending" className="mt-0">
                <ScrollArea className="h-[500px] md:h-[600px] lg:h-[700px]">
                  <div className="pr-2 md:pr-4">
                    {pendingReviews.length === 0 ? (
                      <motion.div 
                        className="text-center py-8 md:py-12"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div
                          className="inline-block p-3 md:p-4 bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-full mb-4 md:mb-6"
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <ThumbsUp className="h-8 w-8 md:h-12 md:w-12 text-green-500" />
                        </motion.div>
                        <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-foreground/90">All caught up!</h3>
                        <p className="text-muted-foreground/80 text-base md:text-lg">
                          No pending reviews. All your recent services have been reviewed.
                        </p>
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          variants={container}
                          initial="hidden"
                          animate="show"
                          className="space-y-4"
                        >
                          {pendingReviews.map((service) => (
                            <motion.div key={service.id} variants={item}>
                              <Card className="group transition-all duration-300 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-blue-900/20 border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/30 to-transparent dark:from-amber-900/10">
                                <CardHeader className="p-4 md:p-6">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <CardTitle className="text-base md:text-lg font-semibold">{service.serviceName}</CardTitle>
                                        {service.urgent && (
                                          <Badge variant="destructive" className="animate-pulse text-xs">Urgent</Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{service.providerName}</p>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>Service: {format(new Date(service.serviceDate), "MMM d, yyyy")}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span>•</span>
                                          <span>{formatDistance(new Date(service.serviceDate), new Date(), { addSuffix: true })}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                                      <Button
                                        onClick={() => {
                                          setSelectedService(service)
                                          setIsDialogOpen(true)
                                        }}
                                        size="sm"
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md w-full sm:w-auto text-sm"
                                      >
                                        <Star className="h-4 w-4 mr-1 md:mr-2" />
                                        <span className="hidden xs:inline">Leave Review</span>
                                        <span className="xs:hidden">Review</span>
                                      </Button>
                                    </motion.div>
                                  </div>
                                </CardHeader>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Review Dialog - Mobile Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          setPhotos([])
          setServiceQuality({
            punctuality: 0,
            quality: 0,
            communication: 0,
            value: 0
          })
          setShowDisputeForm(false)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Star className="h-5 w-5 text-yellow-500" />
              {selectedService?.id && reviews.find(r => r.id === selectedService.id) ? "Edit Review" : "Leave a Review"}
            </DialogTitle>
          </DialogHeader>
          <motion.div 
            className="space-y-4 md:space-y-6 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Service Info */}
            <div className="p-3 md:p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-base md:text-lg mb-1">{selectedService?.serviceName}</h4>
              <p className="text-muted-foreground text-sm">{selectedService?.providerName}</p>
              {selectedService?.serviceDate && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Service completed: {format(new Date(selectedService.serviceDate), "MMMM d, yyyy")}
                </p>
              )}
            </div>
            
            {/* Dispute Resolution Button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDisputeForm(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs md:text-sm"
              >
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Raise Dispute
              </Button>
            </div>
            
            {/* Dispute Form */}
            {showDisputeForm ? (
              <DisputeResolutionForm 
                onDisputeSubmit={handleDisputeSubmit}
                onDisputeCancel={handleDisputeCancel}
              />
            ) : (
              <>
                {/* Rating */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Your Rating *</label>
                  <div className="flex items-center gap-1 md:gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <motion.button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(0)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="transition-transform focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 md:h-8 md:w-8 transition-colors ${
                            value <= (hoverRating || rating) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300 hover:text-yellow-300"
                          }`}
                        />
                      </motion.button>
                    ))}
                    <span className="ml-2 md:ml-3 text-xs md:text-sm text-muted-foreground">
                      {rating === 0 ? "Click to rate" : 
                       rating === 1 ? "Poor" :
                       rating === 2 ? "Fair" :
                       rating === 3 ? "Good" :
                       rating === 4 ? "Very Good" : "Excellent"}
                    </span>
                  </div>
                </div>
                
                {/* Review Title */}
                <div className="space-y-2">
                  <label htmlFor="reviewTitle" className="text-sm font-medium">Review Title</label>
                  <Input
                    id="reviewTitle"
                    placeholder="Summarize your experience..."
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="transition-colors duration-200 text-sm"
                  />
                </div>
                
                {/* Review Comment */}
                <div className="space-y-2">
                  <label htmlFor="reviewComment" className="text-sm font-medium">Your Review *</label>
                  <Textarea
                    id="reviewComment"
                    placeholder="Share the details of your experience. What went well? What could be improved?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="resize-none transition-colors duration-200 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {comment.length}/500 characters {comment.length >= 50 ? "✓" : `(minimum 50)`}
                  </p>
                </div>
                
                {/* Service Quality Ratings */}
                <ServiceQualityRating onQualityChange={setServiceQuality} />
                
                {/* Photo Upload */}
                <PhotoUpload 
                  onPhotosChange={setPhotos} 
                  maxPhotos={5} 
                  maxSizeMB={5} 
                />
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setRating(0)
                      setHoverRating(0)
                      setComment("")
                      setReviewTitle("")
                      setSelectedService(null)
                      setPhotos([])
                      setServiceQuality({
                        punctuality: 0,
                        quality: 0,
                        communication: 0,
                        value: 0
                      })
                      setShowDisputeForm(false)
                    }}
                    className="flex-1 text-sm"
                  >
                    Cancel
                  </Button>
                  <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants} className="flex-1">
                    <Button 
                      onClick={handleSubmitReview} 
                      disabled={!rating || comment.length < 50}
                      size="sm"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Star className="h-4 w-4 mr-1 md:mr-2" />
                      {selectedService?.id && reviews.find(r => r.id === selectedService.id) ? "Update Review" : "Submit Review"}
                    </Button>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}