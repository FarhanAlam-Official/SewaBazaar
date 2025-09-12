import { useState, useEffect } from "react"
import { reviewsApi } from "@/services/api"
import { Review } from "@/types"

/**
 * Custom hook to fetch user reviews from the API
 * This hook retrieves all reviews associated with the current user's bookings
 * 
 * @returns Object containing:
 * - reviews: Array of Review objects
 * - loading: Boolean indicating if data is being fetched
 * - error: String containing error message if fetch failed
 */
export const useReviews = () => {
  // State to store reviews data
  const [reviews, setReviews] = useState<Review[]>([])
  // State to track loading status
  const [loading, setLoading] = useState(true)
  // State to track any errors during fetch
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    /**
     * Fetch reviews for the current user
     * This function retrieves all reviews associated with the user's bookings
     */
    const fetchReviews = async () => {
      try {
        setLoading(true)
        // Fetch reviews for the current user
        const response = await reviewsApi.getMyReviews()
        // Handle both paginated and non-paginated responses
        const userReviews: Review[] = Array.isArray(response) ? response : (response.results || [])
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
    }

    fetchReviews()
  }, [])

  return { reviews, loading, error }
}