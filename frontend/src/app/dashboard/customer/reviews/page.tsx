"use client"

import { useState, useEffect, useCallback } from "react"
import { ReviewCard } from "@/components/reviews/ReviewCard"
import { ServiceConfirmationNotification } from "@/components/reviews/ServiceConfirmationNotification"
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
import { Star, Plus, Search, Filter, Edit3, MessageSquare, ThumbsUp, Calendar, Camera, Gift, AlertTriangle, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistance } from "date-fns"
import { useBookings } from "@/hooks/useBookings"
import { useReviews } from "@/hooks/useReviews"
import { bookingsApi, reviewsApi, rewardsApi } from "@/services/api"
import customerApi from "@/services/customer.api"
import { Booking, Review } from "@/types"
import { showToast } from "@/components/ui/enhanced-toast"

// Interface for service confirmation notifications
interface ServiceConfirmation {
  id: string
  serviceName: string
  providerName: string
  serviceDate: string
  status: "delivered" | "confirmed"
  bookingId: number
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
  const [rewardPointsPerReview, setRewardPointsPerReview] = useState<number>(50) // Default to 50 points
  
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
      console.log("🔍 DEBUG: Reward claiming starting")
      console.log("🔍 DEBUG: RewardId:", rewardId)
      console.log("🔍 DEBUG: Found reward:", reward)
      
      if (!reward) {
        console.error("🔍 DEBUG: Reward not found for ID:", rewardId)
        setError("Reward not found.")
        showToast.error({
          title: 'Reward Claim Failed',
          description: "Reward not found."
        })
        return
      }

      console.log("🔍 DEBUG: Calling rewardsApi.claimReward")

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
        description: `Reward claimed successfully! Total: ${newBalance} points. Check your offers page for vouchers!`
      })
      
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
        serviceName: booking.service?.name || "Service",
        providerName: booking.provider?.name || "Provider",
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
        serviceName: booking.service?.name || "Service",
        providerName: booking.provider?.name || "Provider",
        serviceDate: booking.booking_date || new Date().toISOString(),
        status: "delivered" as const,
        bookingId: typeof booking.id === 'string' ? parseInt(booking.id) : booking.id
      }))
      
      setNotifications(confirmations)
    }
  }, [bookings, userReviews])

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
          providerName: review.provider?.display_name || "Provider",
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt || new Date().toISOString(),
          images: review.images || [],
          helpfulCount: 0,
          verified: true,
          serviceDate: review.booking_date || new Date().toISOString(),
          responseFromProvider: "",
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
          // Filter out any existing review rewards to prevent duplicates
          const nonReviewRewards = prevRewards.filter(r => r.rewardType !== "review")
          
          // Only add unclaimed review rewards that don't already exist
          const filteredUnclaimedRewards = unclaimedRewards.filter(newReward => 
            !prevRewards.some(existingReward => existingReward.id === newReward.id)
          )
          
          // If there are new rewards to add, update the state
          if (filteredUnclaimedRewards.length > 0) {
            return [...nonReviewRewards, ...filteredUnclaimedRewards]
          }
          
          // Otherwise, keep existing rewards but ensure review rewards are up to date
          return [...nonReviewRewards, ...unclaimedRewards]
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
      
      console.log("Submitting review with data:", reviewData)
      console.log("Including photos:", photos.length > 0 ? photos.length + " photos" : "no photos")
      
      // Store the previous points balance to detect changes
      const previousPoints = userPoints
      
      let response: any
      if (selectedService?.id && reviews.find(r => r.id === selectedService.id)) {
        // Edit existing review - call update API
        response = await reviewsApi.updateReview(selectedService.id, reviewData, photos)
        console.log("Review updated successfully:", response)
        
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
          description: "Your review has been updated with the latest changes."
        })
        
        console.log("Review update successful!")
      } else {
        // Add new review - using the correct API method with photos
        response = await reviewsApi.createReview(reviewData, photos)
        console.log("Review created successfully:", response)
        
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
          setRewards(prevRewards => [...prevRewards, newReward])
          
          // Also add to shownRewards to prevent duplicates
          const updatedShownRewards = new Set(shownRewards)
          updatedShownRewards.add(rewardId)
          setShownRewards(updatedShownRewards)
          
          // Save to localStorage to persist across page refreshes
          if (typeof window !== 'undefined') {
            localStorage.setItem('shownRewards', JSON.stringify(Array.from(updatedShownRewards)))
          }
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
          description: "Thank you for your feedback! Your review has been published."
        })
        
        console.log("Review submission successful!")
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
      console.error("Error submitting review:", error)
      
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
        description: "Your review has been removed successfully."
      })
    } catch (error) {
      console.error("Error deleting review:", error)
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
      console.log("🔍 DEBUG: Service confirmation starting")
      console.log("🔍 DEBUG: NotificationId:", notificationId)
      console.log("🔍 DEBUG: Found notification:", notification)
      
      if (!notification?.bookingId) {
        console.error("🔍 DEBUG: No booking ID found for notification:", notificationId)
        setError("Cannot confirm service - booking ID missing.")
        return
      }

      console.log("🔍 DEBUG: BookingId found:", notification.bookingId, "Type:", typeof notification.bookingId)
      console.log("🔍 DEBUG: Rating:", rating, "Notes:", notes)
      console.log("🔍 DEBUG: Calling bookingsApi.confirmServiceCompletion")

      // Call API to confirm service completion
      await bookingsApi.confirmServiceCompletion(notification.bookingId, {
        customer_rating: rating,
        customer_notes: notes || '',
        would_recommend: rating >= 4
      })

      console.log("🔍 DEBUG: Service confirmation API call completed successfully")

      // Remove from notifications (it's now completed)
      setNotifications(notifications.filter(n => n.id !== notificationId))

      // Show success message
      console.log("Service confirmation successful!")
      
      // The booking should now be completed, so it might appear in pending reviews
      // We'll let the next data refresh handle this
    } catch (error) {
      console.error("Error confirming service completion:", error)
      setError("Failed to confirm service completion. Please try again.")
    }
  }

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
            <Button onClick={() => window.location.reload()}>
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
        className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 max-w-7xl"
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
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Clean Search and Filters - Mobile Responsive */}
      <motion.div 
        variants={headerVariants}
        className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-br from-card to-card/90 backdrop-blur-sm border rounded-lg sm:rounded-xl shadow-sm"
        role="search"
        aria-label="Review search and filtering options"
      >
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
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
        <Card className="border shadow-sm bg-gradient-to-br from-card to-card/90 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 lg:p-6">
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
                  <Badge variant="secondary" className="ml-1 text-xs px-2 py-0.5" aria-label={`${reviews.length} reviews`}>
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
                    <Badge variant="destructive" className="ml-1 text-xs animate-pulse px-2 py-0.5" aria-label={`${notifications.length} service confirmations needed`}>
                      {notifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0" role="tabpanel" id="all-reviews" aria-labelledby="all-tab">
                <ScrollArea className="h-[250px] xs:h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]" aria-label="My reviews list">
                  <div className="pr-2 sm:pr-4 lg:pr-6">
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
                <ScrollArea className="h-[250px] xs:h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]" aria-label="Pending reviews list">
                  <div className="pr-2 sm:pr-4 lg:pr-6">
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
                          onClick={() => window.location.reload()}
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
                              <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-50/30 to-amber-50/20 dark:from-amber-900/10 dark:to-amber-900/5 rounded-lg">
                                <CardHeader className="p-4 md:p-6">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <CardTitle className="text-base font-semibold">{service.serviceName}</CardTitle>
                                        {service.urgent && (
                                          <Badge variant="destructive" className="text-xs">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Urgent
                                          </Badge>
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
                                    <Button
                                      onClick={() => {
                                        setSelectedService(service)
                                        setIsDialogOpen(true)
                                      }}
                                      size="sm"
                                      className="w-full sm:w-auto"
                                    >
                                      <Star className="h-3 w-3 mr-2" />
                                      Leave Review
                                    </Button>
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
                <ScrollArea className="h-[250px] xs:h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]" aria-label="Service confirmations list">
                  <div className="pr-2 sm:pr-4 lg:pr-6">
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
                          onClick={() => window.location.reload()}
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
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
    </motion.div>
  </div>
  );
}

export default ReviewsPage;
