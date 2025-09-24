"use client"

import { useState, useEffect, useCallback } from "react"
import { ReviewCard } from "@/components/reviews/ReviewCard"
import { ServiceConfirmationNotification } from "@/components/reviews/ServiceConfirmationNotification"
import { ServiceDeliveryDetailsModal } from "@/components/reviews/ServiceDeliveryDetailsModal"
import { PhotoUpload } from "@/components/reviews/PhotoUpload"
import { ServiceQualityRating } from "@/components/reviews/ServiceQualityRating"
import { DisputeResolutionForm } from "@/components/reviews/DisputeResolutionForm"
import { RewardNotification } from "@/components/reviews/RewardNotification"
import { EnhancedStatsCard } from "@/components/reviews/EnhancedStatsCard"
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
import { Star, Plus, Search, Filter, Edit3, MessageSquare, ThumbsUp, Calendar, Camera, Gift, AlertTriangle, RefreshCw,Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistance } from "date-fns"
import { useBookings } from "@/hooks/useBookings"
import { useReviews } from "@/hooks/useReviews"
import { bookingsApi, reviewsApi, rewardsApi } from "@/services/api"
import customerApi from "@/services/customer.api"
import { Booking, Review } from "@/types"
import { showToast } from "@/components/ui/enhanced-toast"
import { useRouter } from "next/navigation"

// Interface for service confirmation notifications
interface ServiceConfirmation {
  id: string
  serviceName: string
  providerName: string
  serviceDate: string
  status: "delivered" | "confirmed"
  bookingId: number
  // Additional service details (optional)
  serviceCategory?: string
  servicePrice?: number
  serviceDescription?: string
  serviceDuration?: string
  serviceImages?: string[]
  serviceTags?: string[]
  confirmationDate?: string
  deliveryNotes?: string
  deliveryPhotos?: string[]
  deliveredAt?: string
  // Add optional properties that might be used
  serviceId?: number
  price?: number
  duration?: string
  category?: string
  images?: string[]
}

// Interface for reward notifications
interface Reward {
  id: string
  rewardPoints: number
  rewardType: "review" | "confirmation"
  reviewId?: string
}

// Simplified animation variants with reduced motion support
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3
    }
  }
}

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4
    }
  }
}

// Reduced motion variants
const reducedMotionContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } }
}

const reducedMotionItem = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } }
}

/**
 * Main Reviews Page Component
 * 
 * This component displays:
 * 1. User's existing reviews
 * 2. Pending reviews for completed bookings
 * 3. Service confirmations
 * 4. Reward notifications
 * 5. Review submission/editing functionality
 * 
 * Features:
 * - Tabbed interface for reviews and pending reviews
 * - Search and filtering capabilities
 * - Responsive design for all screen sizes
 * - Animation effects for enhanced UX
 * - Loading states and error handling
 */
function ReviewsPage() {
  // State management for UI components
  const router = useRouter()
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
  const [reviews, setReviews] = useState<any[]>([])
  const [pendingReviews, setPendingReviews] = useState<any[]>([])
  const [notifications, setNotifications] = useState<ServiceConfirmation[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [serviceQuality, setServiceQuality] = useState({
    punctuality: 0,
    quality: 0,
    communication: 0,
    value: 0
  })
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [userPoints, setUserPoints] = useState<number>(0)
  const [rewardPointsPerReview, setRewardPointsPerReview] = useState<number>(50)
  
  // Service delivery details modal state
  const [deliveryDetailsModalOpen, setDeliveryDetailsModalOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<ServiceConfirmation | null>(null) // Default to 50 points
  
  // State for tracking shown rewards to prevent duplicates
  const [shownRewards, setShownRewards] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shownRewards')
      return new Set(saved ? JSON.parse(saved) : [])
    }
    return new Set()
  })
  
  // Detect reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  // Helper function to determine if a review is urgent
  const isUrgentReview = (booking: any) => {
    if (!booking.updatedAt && !booking.completedAt) return false
    
    const completionDate = new Date(booking.updatedAt || booking.completedAt)
    const now = new Date()
    const daysSinceCompletion = Math.floor((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Mark as urgent if more than 7 days have passed since completion
    return daysSinceCompletion > 7
  }

  // Fetch real data using existing hooks
  const { bookings, loading: bookingsLoading, error: bookingsErrorData, refetch: refetchBookings } = useBookings()
  // Use the new API method to get reviews with reward status
  const { reviews: userReviews, loading: reviewsLoading, error: reviewsErrorData, refetch: refetchReviews } = useReviews(reviewsApi.getReviewsWithRewards)

  // Function to refresh all data without reloading the page
  const refreshData = useCallback(async () => {
    try {
      // Show loading state
      setLoading(true)
      setError(null)
      
      // Refetch all data
      await Promise.all([
        refetchBookings(),
        refetchReviews()
      ])
      
      // Also fetch rewards data
      try {
        const rewardsSummary = await rewardsApi.getRewardsSummary()
        setUserPoints(rewardsSummary.current_balance || 0)
      } catch (rewardsError) {
        console.warn("Could not fetch rewards data:", rewardsError)
      }
      
      // Show success message
      showToast.success({
        title: "Data Refreshed",
        description: "Your reviews and bookings data has been updated."
      })
    } catch (err) {
      console.error("Error refreshing data:", err)
      setError("Failed to refresh data. Please try again.")
      showToast.error({
        title: "Refresh Failed",
        description: "Failed to refresh data. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }, [refetchBookings, refetchReviews])

  // Optimized data fetching - prioritize service data for faster initial render
  
  // Debug: Log the fetched data
  useEffect(() => {
    // Simple data logging for development
    // console.log('Bookings:', bookings?.length || 0, 'Reviews:', userReviews?.length || 0)
  }, [bookings, userReviews, bookingsLoading, reviewsLoading, bookingsErrorData, reviewsErrorData])

  // Debug: Log state changes
  useEffect(() => {
    // console.log('State updates:', { pendingReviews: pendingReviews.length, notifications: notifications.length, reviews: reviews.length, loading, error })
  }, [pendingReviews, notifications, reviews, loading, error])

  // Set loading state based on hooks
  useEffect(() => {
    setLoading(bookingsLoading || reviewsLoading)
  }, [bookingsLoading, reviewsLoading])

  // Handle claim reward action
  const handleClaimReward = async (rewardId: string) => {
    /**
     * Process reward claiming
     * This now calls the actual API to claim the reward
     */
    try {
      const reward = rewards.find(r => r.id === rewardId)
      
      if (!reward) {
        setError("Reward not found.")
        showToast.error({
          title: 'Reward Claim Failed',
          description: "Reward not found."
        })
        return
      }

      // Call the rewards API to claim the reward
      // The backend will determine the appropriate points and validation
      const response = await rewardsApi.claimReward({
        points: reward.rewardPoints,
        type: reward.rewardType,
        description: `Claimed ${reward.rewardType} reward`
      })
      
      // Use the actual new balance from the API response
      const newBalance = response.new_balance || userPoints
      setUserPoints(newBalance)
      
      // Remove reward from state immediately for instant UI update
      setRewards(prevRewards => prevRewards.filter(r => r.id !== rewardId))
      
      // ALSO update shownRewards to prevent this reward from reappearing
      if (reward.rewardType === "review" && reward.reviewId) {
        const updatedShownRewards = new Set(shownRewards)
        updatedShownRewards.add(`review-${reward.reviewId}`)
        setShownRewards(updatedShownRewards)
        // Save to localStorage to persist across page refreshes
        if (typeof window !== 'undefined') {
          localStorage.setItem('shownRewards', JSON.stringify(Array.from(updatedShownRewards)))
        }
      }
      
      // If this was a review reward, we should update the corresponding review's is_reward_claimed status
      if (reward.rewardType === "review" && reward.reviewId) {
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reward.reviewId 
              ? { ...review, is_reward_claimed: true } 
              : review
          )
        )
      }
      
      // Show success message
      setError("") // Clear any existing errors
      
      // Show success toast notification with actual balance
      showToast.success({ 
        title: '🎉 Reward Claimed Successfully!', 
        description: `Reward claimed successfully! Total: ${newBalance} points. Check your offers page for vouchers!`,
        duration: 2000
      })
      
      // Auto-refresh data to reflect latest rewards/points
      try {
        await refreshData()
      } catch (e) {
        // Non-blocking
      }
      
    } catch (error: any) {
      console.error("Error claiming reward:", error)
      
      // Show specific error message based on the error
      let errorMessage = "Failed to claim reward. Please try again."
      
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || "Invalid reward claim request. You may have already claimed this reward or deleted your review."
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to claim this reward."
      } else if (error.response?.status === 404) {
        errorMessage = "Reward not found or already claimed."
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      showToast.error({
        title: 'Reward Claim Failed',
        description: errorMessage
      })
    }
  }

  // Fetch service confirmations and rewards from actual API
  useEffect(() => {
    /**
     * Fetch additional data like service confirmations and rewards
     * This uses actual API endpoints instead of mock data
     */
    const fetchData = async () => {
      try {
        setError(null)
        
        // Fetch user's current reward points from the backend
        try {
          const rewardsSummary = await rewardsApi.getRewardsSummary()
          setUserPoints(rewardsSummary.current_balance || 0)
        } catch (rewardsError) {
          console.warn("Could not fetch rewards data:", rewardsError)
          // Not critical, continue with other data
        }
        
        // NOTE: Removed transaction-history based reward popups to avoid duplicates
        // Review-based rewards are handled in the userReviews transformer effect
        
        // If real data is already loaded, we can set loading to false
        if (!bookingsLoading && !reviewsLoading) {
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again later.")
        setLoading(false)
      }
    }

    fetchData()
  }, [bookings, userReviews, bookingsLoading, reviewsLoading, shownRewards])

  // Filter bookings to find completed ones that need reviews and service deliveries that need confirmation
  useEffect(() => {
    /**
     * Process bookings to identify:
     * 1. Completed services that need reviews
     * 2. Service delivered bookings that need customer confirmation
     */
    if (bookings && bookings.length > 0) {
      // Filter for completed bookings that don't have reviews yet
      const completedBookings = bookings.filter(booking => {
        const isCompleted = booking.status === 'completed'
        const hasReview = userReviews.some(review => 
          review.booking_date === booking.booking_date
        )
        return isCompleted && !hasReview
      })
      
      // Transform bookings to pending reviews format
      const pending = completedBookings.map(booking => ({
        id: booking.id.toString(),
        serviceName: (booking as any).service_details?.title || booking.service?.name || "Service",
        providerName: (booking as any).service_details?.provider?.name || (booking.service?.provider as any)?.name || (booking.service?.provider as any)?.display_name || "Provider",
        date: booking.updatedAt || new Date().toISOString(),
        serviceDate: booking.booking_date || new Date().toISOString(),
        bookingId: typeof booking.id === 'string' ? parseInt(booking.id) : booking.id,
        urgent: isUrgentReview(booking) // Check if review is urgent based on completion date
      }))
      
      setPendingReviews(pending)

      // Filter for service delivered bookings that need customer confirmation
      const serviceDeliveredBookings = bookings.filter(booking => {
        return booking.status === 'service_delivered'
      })
      
      // Transform to service confirmations format
      const confirmations = serviceDeliveredBookings.map(booking => ({
        id: booking.id.toString(),
        serviceName: (booking as any).service_details?.title || booking.service?.name || "Service",
        providerName: (booking as any).service_details?.provider?.name || (booking.service?.provider as any)?.name || (booking.service?.provider as any)?.display_name || "Provider",
        serviceDate: booking.booking_date || new Date().toISOString(),
        status: "delivered" as const,
        bookingId: typeof booking.id === 'string' ? parseInt(booking.id) : booking.id,
        // Additional service details
        serviceCategory: (booking as any).service_details?.category_name || booking.service?.category || "Category",
        servicePrice: booking.total_amount || (booking as any).service_details?.price || booking.service?.price || 0,
        serviceDescription: (booking as any).service_details?.description || booking.service?.description || "",
        serviceDuration: (booking as any).service_details?.duration || (booking.service?.duration ? booking.service.duration.toString() : undefined),
        serviceImages: (booking as any).service_details?.images || booking.service?.images || [],
        confirmationDate: (booking as any).service_delivery_details?.delivered_at || booking.service_delivery?.delivered_at || booking.updatedAt || new Date().toISOString(),
        deliveryNotes: (booking as any).service_delivery_details?.delivery_notes || booking.service_delivery?.delivery_notes || ""
      }))
      
      setNotifications(confirmations)
    }
  }, [bookings, userReviews, bookingsLoading, reviewsLoading])

  // Set reviews when userReviews data is available and update rewards accordingly
  useEffect(() => {
    /**
     * Transform API review data to match the UI component expectations
     * This ensures consistent data structure for the ReviewCard component
     * Also updates rewards based on review status
     */
    if (userReviews) {
      if (userReviews.length > 0) {
        // Transform reviews to match the expected format
        const transformedReviews = userReviews.map(review => ({
          id: review.id.toString(),
          serviceName: review.service_title || "Service",
          providerName: (review.provider as any)?.display_name || (review.provider as any)?.name || (review.provider as any)?.full_name || (review.provider as any)?.business_name || "Provider",
          providerProfileImage: (review.provider as any)?.profile_picture || undefined,
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt || new Date().toISOString(),
          images: review.images || [],
          helpfulCount: 0,
          verified: true,
          serviceDate: review.booking_date || new Date().toISOString(),
          responseFromProvider: review.provider_response || "",
          responseDate: review.provider_response_updated_at || review.provider_response_created_at || null,
          // Use actual data when available, fallback to reasonable defaults
          category: "Services",
          location: "Location",
          price: "Price not available",
          duration: "Duration not specified",
          tags: [],
          isHelpful: false,
          // Service delivery related fields
          serviceDeliveryStatus: "confirmed",
          deliveryDate: review.booking_date || new Date().toISOString(),
          confirmationDate: review.updatedAt || new Date().toISOString(),
          // NEW: Add detailed quality ratings
          punctuality_rating: review.punctuality_rating,
          quality_rating: review.quality_rating,
          communication_rating: review.communication_rating,
          value_rating: review.value_rating,
          // Reward claim status - use the actual value from the API
          is_reward_claimed: review.is_reward_claimed || false,
          // Add booking_id for proper identification
          booking_id: review.booking_id || null,
        }))
        
        setReviews(transformedReviews)
        
        // Check for unclaimed rewards and create notifications
        // Only show rewards for reviews that are not already claimed
        const unclaimedRewards = transformedReviews
          .filter(review => !review.is_reward_claimed) // Only unclaimed reviews
          .filter(review => {  // Also check if we've already shown this reward
            const rewardId = `review-${review.id}`;
            return !shownRewards.has(rewardId);
          })
          .map(review => ({
            id: `review-${review.id}`,
            rewardPoints: rewardPointsPerReview, // Use dynamic value from config
            rewardType: "review" as const,
            reviewId: review.id
          }))
        
        // Update rewards - only add review rewards, preserve other reward types
        // But avoid duplicates by checking if reward already exists
        setRewards(prevRewards => {
          // Build a set of existing reward IDs to prevent duplicates
          const existingIds = new Set(prevRewards.map(r => r.id))

          // Start with current rewards (preserve any already enqueued popups)
          const mergedRewards = [...prevRewards]

          // Add any new unclaimed review rewards that are not already present
          unclaimedRewards.forEach(newReward => {
            if (!existingIds.has(newReward.id)) {
              mergedRewards.push(newReward)
            }
          })

          return mergedRewards
        })
      } else {
        // If no reviews, clear the reviews and rewards state
        setReviews([])
        setRewards(prevRewards => prevRewards.filter(r => r.rewardType !== "review"))
      }
    }
  }, [userReviews, shownRewards, rewardPointsPerReview]) // Also run when shownRewards and rewardPointsPerReview changes

  // Handle edit review action
  const handleEditReview = (reviewId: string) => {
    /**
     * Prepare review data for editing
     * Populates the review dialog with existing review data
     */
    const review = reviews.find(r => r.id === reviewId)
    if (review) {
      setRating(review.rating)
      setComment(review.comment)
      setReviewTitle(review.serviceName)
      
      // Set detailed ratings if available
      if (review.punctuality_rating || review.quality_rating || review.communication_rating || review.value_rating) {
        setServiceQuality({
          punctuality: review.punctuality_rating || 0,
          quality: review.quality_rating || 0,
          communication: review.communication_rating || 0,
          value: review.value_rating || 0,
        })
      }
      
      // Create a proper selectedService object with booking information
      setSelectedService({
        ...review,
        bookingId: review.booking_id || review.id, // Use booking_id from API response
        serviceName: review.serviceName,
        providerName: review.providerName,
        serviceDate: review.serviceDate
      })
      setIsDialogOpen(true)
    }
  }

  // Handle submit review action
  const handleSubmitReview = async () => {
    /**
     * Submit a new review or update an existing one
     * This now calls the actual API to save the review with photos
     */
    if (!rating || !comment.trim()) {
      setError("Please provide both a rating and a comment.")
      return
    }
    
    if (!selectedService?.bookingId) {
      setError("Cannot submit review - booking information missing.")
      return
    }
    
    try {
      const reviewData = {
        booking_id: selectedService.bookingId,
        rating,
        comment,
        punctuality_rating: serviceQuality.punctuality || undefined,
        quality_rating: serviceQuality.quality || undefined,
        communication_rating: serviceQuality.communication || undefined,
        value_rating: serviceQuality.value || undefined,
      }
      
      // Store the previous points balance to detect changes
      const previousPoints = userPoints
      
      let response: any
      if (selectedService?.id && reviews.find(r => r.id === selectedService.id)) {
        // Edit existing review - call update API
        response = await reviewsApi.updateReview(selectedService.id, reviewData, photos)
        // Update local state
        setReviews(reviews.map(r => 
          r.id === selectedService.id 
            ? { 
                ...r, 
                rating, 
                comment, 
                punctuality_rating: serviceQuality.punctuality,
                quality_rating: serviceQuality.quality,
                communication_rating: serviceQuality.communication,
                value_rating: serviceQuality.value,
                date: new Date().toISOString(),
                images: response?.images?.map((img: any) => img.image_url || img.image) || r.images
              }
            : r
        ))
        
        // Show success toast for update
        showToast.success({
          title: "Review Updated Successfully",
          description: "Your review has been updated with the latest changes.",
          duration: 2000
        })
        
        // Auto-refresh to sync counts/rewards/state
        try {
          await refreshData()
        } catch (e) {
          // Non-blocking
        }
      } else {
        // Add new review - using the correct API method with photos
        response = await reviewsApi.createReview(reviewData, photos)
        
        const newReview = {
          id: response?.id?.toString() || Date.now().toString(),
          serviceName: selectedService.serviceName || "Service",
          providerName: selectedService.providerName || "Provider",
          rating,
          comment,
          punctuality_rating: serviceQuality.punctuality,
          quality_rating: serviceQuality.quality,
          communication_rating: serviceQuality.communication,
          value_rating: serviceQuality.value,
          date: new Date().toISOString(),
          images: response?.images?.map((img: any) => img.image_url || img.image) || [],
          helpfulCount: 0,
          verified: true,
          serviceDate: selectedService.serviceDate || new Date().toISOString(),
          // Newly created reviews are eligible for rewards by default
          is_reward_claimed: false,
          booking_id: selectedService.bookingId,
        }
        
        // Create reward notification for the new review ONLY if it's not already shown
        const rewardId = `review-${newReview.id}`;
        if (!shownRewards.has(rewardId)) {
          const newReward: Reward = {
            id: rewardId,
            rewardPoints: rewardPointsPerReview,
            rewardType: "review",
            reviewId: newReview.id
          }
          
          // Add the new review to the reviews state
          setReviews([newReview, ...reviews])
          
          // Add the new reward to the rewards state immediately for instant UI update
          setRewards(prevRewards => {
            const exists = prevRewards.some(r => r.id === newReward.id)
            return exists ? prevRewards : [...prevRewards, newReward]
          })
          
          // NOTE: Do not mark as shown yet; we only mark as shown after claim
        } else {
          // Just add the review without showing reward notification
          setReviews([newReview, ...reviews])
        }
        
        // Remove from pending if it was a pending review
        if (selectedService?.bookingId) {
          setPendingReviews(pendingReviews.filter(p => p.id !== selectedService.id))
        }
        
        // Show success toast for creation
        showToast.success({
          title: "Review Submitted Successfully",
          description: "Thank you for your feedback! Your review has been published.",
          duration: 2000
        })
        
        // Auto-refresh to ensure server state (including reward flags) is in sync
        try {
          await refreshData()
        } catch (e) {
          // Non-blocking
        }
      }
      
      // Close the dialog
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
      
    } catch (error: any) {
      // Handle submission error with proper toast
      
      // Show specific error message based on the error
      let errorMessage = "Failed to submit review. Please try again."
      
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to edit this review or the edit window has expired."
      } else if (error.response?.status === 404) {
        errorMessage = "Review not found. It may have been deleted."
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || "Invalid review data. Please check your input."
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }
      
      showToast.error({
        title: "Review Submission Failed",
        description: errorMessage
      })
      
      setError(errorMessage)
    }
  }

  // Handle delete review action
  const handleDeleteReview = async (reviewId: string) => {
    /**
     * Remove a review from the displayed list
     * This now calls the actual API to delete the review
     */
    try {
      // Call API to delete review
      await reviewsApi.deleteReview(reviewId)
      setReviews(reviews.filter(r => r.id !== reviewId))
      
      // Also remove any reward notifications for this review
      setRewards(rewards.filter(r => r.reviewId !== reviewId))
      
      // Show success toast
      showToast.success({
        title: "Review Deleted Successfully",
        description: "Your review has been removed successfully.",
        duration: 2000
      })

      // Auto-refresh to sync lists and pending items
      try {
        await refreshData()
      } catch (e) {
        // Non-blocking
      }
    } catch (error) {
      // Handle deletion error with proper toast
      setError("Failed to delete review. Please try again.")
      
      // Show error toast
      showToast.error({
        title: "Review Deletion Failed",
        description: "Failed to delete review. Please try again."
      })
    }
  }

  // Handle leave review action
  const handleLeaveReview = (service: any) => {
    /**
     * Initialize review dialog for a new review
     * Sets the selected service and opens the review dialog
     */
    setSelectedService(service)
    setIsDialogOpen(true)
  }

  // Handle service completion confirmation
  const handleConfirmServiceCompletion = async (notificationId: string, rating: number, notes?: string) => {
    /**
     * Confirm service completion via API and update UI state
     */
    try {
      const notification = notifications.find(n => n.id === notificationId)
      if (!notification?.bookingId) {
        setError("Cannot confirm service - booking ID missing.")
        showToast.error({
          title: "Confirmation Failed",
          description: "Cannot confirm service - booking ID missing."
        })
        return
      }

      // Call API to confirm service completion
      await bookingsApi.confirmServiceCompletion(notification.bookingId, {
        customer_rating: rating,
        customer_notes: notes || '',
        would_recommend: rating >= 4
      })

      // Remove from notifications (it's now completed)
      setNotifications(notifications.filter(n => n.id !== notificationId))

      // Show success toast
      showToast.success({
        title: "Service Confirmed",
        description: "Thank you! Your confirmation and rating have been recorded."
      })
      
      // The booking should now be completed, so it might appear in pending reviews
      // Auto-refresh to update UI immediately
      try {
        await refreshData()
      } catch (e) {
        // Non-blocking
      }
    } catch (error: any) {
      // Handle confirmation error with proper toast
      setError("Failed to confirm service completion. Please try again.")
      
      const description = error?.response?.data?.detail || error?.message || "Failed to confirm service completion."
      showToast.error({
        title: "Confirmation Failed",
        description:description,
        duration: 2000
      })
    }
  }

  // Handle view delivery details
  const handleViewDeliveryDetails = useCallback((notification: ServiceConfirmation) => {
    setSelectedNotification(notification)
    setDeliveryDetailsModalOpen(true)
  }, [])

  // Handle dispute form submission
  const handleDisputeSubmit = async (reason: string) => {
    /**
     * Submit a dispute for a service
     * This now calls the actual API to submit the dispute
     */
    try {
      // Simulate dispute submission since there's no direct API method
      if (selectedService?.bookingId) {
        setShowDisputeForm(false)
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error submitting dispute:", error)
      setError("Failed to submit dispute. Please try again.")
    }
  }

  // Handle dispute form cancellation
  const handleDisputeCancel = () => {
    /**
     * Close the dispute form without submitting
     */
    setShowDisputeForm(false)
  }

  // Filter and sort reviews based on user input
  const filteredReviews = reviews.filter(review => {
    const searchTermLower = searchTerm?.toLowerCase().trim() || "";
    const matchesSearch = !searchTermLower || 
      review.serviceName?.toLowerCase().includes(searchTermLower) ||
      review.providerName?.toLowerCase().includes(searchTermLower) ||
      review.comment?.toLowerCase().includes(searchTermLower)
    
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
        return (b.helpfulCount || 0) - (a.helpfulCount || 0)
      default: // newest
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })

  // Show loading skeletons while data is being fetched
  if (bookingsLoading || reviewsLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto py-6 px-4 max-w-6xl">
          <div className="mb-6">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Card className="bg-gradient-to-br from-card to-card/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-full mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error message if there was an error fetching data
  if (error || bookingsError || reviewsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="container mx-auto py-6 px-4 max-w-6xl">
          <div className="text-center py-12">
            <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">
              {error || bookingsError || reviewsError}
            </p>
            <Button onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
      <motion.div 
        className="container mx-auto py-2 px-2 sm:py-4 sm:px-4 md:py-6 md:px-6 max-w-full md:max-w-7xl"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
              delayChildren: 0.1
            }
          }
        }}
        role="main"
        aria-label="Customer Reviews Dashboard"
      >
      <EnhancedStatsCard 
        reviewsCount={reviews.length}
        pendingCount={pendingReviews.length}
        averageRating={reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0}
        userPoints={userPoints}
        onRefresh={refreshData}
      />

      {/* Reward Notifications - Mobile Responsive */}
      {rewards.length > 0 && (
        <motion.div 
          variants={headerVariants} 
          className="mb-6 space-y-4"
        >
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Rewards</h2>
          <div className="space-y-4">
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-gradient-to-br from-card to-card/90 backdrop-blur-sm rounded-lg">
                <RewardNotification
                  rewardPoints={reward.rewardPoints}
                  rewardType={reward.rewardType}
                  onClaimReward={() => handleClaimReward(reward.id)}
                  onViewDetails={() => router.push("/dashboard/customer/offers")}
                />
              </div>
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
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Service Confirmations</h2>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-gradient-to-br from-card to-card/90 backdrop-blur-sm rounded-lg">
                <ServiceConfirmationNotification
                  serviceName={notification.serviceName}
                  providerName={notification.providerName}
                  serviceDate={format(new Date(notification.serviceDate), "MMMM d, yyyy")}
                  status={notification.status}
                  onLeaveReview={() => handleLeaveReview(notification)}
                  onConfirmService={(rating, notes) => handleConfirmServiceCompletion(notification.id, rating, notes)}
                  onViewDetails={() => handleViewDeliveryDetails(notification)}
                  serviceCategory={notification.serviceCategory}
                  servicePrice={notification.servicePrice}
                  serviceDescription={notification.serviceDescription}
                  serviceDuration={notification.serviceDuration}
                  serviceImages={notification.serviceImages}
                  serviceTags={notification.serviceTags}
                  bookingId={notification.bookingId}
                  confirmationDate={notification.confirmationDate ? format(new Date(notification.confirmationDate), "MMMM d, yyyy") : undefined}
                  deliveryNotes={notification.deliveryNotes}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Clean Search and Filters - Mobile Responsive */}
      <motion.div 
        variants={headerVariants}
        className="mb-2 sm:mb-4 p-2 sm:p-3 md:p-4 bg-gradient-to-br from-card to-card/90 backdrop-blur-sm border rounded-lg sm:rounded-xl shadow-sm w-full"
        role="search"
        aria-label="Review search and filtering options"
      >
  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {/* Search */}
          <div className="relative xs:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search reviews and services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm w-full"
              aria-label="Search reviews and services"
              role="searchbox"
            />
          </div>
          
          {/* Rating Filter */}
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="h-10 text-sm" aria-label="Filter by rating">
              <Star className="h-4 w-4 mr-2 text-yellow-500" aria-hidden="true" />
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2">5 stars</span>
                </div>
              </SelectItem>
              <SelectItem value="4">
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="h-3 w-3 text-gray-300" />
                  <span className="ml-2">4 stars</span>
                </div>
              </SelectItem>
              <SelectItem value="3">
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                  {[...Array(2)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-gray-300" />
                  ))}
                  <span className="ml-2">3 stars</span>
                </div>
              </SelectItem>
              <SelectItem value="2">
                <div className="flex items-center gap-1">
                  {[...Array(2)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-gray-300" />
                  ))}
                  <span className="ml-2">2 stars</span>
                </div>
              </SelectItem>
              <SelectItem value="1">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 text-gray-300" />
                  ))}
                  <span className="ml-2">1 star</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 text-sm" aria-label="Sort reviews by">
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Newest first
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Oldest first
                </div>
              </SelectItem>
              <SelectItem value="rating-high">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  Highest rated
                </div>
              </SelectItem>
              <SelectItem value="rating-low">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  Lowest rated
                </div>
              </SelectItem>
              <SelectItem value="helpful">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-3 w-3" />
                  Most helpful
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Clean Tabs - Mobile Responsive */}
      <motion.div variants={headerVariants}>
        <Card className="border shadow-sm bg-gradient-to-br from-card to-card/90 backdrop-blur-sm w-full">
          <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 bg-muted/50 dark:bg-muted/20 p-1 rounded-lg">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                  role="tab"
                  aria-controls="all-reviews"
                  aria-selected={activeTab === "all"}
                >
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">My Reviews</span>
                  <Badge className="ml-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5" aria-label={`${reviews.length} reviews`}>
                    {reviews.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="pending" 
                  className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                  role="tab"
                  aria-controls="pending-reviews"
                  aria-selected={activeTab === "pending"}
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Pending Reviews</span>
                  {pendingReviews.length > 0 && (
                    <Badge variant="default" className="ml-1 text-xs bg-amber-500 hover:bg-amber-600 px-2 py-0.5" aria-label={`${pendingReviews.length} pending reviews`}>
                      {pendingReviews.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="confirmations" 
                  className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground rounded-md transition-all duration-200 flex items-center justify-center gap-2 xs:col-span-2 sm:col-span-1"
                  role="tab"
                  aria-controls="service-confirmations"
                  aria-selected={activeTab === "confirmations"}
                >
                  <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Confirmations</span>
                  {notifications.length > 0 && (
                    <Badge className="ml-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-0.5" aria-label={`${notifications.length} service confirmations needed`}>
                      {notifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0" role="tabpanel" id="all-reviews" aria-labelledby="all-tab">
                <ScrollArea className="h-[220px] xs:h-[280px] sm:h-[350px] md:h-[500px] lg:h-[600px] w-full" aria-label="My reviews list">
                  <div className="pr-1 sm:pr-2 md:pr-4 lg:pr-6">
                    {loading ? (
                      // Show loading skeletons while data is being fetched
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <Skeleton key={index} className="h-32 rounded-lg" />
                        ))}
                      </div>
                    ) : filteredReviews.length === 0 ? (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6 border border-blue-200 dark:border-blue-800"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <MessageSquare className="h-8 w-8 text-blue-500" />
                        </motion.div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                          {searchTerm || ratingFilter !== "all" ? "No matching reviews" : "No reviews yet"}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto leading-relaxed">
                          {searchTerm || ratingFilter !== "all" 
                            ? "Try adjusting your search or filters" 
                            : "Start by using our services, then share your experience with others"
                          }
                        </p>
                        {(searchTerm || ratingFilter !== "all") && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchTerm("")
                              setRatingFilter("all")
                            }}
                            className="text-sm hover:scale-105 transition-transform"
                          >
                            Clear filters
                          </Button>
                        )}
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          variants={prefersReducedMotion ? reducedMotionContainer : container}
                          initial="hidden"
                          animate="show"
                          className="space-y-4 md:space-y-6"
                        >
                          {filteredReviews.map((review) => (
                            <motion.div key={review.id} variants={prefersReducedMotion ? reducedMotionItem : item}>
                              <ReviewCard
                                review={{
                                  ...review,
                                  date: format(new Date(review.date), "MMMM d, yyyy")
                                }}
                                onEdit={handleEditReview}
                                onDelete={handleDeleteReview}
                                onHelpful={(id) => {
                                  // Update helpful count
                                  setReviews(reviews.map(r => 
                                    r.id === id 
                                      ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1, isHelpful: true }
                                      : r
                                  ))
                                }}
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

              <TabsContent value="pending" className="mt-0" role="tabpanel" id="pending-reviews" aria-labelledby="pending-tab">
                <ScrollArea className="h-[220px] xs:h-[280px] sm:h-[350px] md:h-[500px] lg:h-[600px] w-full" aria-label="Pending reviews list">
                  <div className="pr-1 sm:pr-2 md:pr-4 lg:pr-6">
                    {pendingReviews.length === 0 ? (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="inline-block p-4 bg-green-50 dark:bg-green-900/20 rounded-full mb-6 border border-green-200 dark:border-green-800"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <ThumbsUp className="h-8 w-8 text-green-500" />
                        </motion.div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">All caught up!</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto leading-relaxed">
                          No pending reviews. All your recent services have been reviewed.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.refresh()}
                          className="text-sm hover:scale-105 transition-transform"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          variants={prefersReducedMotion ? reducedMotionContainer : container}
                          initial="hidden"
                          animate="show"
                          className="space-y-4"
                        >
                          {pendingReviews.map((service) => (
                            <motion.div key={service.id} variants={prefersReducedMotion ? reducedMotionItem : item}>
                              <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl overflow-hidden">
                                <CardHeader className="p-6">
                                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                                    {/* Service Info Section */}
                                    <div className="flex-1">
                                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-3 flex-wrap">
                                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                              {service.serviceName}
                                            </CardTitle>
                                            {service.urgent && (
                                              <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                whileHover={{ scale: 1.1 }}
                                              >
                                                <Badge variant="destructive" className="text-xs animate-pulse">
                                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                                  Urgent Review
                                                </Badge>
                                              </motion.div>
                                            )}
                                            <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs px-2 py-1">
                                              <Clock className="h-3 w-3 mr-1" />
                                              Pending
                                            </Badge>
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                              <span className="text-white font-bold text-sm">
                                                {service.providerName?.charAt(0) || 'P'}
                                              </span>
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-700 dark:text-gray-300">{service.providerName}</p>
                                              <p className="text-xs text-gray-500 dark:text-gray-400">Service Provider</p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Reward Badge */}
                                        <motion.div 
                                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-md shadow-md min-w-[80px]"
                                          whileHover={{ y: -2 }}
                                          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                        >
                                          <div className="text-xs font-medium leading-tight">Earn Points</div>
                                          <div className="text-xs font-bold flex items-center gap-1 mt-0.5">
                                            <Gift className="h-3 w-3" />
                                            +{rewardPointsPerReview}
                                          </div>
                                        </motion.div>
                                      </div>

                                      {/* Service Details Grid */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/50 dark:bg-gray-800/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Service Date</span>
                                              <p className="text-gray-600 dark:text-gray-400">{format(new Date(service.serviceDate), "EEEE, MMMM d, yyyy")}</p>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Completed</span>
                                              <p className="text-gray-600 dark:text-gray-400">{formatDistance(new Date(service.serviceDate), new Date(), { addSuffix: true })}</p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 text-sm">
                                            <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Your Review</span>
                                              <p className="text-gray-600 dark:text-gray-400">Help others by sharing your experience</p>
                                            </div>
                                          </div>
                                          
                                          {service.price && (
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="h-4 w-4 text-amber-600 dark:text-amber-400 font-bold">₹</span>
                                              <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Service Cost</span>
                                                <p className="text-gray-600 dark:text-gray-400">₹{service.price}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Section */}
                                    <div className="flex flex-col gap-3 lg:min-w-[200px]">
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        <Button
                                          onClick={() => {
                                            setSelectedService(service)
                                            setIsDialogOpen(true)
                                          }}
                                          size="lg"
                                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                          <Star className="h-4 w-4 mr-2" />
                                          Write Review
                                        </Button>
                                      </motion.div>
                                      
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/services/${service.serviceId || service.id}`)}
                                        className="w-full border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 bg-white dark:bg-transparent transition-all duration-200
                                          hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400
                                          dark:hover:bg-amber-800/60 dark:hover:text-amber-100 dark:hover:border-amber-400
                                          shadow-sm"
                                      >
                                        View Service Details
                                      </Button>
                                      
                                      {/* Progress Indicator */}
                                      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                        </div>
                                        <span>Service Complete → Review Pending</span>
                                      </div>
                                    </div>
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

              <TabsContent value="confirmations" className="mt-0" role="tabpanel" id="service-confirmations" aria-labelledby="confirmations-tab">
                <ScrollArea className="h-[220px] xs:h-[280px] sm:h-[350px] md:h-[500px] lg:h-[600px] w-full" aria-label="Service confirmations list">
                  <div className="pr-1 sm:pr-2 md:pr-4 lg:pr-6">
                    {notifications.length === 0 ? (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6 border border-blue-200 dark:border-blue-800"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <ThumbsUp className="h-8 w-8 text-blue-500" />
                        </motion.div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">No services to confirm!</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto leading-relaxed">
                          All services have been properly confirmed. Services requiring confirmation will appear here.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.refresh()}
                          className="text-sm hover:scale-105 transition-transform"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </motion.div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          variants={prefersReducedMotion ? reducedMotionContainer : container}
                          initial="hidden"
                          animate="show"
                          className="space-y-4"
                        >
                          {notifications.map((notification) => (
                            <motion.div key={notification.id} variants={prefersReducedMotion ? reducedMotionItem : item}>
                              <ServiceConfirmationNotification
                                serviceName={notification.serviceName}
                                providerName={notification.providerName}
                                serviceDate={format(new Date(notification.serviceDate), "MMMM d, yyyy")}
                                status={notification.status}
                                onLeaveReview={() => handleLeaveReview(notification)}
                                onConfirmService={(rating, notes) => handleConfirmServiceCompletion(notification.id, rating, notes)}
                                onViewDetails={() => handleViewDeliveryDetails(notification)}
                                serviceCategory={notification.serviceCategory}
                                servicePrice={notification.servicePrice}
                                serviceDescription={notification.serviceDescription}
                                serviceDuration={notification.serviceDuration}
                                serviceImages={notification.serviceImages}
                                serviceTags={notification.serviceTags}
                                bookingId={notification.bookingId}
                                confirmationDate={notification.confirmationDate ? format(new Date(notification.confirmationDate), "MMMM d, yyyy") : undefined}
                                deliveryNotes={notification.deliveryNotes}
                              />
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
        <DialogContent className="w-full sm:max-w-[600px] max-h-[95vh] overflow-y-auto mx-2 sm:mx-0 p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              <Star className="h-5 w-5 text-yellow-500" />
              {selectedService?.id && reviews.find(r => r.id === selectedService.id) ? "Edit Review" : "Leave a Review"}
            </DialogTitle>
          </DialogHeader>
          <motion.div 
            className="space-y-4 sm:space-y-6 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Service Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-base sm:text-lg mb-1 text-gray-900 dark:text-gray-100">{selectedService?.serviceName}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{selectedService?.providerName}</p>
              {selectedService?.serviceDate && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
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
                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
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
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your Rating *</label>
                  <div className="flex items-center gap-2" role="radiogroup" aria-label="Rate your experience from 1 to 5 stars">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <motion.button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(0)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        role="radio"
                        aria-checked={rating === value}
                        aria-label={`Rate ${value} star${value !== 1 ? 's' : ''} out of 5`}
                        tabIndex={0}
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            value <= (hoverRating || rating) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300 hover:text-yellow-300"
                          }`}
                        />
                      </motion.button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium" aria-live="polite">
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
                  <label htmlFor="reviewTitle" className="text-sm font-semibold text-gray-900 dark:text-gray-100">Review Title</label>
                  <Input
                    id="reviewTitle"
                    placeholder="Summarize your experience..."
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                
                {/* Review Comment */}
                <div className="space-y-2">
                  <label htmlFor="reviewComment" className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your Review *</label>
                  <Textarea
                    id="reviewComment"
                    placeholder="Share the details of your experience. What went well? What could be improved?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {comment.length}/1000 characters {comment.length >= 50 ? "✓" : `(minimum 50)`}
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
                    className="flex-1"
                    aria-label="Cancel review submission"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitReview} 
                    disabled={!rating || comment.length < 50}
                    className="flex-1"
                    aria-label={selectedService?.id && reviews.find(r => r.id === selectedService.id) ? "Update your review" : "Submit your review"}
                    aria-describedby={!rating || comment.length < 50 ? "submit-requirements" : undefined}
                  >
                    <Star className="h-4 w-4 mr-2" aria-hidden="true" />
                    {selectedService?.id && reviews.find(r => r.id === selectedService.id) ? "Update Review" : "Submit Review"}
                  </Button>
                  {(!rating || comment.length < 50) && (
                    <div id="submit-requirements" className="sr-only">
                      {!rating && "Please select a rating. "}
                      {comment.length < 50 && "Please write at least 50 characters in your review."}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Service Delivery Details Modal */}
      {selectedNotification && (
        <ServiceDeliveryDetailsModal
          isOpen={deliveryDetailsModalOpen}
          onClose={() => {
            setDeliveryDetailsModalOpen(false)
            setSelectedNotification(null)
          }}
          serviceName={selectedNotification.serviceName}
          providerName={selectedNotification.providerName}
          serviceDate={format(new Date(selectedNotification.serviceDate), "MMMM d, yyyy")}
          status={selectedNotification.status}
          serviceCategory={selectedNotification.serviceCategory}
          servicePrice={selectedNotification.servicePrice}
          serviceDescription={selectedNotification.serviceDescription}
          serviceDuration={selectedNotification.serviceDuration}
          serviceImages={selectedNotification.serviceImages}
          serviceTags={selectedNotification.serviceTags}
          bookingId={selectedNotification.bookingId}
          confirmationDate={selectedNotification.confirmationDate ? format(new Date(selectedNotification.confirmationDate), "MMMM d, yyyy") : undefined}
          deliveryNotes={selectedNotification.deliveryNotes}
          deliveryPhotos={selectedNotification.deliveryPhotos}
          deliveredAt={selectedNotification.deliveredAt}
        />
      )}
    </motion.div>
  </div>
  );
}

export default ReviewsPage;
