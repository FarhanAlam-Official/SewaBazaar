"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { showToast } from "@/components/ui/enhanced-toast"
import { reviewsApi } from "@/services/api"

interface ReviewFormProps {
  providerId: number
  onSuccess: () => void
  onCancel: () => void
}

export function ReviewForm({ providerId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [eligibilityMessage, setEligibilityMessage] = useState('')

  // Check if user can review this provider
  React.useEffect(() => {
    const checkEligibility = async () => {
      try {
        const eligibility = await reviewsApi.checkReviewEligibility(providerId)
        setCanReview(eligibility.can_review)
        setEligibilityMessage(eligibility.reason || '')
        setEligibilityChecked(true)
      } catch (error: any) {
        console.error('Error checking review eligibility:', error)
        setCanReview(false)
        setEligibilityMessage('Unable to verify review eligibility. Please try again later.')
        setEligibilityChecked(true)
      }
    }

    checkEligibility()
  }, [providerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canReview) {
      showToast.error({
        title: "Cannot Submit Review",
        description: eligibilityMessage,
        duration: 5000
      })
      return
    }

    if (rating === 0) {
      showToast.error({
        title: "Rating Required",
        description: "Please select a rating before submitting your review.",
        duration: 3000
      })
      return
    }

    if (comment.trim().length < 10) {
      showToast.error({
        title: "Comment Too Short",
        description: "Please write at least 10 characters in your review comment.",
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)
    try {
      await reviewsApi.createProviderReview(providerId, {
        rating,
        comment: comment.trim()
      })

      showToast.success({
        title: "Review Submitted",
        description: "Thank you for your feedback! Your review has been posted.",
        duration: 5000
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      showToast.error({
        title: "Review Failed",
        description: error.response?.data?.message || error.message || "Failed to submit review. Please try again.",
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!eligibilityChecked) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking review eligibility...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!canReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to Write Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {eligibilityMessage}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You can only review service providers after completing a booking with them.
          </p>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            Close
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write Your Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Rate this service provider
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Share your experience
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this service provider..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters ({comment.length}/10)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}