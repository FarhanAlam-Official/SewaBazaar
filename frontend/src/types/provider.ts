/**
 * PHASE 2 NEW TYPES: Provider profiles and reviews
 * 
 * Purpose: Type definitions for public provider profiles and review system
 * Impact: New types - support Phase 2 frontend components
 */

export interface PortfolioMedia {
  id: number;
  media_type: 'image' | 'video';
  file_url: string;
  title?: string;
  description?: string;
  order: number;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CustomerSummary {
  id: number;
  display_name: string;
}

export interface ProviderSummary {
  id: number;
  display_name: string;
  profile_picture?: string;
  is_verified: boolean;
}

export interface Review {
  id: number;
  customer: CustomerSummary;
  provider: ProviderSummary;
  rating: number;
  comment: string;
  service_title: string;
  booking_date: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface ProviderProfile {
  // Basic info
  display_name: string;
  bio?: string;
  profile_picture?: string;
  location_city?: string;
  years_of_experience: number;
  certifications: string[];
  is_verified: boolean;
  
  // Portfolio
  portfolio_media: PortfolioMedia[];
  service_categories: string[];
  
  // Statistics
  rating_summary: RatingSummary;
  recent_reviews: Review[];
  total_services: number;
  total_bookings: number;
  
  // Metadata
  created_at: string;
}

export interface EligibleBooking {
  id: number;
  service__title: string;
  booking_date: string;
  booking_time: string;
  total_amount: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason: string;
  eligible_bookings?: EligibleBooking[];
  booking?: EligibleBooking;
}

export interface CreateReviewRequest {
  booking_id: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment: string;
}

export interface ReviewsResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Review[];
}

export interface ProviderReviewsResponse extends ReviewsResponse {
  rating_summary?: RatingSummary;
}