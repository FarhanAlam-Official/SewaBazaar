import { useState, useEffect, useCallback } from "react"
import { reviewsApi } from "@/services/api"
import { Review } from "@/types"

/**
 * Custom hook to fetch user reviews from the API
 * This hook retrieves all reviews associated with the current user's bookings
 * 
 * @param fetchFunction Optional function to fetch reviews (defaults to getMyReviews)
 * @returns Object containing:
 * - reviews: Array of Review objects
 * - loading: Boolean indicating if data is being fetched
 * - error: String containing error message if fetch failed
 * - refetch: Function to manually refetch reviews
 */
export const useReviews = (fetchFunction?: () => Promise<any>) => {
  // State to store reviews data
  const [reviews, setReviews] = useState<Review[]>([])
  // State to track loading status
  const [loading, setLoading] = useState(true)
  // State to track any errors during fetch
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch reviews for the current user
   * This function retrieves all reviews associated with the user's bookings
   */
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      // Use provided fetch function or default to getMyReviews
      const response = await (fetchFunction ? fetchFunction() : reviewsApi.getMyReviews())
      // Handle both paginated and non-paginated responses
      const rawReviews = Array.isArray(response) ? response : (response.results || [])
      
      // Transform image data to extract URLs for display
      const userReviews: Review[] = rawReviews.map((review: any) => ({
        ...review,
        images: review.images?.map((img: any) => 
          typeof img === 'string' ? img : (img.image_url || img.image)
        ) || []
      }))
      
      setReviews(userReviews)
      setError(null)
    } catch (err) {
      setError("Failed to fetch reviews")
      console.error("Error fetching reviews:", err)
      // Set empty array on error to prevent UI issues
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [fetchFunction])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return { reviews, loading, error, refetch: fetchReviews }
}