// Enhanced TypeScript interfaces for redesigned service detail page
// Supporting modern pricing tiers, enhanced reviews, and comprehensive service data

export interface ServicePackageTier {
  id: string
  name: string
  title: string
  price: number
  original_price?: number
  currency: string
  description: string
  features: string[]
  delivery_time: string
  revisions: number | 'unlimited'
  is_popular?: boolean
  is_custom?: boolean
  extras?: ServiceExtra[]
}

export interface ServiceExtra {
  id: string
  title: string
  description: string
  price: number
  delivery_time_addition: string
}

export interface ServicePortfolioItem {
  id: string
  title: string
  description: string
  image: string
  completion_date: string
  technologies?: string[]
  client_feedback?: string
  project_url?: string
  category: string
}

export interface ServiceBenefit {
  id: string
  title: string
  description: string
  icon: string
  category: 'value' | 'quality' | 'convenience' | 'support'
}

export interface ServiceUseCase {
  id: string
  title: string
  description: string
  scenario: string
  ideal_for: string[]
  example?: string
}

export interface ServiceFAQ {
  id: string
  question: string
  answer: string
  category: string
  priority: number
}

export interface ProviderCredential {
  id: string
  name: string
  issuer: string
  date_obtained: string
  expiry_date?: string
  verification_url?: string
  credential_type: 'certification' | 'license' | 'award' | 'education'
}

export interface ProviderProfile {
  id: number
  bio: string
  experience_years: number
  specializations: string[]
  certifications: string[]
  credentials: ProviderCredential[]
  portfolio: ServicePortfolioItem[]
  avg_rating: number
  reviews_count: number
  response_time: string
  is_verified: boolean
  profile_image: string
  cover_image?: string
  languages: string[]
  working_hours: {
    timezone: string
    availability: {
      [key: string]: { start: string; end: string; available: boolean }
    }
  }
  completed_projects: number
  repeat_clients_percentage: number
  on_time_delivery_rate: number
}

export interface EnhancedServiceDetail {
  // Basic service information
  id: number
  title: string
  slug: string
  tagline?: string
  description: string
  short_description: string
  
  // Pricing and packages
  pricing_type: 'fixed' | 'package' | 'custom' | 'hourly'
  packages: ServicePackageTier[]
  starting_price?: number
  currency: string
  
  // Service details
  duration: string
  category: {
    id: number
    title: string
    slug: string
    icon?: string
  }
  subcategory?: {
    id: number
    title: string
    slug: string
  }
  
  // Enhanced descriptions
  features: string[]
  benefits: ServiceBenefit[]
  use_cases: ServiceUseCase[]
  includes: string[]
  excludes: string[]
  requirements?: string[]
  process_steps?: string[]
  
  // Provider information
  provider: {
    id: number
    name: string
    email: string
    phone?: string
    profile: ProviderProfile
  }
  
  // Location and service area
  cities: Array<{
    id: number
    name: string
    region?: string
  }>
  service_location_type: 'remote' | 'on_site' | 'hybrid'
  travel_radius?: number
  
  // Media and portfolio
  hero_image?: string
  gallery_images: Array<{
    id: number
    image: string
    caption?: string
    alt_text?: string
    is_hero?: boolean
    order: number
  }>
  video_url?: string
  demo_url?: string
  
  // Social proof and ratings
  average_rating: number
  reviews_count: number
  total_orders: number
  completion_rate: number
  repeat_customer_rate: number
  
  // Tags and SEO
  tags: string[]
  meta_title?: string
  meta_description?: string
  keywords?: string[]
  
  // Service policies
  is_verified_provider: boolean
  response_time: string
  cancellation_policy: string
  refund_policy?: string
  modification_policy?: string
  
  // Enhanced features
  instant_delivery_available: boolean
  rush_order_available: boolean
  custom_orders_accepted: boolean
  samples_available: boolean
  consultation_available: boolean
  
  // FAQ and support
  faqs: ServiceFAQ[]
  support_included: boolean
  warranty_period?: string
  
  // Analytics and engagement
  view_count: number
  inquiry_count: number
  save_count: number
  last_activity: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // User interaction states
  is_favorited?: boolean
  can_book?: boolean
  is_available?: boolean
}

export interface DetailedReview {
  id: number
  user: {
    id: number
    name: string
    avatar?: string
    verified_buyer: boolean
    review_count: number
    member_since: string
  }
  service_id: number
  booking_id?: number
  
  // Core review data
  overall_rating: number
  quality_rating: number
  value_rating: number
  communication_rating: number
  punctuality_rating: number
  
  // Review content
  title?: string
  comment: string
  pros?: string[]
  cons?: string[]
  
  // Media attachments
  images?: Array<{
    id: number
    url: string
    caption?: string
  }>
  
  // Review metadata
  is_verified_booking: boolean
  is_featured: boolean
  helpful_count: number
  unhelpful_count: number
  provider_response?: {
    message: string
    date: string
  }
  
  // Project details (optional)
  project_category?: string
  project_budget_range?: string
  project_duration?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface ReviewSummary {
  average_rating: number
  total_reviews: number
  rating_distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  category_averages: {
    quality: number
    value: number
    communication: number
    punctuality: number
  }
  recent_trend: 'improving' | 'stable' | 'declining'
  verified_reviews_percentage: number
}

export interface BookingSlot {
  id: string
  service?: number
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  max_bookings: number
  current_bookings: number
  is_fully_booked?: boolean
  is_rush?: boolean
  rush_fee_percentage?: number
  slot_type?: 'normal' | 'express' | 'urgent' | 'emergency'
  provider_note?: string
  base_price_override?: number
  calculated_price?: number
  rush_fee_amount?: number
  created_at?: string
  
  // Legacy fields for backward compatibility
  price?: number
}

export interface ServiceAnalytics {
  views_last_30_days: number
  inquiries_last_30_days: number
  conversion_rate: number
  average_response_time: string
  popularity_rank: number
  similar_services_comparison: {
    price_percentile: number
    rating_percentile: number
    popularity_percentile: number
  }
}

// Form interfaces for booking and interaction - aligned with backend Booking model
export interface BookingFormData {
  service_id: number
  preferred_date?: string
  preferred_time?: string
  special_instructions?: string
  
  // Required backend Booking model fields
  address?: string
  city?: string
  phone?: string
  
  // Express booking fields
  is_express?: boolean
  express_type?: 'standard' | 'urgent' | 'emergency'
}

export interface ReviewFormData {
  service_id: number
  overall_rating: number
  quality_rating: number
  value_rating: number
  communication_rating: number
  punctuality_rating: number
  title?: string
  comment: string
  pros?: string[]
  cons?: string[]
  project_category?: string
  project_budget_range?: string
  would_recommend: boolean
}

// Component props interfaces
export interface ServiceHeroProps {
  service: EnhancedServiceDetail
  onImageGalleryOpen: () => void
  onVideoPlay?: () => void
  onFavoriteToggle: () => void
  isFavorited: boolean
}

export interface ServicePricingProps {
  packages: ServicePackageTier[]
  pricing_type: EnhancedServiceDetail['pricing_type']
  onPackageSelect: (packageId: string) => void
  selectedPackage?: string
  currency: string
}

export interface ServiceReviewsProps {
  reviews: DetailedReview[]
  summary: ReviewSummary
  onReviewSubmit: (data: ReviewFormData) => void
  canReview: boolean
  isLoading: boolean
}

export interface ProviderInfoProps {
  provider: EnhancedServiceDetail['provider']
  service: Pick<EnhancedServiceDetail, 'id' | 'title' | 'average_rating' | 'reviews_count'>
  onMessageProvider: () => void
  onViewPortfolio: () => void
}

export interface ServiceBookingProps {
  service: EnhancedServiceDetail
  availableSlots: BookingSlot[]
  onSlotSelect: (slot: BookingSlot) => void
  onBookingSubmit: (data: BookingFormData) => void
  selectedSlot?: BookingSlot
  isLoading: boolean
}