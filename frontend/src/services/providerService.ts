/**
 * PHASE 2 NEW SERVICE: Provider profiles and reviews API
 * 
 * Purpose: Handle API calls for provider profiles and review system
 * Impact: New service - provides data layer for Phase 2 components
 */

import api from './api';
import type {
  ProviderProfile,
  ReviewsResponse,
  ProviderReviewsResponse,
  ReviewEligibility,
  CreateReviewRequest,
  UpdateReviewRequest,
  Review
} from '@/types/provider';

export class ProviderService {
  /**
   * Get public provider profile
   * No authentication required
   */
  static async getProviderProfile(providerId: number): Promise<ProviderProfile> {
    const response = await api.get(`/reviews/providers/${providerId}/profile/`);
    return response.data;
  }

  /**
   * Get provider reviews with pagination and filtering
   * No authentication required
   */
  static async getProviderReviews(
    providerId: number,
    params?: {
      page?: number;
      page_size?: number;
      rating?: number;
    }
  ): Promise<ReviewsResponse> {
    const response = await api.get(`/reviews/providers/${providerId}/reviews/`, {
      params
    });
    return response.data;
  }

  /**
   * Check if current user can review this provider
   * Requires authentication
   */
  static async checkReviewEligibility(
    providerId: number,
    bookingId?: number
  ): Promise<ReviewEligibility> {
    const params = bookingId ? { booking_id: bookingId } : {};
    const response = await api.get(
      `/reviews/providers/${providerId}/review-eligibility/`,
      { params }
    );
    return response.data;
  }

  /**
   * Create a review for a provider
   * Requires authentication and eligibility
   */
  static async createReview(
    providerId: number,
    reviewData: CreateReviewRequest
  ): Promise<Review> {
    const response = await api.post(
      `/reviews/providers/${providerId}/create-review/`,
      reviewData
    );
    return response.data;
  }

  /**
   * Update an existing review
   * Requires authentication and ownership
   */
  static async updateReview(
    reviewId: number,
    reviewData: UpdateReviewRequest
  ): Promise<Review> {
    const response = await api.patch(`/reviews/reviews/${reviewId}/`, reviewData);
    return response.data;
  }

  /**
   * Delete a review
   * Requires authentication and ownership
   */
  static async deleteReview(reviewId: number): Promise<void> {
    await api.delete(`/reviews/reviews/${reviewId}/`);
  }

  /**
   * Get current user's reviews
   * Requires authentication
   */
  static async getMyReviews(params?: {
    page?: number;
    page_size?: number;
  }): Promise<ReviewsResponse> {
    const response = await api.get('/reviews/reviews/my-reviews/', { params });
    return response.data;
  }

  /**
   * Get reviews for current provider
   * Requires authentication and provider role
   */
  static async getProviderReviewsWithSummary(params?: {
    page?: number;
    page_size?: number;
    rating?: number;
  }): Promise<ProviderReviewsResponse> {
    const response = await api.get('/reviews/reviews/provider-reviews/', { params });
    return response.data;
  }
}

// Utility functions for frontend use
export const providerUtils = {
  /**
   * Format rating for display
   */
  formatRating: (rating: number): string => {
    return rating.toFixed(1);
  },

  /**
   * Get star rating display
   */
  getStarRating: (rating: number): { filled: number; half: boolean; empty: number } => {
    const filled = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - filled - (half ? 1 : 0);
    
    return { filled, half, empty };
  },

  /**
   * Format experience years
   */
  formatExperience: (years: number): string => {
    if (years === 0) return 'New provider';
    if (years === 1) return '1 year experience';
    return `${years} years experience`;
  },

  /**
   * Get rating color class
   */
  getRatingColor: (rating: number): string => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  },

  /**
   * Format review date
   */
  formatReviewDate: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  },

  /**
   * Truncate text with ellipsis
   */
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  /**
   * Get certification display
   */
  formatCertifications: (certifications: string[]): string => {
    if (certifications.length === 0) return 'No certifications';
    if (certifications.length === 1) return certifications[0];
    if (certifications.length <= 3) return certifications.join(', ');
    return `${certifications.slice(0, 2).join(', ')} and ${certifications.length - 2} more`;
  }
};