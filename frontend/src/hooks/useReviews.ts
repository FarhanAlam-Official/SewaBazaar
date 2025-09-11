import { useState, useEffect } from "react"
import { reviewsApi } from "@/services/api"
import { Review } from "@/types"

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        // For now, we'll fetch reviews for the current user
        // In a real implementation, this would be based on the user's provider ID
        const data = await reviewsApi.getProviderReviews(1) // Placeholder provider ID
        setReviews(data.results || [])
        setError(null)
      } catch (err) {
        setError("Failed to fetch reviews")
        console.error("Error fetching reviews:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  return { reviews, loading, error }
}